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



/* jshint unused:false */


var term = require( '../lib/termkit.js' ).terminal ;

//term.clear() ;

term.scrollingRegion( 1 , 20 ) ;

/*
term.moveTo( 1 , term.height ).inverse( 'bottom line' ) ;
term.saveCursor() ;
term.scrollingRegion( 10 , term.height - 1 ) ;
term.restoreCursor() ;
//*/

var count = 0 ;

function print()
{
	term.eraseLineAfter() ;
	term( '#%i\n' , count ) ;
	
	if ( count === 30 ) { term.moveTo( 1 , 25 ) ; }
	if ( count === 60 ) { term.moveTo( 1 , 1 ) ; }
	
	if ( count ++ < 100 ) { setTimeout( print , 100 ) ; }
	else { term.resetScrollingRegion() ; }
}

print() ;

