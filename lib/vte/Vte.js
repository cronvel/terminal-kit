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
	
	this.eventInput = options.eventInput ;

	this.childSequencesReader = new SequencesReader() ;

	this.onEventInputKey = this.onEventInputKey.bind( this ) ;
	this.onChildOutputChar = this.onChildOutputChar.bind( this ) ;
	this.onChildOutputControl = this.onChildOutputControl.bind( this ) ;
	this.onChildOutputCsi = this.onChildOutputCsi.bind( this ) ;
	
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
	this.childSequencesReader.on( 'control' , this.onChildOutputControl ) ;
	this.childSequencesReader.on( 'csi' , this.onChildOutputCsi ) ;
} ;



Vte.prototype.draw = function() {
	var stats = this.screenBuffer.draw( { delta: true } ) ;
	console.error( 'draw stats:' , stats ) ;
} ;



Vte.prototype.drawDelay = async function() {
	//await Promise.resolveTimeout( 10 ) ;
	await Promise.resolveNextTick() ;
	this.draw() ;
} ;



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
	this.screenBuffer.put( { x: this.cx , y: this.cy } , char ) ;
	this.cx ++ ;

	if ( this.cx >= this.width ) {
		this.newLine() ;
	}
	else {
		this.drawDebounce() ;
	}
} ;



Vte.prototype.onChildOutputControl = function( control ) {
	switch ( control ) {
		case 'newLine' :
			return this.newLine() ;
	}
} ;



Vte.prototype.onChildOutputCsi = function( args ) {
	console.error( 'csi:' , args ) ;
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

