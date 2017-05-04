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



// Load modules
//var tree = require( 'tree-kit' ) ;
//var async = require( 'async-kit' ) ;

//var events = require( 'events' ) ;
var NextGenEvents = require( 'nextgen-events' ) ;
var fs = require( 'fs' ) ;
var string = require( 'string-kit' ) ;
var punycode = require( 'punycode' ) ;



function ScreenBufferHD() { throw new Error( 'Cannot create ScreenBufferHD object directly.' ) ; }
module.exports = ScreenBufferHD ;



var termkit = require( './termkit.js' ) ;



ScreenBufferHD.prototype = Object.create( termkit.ScreenBuffer.prototype ) ;
ScreenBufferHD.prototype.constructor = ScreenBufferHD ;
ScreenBufferHD.prototype.bitsPerColor = 24 ;



/*
	options:
		* width: buffer width (default to dst.width)
		* height: buffer height (default to dst.height)
		* dst: writting destination
		* x: default position in the dst
		* y: default position in the dst
		* wrap: default wrapping behavior of .put()
		* noFill: do not call .fill() with default values at ScreenBuffer creation
		* blending: false/null or true or object (blending options): default blending params (can be overriden by .draw())
*/
ScreenBufferHD.create = function create( options )
{
	// Manage options
	if ( ! options ) { options = {} ; }
	
	var self = Object.create( ScreenBufferHD.prototype , {
		// a terminal or another screenBuffer
		dst: { value: options.dst , writable: true , enumerable: true } ,
		width: { enumerable: true , configurable: true ,
			value: Math.floor( options.width ) || ( options.dst ? options.dst.width : 1 )
		} ,
		height: { enumerable: true , configurable: true ,
			value: Math.floor( options.height ) || ( options.dst ? options.dst.height : 1 )
		} ,
		x: { writable: true , enumerable: true , value:
			options.x !== undefined ? options.x : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 )
		} ,
		y: { writable: true , enumerable: true , value:
			options.y !== undefined ? options.y : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 )
		} ,
		cx: { value: 0 , writable: true , enumerable: true } ,
		cy: { value: 0 , writable: true , enumerable: true } ,
		lastBuffer: { value: null , writable: true , enumerable: true } ,
		lastBufferUpToDate: { value: false , writable: true , enumerable: true } ,
		blending: { value: options.blending || false , writable: true , enumerable: true } ,
		wrap: { value: !! options.wrap , writable: true , enumerable: true }
	} ) ;
	
	Object.defineProperties( self , {
		buffer: { enumerable: true , configurable: true ,
			value: Buffer.allocUnsafe( self.width * self.height * self.ITEM_SIZE ) 
		}
	} ) ;
	
	if ( ! options.noFill ) { self.fill() ; }
	
	return self ;
} ;



/*
	options:
		* attr: attributes passed to .put()
		* transparencyChar: a char that is transparent
		* transparencyType: bit flags for the transparency char
*/
ScreenBufferHD.createFromString = function createFromString( options , data )
{
	var x , y , len , attr , attrTrans , width , height , self ;
	
	// Manage options
	if ( ! options ) { options = {} ; }
	
	if ( typeof data !== 'string' )
	{
		if ( ! data.toString ) { throw new Error( '[terminal] ScreenBufferHD.createFromDataString(): argument #1 should be a string or provide a .toString() method.' ) ; }
		data = data.toString() ;
	}
	
	// Transform the data into an array of lines
	data = termkit.stripControlChars( data , true ).split( '\n' ) ;
	
	// Compute the buffer size
	width = 0 ;
	height = data.length ;
	
	attr = options.attr !== undefined ? options.attr : ScreenBufferHD.prototype.DEFAULT_ATTR ;
	if ( attr && typeof attr === 'object' && ! attr.BYTES_PER_ELEMENT ) { attr = ScreenBufferHD.object2attr( attr ) ; }
	
	attrTrans = attr ;
	
	if ( options.transparencyChar )
	{
		if ( ! options.transparencyType ) { attrTrans |= ScreenBufferHD.prototype.TRANSPARENCY ; }
		else { attrTrans |= options.transparencyType & ScreenBufferHD.prototype.TRANSPARENCY ; }
	}
	
	// Compute the width of the screenBuffer
	for ( y = 0 ; y < data.length ; y ++ )
	{
		if ( data[ y ].length > width ) { width = data[ y ].length ; }
	}
	
	// Create the buffer with the right width & height
	self = ScreenBufferHD.create( { width: width , height: height } ) ;
	
	// Fill the buffer with data
	for ( y = 0 ; y < data.length ; y ++ )
	{
		if ( ! options.transparencyChar )
		{
			self.put( { x: 0 , y: y , attr: attr } , data[ y ] ) ;
		}
		else
		{
			len = data[ y ].length ;
			
			for ( x = 0 ; x < len ; x ++ )
			{
				if ( data[ y ][ x ] === options.transparencyChar )
				{
					self.put( { x: x , y: y , attr: attrTrans } , data[ y ][ x ] ) ;
				}
				else
				{
					self.put( { x: x , y: y , attr: attr } , data[ y ][ x ] ) ;
				}
			}
		}
	}
	
	return self ;
} ;



