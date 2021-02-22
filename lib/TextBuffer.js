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



const fs = require( 'fs' ) ;
const string = require( 'string-kit' ) ;



// A buffer suitable for text editor



function TextBuffer( options = {} ) {
	this.ScreenBuffer = options.ScreenBuffer || ( options.dst && options.dst.constructor ) || termkit.ScreenBuffer ;

	// a screenBuffer
	this.dst = options.dst ;
	this.palette = options.palette || ( this.dst && this.dst.palette ) ;

	// virtually infinity by default
	this.width = options.width || Infinity ;	// not used except by the blitter
	this.height = options.height || Infinity ;	// not used except by the blitter
	this.dstClipRect = options.dstClipRect ? new termkit.Rect( options.dstClipRect ) : null ;

	this.x = options.x || 0 ;
	this.y = options.y || 0 ;

	this.firstLineRightShift = options.firstLineRightShift || 0 ;

	this.cx = 0 ;
	this.cy = 0 ;
	this.ch = false ;	// cursor hidden

	this.voidTextBuffer = null ;	// Another TextBuffer used as fallback for empty cells, usefull for placeholder/hint/etc

	this.defaultAttr = this.ScreenBuffer.prototype.DEFAULT_ATTR ;
	this.voidAttr = this.ScreenBuffer.prototype.DEFAULT_ATTR ;
	this.preserveMarkupFormat = this.ScreenBuffer.prototype.preserveMarkupFormat ;
	this.markupToAttrObject = this.ScreenBuffer.prototype.markupToAttrObject ;

	this.hidden = false ;

	this.tabWidth = options.tabWidth || 4 ;
	this.forceInBound = !! options.forceInBound ;

	// If set to a number, force line-splitting when exceeding that width
	this.lineWrapWidth = options.lineWrapWidth || null ;

	// If true, force word-aware line-splitting
	this.wordWrap = !! options.wordWrap ;

	// DEPRECATED but kept for backward compatibility.
	if ( options.wordWrapWidth ) {
		this.lineWrapWidth = options.wordWrapWidth ;
		this.wordWrap = true ;
	}

	this.selectionRegion = null ;

	this.buffer = [ [] ] ;

	this.stateMachine = options.stateMachine || null ;

	if ( options.hidden ) { this.setHidden( options.hidden ) ; }
}

module.exports = TextBuffer ;



// Backward compatibility
TextBuffer.create = ( ... args ) => new TextBuffer( ... args ) ;



function Cell( char = ' ' , attr = null , misc = null ) {
	this.char = char || ' ' ;
	this.filler = char === null ;
	this.attr = attr ;
	this.misc = misc ;
}

TextBuffer.Cell = Cell ;



const termkit = require( './termkit.js' ) ;



TextBuffer.prototype.getText = function() {
	return this.buffer.map( line => string.unicode.fromCells( line ) ).join( '' ) ;
} ;



// TODOC
// Get the text, but separate before the cursor and after the cursor
TextBuffer.prototype.getCursorSplittedText = function() {
	var y , line , before = '' , after = '' ;

	for ( y = 0 ; y < this.buffer.length ; y ++ ) {
		line = this.buffer[ y ] ;
		if ( y < this.cy ) {
			before += string.unicode.fromCells( line ) ;
		}
		else if ( y > this.cy ) {
			after += string.unicode.fromCells( line ) ;
		}
		else {
			before += string.unicode.fromCells( line.slice( 0 , this.cx ) ) ;
			after += string.unicode.fromCells( line.slice( this.cx ) ) ;
		}
	}

	return [ before , after ] ;
} ;



// .setText( text , [[hasMarkup] , baseAttr ] )
TextBuffer.prototype.setText = function( text , hasMarkup , baseAttr ) {
	// Argument management
	if ( typeof hasMarkup !== 'boolean' && typeof hasMarkup !== 'string' ) {
		baseAttr = hasMarkup ;
		hasMarkup = false ;
	}

	var legacyColor = false , parser = null ;

	switch ( hasMarkup ) {
		case 'ansi' : parser = termkit.parseAnsi ; break ;
		case 'legacyAnsi' : parser = termkit.parseAnsi ; legacyColor = true ; break ;
		case true : parser = termkit.parseMarkup ; break ;
	}

	if ( baseAttr === undefined ) { baseAttr = this.defaultAttr ; }
	if ( typeof baseAttr === 'object' ) { baseAttr = this.object2attr( baseAttr ) ; }

	// It must be reset now, because word-wrapping will be faster (always splice at the end of the array)
	this.buffer.length = 0 ;

	text.split( /(?<=\n)/g ).forEach( line => {
		var index = this.buffer.length ;
		this.buffer[ index ] = this.lineToCells( line , parser , baseAttr , 0 , legacyColor ) ;

		// /!\ Warning /!\ string.unicode.toCells() strips '\n', so we need to restore it at the end of the line
		if ( line[ line.length - 1 ] === '\n' ) {
			this.buffer[ index ].push( new Cell( '\n' , baseAttr ) ) ;
		}

		// word-wrap the current line, which is always the last line of the array (=faster)
		if ( this.lineWrapWidth ) { this.wrapLine( index ) ; }
	} ) ;
} ;



