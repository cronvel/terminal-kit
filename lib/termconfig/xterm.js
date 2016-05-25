/*
	Terminal Kit
	
	Copyright (c) 2009 - 2016 Cédric Ronvel
	
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



var string = require( 'string-kit' ) ;





			/* Escape sequences */



// Mini-doc:

// ESC = \x1b
// CSI = ESC + [
// OSC = ESC + ]
// DSC = ESC + P
// ST = ESC + \	(end some sequences)

// CSI: ESC + [ + <command> + <type>
// It is possible to separate many command with a ';' before the final 'type'.

// See: http://en.wikipedia.org/wiki/ANSI_escape_code
// and: http://invisible-island.net/xterm/ctlseqs/ctlseqs.html
// man tput
// man infocmp
// man 5 terminfo
// For tput tcap name, see: http://pubs.opengroup.org/onlinepubs/7990989799/xcurses/terminfo.html
// useful command: infocmp -l $TERM


// Common sequences

// Remove colors
var defaultColor = '\x1b[39m' ;	// back to the default color, most of time it is the same than .white
var bgDefaultColor = '\x1b[49m' ;	// back to the default color, most of time it is the same than .bgBlack



var esc = {
	
			/* Common sequences */

	// Reset the terminal
	reset: { on: '\x1bc' } ,
	
			/* Cursor sequences */
	
	saveCursor: { on: '\x1b7' } ,	// also '\x1b[s'
	restoreCursor: { on: '\x1b8' } ,	// also '\x1b[u'
	
	up: { on: '\x1b[%UA' } ,
	down: { on: '\x1b[%UB' } ,
	right: { on: '\x1b[%UC' } ,
	left: { on: '\x1b[%UD' } ,
	nextLine: { on: '\x1b[%UE' } ,
	previousLine: { on: '\x1b[%UF' } ,
	column: { on: '\x1b[%UG' } ,
	row: { on: '\x1b[%Ud' } ,
	scrollUp: { on: '\x1b[%US' } ,
	scrollDown: { on: '\x1b[%UT' } ,
	moveTo: { on: '\x1b[%+1U;%-1UH' , optimized: function( x , y ) { return '\x1b[' + y + ';' + x + 'H' ; } } ,
	//moveToBottomLeft: { on: '\x1bF' } ,	// Not widely supported
	hideCursor: { on: '\x1b[?25l' , off: '\x1b[?25h' } ,
	
	// Cursor styles
	blockCursor: { on: '\x1b[2 q' } ,
	blinkingBlockCursor: { on: '\x1b[0 q' } ,
	underlineCursor: { on: '\x1b[4 q' } ,
	blinkingUnderlineCursor: { on: '\x1b[3 q' } ,
	beamCursor: { on: '\x1b[6 q' } ,
	blinkingBeamCursor: { on: '\x1b[5 q' } ,
	
			/* Editing sequences */
	
	clear: { on: '\x1b[H\x1b[2J' } ,
	eraseDisplayBelow: { on: '\x1b[0J' } ,
	eraseDisplayAbove: { on: '\x1b[1J' } ,
	eraseDisplay: { on: '\x1b[2J' } ,
	eraseLineAfter: { on: '\x1b[0K' } ,
	eraseLineBefore: { on: '\x1b[1K' } ,
	eraseLine: { on: '\x1b[2K' } ,
	insertLine: { on: '\x1b[%UL' } ,
	deleteLine: { on: '\x1b[%UM' } ,
	insert: { on: '\x1b[%U@' } ,	// insert char
	'delete': { on: '\x1b[%UP' } ,	// delete char
	backDelete: { on: '\x1b[1D\x1b[1P' } ,	// Backspace-like, left(1) followed by delete(1)
	
	// This set the alternate screen buffer, do not work on many term, due to this titeInhibit shit...
	alternateScreenBuffer: { on: '\x1b[?1049h' , off: '\x1b[?1049l' } ,
	
			/* Misc sequences */
	
	beep: { on: '\x07' } ,	// Deprecated -- use bell instead
	bell: { on: '\x07' } ,	// Emit an audible bell
	
			/* Style sequences */
	
	styleReset: { on: '\x1b[0m' } ,
	
	bold: { on: '\x1b[1m' , off: '\x1b[22m' } ,		// here we use the dim.off code (22) that have a better support than (21), for God-only known reason...
	dim: { on: '\x1b[2m' , off: '\x1b[22m' } ,		// dim: darker, 'off' remove removes also bold/bright
	italic: { on: '\x1b[3m' , off: '\x1b[23m' } ,
	underline: { on: '\x1b[4m' , off: '\x1b[24m' } ,
	blink: { on: '\x1b[5m' , off: '\x1b[25m' } ,
	inverse: { on: '\x1b[7m' , off: '\x1b[27m' } ,
	hidden: { on: '\x1b[8m' , off: '\x1b[28m' } ,	// invisible, but can be copy/paste'd
	strike: { on: '\x1b[9m' , off: '\x1b[29m' } ,
	
	// Foreground color
	defaultColor: { on: defaultColor } ,
	black: { on: '\x1b[30m' , off: defaultColor } ,
	red: { on: '\x1b[31m' , off: defaultColor } ,
	green: { on: '\x1b[32m' , off: defaultColor } ,
	yellow: { on: '\x1b[33m' , off: defaultColor } ,
	blue: { on: '\x1b[34m' , off: defaultColor } ,
	magenta: { on: '\x1b[35m' , off: defaultColor } ,
	cyan: { on: '\x1b[36m' , off: defaultColor } ,
	white: { on: '\x1b[37m' , off: defaultColor } ,
	darkColor: { on: '\x1b[3%um' , off: defaultColor } ,	// should be called with a 0..7 integer
	brightBlack: { on: '\x1b[90m' , off: defaultColor } ,
	brightRed: { on: '\x1b[91m' , off: defaultColor } ,
	brightGreen: { on: '\x1b[92m' , off: defaultColor } ,
	brightYellow: { on: '\x1b[93m' , off: defaultColor } ,
	brightBlue: { on: '\x1b[94m' , off: defaultColor } ,
	brightMagenta: { on: '\x1b[95m' , off: defaultColor } ,
	brightCyan: { on: '\x1b[96m' , off: defaultColor } ,
	brightWhite: { on: '\x1b[97m' , off: defaultColor } ,
	brightColor: { on: '\x1b[9%um' , off: defaultColor } ,	// should be called with a 0..7 integer
    
	// Background color
	bgDefaultColor: { on: bgDefaultColor } ,
	bgBlack: { on: '\x1b[40m' , off: bgDefaultColor } ,
	bgRed: { on: '\x1b[41m' , off: bgDefaultColor } ,
	bgGreen: { on: '\x1b[42m' , off: bgDefaultColor } ,
	bgYellow: { on: '\x1b[43m' , off: bgDefaultColor } ,
	bgBlue: { on: '\x1b[44m' , off: bgDefaultColor } ,
	bgMagenta: { on: '\x1b[45m' , off: bgDefaultColor } ,
	bgCyan: { on: '\x1b[46m' , off: bgDefaultColor } ,
	bgWhite: { on: '\x1b[47m' , off: bgDefaultColor } ,
	bgDarkColor: { on: '\x1b[4%um' , off: bgDefaultColor } ,	// should be called with a 0..7 integer
	bgBrightBlack: { on: '\x1b[100m' , off: bgDefaultColor } ,
	bgBrightRed: { on: '\x1b[101m' , off: bgDefaultColor } ,
	bgBrightGreen: { on: '\x1b[102m' , off: bgDefaultColor } ,
	bgBrightYellow: { on: '\x1b[103m' , off: bgDefaultColor } ,
	bgBrightBlue: { on: '\x1b[104m' , off: bgDefaultColor } ,
	bgBrightMagenta: { on: '\x1b[105m' , off: bgDefaultColor } ,
	bgBrightCyan: { on: '\x1b[106m' , off: bgDefaultColor } ,
	bgBrightWhite: { on: '\x1b[107m' , off: bgDefaultColor } ,
	bgBrightColor: { on: '\x1b[10%um' , off: bgDefaultColor } ,	// should be called with a 0..7 integer
	
			/* Input / Output sequences */
	
	// Request terminal ID
	// requestTerminalId: { on: '\x1b[>c' } ,
	
	// Terminal will send the cursor coordinate only one time
	requestCursorLocation: { on: '\x1b[6n' } ,	// '\x1b[?6n' is not widely supported, '\x1b[6n' is better
	
	// Terminal will send the cursor coordinate only one time
	requestScreenSize: { on: '\x1b[18t' } ,
	
	// Terminal will send the rgb color for a register
	requestColor: { on: '\x1b]4;%u;?\x07' } ,
	
	// Terminal will send event on button pressed with mouse position
	mouseButton: { on: '\x1b[?1000h' , off: '\x1b[?1000l' } ,
	
	// Terminal will send position of the column hilighted
	mouseHilight: { on: '\x1b[?1001h' , off: '\x1b[?1001l' } ,
	
	// Terminal will send event on button pressed and mouse motion as long as a button is down, with mouse position
	mouseDrag: { on: '\x1b[?1002h' , off: '\x1b[?1002l' } ,
	
	// Terminal will send event on button pressed and motion
	mouseMotion: { on: '\x1b[?1003h' , off: '\x1b[?1003l' } ,
	
	// Another mouse protocol that extend coordinate mapping (without it, it supports only 223 rows and columns)
	mouseSGR: { on: '\x1b[?1006h' , off: '\x1b[?1006l' } ,
	
	// Terminal will send event when it gains and loses focus
	focusEvent: { on: '\x1b[?1004h' , off: '\x1b[?1004l' } ,
	
	// Should allow keypad to send different code than 0..9 keys but it does not works on some setup
	applicationKeypad: { on: '\x1b[?1h\x1b=' , off: '\x1b[?1l\x1b>' } ,
	
	// When enabled, the terminal will report if modifiers (SHIFT, CTRL, ALT) are on
	/*	Not widely supported
	keyboardModifier: { on: '\x1b[>0;1m' , off: '\x1b[>0;0m' } ,
	cursorKeyModifier: { on: '\x1b[>1;1m' , off: '\x1b[>1;0m' } ,
	functionKeyModifier: { on: '\x1b[>2;1m' , off: '\x1b[>2;0m' } ,
	otherKeyModifier: { on: '\x1b[>3;1m' , off: '\x1b[>3;0m' } ,
	*/
	
	// Do not work... use node.js stdout.setRawMode(true) instead
	//noecho: { on: '\x1b[12h' } ,
	
			/* OSC - OS Control sequences: may be unavailable on some context */
	
	// Set the title of an xterm-compatible window
	windowTitle: { on: '\x1b]0;%s\x1b\\' } ,
	
	// Those sequences accept either #%x%x%x or rgb:%d/%d/%d
	// Sometime rgb:%d/%d/%d should be encoded into the 0..65535 range, so #%x%x%x is more reliable
	setCursorColorRgb: { on: '\x1b]12;#%x%x%x\x07' } ,	// it want rgb as parameter, like rgb:127/0/32
	setDefaultColorRgb: { on: '\x1b]10;#%x%x%x\x07' } ,	// ->|TODOC|<- not widely supported
	setDefaultBgColorRgb: { on: '\x1b]11;#%x%x%x\x07' } ,	// ->|TODOC|<- not widely supported
	setColorLL: { on: '\x1b]4;%u;#%x%x%x\x07' } ,
	setFont: { on: '\x1b]50;%s\x07' } ,	// ->|TODOC|<- rarely supported
	color24bits: { on: '%D%D%D' , na: true } ,	// not capable
	bgColor24bits: { on: '%D%D%D' , na: true } ,	// not capable
	
	color256: {
		on: '%[color256:%a]F' ,
		off: defaultColor ,
		fb: true ,
		handler: function color256( register ) {
			
			if ( typeof register !== 'number' ) { return '' ; }
			if ( register < 0 || register > 255 ) { return '' ; }
			
			// If the register is greater than 15, find the 0..15 register that is close to it
			if ( register > 15 )
			{
				register = this.root.registerForRgb( this.root.rgbForRegister( register ) , 0 , 15 ) ;
			}
			
			//return string.format.call( this.root.escHandler , this.root.esc.color.on , register ) ;
			return this.root.escHandler.color( register ) ;
		}
	} ,
	
	bgColor256: {
		on: '%[bgColor256:%a]F' ,
		off: bgDefaultColor ,
		fb: true ,
		handler: function bgColor256( register ) {
			
			if ( typeof register !== 'number' ) { return '' ; }
			if ( register < 0 || register > 255 ) { return '' ; }
			
			// If the register is greater than 15, find the 0..15 register that is close to it
			if ( register > 15 )
			{
				register = this.root.registerForRgb( this.root.rgbForRegister( register ) , 0 , 15 ) ;
			}
			
			//return string.format.call( this.root.escHandler , this.root.esc.bgColor.on , register ) ;
			return this.root.escHandler.bgColor( register ) ;
		}
	} ,
	
	// Cannot find a way to set the cursor to a register, so try to guess
	setCursorColor: {
		on: '%[setCursorColor:%a%a]F' ,
		handler: function setCursorColor( bg , fg ) {
			
			if ( typeof fg !== 'number' || typeof bg !== 'number' ) { return '' ; }
			
			fg = Math.floor( fg ) ;
			bg = Math.floor( bg ) ;
			
			if ( fg < 0 || fg > 255 || bg < 0 || bg > 255 ) { return '' ; }
			
			var rgb = this.root.rgbForRegister( bg ) ;
			
			return string.format( this.root.esc.setCursorColorRgb.on , rgb.r , rgb.g , rgb.b ) ;
		}
	}
	
} ;





			/* Inputs management */



