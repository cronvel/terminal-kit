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



// Control char (not escape sequence)
exports.control = {
	'\\x07': { event: 'bell' } ,

	// Looks like it just moves to the left
	//'\\x08': { event: 'edit' , subType: 'backDelete' , extraArgs: [ 1 ] } ,
	'\\x08': { event: 'cursor' , subType: 'left' , extraArgs: [ 1 ] } ,

	'\\x09': { event: 'cursor' , subType: 'tab' } ,
	'\\x0a': { event: 'cursor' , subType: 'lineFeed' } ,
	'\\x0d': { event: 'cursor' , subType: 'carriageReturn' } ,

	// Looks like it does nothing at all
	//'\\x7f': { event: 'edit' , subType: 'delete' , extraArgs: [ 1 ] } ,
	'\\x7f': { event: 'none' }
} ;



// ESC (simple ESC + char sequence)
exports.ESC = {
	'7': { event: 'cursor' , subType: 'save' } ,
	'8': { event: 'cursor' , subType: 'restore' } ,
	'c': { event: 'reset' } ,
	'M': { event: 'edit' , subType: 'reverseLineFeed' }
} ;



// CSI tree (Control Sequence Introducer)
exports.CSI = {
	A: { event: 'cursor' , subType: 'up' , defaultExtraArgs: [ 1 ] } ,
	B: { event: 'cursor' , subType: 'down' , defaultExtraArgs: [ 1 ] } ,
	C: { event: 'cursor' , subType: 'right' , defaultExtraArgs: [ 1 ] } ,
	D: { event: 'cursor' , subType: 'left' , defaultExtraArgs: [ 1 ] } ,
	E: { event: 'cursor' , subType: 'nextLine' , defaultExtraArgs: [ 1 ] } ,
	F: { event: 'cursor' , subType: 'previousLine' , defaultExtraArgs: [ 1 ] } ,
	G: { event: 'cursor' , subType: 'column' } ,
	H: { event: 'cursor' , subType: 'moveToYX' , defaultExtraArgs: [ 1 , 1 ] } ,

	J: {
		event: 'edit' ,
		subType: 'eraseDisplay' ,
		arg: 'after' ,
		subTree: {
			'0': { arg: 'after' } ,
			'1': { arg: 'before' } ,
			'2': { arg: 'display' }
		}
	} ,

	K: {
		event: 'edit' ,
		subType: 'eraseLine' ,
		arg: 'after' ,
		subTree: {
			'0': { arg: 'after' } ,
			'1': { arg: 'before' } ,
			'2': { arg: 'line' }
		}
	} ,

	L: { event: 'edit' , subType: 'insertLine' , defaultExtraArgs: [ 1 ] } ,
	M: { event: 'edit' , subType: 'deleteLine' , defaultExtraArgs: [ 1 ] } ,

	P: { event: 'edit' , subType: 'delete' , defaultExtraArgs: [ 1 ] } ,
	S: { event: 'edit' , subType: 'vScrollUp' , defaultExtraArgs: [ 1 ] } ,
	T: { event: 'edit' , subType: 'vScrollDown' , defaultExtraArgs: [ 1 ] } ,
	X: { event: 'edit' , subType: 'erase' , defaultExtraArgs: [ 1 ] } ,

	d: { event: 'cursor' , subType: 'row' } ,

	'?h': {
		event: 'device' ,
		arg: true ,
		subTree: {
			'1000': { subType: 'mouseButton' , continue: true } ,
			'1002': { subType: 'mouseDrag' , continue: true } ,
			'1003': { subType: 'mouseMotion' , continue: true } ,
			'1004': { subType: 'focusEvent' , continue: true } ,
			'1006': { event: 'none' , continue: true } 	// we only support SGR anyway
		}
	} ,
	'?l': {
		// This is the "turn off" counter-part of '?h' type, the subTree is copied from '?h' after the current assignment
		event: 'device' ,
		arg: false ,
		subTree: null
	} ,

	n: {
		// Device status report
		event: 'device' ,
		subTree: {
			'6': { subType: 'cursorLocation' }
		}
	} ,
	'?n': {
		// Device status report (again)
		event: 'device' ,
		subTree: {
			'6': { subType: 'cursorLocation' , arg: true }
		}
	} ,

	m: {
		// Known as SGR (Select Graphic Rendition)
		event: 'attr' ,
		subType: 'reset' ,	// if empty, it is usually a reset
		subTree: {
			'0': { subType: 'reset' , continue: true } ,

			'1': { subType: 'bold' , arg: true , continue: true } ,
			'2': { subType: 'dim' , arg: true , continue: true } ,
			'3': { subType: 'italic' , arg: true , continue: true } ,
			'4': { subType: 'underline' , arg: true , continue: true } ,
			'5': { subType: 'blink' , arg: true , continue: true } ,
			'7': { subType: 'inverse' , arg: true , continue: true } ,
			'8': { subType: 'hidden' , arg: true , continue: true } ,
			'9': { subType: 'strike' , arg: true , continue: true } ,

			'21': { subType: 'bold' , arg: false , continue: true } ,
			'22': { subType: 'noDimNoBold' , continue: true } ,
			'23': { subType: 'italic' , arg: false , continue: true } ,
			'24': { subType: 'underline' , arg: false , continue: true } ,
			'25': { subType: 'blink' , arg: false , continue: true } ,
			'27': { subType: 'inverse' , arg: false , continue: true } ,
			'28': { subType: 'hidden' , arg: false , continue: true } ,
			'29': { subType: 'strike' , arg: false , continue: true } ,

			'30': { subType: 'color' , arg: 'black' , continue: true } ,
			'31': { subType: 'color' , arg: 'red' , continue: true } ,
			'32': { subType: 'color' , arg: 'green' , continue: true } ,
			'33': { subType: 'color' , arg: 'yellow' , continue: true } ,
			'34': { subType: 'color' , arg: 'blue' , continue: true } ,
			'35': { subType: 'color' , arg: 'magenta' , continue: true } ,
			'36': { subType: 'color' , arg: 'cyan' , continue: true } ,
			'37': { subType: 'color' , arg: 'white' , continue: true } ,
			'38': {
				subTree: {
					'2': { subType: 'colorRgb' } ,
					'5': { subType: 'color256' }
				}
			} ,
			'39': { subType: 'color' , arg: 'default' , continue: true } ,

			'40': { subType: 'bgColor' , arg: 'black' , continue: true } ,
			'41': { subType: 'bgColor' , arg: 'red' , continue: true } ,
			'42': { subType: 'bgColor' , arg: 'green' , continue: true } ,
			'43': { subType: 'bgColor' , arg: 'yellow' , continue: true } ,
			'44': { subType: 'bgColor' , arg: 'blue' , continue: true } ,
			'45': { subType: 'bgColor' , arg: 'magenta' , continue: true } ,
			'46': { subType: 'bgColor' , arg: 'cyan' , continue: true } ,
			'47': { subType: 'bgColor' , arg: 'white' , continue: true } ,
			'48': {
				subTree: {
					'2': { subType: 'bgColorRgb' } ,
					'5': { subType: 'bgColor256' }
				}
			} ,
			'49': { subType: 'bgColor' , arg: 'default' , continue: true } ,

			'90': { subType: 'color' , arg: 'gray' , continue: true } ,
			'91': { subType: 'color' , arg: 'brightRed' , continue: true } ,
			'92': { subType: 'color' , arg: 'brightGreen' , continue: true } ,
			'93': { subType: 'color' , arg: 'brightYellow' , continue: true } ,
			'94': { subType: 'color' , arg: 'brightBlue' , continue: true } ,
			'95': { subType: 'color' , arg: 'brightMagenta' , continue: true } ,
			'96': { subType: 'color' , arg: 'brightCyan' , continue: true } ,
			'97': { subType: 'color' , arg: 'brightWhite' , continue: true } ,

			'100': { subType: 'bgColor' , arg: 'gray' , continue: true } ,
			'101': { subType: 'bgColor' , arg: 'brightRed' , continue: true } ,
			'102': { subType: 'bgColor' , arg: 'brightGreen' , continue: true } ,
			'103': { subType: 'bgColor' , arg: 'brightYellow' , continue: true } ,
			'104': { subType: 'bgColor' , arg: 'brightBlue' , continue: true } ,
			'105': { subType: 'bgColor' , arg: 'brightMagenta' , continue: true } ,
			'106': { subType: 'bgColor' , arg: 'brightCyan' , continue: true } ,
			'107': { subType: 'bgColor' , arg: 'brightWhite' , continue: true }
		}
	} ,

	r: { event: 'edit' , subType: 'vScrollingRegion' } ,
	t: {
		event: 'device' ,
		subTree: {
			'18': { subType: 'screenSize' }
		}
	}
} ;

