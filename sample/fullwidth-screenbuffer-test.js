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



const string = require( 'string-kit' ) ;
const termkit = require( '..' ) ;
const term = termkit.terminal ;
const SB = termkit.ScreenBufferHD ;
const Promise = require( 'seventh' ) ;



async function test() {
	var attr  ;
	var fwa = string.unicode.toFullWidth( '@' ) ;	// Get a full-width arobas
	var fwz = string.unicode.toFullWidth( '0' ) ;	// Get a full-width arobas
	
	term.clear() ;
	
	var buffer = SB.create( { dst: term , width: 4 , height: 5 } ) ;
	var buffer2 = SB.create( { dst: buffer , width: 4 , height: 5 } ) ;
	
	//buffer.draw( { delta: true } ) ;
	
	//attr = { color: { r:255,g:155,b:155,a:255 } , bgColor: { r:0,g:50,b:0,a:255} } ;
	buffer.put( { x: 0 , y: 0 , attr } , fwa.repeat( 2 ) ) ;
	buffer.put( { x: 0 , y: 1 , attr } , fwa.repeat( 2 ) ) ;
	buffer.put( { x: 1 , y: 1 , attr } , fwa ) ;
	buffer.put( { x: 0 , y: 2 , attr } , fwa.repeat( 2 ) ) ;
	buffer.put( { x: 1 , y: 2 , attr } , '!' ) ;
	buffer.put( { x: 0 , y: 3 , attr } , fwa.repeat( 2 ) ) ;
	buffer.put( { x: 2 , y: 3 , attr } , '!' ) ;
	buffer.put( { x: 3 , y: 4 , attr } , fwa ) ;

	buffer.draw( { delta: false } ) ;
	term( '\n' ) ;
	term.moveTo.styleReset( 1 , 8 , '%s' , buffer.dump() ) ;
	//return ;
	//await Promise.resolveTimeout( 1000 ) ;

	buffer.x = 10 ;
	buffer2.put( { x: 0 , y: 0 , attr } , fwz ) ;
	buffer2.x = 1 ;

	//buffer.draw( { delta: false } ) ;
	buffer2.draw( { blending: true } ) ;
	buffer.draw( { delta: false } ) ;
	term.moveTo.styleReset( 1 , 16 , '%s' , buffer.dump() ) ;
}

test() ;

