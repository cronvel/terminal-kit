/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

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



const misc = require( './misc.js' ) ;

const fs = require( 'fs' ) ;
const string = require( 'string-kit' ) ;
const NextGenEvents = require( 'nextgen-events' ) ;



/*
	options:
		* width: buffer width (default to dst.width)
		* height: buffer height (default to dst.height)
		* dst: writting destination
		* inline: for terminal dst only, draw inline instead of at some position (do not moveTo)
		* x: default position in the dst
		* y: default position in the dst
		* wrap: default wrapping behavior of .put()
		* noFill: do not call .fill() with default values at ScreenBuffer creation
		* blending: false/null or true or object (blending options): default blending params (can be overriden by .draw())
		* palette: Palette instance
*/
function ScreenBuffer( options = {} ) {
	this.dst = options.dst ;	// a terminal or another screenBuffer
	this.inline = !! options.inline ;	// it's a terminal and we want to draw inline to it (no moveTo)
	this.width = Math.floor( options.width ) || ( options.dst ? options.dst.width : 1 ) ;
	this.height = Math.floor( options.height ) || ( options.dst ? options.dst.height : 1 ) ;
	this.x = options.x !== undefined ? options.x : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 ) ;	// eslint-disable-line
	this.y = options.y !== undefined ? options.y : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 ) ;	// eslint-disable-line
	this.cx = 0 ;
	this.cy = 0 ;
	this.ch = false ;	// cursor hidden
	this.lastCh = null ;	// cursor hidden on last terminal draw, avoid unecessary escape sequence output
	this.lastBuffer = null ;
	this.lastBufferUpToDate = false ;
	this.blending = options.blending || false ;
	this.wrap = !! options.wrap ;
	this.buffer = Buffer.allocUnsafe( this.width * this.height * this.ITEM_SIZE ) ;

	this.palette = options.palette || ( this.dst && this.dst.palette ) ;

	if ( ! options.noFill ) { this.fill() ; }
}

module.exports = ScreenBuffer ;

ScreenBuffer.prototype = Object.create( NextGenEvents.prototype ) ;
ScreenBuffer.prototype.constructor = ScreenBuffer ;
ScreenBuffer.prototype.bitsPerColor = 8 ;

// Backward compatibility
ScreenBuffer.create = ( ... args ) => new ScreenBuffer( ... args ) ;



const termkit = require( './termkit.js' ) ;
const Rect = termkit.Rect ;



/*
	options:
		* attr: attributes passed to .put()
		* transparencyChar: a char that is transparent
		* transparencyType: bit flags for the transparency char
*/
ScreenBuffer.createFromString = function( options , data ) {
	var x , y , length , attr , attrTrans , width , height , lineWidth , screenBuffer ;

	// Manage options
	if ( ! options ) { options = {} ; }

	if ( typeof data !== 'string' ) {
		if ( ! data.toString ) { throw new Error( '[terminal] ScreenBuffer.createFromDataString(): argument #1 should be a string or provide a .toString() method.' ) ; }
		data = data.toString() ;
	}

	// Transform the data into an array of lines
	data = termkit.stripControlChars( data , true ).split( '\n' ) ;

	// Compute the buffer size
	width = 0 ;
	height = data.length ;

	attr = options.attr !== undefined ? options.attr : ScreenBuffer.prototype.DEFAULT_ATTR ;
	if ( attr && typeof attr === 'object' && ! attr.BYTES_PER_ELEMENT ) { attr = ScreenBuffer.object2attr( attr ) ; }

	attrTrans = attr ;

	if ( options.transparencyChar ) {
		if ( ! options.transparencyType ) { attrTrans |= TRANSPARENCY ; }
		else { attrTrans |= options.transparencyType & TRANSPARENCY ; }
	}

	// Compute the width of the screenBuffer
	for ( y = 0 ; y < data.length ; y ++ ) {
		lineWidth = string.unicode.width( data[ y ] ) ;
		if ( lineWidth > width ) { width = lineWidth ; }
	}

	// Create the buffer with the right width & height
	screenBuffer = new ScreenBuffer( { width: width , height: height } ) ;

	// Fill the buffer with data
	for ( y = 0 ; y < data.length ; y ++ ) {
		if ( ! options.transparencyChar ) {
			screenBuffer.put( { x: 0 , y: y , attr: attr } , data[ y ] ) ;
		}
		else {
			length = data[ y ].length ;

			for ( x = 0 ; x < length ; x ++ ) {
				if ( data[ y ][ x ] === options.transparencyChar ) {
					screenBuffer.put( { x: x , y: y , attr: attrTrans } , data[ y ][ x ] ) ;
				}
				else {
					screenBuffer.put( { x: x , y: y , attr: attr } , data[ y ][ x ] ) ;
				}
			}
		}
	}

	return screenBuffer ;
} ;



// Backward compatibility
ScreenBuffer.createFromChars = ScreenBuffer.createFromString ;



// Shared
ScreenBuffer.prototype.setClearAttr = function( attr ) {
	this.CLEAR_ATTR = this.object2attr( attr ) ;
	this.CLEAR_BUFFER = Buffer.allocUnsafe( this.ITEM_SIZE ) ;

	if ( Buffer.isBuffer( this.CLEAR_ATTR ) ) {
		// ScreenBufferHD
		this.CLEAR_ATTR.copy( this.CLEAR_BUFFER ) ;
	}
	else { // if ( this.ATTR_SIZE === 4 ) {
		this.CLEAR_BUFFER.writeInt32BE( this.CLEAR_ATTR , 0 ) ;
	}

	this.CLEAR_BUFFER.write( ' \x00\x00\x00' , this.ATTR_SIZE ) ;	// space
} ;



/*
	options:
		attr: optional, the attribute to fill (default to DEFAULT_ATTR)
		char: optional, the buffer will be filled with that char (default to space)
		region: optional, a Rect compliant object defining the region to fill, instead a filling the whole ScreenBuffer
		start: optional (internal), start offset
		end: optional (internal), end offset
		clearBuffer: optional (internal), a Buffer to use to clear (instead of char+attr)
		buffer: optional (internal), used when we want to clear a Buffer instance, not a ScreenBuffer instance
*/
// Shared
ScreenBuffer.prototype.fill = function( options ) {
	var i , attr , char , start , end , region ,
		srcRect , toRect ,
		clearBuffer = this.CLEAR_BUFFER ,
		buffer = this.buffer ;

	if ( options && typeof options === 'object' ) {
		if ( options.char || options.attr ) {
			clearBuffer = Buffer.allocUnsafe( this.ITEM_SIZE ) ;

			// Write the attributes
			attr = options.attr !== undefined ? options.attr : this.DEFAULT_ATTR ;
			if ( attr && typeof attr === 'object' && ! attr.BYTES_PER_ELEMENT ) { attr = this.object2attr( attr ) ; }

			this.writeAttr( clearBuffer , attr , 0 ) ;

			// Write the character
			char = options.char && typeof options.char === 'string' ? options.char : ' ' ;
			//char = punycode.ucs2.encode( [ punycode.ucs2.decode( termkit.stripControlChars( char ) )[ 0 ] ] ) ;
			char = string.unicode.firstChar( termkit.stripControlChars( char ) ) ;

			//clearBuffer.write( char , this.ATTR_SIZE , this.CHAR_SIZE ) ;
			this.writeChar( clearBuffer , char , 0 ) ;
		}
		else if ( options.clearBuffer ) {
			clearBuffer = options.clearBuffer ;
		}

		// This option is used when we want to clear a Buffer instance, not a ScreenBuffer instance
		if ( options.buffer ) { buffer = options.buffer ; }

		start = options.start ? Math.floor( options.start / this.ITEM_SIZE ) : 0 ;
		end = options.end ? Math.floor( options.end / this.ITEM_SIZE ) : buffer.length / this.ITEM_SIZE ;
		region = options.region ? options.region : null ;
	}
	else {
		start = 0 ;
		end = buffer.length / this.ITEM_SIZE ;
	}

	if ( region ) {
		srcRect = new Rect( 0 , 0 , 0 , 0 ) ;

		toRect = new Rect( region ) ;
		toRect.clip( new Rect( this ) ) ;
		if ( toRect.isNull ) { return ; }

		// We use the blitter to fill the region
		Rect.tileIterator( {
			type: 'line' ,
			context: { srcBuffer: clearBuffer , dstBuffer: this.buffer } ,
			srcRect: srcRect ,
			dstRect: new Rect( this ) ,
			dstClipRect: toRect ,
			multiply: this.ITEM_SIZE
		} , this.blitterLineIterator.bind( this ) ) ;
	}
	else {
		for ( i = start ; i < end ; i ++ ) {
			clearBuffer.copy( buffer , i * this.ITEM_SIZE ) ;
		}
	}
} ;



