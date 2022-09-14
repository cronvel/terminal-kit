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



const string = require( 'string-kit' ) ;



const colorNameToIndexDict = {
	// ANSI
	black: 0 ,
	red: 1 ,
	green: 2 ,
	yellow: 3 ,
	blue: 4 ,
	magenta: 5 ,
	violet: 5 ,
	cyan: 6 ,
	white: 7 ,
	grey: 8 ,
	gray: 8 ,
	brightblack: 8 ,
	brightred: 9 ,
	brightgreen: 10 ,
	brightyellow: 11 ,
	brightblue: 12 ,
	brightmagenta: 13 ,
	brightviolet: 13 ,
	brightcyan: 14 ,
	brightwhite: 15
} ;



// Color name to index
exports.colorNameToIndex = color => colorNameToIndexDict[ color.toLowerCase() ] ;



const indexToColorNameArray = [
	"black" , "red" , "green" , "yellow" , "blue" , "magenta" , "cyan" , "white" ,
	"gray" , "brightRed" , "brightGreen" , "brightYellow" , "brightBlue" , "brightMagenta" , "brightCyan" , "brightWhite"
] ;



// Color name to index
exports.indexToColorName = index => indexToColorNameArray[ index ] ;



exports.hexToRgba = hex => {
	// Strip the # if necessary
	if ( hex[ 0 ] === '#' ) { hex = hex.slice( 1 ) ; }

	if ( hex.length === 3 ) {
		hex = hex[ 0 ] + hex[ 0 ] + hex[ 1 ] + hex[ 1 ] + hex[ 2 ] + hex[ 2 ] ;
	}

	return {
		r: parseInt( hex.slice( 0 , 2 ) , 16 ) || 0 ,
		g: parseInt( hex.slice( 2 , 4 ) , 16 ) || 0 ,
		b: parseInt( hex.slice( 4 , 6 ) , 16 ) || 0 ,
		a: hex.length > 6 ? parseInt( hex.slice( 6 , 8 ) , 16 ) || 0 : 255
	} ;
} ;



// DEPRECATED function names
exports.color2index = exports.colorNameToIndex ;
exports.index2color = exports.indexToColorName ;
exports.hexToColor = exports.hexToRgba ;



// Strip all control chars, if newline is true, only newline control chars are preserved
exports.stripControlChars = ( str , newline ) => {
	if ( newline ) { return str.replace( /[\x00-\x09\x0b-\x1f\x7f]/g , '' ) ; }
	return str.replace( /[\x00-\x1f\x7f]/g , '' ) ;
} ;



// From https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
const escapeSequenceRegex       = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g ;
const escapeSequenceParserRegex = /([\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><])|([^\u001b\u009b]+)/g ;



exports.stripEscapeSequences = str => str.replace( escapeSequenceRegex , '' ) ;



// Return the real width of the string (i.e. as displayed in the terminal)
exports.ansiWidth =
exports.stringWidth = str => {
	var matches , width = 0 ;

	// Reset
	escapeSequenceParserRegex.lastIndex = 0 ;

	while ( ( matches = escapeSequenceParserRegex.exec( str ) ) ) {
		if ( matches[ 2 ] ) {
			width += string.unicode.width( matches[ 2 ] ) ;
		}
	}

	return width ;
} ;



// Userland may use this, it is more efficient than .truncateString() + .stringWidth(),
// and BTW even more than testing .stringWidth() then .truncateString() + .stringWidth()
var lastTruncateWidth = 0 ;
exports.getLastTruncateWidth = () => lastTruncateWidth ;



// Truncate a string to a given real width
exports.truncateAnsiString =
exports.truncateString = ( str , maxWidth ) => {
	var matches , width = 0 ;

	lastTruncateWidth = 0 ;

	// Reset
	escapeSequenceParserRegex.lastIndex = 0 ;

	while ( ( matches = escapeSequenceParserRegex.exec( str ) ) ) {
		if ( matches[ 2 ] ) {
			width += string.unicode.width( matches[ 2 ] ) ;

			if ( width >= maxWidth ) {
				if ( width === maxWidth ) {
					return str.slice( 0 , matches.index + matches[ 2 ].length ) ;
				}

				return str.slice( 0 , matches.index ) + string.unicode.truncateWidth( matches[ 2 ] , maxWidth - lastTruncateWidth ) ;
			}

			lastTruncateWidth = width ;
		}
	}

	return str ;
} ;



