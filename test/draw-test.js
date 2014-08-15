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
	//term.brightBlack( 'About to exit...\n' ) ;
	term.grabInput( false ) ;
	term.fullscreen( false ) ;
	term.applicationKeypad( false ) ;
	term.beep() ;
	
	// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
	setTimeout( function() { process.exit() } , 100 ) ;
} 



// Switch to fullscreen (alternate) buffer mode
term.fullscreen() ;

// Set Application Keypad mode, but it does not works on every box (sometime numlock should be off for this to work)
term.applicationKeypad() ;

term.moveTo( 1 , 1 )
	.bgWhite.blue( 'Arrows: move, CTRL+Arrows: draw, SHIFT+Arrows: draw brighter, ENTER/SPACE: in-place drawing\n1-8: change color - ' )
	.bgWhite.green( 'CTRL-C to quit (size: %ix%i)\n' , term.width , term.height )
	.moveTo( 40 , 20 ) ;



term.grabInput( { mouse: 'button' , focus: true } ) ;



var color = 2 ;

term.on( 'key' , function( key , matches , data ) {
	
	term.saveCursor().moveTo( 0 , term.height ).deleteLine( 1 ).bgWhite.blue( 'Key pressed: ' + key ).restoreCursor() ;
	
	switch ( key )
	{
		case '1' : 
		case '2' : 
		case '3' : 
		case '4' : 
		case '5' : 
		case '6' : 
		case '7' : 
		case '8' : 
			color = parseInt( key ) - 1 ;
			break ;
		case 'UP' : term.up( 1 ) ; break ;
		case 'DOWN' : term.down( 1 ) ; break ;
		case 'LEFT' : term.left( 1 ) ; break ;
		case 'RIGHT' : term.right( 1 ) ; break ;
		case 'CTRL_UP' : term.bgColor( color , ' ' ).left.up( 1 , 1 ).bgColor( color , ' ' ).left( 1 ) ; break ;
		case 'CTRL_DOWN' : term.bgColor( color , ' ' ).left.down( 1 , 1 ).bgColor( color , ' ' ).left( 1 ) ; break ;
		case 'CTRL_LEFT' : term.bgColor( color , ' ' ).left( 2 ).bgColor( color , ' ' ).left( 1 ) ; break ;
		case 'CTRL_RIGHT' : term.bgColor( color , '  ' ).left( 1 ) ; break ;
		case 'SHIFT_UP' : term.bgColor( color + 8 , ' ' ).left.up( 1 , 1 ).bgColor( color + 8 , ' ' ).left( 1 ) ; break ;
		case 'SHIFT_DOWN' : term.bgColor( color + 8 , ' ' ).left.down( 1 , 1 ).bgColor( color + 8 , ' ' ).left( 1 ) ; break ;
		case 'SHIFT_LEFT' : term.bgColor( color + 8 , ' ' ).left( 2 ).bgColor( color + 8 , ' ' ).left( 1 ) ; break ;
		case 'SHIFT_RIGHT' : term.bgColor( color + 8 , '  ' ).left( 1 ) ; break ;
		case 'ENTER' : term.bgColor( color , ' ' ).left( 1 ) ; break ;
		case ' ' : term.bgColor( color + 8 , ' ' ).left( 1 ) ; break ;
		case 'CTRL_C' : terminate() ; break ;
	}
} ) ;



term.on( 'window' , function( name , data ) {
//	console.log( "'window' event:" , name , data ) ;
} ) ;

term.on( 'mouse' , function( name , data ) {
//	console.log( "'mouse' event:" , name , data ) ;
} ) ;

term.on( 'unknown' , function( buffer ) {
//	console.log( "'unknown' event, buffer:" , buffer ) ;
} ) ;



//setTimeout( terminate , 20000 ) ;


