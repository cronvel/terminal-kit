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



function ScreenBuffer24Bits() { throw new Error( 'Cannot create ScreenBuffer24Bits object directly.' ) ; }
module.exports = ScreenBuffer24Bits ;



var termkit = require( './termkit.js' ) ;



ScreenBuffer24Bits.prototype = Object.create( termkit.ScreenBuffer.prototype ) ;
ScreenBuffer24Bits.prototype.constructor = ScreenBuffer24Bits ;
ScreenBuffer24Bits.prototype.bitsPerColor = 24 ;



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
ScreenBuffer24Bits.create = function create( options )
{
	// Manage options
	if ( ! options ) { options = {} ; }
	
	var self = Object.create( ScreenBuffer24Bits.prototype , {
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
ScreenBuffer24Bits.createFromString = function createFromString( options , data )
{
	var x , y , len , attr , attrTrans , width , height , self ;
	
	// Manage options
	if ( ! options ) { options = {} ; }
	
	if ( typeof data !== 'string' )
	{
		if ( ! data.toString ) { throw new Error( '[terminal] ScreenBuffer24Bits.createFromDataString(): argument #1 should be a string or provide a .toString() method.' ) ; }
		data = data.toString() ;
	}
	
	// Transform the data into an array of lines
	data = termkit.stripControlChars( data , true ).split( '\n' ) ;
	
	// Compute the buffer size
	width = 0 ;
	height = data.length ;
	
	attr = options.attr !== undefined ? options.attr : ScreenBuffer24Bits.prototype.DEFAULT_ATTR ;
	if ( attr && typeof attr === 'object' && ! attr.BYTES_PER_ELEMENT ) { attr = ScreenBuffer24Bits.object2attr( attr ) ; }
	
	attrTrans = attr ;
	
	if ( options.transparencyChar )
	{
		if ( ! options.transparencyType ) { attrTrans |= ScreenBuffer24Bits.prototype.TRANSPARENCY ; }
		else { attrTrans |= options.transparencyType & ScreenBuffer24Bits.prototype.TRANSPARENCY ; }
	}
	
	// Compute the width of the screenBuffer
	for ( y = 0 ; y < data.length ; y ++ )
	{
		if ( data[ y ].length > width ) { width = data[ y ].length ; }
	}
	
	// Create the buffer with the right width & height
	self = ScreenBuffer24Bits.create( { width: width , height: height } ) ;
	
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
ScreenBuffer24Bits.createFromChars = ScreenBuffer24Bits.createFromString ;



ScreenBuffer24Bits.prototype.blitterCellBlendingIterator = function blitterCellBlendingIterator( p )
{
	var attr = this.readAttr( p.context.srcBuffer , p.srcStart ) ;
	
	var blendFn = ScreenBuffer24Bits.blendFn.normal ;
	var opacity = 1 ;
	
	if ( typeof p.context.blending === 'object' )
	{
		if ( p.context.blending.fn ) { blendFn = p.context.blending.fn ; }
		if ( p.context.blending.opacity !== undefined ) { opacity = p.context.blending.opacity ; }
	}
	
	if (
		! ( attr[ ScreenBuffer24Bits.BPOS_BLENDING ] & this.STYLE_TRANSPARENCY ) &&
		! ( attr[ ScreenBuffer24Bits.BPOS_BLENDING ] & this.CHAR_TRANSPARENCY ) &&
		attr[ ScreenBuffer24Bits.BPOS_A ] === 255 &&
		attr[ ScreenBuffer24Bits.BPOS_BG_A ] === 255 &&
		blendFn === ScreenBuffer24Bits.blendFn.normal
	)
	{
		// Fully opaque, copy it
		p.context.srcBuffer.copy( p.context.dstBuffer , p.dstStart , p.srcStart , p.srcEnd ) ;
		return ;
	}
	
	if (
		( attr[ ScreenBuffer24Bits.BPOS_BLENDING ] & this.STYLE_TRANSPARENCY ) &&
		( attr[ ScreenBuffer24Bits.BPOS_BLENDING ] & this.CHAR_TRANSPARENCY ) &&
		attr[ ScreenBuffer24Bits.BPOS_A ] === 0 &&
		attr[ ScreenBuffer24Bits.BPOS_BG_A ] === 0
	)
	{
		// Fully transparent, do nothing
		return ;
	}
	
	// Blending part...
	
	var alpha ;	// Normalized alpha
	
	if ( attr[ ScreenBuffer24Bits.BPOS_A ] )
	{
		alpha = opacity * attr[ ScreenBuffer24Bits.BPOS_A ] / 255 ;
		
		p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_R ] = alphaBlend(
			p.context.srcBuffer[ p.srcStart + ScreenBuffer24Bits.BPOS_R ] ,
			p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_R ] ,
			alpha ,
			blendFn
		) ;
		p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_G ] = alphaBlend(
			p.context.srcBuffer[ p.srcStart + ScreenBuffer24Bits.BPOS_G ] ,
			p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_G ] ,
			alpha ,
			blendFn
		) ;
		p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_B ] = alphaBlend(
			p.context.srcBuffer[ p.srcStart + ScreenBuffer24Bits.BPOS_B ] ,
			p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_B ] ,
			alpha ,
			blendFn
		) ;
		
		// Tmp:
		p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_A ] = 255 ;
	}
	
	if ( attr[ ScreenBuffer24Bits.BPOS_BG_A ] )
	{
		alpha = opacity * attr[ ScreenBuffer24Bits.BPOS_BG_A ] / 255 ;
		
		p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_BG_R ] = alphaBlend(
			p.context.srcBuffer[ p.srcStart + ScreenBuffer24Bits.BPOS_BG_R ] ,
			p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_BG_R ] ,
			alpha ,
			blendFn
		) ;
		p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_BG_G ] = alphaBlend(
			p.context.srcBuffer[ p.srcStart + ScreenBuffer24Bits.BPOS_BG_G ] ,
			p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_BG_G ] ,
			alpha ,
			blendFn
		) ;
		p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_BG_B ] = alphaBlend(
			p.context.srcBuffer[ p.srcStart + ScreenBuffer24Bits.BPOS_BG_B ] ,
			p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_BG_B ] ,
			alpha ,
			blendFn
		) ;
		
		// Tmp:
		p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_BG_A ] = 255 ;
	}
	
	if ( ! ( attr[ ScreenBuffer24Bits.BPOS_BLENDING ] & this.STYLE_TRANSPARENCY ) )
	{
		p.context.dstBuffer[ p.dstStart + ScreenBuffer24Bits.BPOS_STYLE ] =
			p.context.srcBuffer[ p.srcStart + ScreenBuffer24Bits.BPOS_STYLE ] ;
	}
	
	if ( ! ( attr[ ScreenBuffer24Bits.BPOS_BLENDING ] & this.CHAR_TRANSPARENCY ) )
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
ScreenBuffer24Bits.blendFn = {
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



ScreenBuffer24Bits.prototype.terminalBlitterLineIterator = function terminalBlitterLineIterator( p )
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
	if ( p.context.sequence.length > this.OUTPUT_THRESHOLD )
	{
		p.context.nfterm( p.context.sequence ) ;
		p.context.sequence = '' ;
		p.context.writes ++ ;
	}
} ;



