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
var punycode = require( 'punycode' ) ;



function ScreenBuffer() { throw new Error( 'Cannot create ScreenBuffer object directly.' ) ; }
module.exports = ScreenBuffer ;



ScreenBuffer.create = function create( parent , options )
{
	// Manage options
	if ( ! options ) { options = {} ; }
	
	var screenBuffer = Object.create( ScreenBuffer.prototype , {
		// a terminal or another screenBuffer
		parent: { value: parent , enumerable: true } ,
		width: { value: options.width || parent.width , enumerable: true } ,
		height: { value: options.height || parent.height , enumerable: true } ,
		wrap: { value: options.wrap !== undefined ? options.wrap : true , writable: true , enumerable: true } ,
		offsetX: { value: options.offsetX || parent.Terminal ? 1 : 0 , writable: true , enumerable: true } ,
		offsetY: { value: options.offsetY || parent.Terminal ? 1 : 0 , writable: true , enumerable: true }
	} ) ;
	
	Object.defineProperties( screenBuffer , {
		buffer: { value: new Buffer( screenBuffer.width * screenBuffer.height * ITEM_SIZE ) , enumerable: true } ,
		lineBuffer: { value: new Array( screenBuffer.height ) , enumerable: true }
	} ) ;
	
	return screenBuffer ;
} ;



// Constants
const ATTR_SIZE = 4 ;	// do not edit, everything use Buffer.writeUInt32LE()
const CHAR_SIZE = 4 ;
const ITEM_SIZE = ATTR_SIZE + CHAR_SIZE ;

var CLEAR_BUFFER = new Buffer( ITEM_SIZE ) ;
CLEAR_BUFFER.writeUInt32LE( 7 << 24 , 0 ) ;	// white foreground, black background, no attribute
//CLEAR_BUFFER.write( ' \x00\x00\x00' , ATTR_SIZE ) ;	// space
CLEAR_BUFFER.write( ' a\x00\x00' , ATTR_SIZE ) ;	// space



ScreenBuffer.prototype.clear = function clear()
{
	//this.buffer.fill( 0 ) ; return this ;
	
	var i , length = this.width * this.height ;
	
	for ( i = 0 ; i < length ; i ++ )
	{
		CLEAR_BUFFER.copy( this.buffer , i * ITEM_SIZE ) ;
	}
	
	return this ;
} ;



ScreenBuffer.prototype.put = function put( x , y , attr , str )
{
	var i , offset ;
	var characters = punycode.ucs2.decode( str ) ;
	var len = characters.length ;
	
	if ( typeof x !== 'number' || x < 0 ) { x = 0 ; }
	else if ( x >= this.width ) { x = this.width - 1 ; }
	else { x = Math.floor( x ) ; }
	
	if ( typeof y !== 'number' || y < 0 ) { y = 0 ; }
	else if ( y >= this.height ) { y = this.height - 1 ; }
	else { y = Math.floor( y ) ; }
	
	if ( typeof attr !== 'number' ) { attr = 0 ; }
	
	this.lineBuffer[ y ] = undefined ;	// this line should be invalidated in the lineBuffer
	
	for ( i = 0 ; i < len ; i ++ )
	{
		offset = ( y * this.width + x ) * ITEM_SIZE ;
		
		// Write the attributes
		this.buffer.writeUInt32LE( attr , offset ) ;
		
		// Write the character
		this.buffer.write( punycode.ucs2.encode( [ characters[ i ] ] ) , offset + ATTR_SIZE , CHAR_SIZE ) ;
		
		x ++ ;
		
		if ( x >= this.width )
		{
			if ( ! this.wrap ) { return this ; }
			
			x = 0 ;
			y ++ ;
			
			if ( y >= this.height ) { return this ; }
			
			this.lineBuffer[ y ] = undefined ;	// this line should be invalidated in the lineBuffer
		}
	}
} ;



ScreenBuffer.prototype.draw = function draw()
{
	if ( this.parent instanceof ScreenBuffer ) { this.draw2buffer() ; }
	else if ( this.parent.Terminal ) { this.draw2terminal() ; }
	return this ;
} ;



ScreenBuffer.prototype.draw2terminal = function draw2terminal()
{
	var x , y , xmin , xmax , ymin , ymax , offset , line , attr , lastAttr ;
	var nfterm = this.parent.noFormat ;	// no format term (faster)
	
	// min & max in the buffer coordinate
	xmin = Math.max( 0 , 1 - this.offsetX ) ;
	xmax = Math.min( this.width - 1 , this.parent.width - this.offsetX ) ;
	ymin = Math.max( 0 , 1 - this.offsetY ) ;
	ymax = Math.min( this.height - 1 , this.parent.height - this.offsetY ) ;
	
	for ( y = ymin ; y <= ymax ; y ++ )
	{
		line = '' ;
		
		for ( x = xmin ; x <= xmax ; x ++ )
		{
			offset = ( y * this.width + x ) * ITEM_SIZE ;
			attr = this.buffer.readUInt32LE( offset ) ;
			
			if ( attr !== lastAttr )
			{
				line += generateEscape( this.parent , attr ) ;
				lastAttr = attr ;
			}
			
			line += readChar( this.buffer , offset + ATTR_SIZE ) ;
		}
		
		nfterm.moveTo( xmin + this.offsetX , y + this.offsetY , line ) ;
	}
} ;



