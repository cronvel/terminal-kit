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



var tree = require( 'tree-kit' ) ;
var termkit = require( '../lib/termkit.js' ) ;
var term = termkit.terminal ;



term.clear() ;

var screen = termkit.ScreenBufferHD.create( { dst: term , width: 60 , height: 20 } ) ;

var clear ;

clear = { attr: { bgColor: {
	r: 127 ,
	g: 127 ,
	b: 127
} } } ;
clear = { attr: { bgColor: {
	r: 255 ,
	g: 255 ,
	b: 255
} } } ;
clear = { attr: { bgColor: {
	r: 13 ,
	g: 10 ,
	b: 20
} } } ;

screen.fill( clear ) ;

var blue = termkit.ScreenBufferHD.create( { dst: screen , width: 12 , height: 6 } ) ;

blue.fill( { attr: { bgColor: {
	r: 130 ,
	g: 100 ,
	b: 200 ,
	a: 125
} } } ) ;

blue.x = 8 ;
blue.y = 4 ;

var red = termkit.ScreenBufferHD.create( { dst: screen , width: 12 , height: 6 } ) ;

red.fill( { attr: { bgColor: {
	r: 230 ,
	g: 100 ,
	b: 0 ,
	a: 125
} } } ) ;

red.x = 11 ;
red.y = 18 ;

var green = termkit.ScreenBufferHD.create( { dst: screen , width: 12 , height: 6 } ) ;

green.fill( { attr: { bgColor: {
	r: 130 ,
	g: 200 ,
	b: 80 ,
	a: 125
} } } ) ;

green.x = 26 ;
green.y = 5 ;

var blendingOpt = {
	opacity: 0.9 ,
	//fn: termkit.ScreenBufferHD.blendFn.multiply
	//fn: termkit.ScreenBufferHD.blendFn.screen
	//fn: termkit.ScreenBufferHD.blendFn.overlay
	//fn: termkit.ScreenBufferHD.blendFn.hardLight
	//fn: termkit.ScreenBufferHD.blendFn.softLight
} ;

var redBlending = tree.extend( { own: true } , {} , blendingOpt ) ;
var greenBlending = tree.extend( { own: true } , {} , blendingOpt ) ;
var blueBlending = tree.extend( { own: true } , {} , blendingOpt ) ;



var moved = 0 ;

function moveRedraw() {
	green.x -- ;
	red.y -= 0.5 ;
	redBlending.opacity += ( moved % 11 - 5 ) / 40 ;
	greenBlending.opacity += ( moved % 9 - 4 ) / 30 ;
	blueBlending.opacity += ( moved % 7 - 3 ) / 20 ;
	
	// Clear the screen
	screen.fill( clear ) ;
	
	blue.draw( { blending: blueBlending } ) ;
	green.draw( { blending: greenBlending } ) ;
	red.draw( { blending: redBlending } ) ;
	
	screen.draw( { delta: true } ) ;
	
	if ( ++ moved <= 35 ) {
		setTimeout( moveRedraw , 80 ) ;
	}
	else {
		term.hideCursor( false ) ;
		term.fullscreen( false ) ;
		term.styleReset() ;
	}
}

term.hideCursor() ;
term.fullscreen() ;

moveRedraw() ;