ScreenBuffer24Bits.prototype.terminalBlitterCellIterator = function terminalBlitterCellIterator( p )
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
	if ( p.context.sequence.length > this.OUTPUT_THRESHOLD )
	{
		p.context.nfterm( p.context.sequence ) ;
		p.context.sequence = '' ;
		p.context.writes ++ ;
	}
	
	// Next expected cursor position
	p.context.cx = p.dstX + 1 ;
	p.context.cy = p.dstY ;
} ;



ScreenBuffer24Bits.loadSyncV2 = function loadSync( filepath )
{
	var i , content , header , screenBuffer ;
	
	// Let it crash if nothing found
	content = fs.readFileSync( filepath ) ;
	
	// See if we have got a 'SB' at the begining of the file
	if ( content.length < 3 || content.toString( 'ascii' , 0 , 3 ) !== 'SB\n' )
	{
		throw new Error( 'Magic number mismatch: this is not a ScreenBuffer24Bits file' ) ;
	}
	
	// search for the second \n
	for ( i = 3 ; i < content.length ; i ++ )
	{
		if ( content[ i ] === 0x0a ) { break ; }
	}
	
	if ( i === content.length )
	{
		throw new Error( 'No header found: this is not a ScreenBuffer24Bits file' ) ;
	}
	
	// Try to parse a JSON header
	try {
		header = JSON.parse( content.toString( 'utf8' , 3 , i ) ) ;
	}
	catch( error ) {
		throw new Error( 'No correct one-lined JSON header found: this is not a ScreenBuffer24Bits file' ) ;
	}
	
	// Mandatory header field
	if ( header.version === undefined || header.width === undefined || header.height === undefined )
	{
		throw new Error( 'Missing mandatory header data, this is a corrupted or obsolete ScreenBuffer24Bits file' ) ;
	}
	
	// Check bitsPerColor
	if ( header.bitsPerColor && header.bitsPerColor !== ScreenBuffer24Bits.prototype.bitsPerColor )
	{
		throw new Error( 'Bad Bits Per Color: ' + header.bitsPerColor + ' (should be ' + ScreenBuffer24Bits.prototype.bitsPerColor + ')' ) ;
	}
	
	// Bad size?
	if ( content.length !== i + 1 + header.width * header.height * ScreenBuffer24Bits.prototype.ITEM_SIZE )
	{
		throw new Error( 'Bad file size: this is a corrupted ScreenBuffer24Bits file' ) ;
	}
	
	// So the file exists, create a canvas based upon it
	screenBuffer = ScreenBuffer24Bits.create( {
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
ScreenBuffer24Bits.prototype.saveSyncV2 = function saveSync( filepath )
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



ScreenBuffer24Bits.loadSync = ScreenBuffer24Bits.loadSyncV2 ;
ScreenBuffer24Bits.prototype.saveSync = ScreenBuffer24Bits.prototype.saveSyncV2 ;



ScreenBuffer24Bits.prototype.dump = function dump()
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



ScreenBuffer24Bits.prototype.readAttr = function readAttr( buffer , at )
{
	return buffer.slice( at , at + this.ATTR_SIZE ) ;
} ;



ScreenBuffer24Bits.prototype.writeAttr = function writeAttr( buffer , attr , at )
{
	return attr.copy( buffer , at ) ;
} ;



ScreenBuffer24Bits.prototype.readChar = function readChar( buffer , at )
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



ScreenBuffer24Bits.prototype.writeChar = function writeChar( buffer , char , at )
{
	return buffer.write( char , at + this.ATTR_SIZE , this.CHAR_SIZE ) ;
} ;



ScreenBuffer24Bits.prototype.generateEscapeSequence = function generateEscapeSequence( term , attr )
{
	var esc = term.optimized.styleReset +
		term.optimized.color24bits( attr[ ScreenBuffer24Bits.BPOS_R ] , attr[ ScreenBuffer24Bits.BPOS_G ] , attr[ ScreenBuffer24Bits.BPOS_B ] ) +
		term.optimized.bgColor24bits( attr[ ScreenBuffer24Bits.BPOS_BG_R ] , attr[ ScreenBuffer24Bits.BPOS_BG_G ] , attr[ ScreenBuffer24Bits.BPOS_BG_B ] ) ;
	
	var style = attr[ ScreenBuffer24Bits.BPOS_STYLE ] ;
	
	// Style part
	if ( style & this.BOLD ) { esc += term.optimized.bold ; }
	if ( style & this.DIM ) { esc += term.optimized.dim ; }
	if ( style & this.ITALIC ) { esc += term.optimized.italic ; }
	if ( style & this.UNDERLINE ) { esc += term.optimized.underline ; }
	if ( style & this.BLINK ) { esc += term.optimized.blink ; }
	if ( style & this.INVERSE ) { esc += term.optimized.inverse ; }
	if ( style & this.HIDDEN ) { esc += term.optimized.hidden ; }
	if ( style & this.STRIKE ) { esc += term.optimized.strike ; }
	
	return esc ;
} ;



// Generate only the delta between the last and new attributes, may speed up things for the terminal process
// as well as consume less bandwidth, at the cost of small CPU increase in the application process
ScreenBuffer24Bits.prototype.generateDeltaEscapeSequence = function generateDeltaEscapeSequence( term , attr , lastAttr )
{
	//console.log( 'generateDeltaEscapeSequence' , attr , lastAttr ) ;
	
	var esc = '' ;
	
	// Color
	if (
		attr[ ScreenBuffer24Bits.BPOS_R ] !== lastAttr[ ScreenBuffer24Bits.BPOS_R ] ||
		attr[ ScreenBuffer24Bits.BPOS_G ] !== lastAttr[ ScreenBuffer24Bits.BPOS_G ] ||
		attr[ ScreenBuffer24Bits.BPOS_B ] !== lastAttr[ ScreenBuffer24Bits.BPOS_B ]
	)
	{
		esc += term.optimized.color24bits( attr[ ScreenBuffer24Bits.BPOS_R ] , attr[ ScreenBuffer24Bits.BPOS_G ] , attr[ ScreenBuffer24Bits.BPOS_B ] ) ;
	}
	
	// Bg color
	if (
		attr[ ScreenBuffer24Bits.BPOS_BG_R ] !== lastAttr[ ScreenBuffer24Bits.BPOS_BG_R ] ||
		attr[ ScreenBuffer24Bits.BPOS_BG_G ] !== lastAttr[ ScreenBuffer24Bits.BPOS_BG_G ] ||
		attr[ ScreenBuffer24Bits.BPOS_BG_B ] !== lastAttr[ ScreenBuffer24Bits.BPOS_BG_B ]
	)
	{
		esc += term.optimized.bgColor24bits( attr[ ScreenBuffer24Bits.BPOS_BG_R ] , attr[ ScreenBuffer24Bits.BPOS_BG_G ] , attr[ ScreenBuffer24Bits.BPOS_BG_B ] ) ;
	}
	
	
	var style = attr[ ScreenBuffer24Bits.BPOS_STYLE ] ;
	var lastStyle = lastAttr[ ScreenBuffer24Bits.BPOS_STYLE ] ;
	
	if ( style !== lastStyle )
	{
		// Bold and dim style are particular: all terminal has noBold = noDim
		
		if ( ( style & this.BOLD_DIM ) !== ( lastStyle & this.BOLD_DIM ) )
		{
			if ( ( ( lastStyle & this.BOLD ) && ! ( style & this.BOLD ) ) ||
				( ( lastStyle & this.DIM ) && ! ( style & this.DIM ) ) )
			{
				esc += term.optimized.noBold ;
				if ( style & this.BOLD ) { esc += term.optimized.bold ; }
				if ( style & this.DIM ) { esc += term.optimized.dim ; }
			}
			else
			{
				if ( ( style & this.BOLD ) && ! ( lastStyle & this.BOLD ) ) { esc += term.optimized.bold ; }
				if ( ( style & this.DIM ) && ! ( lastStyle & this.DIM ) ) { esc += term.optimized.dim ; }
			}
		}
		
		if ( ( style & this.ITALIC ) !== ( lastStyle & this.ITALIC ) )
		{
			esc += style & this.ITALIC ? term.optimized.italic : term.optimized.noItalic ;
		}
		
		if ( ( style & this.UNDERLINE ) !== ( lastStyle & this.UNDERLINE ) )
		{
			esc += style & this.UNDERLINE ? term.optimized.underline : term.optimized.noUnderline ;
		}
		
		if ( ( style & this.BLINK ) !== ( lastStyle & this.BLINK ) )
		{
			esc += style & this.BLINK ? term.optimized.blink : term.optimized.noBlink ;
		}
		
		if ( ( style & this.INVERSE ) !== ( lastStyle & this.INVERSE ) )
		{
			esc += style & this.INVERSE ? term.optimized.inverse : term.optimized.noInverse ;
		}
		
		if ( ( style & this.HIDDEN ) !== ( lastStyle & this.HIDDEN ) )
		{
			esc += style & this.HIDDEN ? term.optimized.hidden : term.optimized.noHidden ;
		}
		
		if ( ( style & this.STRIKE ) !== ( lastStyle & this.STRIKE ) )
		{
			esc += style & this.STRIKE ? term.optimized.strike : term.optimized.noStrike ;
		}
	}
	
	return esc ;
} ;





			/* "static" functions: they exist in both static and non-static for backward compatibility */



ScreenBuffer24Bits.attr2object = function attr2object( attr )
{
	var object = {} ;
	
	// Color part
	object.r = attr[ ScreenBuffer24Bits.BPOS_R ] ;
	object.g = attr[ ScreenBuffer24Bits.BPOS_G ] ;
	object.b = attr[ ScreenBuffer24Bits.BPOS_B ] ;
	object.a = attr[ ScreenBuffer24Bits.BPOS_A ] ;
	
	// Background color part
	object.bgR = attr[ ScreenBuffer24Bits.BPOS_BG_R ] ;
	object.bgG = attr[ ScreenBuffer24Bits.BPOS_BG_G ] ;
	object.bgB = attr[ ScreenBuffer24Bits.BPOS_BG_B ] ;
	object.bgA = attr[ ScreenBuffer24Bits.BPOS_BG_A ] ;
	
	// Style part
	object.bold = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & ScreenBuffer24Bits.prototype.BOLD ) ;
	object.dim = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & ScreenBuffer24Bits.prototype.DIM ) ;
	object.italic = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & ScreenBuffer24Bits.prototype.ITALIC ) ;
	object.underline = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & ScreenBuffer24Bits.prototype.UNDERLINE ) ;
	object.blink = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & ScreenBuffer24Bits.prototype.BLINK ) ;
	object.inverse = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & ScreenBuffer24Bits.prototype.INVERSE ) ;
	object.hidden = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & ScreenBuffer24Bits.prototype.HIDDEN ) ;
	object.strike = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & ScreenBuffer24Bits.prototype.STRIKE ) ;
	
	// Blending part
	object.styleTransparency = !! ( attr[ ScreenBuffer24Bits.BPOS_BLENDING ] & ScreenBuffer24Bits.prototype.STYLE_TRANSPARENCY ) ;
	object.charTransparency = !! ( attr[ ScreenBuffer24Bits.BPOS_BLENDING ] & ScreenBuffer24Bits.prototype.CHAR_TRANSPARENCY ) ;
	
	return object ;
} ;



