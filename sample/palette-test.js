#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2020 Cédric Ronvel

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



// https://fr.wikipedia.org/wiki/Cercle_chromatique#Hering

// Cool lib to manipulate colors: https://github.com/gka/chroma.js

const termkit = require( '..' ) ;
const term = termkit.terminal ;

var i , j , z ,
	scale ,
	h , c , l ,
	r , g , b ;


term.bold( '\n\n=== Palette Class tests  ===\n\n' ) ;

const Palette = require( '../lib/Palette.js' ) ;

var palette = new Palette() ;
palette.generate() ;

for ( i = 0 ; i < 16 ; i ++ ) {
	if ( i % 8 === 0 ) { term.styleReset( '\n' ) ; }
	term.raw( palette.bgEscape[ i ] + '  ' ) ;
}

term.styleReset( '\n' ) ;
for ( i = 16 ; i < 232 ; i ++ ) {
	if ( ( i - 16 ) % 12 === 0 ) { term.styleReset( '\n' ) ; }
	if ( ( i - 16 ) % 72 === 0 ) { term.styleReset( '\n' ) ; }
	term.raw( palette.bgEscape[ i ] + '  ' ) ;
}

term.styleReset( '\n\n' ) ;
for ( i = 232 ; i < 245 ; i ++ ) {
	term.raw( palette.bgEscape[ i ] + '  ' ) ;
}

term.styleReset( '\n\n' ) ;
for ( i = 245 ; i < 256 ; i ++ ) {
	term.raw( palette.bgEscape[ i ] + '  ' ) ;
}

term.styleReset( '\n' ) ;

//term.raw( palette.bgEscape[ register ] + '  ' ) ;

var buffer = termkit.ScreenBuffer.create( { dst: term , width: 8 , height: 8 , x: term.width - 10 , y: 10 , palette: palette } ) ;

buffer.fill( { attr: { bgColor: '@yellow~--' } } ) ;
buffer.put( { x:1 , y:1 , markup: true } , '^[fg:*crimson,bg:*pink]BOB' ) ;
buffer.put( { x:3 , y:3 , attr: { bgColor: 241 } , markup: true } , '^[fg:red]BOB' ) ;
term.saveCursor() ;
buffer.draw() ;
term.restoreCursor() ;

//console.log( palette.colorIndex ) ;

// Reset before exiting...

term.styleReset( '\n' ) ;
term( 'Reset...\n' ) ;

