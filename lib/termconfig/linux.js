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



// shortcuts
var bold = '\x1b[1m' ;
var noBold = '\x1b[22m' ;
var blink = '\x1b[5m' ;
var noBlink = '\x1b[25m' ;
var defaultColor = '\x1b[39m' + noBold ;		// back to the default color, most of time it is the same than .white
var bgDefaultColor = '\x1b[49m' + noBlink ;	// back to the default color, most of time it is the same than .bgBlack



var esc = tree.extend( null , Object.create( xterm.esc ) , {
	
	// Clear screen
	clear: { on: '\x1b[H\x1b[J' } ,
	
	// Linux console doesn't have bright color code, they are produced using 'bold' (which is not bold, by the way...)
	defaultColor: { on: defaultColor } ,
	brightBlack: { on: bold + '\x1b[30m' , off: defaultColor } ,
	brightRed: { on: bold + '\x1b[31m' , off: defaultColor } ,
	brightGreen: { on: bold + '\x1b[32m' , off: defaultColor } ,
	brightYellow: { on: bold + '\x1b[33m' , off: defaultColor } ,
	brightBlue: { on: bold + '\x1b[34m' , off: defaultColor } ,
	brightMagenta: { on: bold + '\x1b[35m' , off: defaultColor } ,
	brightCyan: { on: bold + '\x1b[36m' , off: defaultColor } ,
	brightWhite: { on: bold + '\x1b[37m' , off: defaultColor } ,
	brightColor: { on: bold + '\x1b[3%um' , off: defaultColor } ,	// should be called with a 0..7 integer
	
	// Linux console doesn't have bright bg color code, they are produced using 'blink' (which does not blink, by the way...)
	bgDefaultColor: { on: bgDefaultColor } ,
	bgBrightBlack: { on: blink + '\x1b[40m' , off: bgDefaultColor } ,
	bgBrightRed: { on: blink + '\x1b[41m' , off: bgDefaultColor } ,
	bgBrightGreen: { on: blink + '\x1b[42m' , off: bgDefaultColor } ,
	bgBrightYellow: { on: blink + '\x1b[43m' , off: bgDefaultColor } ,
	bgBrightBlue: { on: blink + '\x1b[44m' , off: bgDefaultColor } ,
	bgBrightMagenta: { on: blink + '\x1b[45m' , off: bgDefaultColor } ,
	bgBrightCyan: { on: blink + '\x1b[46m' , off: bgDefaultColor } ,
	bgBrightWhite: { on: blink + '\x1b[47m' , off: bgDefaultColor } ,
	bgBrightColor: { on: blink + '\x1b[4%um' , off: bgDefaultColor } ,	// should be called with a 0..7 integer
	
	// Those either does not produce anything or switch to some arbitrary color, so we will use our own settings instead
	dim: { on: bold + '\x1b[30m' , off: defaultColor } ,	// dim does not produce dim, so we use brightBlack instead
	underline: { on: blink + '\x1b[40m' , off: bgDefaultColor } ,	// underline does not produce underline, so we use bgBrightBlack instead
	italic: { on: '\x1b[1m' , off: '\x1b[22m' } ,	// italic does not produce italic, so we use bold instead (which is no bold but bright BTW)
	hidden: { on: '\x1b[40m\x1b[30m' , off: '\x1b[49m\x1b[39m' } ,	// hidden does not produce hidden, so we use black + bgBlack instead
	strike: { on: bold + '\x1b[30m' , off: defaultColor } ,	// strike does not produce strike, so we use brightBlack instead
	
	// Does not exist, silently drop it...
	windowTitle: { on: '%D' }
	
} ) ;





			/* Key Mapping */



var keymap = tree.extend( null , Object.create( xterm.keymap ) , {
	
	F1: '\x1b[[A' ,
	F2: '\x1b[[B' ,
	F3: '\x1b[[C' ,
	F4: '\x1b[[D' ,
	F5: '\x1b[[E' ,
	
	// Application Keypad
	KP_NUMLOCK: '\x1bOP' ,
	KP_DIVIDE: '\x1bOQ' ,
	KP_MULTIPLY: '\x1bOR' ,
	KP_MINUS: '\x1bOS' ,
	KP_0: '\x1bOp' ,
	KP_1: '\x1bOq' ,
	KP_2: '\x1bOr' ,
	KP_3: '\x1bOs' ,
	KP_4: '\x1bOt' ,
	KP_5: '\x1bOu' ,
	KP_6: '\x1bOv' ,
	KP_7: '\x1bOw' ,
	KP_8: '\x1bOx' ,
	KP_9: '\x1bOy' ,
	KP_PLUS: '\x1bOl' ,
	KP_DELETE: '\x1bOn' ,
	KP_ENTER: '\x1bOM'
	
} ) ;





module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: Object.create( xterm.handler )
} ;