ScreenBuffer24Bits.prototype.attr2object = function attr2object( attr )
{
	var object = {} ;
	
	// Color part
	object.r = attr[ ScreenBuffer24Bits.BPOS_R ] ;
	object.g = attr[ ScreenBuffer24Bits.BPOS_G ] ;
	object.b = attr[ ScreenBuffer24Bits.BPOS_B ] ;
	object.a = attr[ ScreenBuffer24Bits.BPOS_A ] ;
	
	// Background color part
	object.bgR = attr[ ScreenBuffer24Bits.BPOS_BG_R ] ;
	object.bgG = attr[ ScreenBuffer24Bits.BPOS_BG_G ] ;
	object.bgB = attr[ ScreenBuffer24Bits.BPOS_BG_B ] ;
	object.bgA = attr[ ScreenBuffer24Bits.BPOS_BG_A ] ;
	
	// Style part
	object.bold = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & this.BOLD ) ;
	object.dim = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & this.DIM ) ;
	object.italic = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & this.ITALIC ) ;
	object.underline = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & this.UNDERLINE ) ;
	object.blink = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & this.BLINK ) ;
	object.inverse = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & this.INVERSE ) ;
	object.hidden = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & this.HIDDEN ) ;
	object.strike = !! ( attr[ ScreenBuffer24Bits.BPOS_STYLE ] & this.STRIKE ) ;
	
	// Blending part
	object.styleTransparency = !! ( attr[ ScreenBuffer24Bits.BPOS_BLENDING ] & this.STYLE_TRANSPARENCY ) ;
	object.charTransparency = !! ( attr[ ScreenBuffer24Bits.BPOS_BLENDING ] & this.CHAR_TRANSPARENCY ) ;
	
	return object ;
} ;