// Internal, transform a line of text, with or without markup to cells...
TextBuffer.prototype.lineToCells = function( line , parser , baseAttr , offset = 0 , legacyColor = false ) {
	var attr = baseAttr ,
		attrObject , cells ;

	if ( ! parser ) {
		return string.unicode.toCells( Cell , line , this.tabWidth , offset , attr ) ;
	}

	// Reset attr at each end of line
	attr = baseAttr ;
	attrObject = this.ScreenBuffer.attr2object( attr ) ;
	cells = [] ;

	parser( line , termkit.markupOptions ).forEach( part => {
		if ( typeof part === 'string' ) {
			cells.push( ... string.unicode.toCells( Cell , part , this.tabWidth , offset + cells.length , attr ) ) ;
			return ;
		}

		if ( part.markup.reset ) {
			attr = part.markup.special ? this.ScreenBuffer.DEFAULT_ATTR : baseAttr ;
			attrObject = this.ScreenBuffer.attr2object( attr ) ;
		}
		else {
			Object.assign( attrObject , part.markup ) ;

			// Remove incompatible flags
			if ( attrObject.defaultColor && attrObject.color !== undefined ) { delete attrObject.defaultColor ; }
			if ( attrObject.bgDefaultColor && attrObject.bgColor !== undefined ) { delete attrObject.bgDefaultColor ; }

			attr = this.object2attr( attrObject , undefined , legacyColor ) ;
		}

		if ( part.markup.raw ) {
			cells.push( ... string.unicode.toCells( Cell , part.markup.raw , this.tabWidth , offset + cells.length , attr ) ) ;
		}
	} ) ;

	return cells ;
} ;



TextBuffer.prototype.setHidden = function( value ) {
	this.hidden =
		typeof value === 'string' && value.length ? value[ 0 ] :
		value ? termkit.spChars.password :
		false ;
} ;

TextBuffer.prototype.getHidden = function() { return this.hidden ; } ;



TextBuffer.prototype.setVoidTextBuffer = function( textBuffer = null ) {
	this.voidTextBuffer = textBuffer ;
} ;

TextBuffer.prototype.getVoidTextBuffer = function() { return this.voidTextBuffer ; } ;



TextBuffer.prototype.getContentSize = function() {
	return {
		width: Math.max( 1 , ... this.buffer.map( line => line.length ) ) ,
		height: this.buffer.length
	} ;
} ;



// Cursor offset in the text-content (excluding fillers)
TextBuffer.prototype.getCursorOffset = function() {
	var x , y , line , offset = 0 ;

	for ( y = 0 ; y < this.cy ; y ++ ) {
		line = this.buffer[ y ] ;
		if ( ! line ) { continue ; }
		for ( x = 0 ; x < line.length ; x ++ ) {
			if ( ! line[ x ].filler ) { offset ++ ; }
		}
	}

	line = this.buffer[ this.cy ] ;
	if ( line ) {
		for ( x = 0 ; x < this.cx && x < line.length ; x ++ ) {
			if ( ! line[ x ].filler ) { offset ++ ; }
		}
	}

	return offset ;
} ;



// Set the cursor position (cx,cy) depending on the offset in the text-content (excludind fillers)
TextBuffer.prototype.setCursorOffset = function( offset ) {
	var line ;

	//console.error( "Entering" , offset ) ;
	this.cy = this.cx = 0 ;

	if ( offset <= 0 ) { return ; }

	while ( this.cy < this.buffer.length ) {
		this.cx = 0 ;
		line = this.buffer[ this.cy ] ;
		//console.error( "  iter cy" , offset , this.cy , this.cx , "---" , line.length ) ;
		if ( ! line ) { continue ; }

		while ( this.cx < line.length ) {
			//console.error( "    iter cx" , offset , this.cy , this.cx ) ;
			if ( line[ this.cx ].filler ) {
				this.cx ++ ;
			}
			else {
				offset -- ;
				this.cx ++ ;
				if ( offset <= 0 ) {
					if ( this.cx === line.length && line[ line.length - 1 ].char === '\n' ) {
						//console.error( "    Exit with \\n" ) ;
						this.cx = 0 ;
						this.cy ++ ;
					}
					//console.error( "Exit" , this.cy , this.cx ) ;
					return ;
				}
			}
		}

		this.cy ++ ;
	}

	//console.error( "End of input" , offset , this.cy , this.cx ) ;
} ;



