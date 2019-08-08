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



const NextGenEvents = require( 'nextgen-events' ) ;
const Promise = require( 'seventh' ) ;



function SequencesReader( options = {} ) {
	this.onInput = this.onInput.bind( this ) ;
}

module.exports = SequencesReader ;

SequencesReader.prototype = Object.create( NextGenEvents.prototype ) ;
SequencesReader.prototype.constructor = SequencesReader ;



async function readStream( stream , size = 1 ) {
	var data ;
	
	data = stream.read( size ) ;
	
	while ( data === null ) {
		await Promise.onceEventOrError( stream , 'readable' , [ 'close' , 'end' ] ) ;
		data = stream.read( size ) ;
	}
	
	return data ;
} ;



SequencesReader.prototype.streamToEvent = async function( stream ) {
	var charCode , char , bytes , charBuffer = Buffer.alloc( 6 ) ;
	
	for ( ;; ) {
		charCode = ( await readStream( stream ) )[ 0 ] ;
		
		if ( charCode <= 0x1f || charCode === 0x7f ) {
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

			this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: codepoint , code: buffer } ) ;
		}
		else {
			// Standard ASCII
			char = String.fromCharCode( charCode ) ;
			this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: charCode , code: charCode } ) ;
		}
	}
} ;



SequencesReader.prototype.onInput = function( chunk ) {
	var i , j , buffer , startBuffer , char , codepoint ,
		keymapCode , keymapStartCode , keymap , keymapList ,
		regexp , matches , bytes , found , handlerResult ,
		index = 0 , length = chunk.length ;

	while ( index < length ) {
		found = false ;
		bytes = 1 ;

		if ( chunk[ index ] <= 0x1f || chunk[ index ] === 0x7f ) {
			// Those are ASCII control character and DEL key

			for ( i = Math.min( length , Math.max( this.rKeymapMaxSize , this.rKeymapStarterMaxSize ) ) ; i > 0 ; i -- ) {
				buffer = chunk.slice( index ) ;
				keymapCode = buffer.toString() ;
				startBuffer = chunk.slice( index , index + i ) ;
				keymapStartCode = startBuffer.toString() ;


				if ( this.rKeymap[ i ] && this.rKeymap[ i ][ keymapStartCode ] ) {
					// First test fixed sequences

					keymap = this.rKeymap[ i ][ keymapStartCode ] ;
					found = true ;

					if ( keymap.handler ) {
						handlerResult = keymap.handler.call( this , keymap.name , chunk.slice( index + i ) ) ;
						bytes = i + handlerResult.eaten ;

						if ( ! handlerResult.disable ) {
							this.emit( keymap.event , handlerResult.name , handlerResult.data ) ;
						}
					}
					else if ( keymap.event ) {
						bytes = i ;
						this.emit( keymap.event , keymap.name , keymap.data , { code: startBuffer } ) ;
					}
					else {
						bytes = i ;
						this.emit( 'key' , keymap.name , keymap.matches , { isCharacter: false , code: startBuffer } ) ;
					}

					break ;
				}
				else if ( this.rKeymapStarter[ i ] && this.rKeymapStarter[ i ][ keymapStartCode ] ) {
					// Then test pattern sequences

					keymapList = this.rKeymapStarter[ i ][ keymapStartCode ] ;

					//console.log( 'for i:' , keymapList ) ;

					for ( j = 0 ; j < keymapList.length ; j ++ ) {
						keymap = keymapList[ j ] ;

						regexp = '^' +
							string.escape.regExp( keymap.starter ) +
							'([ -~]*)' +	// [ -~] match only all ASCII non-control character
							string.escape.regExp( keymap.ender ) ;

						matches = keymapCode.match( new RegExp( regexp ) , 'g' ) ;

						//console.log( 'for j:' , keymap , regexp , matches ) ;

						if ( matches ) {
							found = true ;

							handlerResult = keymap.handler.call( this , keymap.name , matches[ 1 ] ) ;
							bytes = matches[ 0 ].length ;
							this.emit( keymap.event , handlerResult.name , handlerResult.data ) ;

							break ;
						}
					}

					if ( found ) { break ; }
				}
			}

			// Nothing was found, so to not emit trash, we just abort the current buffer processing
			if ( ! found ) { this.emit( 'unknown' , chunk ) ; return ; }
		}
		else if ( chunk[ index ] >= 0x80 ) {
			// Unicode bytes per char guessing
			if ( chunk[ index ] < 0xc0 ) { continue ; }	// We are in a middle of an unicode multibyte sequence... Something fails somewhere, we will just continue for now...
			else if ( chunk[ index ] < 0xe0 ) { bytes = 2 ; }
			else if ( chunk[ index ] < 0xf0 ) { bytes = 3 ; }
			else if ( chunk[ index ] < 0xf8 ) { bytes = 4 ; }
			else if ( chunk[ index ] < 0xfc ) { bytes = 5 ; }
			else { bytes = 6 ; }

			buffer = chunk.slice( index , index + bytes ) ;
			char = buffer.toString( 'utf8' ) ;

			//if ( bytes > 2 ) { codepoint = punycode.ucs2.decode( char )[ 0 ] ; }
			if ( bytes > 2 ) { codepoint = string.unicode.firstCodePoint( char ) ; }
			else { codepoint = char.charCodeAt( 0 ) ; }

			this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: codepoint , code: buffer } ) ;
		}
		else {
			// Standard ASCII
			char = String.fromCharCode( chunk[ index ] ) ;
			this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: chunk[ index ] , code: chunk[ index ] } ) ;
		}

		index += bytes ;
	}
}