ScreenBuffer24Bits.object2attr = function object2attr( object )
{
	var attr = Buffer.allocUnsafe( ScreenBuffer24Bits.prototype.ATTR_SIZE ) ;
	
	if ( ! object || typeof object !== 'object' ) { object = {} ; }
	
	// Color part
	attr[ ScreenBuffer24Bits.BPOS_R ] = + object.r || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_G ] = + object.g || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_B ] = + object.b || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_A ] = object.a !== undefined ? + object.a || 0 : 255 ;
	
	// Background color part
	attr[ ScreenBuffer24Bits.BPOS_BG_R ] = + object.bgR || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_BG_G ] = + object.bgG || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_BG_B ] = + object.bgB || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_BG_A ] = object.bgA !== undefined ? + object.bgA || 0 : 255 ;
	
	// Style part
	attr[ ScreenBuffer24Bits.BPOS_STYLE ] = 0 ;
	
	if ( object.bold ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= ScreenBuffer24Bits.prototype.BOLD ; }
	if ( object.dim ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= ScreenBuffer24Bits.prototype.DIM ; }
	if ( object.italic ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= ScreenBuffer24Bits.prototype.ITALIC ; }
	if ( object.underline ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= ScreenBuffer24Bits.prototype.UNDERLINE ; }
	if ( object.blink ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= ScreenBuffer24Bits.prototype.BLINK ; }
	if ( object.inverse ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= ScreenBuffer24Bits.prototype.INVERSE ; }
	if ( object.hidden ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= ScreenBuffer24Bits.prototype.HIDDEN ; }
	if ( object.strike ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= ScreenBuffer24Bits.prototype.STRIKE ; }
	
	// Blending part
	attr[ ScreenBuffer24Bits.BPOS_BLENDING ] = 0 ;
	if ( object.styleTransparency ) { attr[ ScreenBuffer24Bits.BPOS_BLENDING ] |= ScreenBuffer24Bits.prototype.STYLE_TRANSPARENCY ; }
	if ( object.charTransparency ) { attr[ ScreenBuffer24Bits.BPOS_BLENDING ] |= ScreenBuffer24Bits.prototype.CHAR_TRANSPARENCY ; }
	
	return attr ;
} ;



