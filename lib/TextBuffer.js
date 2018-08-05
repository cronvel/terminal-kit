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



var fs = require( 'fs' ) ;
var string = require( 'string-kit' ) ;



// A buffer suitable for text editor



function TextBuffer( options = {} ) {
	var ScreenBuffer_ = options.ScreenBuffer || ( options.dst && options.dst.constructor ) || termkit.ScreenBuffer ;

	this.ScreenBuffer = ScreenBuffer_ ;

	// a screenBuffer
	this.dst = options.dst ;

	// virtually infinity by default
	this.width = options.width || Infinity ;
	this.height = options.height || Infinity ;

	this.x = options.x !== undefined ? options.x : 0 ;
	this.y = options.y !== undefined ? options.y : 0 ;
	this.cx = 0 ;
	this.cy = 0 ;

	this.emptyCellAttr = ScreenBuffer_.prototype.DEFAULT_ATTR ;
	this.hidden = false ;

	this.tabWidth = options.tabWidth || 4 ;
	this.forceInBound = !! options.forceInBound ;
	this.wrap = !! options.wrap ;

	this.buffer = [ [] ] ;

	if ( options.hidden ) { this.setHidden( options.hidden ) ; }
}

module.exports = TextBuffer ;



// Backward compatibility
TextBuffer.create = ( ... args ) => new TextBuffer( ... args ) ;



function Cell( char , attr , misc ) {
	this.char = char || ' ' ;
	this.filler = char === null ;
	this.attr = attr || null ;
	this.misc = misc || null ;
}

TextBuffer.Cell = Cell ;



var termkit = require( './termkit.js' ) ;



TextBuffer.prototype.getText = function getText() {
	return this.buffer.map( line => string.unicode.fromCells( line ) ).join( '\n' ) ;
} ;



TextBuffer.prototype.setText = function setText( text ) {
	var lines = text.split( '\n' ) ;

	this.buffer.length = lines.length ;

	lines.forEach( ( line , index ) => {
		this.buffer[ index ] = string.unicode.toCells( Cell , line , this.tabWidth , 0 , this.emptyCellAttr ) ;
	} ) ;
} ;



TextBuffer.prototype.setHidden = function setHidden( value ) {
	this.hidden = typeof value === 'string' && value.length ? value[ 0 ] : ( value ? termkit.spChars.password : false ) ;	// eslint-disable-line
} ;

TextBuffer.prototype.getHidden = function getHidden() { return this.hidden ; } ;



TextBuffer.prototype.getContentSize = function getContentSize() {
	return {
		width: Math.max( 1 , ... this.buffer.map( line => line.length ) ) ,
		height: this.buffer.length
	} ;
} ;



// Recompute tabs
TextBuffer.prototype.reTabLine = function reTabLine( startAt = 0 ) {
	var length , cell , index , fillSize , input , output ,
		linePosition = startAt ;

	if ( this.buffer[ this.cy ] === undefined ) { this.buffer[ this.cy ] = [] ; }

	input = this.buffer[ this.cy ] ;
	output = input.slice( 0 , startAt ) ;
	length = input.length ;

	for ( index = startAt ; index < length ; index ++ ) {
		cell = input[ index ] ;

		if ( cell.char === '\t' ) {
			fillSize = this.tabWidth - ( linePosition % this.tabWidth ) - 1 ;
			output.push( cell ) ;
			linePosition += 1 + fillSize ;

			while ( fillSize -- ) {
				// /!\ First or second?
				//output.push( new Cell( null ) ) ;
				output.push( new Cell( null , cell.attr , cell.misc ) ) ;
			}

			// Skip input filler
			while ( index + 1 < length && input[ index + 1 ].filler ) { index ++ ; }
		}
		else {
			output.push( cell ) ;
			linePosition ++ ;
		}
	}

	this.buffer[ this.cy ] = output ;
} ;



TextBuffer.prototype.setEmptyCellAttr = function setEmptyCellAttr( attr ) {
	if ( attr && typeof attr === 'object' ) { attr = this.ScreenBuffer.object2attr( attr ) ; }
	else if ( typeof attr !== 'number' ) { return ; }

	this.emptyCellAttr = attr ;
} ;



