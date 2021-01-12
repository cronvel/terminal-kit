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



const string = require( 'string-kit' ) ;
const term = require( '../lib/termkit.js' ).terminal ;
const Promise = require( 'seventh' ) ;



async function test() {
	var fwa = string.unicode.toFullWidth( '@' ) ;	// Get a full-width arobas

	term.clear() ;
	term.moveTo( 1 , 1 , fwa ) ;
	term.moveTo( 2 , 2 , fwa ) ;
	term.moveTo( 3 , 3 , fwa ) ;

	term.moveTo( 4 , 4 , fwa ) ;
	await Promise.resolveTimeout( 1000 ) ;
	term.moveTo( 5 , 4 , '!' ) ;

	term.moveTo( 5 , 5 , fwa ) ;
	await Promise.resolveTimeout( 1000 ) ;
	term.moveTo( 6 , 5 , '!' ) ;


	term.moveTo( 1 , 10 ) ;
	term( 'Full-width arobas length: %i\n' , fwa.length ) ;
	term( 'Full-width arobas unicode.isFullWidth(): %s\n' , string.unicode.isFullWidth( fwa ) ) ;
}

test() ;

