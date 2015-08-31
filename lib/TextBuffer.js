/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2015 Cédric Ronvel 
	
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

// Load modules
//var tree = require( 'tree-kit' ) ;
//var async = require( 'async-kit' ) ;
/*
var fs = require( 'fs' ) ;
var string = require( 'string-kit' ) ;
var punycode = require( 'punycode' ) ;
var termkit = require( './termkit.js' ) ;
*/



// A buffer suitable for text editor



function TextBuffer() { throw new Error( 'Cannot create TextBuffer object directly.' ) ; }
module.exports = TextBuffer ;



TextBuffer.create = function create( options )
{
	// Manage options
	if ( ! options ) { options = {} ; }
	
	var textBuffer = Object.create( TextBuffer.prototype , {
		// a terminal or another screenBuffer
		dst: { value: options.dst , writable: true , enumerable: true } ,
		/*
		width: { enumerable: true , configurable: true ,
			value: Math.floor( options.width ) || ( options.dst ? options.dst.width : 1 )
		} ,
		height: { enumerable: true , configurable: true ,
			value: Math.floor( options.height ) || ( options.dst ? options.dst.height : 1 )
		} ,
		*/
		x: { writable: true , enumerable: true , value:
			options.x !== undefined ? options.x : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 )
		} ,
		y: { writable: true , enumerable: true , value:
			options.y !== undefined ? options.y : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 )
		} ,
		cx: { value: 0 , writable: true , enumerable: true } ,
		cy: { value: 0 , writable: true , enumerable: true } ,
		
		wrap: { value: options.wrap !== undefined ? options.wrap : true , writable: true , enumerable: true }
	} ) ;
	
	Object.defineProperties( textBuffer , {
		textBuffer: { enumerable: true , configurable: true , value: [] } ,
		attributeBuffer: { enumerable: true , configurable: true , value: [[]] }
	} ) ;
	
	return textBuffer ;
} ;



TextBuffer.prototype.moveTo = function moveTo( x , y )
{
	this.cx = x >= 0 ? x : 0 ;
	this.cy = y >= 0 ? y : 0 ;
	
	/*
	this.cy = Math.min( y , this.textBuffer.length - 1 ) ;
	this.cx = Math.min( x , this.textBuffer[ this.cy ].length - 1 ) ;
	*/
} ;



TextBuffer.prototype.insert = function insert( text , attributes )
{
	var lines , characters , x , y , xMax , yMax , insertLine , insertLineCount ;
	
	x = this.cx ;
	y = this.cy ;
	
	lines = text.split( '\n' ) ;
	yMax = y + lines.length - 1 ;
	
	/*
		Should be redone from scratch...
		2 cases:
			- text contains one line (no \n):
				current line = start of line + text + end of line
			- text contains many lines:
				textBuffer = start of buffer + start of line + text line 1 + text line 2 + ... + end of line + end of buffer
	*/
	
	
	if ( lines.length > 1 )
	{
		insertLineCount = 
		while ( 
	}
	
	for ( index = 0 ; y <= yMax ; y ++ , index ++ )
	{
		if ( ! this.textBuffer[ y ] ) { this.textBuffer[ y ] = '' ; }
		xMax = x + lines[ index ].length ;
		
		while ( x 
		
		this.textBuffer[ y ] = this.textBuffer[ y ].slice( 0 , x ) + lines[ index ] + this.textBuffer[ y ].slice( x ) ;
		x = 0 ;
	}
	
	// Set the cursor to the correct value
	this.cx = xMax ;
	this.cy = yMax ;
} ;