// Backward compatibility
ScreenBufferHD.createFromChars = ScreenBufferHD.createFromString ;



ScreenBufferHD.prototype.blitterCellBlendingIterator = function blitterCellBlendingIterator( p )
{
	var attr = this.readAttr( p.context.srcBuffer , p.srcStart ) ;
	
	var blendFn = ScreenBufferHD.blendFn.normal ;
	var opacity = 1 ;
	var blendSrcFgWithDstBg = false ;
	
	if ( typeof p.context.blending === 'object' )
	{
		if ( p.context.blending.fn ) { blendFn = p.context.blending.fn ; }
		if ( p.context.blending.opacity !== undefined ) { opacity = p.context.blending.opacity ; }
		if ( p.context.blending.blendSrcFgWithDstBg ) { blendSrcFgWithDstBg = true ; }
	}
	
	if (
		! ( attr[ BPOS_BLENDING ] & STYLE_TRANSPARENCY ) &&
		! ( attr[ BPOS_BLENDING ] & CHAR_TRANSPARENCY ) &&
		attr[ BPOS_A ] === 255 && attr[ BPOS_BG_A ] === 255 && opacity === 1 &&
		blendFn === ScreenBufferHD.blendFn.normal
	)
	{
		// Fully opaque, copy it
		p.context.srcBuffer.copy( p.context.dstBuffer , p.dstStart , p.srcStart , p.srcEnd ) ;
		return ;
	}
	
	if (
		( attr[ BPOS_BLENDING ] & STYLE_TRANSPARENCY ) &&
		( attr[ BPOS_BLENDING ] & CHAR_TRANSPARENCY ) &&
		( ! opacity || ( attr[ BPOS_A ] === 0 && attr[ BPOS_BG_A ] === 0 ) )
	)
	{
		// Fully transparent, do nothing
		return ;
	}
	
	// Blending part...
	
	var alpha ;	// Normalized alpha
	
	if ( attr[ BPOS_A ] )
	{
		alpha = opacity * attr[ BPOS_A ] / 255 ;
		
		if ( blendSrcFgWithDstBg )
		{
			p.context.dstBuffer[ p.dstStart + BPOS_R ] = alphaBlend(
				p.context.srcBuffer[ p.srcStart + BPOS_R ] ,
				p.context.dstBuffer[ p.dstStart + BPOS_BG_R ] ,
				alpha ,
				blendFn
			) ;
			p.context.dstBuffer[ p.dstStart + BPOS_G ] = alphaBlend(
				p.context.srcBuffer[ p.srcStart + BPOS_G ] ,
				p.context.dstBuffer[ p.dstStart + BPOS_BG_G ] ,
				alpha ,
				blendFn
			) ;
			p.context.dstBuffer[ p.dstStart + BPOS_B ] = alphaBlend(
				p.context.srcBuffer[ p.srcStart + BPOS_B ] ,
				p.context.dstBuffer[ p.dstStart + BPOS_BG_B ] ,
				alpha ,
				blendFn
			) ;
			// Blending alpha is special
			p.context.dstBuffer[ p.dstStart + BPOS_A ] = alphaBlend(
				p.context.srcBuffer[ p.srcStart + BPOS_A ] ,
				p.context.dstBuffer[ p.dstStart + BPOS_BG_A ] ,
				opacity ,
				ScreenBufferHD.blendFn.screen
			) ;
		}
		else
		{
			p.context.dstBuffer[ p.dstStart + BPOS_R ] = alphaBlend(
				p.context.srcBuffer[ p.srcStart + BPOS_R ] ,
				p.context.dstBuffer[ p.dstStart + BPOS_R ] ,
				alpha ,
				blendFn
			) ;
			p.context.dstBuffer[ p.dstStart + BPOS_G ] = alphaBlend(
				p.context.srcBuffer[ p.srcStart + BPOS_G ] ,
				p.context.dstBuffer[ p.dstStart + BPOS_G ] ,
				alpha ,
				blendFn
			) ;
			p.context.dstBuffer[ p.dstStart + BPOS_B ] = alphaBlend(
				p.context.srcBuffer[ p.srcStart + BPOS_B ] ,
				p.context.dstBuffer[ p.dstStart + BPOS_B ] ,
				alpha ,
				blendFn
			) ;
			// Blending alpha is special
			p.context.dstBuffer[ p.dstStart + BPOS_A ] = alphaBlend(
				p.context.srcBuffer[ p.srcStart + BPOS_A ] ,
				p.context.dstBuffer[ p.dstStart + BPOS_A ] ,
				opacity ,
				ScreenBufferHD.blendFn.screen
			) ;
		}
	}
	
	if ( attr[ BPOS_BG_A ] )
	{
		alpha = opacity * attr[ BPOS_BG_A ] / 255 ;
		
		p.context.dstBuffer[ p.dstStart + BPOS_BG_R ] = alphaBlend(
			p.context.srcBuffer[ p.srcStart + BPOS_BG_R ] ,
			p.context.dstBuffer[ p.dstStart + BPOS_BG_R ] ,
			alpha ,
			blendFn
		) ;
		p.context.dstBuffer[ p.dstStart + BPOS_BG_G ] = alphaBlend(
			p.context.srcBuffer[ p.srcStart + BPOS_BG_G ] ,
			p.context.dstBuffer[ p.dstStart + BPOS_BG_G ] ,
			alpha ,
			blendFn
		) ;
		p.context.dstBuffer[ p.dstStart + BPOS_BG_B ] = alphaBlend(
			p.context.srcBuffer[ p.srcStart + BPOS_BG_B ] ,
			p.context.dstBuffer[ p.dstStart + BPOS_BG_B ] ,
			alpha ,
			blendFn
		) ;
		// Blending alpha is special
		p.context.dstBuffer[ p.dstStart + BPOS_BG_A ] = alphaBlend(
			p.context.srcBuffer[ p.srcStart + BPOS_BG_A ] ,
			p.context.dstBuffer[ p.dstStart + BPOS_BG_A ] ,
			opacity ,
			ScreenBufferHD.blendFn.screen
		) ;
	}
	
	if ( ! ( attr[ BPOS_BLENDING ] & STYLE_TRANSPARENCY ) )
	{
		p.context.dstBuffer[ p.dstStart + BPOS_STYLE ] =
			p.context.srcBuffer[ p.srcStart + BPOS_STYLE ] ;
	}
	
	if ( ! ( attr[ BPOS_BLENDING ] & CHAR_TRANSPARENCY ) )
	{
		// Copy source character
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + this.ATTR_SIZE ,
			p.srcStart + this.ATTR_SIZE ,
			p.srcEnd
		) ;
	}
} ;



