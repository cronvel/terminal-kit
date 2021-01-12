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



var Promise = require( 'seventh' ) ;



/*
	fakeTyping( str , [options] , callback )
		* str
		* options
			* style
			* delay
			* flashStyle
			* flashDelay
		* callback
*/
module.exports = function slowTyping( str , options , callback ) {
	if ( typeof str !== 'string' ) { throw new TypeError( '[terminal] slowTyping(): argument #0 should be a string' ) ; }
	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	if ( ! options.style ) { options.style = this.green ; }
	if ( ! options.delay ) { options.delay = 150 ; }
	if ( ! options.flashStyle ) { options.flashStyle = this.bold.brightGreen ; }
	if ( ! options.flashDelay ) { options.flashDelay = 100 ; }

	var index , unflashTimer , promise = new Promise() ;

	var printChar = () => {
		if ( unflashTimer ) {
			clearTimeout( unflashTimer ) ;
			unflashTimer = null ;
			unflash() ;
		}

		if ( index === undefined ) {
			index = 0 ;
		}
		else if ( index >= str.length ) {
			if ( callback ) { callback() ; }
			else { promise.resolve() ; }
			return ;
		}
		else {
			if ( options.flashStyle && str[ index ].match( /\S/ ) ) {
				options.flashStyle( str[ index ] ) ;
				unflashTimer = setTimeout( unflash , options.flashDelay ) ;
			}
			else {
				options.style( str[ index ] ) ;
			}

			index ++ ;
		}

		setTimeout( printChar , ( 0.2 + Math.random() * 1.8 ) * options.delay ) ;
	} ;

	var unflash = () => {
		this.left( 1 ) ;
		options.style( str[ index - 1 ] ) ;
		unflashTimer = null ;
	} ;

	printChar() ;

	return promise ;
} ;

