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



const tree = require( 'tree-kit' ) ;
const xterm256 = require( './xterm-256color.js' ) ;



// Remove colors
const defaultColor = '\x1b[39m' ; // back to the default color, most of time it is the same than .white
const bgDefaultColor = '\x1b[49m' ;   // back to the default color, most of time it is the same than .bgBlack



const esc = tree.extend( null , Object.create( xterm256.esc ) , {
	// 24 bits colors
	color24bits: { on: '\x1b[38;2;%u;%u;%um' , off: defaultColor , optimized: ( r , g , b ) => '\x1b[38;2;' + r + ';' + g + ';' + b + 'm' } ,
	bgColor24bits: { on: '\x1b[48;2;%u;%u;%um' , off: bgDefaultColor , optimized: ( r , g , b ) => '\x1b[48;2;' + r + ';' + g + ';' + b + 'm' } ,

	// Cursor styles not supported
	blockCursor: { on: '' , na: true } ,
	blinkingBlockCursor: { on: '' , na: true } ,
	underlineCursor: { on: '' , na: true } ,
	blinkingUnderlineCursor: { on: '' , na: true } ,
	beamCursor: { on: '' , na: true } ,
	blinkingBeamCursor: { on: '' , na: true }
} ) ;





const keymap = Object.create( xterm256.keymap ) ;
const handler = Object.create( xterm256.handler ) ;



module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: handler ,
	support: {
		deltaEscapeSequence: true ,
		"256colors": true ,
		"24bitsColors": true ,	// DEPRECATED
		"trueColor": true
	} ,
	colorRegister: require( '../colorScheme/atomic-terminal.json' )
} ;

