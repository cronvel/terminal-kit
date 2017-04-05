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

var screen = termkit.ScreenBuffer24Bits.create( { dst: term , width: term.width , height: 20 } ) ;
//var screen = termkit.ScreenBuffer24Bits.create( { dst: term , width: 4 , height: 4 } ) ;
screen.fill() ;
screen.fill( { attr: {
	bgR: 13 ,
	bgG: 10 ,
	bgB: 20
} } ) ;

var buffer = termkit.ScreenBuffer24Bits.create( { dst: screen , width: 12 , height: 6 } ) ;

buffer.fill( { attr: {
	bgR: 130 ,
	bgG: 100 ,
	bgB: 200 ,
	bgA: 125
} } ) ;

buffer.x = 8 ;
buffer.y = 4 ;

var buffer2 = termkit.ScreenBuffer24Bits.create( { dst: screen , width: 12 , height: 6 } ) ;

buffer2.fill( { attr: {
	bgR: 230 ,
	bgG: 100 ,
	bgB: 0 ,
	bgA: 125
} } ) ;

buffer2.x = 12 ;
buffer2.y = 8 ;

var buffer3 = termkit.ScreenBuffer24Bits.create( { dst: screen , width: 12 , height: 6 } ) ;

buffer3.fill( { attr: {
	bgR: 130 ,
	bgG: 200 ,
	bgB: 80 ,
	bgA: 125
} } ) ;

buffer3.x = 16 ;
buffer3.y = 5 ;

buffer.draw( { blending: true } ) ;
buffer3.draw( { blending: true } ) ;
buffer2.draw( { blending: true } ) ;
screen.draw( { delta: true } ) ;

term.styleReset() ;
term.moveTo( 1 , 21 ) ;

//console.log( screen.buffer ) ;
//console.log( screen.dump() ) ;