ScreenBuffer24Bits.prototype.object2attr = function object2attr( object )
{
	var attr = Buffer.allocUnsafe( ScreenBuffer24Bits.prototype.ATTR_SIZE ) ;
	
	if ( ! object || typeof object !== 'object' ) { object = {} ; }
	
	// Color part
	attr[ ScreenBuffer24Bits.BPOS_R ] = + object.r || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_G ] = + object.g || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_B ] = + object.b || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_A ] = object.a !== undefined ? + object.a || 0 : 255 ;
	
	// Background color part
	attr[ ScreenBuffer24Bits.BPOS_BG_R ] = + object.bgR || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_BG_G ] = + object.bgG || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_BG_B ] = + object.bgB || 0 ;
	attr[ ScreenBuffer24Bits.BPOS_BG_A ] = object.bgA !== undefined ? + object.bgA || 0 : 255 ;
	
	// Style part
	attr[ ScreenBuffer24Bits.BPOS_STYLE ] = 0 ;
	
	if ( object.bold ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= this.BOLD ; }
	if ( object.dim ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= this.DIM ; }
	if ( object.italic ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= this.ITALIC ; }
	if ( object.underline ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= this.UNDERLINE ; }
	if ( object.blink ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= this.BLINK ; }
	if ( object.inverse ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= this.INVERSE ; }
	if ( object.hidden ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= this.HIDDEN ; }
	if ( object.strike ) { attr[ ScreenBuffer24Bits.BPOS_STYLE ] |= this.STRIKE ; }
	
	// Blending part
	attr[ ScreenBuffer24Bits.BPOS_BLENDING ] = 0 ;
	if ( object.styleTransparency ) { attr[ ScreenBuffer24Bits.BPOS_BLENDING ] |= this.STYLE_TRANSPARENCY ; }
	if ( object.charTransparency ) { attr[ ScreenBuffer24Bits.BPOS_BLENDING ] |= this.CHAR_TRANSPARENCY ; }
	
	return attr ;
} ;





			/* Constants */



