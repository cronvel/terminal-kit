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



// Fail-safe xterm-compatible

var esc = tree.extend( { preserve: true } , {
	
	// KDE Konsole does not support that. This workaround use up()/down() & column(1)
	nextLine: { on: '\x1b[%UB\x1b[1G' } ,
	previousLine: { on: '\x1b[%UA\x1b[1G' }
	
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