function alphaBlend( src , dest , alpha , fn )
{
	return Math.round( fn( src , dest ) * alpha + dest * ( 1 - alpha ) ) ;
}



// https://en.wikipedia.org/wiki/Blend_modes
ScreenBufferHD.blendFn = {
	normal: src => src ,
	multiply: ( src , dst ) => 255 * ( ( src / 255 ) * ( dst / 255 ) ) ,
	screen: ( src , dst ) => 255 * ( 1 - ( 1 - src / 255 ) * ( 1 - dst / 255 ) ) ,
	overlay: ( src , dst ) => dst <= 127 ?
		255 * ( 2 * ( src / 255 ) * ( dst / 255 ) ) :
		255 * ( 1 - 2 * ( 1 - src / 255 ) * ( 1 - dst / 255 ) ) ,
	hardLight: ( src , dst ) => src <= 127 ?
		255 * ( 2 * ( src / 255 ) * ( dst / 255 ) ) :
		255 * ( 1 - 2 * ( 1 - src / 255 ) * ( 1 - dst / 255 ) ) ,
	softLight: ( src , dst ) => {
		src /= 255 ;
		dst /= 255 ;
		return 255 * (  ( 1 - 2 * src ) * dst * dst + 2 * src * dst  ) ;
	}
} ;



ScreenBufferHD.prototype.terminalBlitterLineIterator = function terminalBlitterLineIterator( p )
{
	var offset , attr ;
	
	p.context.sequence += p.context.term.optimized.moveTo( p.dstXmin , p.dstY ) ;
	p.context.moves ++ ;
	
	for ( offset = p.srcStart ; offset < p.srcEnd ; offset += this.ITEM_SIZE )
	{
		attr = this.readAttr( p.context.srcBuffer , offset ) ;
		
		if ( ! p.context.lastAttr || ! attr.equals( p.context.lastAttr ) )
		{
			p.context.sequence += ! p.context.lastAttr || ! p.context.deltaEscapeSequence ?
				this.generateEscapeSequence( p.context.term , attr ) :
				this.generateDeltaEscapeSequence( p.context.term , attr , p.context.lastAttr ) ;
			p.context.lastAttr = attr ;
			p.context.attrs ++ ;
		}
		
		p.context.sequence += this.readChar( p.context.srcBuffer , offset ) ;
		p.context.cells ++ ;
	}
	
	// Output buffering saves a good amount of CPU usage both for the node's processus and the terminal processus
	if ( p.context.sequence.length > OUTPUT_THRESHOLD )
	{
		p.context.nfterm( p.context.sequence ) ;
		p.context.sequence = '' ;
		p.context.writes ++ ;
	}
} ;