var handler = {} ;



handler.mouseX11Protocol = function mouseX11Protocol( basename , buffer )
{
	var code = buffer[ 0 ] ;
	var result = {
		data: {
			shift: code & 4 ? true : false ,
			alt: code & 8 ? true : false ,
			ctrl: code & 16 ? true : false
		}
	} ;
	
	if ( code & 32 )
	{
		if ( code & 64 )
		{
			result.name = basename + ( code & 1 ? '_WHEEL_DOWN' : '_WHEEL_UP' ) ;
		}
		else
		{
			// Button event
			switch ( code & 3 )
			{
				case 0 : result.name = basename + '_LEFT_BUTTON_PRESSED' ; break ;
				case 1 : result.name = basename + '_MIDDLE_BUTTON_PRESSED' ; break ;
				case 2 : result.name = basename + '_RIGHT_BUTTON_PRESSED' ; break ;
				case 3 : result.name = basename + '_BUTTON_RELEASED' ; break ;
			}
		}
	}
	else if ( code & 64 )
	{
		// Motion event
		result.name = basename + '_MOTION' ;
	}
	
	result.eaten = 3 ;
	result.data.code = code ;
	result.data.x = buffer[ 1 ] - 32 ;
	result.data.y = buffer[ 2 ] - 32 ;
	
	return result ;
} ;