// Clear the buffer: fill it with blank
// Shared
ScreenBuffer.prototype.clear = ScreenBuffer.prototype.fill ;



ScreenBuffer.prototype.preserveMarkupFormat = misc.preserveMarkupFormat ;
ScreenBuffer.prototype.markupOptions = misc.markupOptions ;



/*
	put( options , str )
	put( options , format , [arg1] , [arg2] , ... )

	options:
		* x: bypass this.cx
		* y: bypass this.cy
		* markup: boolean or 'ansi', true if the text contains markup that should be interpreted, 'ansi' if it contains ansi code
		* attr: standard attributes
		* resumeAttr: attr to resume to
		* wrap: text wrapping, when the cursor move beyond the last column, it is moved to the begining of the next line
		* newLine: if true, then \r and \n produce new lines, false by default: .put() does not manage lines
		* direction: 'right' (default), 'left', 'up', 'down' or 'none'/null (do not move after puting a char)
		* dx: x increment after each character (default: 1)
		* dy: y increment after each character (default: 0)
*/
// Shared
ScreenBuffer.prototype.put = function( options , str , ... args ) {
	var parser , startX , startY , x , y , dx , dy , baseAttr , attr , attrObject , wrap ;

	// Manage options
	if ( ! options ) { options = {} ; }

	wrap = options.wrap !== undefined ? options.wrap : this.wrap ;

	startX = x = Math.floor( options.x !== undefined ? options.x : this.cx ) ;
	startY = y = Math.floor( options.y !== undefined ? options.y : this.cy ) ;


	// Process directions/increments
	dx = 1 ;
	dy = 0 ;

	switch ( options.direction ) {
		//case 'right' : // not needed, use the default dx & dy
		case 'left' :
			dx = -1 ;
			break ;
		case 'up' :
			dx = 0 ;
			dy = -1 ;
			break ;
		case 'down' :
			dx = 0 ;
			dy = 1 ;
			break ;
		case null :
		case 'none' :
			dx = 0 ;
			dy = 0 ;
			break ;
	}

	if ( typeof options.dx === 'number' ) { dx = options.dx ; }
	if ( typeof options.dy === 'number' ) { dy = options.dy ; }


	// Process attributes
	attr = options.attr !== undefined ? options.attr : this.DEFAULT_ATTR ;
	if ( attr && typeof attr === 'object' && ! attr.BYTES_PER_ELEMENT ) { attr = this.object2attr( attr ) ; }
	baseAttr = attr ;

	// It's already in the correct format
	if ( options.resumeAttr !== undefined ) { attr = options.resumeAttr ; }


	// Process the input string
	if ( typeof str !== 'string' ) {
		if ( str.toString ) { str = str.toString() ; }
		else { return ; }
	}

	if ( args.length ) {
		str = ! options.markup || options.markup === 'ansi' ? string.format( str , ... args ) :
			this.preserveMarkupFormat( str , ... args ) ;
	}

	parser = ! options.markup ? null :
		options.markup === 'ansi' ? termkit.parseAnsi :
		termkit.parseMarkup ;

	// The processing of raw chunk of text
	var processRaw = part => {
		//part = termkit.stripControlChars( part ) ;

		var isFullWidth ,
			offset , char , charCode ,
			characters = string.unicode.toArray( part ) ,
			i , iMax = characters.length ;

		for ( i = 0 ; i < iMax ; i ++ ) {
			offset = ( y * this.width + x ) * this.ITEM_SIZE ;
			char = characters[ i ] ;
			charCode = char.charCodeAt( 0 ) ;

			if ( charCode < 0x20 || charCode === 0x7f ) {
				if ( options.newLine && ( charCode === 0x0a || charCode === 0x0d ) ) {
					if ( dx ) {
						x = startX ;
						y ++ ;
					}
					else {
						y = startY ;
						x ++ ;
					}

					continue ;
				}
				else {
					char = ' ' ;	// Space
					charCode = 0x20 ;
				}
			}

			isFullWidth = string.unicode.isFullWidth( char ) ;

			if ( isFullWidth ) {
				if ( x + isFullWidth * dx >= 0 && x + isFullWidth * ( dx || 1 ) < this.width && y >= 0 && y < this.height ) {
					// This is a full-width char! Needs extra care!

					if ( dx < 0 ) { offset -= this.ITEM_SIZE ; }

					// Check if we are writing on a fullwidth char
					if ( this.hasTrailingFullWidth( this.buffer , offset ) && x ) { this.removeFullWidth( this.buffer , offset - this.ITEM_SIZE ) ; }

					// Write the attributes
					this.writeAttr( this.buffer , attr , offset , this.LEADING_FULLWIDTH ) ;

					// Write the character
					this.writeChar( this.buffer , char , offset ) ;

					offset += this.ITEM_SIZE ;

					// Check if we are writing on a fullwidth char
					if ( this.hasLeadingFullWidth( this.buffer , offset ) && x < this.width - 1 ) { this.removeFullWidth( this.buffer , offset + this.ITEM_SIZE ) ; }

					// Write the attributes
					this.writeAttr( this.buffer , attr , offset , this.TRAILING_FULLWIDTH ) ;

					// Write a blank character
					this.writeChar( this.buffer , ' ' , offset ) ;
				}
			}
			else if ( x >= 0 && x < this.width && y >= 0 && y < this.height ) {
				// Check if we are writing on a fullwidth char
				if ( this.hasLeadingFullWidth( this.buffer , offset ) && x < this.width - 1 ) { this.removeFullWidth( this.buffer , offset + this.ITEM_SIZE ) ; }
				else if ( this.hasTrailingFullWidth( this.buffer , offset ) && x ) { this.removeFullWidth( this.buffer , offset - this.ITEM_SIZE ) ; }

				// Write the attributes
				this.writeAttr( this.buffer , attr , offset ) ;

				// Write the character
				this.writeChar( this.buffer , char , offset ) ;
			}

			x += dx * ( 1 + isFullWidth ) ;
			y += dy ;

			if ( wrap ) {
				if ( x < 0 ) {
					x = this.width - 1 ;
					y -- ;
				}
				else if ( x >= this.width ) {
					x = 0 ;
					y ++ ;
				}
			}
		}
	} ;


	if ( ! options.markup ) {
		processRaw( str ) ;
	}
	else {
		attrObject = this.attr2object( attr ) ;
		parser( str , this.markupOptions ).forEach( part => {
			if ( typeof part === 'string' ) {
				processRaw( part ) ;
			}
			else {
				if ( part.markup.reset ) {
					attr = part.markup.special ? this.DEFAULT_ATTR : baseAttr ;
					attrObject = this.attr2object( attr ) ;
				}
				else {
					Object.assign( attrObject , part.markup ) ;

					// Remove incompatible flags
					if ( attrObject.defaultColor && attrObject.color ) { delete attrObject.defaultColor ; }
					if ( attrObject.bgDefaultColor && attrObject.bgColor ) { delete attrObject.bgDefaultColor ; }

					attr = this.object2attr( attrObject ) ;
				}

				if ( part.markup.raw ) {
					processRaw( part.markup.raw ) ;
				}
			}
		} ) ;
	}

	this.cx = x ;
	this.cy = y ;

	return attr ;
} ;



