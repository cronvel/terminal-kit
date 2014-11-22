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
	
	function moveRedraw()
	{
		//buffer.redrawChars() ;
		buffer.redraw() ;
		buffer.offsetX ++ ;
		
		//buffer2.redraw() ;
		//buffer2.offsetX -- ;
		
		if ( moved ++ < 20 ) { setTimeout( moveRedraw , 150 ) ; }
		else { term.fullscreen( false ) ; }
	}
	
	//term.fullscreen() ;
	
	var buffer = term.createScreenBuffer( { width: 10 , height: 10 } ) ;
	buffer.moveTo.brightCyan( 3 , 2 , 'toto' ) ;
	buffer.moveTo.red.underline( 4 , 7 , 'titi' ) ;
	buffer.magenta( '!' ) ;
	buffer.moveTo.green.underline( 4 , 8 , '*' ) ;
	
	var buffer2 = term.createScreenBuffer( { width: 3 , height: 3 , offsetX: 70 , offsetY: 7 } ) ;
	buffer2.moveTo.brightYellow( 2 , 2 , '*' ) ;
	
	console.log( 'b1:' , buffer.charBuffer.foo ) ;
	console.log( 'b2:' , buffer2.charBuffer.foo ) ;
	
	buffer.dumpChars() ;
	//buffer.dump() ;
	
	//moveRedraw() ;
} ) ;




