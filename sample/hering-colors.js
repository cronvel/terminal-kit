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

// 4 primary colors
const colors = {
	// Primary red
	red: 'e10718' ,
	rry: 'ed420e' ,
	ry: 'fa8116' ,
	yyr: 'fea918' ,
	
	// Primary yellow
	yellow: 'fdca19' ,
	yyg: 'ffe919' ,
	yg: 'cfde3d' ,
	ggy: '7ebd3a' ,
	
	// Primary green
	green: '009c5f' ,
	ggb: '008b78' ,
	gb: '00748b' ,
	bbg: '015a9c' ,
	
	// Primary blue
	blue: '4548a5' ,
	bbr: '512d85' ,
	br: '7b1760' ,
	rrb: 'a81e51' ,
} ;



var i , r , g , b ;


term.bold( '\n=== Hering colors 24 bits ===\n\n' ) ;

Object.keys( colors ).forEach( color => {
	term.bgColorRgbHex( colors[ color ] , '  ' ) ;
} ) ;

term.styleReset( '\n' ) ;



term.bold( '\n=== Hering colors 256 colors ===\n\n' ) ;

Object.keys( colors ).forEach( color => {
	var rgba = termkit.hexToRgba( colors[ color ]  ) ;
	
	// Convert to 0..5 range
	var r = Math.floor( rgba.r * 6 / 256 + 2 * Number.EPSILON ) ;
	var g = Math.floor( rgba.g * 6 / 256 + 2 * Number.EPSILON ) ;
	var b = Math.floor( rgba.b * 6 / 256 + 2 * Number.EPSILON ) ;
	var c = Math.floor( 16 + r * 36 + g * 6 + b ) ;
	
	term.bgColor256( c , '  ' ) ;
} ) ;

term.styleReset( '\n' ) ;



term.bold( '\n=== 256 RGB matching, 24 bits, 256 HSL matching ===\n\n' ) ;

// RGB
Object.keys( colors ).forEach( color => {
	var rgba = termkit.hexToRgba( colors[ color ]  ) ;
	
	// Convert to 0..5 range
	var r = Math.floor( rgba.r * 6 / 256 + 2 * Number.EPSILON ) ;
	var g = Math.floor( rgba.g * 6 / 256 + 2 * Number.EPSILON ) ;
	var b = Math.floor( rgba.b * 6 / 256 + 2 * Number.EPSILON ) ;
	var c = Math.floor( 16 + r * 36 + g * 6 + b ) ;
	
	term.bgColor256( c , '  ' ) ;
} ) ;

term.styleReset( '\n' ) ;

Object.keys( colors ).forEach( color => {
	term.bgColorRgbHex( colors[ color ] , '  ' ) ;
} ) ;

term.styleReset( '\n' ) ;

// HSL
Object.keys( colors ).forEach( color => {
	var rgba = termkit.hexToRgba( colors[ color ]  ) ;
	var c = term.registerForRgb( rgba , 16 , 255 , 1 ) ;
	term.bgColor256( c , '  ' ) ;
} ) ;

term.styleReset( '\n' ) ;



const colors256 = {
	ry: {r:5,g:2,b:0} ,
	green: {r:1,g:4,b:1} ,
	blue: {r:0,g:1,b:4} ,
	//bbr: {r:1,g:0,b:3} ,
	gb: {r:0,g:3,b:3} ,
} ;

term.bold( '\n=== RGB 0..5 ===\n\n' ) ;

Object.keys( colors ).forEach( color => {
	var rgba = termkit.hexToRgba( colors[ color ]  ) ;
	
	// Convert to 0..5 range
	var rFloat = rgba.r * 6 / 256 ;
	var gFloat = rgba.g * 6 / 256 ;
	var bFloat = rgba.b * 6 / 256 ;
	var r = Math.floor( rgba.r * 6 / 256 + 2 * Number.EPSILON ) ;
	var g = Math.floor( rgba.g * 6 / 256 + 2 * Number.EPSILON ) ;
	var b = Math.floor( rgba.b * 6 / 256 + 2 * Number.EPSILON ) ;
	var c = Math.floor( 16 + r * 36 + g * 6 + b ) ;
	term.bgColor256( c , '  ' ) ;
	term.bgColorRgbHex( colors[ color ] , '  ' ) ;
	
	if ( colors256[ color ] ) {
		var c2 = Math.floor( 16 + colors256[ color ].r * 36 + colors256[ color ].g * 6 + colors256[ color ].b ) ;
		term.bgColor256( c2 , '  ' ) ;
		term( " %s: %f %f %f -> %f %f %f" , color , r , g , b , colors256[ color ].r , colors256[ color ].g , colors256[ color ].b ) ;
	}
	else {
		term.bgColor256( c , '  ' ) ;
		term( " %s: %f %f %f" , color , r , g , b ) ;
	}
	
	term.column( 35 , "(%f %f %f)" , rFloat , gFloat , bFloat ) ;
	
	term ( '\n' ) ;
} ) ;

term.styleReset( '\n' ) ;

// Reset before exiting...

term.styleReset( '\n' ) ;
term( 'Reset...\n' ) ;

