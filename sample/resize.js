#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2022 Cédric Ronvel

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



//process.stdout.on( 'resize' , () => { console.log( "process.stdout 'resize'" ) ; } ) ;
//process.on( 'SIGWINCH' , () => { console.log( "process 'SIGWINCH'" ) ; } ) ;
//setTimeout( () => console.log( 'exit' ) , 10000 ) ;
//return ;


var term = require( '..' ).terminal ;
//require( '../lib/termkit.js' ).getDetectedTerminal( ( error , term ) => {

term.stdout.on( 'resize' , () => {
	console.log( "term.stdout 'resize'" ) ;
} ) ;


function terminate()
{
	term.brightBlack( 'About to exit...\n' ) ;
	term.grabInput( false ) ;
	term.fullscreen( false ) ;
	
	// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
	setTimeout( function() { process.exit() ; } , 100 ) ;
} 

term.fullscreen( true ) ;
term.bold.cyan( 'Resize test, try resizing your terminal...\n' ) ;

term.grabInput( { mouse: 'button' , focus: true } ) ;

term.on( 'key' , ( name , matches , data ) => {
	
	if ( matches.indexOf( 'CTRL_C' ) >= 0 )
	{
		term.green( 'CTRL-C received...\n' ) ;
		terminate() ;
	}
	
	if ( matches.indexOf( 'CTRL_R' ) >= 0 )
	{
		term.green( 'CTRL-R received... asking terminal some information...\n' ) ;
		term.requestCursorLocation() ;
		term.requestScreenSize() ;
	}
} ) ;

term.on( 'resize' , ( width , height ) => {
	console.log( "'resize' event, new width and height:" , width , height ) ;
} ) ;

//} ) ;

