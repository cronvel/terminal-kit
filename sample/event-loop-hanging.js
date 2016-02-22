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

// Looks like it's not possible to ref() again stdin, so it's a no-go:
// program will keep hanging if they have used stdin even once

/*
term.grabInput() ;

term.on( 'key' , function( key ) {
	if ( key === 'CTRL_C' ) { process.exit() ; }
} ) ;

term.grabInput( false ) ;

process.stdin.removeAllListeners( 'data' ) ;
term.stdin.removeAllListeners( 'data' ) ;
//*/

//*
function noop() {}
process.stdin.on( 'data' , noop ) ;

process.stdin.removeListener( 'data' , noop ) ;

console.log( process._getActiveHandles() ) ;
console.log( process._getActiveRequests() ) ;

//process.stdin.unref() ;
//process.stdin.ref() ;
//process.stdin.removeAllListeners( 'data' ) ;

//*/






