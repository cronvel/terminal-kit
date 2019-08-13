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
const Rect = require( '../Rect.js' ) ;
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

	this.scrollingRegion = null ;
	
	this.tabWidth = 8 ;

	this.eventInput = options.eventInput ;

	this.childSequencesReader = new SequencesReader() ;

	this.onEventInputKey = this.onEventInputKey.bind( this ) ;

	this.onChildOutputReset = this.onChildOutputReset.bind( this ) ;
	this.onChildOutputChar = this.onChildOutputChar.bind( this ) ;
	this.onChildOutputCursor = this.onChildOutputCursor.bind( this ) ;
	this.onChildOutputEdit = this.onChildOutputEdit.bind( this ) ;
	this.onChildOutputAttr = this.onChildOutputAttr.bind( this ) ;
	this.onChildOutputPalette = this.onChildOutputPalette.bind( this ) ;
	this.onChildOutputCursorAttr = this.onChildOutputCursorAttr.bind( this ) ;
	this.onChildOutputBell = this.onChildOutputBell.bind( this ) ;
	this.onChildOutputSystem = this.onChildOutputSystem.bind( this ) ;

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
			rows: this.height
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

	this.childSequencesReader.on( 'reset' , this.onChildOutputReset ) ;
	this.childSequencesReader.on( 'char' , this.onChildOutputChar ) ;
	this.childSequencesReader.on( 'cursor' , this.onChildOutputCursor ) ;
	this.childSequencesReader.on( 'edit' , this.onChildOutputEdit ) ;
	this.childSequencesReader.on( 'attr' , this.onChildOutputAttr ) ;
	this.childSequencesReader.on( 'palette' , this.onChildOutputPalette ) ;
	this.childSequencesReader.on( 'cursorAttr' , this.onChildOutputCursorAttr ) ;
	this.childSequencesReader.on( 'bell' , this.onChildOutputBell ) ;
	this.childSequencesReader.on( 'system' , this.onChildOutputSystem ) ;

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



Vte.prototype.putChar = function( char ) {
	console.error( 'putChar:' , char.charCodeAt(0) <= 0x1f || char.charCodeAt(0) === 0x7f ? '(ctrl)' : char , 'at:' , this.cx , this.cy ) ;
	this.screenBuffer.put( { x: this.cx , y: this.cy , attr: this.attr } , char ) ;
	this.cx ++ ;

	if ( this.cx >= this.width ) {
		this.newLine() ;
	}
	else {
		this.drawDebounce() ;
	}
} ;



