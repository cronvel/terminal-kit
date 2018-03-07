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



var tree = require( 'tree-kit' ) ;
var xterm = require( './xterm.js' ) ;



var esc = tree.extend( null , Object.create( xterm.esc ) , {

	// Amazingly, those uber-standard and uber-common sequences are *NOT* supported by Konsole...
	// SHAME on you KDE! Even the Linux Console support it!
	// This workaround use up()/down() & column(1)
	nextLine: { on: '\x1b[%UB\x1b[1G' } ,
	previousLine: { on: '\x1b[%UA\x1b[1G' } ,

	// Cursor styles
	blockCursor: { on: '\x1b]50;CursorShape=0\x07' } ,
	blinkingBlockCursor: { on: '\x1b]50;CursorShape=0\x07' } ,
	underlineCursor: { on: '\x1b]50;CursorShape=2\x07' } ,
	blinkingUnderlineCursor: { on: '\x1b]50;CursorShape=2\x07' } ,
	beamCursor: { on: '\x1b]50;CursorShape=1\x07' } ,
	blinkingBeamCursor: { on: '\x1b]50;CursorShape=1\x07' } ,

	requestColor: { on: '%D' , na: true }	// not capable
} ) ;





/* Key Mapping */



var keymap = Object.create( xterm.keymap ) ;





/* Handlers */



var handler = Object.create( xterm.handler ) ;



// Stoopid KDE again, it can flood MOUSE_X_PRESSED on mouse drag, rather than MOUSE_MOTION -_-'
// This is a copy-paste of handler.mouseSGRProtocol of xterm.js, with the appropriated work-around
handler.mouseSGRProtocol = function mouseSGRProtocol( basename , buffer ) {
	var code , pressed , matches , result ;

	matches = buffer.toString().match( /^([0-9]*);([0-9]*);([0-9]*)(.)/ ) ;

	code = parseInt( matches[ 1 ] , 10 ) ;
	pressed = matches[ 4 ] !== 'm' ;

	result = {
		data: {
			shift: !! ( code & 4 ) ,
			alt: !! ( code & 8 ) ,
			ctrl: !! ( code & 16 )
		}
	} ;

	result.data.x = parseInt( matches[ 2 ] , 10 ) ;
	result.data.y = parseInt( matches[ 3 ] , 10 ) ;
	result.eaten = matches[ 0 ].length ;

	if ( code & 32 ) {
		// Motions event
		result.name = basename + '_MOTION' ;
	}
	else if ( code & 64 ) {
		result.name = basename + ( code & 1 ? '_WHEEL_DOWN' : '_WHEEL_UP' ) ;
	}
	else {
		//console.log( this.state.button ) ;

		// Button event
		switch ( code & 3 ) {
			case 0 :
				result.name = basename + '_LEFT_BUTTON' ;
				if ( this.state.button.left === pressed ) { result.disable = true ; }
				this.state.button.left = pressed ;
				break ;

			case 1 :
				result.name = basename + '_MIDDLE_BUTTON' ;
				if ( this.state.button.middle === pressed ) { result.disable = true ; }
				this.state.button.middle = pressed ;
				break ;

			case 2 :
				result.name = basename + '_RIGHT_BUTTON' ;
				if ( this.state.button.right === pressed ) { result.disable = true ; }
				this.state.button.right = pressed ;
				break ;

			case 3 :
				result.name = basename + '_OTHER_BUTTON' ;
				if ( this.state.button.other === pressed ) { result.disable = true ; }
				this.state.button.other = pressed ;
				break ;
		}

		result.name += pressed ? '_PRESSED' : '_RELEASED' ;
	}

	result.data.code = code ;

	return result ;
} ;



module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: handler ,
	support: {
		deltaEscapeSequence: true ,
		"256colors": false ,
		"24bitsColors": false ,	// DEPRECATED
		"trueColor": false
	} ,
	colorRegister: require( '../colorScheme/konsole.json' )
} ;