TextBuffer.prototype.setAttrAt = function setAttrAt( attr , x , y ) {
	if ( attr && typeof attr === 'object' ) { attr = this.ScreenBuffer.object2attr( attr ) ; }
	else if ( typeof attr !== 'number' ) { return ; }

	this.setAttrCodeAt( attr , x , y ) ;
} ;



// Faster than setAttrAt(), do no check attr, assume an attr code (number)
TextBuffer.prototype.setAttrCodeAt = function setAttrCodeAt( attr , x , y ) {
	if ( ! this.buffer[ y ] ) { this.buffer[ y ] = [] ; }

	if ( ! this.buffer[ y ][ x ] ) { this.buffer[ y ][ x ] = new Cell( ' ' , attr ) ; }
	else { this.buffer[ y ][ x ].attr = attr ; }
} ;



var wholeBufferRegion = {
	xmin: 0 , xmax: Infinity , ymin: 0 , ymax: Infinity
} ;

// Set a whole region
TextBuffer.prototype.setAttrRegion = function setAttrRegion( attr , region ) {
	if ( attr && typeof attr === 'object' ) { attr = this.ScreenBuffer.object2attr( attr ) ; }
	else if ( typeof attr !== 'number' ) { return ; }

	this.setAttrCodeRegion( attr , region ) ;
} ;



// Faster than setAttrRegion(), do no check attr, assume an attr code (number)
TextBuffer.prototype.setAttrCodeRegion = function setAttrCodeRegion( attr , region ) {
	var x , y , xmin , xmax , ymax ;

	if ( ! region ) { region = wholeBufferRegion ; }

	ymax = Math.min( region.ymax , this.buffer.length - 1 ) ;

	for ( y = region.ymin ; y <= ymax ; y ++ ) {
		if ( ! this.buffer[ y ] ) { this.buffer[ y ] = [] ; }

		xmin = y === region.ymin ? region.xmin : 0 ;
		xmax = y === region.ymax ? Math.min( region.xmax , this.buffer[ y ].length - 1 ) : this.buffer[ y ].length - 1 ;

		for ( x = xmin ; x <= xmax ; x ++ ) {
			this.buffer[ y ][ x ].attr = attr ;
		}
	}
} ;



// Misc data are lazily created
TextBuffer.prototype.getMisc = function getMisc() {
	if ( ! this.buffer[ this.cy ] || ! this.buffer[ this.cy ][ this.cx ] ) { return ; }
	if ( ! this.buffer[ this.cy ][ this.cx ].misc ) { this.buffer[ this.cy ][ this.cx ].misc = {} ; }
	return this.buffer[ this.cy ][ this.cx ].misc ;
} ;



TextBuffer.prototype.getMiscAt = function getMiscAt( x , y ) {
	if ( ! this.buffer[ y ] || ! this.buffer[ y ][ x ] ) { return ; }
	if ( ! this.buffer[ y ][ x ].misc ) { this.buffer[ y ][ x ].misc = {} ; }
	return this.buffer[ y ][ x ].misc ;
} ;



TextBuffer.prototype.iterate = function iterate( options , callback ) {
	var x , y , offset , length ;

	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }

	if ( ! this.buffer.length ) { return ; }

	offset = 0 ;
	y = 0 ;

	for ( ;; ) {
		if ( this.buffer[ y ] ) {
			length = this.buffer[ y ].length ;

			for ( x = 0 ; x < length ; x ++ ) {
				if ( this.buffer[ y ][ x ].filler ) { continue ; }

				callback( {
					offset: offset ,
					x: x ,
					y: y ,
					text: this.buffer[ y ][ x ].char ,
					attr: this.buffer[ y ][ x ].attr ,
					misc: this.buffer[ y ][ x ].misc
				} ) ;

				offset ++ ;
			}
		}

		// Another iteration?
		if ( y + 1 >= this.buffer.length ) { break ; }

		// Send the \n
		offset ++ ;

		callback( {
			offset: offset ,
			x: null ,
			y: y ,
			text: '\n' ,
			attr: null ,
			misc: null
		} ) ;

		y ++ ;
	}


	// Call the callback one last time at the end of the buffer, with an empty string.
	// Useful for 'Ne' (Neon) state machine.
	if ( options.finalCall ) {
		callback( {
			offset: offset + 1 ,
			x: null ,
			y: y ,
			text: '' ,
			attr: null ,
			misc: null
		} ) ;
	}
} ;



