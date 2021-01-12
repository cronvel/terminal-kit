#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

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



var termkit = require( '../lib/termkit.js' ) ;
var term = termkit.terminal ;
var realTerm ;


console.log( "tty.getPath():" , termkit.tty.getPath() ) ;


realTerm = termkit.realTerminal ;


term.red( "STDOUT! size: %ix%i\n" , term.width , term.height ) ;
realTerm.red( "TTY OUT! size: %ix%i\n" , term.width , term.height ) ;

/*
term.blue( "Enter your name: " ) ;
term.inputField( function( error , name ) {
	term.green( "\nHello %s!\n" , name ) ;
	process.exit() ;
} ) ;
//*/

//*
realTerm.blue( "Enter your name: " ) ;
realTerm.inputField( function( error , name ) {
	realTerm.green( "\nHello %s!\n" , name ) ;
	process.exit() ;
} ) ;
//*/