// internal = don't adjust
Vte.prototype.moveCursorTo = function( x , y , internal = false ) {
	if ( internal ) {
		if ( x !== undefined ) { this.cx = x ; }
		if ( y !== undefined ) { this.cy = y ; }
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



// Next horizontal tab
Vte.prototype.nextTab = function() {
	this.moveCursorTo( Math.ceil( ( this.cx + 1 ) / this.tabWidth ) * this.tabWidth , undefined , true ) ;
} ;



Vte.prototype.vScroll = function( lineOffset , noDraw ) {
	var ymin = 0 ,
		ymax = this.height - 1 ;
	
	if ( this.scrollingRegion && this.cy >= this.scrollingRegion.ymin && this.cy <= this.scrollingRegion.ymax ) {
		( { ymin , ymax } = this.scrollingRegion ) ;
	}
	
	console.error( '################### vScroll:' , lineOffset , ymin , ymax  ) ;
	this.screenBuffer.vScroll( lineOffset , undefined , ymin , ymax , true ) ;

	if ( ! noDraw ) { this.drawDebounce() ; }
} ;



Vte.prototype.newLine = function( noDraw ) {
	var ymin = 0 ,
		ymax = this.height - 1 ;
	
	if ( this.scrollingRegion && this.cy >= this.scrollingRegion.ymin && this.cy <= this.scrollingRegion.ymax ) {
		( { ymin , ymax } = this.scrollingRegion ) ;
	}
	
	this.cy ++ ;
	this.cx = 0 ;

	if ( this.cy > ymax ) {
		// Scroll up!
		// This will immediately scroll the underlying terminal using the scrolling region capability
		this.cy = ymax ;
		this.vScroll( -1 , noDraw ) ;
	}
	else if ( ! noDraw ) {
		this.drawDebounce() ;
	}
} ;



Vte.prototype.reverseLineFeed = function( noDraw ) {
	var ymin = 0 ,
		ymax = this.height - 1 ;
	
	if ( this.scrollingRegion && this.cy >= this.scrollingRegion.ymin && this.cy <= this.scrollingRegion.ymax ) {
		( { ymin , ymax } = this.scrollingRegion ) ;
	}
	
	this.cy -- ;

	if ( this.cy < ymin ) {
		// Scroll down!
		// This will immediately scroll the underlying terminal using the scrolling region capability
		this.cy = ymin ;
		this.vScroll( 1 , noDraw ) ;
	}
	else if ( ! noDraw ) {
		this.drawDebounce() ;
	}
} ;



Vte.prototype.eraseLine = function( mode , noDraw ) {
	if ( mode === 'after' ) {
		this.screenBuffer.fill( {
			region: { xmin: this.cx , xmax: this.width - 1 , ymin: this.cy , ymax: this.cy } ,
			attr: this.attr
		} ) ;
	}
	else if ( mode === 'before' ) {
		this.screenBuffer.fill( {
			region: { xmin: 0 , xmax: this.cx , ymin: this.cy , ymax: this.cy } ,
			attr: this.attr
		} ) ;
	}
	else {
		this.screenBuffer.fill( {
			region: { xmin: 0 , xmax: this.width - 1 , ymin: this.cy , ymax: this.cy } ,
			attr: this.attr
		} ) ;
	}

	if ( ! noDraw ) { this.drawDebounce() ; }
} ;



Vte.prototype.eraseDisplay = function( mode , noDraw ) {
	if ( mode === 'after' ) {
		// First, erase the current line from the cursor
		this.screenBuffer.fill( {
			region: { xmin: this.cx , xmax: this.width - 1 , ymin: this.cy , ymax: this.cy } ,
			attr: this.attr
		} ) ;
		// Then, erase all lines below the current line
		this.screenBuffer.fill( {
			region: { xmin: 0 , xmax: this.width - 1 , ymin: this.cy + 1 , ymax: this.height - 1 } ,
			attr: this.attr
		} ) ;
	}
	else if ( mode === 'before' ) {
		// First, erase all lines above the current line
		this.screenBuffer.fill( {
			region: { xmin: 0 , xmax: this.width - 1 , ymin: 0 , ymax: this.cy - 1 } ,
			attr: this.attr
		} ) ;
		// Then, erase the current line up to the cursor
		this.screenBuffer.fill( {
			region: { xmin: 0 , xmax: this.cx , ymin: this.cy , ymax: this.cy } ,
			attr: this.attr
		} ) ;
	}
	else {
		this.screenBuffer.fill( { attr: this.attr } ) ;
	}

	if ( ! noDraw ) { this.drawDebounce() ; }
} ;



// /!\ Does it delete last char of previous line when at the begin of a line?
Vte.prototype.backDelete = function() {
	if ( ! this.cx ) { return ; }
	
	this.cx -- ;
	this.screenBuffer.put( { x: this.cx , y: this.cy , attr: this.attr } , ' ' ) ;
	this.screenBuffer.cx = this.cx ;
	this.screenBuffer.cy = this.cy ;
	this.drawDebounce() ;
	this.screenBuffer.drawCursor() ;
} ;



// /!\ Does it move end of line one char back?
Vte.prototype.delete = function() {
	this.screenBuffer.put( { x: this.cx , y: this.cy , attr: this.attr } , ' ' ) ;
	this.screenBuffer.cx = this.cx ;
	this.screenBuffer.cy = this.cy ;
	this.drawDebounce() ;
	this.screenBuffer.drawCursor() ;
} ;



Vte.prototype.resetAttr = function() { this.attr = this.screenBuffer.DEFAULT_ATTR ; } ;
Vte.prototype.setAttr = function( attrObject ) { this.attr = this.screenBuffer.object2attr( attrObject ) ; } ;
Vte.prototype.addAttr = function( attrObject ) { this.attr = this.screenBuffer.attrAndObject( this.attr , attrObject ) ; } ;



Vte.prototype.setVScrollingRegion = function( ymin = null , ymax = null , internal = false ) {
	console.error( "########################### setVScrollingRegion:" , ymin , ymax , internal ) ;
	if ( ymin === null || ymax === null ) {
		this.scrollingRegion = null ;
	}
	else if ( internal ) {
		this.scrollingRegion = new Rect( 0 , Math.max( 0 , ymin ) , this.width - 1 , Math.min( this.height - 1 , ymax ) ) ;
	}
	else {
		this.scrollingRegion = new Rect( 0 , Math.max( 0 , ymin - 1 ) , this.width - 1 , Math.min( this.height - 1 , ymax - 1 ) ) ;
	}
	console.error( "########################### setVScrollingRegion region:" , this.scrollingRegion ) ;
} ;



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



Vte.prototype.onChildOutputReset = function() {
	console.error( 'full reset' ) ;
} ;



Vte.prototype.onChildOutputChar = function( char , charCode ) {
	//console.error( '>>> put char charCode:' , charCode ) ;
	//console.error( 'put char:' , charCode <= 0x1f || charCode === 0x7f ? '(ctrl)' : char , charCode >= 0x10 ? '\\x' + charCode.toString( 16 ) : '\\x0' + charCode.toString( 16 ) ) ;
	this.putChar( char ) ;
} ;



Vte.prototype.onChildOutputCursor = function( subType , arg , extraArgs ) {
	console.error( 'cursor:' , subType , arg , extraArgs ) ;
	
	var arg1 = extraArgs && extraArgs[ 0 ] ? + extraArgs[ 0 ] : undefined ;
	var arg2 = extraArgs && extraArgs[ 1 ] ? + extraArgs[ 1 ] : undefined ;

	switch ( subType ) {
		case 'newLine' :
			return this.newLine() ;
		case 'carriageReturn' :
			return this.moveCursorTo( 0 , undefined , true ) ;
		case 'tab' :
			return this.nextTab() ;
		case 'move' :
			// unused
			this.moveCursor( arg1 , arg2 ) ;
			break ;
		case 'up' :
			this.moveCursor( 0 , -arg1 ) ;
			break ;
		case 'down' :
			this.moveCursor( 0 , arg1 ) ;
			break ;
		case 'right' :
			this.moveCursor( arg1 , 0 ) ;
			break ;
		case 'left' :
			this.moveCursor( -arg1 , 0 ) ;
			break ;
		case 'moveToYX' :
			// Swap the args
			this.moveCursorTo( arg2 , arg1 ) ;
			break ;
		case 'column' :
			this.moveCursorTo( arg1 ) ;
			break ;
		case 'row' :
			this.moveCursorTo( undefined , arg1 ) ;
			break ;
		case 'previousLine' :
			this.moveCursor( -this.cx , -arg1 ) ;
			break ;
		case 'nextLine' :
			this.moveCursor( -this.cx , arg1 ) ;
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



Vte.prototype.onChildOutputEdit = function( subType , arg , extraArgs ) {
	var arg1 = extraArgs && extraArgs[ 0 ] ? + extraArgs[ 0 ] : undefined ;
	var arg2 = extraArgs && extraArgs[ 1 ] ? + extraArgs[ 1 ] : undefined ;

	switch ( subType ) {
		case 'backDelete' :
			return this.backDelete() ;
		case 'delete' :
			return this.delete() ;
		case 'eraseLine' :
			console.error( 'eraseLine' , arg ) ;
			this.eraseLine( arg ) ;
			break ;
		case 'eraseDisplay' :
			console.error( 'eraseDisplay' , arg ) ;
			this.eraseDisplay( arg ) ;
			break ;
		case 'reverseLineFeed' :
			console.error( 'reverseLineFeed' ) ;
			this.reverseLineFeed( arg ) ;
			break ;
		case 'vScrollingRegion' :
			console.error( 'vScrollingRegion' , arg1 , arg2 ) ;
			this.setVScrollingRegion( arg1 , arg2 ) ;
			//this.setVScrollingRegion( arg1 , arg2 , true ) ;
			break ;
		case 'vScrollUp' :
			console.error( 'vScrollUp' , arg1 ) ;
			this.vScroll( - arg1 ) ;
			break ;
		case 'vScrollDown' :
			console.error( 'vScrollDown' , arg1 ) ;
			this.vScroll( arg1 ) ;
			break ;
		default :
			console.error( 'Unknown/unsupported edit action' , subType , arg , extraArgs ) ;
	}
} ;



Vte.prototype.onChildOutputAttr = function( subType , arg , extraArgs ) {
	switch ( subType ) {
		case 'reset' :
			console.error( 'ATTR reset' ) ;
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
			console.error( 'Unknown/unsupported ATTR' , subType , arg , extraArgs ) ;
	}
} ;



Vte.prototype.onChildOutputPalette = function( subType , arg , extraArgs ) {
	console.error( 'Palette command:' , subType , arg , extraArgs ) ;
} ;



Vte.prototype.onChildOutputCursorAttr = function( subType , args ) {
	console.error( 'Cursor ATTR command:' , subType , args ) ;
} ;



Vte.prototype.onChildOutputBell = function() {
	console.error( 'bell' ) ;
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

