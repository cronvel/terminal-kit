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



const fileHelpers = require( './fileHelpers.js' ) ;
const path = require( 'path' ) ;



/*
	/!\ Document that!!! /!\
*/
module.exports = async function fileInput( options , callback ) {
	var baseDir , autoCompleteFileOptions , inputFieldOptions , input ;

	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	try {
		baseDir = await fileHelpers.resolveBaseDir( options.baseDir ) ;

		autoCompleteFileOptions = { baseDir } ;

		// Transmit options to inputField()
		inputFieldOptions = Object.assign( {} , options , {
			autoComplete: inputString => fileHelpers.autoCompleteFile( inputString , autoCompleteFileOptions ) ,
			autoCompleteMenu: true ,
			minLength: 1
		} ) ;

		input = await this.inputField( inputFieldOptions ).promise ;
	}
	catch ( error ) {
		if ( callback ) { callback( error ) ; return ; }
		throw error ;
	}

	if ( ! input && typeof input !== 'string' ) {
		input = undefined ;
	}
	else {
		input = path.resolve( path.isAbsolute( input ) ? input : baseDir + input ) ;
	}

	if ( callback ) { callback( undefined , input ) ; }

	return input ;
} ;

