#!/usr/bin/env node
/*
	Terminal Kit
	
	Copyright (c) 2009 - 2018 Cédric Ronvel
	
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

term( 'Choose a file: ' ) ;

function test() {
	term.fileInput(
		//{ baseDir: __dirname + '/../' } ,
		{ baseDir: '../' } ,
		function( error , input ) {
			if ( error )
			{
				term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
			}
			else
			{
				term.green( "\nYour file is '%s'\n" , input ) ;
			}
			
			process.exit() ;
		}
	) ;
}

async function asyncTest() {
	var input = await term.fileInput( { baseDir: '../' } ) ;
	term.green( "\nYour file is '%s'\n" , input ) ;
	process.exit() ;
}

//test() ;
asyncTest() ;