TextBuffer.prototype.moveTo = function moveTo( x , y ) {
	this.cx = x >= 0 ? x : 0 ;
	this.cy = y >= 0 ? y : 0 ;
} ;



TextBuffer.prototype.move = function move( x , y ) { this.moveTo( this.cx + x , this.cy + y ) ; } ;
TextBuffer.prototype.moveToColumn = function moveToColumn( x ) { this.moveTo( x , this.cy ) ; } ;
TextBuffer.prototype.moveToLine = TextBuffer.prototype.moveToRow = function moveToLine( y ) { this.moveTo( this.cx , y ) ; } ;



TextBuffer.prototype.moveUp = function moveUp() {
	this.cy = this.cy > 0 ? this.cy - 1 : 0 ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
} ;



TextBuffer.prototype.moveDown = function moveDown() {
	this.cy ++ ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
} ;



TextBuffer.prototype.moveLeft = function moveLeft() {
	this.cx = this.cx > 0 ? this.cx - 1 : 0 ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
} ;



TextBuffer.prototype.moveRight = function moveRight() {
	this.cx ++ ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
} ;



TextBuffer.prototype.moveForward = function moveForward( justSkipFiller ) {
	var oldCx = this.cx ;

	if ( justSkipFiller && ( ! this.buffer[ this.cy ] || ! this.buffer[ this.cy ][ this.cx ] || ! this.buffer[ this.cy ][ this.cx ].filler ) ) { return ; }

	for ( ;; ) {
		this.cx ++ ;

		if ( ! this.buffer[ this.cy ] || this.cx > this.buffer[ this.cy ].length ) {
			if ( this.cy + 1 < this.buffer.length || ! this.forceInBound ) {
				this.cy ++ ;
				this.cx = 0 ;
			}
			else {
				this.cx = oldCx ;
			}

			break ;
		}

		if ( ! this.buffer[ this.cy ] || ! this.buffer[ this.cy ][ this.cx ] || ! this.buffer[ this.cy ][ this.cx ].filler ) { break ; }
	}

	if ( this.forceInBound ) { this.moveInBound() ; }
} ;



TextBuffer.prototype.moveBackward = function moveBackward( justSkipFiller ) {
	var lineLength ;

	if ( justSkipFiller && ( ! this.buffer[ this.cy ] || ! this.buffer[ this.cy ][ this.cx ] || ! this.buffer[ this.cy ][ this.cx ].filler ) ) { return ; }

	for ( ;; ) {
		lineLength = this.buffer[ this.cy ] ? this.buffer[ this.cy ].length : 0 ;

		if ( this.cx > lineLength ) { this.cx = lineLength ; }
		else { this.cx -- ; }

		if ( this.cx < 0 ) {
			this.cy -- ;

			if ( this.cy < 0 ) { this.cy = 0 ; this.cx = 0 ; break ; }

			lineLength = this.buffer[ this.cy ] ? this.buffer[ this.cy ].length : 0 ;
			this.cx = lineLength ;
			break ;
		}

		if ( ! this.buffer[ this.cy ] || ! this.buffer[ this.cy ][ this.cx ] || ! this.buffer[ this.cy ][ this.cx ].filler ) { break ; }
	}

	if ( this.forceInBound ) { this.moveInBound() ; }
} ;



TextBuffer.prototype.moveToEndOfLine = function moveToEndOfLine() {
	this.cx = this.buffer[ this.cy ] ? this.buffer[ this.cy ].length : 0 ;
} ;