// Recompute tabs
TextBuffer.prototype.reTabLine = function( startAt = 0 ) {
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



// Forbidden split for word-wrap, only if there is only one space before
const FORBIDDEN_SPLIT = new Set( [
	// French typo double graph punctuation,
	'!' , '?' , ':' , ';' , '«' , '»' ,
	// Other common punctuation that are often misused, should not be splitted anyway
	',' , '.' , '…'
] ) ;



// Wrap/word-wrap the current line, stop on the next explicit '\n' or at the end of the buffer.
// Return the next line to scan.
// /!\ Should probably .reTabLine()
TextBuffer.prototype.wrapLine = function( startY = this.cy , width = this.lineWrapWidth , wordWrap = this.wordWrap ) {
	var x , y , rightShift , endY , line , lineWidth , previousLine , lastChar , found , cursorInlineOffset ,
		checkCursor = this.cy === startY ;

	if ( startY >= this.buffer.length ) { return startY ; }

	// First check early exit conditions
	line = this.buffer[ startY ] ;
	previousLine = this.buffer[ startY - 1 ] ;
	rightShift = startY ? 0 : this.firstLineRightShift ;
	lineWidth = width - rightShift ;
	//console.error( "startY:" , startY ) ;
	if ( ! width || (
		line.length && line.length <= lineWidth && line[ line.length - 1 ].char === '\n'
		&& ( ! previousLine || ! previousLine.length || previousLine[ previousLine.length - 1 ].char === '\n' )
	) ) {
		//console.error( "exit" , previousLine);
		// There is nothing to do: we only have one line and it is not even longer than the lineWidth
		return startY + 1 ;
	}

	// Avoid creating arrays if early exit triggers
	var unifiedLine = [] , replacementLines = [] ;

	// First, search BACKWARD for the previous \n or start of buffer, to adjust startY value
	for ( y = startY - 1 ; y >= 0 ; y -- ) {
		line = this.buffer[ y ] ;

		if ( line.length && line[ line.length - 1 ].char === '\n' ) {
			startY = y + 1 ;
			break ;
		}
		else if ( ! y ) {
			startY = 0 ;
			break ;
		}
	}
	//console.error( "startY aft:" , startY ) ;

	// Then, search for the next \n and concat everything in a single line
	for ( y = startY ; y < this.buffer.length ; y ++ ) {
		//console.error( "  iter" , y , this.buffer.length) ;
		line = this.buffer[ y ] ;
		unifiedLine.push( ... line ) ;

		if ( line.length && line[ line.length - 1 ].char === '\n' ) {
			//console.error( "has \\n" ) ;
			// If we found the next \n, we don't go any further, but we still increment y because of endY
			y ++ ;
			break ;
		}
	}

	// Save the last line index
	endY = y ;
	rightShift = startY ? 0 : this.firstLineRightShift ;
	//console.error( "endY:" , endY ) ;

	if ( checkCursor ) {
		// Compute the cursor "inline" position
		cursorInlineOffset = 0 ;
		for ( y = startY ; y < this.cy ; y ++ ) {
			// +1 because the cursor is allowed to be ahead by one cell
			cursorInlineOffset += this.buffer[ y ].length ;
		}
		cursorInlineOffset += this.cx ;
	}

	while ( unifiedLine.length ) {
		lineWidth = width - rightShift ;
		rightShift = 0 ;	// Next time rightShift will be 0

		if ( unifiedLine.length <= lineWidth ) {
			// No more than the allowed lineWidth: add it and finish
			replacementLines.push( unifiedLine ) ;

			// If the length is EXACTLY the line-width and it's the last lines, create a new empty line
			if ( unifiedLine.length === lineWidth ) {
				replacementLines.push( [] ) ;
			}
			break ;
		}

		if ( ! wordWrap ) {
			replacementLines.push( unifiedLine.splice( 0 , lineWidth ) ) ;
			continue ;
		}

		found = false ;
		x = lineWidth ;

		if ( unifiedLine[ x ].char === ' ' ) {
			// Search forward for the first non-space
			while ( x < unifiedLine.length && unifiedLine[ x ].char === ' ' ) { x ++ ; }

			if ( x >= unifiedLine.length ) {
				// No non-space found: feed every remaining cells
				replacementLines.push( unifiedLine ) ;
				break ;
			}

			if ( x === lineWidth + 1 && FORBIDDEN_SPLIT.has( unifiedLine[ x ].char ) && unifiedLine[ lineWidth - 1 ].char !== ' ' ) {
				// Dang! We can't split here! We will search backward starting from lineWidth - 1
				x = lineWidth - 1 ;
			}
			else {
				// Else, cut at that non-space
				found = true ;
			}
		}

		if ( ! found ) {
			// Search backward for the first space
			lastChar = null ;

			while ( x >= 0 && ( unifiedLine[ x ].char !== ' ' || ( FORBIDDEN_SPLIT.has( lastChar ) && x > 0 && unifiedLine[ x - 1 ].char !== ' ' ) ) ) {
				lastChar = unifiedLine[ x ].char ;
				x -- ;
			}

			if ( x < 0 ) { x = lineWidth ; }	// No space found, cut at the lineWidth
			else { x ++ ; } // Cut just after the space
		}

		replacementLines.push( unifiedLine.splice( 0 , x ) ) ;
	}

	this.buffer.splice( startY , endY - startY , ... replacementLines ) ;


	// New endY to be returned, and used for cursor computing
	endY = startY + replacementLines.length ;

	if ( checkCursor ) {
		//console.error( "cursorInlineOffset:" , cursorInlineOffset , "endY:" , endY ) ;
		for ( y = startY ; ; y ++ ) {
			//console.error( "  iter" , y , "-- cursorInlineOffset:" , cursorInlineOffset , "this.buffer[ y ].length:" , this.buffer[ y ] && this.buffer[ y ].length ) ;
			if ( y >= endY ) {
				//console.error( "  exit #1" ) ;
				if ( y > 0 ) { y -- ; }
				this.cy = y ;
				this.cx = this.buffer[ y ] ? this.buffer[ y ].length : 0 ;
				break ;
			}

			if ( ! this.buffer[ y ] ) {
				//console.error( "  exit #2" ) ;
				this.cy = y ;
				this.cx = 0 ;
				break ;
			}

			if ( cursorInlineOffset < this.buffer[ y ].length ) {
				//console.error( "  exit #3" ) ;
				this.cy = y ;
				this.cx = cursorInlineOffset ;
				break ;
			}

			cursorInlineOffset -= this.buffer[ y ].length ;
		}

		//*
		// If we are after a true line breaker, go to the next line
		if ( this.cx && this.buffer[ this.cy ] && this.buffer[ this.cy ][ this.cx - 1 ] && this.buffer[ this.cy ][ this.cx - 1 ].char === '\n' ) {
			this.cy ++ ;
			this.cx = 0 ;
			if ( ! this.buffer[ this.cy ] ) { this.buffer[ this.cy ] = [] ; }
		}
		//*/
	}

	return endY ;
} ;



TextBuffer.prototype.wrapAllLines = function( width = this.lineWrapWidth , wordWrap = this.wordWrap ) {
	var y = 0 ;

	while ( y < this.buffer.length ) {
		y = this.wrapLine( y , width , wordWrap ) ;
	}
} ;



// Probably DEPRECATED
TextBuffer.prototype.wordWrapLine = function( startY = this.cy , width = this.lineWrapWidth ) {
	return this.wrapLine( startY , width , true ) ;
} ;



// Probably DEPRECATED
TextBuffer.prototype.wordWrapAllLines = function( width = this.lineWrapWidth ) {
	var y = 0 ;

	while ( y < this.buffer.length ) {
		y = this.wrapLine( y , width , true ) ;
	}
} ;



TextBuffer.prototype.setDefaultAttr = function( attr ) {
	if ( attr && typeof attr === 'object' ) { attr = this.object2attr( attr ) ; }
	else if ( typeof attr !== 'number' ) { return ; }

	this.defaultAttr = attr ;
} ;



TextBuffer.prototype.setEmptyCellAttr =		// DEPRECATED
TextBuffer.prototype.setVoidAttr = function( attr ) {
	if ( attr === null ) { this.voidAttr = null ; }		// null: don't draw
	else if ( attr && typeof attr === 'object' ) { attr = this.object2attr( attr ) ; }
	else if ( typeof attr !== 'number' ) { return ; }

	this.voidAttr = attr ;
} ;



TextBuffer.prototype.setAttrAt = function( attr , x , y ) {
	if ( attr && typeof attr === 'object' ) { attr = this.object2attr( attr ) ; }
	else if ( typeof attr !== 'number' ) { return ; }

	this.setAttrCodeAt( attr , x , y ) ;
} ;



// Faster than setAttrAt(), do no check attr, assume an attr code (number)
TextBuffer.prototype.setAttrCodeAt = function( attr , x , y ) {
	if ( ! this.buffer[ y ] ) { this.buffer[ y ] = [] ; }

	if ( ! this.buffer[ y ][ x ] ) { this.buffer[ y ][ x ] = new Cell( ' ' , attr ) ; }
	else { this.buffer[ y ][ x ].attr = attr ; }
} ;



const WHOLE_BUFFER_REGION = {
	xmin: 0 , xmax: Infinity , ymin: 0 , ymax: Infinity
} ;

// Set a whole region
TextBuffer.prototype.setAttrRegion = function( attr , region ) {
	if ( attr && typeof attr === 'object' ) { attr = this.object2attr( attr ) ; }
	else if ( typeof attr !== 'number' ) { return ; }

	this.setAttrCodeRegion( attr , region ) ;
} ;



// Faster than setAttrRegion(), do no check attr, assume an attr code (number)
TextBuffer.prototype.setAttrCodeRegion = function( attr , region = WHOLE_BUFFER_REGION ) {
	var x , y , xmin , xmax , ymax ;

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



TextBuffer.prototype.setSelectionRegion = function( region ) {
	if ( this.selectionRegion ) {
		// Start by unhilighting existing selection
		this.hilightSelection( false ) ;
	}
	else {
		this.selectionRegion = {} ;
	}

	if ( region.xmin !== undefined && region.ymin !== undefined ) {
		this.selectionRegion.xmin = region.xmin ;
		this.selectionRegion.ymin = region.ymin ;
	}

	if ( region.xmax !== undefined && region.ymax !== undefined ) {
		this.selectionRegion.xmax = region.xmax ;
		this.selectionRegion.ymax = region.ymax ;
	}

	this.hilightSelection() ;
} ;



TextBuffer.prototype.resetSelectionRegion = function() {
	if ( ! this.selectionRegion ) { return ; }

	// Start by unhilighting existing selection
	this.hilightSelection( false ) ;
	this.selectionRegion = null ;
} ;



// Internal
TextBuffer.prototype.hilightSelection = function( turnOn = true ) {
	var x , y , xmin , xmax , ymax ,
		region = this.selectionRegion ;

	if ( ! region || region.xmin === undefined || region.ymin === undefined || region.xmax === undefined || region.ymax === undefined ) {
		return ;
	}

	ymax = Math.min( region.ymax , this.buffer.length - 1 ) ;

	for ( y = region.ymin ; y <= ymax ; y ++ ) {
		if ( ! this.buffer[ y ] ) { this.buffer[ y ] = [] ; }

		xmin = y === region.ymin ? region.xmin : 0 ;
		xmax = y === region.ymax ? Math.min( region.xmax , this.buffer[ y ].length - 1 ) : this.buffer[ y ].length - 1 ;

		for ( x = xmin ; x <= xmax ; x ++ ) {
			this.buffer[ y ][ x ].attr = turnOn ?
				this.ScreenBuffer.attrSelect( this.buffer[ y ][ x ].attr ) :
				this.ScreenBuffer.attrUnselect( this.buffer[ y ][ x ].attr ) ;
		}
	}
} ;



TextBuffer.prototype.getSelectionText = function() {
	var x , y , xmin , xmax , ymax , cell ,
		str = '' ,
		region = this.selectionRegion ;

	if ( ! region || region.xmin === undefined || region.ymin === undefined || region.xmax === undefined || region.ymax === undefined ) {
		return str ;
	}

	ymax = Math.min( region.ymax , this.buffer.length - 1 ) ;

	for ( y = region.ymin ; y <= ymax ; y ++ ) {
		if ( ! this.buffer[ y ] ) { this.buffer[ y ] = [] ; }

		xmin = y === region.ymin ? region.xmin : 0 ;
		xmax = y === region.ymax ? Math.min( region.xmax , this.buffer[ y ].length - 1 ) : this.buffer[ y ].length - 1 ;

		for ( x = xmin ; x <= xmax ; x ++ ) {
			cell = this.buffer[ y ][ x ] ;
			str += cell.filler ? '' : cell.char ;
		}
	}

	return str ;
} ;



// Misc data are lazily created
TextBuffer.prototype.getMisc = function() {
	if ( ! this.buffer[ this.cy ] || ! this.buffer[ this.cy ][ this.cx ] ) { return ; }
	if ( ! this.buffer[ this.cy ][ this.cx ].misc ) { this.buffer[ this.cy ][ this.cx ].misc = {} ; }
	return this.buffer[ this.cy ][ this.cx ].misc ;
} ;



TextBuffer.prototype.getMiscAt = function( x , y ) {
	if ( ! this.buffer[ y ] || ! this.buffer[ y ][ x ] ) { return ; }
	if ( ! this.buffer[ y ][ x ].misc ) { this.buffer[ y ][ x ].misc = {} ; }
	return this.buffer[ y ][ x ].misc ;
} ;



TextBuffer.prototype.iterate = function( options , callback ) {
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



TextBuffer.prototype.moveTo = function( x , y ) {
	this.cx = x >= 0 ? x : 0 ;
	this.cy = y >= 0 ? y : 0 ;
} ;



TextBuffer.prototype.move = function( x , y ) { this.moveTo( this.cx + x , this.cy + y ) ; } ;
TextBuffer.prototype.moveToColumn = function( x ) { this.moveTo( x , this.cy ) ; } ;
TextBuffer.prototype.moveToLine = TextBuffer.prototype.moveToRow = function( y ) { this.moveTo( this.cx , y ) ; } ;



TextBuffer.prototype.moveUp = function() {
	this.cy = this.cy > 0 ? this.cy - 1 : 0 ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
} ;



TextBuffer.prototype.moveDown = function() {
	this.cy ++ ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
} ;



TextBuffer.prototype.moveLeft = function() {
	this.cx = this.cx > 0 ? this.cx - 1 : 0 ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
} ;



TextBuffer.prototype.moveRight = function() {
	this.cx ++ ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
} ;



TextBuffer.prototype.moveForward = function( testFn , justSkipFiller ) {
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

		if ( ! currentLine[ this.cx ] || ( ! currentLine[ this.cx ].filler && ( ! testFn || testFn( currentLine[ this.cx ].char ) ) ) ) { break ; }
	}

	if ( this.forceInBound ) { this.moveInBound() ; }
} ;



TextBuffer.prototype.moveBackward = function( testFn , justSkipFiller ) {
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

		if (
			! currentLine || ! currentLine[ this.cx ]
			|| (
				( ! currentLine[ this.cx ].filler || currentLine[ this.cx ].char !== '\n' )
				&& ( ! testFn || testFn( currentLine[ this.cx ].char ) )
			)
		) {
			break ;
		}
	}

	if ( this.forceInBound ) { this.moveInBound() ; }
} ;



// Rough word boundary test
const WORD_BOUNDARY = new Set( [ ' ' , '\t' , '.' , ',' , ';' , ':' , '!' , '?' , '/' , '\\' , '(' , ')' , '[' , ']' , '{' , '}' , '<' , '>' , '=' , "'" , '"' ] ) ;

TextBuffer.prototype.wordBoundary_ = function( method , checkInitial ) {
	var initialChar , nonBoundarySeen = false ;

	if ( checkInitial && this.buffer[ this.cy ] && this.buffer[ this.cy ][ this.cx ] ) {
		initialChar = this.buffer[ this.cy ][ this.cx ].char ;
		if ( ! WORD_BOUNDARY.has( initialChar ) ) { nonBoundarySeen = true ; }
	}

	this[ method ]( char => {
		if ( WORD_BOUNDARY.has( char ) ) {
			if ( nonBoundarySeen ) { return true ; }
			return false ;
		}

		nonBoundarySeen = true ;
		return false ;

	} ) ;
} ;



TextBuffer.prototype.moveToEndOfWord = function() {
	return this.wordBoundary_( 'moveForward' , true ) ;
} ;



TextBuffer.prototype.moveToStartOfWord = function() {
	var char , oldCx = this.cx , oldCy = this.cy ;
	this.wordBoundary_( 'moveBackward' ) ;

	if ( this.cx < oldCx && this.cy === oldCy && this.buffer[ this.cy ] && this.buffer[ this.cy ][ this.cx ] ) {
		char = this.buffer[ this.cy ][ this.cx ].char ;
		if ( WORD_BOUNDARY.has( char ) ) { this.moveForward() ; }
	}
	else if ( this.cy < oldCy && oldCx !== 0 && this.buffer[ oldCy ] && this.buffer[ oldCy ][ 0 ] ) {
		char = this.buffer[ oldCy ][ 0 ].char ;
		if ( ! WORD_BOUNDARY.has( char ) ) {
			this.cx = 0 ;
			this.cy = oldCy ;
		}
	}
} ;



TextBuffer.prototype.moveToStartOfLine = function() { this.cx = 0 ; } ;



TextBuffer.prototype.moveToEndOfLine = function() {
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



// Move to the start of the buffer: 0,0
TextBuffer.prototype.moveToStartOfBuffer = function() { this.cx = this.cy = 0 ; } ;



// Move to the end of the buffer: end of line of the last line
TextBuffer.prototype.moveToEndOfBuffer = function() {
	this.cy = this.buffer.length ? this.buffer.length - 1 : 0 ;
	this.moveToEndOfLine() ;
} ;



TextBuffer.prototype.moveInBound = function( ignoreCx ) {
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



// .insert( text , [[hasMarkup] , attr ] )
TextBuffer.prototype.insert = function( text , hasMarkup , attr ) {
	var lines , index , length ;

	if ( ! text ) { return ; }

	if ( typeof hasMarkup !== 'boolean' && typeof hasMarkup !== 'string' ) {
		attr = hasMarkup ;
		hasMarkup = false ;
	}

	var legacyColor = false , parser = null ;

	switch ( hasMarkup ) {
		case 'ansi' : parser = termkit.parseAnsi ; break ;
		case 'legacyAnsi' : parser = termkit.parseAnsi ; legacyColor = true ; break ;
		case true : parser = termkit.parseMarkup ; break ;
	}

	lines = text.split( '\n' ) ;
	length = lines.length ;

	if ( attr && typeof attr === 'object' ) { attr = this.object2attr( attr ) ; }
	else if ( typeof attr !== 'number' ) { attr = this.defaultAttr ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	this.inlineInsert( lines[ 0 ] , parser , attr ) ;

	for ( index = 1 ; index < length ; index ++ ) {
		this.newLine( true ) ;
		this.inlineInsert( lines[ index ] , parser , attr ) ;
	}
} ;



TextBuffer.prototype.prepend = function( text , hasMarkup , attr ) {
	this.moveToStartOfBuffer() ;
	this.insert( text , hasMarkup , attr ) ;
} ;



TextBuffer.prototype.append = function( text , hasMarkup , attr ) {
	this.moveToEndOfBuffer() ;
	this.insert( text , hasMarkup , attr ) ;
} ;



// Internal API:
// Insert inline chars (no control chars)
TextBuffer.prototype.inlineInsert = function( text , parser , attr , legacyColor = false ) {
	var currentLine , currentLineLength , hasNL , nlCell , tabIndex , fillSize , cells ;

	this.moveForward( undefined , true ) ;	// just skip filler char

	// Should come after moving forward (rely on this.cx)
	//cells = string.unicode.toCells( Cell , text , this.tabWidth , this.cx , attr ) ;
	cells = this.lineToCells( text , parser , attr , this.cx , legacyColor ) ;

	// Is this a new line?
	if ( this.cy >= this.buffer.length ) {
		// Create all missing lines, if any
		while ( this.buffer.length < this.cy ) {
			this.buffer.push( [ new Cell( '\n' , this.defaultAttr ) ] ) ;
		}

		// Add a '\n' to the last line, if it is missing
		if (
			this.cy && (
				! this.buffer[ this.cy - 1 ].length ||
				this.buffer[ this.cy - 1 ][ this.buffer[ this.cy - 1 ].length - 1 ].char !== '\n'
			)
		) {
			this.buffer[ this.cy - 1 ].push( new Cell( '\n' , this.defaultAttr ) ) ;
		}

		this.buffer[ this.cy ] = [] ;
	}

	currentLine = this.buffer[ this.cy ] ;
	currentLineLength = currentLine.length ;
	hasNL = currentLineLength && currentLine[ currentLineLength - 1 ].char === '\n' ;

	// Apply
	if ( this.cx === currentLineLength ) {
		if ( hasNL ) {
			currentLine.splice( currentLineLength - 1 , 0 , new Cell( ' ' , this.defaultAttr ) , ... cells ) ;
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
		while ( fillSize -- ) { currentLine.push( new Cell( ' ' , this.defaultAttr ) ) ; }
		currentLine.push( ... cells , nlCell ) ;
	}
	else {
		fillSize = this.cx - currentLineLength ;
		while ( fillSize -- ) { currentLine.push( new Cell( ' ' , this.defaultAttr ) ) ; }
		currentLine.push( ... cells ) ;
	}

	// Patch tab if needed
	tabIndex = this.indexOfCharInLine( currentLine , '\t' , this.cx ) ;
	this.cx += cells.length ;

	// (AFTER cx++) word-wrap the current line, which is always the last line of the array (=faster)
	if ( this.lineWrapWidth ) { this.wrapLine() ; }

	if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
} ;



// Internal utility function
TextBuffer.prototype.indexOfCharInLine = function( line , char , index = 0 ) {
	var iMax = line.length ;

	for ( ; index < iMax ; index ++ ) {
		if ( line[ index ].char === char ) { return index ; }
	}

	// Like .indexOf() does...
	return -1 ;
} ;



// /!\ Bug with tabs and count > 1 !!! /!\

// Delete chars
TextBuffer.prototype.delete = function( count ) {
	var currentLine , inlineCount ;

	if ( count === undefined ) { count = 1 ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] && this.buffer[ this.cy ][ this.cx ] && this.buffer[ this.cy ][ this.cx ].filler ) {
		this.moveBackward( undefined , true ) ;	// just skip filler char
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
			if ( this.joinLine( true ) ) { count -- ; }
		}
	}

	// word-wrap the current line, which is always the last line of the array (=faster)
	if ( this.lineWrapWidth ) { this.wrapLine() ; }

	// Patch tab if needed
	//tabIndex = currentLine.indexOf( '\t' , this.cx ) ;
	//if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	this.reTabLine() ;	// Do it every time, before finding a better way to do it
} ;



// /!\ Bug with tabs and count > 1 !!! /!\

// Delete backward chars
TextBuffer.prototype.backDelete = function( count ) {
	var currentLine , inlineCount , tabIndex ;

	if ( count === undefined ) { count = 1 ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] && this.cx && this.buffer[ this.cy ][ this.cx - 1 ] && this.buffer[ this.cy ][ this.cx - 1 ].filler ) {
		this.moveBackward( undefined , true ) ;	// just skip filler char
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
			if ( this.joinLine( true ) ) { count -- ; }
		}
	}

	// word-wrap the current line, which is always the last line of the array (=faster)
	if ( this.lineWrapWidth ) { this.wrapLine() ; }

	// Patch tab if needed
	//tabIndex = currentLine.indexOf( '\t' , this.cx ) ;
	//if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	this.reTabLine( tabIndex ) ;	// Do it every time, before finding a better way to do it
} ;



// Fix a backward counter, get an additional count for each null char encountered
TextBuffer.prototype.countInlineBackward = function( count ) {
	var c , x ;

	for ( x = this.cx - 1 , c = 0 ; x >= 0 && c < count ; x -- , c ++ ) {
		if ( this.buffer[ this.cy ][ x ] && this.buffer[ this.cy ][ x ].filler ) { count ++ ; }
	}

	return c ;
} ;



// Fix a forward counter, get an additional count for each null char encountered
TextBuffer.prototype.countInlineForward = function( count ) {
	var c , x , xMax = this.buffer[ this.cy ].length ;

	for ( x = this.cx , c = 0 ; x < xMax && c < count ; x ++ , c ++ ) {
		if ( this.buffer[ this.cy ][ x + 1 ] && this.buffer[ this.cy ][ x + 1 ].filler ) { count ++ ; }
	}

	return c ;
} ;



TextBuffer.prototype.newLine = function( internalCall ) {
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

	currentLine.push( new Cell( '\n' , this.defaultAttr ) ) ;

	this.buffer.splice( this.cy + 1 , 0 , nextLine ) ;

	this.cx = 0 ;
	this.cy ++ ;

	// Patch tab if needed
	if ( ! internalCall ) {
		// word-wrap the current line, which is always the last line of the array (=faster)
		if ( this.lineWrapWidth ) { this.wrapLine() ; }

		tabIndex = this.indexOfCharInLine( currentLine , '\t' , this.cx ) ;
		if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	}
} ;



TextBuffer.prototype.joinLine = function( internalCall ) {
	var tabIndex , currentLine ,
		hasDeleted = false ;

	if ( ! internalCall && this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] === undefined ) { this.buffer[ this.cy ] = [] ; }
	if ( this.buffer[ this.cy + 1 ] === undefined ) { this.buffer[ this.cy + 1 ] = [] ; }

	currentLine = this.buffer[ this.cy ] ;

	if ( currentLine.length && currentLine[ currentLine.length - 1 ].char === '\n' ) {
		// Remove the last '\n' if any
		currentLine.length -- ;
		hasDeleted = true ;
	}

	this.cx = currentLine.length ;

	currentLine.splice( currentLine.length , 0 , ... this.buffer[ this.cy + 1 ] ) ;

	this.buffer.splice( this.cy + 1 , 1 ) ;

	// Patch tab if needed
	if ( ! internalCall ) {
		// word-wrap the current line, which is always the last line of the array (=faster)
		if ( this.lineWrapWidth ) { this.wrapLine() ; }

		tabIndex = this.indexOfCharInLine( currentLine , '\t' , this.cx ) ;
		if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	}

	return hasDeleted ;
} ;



