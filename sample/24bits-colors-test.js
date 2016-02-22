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


require( '../lib/termkit.js' ).getDetectedTerminal( function( error , term ) {
	
	var i , r , g , b ;
	
	
	term.bold( '\n=== 24 bits colors 256 shades of gray test ===\n\n' ) ;
	
	for ( i = 0 ; i <= 255 ; i ++ ) { if ( ! ( i % 70 ) ) { term( '\n' ) ; } term.colorGrayscale( i , "*" ) ; }	// jshint ignore:line
	term.styleReset( '\n' ) ;
	for ( i = 0 ; i <= 255 ; i ++ ) { if ( ! ( i % 70 ) ) { term( '\n' ) ; } term.bgColorGrayscale( i , " " ) ; } // jshint ignore:line
	term.styleReset( '\n' ) ;
	
	
	
	term.bold( '\n=== 24 bits colors 256 shades of green test ===\n\n' ) ;
	
	for ( i = 0 ; i <= 255 ; i ++ ) { if ( ! ( i % 70 ) ) { term( '\n' ) ; } term.colorRgb( 0 , i , 0 , "*" ) ; } // jshint ignore:line
	term.styleReset( '\n' ) ;
	for ( i = 0 ; i <= 255 ; i ++ ) { if ( ! ( i % 70 ) ) { term( '\n' ) ; } term.bgColorRgb( 0 , i , 0 , " " ) ; } // jshint ignore:line
	term.styleReset( '\n' ) ;
	
	
	
	term.bold( '\n=== 24 bits colors 256 shades of desatured magenta test ===\n\n' ) ;
	
	for ( i = 0 ; i <= 255 ; i ++ ) { if ( ! ( i % 70 ) ) { term( '\n' ) ; } term.colorRgb( i , Math.floor( i / 2 ) , i , "*" ) ; } // jshint ignore:line
	term.styleReset( '\n' ) ;
	for ( i = 0 ; i <= 255 ; i ++ ) { if ( ! ( i % 70 ) ) { term( '\n' ) ; } term.bgColorRgb( i , Math.floor( i / 2 ) , i , " " ) ; } // jshint ignore:line
	term.styleReset( '\n' ) ;
	
	
	
	// Reset before exiting...
	
	term.styleReset( '\n' ) ;
	term( 'Reset...\n' ) ;
	
} ) ;