TextBuffer.prototype.moveInBound = function moveInBound( ignoreCx ) {
	if ( this.cy > this.buffer.length ) { this.cy = this.buffer.length ; }

	if ( ignoreCx ) { return ; }

	if ( ! this.buffer[ this.cy ] ) { this.cx = 0 ; }
	else if ( this.cx > this.buffer[ this.cy ].length ) { this.cx = this.buffer[ this.cy ].length ; }
} ;



TextBuffer.prototype.insert = function insert( text , attr ) {
	var lines , index , length ;

	if ( ! text ) { return ; }

	lines = text.split( '\n' ) ;
	length = lines.length ;

	if ( attr && typeof attr === 'object' ) { attr = this.ScreenBuffer.object2attr( attr ) ; }
	else if ( typeof attr !== 'number' ) { attr = this.emptyCellAttr ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	this.inlineInsert( lines[ 0 ] , attr ) ;

	for ( index = 1 ; index < length ; index ++ ) {
		this.newLine( true ) ;
		this.inlineInsert( lines[ index ] , attr ) ;
	}
} ;



// Internal API:
// Insert inline chars (no control chars)
TextBuffer.prototype.inlineInsert = function inlineInsert( text , attr ) {
	var currentLineLength , tabIndex , fillSize ;

	this.moveForward( true ) ;	// just skip filler char

	// Should come after moving forward
	var cells = string.unicode.toCells( Cell , text , this.tabWidth , this.cx , attr ) ;

	if ( this.buffer[ this.cy ] === undefined ) { this.buffer[ this.cy ] = [] ; }

	currentLineLength = this.buffer[ this.cy ].length ;

	// Apply
	if ( this.cx === currentLineLength ) {
		this.buffer[ this.cy ].push( ... cells ) ;
	}
	else if ( this.cx < currentLineLength ) {
		this.buffer[ this.cy ].splice( this.cx , 0 , ... cells ) ;
	}
	else {
		// if ( this.cx > currentLineLength )
		fillSize = this.cx - currentLineLength ;
		while ( fillSize -- ) { this.buffer[ this.cy ].push( new Cell( ' ' , this.emptyCellAttr ) ) ; }
		this.buffer[ this.cy ].push( ... cells ) ;
	}

	// Patch tab if needed
	tabIndex = this.indexOfCharInLine( this.buffer[ this.cy ] , '\t' , this.cx ) ;
	this.cx += cells.length ;
	if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
} ;



// Internal utility function
TextBuffer.prototype.indexOfCharInLine = function indexOfCharInLine( line , char , index = 0 ) {
	var iMax = line.length ;

	for ( ; index < iMax ; index ++ ) {
		if ( line[ index ].char === char ) { return index ; }
	}

	// Like .indexOf() does...
	return -1 ;
} ;



// /!\ Bug with tabs and count > 1 !!! /!\

// Delete chars
TextBuffer.prototype.delete = function delete_( count ) {
	var inlineCount ;

	if ( count === undefined ) { count = 1 ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] && this.buffer[ this.cy ][ this.cx ] && this.buffer[ this.cy ][ this.cx ].filler ) {
		this.moveBackward( true ) ;	// just skip filler char
		count -- ;
	}

	while ( count > 0 ) {
		// If we are already at the end of the buffer...
		if ( this.cy >= this.buffer.length ||
			( this.cy === this.buffer.length - 1 && this.cx >= this.buffer[ this.cy ].length ) ) {
			return ;
		}

		if ( this.buffer[ this.cy ] ) {
			// If the cursor is too far away, move it at the end of the line
			if ( this.cx > this.buffer[ this.cy ].length ) { this.cx = this.buffer[ this.cy ].length ; }

			// Compute inline delete
			//inlineCount = Math.min( count , this.buffer[ this.cy ].length - this.cx ) ;
			inlineCount = this.countInlineForward( count ) ;

			// Apply inline delete
			if ( inlineCount > 0 ) {
				this.buffer[ this.cy ].splice( this.cx , inlineCount ) ;
			}

			count -= inlineCount ;
		}

		if ( count > 0 ) {
			this.joinLine( true ) ;
			count -- ;
		}
	}

	// Patch tab if needed
	//tabIndex = this.buffer[ this.cy ].indexOf( '\t' , this.cx ) ;
	//if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	this.reTabLine() ;	// Do it every time, before finding a better way to do it
} ;



