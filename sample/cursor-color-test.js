#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

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
	
	//*
	var r = Math.floor( Math.random() * 256 ) ;
	var g = Math.floor( Math.random() * 256 ) ;
	var b = Math.floor( Math.random() * 256 ) ;
	term.bold.cyan( 'Setting the cursor color to RGB (%d,%d,%d)\n' , r , g , b ) ;
	term.setCursorColorRgb( r , g , b ) ;
	//*/
	
	/*
	var c = Math.floor( Math.random() * 8 ) ;
	term.bold.cyan( 'Setting the cursor color to register %d\n' , c ) ;
	term.setCursorColor( c , 0 ) ;
	//*/
	
	var t = Math.floor( Math.random() * 6 ) ;
	
	switch ( t )
	{
		case 0 :
			term.blockCursor( 'Block cursor\n' ) ;
			break ;
		case 1 :
			term.blinkingBlockCursor( 'Blinking block cursor\n' ) ;
			break ;
		case 2 :
			term.underlineCursor( 'Underline cursor\n' ) ;
			break ;
		case 3 :
			term.blinkingUnderlineCursor( 'Blinking underline cursor\n' ) ;
			break ;
		case 4 :
			term.beamCursor( 'Beam cursor\n' ) ;
			break ;
		case 5 :
			term.blinkingBeamCursor( 'Blinking Beam cursor\n' ) ;
			break ;
	}
} ) ;




