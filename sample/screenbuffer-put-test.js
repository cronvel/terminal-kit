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



var termkit = require( '..' ) ;
var term = termkit.terminal ;


term.clear() ;

var buffer = termkit.ScreenBuffer.create( { dst: term , width: 8 , height: 8 , palette: new termkit.Palette() } ) ; //.clear() ;

/*
buffer.put( {
		x: 3 ,
		y: 2 ,
		//wrap: true ,
		//attr: { color: 'red' , bgColor: 'brightBlack' , underline: true }
	} ,
	'0123456789'
) ;
//*/

//*
buffer.put( {
		x: 0 ,
		y: 2 ,
		markup: true ,
		wrap: true ,
		//attr: { color: 'red' , bgColor: 'brightBlack' , underline: true }
	} ,
	'0^b1^#^R2^y3^+^#^c4^/5^+67^[bg:*pink]89'
) ;
//*/

buffer.draw() ;

term( '\n' ) ;