handler.mouseSGRProtocol = function mouseSGRProtocol( basename , buffer )
{
	var code , pressed , matches , result ;
	
	matches = buffer.toString().match( /^(-?[0-9]*);?([0-9]*);?([0-9]*)(M|m)/ ) ;
	//matches = ';;M'.match( /^([0-9]*);?([0-9]*);?([0-9]*)(M|m)/ ) ;
	
	if ( ! matches || matches[ 3 ].length === 0 )
	{
		return {
			name: 'ERROR' ,
			eaten: matches ? matches[ 0 ].length : 0 ,
			data: { matches: matches }
		} ;
	}
	
	code = parseInt( matches[ 1 ] , 10 ) ;
	pressed = matches[ 4 ] !== 'm' ;
	
	result = {
		data: {
			shift: code & 4 ? true : false ,
			alt: code & 8 ? true : false ,
			ctrl: code & 16 ? true : false
		}
	} ;
	
	result.data.x = parseInt( matches[ 2 ] , 10 ) ;
	result.data.y = parseInt( matches[ 3 ] , 10 ) ;
	result.eaten = matches[ 0 ].length ;
	
	if ( code & 32 )
	{
		// Motions event
		result.name = basename + '_MOTION' ;
	}
	else
	{
		if ( code & 64 )
		{
			result.name = basename + ( code & 1 ? '_WHEEL_DOWN' : '_WHEEL_UP' ) ;
		}
		else
		{
			// Button event
			switch ( code & 3 )
			{
				case 0 :
					result.name = basename + '_LEFT_BUTTON' ;
					//if ( this.state.button.left === pressed ) { result.disable = true ; }
					this.state.button.left = pressed ;
					break ;
					
				case 1 :
					result.name = basename + '_MIDDLE_BUTTON' ;
					//if ( this.state.button.middle === pressed ) { result.disable = true ; }
					this.state.button.middle = pressed ;
					break ;
					
				case 2 :
					result.name = basename + '_RIGHT_BUTTON' ;
					//if ( this.state.button.right === pressed ) { result.disable = true ; }
					this.state.button.right = pressed ;
					break ;
					
				case 3 :
					result.name = basename + '_OTHER_BUTTON' ;
					//if ( this.state.button.other === pressed ) { result.disable = true ; }
					this.state.button.other = pressed ;
					break ;
			}
			
			result.name += pressed ? '_PRESSED' : '_RELEASED' ;
		}
	}
	
	result.data.code = code ;
	
	return result ;
} ;



