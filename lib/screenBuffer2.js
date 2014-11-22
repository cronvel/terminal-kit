/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2014 Cédric Ronvel 
	
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
var tree = require( 'tree-kit' ) ;
var async = require( 'async-kit' ) ;
var string = require( 'string-kit' ) ;



function ScreenBuffer() { throw new Error( 'Cannot create ScreenBuffer object directly.' ) ; } ;
module.exports = ScreenBuffer ;



ScreenBuffer.create = function create( parent , options )
{
	// Manage options
	if ( ! options ) { options = {} ; }
	
	var screenBuffer = Object.create( screenBuffer.ScreenBuffer.prototype , {
		// a terminal or another screenBuffer
		parent: { value: parent , enumerable: true } ,
		width: { value: options.width || parent.width , enumerable: true } ,
		height: { value: options.height || parent.height , enumerable: true } ,
		wrap: { value: options.wrap !== undefined ? options.wrap : true , writable: true , enumerable: true } ,
		offsetX: { value: options.offsetX || 0 , writable: true , enumerable: true } ,
		offsetY: { value: options.offsetY || 0 , writable: true , enumerable: true }
	} ;
	
	Object.defineProperties( screenBuffer , {
		buffer: { value: new Buffer( screenBuffer.width * screenBuffer.height * CHAR_SIZE ) , enumerable: true }
	} ) ;
	
	return screenBuffer ;
} ;



var CHAR_SIZE = 8 ;



ScreenBuffer.prototype.put = function put( x , y , attr , str )
{
	var i , lineOffset , len = str.length ;
	
	if ( typeof x !== 'number' || x < 0 ) { x = 0 ; }
	else if ( x >= this.width ) { x = this.width - 1 ; }
	else { x = Math.floor( x ) ; }
	
	if ( typeof y !== 'number' || y < 0 ) { y = 0 ; }
	else if ( y >= this.height ) { y = this.height - 1 ; }
	else { y = Math.floor( y ) ; }
	
	if ( typeof attr !== 'number' ) { attr = 0 ; }
	
	lineOffset = y * ( x * this.width * CHAR_SIZE ) ;
	
	for ( i = 0 ; i < len ; i ++ )
	{
		// Do some works here
		this.buffer.writeUInt32LE( lineOffset + x * CHAR_SIZE , str[ i ] ) ;
		
		x ++ ;
		
		if ( x >= this.width )
		{
			if ( ! this.wrap ) { return ; }
			
			x = 0 ;
			y ++ ;
			
			if ( y >= this.height ) { return ; }
			
			lineOffset = y * ( x * this.width * CHAR_SIZE ) ;
		}
	}
}




			/* Pseudo esc */



function moveTo( x , y )
{
		}
	}
} ;



	var y , x ;
	
	this.charBuffer = new Array( height ) ;
	this.attrBuffer = new Array( height ) ;
	
	this.charBuffer.foo = n ++ ;
	
	for ( y = 0 ; y < height ; y ++ )
	{
		this.charBuffer[ y ] = new Array( width ) ;
		this.attrBuffer[ y ] = new Array( width ) ;
		
		for ( x = 0 ; x < width ; x ++ )
		{
			this.charBuffer[ y ][ x ] = ' ' ;	// One utf-8 character
			this.attrBuffer[ y ][ x ] = this.styleReset ;
		}
	}



notChainable.redrawChars = function redrawChars()
{
	var x , y , xmin , xmax , ymin , ymax ;
	var nfterm = this.term.noFormat ;	// no format term (faster)
	
	// min & max in the buffer coordinate
	xmin = Math.max( 1 , 1 - this.offsetX ) ;
	xmax = Math.min( this.width , this.term.width - this.offsetX ) ;
	ymin = Math.max( 1 , 1 - this.offsetY ) ;
	ymax = Math.min( this.height , this.term.height - this.offsetY ) ;
	
	for ( y = ymin ; y <= ymax ; y ++ )
	{
		/* Probably not the fastest way to do it, but the simpler
		nfterm.moveTo( xmin + this.offsetX , y + this.offsetY ) ;
		for ( x = xmin ; x <= xmax ; x ++ )
		{
			nfterm( this.charBuffer[ y - 1 ][ x - 1 ] ) ;
		}
		//*/
		
		//* Probably faster
		nfterm.moveTo(
			xmin + this.offsetX ,
			y + this.offsetY ,
			this.charBuffer[ y - 1 ].slice( xmin - 1 , xmax ).join( '' )
		) ;
		//*/
	}
	
} ;



notChainable.redraw = function redraw()
{
	var x , y , xmin , xmax , ymin , ymax , line ;
	var nfterm = this.term.noFormat ;	// no format term (faster)
	
	// min & max in the buffer coordinate
	xmin = Math.max( 1 , 1 - this.offsetX ) ;
	xmax = Math.min( this.width , this.term.width - this.offsetX ) ;
	ymin = Math.max( 1 , 1 - this.offsetY ) ;
	ymax = Math.min( this.height , this.term.height - this.offsetY ) ;
	
	for ( y = ymin ; y <= ymax ; y ++ )
	{
		/* Probably not the fastest way to do it, but the simpler
		nfterm.moveTo( xmin + this.offsetX , y + this.offsetY ) ;
		for ( x = xmin ; x <= xmax ; x ++ )
		{
			nfterm( this.attrBuffer[ y - 1 ][ x - 1 ] + this.charBuffer[ y - 1 ][ x - 1 ] ) ;
		}
		//*/
		
		//* Probably faster
		line = '' ;
		
		for ( x = xmin ; x <= xmax ; x ++ )
		{
			line += this.attrBuffer[ y - 1 ][ x - 1 ] + this.charBuffer[ y - 1 ][ x - 1 ] ;
		}
		
		nfterm.moveTo( xmin + this.offsetX , y + this.offsetY , line ) ;
		//*/
	}
	
} ;



notChainable.dumpChars = function dumpChars()
{
	var y , x ;
	
	this.term( '\nDumping the character buffer:\n' ) ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		this.term( y + 1 ).column( 4 , '> ' ) ;
		
		for ( x = 0 ; x < this.width ; x ++ )
		{
			this.term( this.charBuffer[ y ][ x ] ) ;
		}
		
		this.term( '\n' ) ;
	}
	
} ;



notChainable.dump = function dump()
{
	var y , x ;
	
	this.term( '\nDumping the buffer (attributes + characters):\n' ) ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		this.term( y + 1 ).column( 4 , '> ' ) ;
		
		for ( x = 0 ; x < this.width ; x ++ )
		{
			this.term.magenta( string.escape.control( this.attrBuffer[ y ][ x ] ) ) ;
			this.term( this.charBuffer[ y ][ x ] ) ;
		}
		
		this.term( '\n' ) ;
	}
	
} ;