ScreenBufferHD.prototype.terminalBlitterCellIterator = function terminalBlitterCellIterator( p )
{
	//var attr = p.context.srcBuffer.readUInt32BE( p.srcStart ) ;
	var attr = this.readAttr( p.context.srcBuffer , p.srcStart ) ;
	
	// If last buffer's cell === current buffer's cell, no need to refresh... skip that now
	if ( p.context.srcLastBuffer )
	{
		if (
			attr.equals( this.readAttr( p.context.srcLastBuffer , p.srcStart ) ) &&
			this.readChar( p.context.srcBuffer , p.srcStart ) === this.readChar( p.context.srcLastBuffer , p.srcStart ) )
		{
			return ;
		}
		
		p.context.srcBuffer.copy( p.context.srcLastBuffer , p.srcStart , p.srcStart , p.srcEnd ) ;
	}
	
	p.context.cells ++ ;
	
	if ( p.dstX !== p.context.cx || p.dstY !== p.context.cy )
	{
		p.context.sequence += p.context.term.optimized.moveTo( p.dstX , p.dstY ) ;
		p.context.moves ++ ;
	}
	
	if ( ! p.context.lastAttr || ! attr.equals( p.context.lastAttr ) )
	{
		p.context.sequence += ! p.context.lastAttr || ! p.context.deltaEscapeSequence ?
			this.generateEscapeSequence( p.context.term , attr ) :
			this.generateDeltaEscapeSequence( p.context.term , attr , p.context.lastAttr ) ;
		p.context.lastAttr = attr ;
		p.context.attrs ++ ;
	}
	
	p.context.sequence += this.readChar( p.context.srcBuffer , p.srcStart ) ;
	
	// Output buffering saves a good amount of CPU usage both for the node's processus and the terminal processus
	if ( p.context.sequence.length > OUTPUT_THRESHOLD )
	{
		p.context.nfterm( p.context.sequence ) ;
		p.context.sequence = '' ;
		p.context.writes ++ ;
	}
	
	// Next expected cursor position
	p.context.cx = p.dstX + 1 ;
	p.context.cy = p.dstY ;
} ;



ScreenBufferHD.loadSyncV2 = function loadSync( filepath )
{
	var i , content , header , screenBuffer ;
	
	// Let it crash if nothing found
	content = fs.readFileSync( filepath ) ;
	
	// See if we have got a 'SB' at the begining of the file
	if ( content.length < 3 || content.toString( 'ascii' , 0 , 3 ) !== 'SB\n' )
	{
		throw new Error( 'Magic number mismatch: this is not a ScreenBufferHD file' ) ;
	}
	
	// search for the second \n
	for ( i = 3 ; i < content.length ; i ++ )
	{
		if ( content[ i ] === 0x0a ) { break ; }
	}
	
	if ( i === content.length )
	{
		throw new Error( 'No header found: this is not a ScreenBufferHD file' ) ;
	}
	
	// Try to parse a JSON header
	try {
		header = JSON.parse( content.toString( 'utf8' , 3 , i ) ) ;
	}
	catch( error ) {
		throw new Error( 'No correct one-lined JSON header found: this is not a ScreenBufferHD file' ) ;
	}
	
	// Mandatory header field
	if ( header.version === undefined || header.width === undefined || header.height === undefined )
	{
		throw new Error( 'Missing mandatory header data, this is a corrupted or obsolete ScreenBufferHD file' ) ;
	}
	
	// Check bitsPerColor
	if ( header.bitsPerColor && header.bitsPerColor !== ScreenBufferHD.prototype.bitsPerColor )
	{
		throw new Error( 'Bad Bits Per Color: ' + header.bitsPerColor + ' (should be ' + ScreenBufferHD.prototype.bitsPerColor + ')' ) ;
	}
	
	// Bad size?
	if ( content.length !== i + 1 + header.width * header.height * ScreenBufferHD.prototype.ITEM_SIZE )
	{
		throw new Error( 'Bad file size: this is a corrupted ScreenBufferHD file' ) ;
	}
	
	// So the file exists, create a canvas based upon it
	screenBuffer = ScreenBufferHD.create( {
		width: header.width ,
		height: header.height
	} ) ;
	
	content.copy( screenBuffer.buffer , 0 , i + 1 ) ;
	
	return screenBuffer ;
} ;



// This new format use JSON header for a maximal flexibility rather than a fixed binary header.
// The header start with a magic number SB\n then a compact single-line JSON that end with an \n.
// So the data part start after the second \n, providing a variable header size.
// This will allow adding meta data without actually changing the file format.
ScreenBufferHD.prototype.saveSyncV2 = function saveSync( filepath )
{
	var content , header ;
	
	header = {
		version: 2 ,
		width: this.width ,
		height: this.height
	} ;
	
	header = 'SB\n' + JSON.stringify( header ) + '\n' ;
	
	content = Buffer.allocUnsafe( header.length + this.buffer.length ) ;
	content.write( header ) ;
	
	this.buffer.copy( content , header.length ) ;
	
	// Let it crash if something bad happens
	fs.writeFileSync( filepath , content ) ;
} ;



ScreenBufferHD.loadSync = ScreenBufferHD.loadSyncV2 ;
ScreenBufferHD.prototype.saveSync = ScreenBufferHD.prototype.saveSyncV2 ;



