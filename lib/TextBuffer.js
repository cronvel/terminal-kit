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



const fs = require( 'fs' ) ;
const string = require( 'string-kit' ) ;



// A buffer suitable for text editor



function TextBuffer( options = {} ) {
	this.ScreenBuffer = options.ScreenBuffer || ( options.dst && options.dst.constructor ) || termkit.ScreenBuffer ;

	// a screenBuffer
	this.dst = options.dst ;

	// virtually infinity by default
	this.width = options.width || Infinity ;
	this.height = options.height || Infinity ;

	this.x = options.x !== undefined ? options.x : 0 ;
	this.y = options.y !== undefined ? options.y : 0 ;
	this.cx = 0 ;
	this.cy = 0 ;

	this.emptyCellAttr = this.ScreenBuffer.prototype.DEFAULT_ATTR ;
	this.hidden = false ;

	this.tabWidth = options.tabWidth || 4 ;
	this.forceInBound = !! options.forceInBound ;
	this.wrap = !! options.wrap ;
	this.lineWrapping = options.lineWrapping || false ;

	this.buffer = [ [] ] ;

	this.stateMachine = options.stateMachine || null ;

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



const termkit = require( './termkit.js' ) ;



TextBuffer.prototype.getText = function getText() {
	return this.buffer.map( line => string.unicode.fromCells( line ) ).join( '' ) ;
} ;



TextBuffer.prototype.setText = function setText( text ) {
	var lines = text.split( /(?<=\n)/g ) ;

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



TextBuffer.prototype.wrapLines = function wrapLines( width ) {
	var y , line , extra = [] ;

	for ( y = 0 ; y < this.buffer.length ; y ++ ) {
		line = this.buffer[ y ] ;

		if ( extra.length ) {
			line.splice( 0 , 0 , ... extra ) ;
			extra.length = 0 ;
		}

		if ( line.length < width && y + 1 < this.buffer.length && ( ! line.length || line[ line.length - 1 ].char !== '\n' ) ) {
			// This line is less than the width, yet it does not end with an \n and there is another line after:
			// merge it with the next line!
			line.push( ... this.buffer.splice( y + 1 , 1 )[ 0 ] ) ;
		}

		if ( line.length > width ) {
			extra = line.splice( width ) ;

			while ( extra.length > width ) {
				// Flush a new line
				line = extra ;
				extra = line.splice( width ) ;
				this.buffer.splice( ++ y , 0 , line ) ;
			}

			if ( extra.length && extra[ extra.length - 1 ].char === '\n' ) {
				// Since it ends with \n, it should not merge with the next line
				this.buffer.splice( ++ y , 0 , extra ) ;
				extra = [] ;	// re-assign it, because 'extra' is now the y+1 line
			}
		}
	}

	if ( extra.length ) {
		this.buffer.push( extra ) ;
	}
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
	var x , y , yMax , offset = 0 , length ;

	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }

	if ( ! this.buffer.length ) { return ; }

	for ( y = 0 , yMax = this.buffer.length ; y < yMax ; y ++ ) {
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
	var oldCx = this.cx ,
		currentLine = this.buffer[ this.cy ] ;

	//if ( justSkipFiller && ( ! currentLine || ! currentLine[ this.cx ] || ! currentLine[ this.cx ].filler || currentLine[ this.cx ].char !== '\n' ) ) { return ; }
	if ( justSkipFiller && ( ! currentLine || ! currentLine[ this.cx ] || ! currentLine[ this.cx ].filler ) ) { return ; }

	for ( ;; ) {
		if ( ! currentLine || this.cx + 1 > currentLine.length || ( this.cx < currentLine.length && currentLine[ this.cx ].char === '\n' ) ) {
			if ( this.cy + 1 < this.buffer.length || ! this.forceInBound ) {
				this.cy ++ ;
				this.cx = 0 ;
			}
			else {
				this.cx = oldCx ;
			}

			break ;
		}

		this.cx ++ ;

		if ( ! currentLine[ this.cx ] || ! currentLine[ this.cx ].filler ) { break ; }
	}

	if ( this.forceInBound ) { this.moveInBound() ; }
} ;



TextBuffer.prototype.moveBackward = function moveBackward( justSkipFiller ) {
	var lineLength ,
		currentLine = this.buffer[ this.cy ] ;

	//if ( justSkipFiller && ( ! currentLine || ! currentLine[ this.cx ] || ! currentLine[ this.cx ].filler || currentLine[ this.cx ].char !== '\n' ) ) { return ; }
	if ( justSkipFiller && ( ! currentLine || ! currentLine[ this.cx ] || ! currentLine[ this.cx ].filler ) ) { return ; }

	for ( ;; ) {
		lineLength = currentLine ? currentLine.length : 0 ;

		if ( this.cx > lineLength ) { this.cx = lineLength ; }
		else { this.cx -- ; }

		if ( this.cx < 0 ) {
			this.cy -- ;

			if ( this.cy < 0 ) { this.cy = 0 ; this.cx = 0 ; break ; }

			this.moveToEndOfLine() ;
			break ;
		}

		if ( ! currentLine || ! currentLine[ this.cx ] || ! currentLine[ this.cx ].filler || currentLine[ this.cx ].char !== '\n' ) { break ; }
	}

	if ( this.forceInBound ) { this.moveInBound() ; }
} ;



TextBuffer.prototype.moveToEndOfLine = function moveToEndOfLine() {
	var currentLine = this.buffer[ this.cy ] ;

	if ( ! currentLine ) {
		this.cx = 0 ;
	}
	else if ( currentLine.length && currentLine[ currentLine.length - 1 ].char === '\n' ) {
		this.cx = currentLine.length - 1 ;
	}
	else {
		this.cx = currentLine.length ;
	}
} ;



TextBuffer.prototype.moveInBound = function moveInBound( ignoreCx ) {
	var currentLine = this.buffer[ this.cy ] ;

	if ( this.cy > this.buffer.length ) { this.cy = this.buffer.length ; }

	if ( ignoreCx ) { return ; }

	if ( ! currentLine ) {
		this.cx = 0 ;
	}
	else if ( currentLine.length && currentLine[ currentLine.length - 1 ].char === '\n' ) {
		if ( this.cx > currentLine.length - 1 ) { this.cx = currentLine.length - 1 ; }
	}
	else if ( this.cx > currentLine.length ) {
		this.cx = currentLine.length ;
	}
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
	var currentLine , currentLineLength , hasNL , nlCell , tabIndex , fillSize ;

	this.moveForward( true ) ;	// just skip filler char

	// Should come after moving forward (rely on this.cx)
	var cells = string.unicode.toCells( Cell , text , this.tabWidth , this.cx , attr ) ;

	// Is this a new line?
	if ( this.cy >= this.buffer.length ) {
		// Create all missing lines, if any
		while ( this.buffer.length < this.cy ) {
			this.buffer.push( [ new Cell( '\n' , this.emptyCellAttr ) ] ) ;
		}

		// Add a '\n' to the last line, if it is missing
		if (
			this.cy && (
				! this.buffer[ this.cy - 1 ].length ||
				this.buffer[ this.cy - 1 ][ this.buffer[ this.cy - 1 ].length - 1 ].char !== '\n'
			)
		) {
			this.buffer[ this.cy - 1 ].push( new Cell( '\n' , this.emptyCellAttr ) ) ;
		}

		this.buffer[ this.cy ] = [] ;
	}

	currentLine = this.buffer[ this.cy ] ;
	currentLineLength = currentLine.length ;
	hasNL = currentLineLength && currentLine[ currentLineLength - 1 ].char === '\n' ;

	// Apply
	if ( this.cx === currentLineLength ) {
		if ( hasNL ) {
			currentLine.splice( currentLineLength - 1 , 0 , new Cell( ' ' , this.emptyCellAttr ) , ... cells ) ;
		}
		else {
			currentLine.push( ... cells ) ;
		}
	}
	else if ( this.cx < currentLineLength ) {
		currentLine.splice( this.cx , 0 , ... cells ) ;
	}
	// this.cx > currentLineLength
	else if ( hasNL ) {
		fillSize = this.cx - currentLineLength + 1 ;
		nlCell = currentLine.pop() ;
		while ( fillSize -- ) { currentLine.push( new Cell( ' ' , this.emptyCellAttr ) ) ; }
		currentLine.push( ... cells , nlCell ) ;
	}
	else {
		fillSize = this.cx - currentLineLength ;
		while ( fillSize -- ) { currentLine.push( new Cell( ' ' , this.emptyCellAttr ) ) ; }
		currentLine.push( ... cells ) ;
	}

	// Patch tab if needed
	tabIndex = this.indexOfCharInLine( currentLine , '\t' , this.cx ) ;
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
	var currentLine , inlineCount ;

	if ( count === undefined ) { count = 1 ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] && this.buffer[ this.cy ][ this.cx ] && this.buffer[ this.cy ][ this.cx ].filler ) {
		this.moveBackward( true ) ;	// just skip filler char
		count -- ;
	}


	while ( count > 0 ) {
		currentLine = this.buffer[ this.cy ] ;

		// If we are already at the end of the buffer...
		if ( this.cy >= this.buffer.length ||
			( this.cy === this.buffer.length - 1 && this.cx >= currentLine.length ) ) {
			return ;
		}

		if ( currentLine ) {
			// If the cursor is too far away, move it at the end of the line
			if ( this.cx > currentLine.length ) { this.cx = currentLine.length ; }

			if ( currentLine[ this.cx ] && currentLine[ this.cx ].char !== '\n' ) {
				// Compute inline delete
				//inlineCount = Math.min( count , currentLine.length - this.cx ) ;
				inlineCount = this.countInlineForward( count ) ;

				// Apply inline delete
				if ( inlineCount > 0 ) {
					currentLine.splice( this.cx , inlineCount ) ;
				}

				count -= inlineCount ;
			}
		}

		if ( count > 0 ) {
			this.joinLine( true ) ;
			count -- ;
		}
	}

	// Patch tab if needed
	//tabIndex = currentLine.indexOf( '\t' , this.cx ) ;
	//if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	this.reTabLine() ;	// Do it every time, before finding a better way to do it
} ;



// /!\ Bug with tabs and count > 1 !!! /!\

// Delete backward chars
TextBuffer.prototype.backDelete = function backDelete( count ) {
	var currentLine , inlineCount , tabIndex ;

	if ( count === undefined ) { count = 1 ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] && this.cx && this.buffer[ this.cy ][ this.cx - 1 ] && this.buffer[ this.cy ][ this.cx - 1 ].filler ) {
		this.moveBackward( true ) ;	// just skip filler char
		//count -- ;	// do not downcount: the cursor is always on a \x00 before deleting a \t
	}


	while ( count > 0 ) {
		currentLine = this.buffer[ this.cy ] ;

		// If we are already at the begining of the buffer...
		if ( this.cy === 0 && this.cx === 0 ) { return ; }

		if ( currentLine ) {

			// If the cursor is to far away, move it at the end of the line, it will cost one 'count'
			if ( this.cx > currentLine.length ) {
				if ( currentLine.length && currentLine[ currentLine.length - 1 ].char === '\n' ) { this.cx = currentLine.length - 1 ; }
				else { this.cx = currentLine.length ; }

				count -- ;
			}
			else if ( this.cx && this.cx === currentLine.length && currentLine[ currentLine.length - 1 ].char === '\n' ) {
				this.cx = currentLine.length - 1 ;
			}

			// Compute inline delete
			inlineCount = this.countInlineBackward( count ) ;

			// Apply inline delete
			if ( inlineCount > 0 ) {
				currentLine.splice( this.cx - inlineCount , inlineCount ) ;
				this.cx -= inlineCount ;
			}

			count -= inlineCount ;
		}

		if ( count > 0 ) {
			this.cy -- ;
			this.cx = currentLine ? currentLine.length : 0 ;
			this.joinLine( true ) ;
			count -- ;
		}
	}

	// Patch tab if needed
	//tabIndex = currentLine.indexOf( '\t' , this.cx ) ;
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
	var currentLine , currentLineLength , nextLine = [] , tabIndex ;

	if ( ! internalCall && this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] === undefined ) { this.buffer[ this.cy ] = [] ; }

	currentLine = this.buffer[ this.cy ] ;
	currentLineLength = currentLine.length ;

	// Apply
	if ( this.cx < currentLineLength ) {
		nextLine = currentLine.slice( this.cx ) ;
		currentLine.length = this.cx ;
	}

	currentLine.push( new Cell( '\n' , this.emptyCellAttr ) ) ;

	this.buffer.splice( this.cy + 1 , 0 , nextLine ) ;

	this.cx = 0 ;
	this.cy ++ ;

	// Patch tab if needed
	if ( ! internalCall ) {
		tabIndex = this.indexOfCharInLine( currentLine , '\t' , this.cx ) ;
		if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	}
} ;



