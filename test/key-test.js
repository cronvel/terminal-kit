#!/usr/bin/env node
/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox test suite
	
	Copyright (c) 2009 - 2014 Cédric Ronvel 
	
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

/* jshint unused:false */



var term = require( '../lib/terminal.js' ) ;



function terminate()
{
	term.brightBlack( 'About to exit...\n' ) ;
	term.grabInput( false ) ;
	term.beep() ;
	
	// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
	setTimeout( function() { process.exit() } , 100 ) ;
} 



term.bold.cyan( 'Key test, hit anything on the keyboard to see how it is detected...\n' ) ;
term.green( 'Hit CTRL-C to quit.\n\n' ) ;

term.grabInput( { mouse: 'button' , focus: true } ) ;

term.on( 'key' , function( name , matches , data ) {
	
	console.log( "'key' event:" , name , matches , Buffer.isBuffer( data.code ) ? data.code : data.code.toString( 16 ) , data.codepoint ? data.codepoint.toString( 16 ) : '' ) ;
	
	if ( matches.indexOf( 'CTRL_C' ) >= 0 )
	{
		term.green( 'CTRL-C received...\n' ) ;
		terminate() ;
	}
} ) ;

term.on( 'focus' , function( name , data ) {
	console.log( "'focus' event:" , name , data ) ;
} ) ;

term.on( 'mouse' , function( name , data ) {
	console.log( "'mouse' event:" , name , data ) ;
} ) ;

term.on( 'unknown' , function( buffer ) {
	console.log( "'unknown' event, buffer:" , buffer ) ;
} ) ;



//setTimeout( terminate , 20000 ) ;