ScreenBufferHD.fromNdarrayImage = function fromNdarrayImage( pixels , options )
{
	var x , xMax = pixels.shape[ 0 ] ,
		y , yMax = Math.ceil( pixels.shape[ 1 ] / 2 ) ,
		hasAlpha = pixels.shape[ 2 ] === 4 ;
	
	var image = termkit.ScreenBufferHD.create( { width: xMax , height: yMax , blending: true , noFill: true } ) ;
	
	for ( x = 0 ; x < xMax ; x ++ )
	{
		for ( y = 0 ; y < yMax ; y ++ )
		{
			if ( y * 2 + 1 < pixels.shape[ 1 ] )
			{
				image.put(
					{
						x: x ,
						y: y ,
						attr: {
							r: pixels.get( x , y * 2 , 0 ) ,
							g: pixels.get( x , y * 2 , 1 ) ,
							b: pixels.get( x , y * 2 , 2 ) ,
							a: hasAlpha ? pixels.get( x , y * 2 , 3 ) : 255 ,
							bgR: pixels.get( x , y * 2 + 1 , 0 ) ,
							bgG: pixels.get( x , y * 2 + 1 , 1 ) ,
							bgB: pixels.get( x , y * 2 + 1 , 2 ) ,
							bgA: hasAlpha ? pixels.get( x , y * 2 + 1 , 3 ) : 255
						}
					} ,
					'▀'
				) ;
			}
			else
			{
				image.put(
					{
						x: x ,
						y: y ,
						attr: {
							r: pixels.get( x , y * 2 , 0 ) ,
							g: pixels.get( x , y * 2 , 1 ) ,
							b: pixels.get( x , y * 2 , 2 ) ,
							a: hasAlpha ? pixels.get( x , y * 2 , 3 ) : 255 ,
							bgR: 0 , bgG: 0 , bgB: 0 , bgA: 0
						}
					} ,
					'▀'
				) ;
			}
		}
	}
	
	return image ;
} ;



ScreenBufferHD.loadImage = termkit.image.load.bind( ScreenBufferHD , ScreenBufferHD.fromNdarrayImage ) ;



ScreenBufferHD.prototype.dump = function dump()
{
	var y , x , offset , str = '' ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		for ( x = 0 ; x < this.width ; x ++ )
		{
			offset = ( y * this.width + x ) * this.ITEM_SIZE ;
			
			str += string.format( '%x%x%x%x %x%x%x%x %x%x ' ,
				this.buffer.readUInt8( offset ) ,
				this.buffer.readUInt8( offset + 1 ) ,
				this.buffer.readUInt8( offset + 2 ) ,
				this.buffer.readUInt8( offset + 3 ) ,
				this.buffer.readUInt8( offset + 4 ) ,
				this.buffer.readUInt8( offset + 5 ) ,
				this.buffer.readUInt8( offset + 6 ) ,
				this.buffer.readUInt8( offset + 7 ) ,
				this.buffer.readUInt8( offset + 8 ) ,
				this.buffer.readUInt8( offset + 9 )
			) ;
			
			str += this.readChar( this.buffer , offset ) + '  ' ;
		}
		
		str += '\n' ;
	}
	
	return str ;
} ;



ScreenBufferHD.prototype.readAttr = function readAttr( buffer , at )
{
	return buffer.slice( at , at + this.ATTR_SIZE ) ;
} ;



ScreenBufferHD.prototype.writeAttr = function writeAttr( buffer , attr , at )
{
	return attr.copy( buffer , at ) ;
} ;



ScreenBufferHD.prototype.readChar = function readChar( buffer , at )
{
	var bytes ;
	
	at += this.ATTR_SIZE ;
	
	if ( buffer[ at ] < 0x80 ) { bytes = 1 ; }
	else if ( buffer[ at ] < 0xc0 ) { return '\x00' ; } // We are in a middle of an unicode multibyte sequence... something was wrong...
	else if ( buffer[ at ] < 0xe0 ) { bytes = 2 ; }
	else if ( buffer[ at ] < 0xf0 ) { bytes = 3 ; }
	else if ( buffer[ at ] < 0xf8 ) { bytes = 4 ; }
	else if ( buffer[ at ] < 0xfc ) { bytes = 5 ; }
	else { bytes = 6 ; }
	
	if ( bytes > this.CHAR_SIZE ) { return '\x00' ; }
	
	return buffer.toString( 'utf8' , at , at + bytes ) ;
} ;



ScreenBufferHD.prototype.writeChar = function writeChar( buffer , char , at )
{
	return buffer.write( char , at + this.ATTR_SIZE , this.CHAR_SIZE ) ;
} ;



ScreenBufferHD.prototype.generateEscapeSequence = function generateEscapeSequence( term , attr )
{
	var esc = term.optimized.styleReset +
		term.optimized.color24bits( attr[ BPOS_R ] , attr[ BPOS_G ] , attr[ BPOS_B ] ) +
		term.optimized.bgColor24bits( attr[ BPOS_BG_R ] , attr[ BPOS_BG_G ] , attr[ BPOS_BG_B ] ) ;
	
	var style = attr[ BPOS_STYLE ] ;
	
	// Style part
	if ( style & BOLD ) { esc += term.optimized.bold ; }
	if ( style & DIM ) { esc += term.optimized.dim ; }
	if ( style & ITALIC ) { esc += term.optimized.italic ; }
	if ( style & UNDERLINE ) { esc += term.optimized.underline ; }
	if ( style & BLINK ) { esc += term.optimized.blink ; }
	if ( style & INVERSE ) { esc += term.optimized.inverse ; }
	if ( style & HIDDEN ) { esc += term.optimized.hidden ; }
	if ( style & STRIKE ) { esc += term.optimized.strike ; }
	
	return esc ;
} ;



