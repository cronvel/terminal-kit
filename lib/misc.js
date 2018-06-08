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



var string = require( 'string-kit' ) ;



const misc = {} ;
module.exports = misc ;



const colorNameToIndexDict = {
	black: 0 ,
	red: 1 ,
	green: 2 ,
	yellow: 3 ,
	blue: 4 ,
	magenta: 5 ,
	cyan: 6 ,
	white: 7 ,
	gray: 8 ,
	brightblack: 8 ,
	brightred: 9 ,
	brightgreen: 10 ,
	brightyellow: 11 ,
	brightblue: 12 ,
	brightmagenta: 13 ,
	brightcyan: 14 ,
	brightwhite: 15
} ;



// Color name to index
misc.colorNameToIndex = function colorNameToIndex( color ) {
	return colorNameToIndexDict[ color.toLowerCase() ] ;
} ;



const indexToColorNameArray = [
	"black" , "red" , "green" , "yellow" , "blue" , "magenta" , "cyan" , "white" ,
	"gray" , "brightRed" , "brightGreen" , "brightYellow" , "brightBlue" , "brightMagenta" , "brightCyan" , "brightWhite"
] ;



// Color name to index
misc.indexToColorName = function indexToColorName( index ) {
	return indexToColorNameArray[ index ] ;
} ;



misc.hexToRgba = function hexToRgba( hex ) {
	// Strip the # if necessary
	if ( hex[ 0 ] === '#' ) { hex = hex.slice( 1 ) ; }

	if ( hex.length === 3 ) {
		hex = hex[ 0 ] + hex[ 0 ] + hex[ 1 ] + hex[ 1 ] + hex[ 2 ] + hex[ 2 ] ;
	}

	return {
		r: parseInt( hex.slice( 0 , 2 ) , 16 ) ,
		g: parseInt( hex.slice( 2 , 4 ) , 16 ) ,
		b: parseInt( hex.slice( 4 , 6 ) , 16 ) ,
		a: parseInt( hex.slice( 6 , 8 ) , 16 )
	} ;
} ;



// DEPRECATED function name
misc.color2index = misc.colorNameToIndex ;
misc.index2color = misc.indexToColorName ;
misc.hexToColor = misc.hexToRgba ;



// Strip all control chars, if newline is true, only newline control chars are preserved
misc.stripControlChars = function stripControlChars( str , newline ) {
	if ( newline ) { return str.replace( /[\x00-\x09\x0b-\x1f\x7f]/g , '' ) ; }
	return str.replace( /[\x00-\x1f\x7f]/g , '' ) ;
} ;



// From https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
var escapeSequenceRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g ;
var parserRegex         = /([\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><])|([^\u001b\u009b]+)/g ;



misc.stripEscapeSequences = function stripEscapeSequences( str ) {
	return str.replace( escapeSequenceRegex , '' ) ;
} ;



// Return the real width of the string (i.e. as displayed in the terminal)
misc.stringWidth = function stringWidth( str ) {
	var matches , width = 0 ;

	// Reset
	parserRegex.lastIndex = 0 ;

	while ( ( matches = parserRegex.exec( str ) ) ) {
		if ( matches[ 2 ] ) {
			width += string.unicode.width( matches[ 2 ] ) ;
		}
	}

	return width ;
} ;



// Truncate a string to a given real width
misc.truncateString = function truncateString( str , maxWidth ) {
	var matches , width = 0 , lastWidth = 0 ;

	// Reset
	parserRegex.lastIndex = 0 ;

	while ( ( matches = parserRegex.exec( str ) ) ) {
		if ( matches[ 2 ] ) {
			width += string.unicode.width( matches[ 2 ] ) ;

			if ( width >= maxWidth ) {
				if ( width === maxWidth ) {
					return str.slice( 0 , matches.index + matches[ 2 ].length ) ;
				}

				return str.slice( 0 , matches.index ) + string.unicode.widthLimit( matches[ 2 ] , maxWidth - lastWidth ) ;
			}

			lastWidth = width ;
		}
	}

	return str ;
} ;



// Function used for sequenceSkip option of string-kit's .wordwrap()
// TODO: many issues remaining
misc.escapeSequenceSkipFn = function escapeSequenceSkipFn( strArray , index ) {
	//console.error( '>>> Entering' ) ;
	var code ;

	if ( strArray[ index ] !== '\x1b' ) { return index ; }
	index ++ ;
	if ( strArray[ index ] !== '[' ) { return index ; }
	index ++ ;

	for ( ; index < strArray.length ; index ++ ) {
		code = strArray[ index ].charCodeAt( 0 ) ;
		//console.error( 'code:' , strArray[ index ] , code.toString( 16 ) ) ;

		if ( ( code >= 0x41 && code <= 0x5a ) || ( code >= 0x61 && code <= 0x7a ) ) {
			//console.error( "<<< break!" ) ;
			index ++ ;
			break ;
		}
	}

	return index ;
} ;