// /!\ Bug with tabs and count > 1 !!! /!\

// Delete backward chars
TextBuffer.prototype.backDelete = function backDelete( count ) {
	var inlineCount , tabIndex ;

	if ( count === undefined ) { count = 1 ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] && this.cx && this.buffer[ this.cy ][ this.cx - 1 ] && this.buffer[ this.cy ][ this.cx - 1 ].filler ) {
		this.moveBackward( true ) ;	// just skip filler char
		//count -- ;	// do not downcount: the cursor is always on a \x00 before deleting a \t
	}

	while ( count > 0 ) {
		// If we are already at the begining of the buffer...
		if ( this.cy === 0 && this.cx === 0 ) { return ; }

		if ( this.buffer[ this.cy ] ) {

			// If the cursor is to far away, move it at the end of the line, it will cost one 'count'
			if ( this.cx > this.buffer[ this.cy ].length ) {
				this.cx = this.buffer[ this.cy ].length ;
				count -- ;
			}

			// Compute inline delete
			inlineCount = this.countInlineBackward( count ) ;

			// Apply inline delete
			if ( inlineCount > 0 ) {
				this.buffer[ this.cy ].splice( this.cx - inlineCount , inlineCount ) ;
				this.cx -= inlineCount ;
			}

			count -= inlineCount ;
		}

		if ( count > 0 ) {
			this.cy -- ;
			this.cx = this.buffer[ this.cy ] ? this.buffer[ this.cy ].length : 0 ;
			this.joinLine( true ) ;
			count -- ;
		}
	}

	// Patch tab if needed
	//tabIndex = this.buffer[ this.cy ].indexOf( '\t' , this.cx ) ;
	//if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	this.reTabLine( tabIndex ) ;	// Do it every time, before finding a better way to do it
} ;



// Fix a backward counter, get an additional count for each null char encountered
TextBuffer.prototype.countInlineBackward = function countInlineBackward( count ) {
	var c , x ;

	for ( x = this.cx - 1 , c = 0 ; x >= 0 && c < count ; x -- , c ++ ) {
		if ( this.buffer[ this.cy ][ x ] && this.buffer[ this.cy ][ x ].filler ) { count ++ ; }
	}

	return c ;
} ;



// Fix a forward counter, get an additional count for each null char encountered
TextBuffer.prototype.countInlineForward = function countInlineForward( count ) {
	var c , x , xMax = this.buffer[ this.cy ].length ;

	for ( x = this.cx , c = 0 ; x < xMax && c < count ; x ++ , c ++ ) {
		if ( this.buffer[ this.cy ][ x + 1 ] && this.buffer[ this.cy ][ x + 1 ].filler ) { count ++ ; }
	}

	return c ;
} ;



TextBuffer.prototype.newLine = function newLine( internalCall ) {
	var currentLineLength , nextLine = [] , tabIndex ;

	if ( ! internalCall && this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] === undefined ) { this.buffer[ this.cy ] = [] ; }

	currentLineLength = this.buffer[ this.cy ].length ;

	// Apply
	if ( this.cx < currentLineLength ) {
		nextLine = this.buffer[ this.cy ].slice( this.cx ) ;
		this.buffer[ this.cy ] = this.buffer[ this.cy ].slice( 0 , this.cx ) ;
	}

	this.buffer.splice( this.cy + 1 , 0 , nextLine ) ;

	this.cx = 0 ;
	this.cy ++ ;

	// Patch tab if needed
	if ( ! internalCall ) {
		tabIndex = this.indexOfCharInLine( this.buffer[ this.cy ] , '\t' , this.cx ) ;
		if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	}
} ;



