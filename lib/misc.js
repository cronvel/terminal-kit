/*
	Terminal Kit
	
	Copyright (c) 2009 - 2017 Cédric Ronvel
	
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
misc.colorNameToIndex = function colorNameToIndex( color )
{
	return colorNameToIndexDict[ color.toLowerCase() ] ;
} ;



const indexToColorNameArray = [
	"black" , "red" , "green" , "yellow" , "blue" , "magenta" , "cyan" , "white" ,
	"gray" , "brightRed" , "brightGreen" , "brightYellow" , "brightBlue" , "brightMagenta" , "brightCyan" , "brightWhite"
] ;



// Color name to index
misc.indexToColorName = function indexToColorName( index )
{
	return indexToColorNameArray[ index ] ;
} ;



misc.hexToRgba = function hexToRgba( hex )
{
	// Strip the # if necessary
	if ( hex[ 0 ] === '#' ) { hex = hex.slice( 1 ) ; }
	
	if ( hex.length === 3 )
	{
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
misc.stripControlChars = function stripControlChars( str , newline )
{
	if ( newline ) { return str.replace( /[\x00-\x09\x0b-\x1f\x7f]/g , '' ) ; }
	else { return str.replace( /[\x00-\x1f\x7f]/g , '' ) ; }
} ;



// From https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
misc.escapeSequenceRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g ;



misc.stripEscapeSequences = function stripEscapeSequences( str )
{
	return str.replace( misc.escapeSequenceRegex , '' ) ;
} ;