// Generate only the delta between the last and new attributes, may speed up things for the terminal process
// as well as consume less bandwidth, at the cost of small CPU increase in the application process
ScreenBufferHD.prototype.generateDeltaEscapeSequence = function generateDeltaEscapeSequence( term , attr , lastAttr )
{
	//console.log( 'generateDeltaEscapeSequence' , attr , lastAttr ) ;
	
	var esc = '' ;
	
	// Color
	if (
		attr[ BPOS_R ] !== lastAttr[ BPOS_R ] ||
		attr[ BPOS_G ] !== lastAttr[ BPOS_G ] ||
		attr[ BPOS_B ] !== lastAttr[ BPOS_B ]
	)
	{
		esc += term.optimized.color24bits( attr[ BPOS_R ] , attr[ BPOS_G ] , attr[ BPOS_B ] ) ;
	}
	
	// Bg color
	if (
		attr[ BPOS_BG_R ] !== lastAttr[ BPOS_BG_R ] ||
		attr[ BPOS_BG_G ] !== lastAttr[ BPOS_BG_G ] ||
		attr[ BPOS_BG_B ] !== lastAttr[ BPOS_BG_B ]
	)
	{
		esc += term.optimized.bgColor24bits( attr[ BPOS_BG_R ] , attr[ BPOS_BG_G ] , attr[ BPOS_BG_B ] ) ;
	}
	
	
	var style = attr[ BPOS_STYLE ] ;
	var lastStyle = lastAttr[ BPOS_STYLE ] ;
	
	if ( style !== lastStyle )
	{
		// Bold and dim style are particular: all terminal has noBold = noDim
		
		if ( ( style & BOLD_DIM ) !== ( lastStyle & BOLD_DIM ) )
		{
			if ( ( ( lastStyle & BOLD ) && ! ( style & BOLD ) ) ||
				( ( lastStyle & DIM ) && ! ( style & DIM ) ) )
			{
				esc += term.optimized.noBold ;
				if ( style & BOLD ) { esc += term.optimized.bold ; }
				if ( style & DIM ) { esc += term.optimized.dim ; }
			}
			else
			{
				if ( ( style & BOLD ) && ! ( lastStyle & BOLD ) ) { esc += term.optimized.bold ; }
				if ( ( style & DIM ) && ! ( lastStyle & DIM ) ) { esc += term.optimized.dim ; }
			}
		}
		
		if ( ( style & ITALIC ) !== ( lastStyle & ITALIC ) )
		{
			esc += style & ITALIC ? term.optimized.italic : term.optimized.noItalic ;
		}
		
		if ( ( style & UNDERLINE ) !== ( lastStyle & UNDERLINE ) )
		{
			esc += style & UNDERLINE ? term.optimized.underline : term.optimized.noUnderline ;
		}
		
		if ( ( style & BLINK ) !== ( lastStyle & BLINK ) )
		{
			esc += style & BLINK ? term.optimized.blink : term.optimized.noBlink ;
		}
		
		if ( ( style & INVERSE ) !== ( lastStyle & INVERSE ) )
		{
			esc += style & INVERSE ? term.optimized.inverse : term.optimized.noInverse ;
		}
		
		if ( ( style & HIDDEN ) !== ( lastStyle & HIDDEN ) )
		{
			esc += style & HIDDEN ? term.optimized.hidden : term.optimized.noHidden ;
		}
		
		if ( ( style & STRIKE ) !== ( lastStyle & STRIKE ) )
		{
			esc += style & STRIKE ? term.optimized.strike : term.optimized.noStrike ;
		}
	}
	
	return esc ;
} ;





			/* "static" functions: they exist in both static and non-static for backward compatibility */



ScreenBufferHD.attr2object = function attr2object( attr )
{
	var object = {} ;
	
	// Color part
	object.r = attr[ BPOS_R ] ;
	object.g = attr[ BPOS_G ] ;
	object.b = attr[ BPOS_B ] ;
	object.a = attr[ BPOS_A ] ;
	
	// Background color part
	object.bgR = attr[ BPOS_BG_R ] ;
	object.bgG = attr[ BPOS_BG_G ] ;
	object.bgB = attr[ BPOS_BG_B ] ;
	object.bgA = attr[ BPOS_BG_A ] ;
	
	// Style part
	object.bold = !! ( attr[ BPOS_STYLE ] & BOLD ) ;
	object.dim = !! ( attr[ BPOS_STYLE ] & DIM ) ;
	object.italic = !! ( attr[ BPOS_STYLE ] & ITALIC ) ;
	object.underline = !! ( attr[ BPOS_STYLE ] & UNDERLINE ) ;
	object.blink = !! ( attr[ BPOS_STYLE ] & BLINK ) ;
	object.inverse = !! ( attr[ BPOS_STYLE ] & INVERSE ) ;
	object.hidden = !! ( attr[ BPOS_STYLE ] & HIDDEN ) ;
	object.strike = !! ( attr[ BPOS_STYLE ] & STRIKE ) ;
	
	// Blending part
	object.styleTransparency = !! ( attr[ BPOS_BLENDING ] & STYLE_TRANSPARENCY ) ;
	object.charTransparency = !! ( attr[ BPOS_BLENDING ] & CHAR_TRANSPARENCY ) ;
	
	object.void = !! ( attr[ BPOS_BLENDING ] & VOID ) ;
	
	return object ;
} ;



