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
// man 5 terminfo



// Common sequences

	// Remove colors
var noColor = '\x1b[39m' ;	// back to the default color, most of time it is the same than .white
var noBgColor = '\x1b[49m' ;	// back to the default color, most of time it is the same than .bgBlack



var esc = {
	
			/* Control sequences */

	// Reset the terminal
	reset: { on: '\x1bc' } ,
	
	// Cursors
	moveToLowerLeft: { on: '\x1bF' } ,
	saveCursor: { on: '\x1b7' } ,
	restoreCursor: { on: '\x1b8' } ,
	
	up: { on: '\x1b[%uA' } ,
	down: { on: '\x1b[%uB' } ,
	right: { on: '\x1b[%uC' } ,
	left: { on: '\x1b[%uD' } ,
	moveTo: { on: '\x1b[%+1U;%-1UH' } ,
	
	// Emit a beep
	beep: { on: '\x07' } ,

			/* Style sequences */

	styleReset: { on: '\x1b[0m' } ,
	
	bold: { on: '\x1b[1m' , off: '\x1b[21m' } ,
	dim: { on: '\x1b[2m' , off: '\x1b[22m' } ,		// dim: darker, 'off' remove removes also bold/bright
	italic: { on: '\x1b[3m' , off: '\x1b[23m' } ,
	underline: { on: '\x1b[4m' , off: '\x1b[24m' } ,
	blink: { on: '\x1b[5m' , off: '\x1b[25m' } ,
	inverse: { on: '\x1b[7m' , off: '\x1b[27m' } ,
	hidden: { on: '\x1b[8m' , off: '\x1b[28m' } ,	// invisible, but can be copy/paste'd
	strike: { on: '\x1b[9m' , off: '\x1b[29m' } ,
	
	// Foreground color
	black: { on: '\x1b[30m' , off: noColor } ,
	red: { on: '\x1b[31m' , off: noColor } ,
	green: { on: '\x1b[32m' , off: noColor } ,
	yellow: { on: '\x1b[33m' , off: noColor } ,
	blue: { on: '\x1b[34m' , off: noColor } ,
	magenta: { on: '\x1b[35m' , off: noColor } ,
	cyan: { on: '\x1b[36m' , off: noColor } ,
	white: { on: '\x1b[37m' , off: noColor } ,
	brightBlack: { on: '\x1b[90m' , off: noColor } ,
	brightRed: { on: '\x1b[91m' , off: noColor } ,
	brightGreen: { on: '\x1b[92m' , off: noColor } ,
	brightYellow: { on: '\x1b[93m' , off: noColor } ,
	brightBlue: { on: '\x1b[94m' , off: noColor } ,
	brightMagenta: { on: '\x1b[95m' , off: noColor } ,
	brightCyan: { on: '\x1b[96m' , off: noColor } ,
	brightWhite: { on: '\x1b[97m' , off: noColor } ,

	// Background color
	bgBlack: { on: '\x1b[40m' , off: noBgColor } ,
	bgRed: { on: '\x1b[41m' , off: noBgColor } ,
	bgGreen: { on: '\x1b[42m' , off: noBgColor } ,
	bgYellow: { on: '\x1b[43m' , off: noBgColor } ,
	bgBlue: { on: '\x1b[44m' , off: noBgColor } ,
	bgMagenta: { on: '\x1b[45m' , off: noBgColor } ,
	bgCyan: { on: '\x1b[46m' , off: noBgColor } ,
	bgWhite: { on: '\x1b[47m' , off: noBgColor } ,
	bgBrightBlack: { on: '\x1b[100m' , off: noBgColor } ,
	bgBrightRed: { on: '\x1b[101m' , off: noBgColor } ,
	bgBrightGreen: { on: '\x1b[102m' , off: noBgColor } ,
	bgBrightYellow: { on: '\x1b[103m' , off: noBgColor } ,
	bgBrightBlue: { on: '\x1b[104m' , off: noBgColor } ,
	bgBrightMagenta: { on: '\x1b[105m' , off: noBgColor } ,
	bgBrightCyan: { on: '\x1b[106m' , off: noBgColor } ,
	bgBrightWhite: { on: '\x1b[107m' , off: noBgColor } ,
	
			/* Input / Output sequences */
	
	// Terminal will send the cursor coordinate
	cursor: { on: '\x1b[?6n' , off: '' } ,
	
	// Terminal will send event on button pressed with mouse position
	mouseButton: { on: '\x1b[?1000h' , off: '\x1b[?1000l' } ,
	
	// Terminal will send position of the column hilighted
	mouseHilight: { on: '\x1b[?1001h' , off: '\x1b[?1001l' } ,
	
	// Terminal will send event on button pressed and mouse motion as long as a button is down, with mouse position
	mouseDrag: { on: '\x1b[?1002h' , off: '\x1b[?1002l' } ,
	
	// Terminal will send evant on button pressed and motion
	mouseMotion: { on: '\x1b[?1003h' , off: '\x1b[?1003l' } ,
	
	// Another mouse protocol that extend coordinate mapping (without it, it supports only 223 rows and columns)
	mouseSGR: { on: '\x1b[?1006h' , off: '\x1b[?1006l' } ,
	
	// Do not work...
	noecho: { on: '\x1b[12h' } ,
	
			/* OSC - OS Control sequences: may be unavailable on some context */
	
	// Set the title of an xterm-compatible window
	windowTitle: { on: '\x1b]0;%s\x1b\\' } ,
	
			/* Misc */
	
	// It just set error:true so it will write to STDERR instead of STDOUT
	error: { err: true } ,
	
	// Dev tests for new escape sequences discoveries
	test: { on: '\x1b[12h' }
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
	var code , released , matches , result ;
	
	matches = buffer.toString().match( /^([0-9]*);([0-9]*);([0-9]*)(.)/ ) ;
	
	code = parseInt( matches[ 1 ] ) ;
	released = matches[ 4 ] === 'm' ;
	
	result = {
		data: {
			shift: code & 4 ? true : false ,
			alt: code & 8 ? true : false ,
			ctrl: code & 16 ? true : false
		}
	} ;
	
	result.data.x = parseInt( matches[ 2 ] ) ;
	result.data.y = parseInt( matches[ 3 ] ) ;
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
				case 0 : result.name = basename + '_LEFT_BUTTON' ; break ;
				case 1 : result.name = basename + '_MIDDLE_BUTTON' ; break ;
				case 2 : result.name = basename + '_RIGHT_BUTTON' ; break ;
			}
			
			result.name += released ? '_RELEASED' : '_PRESSED' ;
		}
	}
	
	result.data.code = code ;
	
	return result ;
} ;





			/* Key Mapping */



