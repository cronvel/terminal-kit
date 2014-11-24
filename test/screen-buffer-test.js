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



require( '../lib/terminal.js' ).getDetectedTerminal( function( error , term ) {
	
	var moved = 0 ;
	
	//*
	function moveRedraw()
	{
		//buffer.drawChars() ;
		buffer.draw() ;
		buffer.offsetX ++ ;
		
		buffer2.draw() ;
		buffer2.offsetX -- ;
		
		buffer3.offsetX = Math.floor( Math.random() * 8 ) ;
		buffer3.draw() ;
		
		if ( moved ++ < 20 ) { setTimeout( moveRedraw , 150 ) ; }
		else
		{
			term.hideCursor( true ) ;
			term.fullscreen( false ) ;
		}
	}
	//*/
	
	var buffer = term.ScreenBuffer.create( term , { width: 8 , height: 8 } ).clear() ;
	buffer.put( 3 , 2 , { color: 'red' , bgColor: 'brightBlack' , underline: true } , 'toto' ) ;
	buffer.put( 4 , 5 , { color: 'brightYellow' , bold: true } , '𝌆' ) ;	// <-- takes more than one UCS-2 character
	
	var buffer2 = term.ScreenBuffer.create( term , { width: 3 , height: 1 , offsetX: 70 , offsetY: 3 } ).clear() ;
	buffer2.put( 0 , 0 , { color: 'yellow' } , '<--' ) ;
	
	var buffer3 = term.ScreenBuffer.create( buffer , { width: 3 , height: 3 , offsetX: 2 , offsetY: 6 } ).clear() ;
	buffer3.put( 1 , 1 , { color: 'brightMagenta' } , '*' ) ;
	
	//buffer3.draw() ;
	//buffer.dump() ; return ;
	
	term.fullscreen() ;
	term.hideCursor() ;
	moveRedraw() ;
} ) ;