TextBuffer.prototype.joinLine = function joinLine( internalCall ) {
	var tabIndex , currentLine ;

	if ( ! internalCall && this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] === undefined ) { this.buffer[ this.cy ] = [] ; }
	if ( this.buffer[ this.cy + 1 ] === undefined ) { this.buffer[ this.cy + 1 ] = [] ; }

	currentLine = this.buffer[ this.cy ] ;

	if ( currentLine.length && currentLine[ currentLine.length - 1 ].char === '\n' ) {
		// Remove the last '\n' if any
		currentLine.length -- ;
	}

	this.cx = currentLine.length ;

	currentLine.splice( currentLine.length , 0 , ... this.buffer[ this.cy + 1 ] ) ;

	this.buffer.splice( this.cy + 1 , 1 ) ;

	// Patch tab if needed
	if ( ! internalCall ) {
		tabIndex = this.indexOfCharInLine( currentLine , '\t' , this.cx ) ;
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

	if ( tr.dst instanceof this.ScreenBuffer ) {
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

	if ( dst instanceof this.ScreenBuffer ) {
		dst.cx = Math.min( Math.min( this.cx , this.width - 1 ) + this.x , dst.width - 1 ) ;
		dst.cy = Math.min( Math.min( this.cy , this.height - 1 ) + this.y , dst.height - 1 ) ;
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
					( dst , attr , offset ) => { dst.writeInt32BE( attr , offset ) ; } :
					( dst , attr , offset ) => { attr.copy( dst , offset ) ; }
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





/* API for the text-machine module */



TextBuffer.prototype.runStateMachine = function runStateMachine() {
	if ( ! this.stateMachine ) { return ; }

	this.stateMachine.reset() ;

	this.iterate( { finalCall: true } , data => {
		data.textBuffer = this ;
		this.stateMachine.pushEvent( data.text , data ) ;
	} ) ;
} ;



const TextMachineApi = {} ;
TextBuffer.TextMachineApi = TextMachineApi ;



TextMachineApi.style = ( context , style ) => {
	if ( context.x === null ) { return ; }	// This is a newline or end of buffer character, there is no style to apply here
	if ( ! style.code ) { style.code = context.textBuffer.ScreenBuffer.object2attr( style ) ; }	// cache it now

	context.textBuffer.setAttrCodeAt( style.code , context.x , context.y ) ;
} ;



TextMachineApi.startingStyle = ( context , style ) => {
	if ( ! context.startingContext || context.startingContext.x === null ) { return ; }
	if ( ! style.code ) { style.code = context.textBuffer.ScreenBuffer.object2attr( style ) ; }	// cache it now

	context.textBuffer.setAttrCodeAt( style.code , context.startingContext.x , context.startingContext.y ) ;
} ;

TextMachineApi.openingStyle = TextMachineApi.startingStyle ;



TextMachineApi.blockStyle = function apiBlockStyle( context , style ) {
	if ( context.x === null || ! context.startingContext || context.startingContext.x === null ) { return ; }
	if ( ! style.code ) { style.code = context.textBuffer.ScreenBuffer.object2attr( style ) ; }	// cache it now

	context.textBuffer.setAttrCodeRegion( style.code , {
		xmin: context.startingContext.x ,
		xmax: context.x ,
		ymin: context.startingContext.y ,
		ymax: context.y
	} ) ;
} ;



TextMachineApi.hint = function apiHint( context , hints ) {
	var misc ;

	if ( hints[ context.buffer ] ) {
		misc = context.textBuffer.getMiscAt( context.x , context.y ) ;
		if ( misc ) { misc.hint = hints[ context.buffer ] ; }
	}
} ;