handler.cursorLocation = function cursorLocation( basename , paramString )
{
	var params = paramString.split( ';' ) ;
	
	return {
		name: 'CURSOR_LOCATION' ,
		data: {
			x: parseInt( params[ 1 ] , 10 ) ,
			y: parseInt( params[ 0 ] , 10 )
		}
	} ;
} ;



handler.colorRegister = function colorRegister( basename , paramString )
{
	var matches = paramString.match( /^([0-9]*);rgb:([0-9a-f]{2})[0-9a-f]*\/([0-9a-f]{2})[0-9a-f]*\/([0-9a-f]{2})[0-9a-f]*/ ) ;
	
	return {
		name: 'COLOR_REGISTER' ,
		data: {
			register: parseInt( matches[ 1 ] , 10 ) ,
			r: parseInt( matches[ 2 ] , 16 ) ,
			g: parseInt( matches[ 3 ] , 16 ) ,
			b: parseInt( matches[ 4 ] , 16 )
		}
	} ;
} ;



handler.screenSize = function screenSize( basename , paramString )
{
	var params = paramString.split( ';' ) ,
		width = parseInt( params[ 1 ] , 10 ) ,
		height = parseInt( params[ 0 ] , 10 ) ,
		resized = this.root.width !== width || this.root.height !== height ;
	
	this.root.width = width ;
	this.root.height = height ;
	
	return {
		name: 'SCREEN_SIZE' ,
		data: {
			resized: resized ,
			width: width ,
			height: height
		}
	} ;
} ;





			/* Key Mapping */



