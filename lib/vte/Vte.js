/*
	Terminal Kit

	Copyright (c) 2009 - 2019 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



const termkit = require( '../termkit.js' ) ;
const ScreenBuffer = require( '../ScreenBuffer.js' ) ;
const toInputSequence = require( './toInputSequence.js' ) ;
const SequencesReader = require( './SequencesReader.js' ) ;

const NextGenEvents = require( 'nextgen-events' ) ;
const Promise = require( 'seventh' ) ;

const spawn = require( 'child_process' ).spawn ;



/*
	options:
		* width: buffer width (default to dst.width)
		* height: buffer height (default to dst.height)
		* dst: writting destination
		* palette: Palette instance
		* eventInput: optional, an event emitter used as input source, can be a Terminal instance
		* + any ScreenBuffer options

	Properties:
		* childStdin: the stdin stream for the child, that will be used for its keyboard/mouse event
		* childStdout: the stdout stream for the child, that will be displayed on the terminal
*/
function Vte( options = {} ) {
	this.width = Math.floor( options.width ) || ( options.dst ? options.dst.width : 80 ) ;
	this.height = Math.floor( options.height ) || ( options.dst ? options.dst.height : 25 ) ;
	this.palette = options.palette || ( this.dst && this.dst.palette ) ;

	this.screenBuffer = new ScreenBuffer( Object.assign( {} , options , this , { wrap: true } ) ) ;

	// To avoid mistake, cx/cy are starting at 0, like the internal screenBuffer does?
	this.cx = 0 ;
	this.cy = 0 ;
	this.savedCx = 0 ;
	this.savedCy = 0 ;
	
	this.attr = 0 ;
	this.resetAttr() ;
	
	this.eventInput = options.eventInput ;

	this.childSequencesReader = new SequencesReader() ;

	this.onEventInputKey = this.onEventInputKey.bind( this ) ;

	this.onChildOutputChar = this.onChildOutputChar.bind( this ) ;
	this.onChildOutputControlChar = this.onChildOutputControlChar.bind( this ) ;
	this.onChildOutputAttr = this.onChildOutputAttr.bind( this ) ;
	this.onChildOutputCursor = this.onChildOutputCursor.bind( this ) ;
	this.onChildOutputEdit = this.onChildOutputEdit.bind( this ) ;
	this.onChildOutputSystem = this.onChildOutputSystem.bind( this ) ;
	this.onChildOutputPalette = this.onChildOutputPalette.bind( this ) ;
	this.onChildOutputCursorAttr = this.onChildOutputCursorAttr.bind( this ) ;
	
	this.onChildOutputControl = this.onChildOutputControl.bind( this ) ;
	this.onChildOutputESC = this.onChildOutputESC.bind( this ) ;
	this.onChildOutputCSI = this.onChildOutputCSI.bind( this ) ;
	this.onChildOutputOSC = this.onChildOutputOSC.bind( this ) ;
	
	// The real draw is sync, so there is no need for Promise.debounceUpdate(), Promise.debounce() avoid an extra draw with no delta
	//this.drawDebounce = Promise.debounceUpdate( this.drawDelay.bind( this ) ) ;
	this.drawDebounce = Promise.debounce( this.drawDelay.bind( this ) ) ;
}

module.exports = Vte ;

Vte.prototype = Object.create( NextGenEvents.prototype ) ;
Vte.prototype.constructor = Vte ;



// Run a child process
Vte.prototype.run = function( command , args ) {
	var childPty , child ;
	
	this.start() ;
	
	try {
		// If child_pty is present, then use it instead of spawn
		// So programs launched would think they truly run inside a TTY
		childPty = require( 'child_pty' ) ;
		child = childPty.spawn( command , args , {
			columns: this.width ,
			rows: this.height ,
			//stdio: [ 'pty' , 'pty' , 'pty' ]
		} ) ;
	}
	catch ( error ) {
		console.error( "'child_pty' optional dependency not found, using regular child_process.spawn()" ) ;
		child = spawn( command , args ) ;
	}

	//this.on( 'input' , data => { console.error( 'stdin:' , data ) ; child.stdin.write( data ) ; } ) ;
	this.on( 'input' , data => child.stdin.write( data ) ) ;
	this.childSequencesReader.streamToEvent( child.stdout ) ;

	//child.stdout.on( 'data' , this.onChildOutput ) ;
	//child.stderr.on( 'data' , this.onChildOutput ) ;

	// Tmp, to close the app during alpha phase
	child.on( 'close' , code => {
		Promise.resolveTimeout( 100 ).then( () => {
			process.stdout.write( '\n' ) ;
			process.exit( code ) ;
		} ) ;
	} ) ;
} ;