exports.CSI['?l'].subTree = exports.CSI['?h'].subTree ;



// OSC tree (OS Command)
exports.OSC = {
	'0': { event: 'system' , subType: 'setWindowTitle' } ,
	'1': { event: 'system' , subType: 'setIconName' } ,
	'2': { event: 'system' , subType: 'setWindowTitle' } ,
	'4': { event: 'palette' , subType: 'setColor' } ,
	'4?': { event: 'palette' , subType: 'getColor' } ,
	'7': { event: 'system' , subType: 'setCwd' } ,
	'9': { event: 'system' , subType: 'notify' } ,	// iTerm2 growl notification, only a body argument
	'10': { event: 'palette' , subType: 'setDefaultColor' } ,
	'11': { event: 'palette' , subType: 'setDefaultBgColor' } ,
	'12': { event: 'cursorAttr' , subType: 'setColor' } ,
	'17': { event: 'palette' , subType: 'setHighlightBgColor' } ,
	'50': { event: 'cursorAttr' , subType: 'setShape' } ,
	'104': { event: 'palette' , subType: 'resetColor' } ,
	'110': { event: 'palette' , subType: 'resetDefaultColor' } ,
	'111': { event: 'palette' , subType: 'resetDefaultBgColor' } ,
	'112': { event: 'cursorAttr' , subType: 'resetColor' } ,
	'117': { event: 'palette' , subType: 'resetHighlightBgColor' } ,
	'777': {	// rxvt/urxvt module, only support notifications
		event: 'system' ,
		subTree: {
			'notify': { subType: 'notify' }	// notify with a title and body arguments
		}
	}
} ;

