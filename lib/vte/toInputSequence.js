/*
	Terminal Kit

	Copyright (c) 2009 - 2019 Cédric Ronvel

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



exports.specialKeys = {
	/*
		From the Xterm config (lib/termconfig/xterm.js).
		When multiple keys exist, the chosen one is (by order of preference):
			- ultimately the sequence that avoid overlapping
			- the more consistent sequence
			- the actual Gnome-terminal sequence
			- the actual Xterm sequence
	*/
	
	ESCAPE: '\x1b' ,
	TAB: '\x09' ,
	ENTER: '\x0d' ,

	SHIFT_TAB: '\x1b[Z' ,
	ALT_TAB: '\x1b\x09' ,	// Also CTRL_ALT_I, most of time it is grabbed by the window manager before reaching the terminal
	ALT_ENTER: '\x1b\x0d' ,

	UP: '\x1bOA' ,
	DOWN: '\x1bOB' ,
	RIGHT: '\x1bOC' ,
	LEFT: '\x1bOD' ,

	SHIFT_UP: '\x1b[1;2A' ,
	SHIFT_DOWN: '\x1b[1;2B' ,
	SHIFT_RIGHT: '\x1b[1;2C' ,
	SHIFT_LEFT: '\x1b[1;2D' ,
	ALT_UP: '\x1b[1;3A' ,
	ALT_DOWN: '\x1b[1;3B' ,
	ALT_RIGHT: '\x1b[1;3C' ,
	ALT_LEFT: '\x1b[1;3D' ,
	CTRL_UP: '\x1b[1;5A' ,
	CTRL_DOWN: '\x1b[1;5B' ,
	CTRL_RIGHT: '\x1b[1;5C' ,
	CTRL_LEFT: '\x1b[1;5D' ,

	BACKSPACE: '\x7f' ,
	INSERT: '\x1b[2~' ,
	DELETE: '\x1b[3~' ,
	HOME: '\x1b[1~' ,
	END: '\x1b[4~' ,
	PAGE_UP: '\x1b[5~' ,
	PAGE_DOWN: '\x1b[6~' ,

	CTRL_BACKSPACE: '\x08' ,
	CTRL_INSERT: '\x1b[2;5~' ,
	CTRL_DELETE: '\x1b[3;5~' ,
	CTRL_HOME: '\x1b[1;5~' ,
	CTRL_END: '\x1b[4;5~' ,
	CTRL_PAGE_UP: '\x1b[5;5~' ,
	CTRL_PAGE_DOWN: '\x1b[6;5~' ,

	SHIFT_INSERT: '\x1b[2;2~' ,
	SHIFT_DELETE: '\x1b[3;2~' ,
	SHIFT_HOME: '\x1b[1;2~' ,
	SHIFT_END: '\x1b[4;2~' ,
	SHIFT_PAGE_UP: '\x1b[5;2~' ,
	SHIFT_PAGE_DOWN: '\x1b[6;2~' ,

	ALT_BACKSPACE: '\x1b\x7f' ,
	ALT_INSERT: '\x1b[2;3~' ,
	ALT_DELETE: '\x1b[3;3~' ,
	ALT_HOME: '\x1b[1;3~' ,
	ALT_END: '\x1b[4;3~' ,
	ALT_PAGE_UP: '\x1b[5;3~' ,
	ALT_PAGE_DOWN: '\x1b[6;3~' ,

	// Application Keypad
	/*
	KP_NUMLOCK: [] ,	// '\x1bOP' ,
	KP_DIVIDE: '\x1bOo' ,
	KP_MULTIPLY: '\x1bOj' ,
	KP_MINUS: '\x1bOm' ,
	KP_0: [] ,	// '\x1b[2~' ,
	KP_1: [] ,	// '\x1bOF' ,
	KP_2: [] ,	// '\x1b[B' ,
	KP_3: [] ,	// '\x1b[6~' ,
	KP_4: [] ,	// '\x1b[D' ,
	KP_5: [ '\x1bOE' , '\x1b[E' ] ,
	KP_6: [] ,	// '\x1b[C' ,
	KP_7: [] ,	// '\x1bOH' ,
	KP_8: [] ,	// '\x1b[A' ,
	KP_9: [] ,	// '\x1b[5~' ,
	KP_PLUS: '\x1bOk' ,
	KP_DELETE: [] ,	// '\x1b[3~' ,
	KP_ENTER: '\x1bOM' ,
	*/

	F1: '\x1bOP' ,
	F2: '\x1bOQ' ,
	F3: '\x1bOR' ,
	F4: '\x1bOS' ,
	F5: '\x1b[15~' ,
	F6: '\x1b[17~' ,
	F7: '\x1b[18~' ,
	F8: '\x1b[19~' ,
	F9: '\x1b[20~' ,
	F10: '\x1b[21~' ,
	F11: '\x1b[23~' ,
	F12: '\x1b[24~' ,

	SHIFT_F1: '\x1bO1;2P' ,
	SHIFT_F2: '\x1bO1;2Q' ,
	SHIFT_F3: '\x1bO1;2R' ,
	SHIFT_F4: '\x1bO1;2S' ,
	SHIFT_F5: '\x1b[15;2~' ,
	SHIFT_F6: '\x1b[17;2~' ,
	SHIFT_F7: '\x1b[18;2~' ,
	SHIFT_F8: '\x1b[19;2~' ,
	SHIFT_F9: '\x1b[20;2~' ,
	SHIFT_F10: '\x1b[21;2~' ,
	SHIFT_F11: '\x1b[23;2~' ,
	SHIFT_F12: '\x1b[24;2~' ,

	CTRL_F1: '\x1bO1;5P' ,
	CTRL_F2: '\x1bO1;5Q' ,
	CTRL_F3: '\x1bO1;5R' ,	// '\x1b[1;5R' is also used for cursor location response... :/
	CTRL_F4: '\x1bO1;5S' ,
	CTRL_F5: '\x1b[15;5~' ,
	CTRL_F6: '\x1b[17;5~' ,
	CTRL_F7: '\x1b[18;5~' ,
	CTRL_F8: '\x1b[19;5~' ,
	CTRL_F9: '\x1b[20;5~' ,
	CTRL_F10: '\x1b[21;5~' ,
	CTRL_F11:'\x1b[23;5~' ,
	CTRL_F12: '\x1b[24;5~' ,

	CTRL_SHIFT_F1: '\x1bO1;6P' ,
	CTRL_SHIFT_F2: '\x1bO1;6Q' ,
	CTRL_SHIFT_F3: '\x1bO1;6R' ,
	CTRL_SHIFT_F4: '\x1bO1;6S' ,
	CTRL_SHIFT_F5: '\x1b[15;6~' ,
	CTRL_SHIFT_F6: '\x1b[17;6~' ,
	CTRL_SHIFT_F7: '\x1b[18;6~' ,
	CTRL_SHIFT_F8: '\x1b[19;6~' ,
	CTRL_SHIFT_F9: '\x1b[20;6~' ,
	CTRL_SHIFT_F10: '\x1b[21;6~' ,
	CTRL_SHIFT_F11: '\x1b[23;6~' ,
	CTRL_SHIFT_F12: '\x1b[24;6~' ,

	NUL: '\x00' ,

	//CTRL_SPACE: '\x00' ,	// also NUL
	ALT_SPACE: '\x1b ' ,
	CTRL_ALT_SPACE: '\x1b\x00'
} ;



