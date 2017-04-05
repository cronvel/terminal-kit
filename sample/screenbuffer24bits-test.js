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



var termkit = require( '../lib/termkit.js' ) ;
var term = termkit.terminal ;



term.clear() ;

//var screen = termkit.ScreenBuffer24Bits.create( { dst: term , width: term.width , height: term.height } ) ;
var screen = termkit.ScreenBuffer24Bits.create( { dst: term , width: 4 , height: 4 } ) ;
screen.fill() ;
screen.fill( { attr: {
	bgR: 13 ,
	bgG: 10 ,
	bgB: 20
} } ) ;

var buffer = termkit.ScreenBuffer24Bits.create( { dst: screen , width: 2 , height: 2 } ) ;

buffer.fill( { attr: {
	bgR: 130 ,
	bgG: 100 ,
	bgB: 200
} } ) ;

buffer.x = 1 ;
buffer.y = 1 ;

//buffer.draw( { blending: true } ) ;
buffer.draw() ;
screen.draw() ;

term.styleReset() ;
term.moveTo( 1 , 20 ) ;

//console.log( screen.buffer ) ;
screen.dump() ;
