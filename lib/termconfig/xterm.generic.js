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



var tree = require( 'tree-kit' ) ;
var xterm = require( './xterm.js' ) ;



// Fail-safe xterm-compatible

var esc = tree.extend( null , Object.create( xterm.esc ) , {

	// KDE Konsole does not support that. This workaround use up()/down() & column(1)
	nextLine: { on: '\x1b[%UB\x1b[1G' } ,
	previousLine: { on: '\x1b[%UA\x1b[1G' } ,

	// Cursor styles

	// Try that sequences for instance, if it fails gracefully, it will be kept
	// Xterm sequences fail and write garbage
	blockCursor: { on: '\x1b]50;CursorShape=0\x07' } ,
	blinkingBlockCursor: { on: '\x1b]50;CursorShape=0\x07' } ,
	underlineCursor: { on: '\x1b]50;CursorShape=2\x07' } ,
	blinkingUnderlineCursor: { on: '\x1b]50;CursorShape=2\x07' } ,
	beamCursor: { on: '\x1b]50;CursorShape=1\x07' } ,
	blinkingBeamCursor: { on: '\x1b]50;CursorShape=1\x07' }

	// Disabled version
	/*
	blockCursor: { on: '' } ,
	blinkingBlockCursor: { on: '' } ,
	underlineCursor: { on: '' } ,
	blinkingUnderlineCursor: { on: '' } ,
	beamCursor: { on: '' } ,
	blinkingBeamCursor: { on: '' }
	*/
} ) ;





/* Key Mapping */



var keymap = Object.create( xterm.keymap ) ;





/* Handlers */



var handler = Object.create( xterm.handler ) ;





module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: handler ,
	support: {
		deltaEscapeSequence: true ,
		"256colors": false ,
		"24bitsColors": false ,	// DEPRECATED
		"trueColor": false
	} ,
	colorRegister: require( '../colorScheme/vga.json' )
} ;

