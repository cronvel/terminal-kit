/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
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



var tree = require( 'tree-kit' ) ;
var xterm = require( './xterm.js' ) ;



var esc = tree.extend( null , Object.create( xterm.esc ) , {
	
	// Cursor styles
	
	// Looks like a no go, gnome-terminal is too stubborn to let the application decide about that
	blockCursor: { on: '' } ,
	blinkingBlockCursor: { on: '' } ,
	underlineCursor: { on: '' } ,
	blinkingUnderlineCursor: { on: '' } ,
	beamCursor: { on: '' } ,
	blinkingBeamCursor: { on: '' }
	
	/*
	blockCursor: { on: '\x1b]50;CursorShape=0\x07' } ,
	blinkingBlockCursor: { on: '\x1b]50;CursorShape=0\x07' } ,
	underlineCursor: { on: '\x1b]50;CursorShape=2\x07' } ,
	blinkingUnderlineCursor: { on: '\x1b]50;CursorShape=2\x07' } ,
	beamCursor: { on: '\x1b]50;CursorShape=1\x07' } ,
	blinkingBeamCursor: { on: '\x1b]50;CursorShape=1\x07' }
	*/
} ) ;





var keymap = Object.create( xterm.keymap ) ;
var handler = Object.create( xterm.handler ) ;



var colorRegister = [
	{ r: 0, g: 0, b: 0 } ,
	{ r: 204, g: 0, b: 0 } ,
	{ r: 78, g: 154, b: 6 } ,
	{ r: 196, g: 160, b: 0 } ,
	{ r: 52, g: 101, b: 164 } ,
	{ r: 117, g: 80, b: 123 } ,
	{ r: 6, g: 152, b: 154 } ,
	{ r: 211, g: 215, b: 207 } ,
	{ r: 85, g: 87, b: 83 } ,
	{ r: 239, g: 41, b: 41 } ,
	{ r: 138, g: 226, b: 52 } ,
	{ r: 252, g: 233, b: 79 } ,
	{ r: 114, g: 159, b: 207 } ,
	{ r: 173, g: 127, b: 168 } ,
	{ r: 52, g: 226, b: 226 } ,
	{ r: 238, g: 238, b: 236 }
] ;



module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: handler ,
	colorRegister: colorRegister
} ;