var keymap = {
	
	ESCAPE: '\x1b' ,
	TAB: '\x09' ,
	ENTER: '\x0d' ,
	BACKSPACE: [ '\x7f' , '\x08' ] ,
	
	UP: [ '\x1bOA' , '\x1b[A' ] ,
	DOWN: [ '\x1bOB' , '\x1b[B' ] ,
	RIGHT: [ '\x1bOC' , '\x1b[C' ] ,
	LEFT: [ '\x1bOD' , '\x1b[D' ] ,
	
	INSERT: '\x1b[2~' ,
	DELETE: '\x1b[3~' ,
	HOME:[ '\x1b[1~' , '\x1b[H' , '\x1bOH' ] ,
	END: [ '\x1b[4~' , '\x1b[F' , '\x1bOF' ] ,
	PAGE_UP: '\x1b[5~' ,
	PAGE_DOWN: '\x1b[6~' ,
	
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
	CTRL_F3: [ '\x1bO1;5R' , '\x1bO5R' /*, '\x1b[1;5R'*/ ] ,	// also used for cursor location response... :/
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
	CTRL_SHIFT_F3: [ '\x1bO1;6R' , '\x1bO6R' /*, '\x1b[1;6R'*/ ] ,	// also used for cursor location response... :/
	CTRL_SHIFT_F4: [ '\x1bO1;6S' , '\x1bO6S' , '\x1b[1;6S' ] ,
	CTRL_SHIFT_F5: '\x1b[15;6~' ,
	CTRL_SHIFT_F6: '\x1b[17;6~' ,
	CTRL_SHIFT_F7: '\x1b[18;6~' ,
	CTRL_SHIFT_F8: '\x1b[19;6~' ,
	CTRL_SHIFT_F9: '\x1b[20;6~' ,
	CTRL_SHIFT_F10: '\x1b[21;6~' ,
	CTRL_SHIFT_F11: [ '\x1b[23;6~' , '\x1b[22;6~' ] ,
	CTRL_SHIFT_F12: '\x1b[24;6~' ,
	
	SHIFT_TAB: '\x1b[Z' ,
	ALT_TAB: '\x1b\x09' ,	// Also CTRL_ALT_I, most of time it is grabbed by the window manager before reaching the terminal
	
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
	
	NUL: '\x00' ,
	
	//CTRL_SPACE: '\x00' ,	// also NUL
	ALT_SPACE: '\x1b ',
	CTRL_ALT_SPACE: '\x1b\x00',
	
	CURSOR_LOCATION: { starter: '\x1b[' , ender: 'R' , event: 'terminal' , handler: 'cursorLocation' } ,
	SCREEN_SIZE: { starter: '\x1b[8;' , ender: 't' , event: 'terminal' , handler: 'screenSize' } ,
	COLOR_REGISTER: { starter: '\x1b]4;' , ender: '\x07' , event: 'terminal' , handler: 'colorRegister' } ,
	
	FOCUS_IN: { code: '\x1b[I' , event: 'terminal' , data: {} } ,
	FOCUS_OUT: { code: '\x1b[O' , event: 'terminal' , data: {} } ,
	
	MOUSE: [
		{ code: '\x1b[<' , event: 'mouse' , handler: 'mouseSGRProtocol' } ,
		{ code: '\x1b[M' , event: 'mouse' , handler: 'mouseX11Protocol' }
	]
} ;



// Complete with Modifier + [A-Z]
for ( var i = 1 ; i <= 26 ; i ++ )
{
	keymap[ 'CTRL_' + String.fromCharCode( 64 + i ) ] = String.fromCharCode( i ) ;
	keymap[ 'ALT_' + String.fromCharCode( 64 + i ) ] = '\x1b' + String.fromCharCode( 96 + i ) ;
	keymap[ 'CTRL_ALT_' + String.fromCharCode( 64 + i ) ] = '\x1b' + String.fromCharCode( i ) ;
	keymap[ 'ALT_SHIFT_' + String.fromCharCode( 64 + i ) ] = '\x1b' + String.fromCharCode( 64 + i ) ;
}



module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: handler ,
	support: {
		deltaEscapeSequence: true ,
		"256colors": false ,
		"24bitsColors": false
	} ,
	colorRegister: require( '../colorScheme/xterm.json' )
} ;

