/*
	Terminal Kit

	Copyright (c) 2009 - 2022 Cédric Ronvel

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



const tree = require( 'tree-kit' ) ;
const xterm = require( './xterm.js' ) ;
const string = require( 'string-kit' ) ;



// Remove colors
const defaultColor = '\x1b[39m' ; // back to the default color, most of time it is the same than .white
const bgDefaultColor = '\x1b[49m' ;   // back to the default color, most of time it is the same than .bgBlack


const esc = tree.extend( null , Object.create( xterm.esc ) , {

	color256: { on: '\x1b[38;5;%um' , off: defaultColor } ,
	bgColor256: { on: '\x1b[48;5;%um' , off: bgDefaultColor } ,

	setCursorColorRgb: { on: '\x1b]12;#%x%x%x\x07' } ,	// it want rgb as parameter, like rgb:127/0/32
	setDefaultColorRgb: { on: '\x1b]10;#%x%x%x\x07' } ,	// ->|TODOC|<- not widely supported
	setDefaultBgColorRgb: { on: '\x1b]11;#%x%x%x\x07' } ,	// ->|TODOC|<- not widely supported
	color24bits: { on: '\x1b[38;2;%u;%u;%um' , off: defaultColor , fb: true } ,
	bgColor24bits: { on: '\x1b[48;2;%u;%u;%um' , off: bgDefaultColor , fb: true } ,

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
} ) ;





const keymap = Object.create( xterm.keymap ) ;
const handler = Object.create( xterm.handler ) ;





module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: handler ,
	support: {
		deltaEscapeSequence: true ,
		"256colors": true ,
		"24bitsColors": false ,	// DEPRECATED
		"trueColor": false
	} ,
	colorRegister: xterm.colorRegister
} ;
