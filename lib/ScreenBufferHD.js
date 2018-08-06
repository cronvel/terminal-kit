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



const ScreenBuffer = require( './ScreenBuffer.js' ) ;

const fs = require( 'fs' ) ;
const string = require( 'string-kit' ) ;



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
function ScreenBufferHD( options = {} ) {
	ScreenBuffer.call( this , options ) ;

	/*
	this.dst = options.dst ;	// a terminal or another screenBuffer
	this.width = Math.floor( options.width ) || ( options.dst ? options.dst.width : 1 ) ;
	this.height = Math.floor( options.height ) || ( options.dst ? options.dst.height : 1 ) ;
	this.x = options.x !== undefined ? options.x : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 ) ;	// eslint-disable-line
	this.y = options.y !== undefined ? options.y : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 ) ;	// eslint-disable-line
	this.cx = 0 ;
	this.cy = 0 ;
	this.lastBuffer = null ;
	this.lastBufferUpToDate = false ;
	this.blending = options.blending || false ;
	this.wrap = !! options.wrap ;
	this.buffer = Buffer.allocUnsafe( this.width * this.height * this.ITEM_SIZE ) ;

	if ( ! options.noFill ) { this.fill() ; }
	*/
}

module.exports = ScreenBufferHD ;



const termkit = require( './termkit.js' ) ;



ScreenBufferHD.prototype = Object.create( ScreenBuffer.prototype ) ;
ScreenBufferHD.prototype.constructor = ScreenBufferHD ;
ScreenBufferHD.prototype.bitsPerColor = 24 ;

// Backward compatibility
ScreenBufferHD.create = ( ... args ) => new ScreenBufferHD( ... args ) ;



