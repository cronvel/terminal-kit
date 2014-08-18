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



var term = require( '../lib/terminal.js' ) ;
var format = require( '../lib/format.js' ) ;



console.log( '2:' , format.count( '%i %s' ) ) ;

console.log( format( 'ABC: %s%s%s' , 'A' , 'B' , 'C' ) ) ;
console.log( format( 'BAC: %+1s%-1s%s' , 'A' , 'B' , 'C' ) ) ;
console.log( format( 'CBC: %3s%s' , 'A' , 'B' , 'C' ) ) ;

var filters = {
	fixed: function() { return 'F' ; } ,
	double: function( str ) { return '' + str + str ; } ,
	fxy: function( a , b ) { return '' + ( a * a + b ) ; }
} ;

console.log( format.call( filters , 'FABC: %[fixed]%s%s%s' , 'A' , 'B' , 'C' ) ) ;
console.log( format.call( filters , 'f(x,y)=28: %s%[fxy:%a%a]' , 'f(x,y)=' , 5 , 3 ) ) ;
console.log( format.call( filters , 'f(x,y)=14: %s%[fxy:%+1a%-1a]' , 'f(x,y)=' , 5 , 3 ) ) ;

term.green( "My name is %s, I'm %d.\n" , 'Jack' , 32 ) ;