/*
exports.specialEvents = {
	CURSOR_LOCATION: {
		starter: '\x1b[' , ender: 'R' , event: 'terminal' , handler: 'cursorLocation'
	} ,
	SCREEN_SIZE: {
		starter: '\x1b[8;' , ender: 't' , event: 'terminal' , handler: 'screenSize'
	} ,
	COLOR_REGISTER: {
		starter: '\x1b]4;' , ender: '\x07' , event: 'terminal' , handler: 'colorRegister'
	} ,

	FOCUS_IN: { code: '\x1b[I' , event: 'terminal' , data: {} } ,
	FOCUS_OUT: { code: '\x1b[O' , event: 'terminal' , data: {} } ,

	MOUSE: [
		{ code: '\x1b[<' , event: 'mouse' , handler: 'mouseSGRProtocol' } ,
		{ code: '\x1b[M' , event: 'mouse' , handler: 'mouseX11Protocol' }
	]
} ;
*/

/*
	ESCAPE: '\x1b' ,
	TAB: '\x09' ,
	ENTER: '\x0d' ,

	SHIFT_TAB: '\x1b[Z' ,
	ALT_TAB: '\x1b\x09' ,	// Also CTRL_ALT_I, most of time it is grabbed by the window manager before reaching the terminal
	ALT_ENTER: '\x1b\x0d' ,

	UP: [ '\x1bOA' , '\x1b[A' ] ,
	DOWN: [ '\x1bOB' , '\x1b[B' ] ,
	RIGHT: [ '\x1bOC' , '\x1b[C' ] ,
	LEFT: [ '\x1bOD' , '\x1b[D' ] ,

	SHIFT_UP: '\x1b[1;2A' ,
	SHIFT_DOWN: '\x1b[1;2B' ,
	SHIFT_RIGHT: '\x1b[1;2C' ,
	SHIFT_LEFT: '\x1b[1;2D' ,
	ALT_UP: '\x1b[1;3A' ,
	ALT_DOWN: '\x1b[1;3B' ,
	ALT_RIGHT: '\x1b[1;3C' ,
	ALT_LEFT: '\x1b[1;3D' ,
	CTRL_UP: '\x1b[1;5A' ,
	CTRL_DOWN: '\x1b[1;5B' ,
	CTRL_RIGHT: '\x1b[1;5C' ,
	CTRL_LEFT: '\x1b[1;5D' ,

	//BACKSPACE: '\x7f' ,
	BACKSPACE: [ '\x7f' , '\x08' ] ,	// Most terminal use \x08 for Ctrl-backspace, except Terminology...
	INSERT: '\x1b[2~' ,
	DELETE: '\x1b[3~' ,
	HOME: [ '\x1b[1~' , '\x1b[H' , '\x1bOH' ] ,
	END: [ '\x1b[4~' , '\x1b[F' , '\x1bOF' ] ,
	PAGE_UP: '\x1b[5~' ,
	PAGE_DOWN: '\x1b[6~' ,

	//CTRL_BACKSPACE: '\x08' ,
	CTRL_INSERT: '\x1b[2;5~' ,
	CTRL_DELETE: '\x1b[3;5~' ,
	CTRL_HOME: [ '\x1b[1;5~' , '\x1b[1;5H' ] ,
	CTRL_END: [ '\x1b[4;5~' , '\x1b[1;5F' ] ,
	CTRL_PAGE_UP: '\x1b[5;5~' ,
	CTRL_PAGE_DOWN: '\x1b[6;5~' ,

	SHIFT_INSERT: '\x1b[2;2~' ,
	SHIFT_DELETE: '\x1b[3;2~' ,
	SHIFT_HOME: [ '\x1b[1;2~' , '\x1b[1;2H' ] ,
	SHIFT_END: [ '\x1b[4;2~' , '\x1b[1;2F' ] ,
	SHIFT_PAGE_UP: '\x1b[5;2~' ,
	SHIFT_PAGE_DOWN: '\x1b[6;2~' ,

	ALT_BACKSPACE: [ '\x1b\x7f' , '\x1b\x08' ] ,
	ALT_INSERT: '\x1b[2;3~' ,
	ALT_DELETE: '\x1b[3;3~' ,
	ALT_HOME: [ '\x1b[1;3~' , '\x1b[1;3H' ] ,
	ALT_END: [ '\x1b[4;3~' , '\x1b[1;3F' ] ,
	ALT_PAGE_UP: '\x1b[5;3~' ,
	ALT_PAGE_DOWN: '\x1b[6;3~' ,

	// Application Keypad
	KP_NUMLOCK: [] ,	// '\x1bOP' ,
	KP_DIVIDE: '\x1bOo' ,
	KP_MULTIPLY: '\x1bOj' ,
	KP_MINUS: '\x1bOm' ,
	KP_0: [] ,	// '\x1b[2~' ,
	KP_1: [] ,	// '\x1bOF' ,
	KP_2: [] ,	// '\x1b[B' ,
	KP_3: [] ,	// '\x1b[6~' ,
	KP_4: [] ,	// '\x1b[D' ,
	KP_5: [ '\x1bOE' , '\x1b[E' ] ,
	KP_6: [] ,	// '\x1b[C' ,
	KP_7: [] ,	// '\x1bOH' ,
	KP_8: [] ,	// '\x1b[A' ,
	KP_9: [] ,	// '\x1b[5~' ,
	KP_PLUS: '\x1bOk' ,
	KP_DELETE: [] ,	// '\x1b[3~' ,
	KP_ENTER: '\x1bOM' ,

	F1: '\x1bOP' ,
	F2: '\x1bOQ' ,
	F3: '\x1bOR' ,
	F4: '\x1bOS' ,
	F5: '\x1b[15~' ,
	F6: '\x1b[17~' ,
	F7: '\x1b[18~' ,
	F8: '\x1b[19~' ,
	F9: '\x1b[20~' ,
	F10: '\x1b[21~' ,
	F11: [ '\x1b[23~' , '\x1b[22~' ] ,
	F12: '\x1b[24~' ,

	SHIFT_F1: [ '\x1bO1;2P' , '\x1bO2P' , '\x1b[1;2P' ] ,
	SHIFT_F2: [ '\x1bO1;2Q' , '\x1bO2Q' , '\x1b[1;2Q' ] ,
	SHIFT_F3: [ '\x1bO1;2R' , '\x1bO2R' , '\x1b[1;2R' ] ,
	SHIFT_F4: [ '\x1bO1;2S' , '\x1bO2S' , '\x1b[1;2S' ] ,
	SHIFT_F5: '\x1b[15;2~' ,
	SHIFT_F6: '\x1b[17;2~' ,
	SHIFT_F7: '\x1b[18;2~' ,
	SHIFT_F8: '\x1b[19;2~' ,
	SHIFT_F9: '\x1b[20;2~' ,
	SHIFT_F10: '\x1b[21;2~' ,
	SHIFT_F11: [ '\x1b[23;2~' , '\x1b[22;2~' ] ,
	SHIFT_F12: '\x1b[24;2~' ,

	CTRL_F1: [ '\x1bO1;5P' , '\x1bO5P' , '\x1b[1;5P' ] ,
	CTRL_F2: [ '\x1bO1;5Q' , '\x1bO5Q' , '\x1b[1;5Q' ] ,
	CTRL_F3: [ '\x1bO1;5R' , '\x1bO5R' ] ,	// also used for cursor location response... :/
	CTRL_F4: [ '\x1bO1;5S' , '\x1bO5S' , '\x1b[1;5S' ] ,
	CTRL_F5: '\x1b[15;5~' ,
	CTRL_F6: '\x1b[17;5~' ,
	CTRL_F7: '\x1b[18;5~' ,
	CTRL_F8: '\x1b[19;5~' ,
	CTRL_F9: '\x1b[20;5~' ,
	CTRL_F10: '\x1b[21;5~' ,
	CTRL_F11: [ '\x1b[23;5~' , '\x1b[22;5~' ] ,
	CTRL_F12: '\x1b[24;5~' ,

	CTRL_SHIFT_F1: [ '\x1bO1;6P' , '\x1bO6P' , '\x1b[1;6P' ] ,
	CTRL_SHIFT_F2: [ '\x1bO1;6Q' , '\x1bO6Q' , '\x1b[1;6Q' ] ,
	CTRL_SHIFT_F3: [ '\x1bO1;6R' , '\x1bO6R' ] ,	// also used for cursor location response... :/
	CTRL_SHIFT_F4: [ '\x1bO1;6S' , '\x1bO6S' , '\x1b[1;6S' ] ,
	CTRL_SHIFT_F5: '\x1b[15;6~' ,
	CTRL_SHIFT_F6: '\x1b[17;6~' ,
	CTRL_SHIFT_F7: '\x1b[18;6~' ,
	CTRL_SHIFT_F8: '\x1b[19;6~' ,
	CTRL_SHIFT_F9: '\x1b[20;6~' ,
	CTRL_SHIFT_F10: '\x1b[21;6~' ,
	CTRL_SHIFT_F11: [ '\x1b[23;6~' , '\x1b[22;6~' ] ,
	CTRL_SHIFT_F12: '\x1b[24;6~' ,

	NUL: '\x00' ,

	//CTRL_SPACE: '\x00' ,	// also NUL
	ALT_SPACE: '\x1b ' ,
	CTRL_ALT_SPACE: '\x1b\x00' ,

	CURSOR_LOCATION: {
		starter: '\x1b[' , ender: 'R' , event: 'terminal' , handler: 'cursorLocation'
	} ,
	SCREEN_SIZE: {
		starter: '\x1b[8;' , ender: 't' , event: 'terminal' , handler: 'screenSize'
	} ,
	COLOR_REGISTER: {
		starter: '\x1b]4;' , ender: '\x07' , event: 'terminal' , handler: 'colorRegister'
	} ,

	FOCUS_IN: { code: '\x1b[I' , event: 'terminal' , data: {} } ,
	FOCUS_OUT: { code: '\x1b[O' , event: 'terminal' , data: {} } ,

	MOUSE: [
		{ code: '\x1b[<' , event: 'mouse' , handler: 'mouseSGRProtocol' } ,
		{ code: '\x1b[M' , event: 'mouse' , handler: 'mouseX11Protocol' }
	]
*/