/*
	options:
		* x: bypass this.cx
		* y: bypass this.cy
*/
// Shared
ScreenBuffer.prototype.get = function( options ) {
	var x , y , offset ;

	// Manage options
	if ( ! options ) { options = {} ; }

	x = options.x !== undefined ? options.x : this.cx ;
	y = options.y !== undefined ? options.y : this.cy ;

	if ( typeof x !== 'number' || x < 0 || x >= this.width ) { return null ; }
	x = Math.floor( x ) ;

	if ( typeof y !== 'number' || y < 0 || y >= this.height ) { return null ; }
	y = Math.floor( y ) ;

	offset = ( y * this.width + x ) * this.ITEM_SIZE ;

	return {
		attr: this.attr2object( this.readAttr( this.buffer , offset ) ) ,
		char: this.readChar( this.buffer , offset )
	} ;
} ;



// Resize a screenBuffer, using a Rect
// Shared
ScreenBuffer.prototype.resize = function( fromRect ) {
	// Do not reference directly the userland variable, clone it
	fromRect = new Rect( fromRect ) ;

	var offsetX = -fromRect.xmin ,
		offsetY = -fromRect.ymin ;

	// Create the toRect region
	var toRect = new Rect( {
		xmin: 0 ,
		ymin: 0 ,
		xmax: fromRect.width - 1 ,
		ymax: fromRect.height - 1
	} ) ;

	fromRect.clip( new Rect( this ) ) ;

	if ( toRect.isNull ) { return false ; }

	// Generate a new buffer
	var resizedBuffer = Buffer.allocUnsafe( toRect.width * toRect.height * this.ITEM_SIZE ) ;
	this.fill( { buffer: resizedBuffer } ) ;

	// We use the blitter to reconstruct the buffer geometry
	Rect.regionIterator( {
		type: 'line' ,
		context: { srcBuffer: this.buffer , dstBuffer: resizedBuffer } ,
		dstRect: toRect ,
		dstClipRect: new Rect( toRect ) ,
		srcRect: new Rect( this ) ,
		srcClipRect: fromRect ,
		offsetX: offsetX ,
		offsetY: offsetY ,
		multiply: this.ITEM_SIZE
	} , this.blitterLineIterator.bind( this ) ) ;

	// Now, we have to replace the old buffer with the new, and set the width & height
	this.width = toRect.width ;
	this.height = toRect.height ;
	this.buffer = resizedBuffer ;

	// Disable the lastBuffer, so `draw( { delta: true } )` will not be bugged
	this.lastBuffer = null ;

	// This exists to improve compatibilities with the Terminal object
	this.emit( 'resize' , this.width , this.height ) ;

	return true ;
} ;



// Shared
ScreenBuffer.prototype.draw = function( options ) {
	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	// Transmitted options (do not edit the user provided options, clone them)
	var tr = {
		dst: options.dst || this.dst ,
		inline: options.inline !== undefined ? !! options.inline : this.inline ,
		offsetX: options.x !== undefined ? Math.floor( options.x ) : Math.floor( this.x ) ,
		offsetY: options.y !== undefined ? Math.floor( options.y ) : Math.floor( this.y ) ,
		dstClipRect: options.dstClipRect ? new Rect( options.dstClipRect ) : undefined ,
		srcClipRect: options.srcClipRect ? new Rect( options.srcClipRect ) : undefined ,
		delta: options.delta ,
		blending: options.blending !== undefined ? options.blending : this.blending ,
		wrap: options.wrap ,
		tile: options.tile
	} ;

	if ( tr.dst instanceof ScreenBuffer ) {
		return this.blitter( tr ) ;
	}
	else if ( tr.dst instanceof termkit.Terminal ) {
		return this.terminalBlitter( tr ) ;
	}
} ;



// Shared
ScreenBuffer.prototype.moveTo = function( x , y ) {
	this.cx = Math.max( 0 , Math.min( x , this.width - 1 ) ) ;
	this.cy = Math.max( 0 , Math.min( y , this.height - 1 ) ) ;
} ;



// Shared
ScreenBuffer.prototype.drawCursor = function( options ) {
	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	var dst = options.dst || this.dst ;

	if ( dst instanceof ScreenBuffer ) {
		if ( this.ch ) {
			dst.ch = true ;
		}
		else {
			dst.ch = false ;
			dst.moveTo( this.cx + this.x , this.cy + this.y ) ;
		}
	}
	else if ( dst instanceof termkit.Terminal ) {
		if ( this.ch ) {
			if ( this.ch !== this.lastCh ) { dst.hideCursor() ; }
		}
		else {
			if ( this.ch !== this.lastCh ) { dst.hideCursor( false ) ; }
			dst.moveTo(
				Math.max( 1 , Math.min( this.cx + this.x , dst.width ) ) ,
				Math.max( 1 , Math.min( this.cy + this.y , dst.height ) )
			) ;
		}

		this.lastCh = this.ch ;
	}
} ;



// Shared
ScreenBuffer.prototype.blitter = function( p ) {
	var tr , iterator , iteratorCallback ;

	// Default options & iterator
	tr = {
		type: 'line' ,
		context: { srcBuffer: this.buffer , dstBuffer: p.dst.buffer , blending: p.blending } ,
		dstRect: new Rect( p.dst ) ,
		srcRect: new Rect( this ) ,
		dstClipRect: p.dstClipRect || new Rect( p.dst ) ,
		srcClipRect: p.srcClipRect || new Rect( this ) ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY ,
		wrap: p.wrap ,
		tile: p.tile ,
		multiply: this.ITEM_SIZE
	} ;

	iterator = 'regionIterator' ;
	iteratorCallback = this.blitterLineIterator.bind( this ) ;


	// If blending is on, switch to the cell iterator
	if ( p.blending ) {
		tr.type = 'cell' ;
		iteratorCallback = this.blitterCellBlendingIterator.bind( this ) ;
	}

	if ( p.wrap ) { iterator = 'wrapIterator' ; }
	else if ( p.tile ) { iterator = 'tileIterator' ; }
	else { iterator = 'regionIterator' ; }

	Rect[ iterator ]( tr , iteratorCallback ) ;
} ;



// /!\ WARNING: We have to check full-width char in the previous dst x, and strip full-width at the end of the src
// Shared
ScreenBuffer.prototype.blitterLineIterator = function( p ) {
	if ( p.dstStart >= this.ITEM_SIZE ) {
		// Remove overlapping dst fullwidth at the begining
		this.removeLeadingFullWidth( p.context.dstBuffer , p.dstStart - this.ITEM_SIZE ) ;
	}

	p.context.srcBuffer.copy( p.context.dstBuffer , p.dstStart , p.srcStart , p.srcEnd ) ;
	this.removeLeadingFullWidth( p.context.dstBuffer , p.dstEnd - this.ITEM_SIZE ) ;

	if ( p.dstEnd < p.context.dstBuffer.length ) {
		// Remove overlapping dst fullwidth at the end
		this.removeTrailingFullWidth( p.context.dstBuffer , p.dstEnd ) ;
	}
} ;



ScreenBuffer.prototype.blitterCellBlendingIterator = function( p ) {
	var attr = this.readAttr( p.context.srcBuffer , p.srcStart ) ,
		blending = attr & TRANSPARENCY ;

	if ( blending === TRANSPARENCY ) {
		// Fully transparent, do nothing
		return ;
	}

	// First, manage fullwidth chars
	if ( p.startOfBlitLine && p.dstStart >= this.ITEM_SIZE ) {
		// Remove overlapping dst fullwidth at the begining
		this.removeLeadingFullWidth( p.context.dstBuffer , p.dstStart - this.ITEM_SIZE ) ;
	}

	if ( p.endOfBlitLine && p.dstEnd < p.context.dstBuffer.length ) {
		// Remove overlapping dst fullwidth at the end
		this.removeTrailingFullWidth( p.context.dstBuffer , p.dstEnd ) ;
	}

	if ( blending === NONE && ! ( p.endOfBlitLine || ! ( attr & LEADING_FULLWIDTH ) ) ) {
		// Fully opaque, copy it
		p.context.srcBuffer.copy( p.context.dstBuffer , p.dstStart , p.srcStart , p.srcEnd ) ;
		return ;
	}


	// Blending part...

	if ( ! ( blending & FG_TRANSPARENCY ) ) {
		// Copy source foreground color
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + 3 ,
			p.srcStart + 3 ,
			p.srcStart + 4
		) ;
	}

	if ( ! ( blending & BG_TRANSPARENCY ) ) {
		// Copy source background color
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + 2 ,
			p.srcStart + 2 ,
			p.srcStart + 3
		) ;
	}

	if ( ! ( blending & STYLE_TRANSPARENCY ) ) {
		// Copy source style
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + 1 ,
			p.srcStart + 1 ,
			p.srcStart + 2
		) ;
	}

	if ( ! ( blending & CHAR_TRANSPARENCY ) ) {
		if ( p.endOfBlitLine && ( attr & LEADING_FULLWIDTH ) ) {
			// Leading fullwidth at the end of the blit line, output a space instead
			this.writeChar( p.context.dstBuffer , ' ' , p.dstStart ) ;
		}
		else {
			// Copy source character
			p.context.srcBuffer.copy(
				p.context.dstBuffer ,
				p.dstStart + this.ATTR_SIZE ,
				p.srcStart + this.ATTR_SIZE ,
				p.srcEnd
			) ;
		}
	}
} ;