ScreenBufferHD.prototype.attr2object = function attr2object( attr )
{
	var object = {} ;
	
	// Color part
	object.r = attr[ BPOS_R ] ;
	object.g = attr[ BPOS_G ] ;
	object.b = attr[ BPOS_B ] ;
	object.a = attr[ BPOS_A ] ;
	
	// Background color part
	object.bgR = attr[ BPOS_BG_R ] ;
	object.bgG = attr[ BPOS_BG_G ] ;
	object.bgB = attr[ BPOS_BG_B ] ;
	object.bgA = attr[ BPOS_BG_A ] ;
	
	// Style part
	object.bold = !! ( attr[ BPOS_STYLE ] & BOLD ) ;
	object.dim = !! ( attr[ BPOS_STYLE ] & DIM ) ;
	object.italic = !! ( attr[ BPOS_STYLE ] & ITALIC ) ;
	object.underline = !! ( attr[ BPOS_STYLE ] & UNDERLINE ) ;
	object.blink = !! ( attr[ BPOS_STYLE ] & BLINK ) ;
	object.inverse = !! ( attr[ BPOS_STYLE ] & INVERSE ) ;
	object.hidden = !! ( attr[ BPOS_STYLE ] & HIDDEN ) ;
	object.strike = !! ( attr[ BPOS_STYLE ] & STRIKE ) ;
	
	// Blending part
	object.styleTransparency = !! ( attr[ BPOS_BLENDING ] & STYLE_TRANSPARENCY ) ;
	object.charTransparency = !! ( attr[ BPOS_BLENDING ] & CHAR_TRANSPARENCY ) ;
	
	object.void = !! ( attr[ BPOS_BLENDING ] & VOID ) ;
	
	return object ;
} ;



ScreenBufferHD.object2attr = function object2attr( object )
{
	var attr = Buffer.allocUnsafe( ScreenBufferHD.prototype.ATTR_SIZE ) ;
	
	if ( ! object || typeof object !== 'object' ) { object = {} ; }
	
	// Color part
	attr[ BPOS_R ] = + object.r || 0 ;
	attr[ BPOS_G ] = + object.g || 0 ;
	attr[ BPOS_B ] = + object.b || 0 ;
	attr[ BPOS_A ] = object.a !== undefined ? + object.a || 0 : 255 ;
	
	// Background color part
	attr[ BPOS_BG_R ] = + object.bgR || 0 ;
	attr[ BPOS_BG_G ] = + object.bgG || 0 ;
	attr[ BPOS_BG_B ] = + object.bgB || 0 ;
	attr[ BPOS_BG_A ] = object.bgA !== undefined ? + object.bgA || 0 : 255 ;
	
	// Style part
	attr[ BPOS_STYLE ] = 0 ;
	
	if ( object.bold ) { attr[ BPOS_STYLE ] |= BOLD ; }
	if ( object.dim ) { attr[ BPOS_STYLE ] |= DIM ; }
	if ( object.italic ) { attr[ BPOS_STYLE ] |= ITALIC ; }
	if ( object.underline ) { attr[ BPOS_STYLE ] |= UNDERLINE ; }
	if ( object.blink ) { attr[ BPOS_STYLE ] |= BLINK ; }
	if ( object.inverse ) { attr[ BPOS_STYLE ] |= INVERSE ; }
	if ( object.hidden ) { attr[ BPOS_STYLE ] |= HIDDEN ; }
	if ( object.strike ) { attr[ BPOS_STYLE ] |= STRIKE ; }
	
	// Blending part
	attr[ BPOS_BLENDING ] = 0 ;
	if ( object.styleTransparency ) { attr[ BPOS_BLENDING ] |= STYLE_TRANSPARENCY ; }
	if ( object.charTransparency ) { attr[ BPOS_BLENDING ] |= CHAR_TRANSPARENCY ; }
	
	if ( object.void ) { attr[ BPOS_BLENDING ] |= VOID ; }
	
	return attr ;
} ;