ScreenBuffer.prototype.drawChars = function drawChars()
{
	if ( this.parent instanceof ScreenBuffer ) { this.drawChars2buffer() ; }
	else if ( this.parent.Terminal ) { this.drawChars2terminal() ; }
	return this ;
} ;



ScreenBuffer.prototype.drawChars2terminal = function drawChars2terminal()
{
	var x , y , xmin , xmax , ymin , ymax , offset , line ;
	var nfterm = this.parent.noFormat ;	// no format term (faster)
	
	// min & max in the buffer coordinate
	xmin = Math.max( 0 , 1 - this.offsetX ) ;
	xmax = Math.min( this.width - 1 , this.parent.width - this.offsetX ) ;
	ymin = Math.max( 0 , 1 - this.offsetY ) ;
	ymax = Math.min( this.height - 1 , this.parent.height - this.offsetY ) ;
	
	for ( y = ymin ; y <= ymax ; y ++ )
	{
		line = '' ;
		
		for ( x = xmin ; x <= xmax ; x ++ )
		{
			offset = ( y * this.width + x ) * ITEM_SIZE ;
			line += readChar( this.buffer , offset + ATTR_SIZE ) ;
		}
		
		nfterm.moveTo( xmin + this.offsetX , y + this.offsetY , line ) ;
	}
} ;











function readChar( buffer , at )
{
	var bytes ;
	
	if ( buffer[ at ] < 0x80 ) { bytes = 1 ; }
	else if ( buffer[ at ] < 0xc0 ) { return '\x00' ; } // We are in a middle of an unicode multibyte sequence... something was wrong...
	else if ( buffer[ at ] < 0xe0 ) { bytes = 2 ; }
	else if ( buffer[ at ] < 0xf0 ) { bytes = 3 ; }
	else if ( buffer[ at ] < 0xf8 ) { bytes = 4 ; }
	else if ( buffer[ at ] < 0xfc ) { bytes = 5 ; }
	else { bytes = 6 ; }
	
	if ( bytes > CHAR_SIZE ) { return '\x00' ; }
	
	return buffer.toString( 'utf8' , at , at + bytes ) ;
}



// Not useful, only found in ScreenBuffer.prototype.put
//function writeChar( char , buffer , at )



function generateEscape( term , attr )
{
	var color = attr >> 24 ,
		bgColor = ( attr >> 16 ) & 255 ,
		style = ( attr >> 8 ) & 255 ;
	
	return term.str.styleReset.color.bgColor( color , bgColor ) ;
}



ScreenBuffer.prototype.dumpChars = function dumpChars()
{
	var y , x , offset ;
	
	process.stdout.write( '\nDumping the buffer (characters only):\n' ) ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		process.stdout.write( y + ' > ' ) ;
		
		for ( x = 0 ; x < this.width ; x ++ )
		{
			offset = ( y * this.width + x ) * ITEM_SIZE ;
			//process.stdout.write( this.buffer.toString( 'utf8' , offset + ATTR_SIZE , offset + ITEM_SIZE )[ 0 ] ) ;
			process.stdout.write( readChar( this.buffer , offset + ATTR_SIZE ) ) ;
		}
		
		process.stdout.write( '\n' ) ;
	}
	
} ;



ScreenBuffer.prototype.dump = function dump()
{
	var y , x , offset ;
	
	process.stdout.write( '\nDumping the buffer (attributes + characters):\n' ) ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		process.stdout.write( y + ' > ' ) ;
		
		for ( x = 0 ; x < this.width ; x ++ )
		{
			offset = ( y * this.width + x ) * ITEM_SIZE ;
			process.stdout.write( string.format( '%x%x%x%x ' ,
				this.buffer.readUInt8( offset + 3 ) ,
				this.buffer.readUInt8( offset + 2 ) ,
				this.buffer.readUInt8( offset + 1 ) ,
				this.buffer.readUInt8( offset )
			) ) ;
			
			// Issue with character bigger than 16bits, javascript is more like UCS-2 than UTF-16
			//process.stdout.write( this.buffer.toString( 'utf8' , offset + ATTR_SIZE , offset + ITEM_SIZE )[ 0 ] + ' ' ) ;
			process.stdout.write( readChar( this.buffer , offset + ATTR_SIZE ) + ' ' ) ;
		}
		
		process.stdout.write( '\n' ) ;
	}
	
} ;