/*
	options:
		* attr: attributes passed to .put()
		* transparencyChar: a char that is transparent
		* transparencyType: bit flags for the transparency char
*/
ScreenBufferHD.createFromString = function createFromString( options , data ) {
	var x , y , len , attr , attrTrans , width , height , self ;

	// Manage options
	if ( ! options ) { options = {} ; }

	if ( typeof data !== 'string' ) {
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

	if ( options.transparencyChar ) {
		if ( ! options.transparencyType ) { attrTrans |= ScreenBufferHD.prototype.TRANSPARENCY ; }
		else { attrTrans |= options.transparencyType & ScreenBufferHD.prototype.TRANSPARENCY ; }
	}

	// Compute the width of the screenBuffer
	for ( y = 0 ; y < data.length ; y ++ ) {
		if ( data[ y ].length > width ) { width = data[ y ].length ; }
	}

	// Create the buffer with the right width & height
	self = new ScreenBufferHD( { width: width , height: height } ) ;

	// Fill the buffer with data
	for ( y = 0 ; y < data.length ; y ++ ) {
		if ( ! options.transparencyChar ) {
			self.put( { x: 0 , y: y , attr: attr } , data[ y ] ) ;
		}
		else {
			len = data[ y ].length ;

			for ( x = 0 ; x < len ; x ++ ) {
				if ( data[ y ][ x ] === options.transparencyChar ) {
					self.put( { x: x , y: y , attr: attrTrans } , data[ y ][ x ] ) ;
				}
				else {
					self.put( { x: x , y: y , attr: attr } , data[ y ][ x ] ) ;
				}
			}
		}
	}

	return self ;
} ;



// Backward compatibility
ScreenBufferHD.createFromChars = ScreenBufferHD.createFromString ;



var colorScheme = require( './colorScheme/gnome.json' ).map( o => ( { r: o.r , g: o.g , b: o.b } ) ) ;
var bgColorScheme = colorScheme.map( o => ( { bgR: o.r , bgG: o.g , bgB: o.b } ) ) ;

ScreenBufferHD.prototype.MARKUP_ATTR_OBJECT = {
	normal: {
		'-': { dim: true } ,
		'+': { bold: true } ,
		'_': { underline: true } ,
		'/': { italic: true } ,
		'!': { inverse: true } ,

		'k': colorScheme[ 0 ] ,
		'r': colorScheme[ 1 ] ,
		'g': colorScheme[ 2 ] ,
		'y': colorScheme[ 3 ] ,
		'b': colorScheme[ 4 ] ,
		'm': colorScheme[ 5 ] ,
		'c': colorScheme[ 6 ] ,
		'w': colorScheme[ 7 ] ,
		'K': colorScheme[ 8 ] ,
		'R': colorScheme[ 9 ] ,
		'G': colorScheme[ 10 ] ,
		'Y': colorScheme[ 11 ] ,
		'B': colorScheme[ 12 ] ,
		'M': colorScheme[ 13 ] ,
		'C': colorScheme[ 14 ] ,
		'W': colorScheme[ 15 ]
	} ,
	background: {
		'k': bgColorScheme[ 0 ] ,
		'r': bgColorScheme[ 1 ] ,
		'g': bgColorScheme[ 2 ] ,
		'y': bgColorScheme[ 3 ] ,
		'b': bgColorScheme[ 4 ] ,
		'm': bgColorScheme[ 5 ] ,
		'c': bgColorScheme[ 6 ] ,
		'w': bgColorScheme[ 7 ] ,
		'K': bgColorScheme[ 8 ] ,
		'R': bgColorScheme[ 9 ] ,
		'G': bgColorScheme[ 10 ] ,
		'Y': bgColorScheme[ 11 ] ,
		'B': bgColorScheme[ 12 ] ,
		'M': bgColorScheme[ 13 ] ,
		'C': bgColorScheme[ 14 ] ,
		'W': bgColorScheme[ 15 ]
	}
} ;



ScreenBufferHD.prototype.blitterCellBlendingIterator = function blitterCellBlendingIterator( p ) {
	var attr = this.readAttr( p.context.srcBuffer , p.srcStart ) ;

	var blendFn = ScreenBufferHD.blendFn.normal ;
	var opacity = 1 ;
	var blendSrcFgWithDstBg = false ;

	if ( typeof p.context.blending === 'object' ) {
		if ( p.context.blending.fn ) { blendFn = p.context.blending.fn ; }
		if ( p.context.blending.opacity !== undefined ) { opacity = p.context.blending.opacity ; }
		if ( p.context.blending.blendSrcFgWithDstBg ) { blendSrcFgWithDstBg = true ; }
	}

	if (
		! ( attr[ BPOS_MISC ] & STYLE_TRANSPARENCY ) &&
		! ( attr[ BPOS_MISC ] & CHAR_TRANSPARENCY ) &&
		attr[ BPOS_A ] === 255 && attr[ BPOS_BG_A ] === 255 && opacity === 1 &&
		blendFn === ScreenBufferHD.blendFn.normal
	) {
		// Fully opaque, copy it
		p.context.srcBuffer.copy( p.context.dstBuffer , p.dstStart , p.srcStart , p.srcEnd ) ;
		return ;
	}

	if (
		( attr[ BPOS_MISC ] & STYLE_TRANSPARENCY ) &&
		( attr[ BPOS_MISC ] & CHAR_TRANSPARENCY ) &&
		( ! opacity || ( attr[ BPOS_A ] === 0 && attr[ BPOS_BG_A ] === 0 ) )
	) {
		// Fully transparent, do nothing
		return ;
	}

	// Blending part...

	var alpha ;	// Normalized alpha

	if ( attr[ BPOS_A ] ) {
		alpha = opacity * attr[ BPOS_A ] / 255 ;

		if ( blendSrcFgWithDstBg ) {
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
		else {
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

	if ( attr[ BPOS_BG_A ] ) {
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

	if ( ! ( attr[ BPOS_MISC ] & STYLE_TRANSPARENCY ) ) {
		p.context.dstBuffer[ p.dstStart + BPOS_STYLE ] =
			p.context.srcBuffer[ p.srcStart + BPOS_STYLE ] ;
	}

	if ( ! ( attr[ BPOS_MISC ] & CHAR_TRANSPARENCY ) ) {
		// Copy source character
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + this.ATTR_SIZE ,
			p.srcStart + this.ATTR_SIZE ,
			p.srcEnd
		) ;
	}
} ;



function alphaBlend( src , dst , alpha , fn ) {
	return Math.round( fn( src , dst ) * alpha + dst * ( 1 - alpha ) ) ;
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



ScreenBufferHD.prototype.terminalBlitterLineIterator = function terminalBlitterLineIterator( p ) {
	var offset , attr ;

	p.context.sequence += p.context.term.optimized.moveTo( p.dstXmin , p.dstY ) ;
	p.context.moves ++ ;

	for ( offset = p.srcStart ; offset < p.srcEnd ; offset += this.ITEM_SIZE ) {
		attr = this.readAttr( p.context.srcBuffer , offset ) ;

		if ( ! p.context.lastAttr || ! attr.equals( p.context.lastAttr ) ) {
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
	if ( p.context.sequence.length > OUTPUT_THRESHOLD ) {
		p.context.nfterm( p.context.sequence ) ;
		p.context.sequence = '' ;
		p.context.writes ++ ;
	}
} ;



ScreenBufferHD.prototype.terminalBlitterCellIterator = function terminalBlitterCellIterator( p ) {
	//var attr = p.context.srcBuffer.readUInt32BE( p.srcStart ) ;
	var attr = this.readAttr( p.context.srcBuffer , p.srcStart ) ;

	// If last buffer's cell === current buffer's cell, no need to refresh... skip that now
	if ( p.context.srcLastBuffer ) {
		if (
			attr.equals( this.readAttr( p.context.srcLastBuffer , p.srcStart ) ) &&
			this.readChar( p.context.srcBuffer , p.srcStart ) === this.readChar( p.context.srcLastBuffer , p.srcStart ) ) {
			return ;
		}

		p.context.srcBuffer.copy( p.context.srcLastBuffer , p.srcStart , p.srcStart , p.srcEnd ) ;
	}

	p.context.cells ++ ;

	if ( p.dstX !== p.context.cx || p.dstY !== p.context.cy ) {
		p.context.sequence += p.context.term.optimized.moveTo( p.dstX , p.dstY ) ;
		p.context.moves ++ ;
	}

	if ( ! p.context.lastAttr || ! attr.equals( p.context.lastAttr ) ) {
		p.context.sequence += ! p.context.lastAttr || ! p.context.deltaEscapeSequence ?
			this.generateEscapeSequence( p.context.term , attr ) :
			this.generateDeltaEscapeSequence( p.context.term , attr , p.context.lastAttr ) ;
		p.context.lastAttr = attr ;
		p.context.attrs ++ ;
	}

	p.context.sequence += this.readChar( p.context.srcBuffer , p.srcStart ) ;

	// Output buffering saves a good amount of CPU usage both for the node's processus and the terminal processus
	if ( p.context.sequence.length > OUTPUT_THRESHOLD ) {
		p.context.nfterm( p.context.sequence ) ;
		p.context.sequence = '' ;
		p.context.writes ++ ;
	}

	// Next expected cursor position
	p.context.cx = p.dstX + 1 ;
	p.context.cy = p.dstY ;
} ;



ScreenBufferHD.loadSyncV2 = function loadSync( filepath ) {
	var i , content , header , screenBuffer ;

	// Let it crash if nothing found
	content = fs.readFileSync( filepath ) ;

	// See if we have got a 'SB' at the begining of the file
	if ( content.length < 3 || content.toString( 'ascii' , 0 , 3 ) !== 'SB\n' ) {
		throw new Error( 'Magic number mismatch: this is not a ScreenBufferHD file' ) ;
	}

	// search for the second \n
	for ( i = 3 ; i < content.length ; i ++ ) {
		if ( content[ i ] === 0x0a ) { break ; }
	}

	if ( i === content.length ) {
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
	if ( header.version === undefined || header.width === undefined || header.height === undefined ) {
		throw new Error( 'Missing mandatory header data, this is a corrupted or obsolete ScreenBufferHD file' ) ;
	}

	// Check bitsPerColor
	if ( header.bitsPerColor && header.bitsPerColor !== ScreenBufferHD.prototype.bitsPerColor ) {
		throw new Error( 'Bad Bits Per Color: ' + header.bitsPerColor + ' (should be ' + ScreenBufferHD.prototype.bitsPerColor + ')' ) ;
	}

	// Bad size?
	if ( content.length !== i + 1 + header.width * header.height * ScreenBufferHD.prototype.ITEM_SIZE ) {
		throw new Error( 'Bad file size: this is a corrupted ScreenBufferHD file' ) ;
	}

	// So the file exists, create a canvas based upon it
	screenBuffer = new ScreenBufferHD( {
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
ScreenBufferHD.prototype.saveSyncV2 = function saveSync( filepath ) {
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



ScreenBufferHD.fromNdarrayImage = function fromNdarrayImage( pixels /*, options */ ) {
	var x , xMax = pixels.shape[ 0 ] ,
		y , yMax = Math.ceil( pixels.shape[ 1 ] / 2 ) ,
		hasAlpha = pixels.shape[ 2 ] === 4 ;

	var image = new ScreenBufferHD( {
		width: xMax , height: yMax , blending: true , noFill: true
	} ) ;

	for ( x = 0 ; x < xMax ; x ++ ) {
		for ( y = 0 ; y < yMax ; y ++ ) {
			if ( y * 2 + 1 < pixels.shape[ 1 ] ) {
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
			else {
				image.put(
					{
						x: x ,
						y: y ,
						attr: {
							r: pixels.get( x , y * 2 , 0 ) ,
							g: pixels.get( x , y * 2 , 1 ) ,
							b: pixels.get( x , y * 2 , 2 ) ,
							a: hasAlpha ? pixels.get( x , y * 2 , 3 ) : 255 ,
							bgR: 0 ,
							bgG: 0 ,
							bgB: 0 ,
							bgA: 0
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



ScreenBufferHD.prototype.dump = function dump() {
	var y , x , offset , str = '' ;

	for ( y = 0 ; y < this.height ; y ++ ) {
		for ( x = 0 ; x < this.width ; x ++ ) {
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



ScreenBufferHD.prototype.readAttr = function readAttr( buffer , at ) {
	return buffer.slice( at , at + this.ATTR_SIZE ) ;
} ;



ScreenBufferHD.prototype.writeAttr = function writeAttr( buffer , attr , at ) {
	return attr.copy( buffer , at ) ;
} ;



ScreenBufferHD.prototype.readChar = function readChar( buffer , at ) {
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



ScreenBufferHD.prototype.writeChar = function writeChar( buffer , char , at ) {
	return buffer.write( char , at + this.ATTR_SIZE , this.CHAR_SIZE ) ;
} ;



ScreenBufferHD.prototype.generateEscapeSequence = function generateEscapeSequence( term , attr ) {
	var esc = term.optimized.styleReset +
		(
			attr[ BPOS_MISC ] & FG_DEFAULT_COLOR ?
				term.optimized.defaultColor :
				term.optimized.color24bits( attr[ BPOS_R ] , attr[ BPOS_G ] , attr[ BPOS_B ] )
		) +
		(
			attr[ BPOS_MISC ] & BG_DEFAULT_COLOR ?
				term.optimized.bgDefaultColor :
				term.optimized.bgColor24bits( attr[ BPOS_BG_R ] , attr[ BPOS_BG_G ] , attr[ BPOS_BG_B ] )
		) ;

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
ScreenBufferHD.prototype.generateDeltaEscapeSequence = function generateDeltaEscapeSequence( term , attr , lastAttr ) {
	//console.log( 'generateDeltaEscapeSequence' , attr , lastAttr ) ;

	var esc = '' ;

	// Color
	if ( attr[ BPOS_MISC ] & FG_DEFAULT_COLOR ) {
		if ( ! ( lastAttr[ BPOS_MISC ] & FG_DEFAULT_COLOR ) ) { esc += term.optimized.defaultColor ; }
	}
	if (
		attr[ BPOS_R ] !== lastAttr[ BPOS_R ] ||
		attr[ BPOS_G ] !== lastAttr[ BPOS_G ] ||
		attr[ BPOS_B ] !== lastAttr[ BPOS_B ] ||
		( lastAttr[ BPOS_MISC ] & FG_DEFAULT_COLOR )
	) {
		esc += term.optimized.color24bits( attr[ BPOS_R ] , attr[ BPOS_G ] , attr[ BPOS_B ] ) ;
	}

	// Bg color
	if ( attr[ BPOS_MISC ] & BG_DEFAULT_COLOR ) {
		if ( ! ( lastAttr[ BPOS_MISC ] & BG_DEFAULT_COLOR ) ) { esc += term.optimized.bgDefaultColor ; }
	}
	if (
		attr[ BPOS_BG_R ] !== lastAttr[ BPOS_BG_R ] ||
		attr[ BPOS_BG_G ] !== lastAttr[ BPOS_BG_G ] ||
		attr[ BPOS_BG_B ] !== lastAttr[ BPOS_BG_B ] ||
		( lastAttr[ BPOS_MISC ] & BG_DEFAULT_COLOR )
	) {
		esc += term.optimized.bgColor24bits( attr[ BPOS_BG_R ] , attr[ BPOS_BG_G ] , attr[ BPOS_BG_B ] ) ;
	}


	var style = attr[ BPOS_STYLE ] ;
	var lastStyle = lastAttr[ BPOS_STYLE ] ;

	if ( style !== lastStyle ) {
		// Bold and dim style are particular: all terminal has noBold = noDim

		if ( ( style & BOLD_DIM ) !== ( lastStyle & BOLD_DIM ) ) {
			if ( ( ( lastStyle & BOLD ) && ! ( style & BOLD ) ) ||
				( ( lastStyle & DIM ) && ! ( style & DIM ) ) ) {
				esc += term.optimized.noBold ;
				if ( style & BOLD ) { esc += term.optimized.bold ; }
				if ( style & DIM ) { esc += term.optimized.dim ; }
			}
			else {
				if ( ( style & BOLD ) && ! ( lastStyle & BOLD ) ) { esc += term.optimized.bold ; }
				if ( ( style & DIM ) && ! ( lastStyle & DIM ) ) { esc += term.optimized.dim ; }
			}
		}

		if ( ( style & ITALIC ) !== ( lastStyle & ITALIC ) ) {
			esc += style & ITALIC ? term.optimized.italic : term.optimized.noItalic ;
		}

		if ( ( style & UNDERLINE ) !== ( lastStyle & UNDERLINE ) ) {
			esc += style & UNDERLINE ? term.optimized.underline : term.optimized.noUnderline ;
		}

		if ( ( style & BLINK ) !== ( lastStyle & BLINK ) ) {
			esc += style & BLINK ? term.optimized.blink : term.optimized.noBlink ;
		}

		if ( ( style & INVERSE ) !== ( lastStyle & INVERSE ) ) {
			esc += style & INVERSE ? term.optimized.inverse : term.optimized.noInverse ;
		}

		if ( ( style & HIDDEN ) !== ( lastStyle & HIDDEN ) ) {
			esc += style & HIDDEN ? term.optimized.hidden : term.optimized.noHidden ;
		}

		if ( ( style & STRIKE ) !== ( lastStyle & STRIKE ) ) {
			esc += style & STRIKE ? term.optimized.strike : term.optimized.noStrike ;
		}
	}

	return esc ;
} ;





/*
	Methods that are both static and instance member.
	It must be possible to call them without any instance AND invoke instance specific method.
*/



ScreenBufferHD.attr2object = function attr2object( attr ) {
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

	// Misc part
	object.defaultColor = !! ( attr[ BPOS_MISC ] & FG_DEFAULT_COLOR ) ;
	object.bgDefaultColor = !! ( attr[ BPOS_MISC ] & BG_DEFAULT_COLOR ) ;
	object.styleTransparency = !! ( attr[ BPOS_MISC ] & STYLE_TRANSPARENCY ) ;
	object.charTransparency = !! ( attr[ BPOS_MISC ] & CHAR_TRANSPARENCY ) ;

	return object ;
} ;

ScreenBufferHD.prototype.attr2object = ScreenBufferHD.attr2object ;



ScreenBufferHD.object2attr = function object2attr( object ) {
	var attr = Buffer.allocUnsafe( ScreenBufferHD.prototype.ATTR_SIZE ) ;

	if ( ! object || typeof object !== 'object' ) { object = {} ; }

	// Misc and color part
	attr[ BPOS_MISC ] = 0 ;

	if ( object.defaultColor ) {
		attr[ BPOS_MISC ] |= FG_DEFAULT_COLOR ;
		attr[ BPOS_R ] = 0 ;
		attr[ BPOS_G ] = 0 ;
		attr[ BPOS_B ] = 0 ;
		attr[ BPOS_A ] = 255 ;
	}
	else {
		// Color part
		attr[ BPOS_R ] = + object.r || 0 ;
		attr[ BPOS_G ] = + object.g || 0 ;
		attr[ BPOS_B ] = + object.b || 0 ;
		attr[ BPOS_A ] = object.a !== undefined ? + object.a || 0 : 255 ;
	}

	if ( object.bgDefaultColor ) {
		attr[ BPOS_MISC ] |= BG_DEFAULT_COLOR ;
		attr[ BPOS_BG_R ] = 0 ;
		attr[ BPOS_BG_G ] = 0 ;
		attr[ BPOS_BG_B ] = 0 ;
		attr[ BPOS_BG_A ] = 255 ;
	}
	else {
		// Background color part
		attr[ BPOS_BG_R ] = + object.bgR || 0 ;
		attr[ BPOS_BG_G ] = + object.bgG || 0 ;
		attr[ BPOS_BG_B ] = + object.bgB || 0 ;
		attr[ BPOS_BG_A ] = object.bgA !== undefined ? + object.bgA || 0 : 255 ;
	}

	if ( object.styleTransparency ) { attr[ BPOS_MISC ] |= STYLE_TRANSPARENCY ; }
	if ( object.charTransparency ) { attr[ BPOS_MISC ] |= CHAR_TRANSPARENCY ; }

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

	return attr ;
} ;

ScreenBufferHD.prototype.object2attr = ScreenBufferHD.object2attr ;



ScreenBufferHD.attrAndObject = function attrAndObject( attr , object ) {
	if ( ! object || typeof object !== 'object' ) { return attr ; }

	// Misc and color part

	if (
		! object.defaultColor &&
		( object.r !== undefined || object.g !== undefined || object.b !== undefined || object.a !== undefined )
	) {
		if ( attr[ BPOS_MISC ] & FG_DEFAULT_COLOR ) { attr[ BPOS_MISC ] -= FG_DEFAULT_COLOR ; }

		if ( object.r !== undefined ) { attr[ BPOS_R ] = + object.r || 0 ; }
		if ( object.g !== undefined ) { attr[ BPOS_G ] = + object.g || 0 ; }
		if ( object.b !== undefined ) { attr[ BPOS_B ] = + object.b || 0 ; }
		if ( object.a !== undefined ) { attr[ BPOS_A ] = + object.a || 0 ; }
	}
	else {
		attr[ BPOS_MISC ] |= FG_DEFAULT_COLOR ;
		attr[ BPOS_R ] = 0 ;
		attr[ BPOS_G ] = 0 ;
		attr[ BPOS_B ] = 0 ;
		attr[ BPOS_A ] = 255 ;
	}

	if (
		! object.bgDefaultColor &&
		( object.bgR !== undefined || object.bgG !== undefined || object.bgB !== undefined || object.bgA !== undefined )
	) {
		if ( attr[ BPOS_MISC ] & BG_DEFAULT_COLOR ) { attr[ BPOS_MISC ] -= BG_DEFAULT_COLOR ; }

		if ( object.bgR !== undefined ) { attr[ BPOS_BG_R ] = + object.bgR || 0 ; }
		if ( object.bgG !== undefined ) { attr[ BPOS_BG_G ] = + object.bgG || 0 ; }
		if ( object.bgB !== undefined ) { attr[ BPOS_BG_B ] = + object.bgB || 0 ; }
		if ( object.bgA !== undefined ) { attr[ BPOS_BG_A ] = + object.bgA || 0 ; }
	}
	else {
		attr[ BPOS_MISC ] |= BG_DEFAULT_COLOR ;
		attr[ BPOS_BG_R ] = 0 ;
		attr[ BPOS_BG_G ] = 0 ;
		attr[ BPOS_BG_B ] = 0 ;
		attr[ BPOS_BG_A ] = 255 ;
	}

	if ( object.styleTransparency ) { attr[ BPOS_MISC ] |= STYLE_TRANSPARENCY ; }
	if ( object.charTransparency ) { attr[ BPOS_MISC ] |= CHAR_TRANSPARENCY ; }

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

	return attr ;
} ;

ScreenBufferHD.prototype.attrAndObject = ScreenBufferHD.attrAndObject ;



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

// Special color: default terminal color
const FG_DEFAULT_COLOR = 16 << 24 ;
const BG_DEFAULT_COLOR = 32 << 24 ;

// E.g.: if it needs redraw
// Was never implemented, could be replaced by a full-transparency check
//const VOID = 32 ;

const LEADING_FULLWIDTH = 64 ;
const TRAILING_FULLWIDTH = 128 ;

// Unused bits: 1 and 2



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

ScreenBufferHD.prototype.DEFAULT_ATTR = ScreenBufferHD.object2attr( { defaultColor: true , bgDefaultColor: true } ) ;

ScreenBufferHD.prototype.CLEAR_ATTR = ScreenBufferHD.object2attr( {
	defaultColor: true ,
	a: 0 ,
	bgA: 0 ,
	bgDefaultColor: true ,
	charTransparency: true ,
	styleTransparency: true
} ) ;

ScreenBufferHD.prototype.CLEAR_BUFFER = Buffer.allocUnsafe( ScreenBufferHD.prototype.ITEM_SIZE ) ;
ScreenBufferHD.prototype.CLEAR_ATTR.copy( ScreenBufferHD.prototype.CLEAR_BUFFER ) ;
ScreenBufferHD.prototype.CLEAR_BUFFER.write( ' \x00\x00\x00' , ScreenBufferHD.prototype.ATTR_SIZE ) ;	// space