// Shared
ScreenBuffer.prototype.terminalBlitter = function( p ) {
	var tr , iterator , iteratorCallback , context ;

	context = {
		srcBuffer: this.buffer ,
		blending: p.blending ,
		term: p.dst ,
		inline: p.inline ,
		deltaEscapeSequence: p.dst.support.deltaEscapeSequence ,
		rawTerm: p.dst.raw ,
		lastAttr: null ,
		sequence: '' ,
		cells: 0 ,
		moves: 0 ,
		attrs: 0 ,
		writes: 0
	} ;

	// Default options & iterator
	tr = {
		type: 'line' ,
		context: context ,
		dstRect: new Rect( p.dst ) ,
		srcRect: new Rect( this ) ,
		dstClipRect: p.dstClipRect ,
		srcClipRect: p.srcClipRect ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY ,
		multiply: this.ITEM_SIZE
	} ;

	// If in inline mode, the height is virtually infinity
	if ( p.inline ) { tr.dstRect.setSize( { height: Infinity } ) ; }

	if ( p.delta && ! p.inline ) {
		if ( ! this.lastBuffer || this.lastBuffer.length !== this.buffer.length ) {
			this.lastBuffer = Buffer.from( this.buffer ) ;
			iteratorCallback = this.terminalBlitterLineIterator.bind( this ) ;
		}
		else if ( this.lastBufferUpToDate ) {
			context.srcLastBuffer = this.lastBuffer ;

			iteratorCallback = this.terminalBlitterCellIterator.bind( this ) ;
			tr.type = 'cell' ;
		}
		else {
			this.buffer.copy( this.lastBuffer ) ;
			iteratorCallback = this.terminalBlitterLineIterator.bind( this ) ;
		}

		this.lastBufferUpToDate = true ;
	}
	else {
		this.lastBufferUpToDate = false ;
		iteratorCallback = this.terminalBlitterLineIterator.bind( this ) ;
	}


	if ( p.wrap ) { iterator = 'wrapIterator' ; }
	else if ( p.tile ) { iterator = 'tileIterator' ; }
	else { iterator = 'regionIterator' ; }

	Rect[ iterator ]( tr , iteratorCallback ) ;

	// Write remaining sequence
	if ( context.sequence.length ) { context.rawTerm( context.sequence ) ; context.writes ++ ; }

	// Copy buffer to lastBuffer
	// Already done by terminalBlitterCellIterator()
	// if ( p.delta ) { this.buffer.copy( this.lastBuffer ) ; }

	// Return some stats back to the caller
	return {
		cells: context.cells ,
		moves: context.moves ,
		attrs: context.attrs ,
		writes: context.writes
	} ;
} ;



ScreenBuffer.prototype.terminalBlitterLineIterator = function( p ) {
	var offset , attr ;

	if ( ! p.context.inline ) {
		p.context.sequence += p.context.term.optimized.moveTo( p.dstXmin , p.dstY ) ;
		p.context.moves ++ ;
	}

	for ( offset = p.srcStart ; offset < p.srcEnd ; offset += this.ITEM_SIZE ) {
		attr = this.readAttr( p.context.srcBuffer , offset ) ;

		if ( ( attr & TRANSPARENCY ) === TRANSPARENCY ) {
			// Fully transparent, do nothing except moving one char right
			p.context.sequence += p.context.term.optimized.right ;
			continue ;
		}
		else if ( attr & TRAILING_FULLWIDTH ) {
			// Trailing fullwidth cell, the previous char already shifted the cursor to the right
			continue ;
		}

		if ( ( attr & ATTR_MASK ) !== ( p.context.lastAttr & ATTR_MASK ) ) {
			p.context.sequence += p.context.lastAttr === null || ! p.context.deltaEscapeSequence ?
				this.generateEscapeSequence( p.context.term , attr ) :
				this.generateDeltaEscapeSequence( p.context.term , attr , p.context.lastAttr ) ;
			p.context.lastAttr = attr ;
		}

		p.context.sequence += this.readChar( p.context.srcBuffer , offset ) ;
		p.context.cells ++ ;
	}

	if ( p.context.inline ) { //&& ! p.lastLine ) {
		// When we are at the bottom of the screen, the terminal may create a new line
		// using the current attr for background color, just like .eraseLineAfter() would do...
		// So we have to reset *BEFORE* the new line.
		p.context.sequence += p.context.term.optimized.styleReset + '\n' ;
		p.context.attrs ++ ;
		p.context.lastAttr = null ;
	}

	// Output buffering saves a good amount of CPU usage both for the node's processus and the terminal processus
	if ( p.context.sequence.length > OUTPUT_THRESHOLD ) {
		p.context.rawTerm( p.context.sequence ) ;
		p.context.sequence = '' ;
		p.context.writes ++ ;
	}
} ;



ScreenBuffer.prototype.terminalBlitterCellIterator = function( p ) {
	var attr = this.readAttr( p.context.srcBuffer , p.srcStart ) ;

	// If last buffer's cell === current buffer's cell, no need to refresh... skip that now
	if ( p.context.srcLastBuffer ) {
		if (
			attr === this.readAttr( p.context.srcLastBuffer , p.srcStart ) &&
			this.readChar( p.context.srcBuffer , p.srcStart ) === this.readChar( p.context.srcLastBuffer , p.srcStart ) ) {
			return ;
		}

		p.context.srcBuffer.copy( p.context.srcLastBuffer , p.srcStart , p.srcStart , p.srcEnd ) ;
	}

	if ( ( attr & TRANSPARENCY ) === TRANSPARENCY || ( attr & TRAILING_FULLWIDTH ) ) {
		// Fully transparent or trailing fullwidth, do nothing
		// Check that after eventually updating lastBuffer
		return ;
	}

	p.context.cells ++ ;

	if ( p.dstX !== p.context.cx || p.dstY !== p.context.cy ) {
		p.context.sequence += p.context.term.optimized.moveTo( p.dstX , p.dstY ) ;
		p.context.moves ++ ;
	}

	if ( ( attr & ATTR_MASK ) !== ( p.context.lastAttr & ATTR_MASK ) ) {
		p.context.sequence += p.context.lastAttr === null || ! p.context.deltaEscapeSequence ?
			this.generateEscapeSequence( p.context.term , attr ) :
			this.generateDeltaEscapeSequence( p.context.term , attr , p.context.lastAttr ) ;
		p.context.lastAttr = attr ;
		p.context.attrs ++ ;
	}

	p.context.sequence += this.readChar( p.context.srcBuffer , p.srcStart ) ;

	// Output buffering saves a good amount of CPU usage both for the node's processus and the terminal processus
	if ( p.context.sequence.length > OUTPUT_THRESHOLD ) {
		p.context.rawTerm( p.context.sequence ) ;
		p.context.sequence = '' ;
		p.context.writes ++ ;
	}

	// Next expected cursor position
	p.context.cy = p.dstY ;

	if ( attr & LEADING_FULLWIDTH ) {
		p.context.cx = p.dstX + 2 ;
		return true ;	// i.e.: tell the master iterator that this is a full-width char
	}

	p.context.cx = p.dstX + 1 ;
} ;



