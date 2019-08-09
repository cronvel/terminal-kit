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
const NextGenEvents = require( 'nextgen-events' ) ;
const toInputSequence = require( './toInputSequence.js' ) ;
const SequencesReader = require( './SequencesReader.js' ) ;

const spawn = require( 'child_process' ).spawn ;



/*
	options:
		* width: buffer width (default to dst.width)
		* height: buffer height (default to dst.height)
		* dst: writting destination
		* palette: Palette instance
		* inputTerm: optional, a terminal used as input source
		* + any ScreenBuffer options

	Properties:
		* childStdin: the stdin stream for the child, that will be used for its keyboard/mouse event
		* childStdout: the stdout stream for the child, that will be displayed on the terminal
*/
function Vte( options = {} ) {
	this.width = Math.floor( options.width ) || ( options.dst ? options.dst.width : 80 ) ;
	this.height = Math.floor( options.height ) || ( options.dst ? options.dst.height : 24 ) ;
	this.palette = options.palette || ( this.dst && this.dst.palette ) ;

	this.screenBuffer = new ScreenBuffer( Object.assign( {} , options , this , { wrap: true } ) ) ;

	// To avoid mistake, cx/cy are starting at 0, like the internal screenbuffer does?
	this.cx = 0 ;
	this.cy = 0 ;
	
	this.inputTerm = options.inputTerm ;

	this.onInputTermKey = this.onInputTermKey.bind( this ) ;
	this.onChildOutputChar = this.onChildOutputChar.bind( this ) ;
	this.onChildOutputControl = this.onChildOutputControl.bind( this ) ;

	this.childSequencesReader = new SequencesReader() ;
}

module.exports = Vte ;

Vte.prototype = Object.create( NextGenEvents.prototype ) ;
Vte.prototype.constructor = Vte ;



// Run a child process
Vte.prototype.run = function( command , args ) {
	this.start() ;
	var child = spawn( command , args ) ;

	this.on( 'input' , data => child.stdin.write( data ) ) ;
	this.childSequencesReader.streamToEvent( child.stdout ) ;

	//child.stdout.on( 'data' , this.onChildOutput ) ;
	//child.stderr.on( 'data' , this.onChildOutput ) ;

	// Tmp, to close the app during alpha phase
	child.on( 'close' , code => {
		process.stdout.write( '\n' ) ;
		process.exit( code ) ;
	} ) ;
} ;



Vte.prototype.start = function() {
	if ( this.inputTerm ) {
		this.inputTerm.grabInput( { mouse: 'motion' , focus: true } ) ;
		this.inputTerm.on( 'key' , this.onInputTermKey ) ;
	}

	this.childSequencesReader.on( 'char' , this.onChildOutputChar ) ;
	this.childSequencesReader.on( 'control' , this.onChildOutputControl ) ;
} ;



Vte.prototype.draw = function() {
	this.screenBuffer.draw( { delta: true } ) ;
} ;



Vte.prototype.onInputTermKey = function( key , altKeys , data ) {
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
		this.draw() ;
	}
} ;



Vte.prototype.onChildOutputControl = function( control ) {
	switch ( control ) {
		case 'newLine' :
			return this.newLine() ;
	}
} ;



Vte.prototype.newLine = function( noDraw ) {
	this.cy ++ ;
	this.cx = 0 ;

	if ( this.cy >= this.height ) {
		// Scroll up!
		// Always draw to terminal because we use the terminal scrolling region capability
		this.cy = this.height -1 ;
		this.screenBuffer.vScroll( -1 , true ) ;
	}
	
	if ( ! noDraw ) { this.draw() ; }
} ;

