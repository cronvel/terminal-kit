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
var noBrightColor = '\x1b[39m' + noBold ;		// back to the default color, most of time it is the same than .white
var noBgBrightColor = '\x1b[49m' + noBlink ;	// back to the default color, most of time it is the same than .bgBlack



var esc = tree.extend( { preserve: true } , {
	
	// Linux console doesn't have bright color code, they are produced using 'bold' (which is not bold, by the way...)
	brightBlack: { on: bold + '\x1b[30m' , off: noBrightColor } ,
	brightRed: { on: bold + '\x1b[31m' , off: noBrightColor } ,
	brightGreen: { on: bold + '\x1b[32m' , off: noBrightColor } ,
	brightYellow: { on: bold + '\x1b[33m' , off: noBrightColor } ,
	brightBlue: { on: bold + '\x1b[34m' , off: noBrightColor } ,
	brightMagenta: { on: bold + '\x1b[35m' , off: noBrightColor } ,
	brightCyan: { on: bold + '\x1b[36m' , off: noBrightColor } ,
	brightWhite: { on: bold + '\x1b[37m' , off: noBrightColor } ,
	
	// Linux console doesn't have bright bg color code, they are produced using 'blink' (which does not blink, by the way...)
	bgBrightBlack: { on: blink + '\x1b[40m' , off: noBgBrightColor } ,
	bgBrightRed: { on: blink + '\x1b[41m' , off: noBgBrightColor } ,
	bgBrightGreen: { on: blink + '\x1b[42m' , off: noBgBrightColor } ,
	bgBrightYellow: { on: blink + '\x1b[43m' , off: noBgBrightColor } ,
	bgBrightBlue: { on: blink + '\x1b[44m' , off: noBgBrightColor } ,
	bgBrightMagenta: { on: blink + '\x1b[45m' , off: noBgBrightColor } ,
	bgBrightCyan: { on: blink + '\x1b[46m' , off: noBgBrightColor } ,
	bgBrightWhite: { on: blink + '\x1b[47m' , off: noBgBrightColor } ,
	
	// Those either does not produce anything or switch to some arbitrary color, so we will use our own settings instead
	dim: { on: bold + '\x1b[30m' , off: noBrightColor } ,	// dim does not produce dim, so we use brightBlack instead
	underline: { on: blink + '\x1b[40m' , off: noBgBrightColor } ,	// underline does not produce underline, so we use bgBrightBlack instead
	italic: { on: '\x1b[1m' , off: '\x1b[22m' } ,	// italic does not produce italic, so we use bold instead (which is no bold but bright BTW)
	hidden: { on: '\x1b[40m\x1b[30m' , off: '\x1b[49m\x1b[39m' } ,	// hidden does not produce hidden, so we use black + bgBlack instead
	strike: { on: bold + '\x1b[30m' , off: noBrightColor } ,	// strike does not produce strike, so we use brightBlack instead
	
	// Does not exist, silently drop it...
	windowTitle: { on: '%D' }
	
} , xterm.esc ) ;





			/* Key Mapping */



var keymap = tree.extend( { preserve: true } , {
	
	F1: '\x1b[[A' ,
	F2: '\x1b[[B' ,
	F3: '\x1b[[C' ,
	F4: '\x1b[[D' ,
	F5: '\x1b[[E'
	
} , xterm.keymap ) ;





module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: {}
} ;