/*
	A TextBuffer can only draw to a ScreenBuffer.
	To display it, you need to:
		- draw the TextBuffer to a ScreenBuffer
		- then draw that ScreenBuffer to the terminal
*/
TextBuffer.prototype.draw = function( options = {} ) {
	// Transmitted options (do not edit the user provided options, clone them)
	var tr = {
		dst: options.dst || this.dst ,
		offsetX: options.x !== undefined ? Math.floor( options.x ) : Math.floor( this.x ) ,
		offsetY: options.y !== undefined ? Math.floor( options.y ) : Math.floor( this.y ) ,
		dstClipRect: options.dstClipRect ? new termkit.Rect( options.dstClipRect ) : this.dstClipRect ,
		srcClipRect: options.srcClipRect ? new termkit.Rect( options.srcClipRect ) : undefined ,
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



TextBuffer.prototype.drawCursor = function( options ) {
	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	var cx ,
		dst = options.dst || this.dst ;

	if ( dst instanceof this.ScreenBuffer ) {
		cx = this.cy ? this.cx : this.cx + this.firstLineRightShift ;

		if ( ! this.ch && ( this.dstClipRect || new termkit.Rect( this.dst ) ).isInside( cx + this.x , this.cy + this.y ) ) {
			dst.cx = cx + this.x ;
			dst.cy = this.cy + this.y ;
			dst.ch = false ;
		}
		else {
			dst.ch = true ;
		}
	}
} ;



TextBuffer.prototype.blitter = function( p ) {
	var tr , srcRect , srcClipRect , srcAltBuffer , iterator , iteratorCallback ;

	srcRect = new termkit.Rect( this ) ;

	if ( this.voidTextBuffer ) {
		srcAltBuffer = this.voidTextBuffer.buffer ;
		srcRect.merge( new termkit.Rect( this.voidTextBuffer ) ) ;
	}

	srcClipRect = p.srcClipRect || new termkit.Rect( srcRect ) ;

	// Default options & iterator
	tr = {
		type: 'line' ,
		context: {
			srcFirstLineRightShift: this.firstLineRightShift ,
			srcBuffer: this.buffer ,
			srcAltBuffer ,
			dstBuffer: p.dst.buffer ,
			forceChar: this.hidden ,
			voidAttr: this.voidAttr ,
			writeAttr:
				this.ScreenBuffer === termkit.ScreenBuffer ?
					( dst , attr , offset ) => { dst.writeInt32BE( attr , offset ) ; } :
					( dst , attr , offset ) => { attr.copy( dst , offset ) ; }
		} ,
		dstRect: new termkit.Rect( p.dst ) ,
		srcRect ,
		dstClipRect: p.dstClipRect || new termkit.Rect( p.dst ) ,
		srcClipRect ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY ,
		wrap: p.wrap ,
		tile: p.tile ,
		multiply: this.ScreenBuffer.prototype.ITEM_SIZE
	} ;

	iteratorCallback = this.blitterLineIterator.bind( this ) ;

	if ( p.wrap ) { iterator = 'wrapIterator' ; }
	else if ( p.tile ) { iterator = 'tileIterator' ; }
	else { iterator = 'regionIterator' ; }

	termkit.Rect[ iterator ]( tr , iteratorCallback ) ;
} ;



TextBuffer.prototype.blitterLineIterator = function( p ) {
	//console.error( "blitter line" , p.srcY ) ;
	var srcRShift , srcX , srcXmax , srcExistingXmax , dstOffset , cells , cell , attr , charCode ;

	//if ( ! global.deb ) { global.deb = [] ; }
	//global.deb.push( p ) ;

	srcRShift = p.srcY ? 0 : p.context.srcFirstLineRightShift ;
	srcX = p.srcXmin - srcRShift ;
	srcXmax = p.srcXmax - srcRShift ;
	dstOffset = p.dstStart ;

	cells = p.context.srcBuffer[ p.srcY ] ;

	if ( cells ) {
		//console.error( "  C1" ) ;
		srcExistingXmax = srcXmax ;

		if ( srcExistingXmax >= cells.length ) { srcExistingXmax = cells.length - 1 ; }

		// Write existing cells
		for ( ; srcX <= srcExistingXmax ; srcX ++ , dstOffset += this.ScreenBuffer.prototype.ITEM_SIZE ) {
			if ( srcX < 0 ) { continue ; }	// right-shifted
			cell = cells[ srcX ] ;

			// Write the attributes
			p.context.writeAttr( p.context.dstBuffer , cell.attr , dstOffset ) ;

			if ( p.context.forceChar ) {
				// Write the forced character (i.e. hidden)
				p.context.dstBuffer.write( p.context.forceChar , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
			}
			else if ( ( charCode = cell.char.charCodeAt( 0 ) ) < 0x20 || charCode === 0x7f ) {
				// Replace the control char by a white space
				p.context.dstBuffer.write( ' ' , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
			}
			else {
				// Write the character
				p.context.dstBuffer.write( cell.char , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
			}
		}
	}


	if ( p.context.srcAltBuffer ) {
		cells = p.context.srcAltBuffer[ p.srcY ] ;

		if ( cells ) {
			//console.error( "  C2" , srcX ) ;
			srcExistingXmax = srcXmax ;

			if ( srcExistingXmax >= cells.length ) { srcExistingXmax = cells.length - 1 ; }

			// Write existing cells
			for ( ; srcX <= srcExistingXmax ; srcX ++ , dstOffset += this.ScreenBuffer.prototype.ITEM_SIZE ) {
				if ( srcX < 0 ) { continue ; }	// right-shifted
				cell = cells[ srcX ] ;

				// Write the attributes
				p.context.writeAttr( p.context.dstBuffer , cell.attr , dstOffset ) ;

				if ( ( charCode = cell.char.charCodeAt( 0 ) ) < 0x20 || charCode === 0x7f ) {
					// Replace the control char by a white space
					p.context.dstBuffer.write( ' ' , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
				}
				else {
					// Write the character
					p.context.dstBuffer.write( cell.char , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
				}
			}
		}
	}


	// Write blank
	// Temp?
	attr = p.context.voidAttr ;
	if ( attr !== null ) {
		for ( ; srcX <= srcXmax ; srcX ++ , dstOffset += this.ScreenBuffer.prototype.ITEM_SIZE ) {
			// Write the attributes
			p.context.writeAttr( p.context.dstBuffer , attr , dstOffset ) ;

			// Write the character
			p.context.dstBuffer.write( ' ' , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
		}
	}
} ;



// Naive loading
TextBuffer.prototype.load = function( path , callback ) {
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
TextBuffer.prototype.save = function( path , callback ) {
	// Naive file saving, optimization are for later
	fs.writeFile( path , this.getText() , ( error ) => {
		if ( error ) { callback( error ) ; return ; }
		callback() ;
	} ) ;
} ;



TextBuffer.prototype.object2attr = function( attrObject , colorNameToIndex = this.palette?.colorNameToIndex , legacyColor = false ) {
	return this.ScreenBuffer.object2attr( attrObject , colorNameToIndex , legacyColor ) ;
} ;





/* API for the text-machine module */



TextBuffer.prototype.runStateMachine = function() {
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



TextMachineApi.blockStyle = function( context , style ) {
	if ( context.x === null || ! context.startingContext || context.startingContext.x === null ) { return ; }
	if ( ! style.code ) { style.code = context.textBuffer.ScreenBuffer.object2attr( style ) ; }	// cache it now

	context.textBuffer.setAttrCodeRegion( style.code , {
		xmin: context.startingContext.x ,
		xmax: context.x ,
		ymin: context.startingContext.y ,
		ymax: context.y
	} ) ;
} ;



TextMachineApi.hint = function( context , hints ) {
	var misc ;

	if ( hints[ context.buffer ] ) {
		misc = context.textBuffer.getMiscAt( context.x , context.y ) ;
		if ( misc ) { misc.hint = hints[ context.buffer ] ; }
	}
} ;

