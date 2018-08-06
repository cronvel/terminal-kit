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



const Rect = require( './Rect.js' ) ;
const NextGenEvents = require( 'nextgen-events' ) ;

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
function ScreenBuffer( options = {} ) {
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
}

module.exports = ScreenBuffer ;

ScreenBuffer.prototype = Object.create( NextGenEvents.prototype ) ;
ScreenBuffer.prototype.constructor = ScreenBuffer ;
ScreenBuffer.prototype.bitsPerColor = 8 ;

// Backward compatibility
ScreenBuffer.create = ( ... args ) => new ScreenBuffer( ... args ) ;



const termkit = require( './termkit.js' ) ;



/*
	options:
		* attr: attributes passed to .put()
		* transparencyChar: a char that is transparent
		* transparencyType: bit flags for the transparency char
*/
ScreenBuffer.createFromString = function createFromString( options , data ) {
	var x , y , len , attr , attrTrans , width , height , self ;

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
		if ( data[ y ].length > width ) { width = data[ y ].length ; }
	}

	// Create the buffer with the right width & height
	self = new ScreenBuffer( { width: width , height: height } ) ;

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
ScreenBuffer.createFromChars = ScreenBuffer.createFromString ;



/*
	options:
		char: the buffer will be filled with that char
		attr: the attribute to fill
		buffer: used when we want to clear a Buffer instance, not a ScreenBuffer instance
		start: start offset
		end: end offset
		clearBuffer: a buffer used to clear (instead of char+attr)
		void: use the "clear void buffer" (instead of "clear buffer" or char+attr)
*/
// Shared
ScreenBuffer.prototype.fill = function fill( options ) {
	//this.buffer.fill( 0 ) ; return this ;

	var i , attr , char , start , end ,
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
	}
	else {
		start = 0 ;
		end = buffer.length / this.ITEM_SIZE ;
	}

	for ( i = start ; i < end ; i ++ ) {
		clearBuffer.copy( buffer , i * this.ITEM_SIZE ) ;
	}
} ;



var firstPass = string.createFormatter( {
	argumentSanitizer: str => str.replace( /[\x00-\x1f\x7f^]/g , char => char === '^' ? '^^' : '' ) ,
	noMarkup: true
} ) ;



