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



function charCodeIsAlpha( charCode ) {
	return ( charCode >= 0x41 && charCode <= 0x5a ) || ( charCode >= 0x61 && charCode <= 0x7a ) ;
}

function toCharCodeStr( charCode ) {
	var charCodeStr = charCode.toString( 16 ) ;
	charCodeStr = charCodeStr.length > 1 ? '\\x' + charCodeStr : '\\x0' + charCodeStr ;
	return charCodeStr ;
}

function toCharOrCharCodeStr( charCode ) {
	if ( charCode <= 0x1f || charCode === 0x7f ) { return toCharCodeStr( charCode ) ; }
	return String.fromCharCode( charCode ) ;
}

function defaultArgs( args , defaultArgs_ ) {
	if ( ! defaultArgs_ || defaultArgs_.length <= args.length ) { return args ; }
	return args.concat( defaultArgs_.slice( args.length ) ) ;
}



SequencesReader.prototype.streamToEvent = async function( stream ) {
	var charCode , charCodeStr , char , bytes , codepoint ,
		type , args , argIndex , emitParsedSequence , subTree , subSubTree ,
		charBuffer = Buffer.alloc( 6 ) ;

	for ( ;; ) {
		charCode = ( await readStream( stream ) )[ 0 ] ;
		//console.error( 'got charCode:' , charCode.toString(16) ) ;

		if ( charCode <= 0x1f || charCode === 0x7f ) {
			
			charCodeStr = toCharCodeStr( charCode ) ;
			//console.error( 'control:' , charCodeStr ) ;
			
			if ( charCode === 0x1b ) {	// Escape, probably an escape sequence!
				charCode = ( await readStream( stream ) )[ 0 ] ;
				
				if ( charCode === 0x5b ) {	// [ =CSI
					args = '' ;
					
					while ( ! charCodeIsAlpha( charCode = ( await readStream( stream ) )[ 0 ] ) ) {
						args += String.fromCharCode( charCode ) ;
					}
					
					type = String.fromCharCode( charCode ) ;
					args = args.split( ';' ) ;
					emitParsedSequence = true ;
					
					subTree = fromOutputSequence.CSI[ type ] ;
					
					if ( subTree ) {
						if ( subTree.subTypes ) {
							for ( argIndex = 0 ; argIndex < args.length ; argIndex ++ ) {
								subSubTree = subTree.subTypes[ args[ argIndex ] ] 
								if ( subSubTree ) {
									this.emit(
										subSubTree.event || subTree.event ,
										subSubTree.subType || subTree.subType ,
										subSubTree.arg !== undefined ? subSubTree.arg : subTree.arg ,
										subSubTree.extraArgs || subTree.extraArgs || defaultArgs( args.slice( argIndex + 1 ) , subSubTree.defaultExtraArgs )
									) ;
									emitParsedSequence = false ;
									if ( subSubTree.continue ) { continue ; }
								}
								else {
									emitParsedSequence = true ;
								}
								break ;
							}
						}
						else if ( subTree.event ) {
							this.emit(
								subTree.event ,
								subTree.subType ,
								subTree.arg ,
								subTree.extraArgs || defaultArgs( args , subSubTree.defaultExtraArgs )
							) ;
							emitParsedSequence = false ;
						}
					}
					
					if ( emitParsedSequence ) {
						this.emit( 'CSI' , type , args ) ;
					}
					
					continue ;
				}
				else if ( charCode === 0x5d ) {	// ] =OSC
					args = '' ;
					
					for ( ;; ) {
						charCode = ( await readStream( stream ) )[ 0 ] ;
						
						if ( charCode === 0x07 ) { break ; }	// This is the OSC terminator, leave
						
						if ( charCode === 0x1b ) {
							charCode = ( await readStream( stream ) )[ 0 ] ;
							if ( charCode === 0x5c ) { break ; }	// ESC \ =string terminator
							// Ok, that was not the string terminator, so add the ESC key to the arg, but it is a bit strange to do that...
							args += String.fromCharCode( 0x1b ) ;
						}
						
						args += String.fromCharCode( charCode ) ;
					}
					
					args = args.split( ';' ) ;
					type = args.shift() ;
					emitParsedSequence = true ;
					
					subTree = fromOutputSequence.OSC[ type ] ;
					
					if ( subTree ) {
						if ( subTree.subTypes ) {
							for ( argIndex = 0 ; argIndex < args.length ; argIndex ++ ) {
								subSubTree = subTree.subTypes[ args[ argIndex ] ] 
								if ( subSubTree ) {
									this.emit( subSubTree.event || subTree.event , subSubTree.subType || subTree.subType , args.slice( argIndex + 1 ) ) ;
									emitParsedSequence = false ;
								}
								else {
									emitParsedSequence = true ;
								}
								break ;
							}
						}
						else if ( subTree.event ) {
							this.emit( subTree.event , subTree.subType , args ) ;
							emitParsedSequence = false ;
						}
					}
					
					if ( emitParsedSequence ) {
						this.emit( 'OSC' , type , args ) ;
					}
					
					continue ;
				}
				else {
					// Single/simple escape
					type = toCharOrCharCodeStr( charCode ) ;
					emitParsedSequence = true ;
					subTree = fromOutputSequence.ESC[ type ] ;
					
					if ( subTree ) {
						this.emit( subTree.event , subTree.subType , subTree.arg , subTree.extraArgs ) ;
						emitParsedSequence = false ;
					}
					
					if ( emitParsedSequence ) {
						this.emit( 'ESC' , type ) ;
					}
					
					continue ;
				}
			}
			else if ( fromOutputSequence.control[ charCodeStr ] ) {
				subTree = fromOutputSequence.control[ charCodeStr ] ;
				this.emit( subTree.event , subTree.subType , subTree.arg , subTree.extraArgs ) ;
				continue ;
			}
			else {
				this.emit( 'unknownControl' , charCodeStr ) ;
			}
		}
		
		if ( charCode >= 0x80 ) {
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
			this.emit( 'char' , char , codepoint ) ;
		}
		else {
			// Standard ASCII
			char = String.fromCharCode( charCode ) ;
			//this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: charCode , code: charCode } ) ;
			this.emit( 'char' , char , charCode ) ;
		}
	}
} ;

