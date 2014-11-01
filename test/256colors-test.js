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
	
	var r , g , b ;

	term.bold( '\n=== 256 colors register test ===\n\n' ) ;
	
	for ( i = 0 ; i <= 255 ; i ++ ) { term.color256( i , "*" ) ; }
	term( '\n' ) ;
	for ( i = 0 ; i <= 255 ; i ++ ) { term.bgColor256( i , " " ) ; }
	term( '\n' ) ;
	
	
	
	term.bold( '\n=== 256 colors 26 shades of gray test ===\n\n' ) ;
	
	for ( i = 0 ; i <= 25 ; i ++ ) { term.color256gray( i , "*" ) ; }
	term( '\n' ) ;
	for ( i = 0 ; i <= 25 ; i ++ ) { term.bgColor256gray( i , " " ) ; }
	term( '\n' ) ;
	
	
	
	term.bold( '\n=== 256 colors RGB 6x6x6 color cube test ===\n\n' ) ;
	
	for ( g = 0 ; g < 6; g ++ )
	{
		for ( r = 0 ; r < 6 ; r ++ )
		{
			for ( b = 0 ; b < 6 ; b ++ )
			{
				term.color256rgb( r , g , b , "*" ) ;
			}
			
			term( ' ' ) ;
		}
		
		term( '\n' ) ;
	}
	
	term( '\n' ) ;
	
	
	for ( g = 0 ; g < 6; g ++ )
	{
		for ( r = 0 ; r < 6 ; r ++ )
		{
			for ( b = 0 ; b < 6 ; b ++ )
			{
				term.bgColor256rgb( r , g , b , "  " ) ;
			}
			
			term( ' ' ) ;
		}
		
		term( '\n' ) ;
	}
    
	term( '\n' ) ;
	
	
	// Reset before exiting...

	term( '\n' ) ;
	term.styleReset() ;
	term( 'Reset...\n' ) ;
	
} ) ;

