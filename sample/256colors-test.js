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



/* jshint unused:false */


require( '../lib/termkit.js' ).getDetectedTerminal( function( error , term ) {
	
	//term.getPalette( function( error , palette ) {
		
		var i , r , g , b ;
		
		term.bold( '\n=== 256 colors register test ===\n\n' ) ;
		
		for ( i = 0 ; i <= 255 ; i ++ ) { if ( ! ( i % 70 ) ) { term( '\n' ) ; } term.color256( i , "*" ) ; } // jshint ignore:line
		term.styleReset( '\n' ) ;
		for ( i = 0 ; i <= 255 ; i ++ ) { if ( ! ( i % 70 ) ) { term( '\n' ) ; } term.bgColor256( i , " " ) ; } // jshint ignore:line
		term.styleReset( '\n' ) ;
			
		
		
		term.bold( '\n=== 256 colors 26 shades of gray test ===\n\n' ) ;
		
		for ( i = 0 ; i <= 25 ; i ++ ) { term.colorGrayscale( i * 255 / 25 , "*" ) ; }
		term.styleReset( '\n' ) ;
		for ( i = 0 ; i <= 25 ; i ++ ) { term.bgColorGrayscale( i * 255 / 25 , " " ) ; }
		term.styleReset( '\n' ) ;
		
		
		
		term.bold( '\n=== 256 colors RGB 6x6x6 color cube test ===\n\n' ) ;
		
		for ( g = 0 ; g <= 5; g ++ )
		{
			for ( r = 0 ; r <= 5 ; r ++ )
			{
				for ( b = 0 ; b <= 5 ; b ++ )
				{
					term.colorRgb( r * 255 / 5 , g * 255 / 5 , b * 255 / 5 , "*" ) ;
				}
				
				term( ' ' ) ;
			}
			
			term.styleReset( '\n' ) ;
		}
		
		term.styleReset( '\n' ) ;
		
		
		for ( g = 0 ; g <= 5; g ++ )
		{
			for ( r = 0 ; r <= 5 ; r ++ )
			{
				for ( b = 0 ; b <= 5 ; b ++ )
				{
					term.bgColorRgb( r * 255 / 5 , g * 255 / 5 , b * 255 / 5 , "  " ) ;
				}
				
				term( ' ' ) ;
			}
			
			term.styleReset( '\n' ) ;
		}
		
		term.styleReset( '\n' ) ;
		
		
		// Reset before exiting...
		
		term.styleReset( '\n' ) ;
		term( 'Reset...\n' ) ;
	//} ) ;	
} ) ;