ScreenBuffer.fromNdarrayImage = function( pixels , options ) {
	var term = options.terminal || termkit.terminal ;

	var x , xMax = pixels.shape[ 0 ] ,
		y , yMax = Math.ceil( pixels.shape[ 1 ] / 2 ) ,
		hasAlpha = pixels.shape[ 2 ] === 4 ,
		maxRegister = term.support['256colors'] ? 255 : 15 ,
		fgColor , bgColor , cache = {} ;

	var image = new ScreenBuffer( {
		width: xMax , height: yMax , blending: true , noFill: true
	} ) ;

	for ( x = 0 ; x < xMax ; x ++ ) {
		for ( y = 0 ; y < yMax ; y ++ ) {
			fgColor = term.registerForRgbCache(
				cache ,
				pixels.get( x , y * 2 , 0 ) ,
				pixels.get( x , y * 2 , 1 ) ,
				pixels.get( x , y * 2 , 2 ) ,
				0 , maxRegister , 1
			) ;

			if ( y * 2 + 1 < pixels.shape[ 1 ] ) {
				bgColor = term.registerForRgbCache(
					cache ,
					pixels.get( x , y * 2 + 1 , 0 ) ,
					pixels.get( x , y * 2 + 1 , 1 ) ,
					pixels.get( x , y * 2 + 1 , 2 ) ,
					0 , maxRegister , 1
				) ;

				image.put(
					{
						x: x ,
						y: y ,
						attr: {
							color: fgColor ,
							fgTransparency: hasAlpha && pixels.get( x , y * 2 , 3 ) < 127 ,
							bgColor: bgColor ,
							bgTransparency: hasAlpha && pixels.get( x , y * 2 + 1 , 3 ) < 127
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
							color: fgColor ,
							fgTransparency: hasAlpha && pixels.get( x , y * 2 , 3 ) < 127 ,
							bgTransparency: true
						}
					} ,
					'▀'
				) ;
			}
		}
	}

	return image ;
} ;



ScreenBuffer.loadImage = termkit.image.load.bind( ScreenBuffer , ScreenBuffer.fromNdarrayImage ) ;



// Shared
ScreenBuffer.prototype.dumpChars = function() {
	var y , x , offset , str = '' ;

	for ( y = 0 ; y < this.height ; y ++ ) {
		for ( x = 0 ; x < this.width ; x ++ ) {
			offset = ( y * this.width + x ) * this.ITEM_SIZE ;
			str += this.readChar( this.buffer , offset ) ;
		}

		str += '\n' ;
	}

	return str ;
} ;



ScreenBuffer.prototype.dump = function() {
	var y , x , offset , str = '' , char ;

	for ( y = 0 ; y < this.height ; y ++ ) {
		for ( x = 0 ; x < this.width ; x ++ ) {
			offset = ( y * this.width + x ) * this.ITEM_SIZE ;

			char = this.readChar( this.buffer , offset ) ;
			str += char + ( string.unicode.isFullWidth( char ) ? ' ' : '  ' ) ;

			str += string.format( '%x%x%x%x ' ,
				this.buffer.readUInt8( offset ) ,
				this.buffer.readUInt8( offset + 1 ) ,
				this.buffer.readUInt8( offset + 2 ) ,
				this.buffer.readUInt8( offset + 3 )
			) ;
		}

		str += '\n' ;
	}

	return str ;
} ;



ScreenBuffer.prototype.readAttr = function( buffer , at ) {
	return buffer.readInt32BE( at ) ;
} ;



ScreenBuffer.prototype.writeAttr = function( buffer , attr , at , fullWidth = 0 ) {
	return buffer.writeInt32BE( attr | fullWidth , at ) ;
} ;



ScreenBuffer.prototype.hasLeadingFullWidth = function( buffer , at ) {
	return !! ( buffer.readInt32BE( at ) & LEADING_FULLWIDTH ) ;
} ;



ScreenBuffer.prototype.hasTrailingFullWidth = function( buffer , at ) {
	return !! ( buffer.readInt32BE( at ) & TRAILING_FULLWIDTH ) ;
} ;



ScreenBuffer.prototype.removeLeadingFullWidth = function( buffer , at ) {
	var attr = buffer.readInt32BE( at ) ;
	if ( ! ( attr & LEADING_FULLWIDTH ) ) { return ; }
	attr ^= LEADING_FULLWIDTH ;
	buffer.writeInt32BE( attr , at ) ;
	buffer.write( ' ' , at + this.ATTR_SIZE , this.CHAR_SIZE ) ;
} ;



ScreenBuffer.prototype.removeTrailingFullWidth = function( buffer , at ) {
	var attr = buffer.readInt32BE( at ) ;
	if ( ! ( attr & TRAILING_FULLWIDTH ) ) { return ; }
	attr ^= TRAILING_FULLWIDTH ;
	buffer.writeInt32BE( attr , at ) ;
	buffer.write( ' ' , at + this.ATTR_SIZE , this.CHAR_SIZE ) ;
} ;



ScreenBuffer.prototype.removeFullWidth = function( buffer , at ) {
	var attr = buffer.readInt32BE( at ) ;
	if ( ! ( attr & FULLWIDTH ) ) { return ; }
	attr = attr & REMOVE_FULLWIDTH_FLAG ;
	buffer.writeInt32BE( attr , at ) ;
	buffer.write( ' ' , at + this.ATTR_SIZE , this.CHAR_SIZE ) ;
} ;



