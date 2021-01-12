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



const termkit = require( '..' ) ;
const term = termkit.terminal ;
const Promise = require( 'seventh' ) ;



async function test() {
	term.clear() ;

	var delta = true ;
	var buffer = termkit.ScreenBuffer.create( { dst: term , width: 6 , height: 6 } ) ;

	buffer.put( { x: 0 , y: 0 } , '*abcd*' ) ;
	buffer.put( { x: 0 , y: 1 } , '*efgh*' ) ;
	buffer.put( { x: 0 , y: 2 } , '*ijkl*' ) ;
	buffer.put( { x: 0 , y: 3 } , '*mnop*' ) ;
	buffer.put( { x: 0 , y: 4 } , '*qrst*' ) ;
	buffer.put( { x: 0 , y: 5 } , '*uvwx*' ) ;
	buffer.draw( { delta } ) ;
	
	await Promise.resolveTimeout( 500 ) ;
	//buffer.copyRegion( { xmin: 0 , xmax: 2 , ymin: 0 , ymax: 2 } , { xmin: 3 , xmax: 5 , ymin: 2 , ymax: 4 } ) ;
	//buffer.copyRegion( { xmin: 0 , xmax: 2 , ymin: 0 , ymax: 2 } , { xmin: 0 , xmax: 2 , ymin: 2 , ymax: 4 } ) ;
	buffer.copyRegion( { x: 1 , y: 0 , width: 3 , height: 3 } , { x: 1 , y: 2 } ) ;
	buffer.draw( { delta } ) ;
	await Promise.resolveTimeout( 500 ) ;
	buffer.draw( { delta } ) ;

	term.moveTo( 1 , 8 , '\n' ) ;
}

test() ;