// Width of a string with a markup, without control chars
exports.markupWidth = str => {
	// Fix a possible ReDoS, the regex:   /\^\[[^\]]*]|\^(.)/g   was replaced by:   /\^\[[^\]]*]?|\^(.)/g
	// The exploit was possible with a string like: '^['.repeat(bigNumber)
	return string.unicode.width( str.replace( /\^\[[^\]]*]?|\^(.)/g , ( match , second ) => {
		if ( second === ' ' || second === '^' ) {
			return second ;
		}

		return '' ;
	} ) ) ;
} ;



// Truncate a string to a given real width, the string may contains markup, but no control chars
exports.truncateMarkupString = ( str , maxWidth ) => {
	var index = 0 , charWidth ,
		strArray = string.unicode.toArray( str ) ;

	lastTruncateWidth = 0 ;

	while ( index < strArray.length ) {
		if ( strArray[ index ] === '^' ) {
			index ++ ;

			if ( strArray[ index ] === '[' ) {
				while ( index < strArray.length && strArray[ index ] !== ']' ) { index ++ ; }
				index ++ ;
				continue ;
			}

			if ( strArray[ index ] !== ' ' && strArray[ index ] !== '^' ) {
				index ++ ;
				continue ;
			}
		}

		charWidth = string.unicode.isFullWidth( strArray[ index ] ) ? 2 : 1 ;

		if ( lastTruncateWidth + charWidth > maxWidth ) {
			strArray.length = index ;
			return strArray.join( '' ) ;
		}

		lastTruncateWidth += charWidth ;
		index ++ ;
	}

	return str ;
} ;