ScreenBuffer.prototype.readChar = function( buffer , at ) {
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



ScreenBuffer.prototype.writeChar = function( buffer , char , at ) {
	return buffer.write( char , at + this.ATTR_SIZE , this.CHAR_SIZE ) ;
} ;



ScreenBuffer.prototype.generateEscapeSequence = function( term , attr ) {
	var palette = this.palette || term.palette ;

	var esc = term.optimized.styleReset +
		( attr & FG_DEFAULT_COLOR ? term.optimized.defaultColor : palette.escape[ attr & 255 ] ) +
		( attr & BG_DEFAULT_COLOR ? term.optimized.bgDefaultColor : palette.bgEscape[ ( attr >>> 8 ) & 255 ] ) ;

	// Style part
	if ( attr & BOLD ) { esc += term.optimized.bold ; }
	if ( attr & DIM ) { esc += term.optimized.dim ; }
	if ( attr & ITALIC ) { esc += term.optimized.italic ; }
	if ( attr & UNDERLINE ) { esc += term.optimized.underline ; }
	if ( attr & BLINK ) { esc += term.optimized.blink ; }
	if ( attr & INVERSE ) { esc += term.optimized.inverse ; }
	if ( attr & HIDDEN ) { esc += term.optimized.hidden ; }
	if ( attr & STRIKE ) { esc += term.optimized.strike ; }

	return esc ;
} ;



// Generate only the delta between the last and new attributes, may speed up things for the terminal process
// as well as consume less bandwidth, at the cost of small CPU increase in the application process
ScreenBuffer.prototype.generateDeltaEscapeSequence = function( term , attr , lastAttr ) {
	var palette = this.palette || term.palette ;

	var esc = '' ,
		color = attr & 255 ,
		lastColor = lastAttr & 255 ,
		bgColor = ( attr >>> 8 ) & 255 ,
		lastBgColor = ( lastAttr >>> 8 ) & 255 ;

	if ( attr & FG_DEFAULT_COLOR ) {
		if ( ! ( lastAttr & FG_DEFAULT_COLOR ) ) { esc += term.optimized.defaultColor ; }
	}
	else if ( color !== lastColor || ( lastAttr & FG_DEFAULT_COLOR ) ) {
		esc += palette.escape[ color ] ;
	}

	if ( attr & BG_DEFAULT_COLOR ) {
		if ( ! ( lastAttr & BG_DEFAULT_COLOR ) ) { esc += term.optimized.bgDefaultColor ; }
	}
	else if ( bgColor !== lastBgColor || ( lastAttr & BG_DEFAULT_COLOR ) ) {
		esc += palette.bgEscape[ bgColor ] ;
	}

	if ( ( attr & STYLE_MASK ) !== ( lastAttr & STYLE_MASK ) ) {
		// Bold and dim style are particular: all terminal has noBold = noDim

		if ( ( attr & BOLD_DIM ) !== ( lastAttr & BOLD_DIM ) ) {
			if ( ( ( lastAttr & BOLD ) && ! ( attr & BOLD ) ) ||
				( ( lastAttr & DIM ) && ! ( attr & DIM ) ) ) {
				esc += term.optimized.noBold ;
				if ( attr & BOLD ) { esc += term.optimized.bold ; }
				if ( attr & DIM ) { esc += term.optimized.dim ; }
			}
			else {
				if ( ( attr & BOLD ) && ! ( lastAttr & BOLD ) ) { esc += term.optimized.bold ; }
				if ( ( attr & DIM ) && ! ( lastAttr & DIM ) ) { esc += term.optimized.dim ; }
			}
		}

		if ( ( attr & ITALIC ) !== ( lastAttr & ITALIC ) ) {
			esc += attr & ITALIC ? term.optimized.italic : term.optimized.noItalic ;
		}

		if ( ( attr & UNDERLINE ) !== ( lastAttr & UNDERLINE ) ) {
			esc += attr & UNDERLINE ? term.optimized.underline : term.optimized.noUnderline ;
		}

		if ( ( attr & BLINK ) !== ( lastAttr & BLINK ) ) {
			esc += attr & BLINK ? term.optimized.blink : term.optimized.noBlink ;
		}

		if ( ( attr & INVERSE ) !== ( lastAttr & INVERSE ) ) {
			esc += attr & INVERSE ? term.optimized.inverse : term.optimized.noInverse ;
		}

		if ( ( attr & HIDDEN ) !== ( lastAttr & HIDDEN ) ) {
			esc += attr & HIDDEN ? term.optimized.hidden : term.optimized.noHidden ;
		}

		if ( ( attr & STRIKE ) !== ( lastAttr & STRIKE ) ) {
			esc += attr & STRIKE ? term.optimized.strike : term.optimized.noStrike ;
		}
	}

	return esc ;
} ;



/*
	* lineOffset: how many lines should we scroll:
		>0: scroll down
		<0: scroll up
	* terminalScrolling: if true, the underlying terminal is scrolled, the lastBuffer is scrolled too,
		but the screenbuffer is not drawn
*/
// Shared
ScreenBuffer.prototype.vScroll = function( lineOffset , attr , ymin , ymax , terminalScrolling ) {
	if ( ! lineOffset ) { return ; }

	// Arguments management
	// Backward compatibility, when terminalScrolling was the 2nd argument
	if ( typeof attr === 'boolean' ) {
		terminalScrolling = attr ;
		attr = ymin = ymax = undefined ;
	}

	if ( attr === undefined || attr === null ) {
		attr = this.DEFAULT_ATTR ;
	}
	else if ( attr && typeof attr === 'object' && ! attr.BYTES_PER_ELEMENT ) {
		attr = this.object2attr( attr ) ;
	}

	if ( ymin === undefined || ymin === null ) {
		ymin = 0 ;
		ymax = this.height - 1 ;
	}
	else {
		if ( ymin < 0 ) { ymin = 0 ; }
		if ( ymax > this.height - 1 ) { ymax = this.height - 1 ; }
	}

	var scrollOffset = lineOffset * this.width * this.ITEM_SIZE ,
		startOffset = ymin * this.width * this.ITEM_SIZE ,
		endOffset = ( ymax + 1 ) * this.width * this.ITEM_SIZE ;

	if ( scrollOffset > 0 ) {
		//this.buffer.copy( this.buffer , scrollOffset , 0 , this.buffer.length - scrollOffset ) ;
		//this.fill( { end: scrollOffset } ) ;
		this.buffer.copy( this.buffer , startOffset + scrollOffset , startOffset , endOffset - scrollOffset ) ;
		this.fill( { start: startOffset , end: startOffset + scrollOffset } ) ;
	}
	else {
		//this.buffer.copy( this.buffer , 0 , -scrollOffset , this.buffer.length ) ;
		//this.fill( { start: this.buffer.length + scrollOffset } ) ;
		this.buffer.copy( this.buffer , startOffset , startOffset - scrollOffset , endOffset ) ;
		this.fill( { start: endOffset + scrollOffset , end: endOffset } ) ;
	}

	if ( terminalScrolling && this.dst instanceof termkit.Terminal ) {
		// Scroll lastBuffer accordingly
		if ( this.lastBufferUpToDate && this.lastBuffer ) {
			if ( scrollOffset > 0 ) {
				//this.lastBuffer.copy( this.lastBuffer , scrollOffset , 0 , this.lastBuffer.length - scrollOffset ) ;
				//this.fill( { end: scrollOffset , buffer: this.lastBuffer } ) ;
				this.lastBuffer.copy( this.lastBuffer , startOffset + scrollOffset , startOffset , endOffset - scrollOffset ) ;
				this.fill( { buffer: this.lastBuffer , start: startOffset , end: startOffset + scrollOffset } ) ;
			}
			else {
				//this.lastBuffer.copy( this.lastBuffer , 0 , -scrollOffset , this.lastBuffer.length ) ;
				//this.fill( { start: this.buffer.length + scrollOffset , buffer: this.lastBuffer } ) ;
				this.lastBuffer.copy( this.lastBuffer , startOffset , startOffset - scrollOffset , endOffset ) ;
				this.fill( { buffer: this.lastBuffer , start: endOffset + scrollOffset , end: endOffset } ) ;
			}
		}

		//this.dst.scrollingRegion( this.y , this.y + this.height - 1 ) ;
		this.dst.scrollingRegion( this.y + ymin , this.y + ymax ) ;

		if ( lineOffset > 0 ) { this.dst.scrollDown( lineOffset ) ; }
		else { this.dst.scrollUp( -lineOffset ) ; }

		this.dst.resetScrollingRegion() ;
	}
} ;



ScreenBuffer.prototype.copyRegion = function( from , to , isMove , attr ) {
	var bufferRect = new Rect( this ) ,
		fromRect = new Rect( from ) ,
		toRect = new Rect( to ) ;

	toRect.setSize( fromRect ) ;	// Ensure toRect has the size of fromRect
	fromRect.clip( bufferRect ) ;
	toRect.clip( bufferRect ) ;

	if ( fromRect.isNull ) { return ; }

	if ( ! toRect.isNull ) {
		// We use the blitter to copy the region
		Rect.regionIterator( {
			type: toRect.ymin - fromRect.ymin > 0 ? 'reversedLine' : 'line' ,
			context: { srcBuffer: this.buffer , dstBuffer: this.buffer } ,
			srcRect: new Rect( this ) ,
			srcClipRect: fromRect ,
			dstRect: new Rect( this ) ,
			dstClipRect: toRect ,
			offsetX: toRect.xmin - fromRect.xmin ,
			offsetY: toRect.ymin - fromRect.ymin ,
			multiply: this.ITEM_SIZE
		} , this.blitterLineIterator.bind( this ) ) ;
	}

	if ( isMove ) {
		throw new Error( "Move is not coded ATM" ) ;
	}
} ;





/*
	Methods that are both static and instance member.
	It must be possible to call them without any instance AND invoke instance specific method.
*/



ScreenBuffer.attr2object = function( attr ) {
	var object = {} ;

	// Default color
	if ( attr & FG_DEFAULT_COLOR ) { object.color = 0 ; object.defaultColor = true ; }
	else { object.color = attr & 255 ; }

	if ( attr & BG_DEFAULT_COLOR ) { object.bgColor = 0 ; object.bgDefaultColor = true ; }
	else { object.bgColor = ( attr >>> 8 ) & 255 ; }

	// Style part
	if ( attr & BOLD ) { object.bold = true ; }
	if ( attr & DIM ) { object.dim = true ; }
	if ( attr & ITALIC ) { object.italic = true ; }
	if ( attr & UNDERLINE ) { object.underline = true ; }
	if ( attr & BLINK ) { object.blink = true ; }
	if ( attr & INVERSE ) { object.inverse = true ; }
	if ( attr & HIDDEN ) { object.hidden = true ; }
	if ( attr & STRIKE ) { object.strike = true ; }

	// Blending part
	if ( attr & FG_TRANSPARENCY ) { object.fgTransparency = true ; }
	if ( attr & BG_TRANSPARENCY ) { object.bgTransparency = true ; }
	if ( attr & STYLE_TRANSPARENCY ) { object.styleTransparency = true ; }
	if ( attr & CHAR_TRANSPARENCY ) { object.charTransparency = true ; }
	if ( ( attr & TRANSPARENCY ) === TRANSPARENCY ) { object.transparency = true ; }

	return object ;
} ;

ScreenBuffer.prototype.attr2object = ScreenBuffer.attr2object ;



ScreenBuffer.object2attr = function( object , colorNameToIndex ) {
	var attr = 0 ;

	if ( ! object || typeof object !== 'object' ) { object = {} ; }
	colorNameToIndex = colorNameToIndex || termkit.colorNameToIndex ;

	// Color part
	if ( typeof object.color === 'string' ) {
		if ( object.color === 'default' ) { object.color = 0 ; object.defaultColor = true ; }
		else { object.color = colorNameToIndex( object.color ) ; }
	}

	if ( typeof object.color !== 'number' || object.color < 0 || object.color > 255 ) {
		object.color = 0 ;
		object.defaultColor = true ;
	}
	else {
		object.color = Math.floor( object.color ) ;
	}

	attr += object.color ;

	// Background color part
	if ( typeof object.bgColor === 'string' ) {
		if ( object.bgColor === 'default' ) { object.bgColor = 0 ; object.bgDefaultColor = true ; }
		else { object.bgColor = colorNameToIndex( object.bgColor ) ; }
	}

	if ( typeof object.bgColor !== 'number' || object.bgColor < 0 || object.bgColor > 255 ) {
		object.bgColor = 0 ;
		object.bgDefaultColor = true ;
	}
	else {
		object.bgColor = Math.floor( object.bgColor ) ;
	}

	attr += object.bgColor << 8 ;

	// Default color
	if ( object.defaultColor ) { attr |= FG_DEFAULT_COLOR ; }
	if ( object.bgDefaultColor ) { attr |= BG_DEFAULT_COLOR ; }

	// Style part
	if ( object.bold ) { attr |= BOLD ; }
	if ( object.dim ) { attr |= DIM ; }
	if ( object.italic ) { attr |= ITALIC ; }
	if ( object.underline ) { attr |= UNDERLINE ; }
	if ( object.blink ) { attr |= BLINK ; }
	if ( object.inverse ) { attr |= INVERSE ; }
	if ( object.hidden ) { attr |= HIDDEN ; }
	if ( object.strike ) { attr |= STRIKE ; }

	// Blending part
	if ( object.transparency ) { attr |= TRANSPARENCY ; }
	if ( object.fgTransparency ) { attr |= FG_TRANSPARENCY ; }
	if ( object.bgTransparency ) { attr |= BG_TRANSPARENCY ; }
	if ( object.styleTransparency ) { attr |= STYLE_TRANSPARENCY ; }
	if ( object.charTransparency ) { attr |= CHAR_TRANSPARENCY ; }

	return attr ;
} ;

ScreenBuffer.prototype.object2attr = function( object ) {
	return ScreenBuffer.object2attr( object , this.palette && this.palette.colorNameToIndex ) ;
} ;



// Add some attributes from an object to an existing attr integer
ScreenBuffer.attrAndObject = function( attr , object , colorNameToIndex ) {
	if ( ! object || typeof object !== 'object' ) { return attr ; }
	colorNameToIndex = colorNameToIndex || termkit.colorNameToIndex ;

	// Color part
	if ( object.defaultColor || object.color === 'default' ) {
		attr -= attr & 255 ;
		attr |= FG_DEFAULT_COLOR ;
	}
	else if ( typeof object.color === 'string' ) {
		attr = attr - ( attr & 255 ) + colorNameToIndex( object.color ) ;
		if ( attr & FG_DEFAULT_COLOR ) { attr ^= FG_DEFAULT_COLOR ; }
	}
	else if ( typeof object.color === 'number' && object.color >= 0 && object.color <= 255 ) {
		attr = attr - ( attr & 255 ) + object.color ;
		if ( attr & FG_DEFAULT_COLOR ) { attr ^= FG_DEFAULT_COLOR ; }
	}

	// Background color part
	if ( object.bgDefaultColor || object.bgColor === 'default' ) {
		attr -= ( ( ( attr >>> 8 ) & 255 ) << 8 ) ;
		attr |= BG_DEFAULT_COLOR ;
	}
	else if ( typeof object.bgColor === 'string' ) {
		attr = attr - ( ( ( attr >>> 8 ) & 255 ) << 8 ) + ( colorNameToIndex( object.bgColor ) << 8 ) ;
		if ( attr & BG_DEFAULT_COLOR ) { attr ^= BG_DEFAULT_COLOR ; }
	}
	else if ( typeof object.bgColor === 'number' && object.bgColor >= 0 && object.bgColor <= 255 ) {
		attr = attr - ( ( ( attr >>> 8 ) & 255 ) << 8 ) + ( object.bgColor << 8 ) ;
		if ( attr & BG_DEFAULT_COLOR ) { attr ^= BG_DEFAULT_COLOR ; }
	}

	// Style part
	if ( object.bold === true ) { attr |= BOLD ; }
	else if ( object.bold === false ) { attr &= ~ BOLD ; }

	if ( object.dim === true ) { attr |= DIM ; }
	else if ( object.dim === false ) { attr &= ~ DIM ; }

	if ( object.italic === true ) { attr |= ITALIC ; }
	else if ( object.italic === false ) { attr &= ~ ITALIC ; }

	if ( object.underline === true ) { attr |= UNDERLINE ; }
	else if ( object.underline === false ) { attr &= ~ UNDERLINE ; }

	if ( object.blink === true ) { attr |= BLINK ; }
	else if ( object.blink === false ) { attr &= ~ BLINK ; }

	if ( object.inverse === true ) { attr |= INVERSE ; }
	else if ( object.inverse === false ) { attr &= ~ INVERSE ; }

	if ( object.hidden === true ) { attr |= HIDDEN ; }
	else if ( object.hidden === false ) { attr &= ~ HIDDEN ; }

	if ( object.strike === true ) { attr |= STRIKE ; }
	else if ( object.strike === false ) { attr &= ~ STRIKE ; }

	// Blending part
	if ( object.transparency === true ) { attr |= TRANSPARENCY ; }
	else if ( object.transparency === false ) { attr &= ~ TRANSPARENCY ; }

	if ( object.fgTransparency === true ) { attr |= FG_TRANSPARENCY ; }
	else if ( object.fgTransparency === false ) { attr &= ~ FG_TRANSPARENCY ; }

	if ( object.bgTransparency === true ) { attr |= BG_TRANSPARENCY ; }
	else if ( object.bgTransparency === false ) { attr &= ~ BG_TRANSPARENCY ; }

	if ( object.styleTransparency === true ) { attr |= STYLE_TRANSPARENCY ; }
	else if ( object.styleTransparency === false ) { attr &= ~ STYLE_TRANSPARENCY ; }

	if ( object.charTransparency === true ) { attr |= CHAR_TRANSPARENCY ; }
	else if ( object.charTransparency === false ) { attr &= ~ CHAR_TRANSPARENCY ; }

	return attr ;
} ;

ScreenBuffer.prototype.attrAndObject = function( attr , object ) {
	return ScreenBuffer.attrAndObject( attr , object , this.palette && this.palette.colorNameToIndex ) ;
} ;

// Add the selection flag, i.e. the INVERSE flag
ScreenBuffer.attrSelect = ScreenBuffer.prototype.attrSelect = attr => attr | INVERSE ;
ScreenBuffer.attrUnselect = ScreenBuffer.prototype.attrUnselect = attr => attr & ~ INVERSE ;





/* Constants */



// General purpose flags
const NONE = 0 ;	// Nothing

// Style mask and flags
const STYLE_MASK = 255 << 16 ;

const BOLD = 1 << 16 ;
const DIM = 2 << 16 ;
const ITALIC = 4 << 16 ;
const UNDERLINE = 8 << 16 ;
const BLINK = 16 << 16 ;
const INVERSE = 32 << 16 ;
const HIDDEN = 64 << 16 ;
const STRIKE = 128 << 16 ;

const BOLD_DIM = BOLD | DIM ;

// Blending flags, mask and misc flags
const FG_TRANSPARENCY = 1 << 24 ;
const BG_TRANSPARENCY = 2 << 24 ;
const STYLE_TRANSPARENCY = 4 << 24 ;
const CHAR_TRANSPARENCY = 8 << 24 ;
const TRANSPARENCY = FG_TRANSPARENCY | BG_TRANSPARENCY | STYLE_TRANSPARENCY | CHAR_TRANSPARENCY ;

// Special color: default terminal color
const FG_DEFAULT_COLOR = 16 << 24 ;
const BG_DEFAULT_COLOR = 32 << 24 ;

// Attribute mask: anything except fullwidth flags
const ATTR_MASK = 255 + ( 255 << 8 ) + ( 255 << 16 ) + TRANSPARENCY + FG_DEFAULT_COLOR + BG_DEFAULT_COLOR ;

// E.g.: if it needs redraw
// Was never implemented, could be replaced by a full-transparency check
//const VOID = 32 << 24 ;

const LEADING_FULLWIDTH = 64 << 24 ;
const TRAILING_FULLWIDTH = 128 << 24 ;
const FULLWIDTH = LEADING_FULLWIDTH | TRAILING_FULLWIDTH ;
const REMOVE_FULLWIDTH_FLAG = ~ FULLWIDTH ;

// Unused bits: none



// Tuning
const OUTPUT_THRESHOLD = 10000 ;	// minimum amount of data to retain before sending them to the terminal

// DEPRECATED version 1 of ScreenBuffer file format
const HEADER_SIZE = 40 ;	// Header consists of 40 bytes



// Data structure
ScreenBuffer.prototype.ATTR_SIZE = 4 ;	// do not edit, everything use Buffer.writeInt32BE()
ScreenBuffer.prototype.CHAR_SIZE = 4 ;
ScreenBuffer.prototype.ITEM_SIZE = ScreenBuffer.prototype.ATTR_SIZE + ScreenBuffer.prototype.CHAR_SIZE ;

ScreenBuffer.prototype.DEFAULT_ATTR = ScreenBuffer.object2attr( { defaultColor: true , bgDefaultColor: true } ) ;

ScreenBuffer.prototype.CLEAR_ATTR = ScreenBuffer.object2attr( { defaultColor: true , bgDefaultColor: true , transparency: true } ) ;
ScreenBuffer.prototype.CLEAR_BUFFER = Buffer.allocUnsafe( ScreenBuffer.prototype.ITEM_SIZE ) ;
ScreenBuffer.prototype.CLEAR_BUFFER.writeInt32BE( ScreenBuffer.prototype.CLEAR_ATTR , 0 ) ;
ScreenBuffer.prototype.CLEAR_BUFFER.write( ' \x00\x00\x00' , ScreenBuffer.prototype.ATTR_SIZE ) ;	// space

ScreenBuffer.prototype.LEADING_FULLWIDTH = LEADING_FULLWIDTH ;
ScreenBuffer.prototype.TRAILING_FULLWIDTH = TRAILING_FULLWIDTH ;



// Loader/Saver, mostly obsolete

ScreenBuffer.loadSyncV1 = function( filepath ) {
	var content , width , height , size , screenBuffer ;

	// Let it crash if nothing found
	content = fs.readFileSync( filepath ) ;

	// No header found?
	if ( content.length < HEADER_SIZE ) { throw new Error( 'No header found: this is not a ScreenBuffer file' ) ; }

	// See if we have got a 'SB' at the begining of the file
	if ( content[ 0 ] !== 83 || content[ 1 ] !== 66 ) { throw new Error( 'Magic number mismatch: this is not a ScreenBuffer file' ) ; }

	// Get the geometry
	width = content.readUInt16BE( 4 ) ;
	height = content.readUInt16BE( 6 ) ;

	// Guess the file size
	size = HEADER_SIZE + width * height * ScreenBuffer.prototype.ITEM_SIZE ;

	// Bad size?
	if ( content.length !== size ) { throw new Error( 'Bad file size: this is not a ScreenBuffer file' ) ; }

	// So the file exists, create a canvas based upon it
	screenBuffer = new ScreenBuffer( {
		width: width ,
		height: height
	} ) ;

	content.copy( screenBuffer.buffer , 0 , HEADER_SIZE ) ;

	return screenBuffer ;
} ;



ScreenBuffer.prototype.saveSyncV1 = function( filepath ) {
	var content ;

	content = Buffer.allocUnsafe( HEADER_SIZE + this.buffer.length ) ;

	// Clear the header area
	content.fill( 0 , 0 , HEADER_SIZE ) ;

	// Write the 'SB' magic number
	content[ 0 ] = 83 ;
	content[ 1 ] = 66 ;

	// Set the geometry
	content.writeUInt16BE( this.width , 4 ) ;
	content.writeUInt16BE( this.height , 6 ) ;

	this.buffer.copy( content , HEADER_SIZE ) ;

	// Let it crash if something bad happens
	fs.writeFileSync( filepath , content ) ;
} ;



ScreenBuffer.loadSyncV2 = function( filepath ) {
	var i , content , header , screenBuffer ;

	// Let it crash if nothing found
	content = fs.readFileSync( filepath ) ;

	// See if we have got a 'SB' at the begining of the file
	if ( content.length < 3 || content.toString( 'ascii' , 0 , 3 ) !== 'SB\n' ) {
		throw new Error( 'Magic number mismatch: this is not a ScreenBuffer file' ) ;
	}

	// search for the second \n
	for ( i = 3 ; i < content.length ; i ++ ) {
		if ( content[ i ] === 0x0a ) { break ; }
	}

	if ( i === content.length ) {
		throw new Error( 'No header found: this is not a ScreenBuffer file' ) ;
	}

	// Try to parse a JSON header
	try {
		header = JSON.parse( content.toString( 'utf8' , 3 , i ) ) ;
	}
	catch( error ) {
		throw new Error( 'No correct one-lined JSON header found: this is not a ScreenBuffer file' ) ;
	}

	// Mandatory header field
	if ( header.version === undefined || header.width === undefined || header.height === undefined ) {
		throw new Error( 'Missing mandatory header data, this is a corrupted or obsolete ScreenBuffer file' ) ;
	}

	// Check bitsPerColor
	if ( header.bitsPerColor && header.bitsPerColor !== ScreenBuffer.prototype.bitsPerColor ) {
		throw new Error( 'Bad Bits Per Color: ' + header.bitsPerColor + ' (should be ' + ScreenBuffer.prototype.bitsPerColor + ')' ) ;
	}

	// Bad size?
	if ( content.length !== i + 1 + header.width * header.height * ScreenBuffer.prototype.ITEM_SIZE ) {
		throw new Error( 'Bad file size: this is a corrupted ScreenBuffer file' ) ;
	}

	// So the file exists, create a canvas based upon it
	screenBuffer = new ScreenBuffer( {
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
ScreenBuffer.prototype.saveSyncV2 = function( filepath ) {
	var content , header ;

	header = {
		version: 2 ,
		width: this.width ,
		height: this.height ,
		bpp: this.bpp
	} ;

	header = 'SB\n' + JSON.stringify( header ) + '\n' ;

	content = Buffer.allocUnsafe( header.length + this.buffer.length ) ;
	content.write( header ) ;

	this.buffer.copy( content , header.length ) ;

	// Let it crash if something bad happens
	fs.writeFileSync( filepath , content ) ;
} ;



ScreenBuffer.loadSync = ScreenBuffer.loadSyncV2 ;
ScreenBuffer.prototype.saveSync = ScreenBuffer.prototype.saveSyncV2 ;