/*
	- 4 bytes: fg color + alpha
	- 4 bytes: bg color + alpha
	- 1 byte: style
	- 1 byte: blending flags
*/

// Data structure
ScreenBuffer24Bits.prototype.ATTR_SIZE = 10 ;
ScreenBuffer24Bits.prototype.CHAR_SIZE = 4 ;
ScreenBuffer24Bits.prototype.ITEM_SIZE = ScreenBuffer24Bits.prototype.ATTR_SIZE + ScreenBuffer24Bits.prototype.CHAR_SIZE ;

// Attr byte positions
ScreenBuffer24Bits.BPOS_R = 0 ;
ScreenBuffer24Bits.BPOS_G = 1 ;
ScreenBuffer24Bits.BPOS_B = 2 ;
ScreenBuffer24Bits.BPOS_A = 3 ;
ScreenBuffer24Bits.BPOS_BG_R = 4 ;
ScreenBuffer24Bits.BPOS_BG_G = 5 ;
ScreenBuffer24Bits.BPOS_BG_B = 6 ;
ScreenBuffer24Bits.BPOS_BG_A = 7 ;
ScreenBuffer24Bits.BPOS_STYLE = 8 ;
ScreenBuffer24Bits.BPOS_BLENDING = ScreenBuffer24Bits.BPOS_MISC = 9 ;