ScreenBuffer.prototype.MARKUP_ATTR_OBJECT = {
	normal: {
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
	background: {
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
} ;



/*
	put( options , str )
	put( options , format , [arg1] , [arg2] , ... )

	options:
		* x: bypass this.cx
		* y: bypass this.cy
		* attr: standard attributes
		* resumeAttr: attr to resume to
		* wrap: text wrapping, when the cursor move beyond the last column, it is moved to the begining of the next line
		* direction: 'right' (default), 'left', 'up', 'down' or 'none'/null (do not move after puting a char)
		* dx: x increment after each character (default: 1)
		* dy: y increment after each character (default: 0)
*/
// Shared
ScreenBuffer.prototype.put = function put( options , str , ... args ) {
	var i , x , y , dx , dy , baseAttr , attr , wrap , characters , len , offset ,
		markupAttrObject = this.MARKUP_ATTR_OBJECT.normal ;

	// Manage options
	if ( ! options ) { options = {} ; }

	wrap = options.wrap !== undefined ? options.wrap : this.wrap ;

	x = Math.floor( options.x !== undefined ? options.x : this.cx ) ;
	y = Math.floor( options.y !== undefined ? options.y : this.cy ) ;


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
		str = options.markup ?
			firstPass( str , ... args ) :
			string.format( str , ... args ) ;
	}

	//str = termkit.stripControlChars( str ) ;

	//characters = punycode.ucs2.decode( str ) ;
	characters = string.unicode.toArray( str ) ;
	len = characters.length ;

	for ( i = 0 ; i < len ; i ++ ) {
		offset = ( y * this.width + x ) * this.ITEM_SIZE ;

		if ( options.markup && characters[ i ] === '^' ) {
			i ++ ;

			// double caret = single caret
			if ( characters[ i ] !== '^' ) {
				if ( characters[ i ] === ' ' ) {
					attr = baseAttr ;
					markupAttrObject = this.MARKUP_ATTR_OBJECT.normal ;
				}
				else if ( characters[ i ] === ':' ) {
					attr = baseAttr ;
					markupAttrObject = this.MARKUP_ATTR_OBJECT.normal ;
					continue ;
				}
				else if ( characters[ i ] === '#' ) {
					markupAttrObject = this.MARKUP_ATTR_OBJECT.background ;
					continue ;
				}
				else if ( markupAttrObject[ characters[ i ] ] ) {
					attr = this.attrAndObject( attr , markupAttrObject[ characters[ i ] ] ) ;
					markupAttrObject = this.MARKUP_ATTR_OBJECT.normal ;
					continue ;
				}
				else {
					markupAttrObject = this.MARKUP_ATTR_OBJECT.normal ;
					continue ;
				}
			}
		}

		//if ( offset >= 0 && offset < this.buffer.length )
		if ( x >= 0 && x < this.width && y >= 0 && y < this.height ) {
			// Write the attributes
			this.writeAttr( this.buffer , attr , offset ) ;

			// Write the character
			this.writeChar( this.buffer , characters[ i ] , offset ) ;
		}

		x += dx ;
		y += dy ;

		if ( x < 0 ) {
			if ( ! wrap ) { x = 0 ; break ; }
			x = this.width - 1 ;
			y -- ;
		}
		else if ( x >= this.width ) {
			if ( ! wrap ) { x = this.width - 1 ; break ; }
			x = 0 ;
			y ++ ;
		}

		if ( y < 0 ) { y = 0 ; break ; }
		else if ( y >= this.height ) { y = this.height - 1 ; break ; }
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
ScreenBuffer.prototype.get = function get( options ) {
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
ScreenBuffer.prototype.resize = function resize( fromRect ) {
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

	// We use the blit to reconstruct the buffer geometry
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
ScreenBuffer.prototype.draw = function draw( options ) {
	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	// Transmitted options (do not edit the user provided options, clone them)
	var tr = {
		dst: options.dst || this.dst ,
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
ScreenBuffer.prototype.moveTo = function moveTo( x , y ) {
	this.cx = Math.max( 0 , Math.min( x , this.width - 1 ) ) ;
	this.cy = Math.max( 0 , Math.min( y , this.height - 1 ) ) ;
} ;



// Shared
ScreenBuffer.prototype.drawCursor = function drawCursor( options ) {
	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	var dst = options.dst || this.dst ;

	if ( dst instanceof ScreenBuffer ) {
		dst.moveTo( this.cx + this.x , this.cy + this.y ) ;
	}
	else if ( dst instanceof termkit.Terminal ) {
		dst.moveTo(
			Math.max( 1 , Math.min( this.cx + this.x , dst.width ) ) ,
			Math.max( 1 , Math.min( this.cy + this.y , dst.height ) )
		) ;
	}
} ;



// Shared
ScreenBuffer.prototype.blitter = function blitter( p ) {
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



// Shared
ScreenBuffer.prototype.blitterLineIterator = function blitterLineIterator( p ) {
	p.context.srcBuffer.copy( p.context.dstBuffer , p.dstStart , p.srcStart , p.srcEnd ) ;
} ;



ScreenBuffer.prototype.blitterCellBlendingIterator = function blitterCellBlendingIterator( p ) {
	var blending = this.readAttr( p.context.srcBuffer , p.srcStart ) & TRANSPARENCY ;

	if ( blending === NONE ) {
		// Fully visible, copy it
		p.context.srcBuffer.copy( p.context.dstBuffer , p.dstStart , p.srcStart , p.srcEnd ) ;
		return ;
	}

	if ( blending === TRANSPARENCY ) {
		// Fully transparent, do nothing
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
		// Copy source character
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + this.ATTR_SIZE ,
			p.srcStart + this.ATTR_SIZE ,
			p.srcEnd
		) ;
	}
} ;



// Shared
ScreenBuffer.prototype.terminalBlitter = function terminalBlitter( p ) {
	var tr , iterator , iteratorCallback , context ;

	context = {
		srcBuffer: this.buffer ,
		blending: p.blending ,
		term: p.dst ,
		deltaEscapeSequence: p.dst.support.deltaEscapeSequence ,
		nfterm: p.dst.noFormat ,
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

	if ( p.delta ) {
		if ( ! this.lastBuffer || this.lastBuffer.length !== this.buffer.length ) {
			this.lastBuffer = Buffer.from( this.buffer ) ;
			iteratorCallback = this.terminalBlitterLineIterator.bind( this ) ;
		}
		else if ( this.lastBufferUpToDate ) {
			context.srcLastBuffer = this.lastBuffer ;

			iteratorCallback = this.terminalBlitterCellIterator.bind( this ) ;
			tr.type = 'cell' ;
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
	if ( context.sequence.length ) { context.nfterm( context.sequence ) ; context.writes ++ ; }

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



ScreenBuffer.prototype.terminalBlitterLineIterator = function terminalBlitterLineIterator( p ) {
	var offset , attr ;

	p.context.sequence += p.context.term.optimized.moveTo( p.dstXmin , p.dstY ) ;
	p.context.moves ++ ;

	for ( offset = p.srcStart ; offset < p.srcEnd ; offset += this.ITEM_SIZE ) {
		attr = this.readAttr( p.context.srcBuffer , offset ) ;

		if ( ( attr & TRANSPARENCY ) === TRANSPARENCY ) {
			// Fully transparent, do nothing except moving one char right
			p.context.sequence += p.context.term.optimized.right ;
			continue ;
		}

		if ( attr !== p.context.lastAttr ) {
			p.context.sequence += p.context.lastAttr === null || ! p.context.deltaEscapeSequence ?
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



ScreenBuffer.prototype.terminalBlitterCellIterator = function terminalBlitterCellIterator( p ) {
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

	if ( ( attr & TRANSPARENCY ) === TRANSPARENCY ) {
		// Fully transparent, do nothing
		// Check that after eventually updating lastBuffer
		return ;
	}

	p.context.cells ++ ;

	if ( p.dstX !== p.context.cx || p.dstY !== p.context.cy ) {
		p.context.sequence += p.context.term.optimized.moveTo( p.dstX , p.dstY ) ;
		p.context.moves ++ ;
	}

	if ( attr !== p.context.lastAttr ) {
		p.context.sequence += p.context.lastAttr === null || ! p.context.deltaEscapeSequence ?
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



ScreenBuffer.loadSyncV1 = function loadSync( filepath ) {
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



ScreenBuffer.prototype.saveSyncV1 = function saveSync( filepath ) {
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



ScreenBuffer.loadSyncV2 = function loadSync( filepath ) {
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
ScreenBuffer.prototype.saveSyncV2 = function saveSync( filepath ) {
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



ScreenBuffer.fromNdarrayImage = function fromNdarrayImage( pixels , options ) {
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
ScreenBuffer.prototype.dumpChars = function dumpChars() {
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



ScreenBuffer.prototype.dump = function dump() {
	var y , x , offset , str = '' ;

	for ( y = 0 ; y < this.height ; y ++ ) {
		for ( x = 0 ; x < this.width ; x ++ ) {
			offset = ( y * this.width + x ) * this.ITEM_SIZE ;

			str += string.format( '%x%x%x%x ' ,
				this.buffer.readUInt8( offset ) ,
				this.buffer.readUInt8( offset + 1 ) ,
				this.buffer.readUInt8( offset + 2 ) ,
				this.buffer.readUInt8( offset + 3 )
			) ;

			str += this.readChar( this.buffer , offset ) + ' ' ;
		}

		str += '\n' ;
	}

	return str ;
} ;



ScreenBuffer.prototype.readAttr = function readAttr( buffer , at ) {
	return buffer.readInt32BE( at ) ;
} ;



ScreenBuffer.prototype.writeAttr = function writeAttr( buffer , attr , at ) {
	return buffer.writeInt32BE( attr , at ) ;
} ;



ScreenBuffer.prototype.readChar = function readChar( buffer , at ) {
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



ScreenBuffer.prototype.writeChar = function writeChar( buffer , char , at ) {
	return buffer.write( char , at + this.ATTR_SIZE , this.CHAR_SIZE ) ;
} ;



ScreenBuffer.prototype.generateEscapeSequence = function generateEscapeSequence( term , attr ) {
	var esc = term.optimized.styleReset +
		( attr & FG_DEFAULT_COLOR ? term.optimized.defaultColor : term.optimized.color256[ attr & 255 ] ) +
		( attr & BG_DEFAULT_COLOR ? term.optimized.bgDefaultColor : term.optimized.bgColor256[ ( attr >>> 8 ) & 255 ] ) ;

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
ScreenBuffer.prototype.generateDeltaEscapeSequence = function generateDeltaEscapeSequence( term , attr , lastAttr ) {
	//console.log( 'generateDeltaEscapeSequence' ) ;

	var esc = '' ,
		color = attr & 255 ,
		lastColor = lastAttr & 255 ,
		bgColor = ( attr >>> 8 ) & 255 ,
		lastBgColor = ( lastAttr >>> 8 ) & 255 ;

	if ( attr & FG_DEFAULT_COLOR ) {
		if ( ! ( lastAttr & FG_DEFAULT_COLOR ) ) { esc += term.optimized.defaultColor ; }
	}
	else if ( color !== lastColor || ( lastAttr & FG_DEFAULT_COLOR ) ) {
		esc += term.optimized.color256[ color ] ;
	}

	if ( attr & BG_DEFAULT_COLOR ) {
		if ( ! ( lastAttr & BG_DEFAULT_COLOR ) ) { esc += term.optimized.bgDefaultColor ; }
	}
	else if ( bgColor !== lastBgColor || ( lastAttr & BG_DEFAULT_COLOR ) ) {
		esc += term.optimized.bgColor256[ bgColor ] ;
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
	This is rarely useful, except in rare optimization cases.
*/
// Shared
ScreenBuffer.prototype.vScroll = function vScroll( lineOffset , drawToTerminal ) {
	if ( ! lineOffset ) { return ; }

	var offset = this.width * lineOffset * this.ITEM_SIZE ;

	if ( offset > 0 ) {
		this.buffer.copy( this.buffer , offset , 0 , this.buffer.length - offset ) ;
		this.fill( { end: offset } ) ;
	}
	else {
		this.buffer.copy( this.buffer , 0 , -offset , this.buffer.length ) ;
		this.fill( { start: this.buffer.length + offset } ) ;
	}

	if ( drawToTerminal && this.dst instanceof termkit.Terminal ) {
		// Scroll lastBuffer accordingly
		if ( this.lastBufferUpToDate && this.lastBuffer ) {
			if ( offset > 0 ) {
				this.lastBuffer.copy( this.lastBuffer , offset , 0 , this.lastBuffer.length - offset ) ;
				this.fill( { end: offset , buffer: this.lastBuffer } ) ;
			}
			else {
				this.lastBuffer.copy( this.lastBuffer , 0 , -offset , this.lastBuffer.length ) ;
				this.fill( { start: this.buffer.length + offset , buffer: this.lastBuffer } ) ;
			}
		}

		this.dst.scrollingRegion( this.y , this.y + this.height - 1 ) ;

		if ( lineOffset > 0 ) { this.dst.scrollDown( lineOffset ) ; }
		else { this.dst.scrollUp( -lineOffset ) ; }

		this.dst.resetScrollingRegion() ;
	}
} ;





/*
	Methods that are both static and instance member.
	It must be possible to call them without any instance AND invoke instance specific method.
*/



ScreenBuffer.attr2object = function attr2object( attr ) {
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



ScreenBuffer.object2attr = function object2attr( object ) {
	var attr = 0 ;

	if ( ! object || typeof object !== 'object' ) { object = {} ; }

	// Color part
	if ( typeof object.color === 'string' ) {
		if ( object.color === 'default' ) { object.color = 0 ; object.defaultColor = true ; }
		else { object.color = termkit.colorNameToIndex( object.color ) ; }
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
		else { object.bgColor = termkit.colorNameToIndex( object.bgColor ) ; }
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

ScreenBuffer.prototype.object2attr = ScreenBuffer.object2attr ;



// Add some attributes from an object to an existing attr integer
ScreenBuffer.attrAndObject = function attrAndObject( attr , object ) {
	if ( ! object || typeof object !== 'object' ) { return attr ; }

	// Color part
	if ( object.defaultColor || object.color === 'default' ) {
		attr -= attr & 255 ;
		attr |= FG_DEFAULT_COLOR ;
	}
	else if ( typeof object.color === 'string' ) {
		attr = attr - ( attr & 255 ) + termkit.colorNameToIndex( object.color ) ;
		if ( attr & FG_DEFAULT_COLOR ) { attr -= FG_DEFAULT_COLOR ; }
	}
	else if ( typeof object.color === 'number' && object.color >= 0 && object.color <= 255 ) {
		attr = attr - ( attr & 255 ) + object.color ;
		if ( attr & FG_DEFAULT_COLOR ) { attr -= FG_DEFAULT_COLOR ; }
	}

	// Background color part
	if ( object.bgDefaultColor || object.bgColor === 'default' ) {
		attr -= ( ( ( attr >>> 8 ) & 255 ) << 8 ) ;
		attr |= BG_DEFAULT_COLOR ;
	}
	else if ( typeof object.bgColor === 'string' ) {
		attr = attr - ( ( ( attr >>> 8 ) & 255 ) << 8 ) + ( termkit.colorNameToIndex( object.bgColor ) << 8 ) ;
		if ( attr & BG_DEFAULT_COLOR ) { attr -= BG_DEFAULT_COLOR ; }
	}
	else if ( typeof object.bgColor === 'number' && object.bgColor >= 0 && object.bgColor <= 255 ) {
		attr = attr - ( ( ( attr >>> 8 ) & 255 ) << 8 ) + ( object.bgColor << 8 ) ;
		if ( attr & BG_DEFAULT_COLOR ) { attr -= BG_DEFAULT_COLOR ; }
	}

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

ScreenBuffer.prototype.attrAndObject = ScreenBuffer.attrAndObject ;



// Clear the buffer: fill it with blank
// Shared
ScreenBuffer.prototype.clear = ScreenBuffer.prototype.fill ;





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

// E.g.: if it needs redraw
// Was never implemented, could be replaced by a full-transparency check
//const VOID = 32 << 24 ;

const LEADING_FULLWIDTH = 64 << 24 ;
const TRAILING_FULLWIDTH = 128 << 24 ;

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

