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



var term = require( '../lib/termkit.js' ).terminal ;
var i ;



term( 'Check the .color() method:\n' ) ;
for ( i = 0 ; i < 16 ; i ++ ) { term.color( i , '*' ) ; }
term( '\n' ) ;



term( 'Check the .color256() method:\n' ) ;
for ( i = 0 ; i < 16 ; i ++ ) { term.color256( i , '*' ) ; }
term( '\n' ) ;



term( 'Check the .bgColor() method:\n' ) ;
for ( i = 0 ; i < 16 ; i ++ ) { term.bgColor( i , ' ' ) ; }
term( '\n' ) ;



term( 'Check the .bgColor256() method:\n' ) ;
for ( i = 0 ; i < 16 ; i ++ ) { term.bgColor256( i , ' ' ) ; }
term( '\n' ) ;



term( 'Styles:\n' ) ;
term.bold( 'bold ' ).dim( 'dim ' ).italic( 'italic ' ).underline( 'underline ' )
	.blink( 'blink ' ).inverse( 'inverse ' ).hidden( 'hidden ' ).strike( 'strike ' ) ;
term( '\n' ) ;



term( 'Background & foreground:\n' ) ;
term.blue.bgRed( 'blue on red' ) ;
term( '\n' ) ;



term( '.object2attr():\n' ) ;
var attr ;
attr = term.object2attr( { color: 'blue' , bgColor: 'red' , underline: true , italic: true } ) ;
term( attr ) ;
term( 'Attr test ' ) ;
attr = term.object2attr( { color: 'blue' } ) ;
term( attr ) ;
term( 'Attr test2 ' ) ;



// Reset before exiting...

term.styleReset() ;
term( '\nReset...\n' ) ;