TextBuffer.prototype.joinLine = function joinLine( internalCall ) {
	var tabIndex ;

	if ( ! internalCall && this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] === undefined ) { this.buffer[ this.cy ] = [] ; }
	if ( this.buffer[ this.cy + 1 ] === undefined ) { this.buffer[ this.cy + 1 ] = [] ; }

	this.cx = this.buffer[ this.cy ].length ;

	this.buffer[ this.cy ] = this.buffer[ this.cy ].concat( this.buffer[ this.cy + 1 ] ) ;

	this.buffer.splice( this.cy + 1 , 1 ) ;

	// Patch tab if needed
	if ( ! internalCall ) {
		tabIndex = this.indexOfCharInLine( this.buffer[ this.cy ] , '\t' , this.cx ) ;
		if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	}
} ;



/*
	A TextBuffer can only draw to a ScreenBuffer.
	To display it, you need to:
		- draw the TextBuffer to a ScreenBuffer
		- then draw that ScreenBuffer to the terminal
*/
TextBuffer.prototype.draw = function draw( options ) {
	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	// Transmitted options (do not edit the user provided options, clone them)
	var tr = {
		dst: options.dst || this.dst ,
		offsetX: options.x !== undefined ? Math.floor( options.x ) : Math.floor( this.x ) ,
		offsetY: options.y !== undefined ? Math.floor( options.y ) : Math.floor( this.y ) ,
		dstClipRect: options.dstClipRect ? termkit.Rect.create( options.dstClipRect ) : undefined ,
		srcClipRect: options.srcClipRect ? termkit.Rect.create( options.srcClipRect ) : undefined ,
		blending: options.blending ,
		wrap: options.wrap ,
		tile: options.tile
	} ;

	if ( tr.dst instanceof termkit.ScreenBuffer ) {
		this.blitter( tr ) ;

		if ( options.cursor ) {
			tr.dst.cx = this.cx + tr.offsetX ;
			tr.dst.cy = this.cy + tr.offsetY ;
		}
	}
} ;



TextBuffer.prototype.drawCursor = function drawCursor( options ) {
	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	var dst = options.dst || this.dst ;

	if ( dst instanceof termkit.ScreenBuffer ) {
		dst.cx = Math.min( this.cx + this.x , dst.width - 1 ) ;
		dst.cy = Math.min( this.cy + this.y , dst.height - 1 ) ;
	}
} ;



TextBuffer.prototype.blitter = function blitter( p ) {
	var tr , iterator , iteratorCallback ;

	// Default options & iterator
	tr = {
		type: 'line' ,
		context: {
			srcBuffer: this.buffer ,
			dstBuffer: p.dst.buffer ,
			emptyCellAttr: this.emptyCellAttr ,
			writeAttr:
				this.ScreenBuffer === termkit.ScreenBuffer ?
					function( dst , attr , offset ) { dst.writeInt32BE( attr , offset ) ; } :
					function( dst , attr , offset ) { attr.copy( dst , offset ) ; }
		} ,
		dstRect: termkit.Rect.create( p.dst ) ,
		srcRect: termkit.Rect.create( this ) ,
		dstClipRect: p.dstClipRect || termkit.Rect.create( p.dst ) ,
		srcClipRect: p.srcClipRect || termkit.Rect.create( this ) ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY ,
		wrap: p.wrap ,
		tile: p.tile ,
		multiply: this.ScreenBuffer.prototype.ITEM_SIZE
	} ;

	iterator = 'regionIterator' ;

	if ( this.hidden ) {
		tr.context.char = this.hidden ;
		iteratorCallback = this.blitterHiddenLineIterator.bind( this ) ;
	}
	else {
		iteratorCallback = this.blitterLineIterator.bind( this ) ;
	}

	/*
	// If blending is on, switch to the cell iterator
	if ( p.blending )
	{
		tr.type = 'cell' ;
		iteratorCallback = blitterCellBlendingIterator ;
	}
	//*/

	if ( p.wrap ) { iterator = 'wrapIterator' ; }
	else if ( p.tile ) { iterator = 'tileIterator' ; }
	else { iterator = 'regionIterator' ; }

	termkit.Rect[ iterator ]( tr , iteratorCallback ) ;
} ;



