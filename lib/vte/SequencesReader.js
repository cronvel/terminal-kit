/*
	Terminal Kit

	Copyright (c) 2009 - 2019 Cédric Ronvel

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



const fromOutputSequence = require( './fromOutputSequence.js' ) ;
const string = require( 'string-kit' ) ;
const NextGenEvents = require( 'nextgen-events' ) ;
const Promise = require( 'seventh' ) ;



function SequencesReader( options = {} ) {
}

module.exports = SequencesReader ;

SequencesReader.prototype = Object.create( NextGenEvents.prototype ) ;
SequencesReader.prototype.constructor = SequencesReader ;



async function readStream( stream , size = 1 ) {
	var data ;

	//stream.on( 'readable' , () => console.error( 'yay readable' ) ) ;
	data = stream.read( size ) ;
	//console.error( 'read stream:' , data ) ;

	while ( data === null ) {
		await Promise.onceEventOrError( stream , 'readable' , [ 'close' , 'end' ] ) ;
		data = stream.read( size ) ;
		//console.error( 'read stream (loop):' , data ) ;
	}

	return data ;
}



SequencesReader.prototype.streamToEvent = async function( stream ) {
	var charCode , charCodeStr , char , bytes , codepoint ,
		charBuffer = Buffer.alloc( 6 ) ;

	for ( ;; ) {
		charCode = ( await readStream( stream ) )[ 0 ] ;
		//console.error( 'got charCode:' , charCode.toString(16) ) ;

		if ( charCode <= 0x1f || charCode === 0x7f ) {
			
			charCodeStr = charCode.toString( 16 ) ;
			charCodeStr = charCodeStr > 1 ? '\\x' + charCodeStr : '\\x0' + charCodeStr ;
			//console.error( 'control:' , charCodeStr ) ;
			
			if ( fromOutputSequence.control[ charCodeStr ] ) {
				console.error( 'emit control:' , fromOutputSequence.control[ charCodeStr ] ) ;
				this.emit( 'control' , fromOutputSequence.control[ charCodeStr ] ) ;
			}
		}
		else if ( charCode >= 0x80 ) {
			// Unicode bytes per char guessing
			if ( charCode < 0xc0 ) { continue ; }	// We are in a middle of an unicode multibyte sequence... Something fails somewhere, we will just continue for now...
			else if ( charCode < 0xe0 ) { bytes = 2 ; }
			else if ( charCode < 0xf0 ) { bytes = 3 ; }
			else if ( charCode < 0xf8 ) { bytes = 4 ; }
			else if ( charCode < 0xfc ) { bytes = 5 ; }
			else { bytes = 6 ; }

			charBuffer[ 0 ] = charCode ;
			charBuffer[ 1 ] = charBuffer[ 2 ] = charBuffer[ 3 ] = charBuffer[ 4 ] = charBuffer[ 5 ] = 0 ;
			( await readStream( stream , bytes - 1 ) ).copy( charBuffer , 1 ) ;

			char = charBuffer.toString( 'utf8' ) ;
			codepoint = string.unicode.firstCodePoint( char ) ;

			//this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: codepoint , code: charBuffer } ) ;
			console.error( 'emit char:' , char ) ;
			this.emit( 'char' , char , codepoint ) ;
		}
		else {
			// Standard ASCII
			char = String.fromCharCode( charCode ) ;
			//this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: charCode , code: charCode } ) ;
			console.error( 'emit char:' , char ) ;
			this.emit( 'char' , char , charCode ) ;
		}
	}
} ;

