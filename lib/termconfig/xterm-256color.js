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



// Remove colors
var defaultColor = '\x1b[39m' ; // back to the default color, most of time it is the same than .white
var bgDefaultColor = '\x1b[49m' ;   // back to the default color, most of time it is the same than .bgBlack


var esc = tree.extend( { preserve: true } , {
	
	color256: { on: '\x1b[38;5;%um' , off: defaultColor } ,
	bgColor256: { on: '\x1b[48;5;%um' , off: bgDefaultColor }
	
} , xterm.esc ) ;





			/* Key Mapping */



var keymap = tree.extend( { preserve: true } , {
	
} , xterm.keymap ) ;





			/* Handlers */



var handler = tree.extend( { preserve: true } , {
	
} , xterm.handler ) ;





module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: handler
} ;
