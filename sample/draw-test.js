#!/usr/bin/env node
/*
	Terminal Kit
	
	Copyright (c) 2009 - 2018 Cédric Ronvel
	
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



require( '../lib/termkit.js' ).getDetectedTerminal( function( error , term ) {
	
	
	function terminate()
	{
		setTimeout( function() {
			//term.brightBlack( 'About to exit...\n' ) ;
			term.grabInput( false ) ;
			term.fullscreen( false ) ;
			term.applicationKeypad( false ) ;
			term.beep() ;
			
			// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
			setTimeout( function() { process.exit() ; } , 100 ) ;
		} , 100 ) ;
	} 



	// Switch to fullscreen (alternate) buffer mode
	term.fullscreen() ;

	// Set Application Keypad mode, but it does not works on every box (sometime numlock should be off for this to work)
	term.applicationKeypad() ;

	term.moveTo( 1 , 1 )
		.bgWhite.blue( 'Arrows: move, CTRL+Arrows: draw, SHIFT+Arrows: draw brighter\nTAB: switch mode, ENTER/SPACE: in-place drawing 1-8: change color\n' )
		.bgWhite.green( 'CTRL-C to quit (startup size: %ix%i)\n' , term.width , term.height )
		.moveTo( 40 , 20 ) ;



	term.grabInput( { mouse: 'button' , focus: true } ) ;
	term.requestCursorLocation().requestScreenSize() ;


	var color = 2 , x = '' , y = '' , width = '' , height = '' ;
	var mode = 0 , modeString = [ 'move' , 'draw' , 'draw brigther' ] ;

	term.on( 'key' , function( key , matches , data ) {
		
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
			case 'ALT_UP' : term.up( 1 ) ; break ;
			case 'ALT_DOWN' : term.down( 1 ) ; break ;
			case 'ALT_LEFT' : term.left( 1 ) ; break ;
			case 'ALT_RIGHT' : term.right( 1 ) ; break ;
			case 'CTRL_UP' : term.bgColor( color , ' ' ).left.up( 1 , 1 ).bgColor( color , ' ' ).left( 1 ) ; break ;
			case 'CTRL_DOWN' : term.bgColor( color , ' ' ).left.down( 1 , 1 ).bgColor( color , ' ' ).left( 1 ) ; break ;
			case 'CTRL_LEFT' : term.bgColor( color , ' ' ).left( 2 ).bgColor( color , ' ' ).left( 1 ) ; break ;
			case 'CTRL_RIGHT' : term.bgColor( color , '  ' ).left( 1 ) ; break ;
			case 'SHIFT_UP' : term.bgColor( color + 8 , ' ' ).left.up( 1 , 1 ).bgColor( color + 8 , ' ' ).left( 1 ) ; break ;
			case 'SHIFT_DOWN' : term.bgColor( color + 8 , ' ' ).left.down( 1 , 1 ).bgColor( color + 8 , ' ' ).left( 1 ) ; break ;
			case 'SHIFT_LEFT' : term.bgColor( color + 8 , ' ' ).left( 2 ).bgColor( color + 8 , ' ' ).left( 1 ) ; break ;
			case 'SHIFT_RIGHT' : term.bgColor( color + 8 , '  ' ).left( 1 ) ; break ;
			case 'UP' :
				if ( ! mode ) { term.up( 1 ) ; }
				else { term.bgColor( color + 8 * ( mode - 1 ) , ' ' ).left.up( 1 , 1 ).bgColor( color + 8 * ( mode - 1 ) , ' ' ).left( 1 ) ; }
				break ;
			case 'DOWN' :
				if ( ! mode ) { term.down( 1 ) ; }
				else { term.bgColor( color + 8 * ( mode - 1 ) , ' ' ).left.down( 1 , 1 ).bgColor( color + 8 * ( mode - 1 ) , ' ' ).left( 1 ) ; }
				break ;
			case 'LEFT' :
				if ( ! mode ) { term.left( 1 ) ; }
				else { term.bgColor( color + 8 * ( mode - 1 ) , ' ' ).left( 2 ).bgColor( color + 8 * ( mode - 1 ) , ' ' ).left( 1 ) ; }
				break ;
			case 'RIGHT' :
				if ( ! mode ) { term.right( 1 ) ; }
				else { term.bgColor( color + 8 * ( mode - 1 ) , '  ' ).left( 1 ) ; }
				break ;
			case 'ENTER' : term.bgColor( color , ' ' ).left( 1 ) ; break ;
			case ' ' : term.bgColor( color + 8 , ' ' ).left( 1 ) ; break ;
			case 'TAB' : mode = ( mode + 1 ) % 3 ; break ;
			case 'CTRL_C' : terminate() ; break ;
		}
		
		term.requestCursorLocation()
			.saveCursor()
			.moveTo( 1 , term.height )
			.eraseLine()
			.bgWhite.blue(
				'Arrow mode: ' + modeString[ mode ] +
				' -- Cur pos: ' + x + ',' + y +
				' -- Scr size: ' + term.width + ',' + term.height +
				' -- Key: ' + key
			)
			.restoreCursor() ;
	} ) ;



	term.on( 'terminal' , function( name , data ) {
		
		switch ( name )
		{
			case 'CURSOR_LOCATION' : x = data.x ; y = data.y ; break ;
			case 'SCREEN_SIZE' : width = data.width ; height = data.height ; break ;
		}
	} ) ;



	term.on( 'mouse' , function( name , data ) {
	//	console.log( "'mouse' event:" , name , data ) ;
	} ) ;



	term.on( 'unknown' , function( buffer ) {
	//	console.log( "'unknown' event, buffer:" , buffer ) ;
	} ) ;


} ) ;

