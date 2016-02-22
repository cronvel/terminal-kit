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

"use strict" ;



/* jshint unused:false */



//var term = require( '../lib/termkit.js' ).terminal ;
require( '../lib/termkit.js' ).getDetectedTerminal( function( error , term ) {


	function terminate()
	{
		term.brightBlack( 'About to exit...\n' ) ;
		term.grabInput( false ) ;
		term.applicationKeypad( false ) ;
		term.beep() ;
		term.fullscreen( false ) ;
		
		// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
		setTimeout( function() { process.exit() ; } , 100 ) ;
	} 



	term.fullscreen() ;
	term.bold.cyan( 'Key test, hit anything on the keyboard to see how it is detected...\n' ) ;
	term.green( 'Hit CTRL-C to quit, CTRL-D to change the mouse reporting mode\n\n' ) ;
	
	// Set Application Keypad mode, but it does not works on every box (sometime numlock should be off for this to work)
	term.applicationKeypad() ;

	//term.keyboardModifier() ;

	term.grabInput( { mouse: 'button' , focus: true } ) ;

	var mouseMode = 1 ;
	
	term.on( 'key' , function( name , matches , data ) {
		
		console.log(
			"'key' event:" ,
			name ,
			matches ,
			Buffer.isBuffer( data.code ) ? data.code : data.code.toString( 16 ) ,
			data.codepoint ? data.codepoint.toString( 16 ) : ''
		) ;
		
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
		
		if ( matches.indexOf( 'CTRL_D' ) >= 0 )
		{
			term.green( 'CTRL-D received: ' ) ;
			mouseMode = ( mouseMode + 1 ) % 4 ;
			
			switch ( mouseMode )
			{
				case 0 :
					term.green( 'turn mouse off\n' ) ;
					term.grabInput( { mouse: false , focus: true } ) ;
					break ;
				case 1 :
					term.green( 'mouse in button mode\n' ) ;
					term.grabInput( { mouse: 'button' , focus: true } ) ;
					break ;
				case 2 :
					term.green( 'mouse in drag mode\n' ) ;
					term.grabInput( { mouse: 'drag' , focus: true } ) ;
					break ;
				case 3 :
					term.green( 'mouse in motion mode\n' ) ;
					term.grabInput( { mouse: 'motion' , focus: true } ) ;
					break ;
			}
		}
	} ) ;

	term.on( 'terminal' , function( name , data ) {
		console.log( "'terminal' event:" , name , data ) ;
	} ) ;
	
	term.on( 'mouse' , function( name , data ) {
		console.log( "'mouse' event:" , name , data ) ;
	} ) ;

	term.on( 'unknown' , function( buffer ) {
		console.log( "'unknown' event, buffer:" , buffer ) ;
	} ) ;

} ) ;

