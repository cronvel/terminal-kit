/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

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



const spChars = require( './spChars.js' ) ;



/*
	bar( value , options )
		* value `number` the value to display as bar
		* options `object` of options, where:
			* innerSize `number` the inner width in characters (default: 10)
			* barStyle `function` the style of the bar, default to term.blue
			* str `boolean` (default: false) if true it outputs nothing, instead it returns a string
*/
module.exports = function( value , options ) {
	var str = '' , barString = '' ;

	options = options || {} ;

	if ( isNaN( value ) || value < 0 ) { value = 0 ; }
	else if ( value > 1 ) { value = 1 ; }

	var innerSize = options.innerSize || 10 ;
	var fullBlocks = Math.floor( value * innerSize ) ;
	var partialBlock = Math.round( ( value * innerSize - fullBlocks ) * 8 ) ;
	var barStyle = options.barStyle || this.blue ;

	barString += '█'.repeat( fullBlocks ) ;

	if ( fullBlocks < innerSize ) {
		barString += spChars.enlargingBlock[ partialBlock ] ;
		barString += ' '.repeat( innerSize - fullBlocks - 1 ) ;
	}

	if ( options.str ) {
		str += this.str.inverse( '▉' ) ;
		str += barStyle.str( barString ) ;
		str += this.str( '▏' ) ;
		return str ;
	}

	this.inverse( '▉' ) ;
	barStyle( barString ) ;
	this( '▏' ) ;

	return this ;
} ;

