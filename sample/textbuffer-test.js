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



var termkit = require( '../lib/termkit.js' ) ;
var term = termkit.terminal ;


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



term.fullscreen() ;
term.moveTo( 1 , 1 ).bgWhite.blue( 'Welcome to Neon!   ' ).bgWhite.green( 'CTRL-C to quit' ) ;
term.grabInput() ;



var attrs = [
	termkit.ScreenBuffer.DEFAULT_ATTR ,
	{ color: 'red', bgColor: 'black' } ,
	{ color: 'green', bgColor: 'black' } ,
	{ color: 'blue', bgColor: 'black' } ,
	{ color: 'red', bgColor: 'black' , bold: true , italic: true } ,
	{ color: 'red', bgColor: 'yellow' } ,
] ;

var attrsIndex = 0 ;

var emptyAttrs = [
	{ bgColor: 'yellow' } ,
	{ bgColor: 'brightYellow' } ,
	{ bgColor: 'red' } ,
	{ bgColor: 'blue' } ,
	termkit.ScreenBuffer.DEFAULT_ATTR ,
] ;

var emptyAttrsIndex = 0 ;



term.on( 'key' , function( key , matches , data ) {
	
	var draw , drawCursor ;
	
	
	if ( data.isCharacter )
	{
		tbuf.insert( key , attrs[ attrsIndex ] ) ;
		draw = drawCursor = true ;
	}
	else
	{
		switch ( key )
		{
			case 'CTRL_S' :
				attrsIndex = ( attrsIndex + 1 ) % attrs.length ;
				break ;
			case 'CTRL_B' :
				emptyAttrsIndex = ( emptyAttrsIndex + 1 ) % emptyAttrs.length ;
				tbuf.setEmptyCellAttr( emptyAttrs[ emptyAttrsIndex ] ) ;
				break ;
			case 'UP' :
				tbuf.move( 0 , -1 ) ;
				drawCursor = true ;
				break ;
			case 'DOWN' :
				tbuf.move( 0 , 1 ) ;
				drawCursor = true ;
				break ;
			case 'LEFT' :
				//tbuf.move( -1 , 0 ) ;
				tbuf.moveBackward() ;
				drawCursor = true ;
				break ;
			case 'RIGHT' :
				//tbuf.move( 1 , 0 ) ;
				tbuf.moveForward() ;
				drawCursor = true ;
				break ;
			case 'END' :
				tbuf.moveToEndOfLine() ;
				drawCursor = true ;
				break ;
			case 'HOME' :
				tbuf.moveToColumn( 0 ) ;
				drawCursor = true ;
				break ;
			case 'ENTER' :
				tbuf.newLine() ;
				draw = drawCursor = true ;
				break ;
			case 'DELETE' :
				tbuf.delete( 1 ) ;
				draw = drawCursor = true ;
				break ;
			case 'BACKSPACE' :
				tbuf.backDelete( 1 ) ;
				draw = drawCursor = true ;
				break ;
			case 'CTRL_C' :
				terminate() ;
				break ;
		}
	}
	
	
	if ( draw )
	{
		tbuf.draw() ;
		sbuf.draw() ;
	}
	
	if ( drawCursor )
	{
		tbuf.drawCursor() ;
		sbuf.drawCursor() ;
	}
} ) ;





var sbuf = termkit.ScreenBuffer.create( { dst: term , width: 20 , height: 8 , x: 2 , y: 2 } ) ;

var tbuf = termkit.TextBuffer.create( { dst: sbuf } ) ;
tbuf.setEmptyCellAttr( emptyAttrs[ emptyAttrsIndex ] ) ;

tbuf.draw() ;
sbuf.draw() ;
tbuf.drawCursor() ;
sbuf.drawCursor() ;



//console.log( '\n' , global.deb ) ;