ScreenBufferHD.prototype.object2attr = function object2attr( object )
{
	var attr = Buffer.allocUnsafe( ScreenBufferHD.prototype.ATTR_SIZE ) ;
	
	if ( ! object || typeof object !== 'object' ) { object = {} ; }
	
	// Color part
	attr[ BPOS_R ] = + object.r || 0 ;
	attr[ BPOS_G ] = + object.g || 0 ;
	attr[ BPOS_B ] = + object.b || 0 ;
	attr[ BPOS_A ] = object.a !== undefined ? + object.a || 0 : 255 ;
	
	// Background color part
	attr[ BPOS_BG_R ] = + object.bgR || 0 ;
	attr[ BPOS_BG_G ] = + object.bgG || 0 ;
	attr[ BPOS_BG_B ] = + object.bgB || 0 ;
	attr[ BPOS_BG_A ] = object.bgA !== undefined ? + object.bgA || 0 : 255 ;
	
	// Style part
	attr[ BPOS_STYLE ] = 0 ;
	
	if ( object.bold ) { attr[ BPOS_STYLE ] |= BOLD ; }
	if ( object.dim ) { attr[ BPOS_STYLE ] |= DIM ; }
	if ( object.italic ) { attr[ BPOS_STYLE ] |= ITALIC ; }
	if ( object.underline ) { attr[ BPOS_STYLE ] |= UNDERLINE ; }
	if ( object.blink ) { attr[ BPOS_STYLE ] |= BLINK ; }
	if ( object.inverse ) { attr[ BPOS_STYLE ] |= INVERSE ; }
	if ( object.hidden ) { attr[ BPOS_STYLE ] |= HIDDEN ; }
	if ( object.strike ) { attr[ BPOS_STYLE ] |= STRIKE ; }
	
	// Blending part
	attr[ BPOS_BLENDING ] = 0 ;
	if ( object.styleTransparency ) { attr[ BPOS_BLENDING ] |= STYLE_TRANSPARENCY ; }
	if ( object.charTransparency ) { attr[ BPOS_BLENDING ] |= CHAR_TRANSPARENCY ; }
	
	if ( object.void ) { attr[ BPOS_BLENDING ] |= VOID ; }
	
	return attr ;
} ;





			/* Constants */



// General purpose flags
const NONE = 0 ;	// Nothing

// Attr byte positions
const BPOS_R = 0 ;
const BPOS_G = 1 ;
const BPOS_B = 2 ;
const BPOS_A = 3 ;
const BPOS_BG_R = 4 ;
const BPOS_BG_G = 5 ;
const BPOS_BG_B = 6 ;
const BPOS_BG_A = 7 ;
const BPOS_STYLE = 8 ;
const BPOS_MISC = 9 ;
const BPOS_BLENDING = BPOS_MISC ;



// Style flags
const BOLD = 1 ;
const DIM = 2 ;
const ITALIC = 4 ;
const UNDERLINE = 8 ;
const BLINK = 16 ;
const INVERSE = 32 ;
const HIDDEN = 64 ;
const STRIKE = 128 ;

const BOLD_DIM = BOLD | DIM ;

// Misc flags
const STYLE_TRANSPARENCY = 4 ;
const CHAR_TRANSPARENCY = 8 ;

// E.g.: if it needs redraw
const VOID = 32 ;

const LEADING_FULLWIDTH = 64 ;
const TRAILING_FULLWIDTH = 128 ;

// Unused bits: 1, 2 and 16



// Tuning
const OUTPUT_THRESHOLD = 10000 ;	// minimum amount of data to retain before sending them to the terminal



/*
	Cell structure:
	- 4 bytes: fg rgba
	- 4 bytes: bg rgba
	- 1 byte: style
	- 1 byte: blending flags
*/

// Data structure
ScreenBufferHD.prototype.ATTR_SIZE = 10 ;
ScreenBufferHD.prototype.CHAR_SIZE = 4 ;
ScreenBufferHD.prototype.ITEM_SIZE = ScreenBufferHD.prototype.ATTR_SIZE + ScreenBufferHD.prototype.CHAR_SIZE ;

ScreenBufferHD.prototype.DEFAULT_ATTR = ScreenBufferHD.object2attr( {
	r: 255 ,
	g: 255 ,
	b: 255 ,
	a: 255 ,
	bgR: 0 ,
	bgG: 0 ,
	bgB: 0 ,
	bgA: 255
} ) ;

ScreenBufferHD.prototype.CLEAR_ATTR = ScreenBufferHD.object2attr( {
	r: 255 ,
	g: 255 ,
	b: 255 ,
	a: 0 ,
	bgR: 0 ,
	bgG: 0 ,
	bgB: 0 ,
	bgA: 0 ,
	charTransparency: true ,
	styleTransparency: true
} ) ;

ScreenBufferHD.prototype.CLEAR_BUFFER = Buffer.allocUnsafe( ScreenBufferHD.prototype.ITEM_SIZE ) ;
ScreenBufferHD.prototype.CLEAR_ATTR.copy( ScreenBufferHD.prototype.CLEAR_BUFFER ) ;
ScreenBufferHD.prototype.CLEAR_BUFFER.write( ' \x00\x00\x00' , ScreenBufferHD.prototype.ATTR_SIZE ) ;	// space

ScreenBufferHD.prototype.CLEAR_VOID_ATTR = ScreenBufferHD.object2attr( { void: true } ) ;
ScreenBufferHD.prototype.CLEAR_VOID_BUFFER = Buffer.allocUnsafe( ScreenBufferHD.prototype.ITEM_SIZE ) ;
ScreenBufferHD.prototype.CLEAR_VOID_ATTR.copy( ScreenBufferHD.prototype.CLEAR_VOID_BUFFER ) ;
ScreenBufferHD.prototype.CLEAR_VOID_BUFFER.write( ' \x00\x00\x00' , ScreenBufferHD.prototype.ATTR_SIZE ) ;	// space

