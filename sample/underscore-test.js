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
/* global describe, it, before, after */



var term = require( '../lib/termkit.js' ).terminal ;
var async = require( 'async-kit' ) ;

console.log(
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________' +
	'______________________________________________________________________________'
) ;
process.exit() ;

var i , j , sequence ;

term.clear() ;
//term.styleReset.color.bgColor( 6 , 0 ) ;

j = 1 ;
sequence = '' ;
async.series( [ function( callback ) {
	
	/*
	term.moveTo.styleReset.color.bgColor( 1 , j , 6 , 0 , j ) ;
	for ( i = 3 ; i <= term.width - 1 ; i ++ )
	{
		term.moveTo.styleReset.color.bgColor( i , j , 6 , 0 , '_' ) ;
	}
	//*/
	
	/*
	term.moveTo( 1 , j , j ) ;
	for ( i = 3 ; i <= term.width - 1 ; i ++ )
	{
		term( '_' ) ;
	}
	//*/
	
	//*
	//sequence += term.str.moveTo( 1 , j , j ) ;
	//sequence += term.str.moveTo.styleReset.color.bgColor( 1 , j , 6 , 0 ) ; sequence += term.str( j ) ;
	for ( i = 3 ; i <= term.width - 1 ; i ++ )
	{
		sequence += term.str( '_' ) ;
	}
	process.stdout.write( sequence ) ;
	sequence = '' ;
	//*/
	
	j ++ ;
	setTimeout( callback , 500 ) ;
} ] )
.repeat( term.height - 1 )
.exec( function() {
	if ( sequence.length ) { process.stdout.write( sequence ) ; }
	term( '\n' ) ;
} ) ;

