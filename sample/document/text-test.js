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



var termkit = require( '../..' ) ;
var term = termkit.terminal ;



term.clear() ;

var document = term.createDocument( {
	palette: new termkit.Palette()
} ) ;

var text = new termkit.Text( {
	parent: document ,
	//content: '^[fg:*royal-blue]A simple text' ,
	//content: ['^[fg:*royal-blue]A simple text','2nd line'] ,
	content: ['\x1b[31mgra\x1b[1;31mnted\x1b[0m, free of \x1b[1;32mcha\x1b[22mrge\x1b[0m'] ,
	//contentHasMarkup: true ,
	//contentHasMarkup: 'ansi' ,
	contentHasMarkup: 'legacyAnsi' ,
	x: 10 ,
	y: 10 ,
} ) ;

/*
setTimeout( () => {
	text.setContent( ['^RS'] , true ) ;
	//text.setContent( ['^RChanged!^ ljsdlkfjsmlkdjfmlksjflkjdslkfj','bob'] , true ) ;
} , 1200 ) ;
*/

term.on( 'key' , function( key ) {
	switch( key ) {
		case 'CTRL_C' :
			term.grabInput( false ) ;
			term.hideCursor( false ) ;
			term.styleReset() ;
			term.clear() ;
			process.exit() ;
			break ;
	}
} ) ;

