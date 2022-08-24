/*
	Terminal Kit

	Copyright (c) 2009 - 2022 Cédric Ronvel

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
const xterm256Generic = require( './xterm-256color.generic.js' ) ;



const keymap = tree.extend( null , Object.create( xterm256Generic.keymap ) , {
	UP: '\x1b[A' ,
	DOWN: '\x1b[B' ,
	RIGHT: '\x1b[C' ,
	LEFT: '\x1b[D' ,
	BACKSPACE: '\x7f' ,
	SHIFT_F1: '\x1b[1;2P' ,
	SHIFT_F2: '\x1b[1;2Q' ,
	SHIFT_F3: '\x1b[1;2R' ,
	SHIFT_F4: '\x1b[1;2S' ,
	CTRL_F1: '\x1bOP' ,
	CTRL_F2: '\x1bOQ' ,
	CTRL_F3: '\x1bOR' ,
	CTRL_F4: '\x1bOS' ,
	CTRL_F5: '\x1b[15~' ,
	CTRL_F6: '\x1b[17~' ,
	CTRL_F7: '\x1b[18~' ,
	CTRL_F8: '\x1b[19~' ,
	CTRL_F9: '\x1b[20~' ,
	CTRL_F10: '\x1b[21~' ,
	CTRL_F11: '\x1b[23~' ,
	CTRL_F12: '\x1b[24~' ,
	CTRL_SHIFT_F1: '\x1bOP' ,
	CTRL_SHIFT_F2: '\x1bOQ' ,
	CTRL_SHIFT_F3: '\x1bOR' ,
	CTRL_SHIFT_F4: '\x1bOS' ,
	CTRL_SHIFT_F5: '\x1b[15~' ,
	CTRL_SHIFT_F6: '\x1b[17~' ,
	CTRL_SHIFT_F7: '\x1b[18~' ,
	CTRL_SHIFT_F8: '\x1b[19~' ,
	CTRL_SHIFT_F9: '\x1b[20~' ,
	CTRL_SHIFT_F10: '\x1b[21~' ,
	CTRL_SHIFT_F11: '\x1b[23~' ,
	CTRL_SHIFT_F12: '\x1b[24~' ,
	ALT_UP: '\x1b\x1b[A' ,
	ALT_DOWN: '\x1b\x1b[B' ,
	ALT_RIGHT: '\x1b\x1b[C' ,
	ALT_LEFT: '\x1b\x1b[D'
	//SHIFT_DELETE: '\x7f' ,
	//ALT_BACKSPACE: '\x7f' ,
	//ALT_TAB: '\x09' ,
	//CTRL_ALT_SPACE: ' ' ,

	/*
	ALT_A: '\xc3\xa5' ,
	CTRL_ALT_A: '\x01' ,
	ALT_SHIFT_A: '\xc3\x85' ,
	ALT_B: '\xe2\x88\xab' ,
	CTRL_ALT_B: '\x02' ,
	ALT_SHIFT_B: '\xc4\xb1' ,
	ALT_C: '\xc3\xa7' ,
	CTRL_ALT_C: '\x03' ,
	ALT_SHIFT_C: '\xc3\x87' ,
	ALT_D: '\xe2\x88\x82' ,
	CTRL_ALT_D: '\x04' ,
	ALT_SHIFT_D: '\xc3\x8e' ,
	ALT_E: '\xc2\xb4' ,
	CTRL_ALT_E: '\x05' ,
	ALT_SHIFT_E: '\xc2\xb4' ,
	ALT_F: '\xc6\x92' ,
	CTRL_ALT_F: '\x06' ,
	ALT_SHIFT_F: '\xc3\x8f' ,
	ALT_G: '\xc2\xa9' ,
	CTRL_ALT_G: '\x07' ,
	ALT_SHIFT_G: '\xcb\x9d' ,
	ALT_H: '\xcb\x99' ,
	CTRL_ALT_H: '\x08' ,
	ALT_SHIFT_H: '\xc3\x93' ,
	ALT_I: '\xcb\x86' ,
	CTRL_ALT_I: '\x09' ,
	ALT_SHIFT_I: '\xcb\x86' ,
	ALT_J: '\xe2\x88\x86' ,
	CTRL_ALT_J: '\x0a' ,
	ALT_SHIFT_J: '\xc3\x94' ,
	ALT_K: '\xcb\x9a' ,
	CTRL_ALT_K: '\x0b' ,
	ALT_SHIFT_K: '\xef\xa3\xbf' ,
	ALT_L: '\xc2\xac' ,
	CTRL_ALT_L: '\x0c' ,
	ALT_SHIFT_L: '\xc3\x92' ,
	ALT_M: '\xc2\xb5' ,
	ALT_SHIFT_M: '\xc3\x82' ,
	ALT_N: '\xcb\x9c' ,
	CTRL_ALT_N: '\x0e' ,
	ALT_SHIFT_N: '\xcb\x9c' ,
	ALT_O: '\xc3\xb8' ,
	CTRL_ALT_O: '\x0f' ,
	ALT_SHIFT_O: '\xc3\x98' ,
	ALT_P: '\xcf\x80' ,
	CTRL_ALT_P: '\x10' ,
	ALT_SHIFT_P: '\xe2\x88\x8f' ,
	ALT_Q: '\xc5\x93' ,
	CTRL_ALT_Q: '\x11' ,
	ALT_SHIFT_Q: '\xc5\x92' ,
	ALT_R: '\xc2\xae' ,
	CTRL_ALT_R: '\x12' ,
	ALT_SHIFT_R: '\xe2\x80\xb0' ,
	ALT_S: '\xc3\x9f' ,
	CTRL_ALT_S: '\x13' ,
	ALT_SHIFT_S: '\xc3\x8d' ,
	ALT_T: '\xe2\x80\xa0' ,
	CTRL_ALT_T: '\x14' ,
	ALT_SHIFT_T: '\xcb\x87' ,
	ALT_U: '\xc2\xa8' ,
	CTRL_ALT_U: '\x15' ,
	ALT_SHIFT_U: '\xc2\xa8' ,
	ALT_V: '\xe2\x88\x9a' ,
	CTRL_ALT_V: '\x16' ,
	ALT_SHIFT_V: '\xe2\x97\x8a' ,
	ALT_W: '\xe2\x88\x91' ,
	ALT_SHIFT_W: '\xe2\x80\x9e' ,
	ALT_X: '\xe2\x89\x88' ,
	CTRL_ALT_X: '\x18' ,
	ALT_SHIFT_X: '\xcb\x9b' ,
	ALT_Y: '\\' ,
	CTRL_ALT_Y: '\x19' ,
	ALT_SHIFT_Y: '\xc3\x81' ,
	ALT_Z: '\xce\xa9' ,
	CTRL_ALT_Z: '\x1a' ,
	ALT_SHIFT_Z: '\xc2\xb8'
	*/
} ) ;



module.exports = {
	esc: Object.create( xterm256Generic.esc ) ,
	keymap: keymap ,
	// keymap: keymap ,
	handler: Object.create( xterm256Generic.handler ) ,
	support: {
		deltaEscapeSequence: true ,
		"256colors": true ,
		"24bitsColors": undefined ,	// DEPRECATED
		"trueColor": undefined	// maybe, maybe not
	} ,
	colorRegister: require( '../colorScheme/gnome.json' )
} ;

