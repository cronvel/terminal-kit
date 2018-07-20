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



// Used when there is no terminal (e.g.: pipe)



var esc = {

	/* Common sequences */

	// Reset the terminal
	reset: { on: '' } ,

	/* Cursor sequences */

	saveCursor: { on: '' } ,
	restoreCursor: { on: '' } ,

	up: { on: '%D' } ,
	down: { on: '%D' } ,
	right: { on: '%D' } ,
	left: { on: '%D' } ,
	nextLine: { on: '%D' } ,
	previousLine: { on: '%D' } ,

	//column: { on: '%D' } ,
	column: {
		on: '%[column:%a]F' ,
		handler: x => {
			if ( typeof x !== 'number' || ! x || x <= 1 || x === Infinity ) { return '' ; }
			return ' '.repeat( x - 1 ) ;
		}
	} ,
	row: { on: '%D' } ,
	moveTo: { on: '%D%D' , optimized: () => '' } ,
	//moveToBottomLeft: { on: '' } ,	// Not widely supported
	hideCursor: { on: '' , off: '' } ,

	tabSet: { on: '' } ,	// HTS
	tabClear: { on: '' } ,	// TBC
	tabClearAll: { on: '' } ,	// TBC
	forwardTab: { on: '%D' } ,	// CHT
	backwardTab: { on: '%D' } ,	// CBT

	// Cursor styles
	blockCursor: { on: '' } ,
	blinkingBlockCursor: { on: '' } ,
	underlineCursor: { on: '' } ,
	blinkingUnderlineCursor: { on: '' } ,
	beamCursor: { on: '' } ,
	blinkingBeamCursor: { on: '' } ,

	/* Editing sequences */

	clear: { on: '' } ,
	eraseDisplayBelow: { on: '' } ,
	eraseDisplayAbove: { on: '' } ,
	eraseDisplay: { on: '' } ,
	eraseSavedLine: { on: '' } ,
	eraseLineAfter: { on: '' } ,
	eraseLineBefore: { on: '' } ,
	eraseLine: { on: '' } ,
	insertLine: { on: '%D' } ,
	deleteLine: { on: '%D' } ,
	insert: { on: '%D' } ,	// insert char
	'delete': { on: '%D' } ,	// delete char
	backDelete: { on: '' } ,	// Backspace-like, left(1) followed by delete(1)
	scrollUp: { on: '%D' } ,	// scroll up n lines, new lines are added at the bottom
	scrollDown: { on: '%D' } ,	// scroll down n lines, new lines are added at the top
	scrollingRegion: { on: '%D%D' } ,	// top line, bottom line, scrolling affect only this region,
	resetScrollingRegion: { on: '' } ,

	// This set the alternate screen buffer, do not work on many term, due to this titeInhibit shit...
	alternateScreenBuffer: { on: '' , off: '' } ,

	/* Misc sequences */

	beep: { on: '' } ,	// Deprecated -- use bell instead
	bell: { on: '' } ,	// Emit an audible bell

	/* Style sequences */

	styleReset: { on: '' } ,

	bold: { on: '' , off: '' } ,		// here we use the dim.off code (22) that have a better support than (21), for God-only known reason...
	dim: { on: '' , off: '' } ,		// dim: darker, 'off' remove removes also bold/bright
	italic: { on: '' , off: '' } ,
	underline: { on: '' , off: '' } ,
	blink: { on: '' , off: '' } ,
	inverse: { on: '' , off: '' } ,
	hidden: { on: '' , off: '' } ,	// invisible, but can be copy/paste'd
	strike: { on: '' , off: '' } ,

	// Foreground color
	defaultColor: { on: '' } ,
	black: { on: '' , off: '' } ,
	red: { on: '' , off: '' } ,
	green: { on: '' , off: '' } ,
	yellow: { on: '' , off: '' } ,
	blue: { on: '' , off: '' } ,
	magenta: { on: '' , off: '' } ,
	cyan: { on: '' , off: '' } ,
	white: { on: '' , off: '' } ,
	darkColor: { on: '%D' , off: '' } ,	// should be called with a 0..7 integer
	brightBlack: { on: '' , off: '' } ,
	brightRed: { on: '' , off: '' } ,
	brightGreen: { on: '' , off: '' } ,
	brightYellow: { on: '' , off: '' } ,
	brightBlue: { on: '' , off: '' } ,
	brightMagenta: { on: '' , off: '' } ,
	brightCyan: { on: '' , off: '' } ,
	brightWhite: { on: '' , off: '' } ,
	brightColor: { on: '%D' , off: '' } ,	// should be called with a 0..7 integer

	// Background color
	bgDefaultColor: { on: '' } ,
	bgBlack: { on: '' , off: '' } ,
	bgRed: { on: '' , off: '' } ,
	bgGreen: { on: '' , off: '' } ,
	bgYellow: { on: '' , off: '' } ,
	bgBlue: { on: '' , off: '' } ,
	bgMagenta: { on: '' , off: '' } ,
	bgCyan: { on: '' , off: '' } ,
	bgWhite: { on: '' , off: '' } ,
	bgDarkColor: { on: '%D' , off: '' } ,	// should be called with a 0..7 integer
	bgBrightBlack: { on: '' , off: '' } ,
	bgBrightRed: { on: '' , off: '' } ,
	bgBrightGreen: { on: '' , off: '' } ,
	bgBrightYellow: { on: '' , off: '' } ,
	bgBrightBlue: { on: '' , off: '' } ,
	bgBrightMagenta: { on: '' , off: '' } ,
	bgBrightCyan: { on: '' , off: '' } ,
	bgBrightWhite: { on: '' , off: '' } ,
	bgBrightColor: { on: '%D' , off: '' } ,	// should be called with a 0..7 integer

	/* Input / Output sequences */

	// Request terminal ID
	// requestTerminalId: { on: '' } ,

	// Terminal will send the cursor coordinate only one time
	requestCursorLocation: { on: '' , na: true } ,

	// Terminal will send the cursor coordinate only one time
	requestScreenSize: { on: '' } ,

	// Terminal will send the rgb color for a register
	requestColor: { on: '%D' , na: true } ,

	// Terminal will send event on button pressed with mouse position
	mouseButton: { on: '' , off: '' } ,

	// Terminal will send position of the column hilighted
	mouseHilight: { on: '' , off: '' } ,

	// Terminal will send event on button pressed and mouse motion as long as a button is down, with mouse position
	mouseDrag: { on: '' , off: '' } ,

	// Terminal will send event on button pressed and motion
	mouseMotion: { on: '' , off: '' } ,

	// Another mouse protocol that extend coordinate mapping (without it, it supports only 223 rows and columns)
	mouseSGR: { on: '' , off: '' } ,

	// Terminal will send event when it gains and loses focus
	focusEvent: { on: '' , off: '' } ,

	// Should allow keypad to send different code than 0..9 keys but it does not works on some setup
	applicationKeypad: { on: '' , off: '' } ,

	/* OSC - OS Control sequences: may be unavailable on some context */

	// Set the title of an xterm-compatible window
	windowTitle: { on: '%D' } ,
	iconName: { on: '%D' } ,
	cwd: { on: '%D' } ,
	notify: { on: '%D%D' } ,

	// Those sequences accept either #%x%x%x or rgb:%d/%d/%d
	// Sometime rgb:%d/%d/%d should be encoded into the 0..65535 range, so #%x%x%x is more reliable
	setCursorColorRgb: { on: '%D%D%D' } ,	// it want rgb as parameter, like rgb:127/0/32
	resetCursorColorRgb: { on: '' } ,
	setDefaultColorRgb: { on: '%D%D%D' } ,	// not widely supported
	resetDefaultColorRgb: { on: '' } ,
	setDefaultBgColorRgb: { on: '%D%D%D' } ,	// not widely supported
	resetDefaultBgColorRgb: { on: '' } ,
	setHighlightBgColorRgb: { on: '%D%D%D' } ,	// not widely supported
	resetHighlightBgColorRgb: { on: '' } ,
	setColorLL: { on: '%D%D%D%D' } ,	// LL= Low Level
	resetColorLL: { on: '%D' } ,

	setFont: { on: '%D' } ,	// ->|TODOC|<- rarely supported
	color24bits: { on: '%D%D%D' , na: true } ,	// not capable
	bgColor24bits: { on: '%D%D%D' , na: true } ,	// not capable

	/* Functions */

	color256: { on: '%D' , off: '' } ,
	bgColor256: { on: '%D' , off: '' } ,
	setCursorColor: { on: '%D%D' , off: '' }
} ;



var handler = {} ;
var keymap = {} ;



module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: handler ,
	support: {
		deltaEscapeSequence: false ,
		"256colors": false ,
		"24bitsColors": false ,	// DEPRECATED
		"trueColor": false
	} ,
	// Whatever...
	colorRegister: require( '../colorScheme/linux.json' )
} ;