TextBuffer.prototype.blitterLineIterator = function blitterLineIterator( p ) {
	var srcX , srcExistingXmax , dstOffset , cells , cell , attr , charCode ;

	//if ( ! global.deb ) { global.deb = [] ; }
	//global.deb.push( p ) ;

	cells = p.context.srcBuffer[ p.srcY ] || [] ;

	srcExistingXmax = p.srcXmax ;

	if ( srcExistingXmax >= cells.length ) { srcExistingXmax = cells.length - 1 ; }

	srcX = p.srcXmin ;
	dstOffset = p.dstStart ;

	// Write existing cells
	for ( ; srcX <= srcExistingXmax ; srcX ++ , dstOffset += this.ScreenBuffer.prototype.ITEM_SIZE ) {
		cell = cells[ srcX ] ;
		charCode = cell.char.charCodeAt( 0 ) ;

		// Write the attributes
		p.context.writeAttr( p.context.dstBuffer , cell.attr , dstOffset ) ;

		if ( charCode < 0x20 || charCode === 0x7f ) {
			// Replace the control char by a white space
			p.context.dstBuffer.write( ' ' , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
		}
		else {
			// Write the character
			p.context.dstBuffer.write( cell.char , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
		}
	}

	// Write blank
	// Temp?
	attr = p.context.emptyCellAttr ;
	for ( ; srcX <= p.srcXmax ; srcX ++ , dstOffset += this.ScreenBuffer.prototype.ITEM_SIZE ) {
		// Write the attributes
		p.context.writeAttr( p.context.dstBuffer , attr , dstOffset ) ;

		// Write the character
		p.context.dstBuffer.write( ' ' , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
	}
} ;



TextBuffer.prototype.blitterHiddenLineIterator = function blitterHiddenLineIterator( p ) {
	var srcX , srcExistingXmax , dstOffset , cells , cell , attr , hiddenChar ;

	//if ( ! global.deb ) { global.deb = [] ; }
	//global.deb.push( p ) ;

	hiddenChar = p.context.char ;
	cells = p.context.srcBuffer[ p.srcY ] || [] ;

	srcExistingXmax = p.srcXmax ;

	if ( srcExistingXmax >= cells.length ) { srcExistingXmax = cells.length - 1 ; }

	srcX = p.srcXmin ;
	dstOffset = p.dstStart ;

	// Write existing chars, turn them into the hidden char
	for ( ; srcX <= srcExistingXmax ; srcX ++ , dstOffset += this.ScreenBuffer.prototype.ITEM_SIZE ) {
		cell = cells[ srcX ] ;

		// Write the attributes
		p.context.writeAttr( p.context.dstBuffer , cell.attr , dstOffset ) ;

		// Write the character
		p.context.dstBuffer.write( hiddenChar , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
	}

	// Write blank
	// Temp?
	attr = p.context.emptyCellAttr ;
	for ( ; srcX <= p.srcXmax ; srcX ++ , dstOffset += this.ScreenBuffer.prototype.ITEM_SIZE ) {
		// Write the attributes
		p.context.writeAttr( p.context.dstBuffer , attr , dstOffset ) ;

		// Write the character
		p.context.dstBuffer.write( ' ' , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
	}
} ;



// Naive loading
TextBuffer.prototype.load = function load( path , callback ) {
	this.buffer[ 0 ] = [] ;
	this.buffer.length = 1 ;

	// Naive file loading, optimization are for later
	fs.readFile( path , ( error , data ) => {
		if ( error ) { callback( error ) ; return ; }
		this.setText( data.toString() ) ;
		callback() ;
	} ) ;
} ;



// Naive saving
TextBuffer.prototype.save = function save( path , callback ) {
	// Naive file saving, optimization are for later
	fs.writeFile( path , this.getText() , ( error ) => {
		if ( error ) { callback( error ) ; return ; }
		callback() ;
	} ) ;
} ;