var keymap = {
	NORMAL: '' ,
	
	ESCAPE: '\x1b' ,
	
	ENTER: '\x0d' ,
	
	UP: '\x1b[A' ,
	DOWN: '\x1b[B' ,
	RIGHT: '\x1b[C' ,
	LEFT: '\x1b[D' ,
	
	HOME: '\x1bOH' ,
	END: '\x1bOF' ,
	
	INSERT: '\x1b[2~' ,
	DELETE: '\x1b[3~' ,
	PAGE_UP: '\x1b[5~' ,
	PAGE_DOWN: '\x1b[6~' ,
	
	BACKSPACE: '\x7f' ,
	
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
	F11: '\x1b[22~' ,
	F12: '\x1b[24~' ,
	
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
	
	MOUSE_X11: { code: '\x1b[M' , event: 'mouse' , handler: handler.mouseX11Protocol } ,
	MOUSE: { code: '\x1b[<' , event: 'mouse' , handler: handler.mouseSGRProtocol }
} ;



// Complete with Modifier + [A-Z]
for ( var i = 1 ; i <= 26 ; i ++ )
{
	keymap[ 'CTRL_' + String.fromCharCode( 64 + i ) ] = String.fromCharCode( i ) ;
	keymap[ 'ALT_' + String.fromCharCode( 64 + i ) ] = '\x1b' + String.fromCharCode( 96 + i ) ;
	keymap[ 'CTRL_ALT_' + String.fromCharCode( 64 + i ) ] = '\x1b' + String.fromCharCode( i ) ;
}





module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: handler
} ;