Vte.prototype.start = function() {
	if ( this.eventInput ) {
		this.eventInput.on( 'key' , this.onEventInputKey ) ;
	}

	this.childSequencesReader.on( 'char' , this.onChildOutputChar ) ;
	this.childSequencesReader.on( 'controlChar' , this.onChildOutputControlChar ) ;
	this.childSequencesReader.on( 'attr' , this.onChildOutputAttr ) ;
	this.childSequencesReader.on( 'cursor' , this.onChildOutputCursor ) ;
	this.childSequencesReader.on( 'edit' , this.onChildOutputEdit ) ;
	this.childSequencesReader.on( 'system' , this.onChildOutputSystem ) ;
	this.childSequencesReader.on( 'palette' , this.onChildOutputPalette ) ;
	this.childSequencesReader.on( 'cursorAttr' , this.onChildOutputCursorAttr ) ;

	this.childSequencesReader.on( 'control' , this.onChildOutputControl ) ;
	this.childSequencesReader.on( 'ESC' , this.onChildOutputESC ) ;
	this.childSequencesReader.on( 'CSI' , this.onChildOutputCSI ) ;
	this.childSequencesReader.on( 'OSC' , this.onChildOutputOSC ) ;
} ;



Vte.prototype.draw = function() {
	var stats = this.screenBuffer.draw( { delta: true } ) ;
	this.screenBuffer.drawCursor() ;
	console.error( 'draw stats:' , stats ) ;
} ;



Vte.prototype.drawDelay = async function() {
	//await Promise.resolveTimeout( 10 ) ;
	await Promise.resolveNextTick() ;
	this.draw() ;
} ;



// internal = don't adjust
Vte.prototype.moveCursorTo = function( x , y , internal = false ) {
	if ( internal ) {
		this.cx = x ;
		this.cy = y ;
	}
	else {
		if ( x !== undefined ) { this.cx = x - 1 ; }
		if ( y !== undefined ) { this.cy = y - 1 ; }
	}

	if ( this.cx < 0 ) { this.cx = 0 ; }
	else if ( this.cx >= this.width - 1 ) { this.cx = this.width - 1 ; }

	if ( this.cy < 0 ) { this.cy = 0 ; }
	else if ( this.cy >= this.height - 1 ) { this.cy = this.height - 1 ; }
	
	this.screenBuffer.cx = this.cx ;
	this.screenBuffer.cy = this.cy ;
	this.screenBuffer.drawCursor() ;
} ;



// Relative move
Vte.prototype.moveCursor = function( x , y ) {
	this.moveCursorTo( this.cx + x , this.cy + y , true ) ;
} ;



Vte.prototype.newLine = function( noDraw ) {
	this.cy ++ ;
	this.cx = 0 ;

	if ( this.cy >= this.height ) {
		// Scroll up!
		// This will immediately scroll the underlying terminal using the scrolling region capability
		this.cy = this.height -1 ;
		this.screenBuffer.vScroll( -1 , true ) ;
	}
	
	if ( ! noDraw ) { this.drawDebounce() ; }
} ;



Vte.prototype.resetAttr = function() { this.attr = this.screenBuffer.DEFAULT_ATTR ; } ;
Vte.prototype.setAttr = function( attrObject ) { this.attr = this.screenBuffer.object2attr( attrObject ) ; } ;
Vte.prototype.addAttr = function( attrObject ) { this.attr = this.screenBuffer.attrAndObject( this.attr , attrObject ) ; } ;



// Event handlers



Vte.prototype.onEventInputKey = function( key , altKeys , data ) {
	console.error( 'onEventInputKey:' , key ) ;
	if ( data.isCharacter ) {
		this.emit( 'input' , key ) ;
	}
	else if ( toInputSequence.specialKeys[ key ] ) {
		this.emit( 'input' , toInputSequence.specialKeys[ key ] ) ;
	}
} ;



Vte.prototype.onChildOutputChar = function( char , charCode ) {
	//console.error( 'put char:' , char , charCode ) ;
	this.screenBuffer.put( { x: this.cx , y: this.cy , attr: this.attr } , char ) ;
	this.cx ++ ;

	if ( this.cx >= this.width ) {
		this.newLine() ;
	}
	else {
		this.drawDebounce() ;
	}
} ;



Vte.prototype.onChildOutputControlChar = function( controlChar ) {
	console.error( 'controlChar:' , controlChar ) ;
	switch ( controlChar ) {
		case 'newLine' :
			return this.newLine() ;
	}
} ;