ScreenBuffer24Bits.prototype.DEFAULT_ATTR = ScreenBuffer24Bits.object2attr( {
	r: 255 ,
	g: 255 ,
	b: 255 ,
	a: 255 ,
	bgR: 0 ,
	bgG: 0 ,
	bgB: 0 ,
	bgA: 255
} ) ;

ScreenBuffer24Bits.prototype.CLEAR_ATTR = ScreenBuffer24Bits.object2attr( {
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

ScreenBuffer24Bits.prototype.CLEAR_BUFFER = Buffer.allocUnsafe( ScreenBuffer24Bits.prototype.ITEM_SIZE ) ;
ScreenBuffer24Bits.prototype.DEFAULT_ATTR.copy( ScreenBuffer24Bits.prototype.CLEAR_BUFFER ) ;
ScreenBuffer24Bits.prototype.CLEAR_BUFFER.write( ' \x00\x00\x00' , ScreenBuffer24Bits.prototype.ATTR_SIZE ) ;	// space


// Style mask
ScreenBuffer24Bits.prototype.BOLD = 1 ;
ScreenBuffer24Bits.prototype.DIM = 2 ;
ScreenBuffer24Bits.prototype.ITALIC = 4 ;
ScreenBuffer24Bits.prototype.UNDERLINE = 8 ;
ScreenBuffer24Bits.prototype.BLINK = 16 ;
ScreenBuffer24Bits.prototype.INVERSE = 32 ;
ScreenBuffer24Bits.prototype.HIDDEN = 64 ;
ScreenBuffer24Bits.prototype.STRIKE = 128 ;

ScreenBuffer24Bits.prototype.BOLD_DIM = ScreenBuffer24Bits.prototype.BOLD | ScreenBuffer24Bits.prototype.DIM ;



// Blending mask, flags and misc flags
/*
ScreenBuffer24Bits.prototype.BLENDING_MASK = 7 ;	// Blending mask
ScreenBuffer24Bits.prototype.TRANSPARENCY_MASK =
	ScreenBuffer24Bits.prototype.BLENDING_MASK +
	ScreenBuffer24Bits.prototype.STYLE_TRANSPARENCY +
	ScreenBuffer24Bits.prototype.CHAR_TRANSPARENCY ;

// if fg src color should be blended with bg dest color instead of fg dest color
ScreenBuffer24Bits.prototype.BLEND_SRC_FG_WITH_DEST_BG = 8 ;
*/

ScreenBuffer24Bits.prototype.STYLE_TRANSPARENCY = 4 ;
ScreenBuffer24Bits.prototype.CHAR_TRANSPARENCY = 8 ;

ScreenBuffer24Bits.prototype.LEADING_FULLWIDTH = 64 ;
ScreenBuffer24Bits.prototype.TRAILING_FULLWIDTH = 128 ;



// Tuning
ScreenBuffer24Bits.prototype.OUTPUT_THRESHOLD = 10000 ;	// minimum amount of data to retain before sending them to the terminal



// General purpose flags
ScreenBuffer24Bits.prototype.NONE = 0 ;	// Nothing


