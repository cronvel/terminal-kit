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

var term = require( 'terminal-kit' ).terminal ;

term.clear() ;
term.cyan( 'Where will you go?\n' ) ;

var items = [
	'a. Go north' ,
	'b. Go south' ,
	'c. Go east' ,
	'd. Go west'
] ;

var menu = term.singleColumnMenu( items , { continueOnSubmit: true } ) ;

menu.on( 'submit' , data => {
	term.saveCursor() ;
	term.moveTo( 1 , term.height - 1 , "Submit: %s" , data.selectedText ) ;
	term.restoreCursor() ;
} ) ;

term.on( 'key' , key => {
	if ( key === 'CTRL_C' ) {
		term.grabInput( false ) ;
		process.exit() ;
	}
} ) ;