Vte.prototype.onChildOutputAttr = function( subType , arg , extraArgs ) {
	switch ( subType ) {
		case 'styleReset' :
			console.error( 'ATTR styleReset' ) ;
			this.resetAttr() ;
			break ;
		case 'bold' :
			console.error( 'ATTR bold:' , arg ) ;
			this.addAttr( { bold: arg } ) ;
			break ;
		case 'dim' :
			console.error( 'ATTR dim:' , arg ) ;
			this.addAttr( { dim: arg } ) ;
			break ;
		case 'italic' :
			console.error( 'ATTR italic:' , arg ) ;
			this.addAttr( { italic: arg } ) ;
			break ;
		case 'underline' :
			console.error( 'ATTR underline:' , arg ) ;
			this.addAttr( { underline: arg } ) ;
			break ;
		case 'blink' :
			console.error( 'ATTR blink:' , arg ) ;
			this.addAttr( { blink: arg } ) ;
			break ;
		case 'inverse' :
			console.error( 'ATTR inverse:' , arg ) ;
			this.addAttr( { inverse: arg } ) ;
			break ;
		case 'hidden' :
			console.error( 'ATTR hidden:' , arg ) ;
			this.addAttr( { hidden: arg } ) ;
			break ;
		case 'strike' :
			console.error( 'ATTR strike:' , arg ) ;
			this.addAttr( { strike: arg } ) ;
			break ;
		case 'noDimNoBold' :
			console.error( 'ATTR noDimNoBold' ) ;
			this.addAttr( { bold: false , dim: false } ) ;
			break ;
		case 'color' :
			console.error( 'ATTR color:' , arg ) ;
			this.addAttr( { color: arg } ) ;
			break ;
		case 'color256' :
			console.error( 'ATTR color256:' , extraArgs ) ;
			this.addAttr( { color: + extraArgs[ 0 ] } ) ;
			break ;
		case 'colorRgb' :
			console.error( 'ATTR colorRgb:' , extraArgs , 'not supported ATM' ) ;
			break ;
		case 'bgColor' :
			console.error( 'ATTR bgColor:' , arg ) ;
			this.addAttr( { bgColor: arg } ) ;
			break ;
		case 'bgColor256' :
			console.error( 'ATTR bgColor256:' , extraArgs ) ;
			this.addAttr( { bgColor: + extraArgs[ 0 ] } ) ;
			break ;
		case 'bgColorRgb' :
			console.error( 'ATTR bgColorRgb:' , extraArgs , 'not supported ATM' ) ;
			break ;
		default :
			console.error( 'Unknown/unsupported ATTR' , subType , arg ) ;
	}
} ;



Vte.prototype.onChildOutputCursor = function( subType , arg , extraArgs ) {
	console.error( 'cursor:' , subType , arg , extraArgs ) ;
	
	switch ( subType ) {
		case 'move' :
			// unused
			this.moveCursor( + extraArgs[ 0 ] , + extraArgs[ 1 ] ) ;
			break ;
		case 'up' :
			this.moveCursor( 0 , - extraArgs[ 0 ] ) ;
			break ;
		case 'down' :
			this.moveCursor( 0 , + extraArgs[ 0 ] ) ;
			break ;
		case 'right' :
			this.moveCursor( + extraArgs[ 0 ] , 0 ) ;
			break ;
		case 'left' :
			this.moveCursor( - extraArgs[ 0 ] , 0 ) ;
			break ;
		case 'moveToYX' :
			// Swap the args
			this.moveCursorTo( + extraArgs[ 1 ] , + extraArgs[ 0 ] ) ;
			break ;
		case 'column' :
			this.moveCursorTo( + extraArgs[ 0 ] ) ;
			break ;
		case 'row' :
			this.moveCursorTo( undefined , + extraArgs[ 0 ] ) ;
			break ;
		case 'previousLine' :
			this.moveCursor( - this.cx , - extraArgs[ 0 ] ) ;
			break ;
		case 'nextLine' :
			this.moveCursor( - this.cx , + extraArgs[ 0 ] ) ;
			break ;
		case 'save' :
			this.savedCx = this.cx ;
			this.savedCy = this.cy ;
			break ;
		case 'restore' :
			this.moveCursorTo( this.savedCx , this.savedCy , true ) ;
			break ;
		default :
			console.error( 'Unknown/unsupported cursor action' , subType , arg , extraArgs ) ;
	}
} ;



Vte.prototype.onChildOutputEdit = function( subType , arg ) {
	switch ( subType ) {
		default :
			console.error( 'Unknown/unsupported edit action' , subType , arg ) ;
	}
} ;



Vte.prototype.onChildOutputPalette = function( subType , args ) {
	console.error( 'Palette command:' , subType , args ) ;
} ;



Vte.prototype.onChildOutputCursorAttr = function( subType , args ) {
	console.error( 'Cursor ATTR command:' , subType , args ) ;
} ;



Vte.prototype.onChildOutputSystem = function( subType , args ) {
	console.error( 'System command:' , subType , args ) ;
} ;



// Triggered when unknown/unsupported sequences are produced

Vte.prototype.onChildOutputControl = function( charCodeStr ) {
	console.error( 'control' , charCodeStr ) ;
} ;



Vte.prototype.onChildOutputESC = function( type ) {
	console.error( 'ESC -- type:' , type ) ;
} ;



Vte.prototype.onChildOutputCSI = function( type , args ) {
	console.error( 'CSI -- type:' , type , ', args:' , args ) ;
} ;



Vte.prototype.onChildOutputOSC = function( type , args ) {
	console.error( 'OSC -- type:' , type , ', args:' , args ) ;
} ;