// Function used for sequenceSkip option of string-kit's .wordwrap()
// TODO: many issues remaining
exports.escapeSequenceSkipFn = ( strArray , index ) => {
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



exports.wordWrapAnsi = ( str , width ) => string.wordwrap( str , {
	width: width ,
	noJoin: true ,
	fill: true ,
	regroupFn: strArray => {
		var sequence = '' ,
			csi = false ,
			newStrArray = [] ;

		strArray.forEach( char => {
			var charCode ;

			if ( csi ) {
				sequence += char ;
				charCode = char.charCodeAt( 0 ) ;

				if ( ( charCode >= 0x41 && charCode <= 0x5a ) || ( charCode >= 0x61 && charCode <= 0x7a ) ) {
					newStrArray.push( sequence ) ;
					sequence = '' ;
					csi = false ;
				}
			}
			else if ( sequence ) {
				sequence += char ;

				if ( char === '[' ) {
					csi = true ;
				}
				else {
					newStrArray.push( sequence ) ;
					sequence = '' ;
				}
			}
			else if ( char === '\x1b' ) {
				sequence = char ;
			}
			else {
				newStrArray.push( char ) ;
			}
		} ) ;

		return newStrArray ;
	} ,
	charWidthFn: char => {
		if ( char[ 0 ] === '\x1b' ) { return 0 ; }
		return string.unicode.charWidth( char ) ;
	}
} ) ;



exports.wordwrapMarkup =	// <-- DEPRECATED name (bad camel case)
exports.wordWrapMarkup = ( str , width ) => string.wordwrap( str , {
	width: width ,
	noJoin: true ,
	fill: true ,
	regroupFn: strArray => {
		var markup = '' ,
			complexMarkup = false ,
			newStrArray = [] ;

		strArray.forEach( char => {
			if ( complexMarkup ) {
				markup += char ;

				if ( char === ']' ) {
					newStrArray.push( markup ) ;
					markup = '' ;
					complexMarkup = false ;
				}
			}
			else if ( markup ) {
				markup += char ;

				if ( char === '[' ) {
					complexMarkup = true ;
				}
				else {
					newStrArray.push( markup ) ;
					markup = '' ;
				}
			}
			else if ( char === '^' ) {
				markup = char ;
			}
			else {
				newStrArray.push( char ) ;
			}
		} ) ;

		return newStrArray ;
	} ,
	charWidthFn: char => {
		if ( char[ 0 ] === '^' && char[ 1 ] ) {
			if ( char[ 1 ] === '^' || char[ 1 ] === ' ' ) { return 1 ; }
			return 0 ;
		}

		return string.unicode.charWidth( char ) ;
	}
} ) ;



exports.preserveMarkupFormat = string.createFormatter( {
	argumentSanitizer: str => str.replace( /[\x00-\x1f\x7f^]/g , char => char === '^' ? '^^' : '' ) ,
	noMarkup: true
} ) ;



// Catch-all keywords to key:value
const CATCH_ALL_KEYWORDS = {
	// Foreground colors
	defaultColor: [ 'color' , 'default' ] ,
	black: [ 'color' , 'black' ] ,
	red: [ 'color' , 'red' ] ,
	green: [ 'color' , 'green' ] ,
	yellow: [ 'color' , 'yellow' ] ,
	blue: [ 'color' , 'blue' ] ,
	magenta: [ 'color' , 'magenta' ] ,
	cyan: [ 'color' , 'cyan' ] ,
	white: [ 'color' , 'white' ] ,
	grey: [ 'color' , 'grey' ] ,
	gray: [ 'color' , 'gray' ] ,
	brightBlack: [ 'color' , 'brightBlack' ] ,
	brightRed: [ 'color' , 'brightRed' ] ,
	brightGreen: [ 'color' , 'brightGreen' ] ,
	brightYellow: [ 'color' , 'brightYellow' ] ,
	brightBlue: [ 'color' , 'brightBlue' ] ,
	brightMagenta: [ 'color' , 'brightMagenta' ] ,
	brightCyan: [ 'color' , 'brightCyan' ] ,
	brightWhite: [ 'color' , 'brightWhite' ] ,

	// Background colors
	defaultBgColor: [ 'bgColor' , 'default' ] ,
	bgBlack: [ 'bgColor' , 'black' ] ,
	bgRed: [ 'bgColor' , 'red' ] ,
	bgGreen: [ 'bgColor' , 'green' ] ,
	bgYellow: [ 'bgColor' , 'yellow' ] ,
	bgBlue: [ 'bgColor' , 'blue' ] ,
	bgMagenta: [ 'bgColor' , 'magenta' ] ,
	bgCyan: [ 'bgColor' , 'cyan' ] ,
	bgWhite: [ 'bgColor' , 'white' ] ,
	bgGrey: [ 'bgColor' , 'grey' ] ,
	bgGray: [ 'bgColor' , 'gray' ] ,
	bgBrightBlack: [ 'bgColor' , 'brightBlack' ] ,
	bgBrightRed: [ 'bgColor' , 'brightRed' ] ,
	bgBrightGreen: [ 'bgColor' , 'brightGreen' ] ,
	bgBrightYellow: [ 'bgColor' , 'brightYellow' ] ,
	bgBrightBlue: [ 'bgColor' , 'brightBlue' ] ,
	bgBrightMagenta: [ 'bgColor' , 'brightMagenta' ] ,
	bgBrightCyan: [ 'bgColor' , 'brightCyan' ] ,
	bgBrightWhite: [ 'bgColor' , 'brightWhite' ] ,

	// Other styles
	dim: [ 'dim' , true ] ,
	bold: [ 'bold' , true ] ,
	underline: [ 'underline' , true ] ,
	italic: [ 'italic' , true ] ,
	inverse: [ 'inverse' , true ]
} ;

exports.markupCatchAllKeywords = CATCH_ALL_KEYWORDS ;



exports.markupOptions = {
	parse: true ,
	shiftMarkup: {
		'#': 'background'
	} ,
	markup: {
		':': null ,
		' ': markupStack => {
			markupStack.length = 0 ;
			return [ null , ' ' ] ;
		} ,
		';': markupStack => {
			markupStack.length = 0 ;
			return [ null , { specialReset: true } ] ;
		} ,

		'-': { dim: true } ,
		'+': { bold: true } ,
		'_': { underline: true } ,
		'/': { italic: true } ,
		'!': { inverse: true } ,

		'k': { color: 0 } ,
		'r': { color: 1 } ,
		'g': { color: 2 } ,
		'y': { color: 3 } ,
		'b': { color: 4 } ,
		'm': { color: 5 } ,
		'c': { color: 6 } ,
		'w': { color: 7 } ,
		'K': { color: 8 } ,
		'R': { color: 9 } ,
		'G': { color: 10 } ,
		'Y': { color: 11 } ,
		'B': { color: 12 } ,
		'M': { color: 13 } ,
		'C': { color: 14 } ,
		'W': { color: 15 }
	} ,
	shiftedMarkup: {
		background: {
			':': [ null , { defaultColor: true , bgDefaultColor: true } ] ,
			' ': markupStack => {
				markupStack.length = 0 ;
				return [ null , { defaultColor: true , bgDefaultColor: true } , ' ' ] ;
			} ,
			';': markupStack => {
				markupStack.length = 0 ;
				return [ null , { specialReset: true , defaultColor: true , bgDefaultColor: true } ] ;
			} ,

			'k': { bgColor: 0 } ,
			'r': { bgColor: 1 } ,
			'g': { bgColor: 2 } ,
			'y': { bgColor: 3 } ,
			'b': { bgColor: 4 } ,
			'm': { bgColor: 5 } ,
			'c': { bgColor: 6 } ,
			'w': { bgColor: 7 } ,
			'K': { bgColor: 8 } ,
			'R': { bgColor: 9 } ,
			'G': { bgColor: 10 } ,
			'Y': { bgColor: 11 } ,
			'B': { bgColor: 12 } ,
			'M': { bgColor: 13 } ,
			'C': { bgColor: 14 } ,
			'W': { bgColor: 15 }
		}
	} ,
	dataMarkup: {
		color: 'color' ,
		fgColor: 'color' ,
		fg: 'color' ,
		c: 'color' ,
		bgColor: 'bgColor' ,
		bg: 'bgColor'
	} ,
	markupCatchAll: ( markupStack , key , value ) => {
		var attr = {} ;

		if ( value === undefined ) {
			if ( key[ 0 ] === '#' ) {
				attr.color = key ;
			}
			else if ( CATCH_ALL_KEYWORDS[ key ] ) {
				attr[ CATCH_ALL_KEYWORDS[ key ][ 0 ] ] = CATCH_ALL_KEYWORDS[ key ][ 1 ] ;
			}
			else {
				// Fallback: it's a foreground color
				attr.color = key ;
			}
		}

		markupStack.push( attr ) ;
		return attr || {} ;
	}
} ;



const asciiSymbolName = {
	' ': 'SPACE' ,
	'!': 'EXCLAMATION' ,
	'"': 'DOUBLE_QUOTE' ,
	'#': 'HASH' ,
	'$': 'DOLLAR' ,
	'%': 'PERCENT' ,
	'&': 'AMPERSAND' ,
	"'": 'SINGLE_QUOTE' ,
	'(': 'OPEN_PARENTHESIS' ,
	')': 'CLOSE_PARENTHESIS' ,
	'*': 'ASTERISK' ,
	'+': 'PLUS' ,
	',': 'COMMA' ,
	'-': 'HYPHEN' ,
	'.': 'DOT' ,
	'/': 'SLASH' ,
	':': 'COLON' ,
	';': 'SEMICOLON' ,
	'<': 'LESS_THAN' ,
	'=': 'EQUAL' ,
	'>': 'GREATER_THAN' ,
	'?': 'QUESTION' ,
	'@': 'AT' ,
	'[': 'OPEN_BRACKET' ,
	'\\': 'BACKSLASH' ,
	']': 'CLOSE_BRACKET' ,
	'^': 'CARET' ,
	'_': 'UNDERSCORE' ,
	'`': 'BACK_QUOTE' ,
	'{': 'OPEN_BRACE' ,
	'|': 'PIPE' ,
	'}': 'CLOSE_BRACE' ,
	'~': 'TILDE'
} ;

// Non-control character name
exports.characterName = char => {
	if ( asciiSymbolName[ char ] ) { return asciiSymbolName[ char ] ; }
	return char.toUpperCase() ;
} ;

// Transform a Terminal-Kit Key code (like CTRL_C) to user-friendly/interface name (like Ctrl-C)
exports.keyToUserInterfaceName = key => {
	if ( asciiSymbolName[ key ] ) { return asciiSymbolName[ key ] ; }

	return key.replace(
		/([A-Za-z0-9])([A-Za-z0-9]*)|([_-]+)/g ,
		( match , firstLetter , endOfWord , separator ) => {
			if ( separator ) { return '-' ; }
			return firstLetter.toUpperCase() + endOfWord.toLowerCase() ;
		}
	) ;
} ;

// Transform a user-friendly/interface name (like Ctrl-C) to a Terminal-Kit Key code (like CTRL_C)
exports.userInterfaceNameToKey = key => {
	return key.replace(
		/([A-Za-z0-9]+)|([_-]+)/g ,
		( match , word , separator ) => {
			if ( separator ) { return '_' ; }
			return word.toUpperCase() ;
		}
	) ;
} ;

