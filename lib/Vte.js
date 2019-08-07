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



const termkit = require( './termkit.js' ) ;
const ScreenBuffer = require( './ScreenBuffer.js' ) ;
const NextGenEvents = require( 'nextgen-events' ) ;

const spawn = require( 'child_process' ).spawn ;



/*
	options:
		* width: buffer width (default to dst.width)
		* height: buffer height (default to dst.height)
		* dst: writting destination
		* palette: Palette instance
		* inputTest: optional, an input stream to pass to the child (usually a terminal app should produce its own input)
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
	
	//this.cx = 1 ;
	//this.cy = 1 ;
	this.inputTest = options.inputTest ;
}

module.exports = Vte ;

Vte.prototype = Object.create( NextGenEvents.prototype ) ;
Vte.prototype.constructor = Vte ;



// Run a child process
Vte.prototype.run = function( command , args ) {
	var child = spawn( command , args ) ;

	if ( this.inputTest ) {
		this.inputTest.on( 'data' , data => child.stdin.write( data ) ) ;
	}
	
	child.stdout.on( 'data' , data => this.onChildOutput( data ) ) ;
	child.stderr.on( 'data' , data => this.onChildOutput( data ) ) ;

	// Tmp, to close the app during alpha phase
	child.on( 'close', code => {
		process.stdout.write( '\n' ) ;
		process.exit( code ) ;
	} ) ;
} ;



Vte.prototype.onChildOutput = function( data ) {
	this.screenBuffer.put( { wrap: true } , data.toString() ) ;
	this.screenBuffer.draw( { delta: true } ) ;
} ;

