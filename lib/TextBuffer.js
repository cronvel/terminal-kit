/*
	Terminal Kit

	Copyright (c) 2009 - 2022 Cédric Ronvel

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

	this.tabWidth = + options.tabWidth || 4 ;
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
	this.stateMachineCheckpointDistance = options.stateMachineCheckpointDistance || 100 ;	// Min distance (in cell) between to checkpoint

	if ( options.hidden ) { this.setHidden( options.hidden ) ; }
}

module.exports = TextBuffer ;



// Backward compatibility
TextBuffer.create = ( ... args ) => new TextBuffer( ... args ) ;

TextBuffer.prototype.parseMarkup = string.markupMethod.bind( misc.markupOptions ) ;



// Special: if positive or 0, it's the width of the char, if -1 it's an anti-filler, if -2 it's a filler
function Cell( char = ' ' , special = 1 , attr = null , misc_ = null , checkpoint = null ) {
	this.char = char ;
	this.width = special >= 0 ? special : -special - 1 ;
	this.filler = special < 0 ;		// note: antiFiller ARE filler
	this.attr = attr ;
	this.misc = misc_ ;
	this.checkpoint = checkpoint ;	// <-- state-machine checkpoint, null=no checkpoint, any value = state (type is third-party)
}

TextBuffer.Cell = Cell ;



const termkit = require( './termkit.js' ) ;



TextBuffer.prototype.getText = function() {
	return this.buffer.map( line => string.unicode.fromCells( line ) ).join( '' ) ;
} ;



// TODOC
TextBuffer.prototype.getLineText = function( y = this.cy ) {
	if ( y >= this.buffer.length ) { return null ; }
	if ( ! this.buffer[ y ] ) { this.buffer[ y ] = [] ; }
	return string.unicode.fromCells( this.buffer[ y ] ) ;
} ;



// TODOC
// Get the indentation part of the line, return null if the line is empty (no char or no non-space char)
TextBuffer.prototype.getLineIndent = function( y = this.cy ) {
	if ( ! this.buffer[ y ] ) { return null ; }

	var x , xmin , xmax , cell ,
		indent = '' ;

	for ( x = 0 , xmax = this.buffer[ y ].length - 1 ; x <= xmax ; x ++ ) {
		cell = this.buffer[ y ][ x ] ;
		if ( ! cell.filler ) {
			if ( cell.char === '\t' || cell.char === ' ' ) {
				indent += cell.char ;
			}
			else if ( cell.char === '\n' ) {
				return null ;
			}
			else {
				return indent ;
			}
		}
	}

	return null ;
} ;



// TODOC
// Count characters in this line, excluding fillers
TextBuffer.prototype.getLineCharCount = function( y = this.cy ) {
	if ( y >= this.buffer.length ) { return null ; }
	if ( ! this.buffer[ y ] ) { this.buffer[ y ] = [] ; }
	return this.getCellsCharCount( this.buffer[ y ] ) ;
} ;



// internal
TextBuffer.prototype.getCellsCharCount = function( cells ) {
	var count = 0 ;

	for ( let cell of cells ) {
		if ( ! cell.filler ) { count ++ ; }
	}

	return count ;
} ;



// TODOC
// Remove spaces and tabs at the end of the line
TextBuffer.prototype.removeTrailingSpaces = function( y = this.cy , x = null , dry = false ) {
	if ( y >= this.buffer.length ) { return '' ; }
	if ( ! this.buffer[ y ] ) { this.buffer[ y ] = [] ; }

	var line = this.buffer[ y ] ;

	x = x ?? line.length - 1 ;

	if ( x < 0 || x >= line.length ) { return '' ; }

	var deletedStr = '' ,
		hasNL = line[ x ].char === '\n' ;

	if ( hasNL ) {
		x -- ;
	}

	for ( ; x >= 0 ; x -- ) {
		if ( line[ x ].filler ) { continue ; }

		let char = line[ x ].char ;

		if ( char === ' ' || char === '\t' ) {
			deletedStr = char + deletedStr ;
		}
		else {
			break ;
		}
	}

	if ( deletedStr && ! dry ) {
		line.splice( x + 1 , deletedStr.length ) ;
	}

	return deletedStr ;
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
		case 'ansi' : parser = string.ansi.parse ; break ;
		case 'legacyAnsi' : parser = string.ansi.parse ; legacyColor = true ; break ;
		case true : parser = this.parseMarkup ; break ;
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
			this.buffer[ index ].push( new Cell( '\n' , 1 , baseAttr ) ) ;
		}

		// word-wrap the current line, which is always the last line of the array (=faster)
		if ( this.lineWrapWidth ) { this.wrapLine( index ) ; }
	} ) ;

	this.selectionRegion = null ;
} ;



// Internal, transform a line of text, with or without markup to cells...
TextBuffer.prototype.lineToCells = function( line , parser , baseAttr , offset = 0 , legacyColor = false ) {
	if ( ! parser ) {
		return string.unicode.toCells( Cell , line , this.tabWidth , offset , baseAttr ) ;
	}

	var attr , attrObject ,
		cells = [] ;

	const defaultAttrObject = this.ScreenBuffer.attr2object( this.ScreenBuffer.DEFAULT_ATTR ) ;
	const baseAttrObject = this.ScreenBuffer.attr2object( baseAttr ) ;

	parser( line ).forEach( part => {
		attrObject = Object.assign( {} , part.specialReset ? defaultAttrObject : baseAttrObject , part ) ;
		delete attrObject.text ;

		// Remove incompatible flags
		if ( attrObject.defaultColor && attrObject.color ) { delete attrObject.defaultColor ; }
		if ( attrObject.bgDefaultColor && attrObject.bgColor ) { delete attrObject.bgDefaultColor ; }

		attr = this.object2attr( attrObject , undefined , legacyColor ) ;

		if ( part.text ) {
			cells.push( ... string.unicode.toCells( Cell , part.text , this.tabWidth , offset + cells.length , attr ) ) ;
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



// TODOC
TextBuffer.prototype.coordinateToOffset = function( px , py ) {
	var x , y , line , offset = 0 ;

	for ( y = 0 ; y < py ; y ++ ) {
		line = this.buffer[ y ] ;
		if ( ! line ) { continue ; }
		for ( x = 0 ; x < line.length ; x ++ ) {
			if ( ! line[ x ].filler ) { offset ++ ; }
		}
	}

	line = this.buffer[ py ] ;
	if ( line ) {
		for ( x = 0 ; x < px && x < line.length ; x ++ ) {
			if ( ! line[ x ].filler ) { offset ++ ; }
		}
	}

	return offset ;
} ;



// Cursor offset in the text-content (excluding fillers)
TextBuffer.prototype.getCursorOffset = function() {
	return this.coordinateToOffset( this.cx , this.cy ) ;
} ;



// TODOC
TextBuffer.prototype.offsetToCoordinate = function( offset ) {
	var line ,
		x = 0 ,
		y = 0 ;

	if ( offset < 0 ) { return ; }

	while ( y < this.buffer.length ) {
		x = 0 ;
		line = this.buffer[ y ] ;
		//console.error( "  iter cy" , offset , y , x , "---" , line.length ) ;
		if ( ! line ) { continue ; }

		while ( x < line.length ) {
			//console.error( "    iter cx" , offset , y , x ) ;
			if ( ! line[ x ].filler ) {
				if ( offset <= 0 ) {
					if ( x === line.length && line[ line.length - 1 ].char === '\n' ) {
						//console.error( "    Exit with \\n" ) ;
						x = 0 ;
						y ++ ;
					}
					//console.error( "Exit" , y , x ) ;
					return { x , y } ;
				}

				offset -- ;
			}

			x ++ ;
		}

		y ++ ;
	}

	//console.error( "End of input" , offset , y , x ) ;
} ;



// Set the cursor position (cx,cy) depending on the offset in the text-content (excluding fillers)
TextBuffer.prototype.setCursorOffset = function( offset ) {
	var coord = this.offsetToCoordinate() ;
	if ( ! coord ) { return ; }
	this.cx = coord.x ;
	this.cy = coord.y ;
} ;



// TODOC
TextBuffer.prototype.setTabWidth = function( tabWidth ) {
	this.tabWidth = + tabWidth || 4 ;
	this.reTab() ;
} ;



// TODOC
TextBuffer.prototype.reTab = function() {
	for ( let y = 0 ; y < this.buffer.length ; y ++ ) {
		this.reTabLine( 0 , y ) ;
	}
} ;



// Recompute tabs
TextBuffer.prototype.reTabLine = function( startAt = 0 , y = this.cy ) {
	var length , cell , index , fillSize , input , output ,
		linePosition = startAt ;

	if ( this.buffer[ y ] === undefined ) { this.buffer[ y ] = [] ; }

	input = this.buffer[ y ] ;
	output = input.slice( 0 , startAt ) ;
	length = input.length ;

	for ( index = startAt ; index < length ; index ++ ) {
		cell = input[ index ] ;

		if ( cell.char === '\t' ) {
			fillSize = this.tabWidth - ( linePosition % this.tabWidth ) - 1 ;
			output.push( cell ) ;
			linePosition += 1 + fillSize ;

			while ( fillSize -- ) {
				output.push( new Cell( ' ' , -2 , cell.attr , cell.misc ) ) ;
			}

			// Skip input filler
			while ( index + 1 < length && input[ index + 1 ].filler ) { index ++ ; }
		}
		else {
			output.push( cell ) ;
			linePosition ++ ;
		}
	}

	this.buffer[ y ] = output ;
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

	if ( ! this.buffer[ y ][ x ] ) { this.buffer[ y ][ x ] = new Cell( ' ' , 1 , attr ) ; }
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



// TODOC
TextBuffer.prototype.setCheckpointAt = function( checkpoint , x , y ) {
	if ( ! this.buffer[ y ] || ! this.buffer[ y ][ x ] ) { return ; }
	this.buffer[ y ][ x ].checkpoint = checkpoint ;
} ;



TextBuffer.prototype.isInSelection = function( x = this.cx , y = this.cy ) {
	if ( ! this.selectionRegion ) { return false ; }
	return this.isInRegion( this.selectionRegion , x , y ) ;
} ;



TextBuffer.prototype.isInRegion = function( region , x = this.cx , y = this.cy ) {
	return (
		y >= region.ymin && y <= region.ymax
		&& ( y !== region.ymin || x >= region.xmin )
		&& ( y !== region.ymax || x <= region.xmax )
	) ;
} ;



TextBuffer.prototype.setSelectionRegion = function( region ) {
	if ( ! this.selectionRegion ) {
		this.selectionRegion = {} ;
	}

	if ( region.xmin !== undefined && region.ymin !== undefined ) {
		if ( region.xmin < 0 ) { region.xmin = 0 ; }
		if ( region.ymin < 0 ) { region.ymin = 0 ; }

		this.selectionRegion.xmin = region.xmin ;
		this.selectionRegion.ymin = region.ymin ;
		this.selectionRegion.cellMin = this.buffer[ region.ymin ]?.[ region.xmin ] ?? null ;
	}

	if ( region.xmax !== undefined && region.ymax !== undefined ) {
		this.selectionRegion.xmax = region.xmax ;
		this.selectionRegion.ymax = region.ymax ;
		this.selectionRegion.cellMax = this.buffer[ region.ymax ]?.[ region.xmax ] ?? null ;
	}
} ;



// TODOC
TextBuffer.prototype.startOfSelection = function() {
	if ( ! this.selectionRegion ) {
		this.selectionRegion = {} ;
	}

	this.selectionRegion.xmin = this.cx ;
	this.selectionRegion.ymin = this.cy ;
	this.selectionRegion.cellMin = this.buffer[ this.cy ]?.[ this.cx ] ?? null ;
} ;



// TODOC
TextBuffer.prototype.endOfSelection = function() {
	var coord = this.oneStepBackward() ;

	if ( ! this.selectionRegion ) {
		this.selectionRegion = {} ;
	}

	if ( ! coord ) {
		// Start of the file
		this.selectionRegion = null ;
		return ;
	}

	this.selectionRegion.xmax = coord.x ;
	this.selectionRegion.ymax = coord.y ;
	this.selectionRegion.cellMax = this.buffer[ coord.y ]?.[ coord.x ] ?? null ;
} ;



// TODOC
// Reset the region by scanning for the starting and ending cell
// If cursorCell is set, set cursor position to this cell
TextBuffer.prototype.updateSelectionFromCells = function( cursorCell = null ) {
	if ( ! this.selectionRegion ) { return ; }
	if ( ! this.selectionRegion.cellMin || ! this.selectionRegion.cellMax ) {
		this.selectionRegion = null ;
		return ;
	}

	var xmin , xmax , ymin , ymax ;

	for ( let y = 0 ; y < this.buffer.length ; y ++ ) {
		let currentLine = this.buffer[ y ] ;
		if ( ! currentLine ) { continue ; }

		for ( let x = 0 ; x < currentLine.length ; x ++ ) {
			if ( currentLine[ x ] === this.selectionRegion.cellMin ) {
				xmin = x ;
				ymin = y ;
			}

			if ( currentLine[ x ] === this.selectionRegion.cellMax ) {
				xmax = x ;
				ymax = y ;
			}

			if ( cursorCell && currentLine[ x ] === cursorCell ) {
				this.cx = x ;
				this.cy = y ;
			}
		}
	}

	if ( ymin === undefined || ymax === undefined ) {
		this.selectionRegion = null ;
		return ;
	}

	this.selectionRegion.xmin = xmin ;
	this.selectionRegion.xmax = xmax ;
	this.selectionRegion.ymin = ymin ;
	this.selectionRegion.ymax = ymax ;
} ;



// TODOC
// Return a Cell instance that is at the cursor location, or null if none
TextBuffer.prototype.getCursorCell = function() {
	return this.buffer[ this.cy ]?.[ this.cx ] ?? null ;
} ;



// TODOC
// Return true if found, else return false
TextBuffer.prototype.updateCursorFromCell = function( cursorCell ) {
	if ( ! cursorCell ) { return false ; }

	for ( let y = 0 ; y < this.buffer.length ; y ++ ) {
		let currentLine = this.buffer[ y ] ;
		if ( ! currentLine ) { continue ; }

		for ( let x = 0 ; x < currentLine.length ; x ++ ) {
			if ( cursorCell && currentLine[ x ] === cursorCell ) {
				this.cx = x ;
				this.cy = y ;
				return true ;
			}
		}
	}

	return false ;
} ;



TextBuffer.prototype.resetSelectionRegion = function() {
	if ( ! this.selectionRegion ) { return ; }
	this.selectionRegion = null ;
} ;



TextBuffer.prototype.getSelectionText = function() {
	return this.getRegionText( this.selectionRegion ) ;
} ;



// TODOC
TextBuffer.prototype.getRegionText = function( region , structured = false ) {
	var x , y , xmin , xmax , ymax , cell ,
		count = 0 ,
		str = '' ;

	if ( ! region || region.xmin === undefined || region.ymin === undefined || region.xmax === undefined || region.ymax === undefined ) {
		return ;
	}

	ymax = Math.min( region.ymax , this.buffer.length - 1 ) ;

	for ( y = region.ymin ; y <= ymax ; y ++ ) {
		if ( ! this.buffer[ y ] ) { this.buffer[ y ] = [] ; }

		xmin = y === region.ymin ? region.xmin : 0 ;
		xmax = y === region.ymax ? Math.min( region.xmax , this.buffer[ y ].length - 1 ) : this.buffer[ y ].length - 1 ;

		for ( x = xmin ; x <= xmax ; x ++ ) {
			cell = this.buffer[ y ][ x ] ;
			if ( ! cell.filler ) {
				str += cell.char ;
				count ++ ;
			}
		}
	}

	if ( structured ) { return { string: str , count } ; }
	return str ;
} ;



// TODOC
TextBuffer.prototype.deleteSelection = function( getDeleted = false ) {
	if ( ! this.selectionRegion ) { return ; }
	var region = this.selectionRegion ;
	this.selectionRegion = null ;	// unselect now
	return this.deleteRegion( region , getDeleted ) ;
} ;



// TODOC
// Delete current line
TextBuffer.prototype.deleteRegion = function( region , getDeleted = false ) {
	var x , y , xmin , xmax , ymax , currentLine , tabIndex , deleted , cursorCell ;

	if ( ! region || region.xmin === undefined || region.ymin === undefined || region.xmax === undefined || region.ymax === undefined ) {
		return ;
	}

	cursorCell = this.buffer[ this.cy ]?.[ this.cx ] ?? null ;

	if ( getDeleted ) {
		deleted = this.getRegionText( region , true ) ;
	}

	ymax = Math.min( region.ymax , this.buffer.length - 1 ) ;
	y = region.ymin ;
	currentLine = this.buffer[ y ] ;

	if ( y === ymax ) {
		if ( ! this.buffer[ y ] ) { return deleted ; }

		xmin = region.xmin ;
		xmax = Math.min( region.xmax , currentLine.length - 1 ) ;
		currentLine.splice( xmin , xmax - xmin + 1 ) ;

	}
	else {
		let lastLine = this.buffer[ ymax ] ;

		// First, remove next lines
		this.buffer.splice( y + 1 , ymax - y ) ;

		xmin = region.xmin ;
		currentLine.splice( xmin , currentLine.length - xmin ) ;

		if ( lastLine && lastLine.length ) {
			xmax = Math.min( region.xmax , lastLine.length - 1 ) ;
			lastLine.splice( 0 , xmax + 1 ) ;
			if ( lastLine.length ) {
				currentLine.splice( currentLine.length , 0 , ... lastLine ) ;
			}
		}
	}

	if ( y < this.buffer.length - 1 && ( ! currentLine.length || currentLine[ currentLine.length - 1 ].char !== '\n' ) ) {
		this.joinLine( true , y ) ;
	}

	tabIndex = this.indexOfCharInLine( currentLine , '\t' , region.xmin ) ;
	if ( tabIndex !== -1 ) { this.reTabLine( tabIndex , y ) ; }

	if ( this.selectionRegion ) {
		this.updateSelectionFromCells( cursorCell ) ;
	}
	else if ( cursorCell ) {
		this.updateCursorFromCell( cursorCell ) ;
	}

	return deleted ;
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
	var x , y , yMax , cell , lastNonFillerCell , length ,
		offset = 0 ,
		startX = options.x ?? 0 ,
		startY = options.y ?? 0 ,
		done = false ;

	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }

	if ( ! this.buffer.length ) { return ; }

	for ( y = startY , yMax = this.buffer.length ; y < yMax ; y ++ ) {
		if ( this.buffer[ y ] ) {
			length = this.buffer[ y ].length ;
			lastNonFillerCell = null ;

			for (  x = y === startY ? startX : 0  ;  x < length  ;  x ++  ) {
				cell = this.buffer[ y ][ x ] ;
				if ( cell.filler ) {
					if ( options.fillerCopyAttr && lastNonFillerCell ) {
						cell.attr = lastNonFillerCell.attr ;
					}
				}
				else {
					// We check if we are done only here, not after the callback, because the 'fillerCopyAttr' option
					// should do some extra work on filler-cells even if we had previously finished...
					if ( done ) { return ; }

					done = callback( {
						offset: offset ,
						x: x ,
						y: y ,
						text: cell.char ,
						attr: cell.attr ,
						misc: cell.misc ,
						cell
					} ) ;

					offset ++ ;
					lastNonFillerCell = cell ;
				}
			}
		}
	}

	// Call the callback one last time at the end of the buffer, with an empty string.
	// Useful for 'Ne' (Neon) state machine.
	if ( ! done && options.finalCall ) {
		callback( {
			offset: offset + 1 ,
			x: null ,
			y: y ,
			text: '' ,
			attr: null ,
			misc: null ,
			cell: null
		} ) ;
	}
} ;



// Move to the left to the leading cell of a full-width char
TextBuffer.prototype.moveToLeadingFullWidth = function() {
	var currentLine = this.buffer[ this.cy ] ;
	while ( this.cx && currentLine?.[ this.cx ]?.filler && currentLine?.[ this.cx ]?.width === 0 ) { this.cx -- ; }
} ;



TextBuffer.prototype.moveTo = function( x , y ) {
	this.cx = x >= 0 ? x : 0 ;
	this.cy = y >= 0 ? y : 0 ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
	this.moveToLeadingFullWidth() ;
} ;



TextBuffer.prototype.move = function( x , y ) { this.moveTo( this.cx + x , this.cy + y ) ; } ;
TextBuffer.prototype.moveToColumn = function( x ) { this.moveTo( x , this.cy ) ; } ;
TextBuffer.prototype.moveToLine = TextBuffer.prototype.moveToRow = function( y ) { this.moveTo( this.cx , y ) ; } ;



TextBuffer.prototype.moveUp = function() {
	this.cy = this.cy > 0 ? this.cy - 1 : 0 ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
	this.moveToLeadingFullWidth() ;
} ;



TextBuffer.prototype.moveDown = function() {
	this.cy ++ ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
	this.moveToLeadingFullWidth() ;
} ;



TextBuffer.prototype.moveLeft = function() {
	this.cx = this.cx > 0 ? this.cx - 1 : 0 ;
	if ( this.forceInBound ) { this.moveInBound( true ) ; }
	this.moveToLeadingFullWidth() ;
} ;



TextBuffer.prototype.moveRight = function() {
	this.cx ++ ;

	var currentLine = this.buffer[ this.cy ] ;
	while ( currentLine?.[ this.cx ]?.filler && currentLine?.[ this.cx ]?.width === 0 ) { this.cx ++ ; }

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

		if (
			! currentLine[ this.cx ]
			|| (
				! currentLine[ this.cx ].filler
				&& ( ! testFn || testFn( currentLine[ this.cx ].char , this.cx , this.cy ) )
			)
		) {
			break ;
		}
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
				! currentLine[ this.cx ].filler
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
	var lines , index , length ,
		count = 0 ;

	if ( ! text ) { return count ; }

	if ( typeof hasMarkup !== 'boolean' && typeof hasMarkup !== 'string' ) {
		attr = hasMarkup ;
		hasMarkup = false ;
	}

	var legacyColor = false , parser = null ;

	switch ( hasMarkup ) {
		case 'ansi' : parser = string.ansi.parse ; break ;
		case 'legacyAnsi' : parser = string.ansi.parse ; legacyColor = true ; break ;
		case true : parser = this.parseMarkup ; break ;
	}

	lines = text.split( '\n' ) ;
	length = lines.length ;

	if ( attr && typeof attr === 'object' ) { attr = this.object2attr( attr ) ; }
	else if ( typeof attr !== 'number' ) { attr = this.defaultAttr ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	count += this.inlineInsert( lines[ 0 ] , parser , attr ) ;

	for ( index = 1 ; index < length ; index ++ ) {
		this.newLine( true ) ;
		count ++ ;
		count += this.inlineInsert( lines[ index ] , parser , attr , legacyColor ) ;
	}

	if ( this.selectionRegion ) { this.updateSelectionFromCells() ; }

	return count ;
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
	var currentLine , currentLineLength , hasNL , nlCell , tabIndex , fillSize , cells , cellsCharCount ,
		count = 0 ;

	this.moveForward( undefined , true ) ;	// just skip filler char

	// Should come after moving forward (rely on this.cx)
	//cells = string.unicode.toCells( Cell , text , this.tabWidth , this.cx , attr ) ;
	cells = this.lineToCells( text , parser , attr , this.cx , legacyColor ) ;
	cellsCharCount = this.getCellsCharCount( cells ) ;

	// Is this a new line?
	if ( this.cy >= this.buffer.length ) {
		// Create all missing lines, if any
		while ( this.buffer.length < this.cy ) {
			this.buffer.push( [ new Cell( '\n' , 1 , this.defaultAttr ) ] ) ;
			count ++ ;
		}

		// Add a '\n' to the last line, if it is missing
		if (
			this.cy && (
				! this.buffer[ this.cy - 1 ].length ||
				this.buffer[ this.cy - 1 ][ this.buffer[ this.cy - 1 ].length - 1 ].char !== '\n'
			)
		) {
			this.buffer[ this.cy - 1 ].push( new Cell( '\n' , 1 , this.defaultAttr ) ) ;
			count ++ ;
		}

		this.buffer[ this.cy ] = [] ;
	}

	currentLine = this.buffer[ this.cy ] ;
	currentLineLength = currentLine.length ;
	hasNL = currentLineLength && currentLine[ currentLineLength - 1 ].char === '\n' ;

	// Apply
	if ( this.cx === currentLineLength ) {
		if ( hasNL ) {
			currentLine.splice( currentLineLength - 1 , 0 , new Cell( ' ' , 1 , this.defaultAttr ) , ... cells ) ;
			count += 1 + cellsCharCount ;
		}
		else {
			currentLine.push( ... cells ) ;
			count += cellsCharCount ;
		}
	}
	else if ( this.cx < currentLineLength ) {
		currentLine.splice( this.cx , 0 , ... cells ) ;
		count += cellsCharCount ;
	}
	// this.cx > currentLineLength
	else if ( hasNL ) {
		fillSize = this.cx - currentLineLength + 1 ;
		nlCell = currentLine.pop() ;

		while ( fillSize -- ) {
			currentLine.push( new Cell( ' ' , 1 , this.defaultAttr ) ) ;
			count ++ ;
		}

		currentLine.push( ... cells , nlCell ) ;
		count += cellsCharCount ;
	}
	else {
		fillSize = this.cx - currentLineLength ;

		while ( fillSize -- ) {
			currentLine.push( new Cell( ' ' , 1 , this.defaultAttr ) ) ;
			count ++ ;
		}

		currentLine.push( ... cells ) ;
		count += cellsCharCount ;
	}

	// Patch tab if needed
	tabIndex = this.indexOfCharInLine( currentLine , '\t' , this.cx ) ;
	this.cx += cells.length ;

	// (AFTER cx++) word-wrap the current line, which is always the last line of the array (=faster)
	if ( this.lineWrapWidth ) { this.wrapLine() ; }

	if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }

	return count ;
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



// Delete chars
TextBuffer.prototype.delete = function( count , getDeleted = false ) {
	var currentLine , inlineCount , fillerCount , hasNL , removedCells ,
		deleted = getDeleted ? { string: '' , count: 0 } : undefined ;

	if ( count === undefined ) { count = 1 ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] && this.buffer[ this.cy ][ this.cx ] && this.buffer[ this.cy ][ this.cx ].filler ) {
		this.moveBackward( undefined , true ) ;	// just skip filler char
		count -- ;
	}


	while ( count > 0 ) {
		currentLine = this.buffer[ this.cy ] ;

		// If we are already at the end of the buffer...
		if (
			this.cy >= this.buffer.length ||
			( this.cy === this.buffer.length - 1 && this.cx >= currentLine.length )
		) {
			if ( this.selectionRegion ) { this.updateSelectionFromCells() ; }
			return deleted ;
		}

		if ( currentLine ) {
			// If the cursor is too far away, move it at the end of the line
			if ( this.cx > currentLine.length ) { this.cx = currentLine.length ; }

			if ( currentLine[ this.cx ] && currentLine[ this.cx ].char !== '\n' ) {
				// Compute inline delete
				hasNL = currentLine[ currentLine.length - 1 ]?.char === '\n' ;
				fillerCount = this.countInlineForwardFiller( count ) ;
				inlineCount = Math.min( count + fillerCount , currentLine.length - hasNL - this.cx ) ;

				// Apply inline delete
				if ( inlineCount > 0 ) {
					removedCells = currentLine.splice( this.cx , inlineCount ) ;
					if ( getDeleted ) {
						removedCells = removedCells.filter( cell => ! cell.filler ) ;
						deleted.string += removedCells.map( cell => cell.char ).join( '' ) ;
						deleted.count += removedCells.length ;
					}
				}

				count -= inlineCount - fillerCount ;
			}
		}

		if ( count > 0 ) {
			if ( this.joinLine( true ) ) {
				count -- ;
				if ( getDeleted ) {
					deleted.string += '\n' ;
					deleted.count ++ ;
				}
			}
		}
	}

	// word-wrap the current line, which is always the last line of the array (=faster)
	if ( this.lineWrapWidth ) { this.wrapLine() ; }

	// Patch tab if needed
	//tabIndex = currentLine.indexOf( '\t' , this.cx ) ;
	//if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	this.reTabLine() ;	// Do it every time, before finding a better way to do it

	if ( this.selectionRegion ) { this.updateSelectionFromCells() ; }

	return deleted ;
} ;



// Delete backward chars
TextBuffer.prototype.backDelete = function( count , getDeleted = false ) {
	//console.error( ">>> backDelete:" , count ) ;
	var currentLine , inlineCount , fillerCount , tabIndex , removedCells ,
		deleted = getDeleted ? { string: '' , count: 0 } : undefined ;

	if ( count === undefined ) { count = 1 ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ this.cy ] && this.cx && this.buffer[ this.cy ][ this.cx - 1 ] && this.buffer[ this.cy ][ this.cx - 1 ].filler ) {
		this.moveBackward( undefined , true ) ;	// just skip filler char
		//count -- ;	// do not downcount: the cursor is always on a \x00 before deleting a \t
	}


	while ( count > 0 ) {
		currentLine = this.buffer[ this.cy ] ;

		// If we are already at the begining of the buffer...
		if ( this.cy === 0 && this.cx === 0 ) {
			if ( this.selectionRegion ) { this.updateSelectionFromCells() ; }
			return deleted ;
		}

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
			fillerCount = this.countInlineBackwardFiller( count ) ;
			inlineCount = Math.min( count + fillerCount , this.cx ) ;
			//console.error( "inlineCount:" , inlineCount , fillerCount , this.cx , this.cx - inlineCount ) ;

			// Apply inline delete
			if ( inlineCount > 0 ) {
				removedCells = currentLine.splice( this.cx - inlineCount , inlineCount ) ;
				if ( getDeleted ) {
					removedCells = removedCells.filter( cell => ! cell.filler ) ;
					deleted.string = removedCells.map( cell => cell.char ).join( '' ) + deleted.string ;
					deleted.count += removedCells.length ;
				}
				this.cx -= inlineCount ;
			}

			count -= inlineCount - fillerCount ;
		}

		if ( count > 0 ) {
			this.cy -- ;
			this.cx = currentLine ? currentLine.length : 0 ;
			if ( this.joinLine( true ) ) {
				count -- ;
				if ( getDeleted ) {
					deleted.string = '\n' + deleted.string ;
					deleted.count ++ ;
				}
			}
		}
	}

	// word-wrap the current line, which is always the last line of the array (=faster)
	if ( this.lineWrapWidth ) { this.wrapLine() ; }

	// Patch tab if needed
	//tabIndex = currentLine.indexOf( '\t' , this.cx ) ;
	//if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }
	this.reTabLine( tabIndex ) ;	// Do it every time, before finding a better way to do it

	if ( this.selectionRegion ) { this.updateSelectionFromCells() ; }

	return deleted ;
} ;



// Fix a backward counter, get an additional count for each null char encountered
TextBuffer.prototype.countInlineBackwardFiller = function( count ) {
	var x , cell ,
		filler = 0 ;

	for ( x = this.cx - 1 ; x >= 0 && count ; x -- ) {
		cell = this.buffer[ this.cy ][ x ] ;

		if ( cell && cell.filler ) {
			filler ++ ;
		}
		else {
			count -- ;
		}
	}

	return filler ;
} ;



// Fix a forward counter, get an additional count for each null char encountered
TextBuffer.prototype.countInlineForwardFiller = function( count ) {
	var x , cell ,
		xMax = this.buffer[ this.cy ].length ,
		filler = 0 ;

	for ( x = this.cx ; x < xMax && count ; x ++ ) {
		cell = this.buffer[ this.cy ][ x + 1 ] ;

		if ( cell && cell.filler ) {
			filler ++ ;
		}
		else {
			count -- ;
		}
	}

	return filler ;
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

	currentLine.push( new Cell( '\n' , 1 , this.defaultAttr ) ) ;

	this.buffer.splice( this.cy + 1 , 0 , nextLine ) ;

	this.cx = 0 ;
	this.cy ++ ;

	// Patch tab if needed
	if ( ! internalCall ) {
		// word-wrap the current line, which is always the last line of the array (=faster)
		if ( this.lineWrapWidth ) { this.wrapLine() ; }

		tabIndex = this.indexOfCharInLine( currentLine , '\t' , this.cx ) ;
		if ( tabIndex !== -1 ) { this.reTabLine( tabIndex ) ; }

		if ( this.selectionRegion ) { this.updateSelectionFromCells() ; }
	}
} ;



// If y is specified, we are not joining on current cursor
TextBuffer.prototype.joinLine = function( internalCall , y ) {
	var tabIndex , currentLine , x ,
		updateCursor = false ,
		hasDeleted = false ;

	if ( y === undefined ) {
		y = this.cy ;
		updateCursor = true ;
	}

	if ( ! internalCall && this.forceInBound ) { this.moveInBound() ; }

	if ( this.buffer[ y ] === undefined ) { this.buffer[ y ] = [] ; }
	if ( this.buffer[ y + 1 ] === undefined ) { this.buffer[ y + 1 ] = [] ; }

	currentLine = this.buffer[ y ] ;

	if ( currentLine.length && currentLine[ currentLine.length - 1 ].char === '\n' ) {
		// Remove the last '\n' if any
		currentLine.length -- ;
		hasDeleted = true ;
	}

	x = currentLine.length ;
	if ( updateCursor ) { this.cx = x ; }

	currentLine.splice( currentLine.length , 0 , ... this.buffer[ y + 1 ] ) ;

	this.buffer.splice( y + 1 , 1 ) ;

	// Patch tab if needed
	if ( ! internalCall ) {
		// word-wrap the current line, which is always the last line of the array (=faster)
		if ( this.lineWrapWidth ) { this.wrapLine() ; }

		tabIndex = this.indexOfCharInLine( currentLine , '\t' , x ) ;
		if ( tabIndex !== -1 ) { this.reTabLine( tabIndex , y ) ; }

		if ( this.selectionRegion ) { this.updateSelectionFromCells() ; }
	}

	return hasDeleted ;
} ;



// TODOC
// Delete current line
TextBuffer.prototype.deleteLine = function( getDeleted = false ) {
	var currentLine , inlineCount , fillerCount , hasNL , removedCells , deleted ;

	if ( this.forceInBound ) { this.moveInBound() ; }
	if ( this.cy >= this.buffer.length ) { return ; }

	if ( getDeleted ) {
		deleted = {
			count: this.getLineCharCount() ,
			string: this.getLineText()
		} ;
	}
	this.buffer.splice( this.cy , 1 ) ;

	if ( this.selectionRegion ) { this.updateSelectionFromCells() ; }

	return deleted ;
} ;



// TODOC
// Return an object with {x,y,cell}, containing the first cell matching the filter, or null if nothing was found.
// Also work backward if endX,endY are before startX,startY.
TextBuffer.prototype.findCell = function( cellFilterFn , startX = 0 , startY = 0 , endX = null , endY = null ) {
	if ( ! this.buffer.length ) { return ; }

	var x , y , cell , endX_ , startX_ ,
		reverse = endY !== null && ( endY < startY || ( endY === startY && endX !== null && endX < startX ) ) ;
	
	if ( ! reverse ) {
		// Forward search
		endY = endY !== null ? Math.min( endY , this.buffer.length - 1 ) :
			this.buffer.length - 1 ;

		for ( y = startY ; y <= endY ; y ++ ) {
			if ( this.buffer[ y ] ) {
				startX_ = y === startY ? Math.min( startX , this.buffer[ y ].length - 1 ) :
					0 ;
				endX_ = y === endY && endX !== null ? Math.min( endX , this.buffer[ y ].length - 1 ) :
					this.buffer[ y ].length - 1 ;

				for ( x = startX_ ; x <= endX_ ; x ++ ) {
					cell = this.buffer[ y ][ x ] ;
					if ( cellFilterFn( cell ) ) { return { x , y , cell } ; }
				}
			}
		}
	}
	else {
		// Backward search
		startY = Math.min( startY , this.buffer.length - 1 ) ;
		endY = Math.min( endY , this.buffer.length - 1 ) ;

		for ( y = startY ; y >= endY ; y -- ) {
			if ( this.buffer[ y ] ) {
				startX_ = y === startY ? Math.min( startX , this.buffer[ y ].length - 1 ) :
					this.buffer[ y ].length - 1 ;
				endX_ = y === endY && endX !== null ? Math.min( endX , this.buffer[ y ].length - 1 ) :
					0 ;

				for ( x = startX_ ; x >= endX_ ; x -- ) {
					cell = this.buffer[ y ][ x ] ;
					if ( cellFilterFn( cell ) ) { return { x , y , cell } ; }
				}
			}
		}
	}
	
	return null ;
} ;



// TODOC
// Return a region where the searchString is found
TextBuffer.prototype.findNext = function( searchString , startPosition , reverse ) {
	var index , startAt , endAt ,
		text = this.getText() ,
		// /!\ another function MUST BE used once unicode composition will be supported
		// It is meant to produce the exact same cell size
		size = string.unicode.toArray( searchString ).length ;

	reverse = !! reverse ;

	if ( reverse ) {
		startPosition = startPosition ? startPosition - size : text.length - size ;
	}
	else {
		startPosition = startPosition ?? 0 ;
	}

	index = reverse ? text.lastIndexOf( searchString , startPosition ) :
		text.indexOf( searchString , startPosition ) ;

	if ( index === -1 ) { return ; }

	startAt = this.offsetToCoordinate( index ) ;
	endAt = this.offsetToCoordinate( index + size - 1 ) ;

	return {
		xmin: startAt.x ,
		ymin: startAt.y ,
		xmax: endAt.x ,
		ymax: endAt.y
	} ;
} ;



// TODOC
TextBuffer.prototype.findPrevious = function( searchString , startPosition ) {
	return this.findNext( searchString , startPosition , true ) ;
} ;



// TODOC
// Return a region where the regexp match, the region also have a 'match' property with the result of the regexp#exec().
// Can't be reversed due to how regexp works, except by searching for all match beforehand
TextBuffer.prototype.regexpFindNext = function( regexp , startPosition = 0 ) {
	var index , startAt , endAt , size , match ,
		text = this.getText() ;

	if ( typeof regexp === 'string' ) {
		regexp = new RegExp( regexp , 'gu' ) ;
	}
	else {
		// Force global and unicode
		regexp.global = true ;
		regexp.unicode = true ;
	}

	regexp.lastIndex = startPosition ;

	match = regexp.exec( text ) ;

	if ( ! match ) { return ; }

	// /!\ another function MUST BE used once unicode composition will be supported
	// It is meant to produce the exact same cell size
	size = string.unicode.toArray( match[ 0 ] ).length ;

	startAt = this.offsetToCoordinate( match.index ) ;
	endAt = this.offsetToCoordinate( match.index + size - 1 ) ;

	return {
		xmin: startAt.x ,
		ymin: startAt.y ,
		xmax: endAt.x ,
		ymax: endAt.y ,
		match
	} ;
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
			inverseRegion: this.selectionRegion ,
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
	var srcRShift , srcX , srcXmax , srcExistingXmax , dstOffset , cells , cell , attr , char , charCode ,
		invRegion = p.context.inverseRegion ,
		invXmin = Infinity ,
		invXmax = -Infinity ;

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

		if ( invRegion && p.srcY >= invRegion.ymin && p.srcY <= invRegion.ymax ) {
			invXmin = p.srcY === invRegion.ymin ? invRegion.xmin : -Infinity ;
			invXmax = p.srcY === invRegion.ymax ? invRegion.xmax : Infinity ;
		}

		// Write existing cells
		for ( ; srcX <= srcExistingXmax ; srcX ++ , dstOffset += this.ScreenBuffer.prototype.ITEM_SIZE ) {
			if ( srcX < 0 ) { continue ; }	// right-shifted
			cell = cells[ srcX ] ;

			if ( p.context.forceChar ) {
				// Use a forced character (i.e. hidden)
				attr = cell.attr ;
				char = p.context.forceChar ;
			}
			else {
				attr =
					cell.width === 2 ? cell.attr | this.ScreenBuffer.prototype.LEADING_FULLWIDTH :
					cell.width === 0 ? cell.attr | this.ScreenBuffer.prototype.TRAILING_FULLWIDTH :
					cell.attr ;
				char =
					( ( charCode = cell.char.charCodeAt( 0 ) ) < 0x20 || charCode === 0x7f ) ? ' ' :
					cell.char ;
			}

			if ( srcX >= invXmin && srcX <= invXmax ) { attr = this.ScreenBuffer.attrInverse( attr ) ; }

			// Write the attributes
			p.context.writeAttr( p.context.dstBuffer , attr , dstOffset ) ;
			// Write the char
			p.context.dstBuffer.write( char , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
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

				attr =
					cell.width === 2 ? cell.attr | this.ScreenBuffer.prototype.LEADING_FULLWIDTH :
					cell.width === 0 ? cell.attr | this.ScreenBuffer.prototype.TRAILING_FULLWIDTH :
					cell.attr ;
				char =
					( ( charCode = cell.char.charCodeAt( 0 ) ) < 0x20 || charCode === 0x7f ) ? ' ' :
					cell.char ;

				// Write the attributes
				p.context.writeAttr( p.context.dstBuffer , attr , dstOffset ) ;
				// Write the char
				p.context.dstBuffer.write( char , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
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
// Using callback is DEPRECATED.
TextBuffer.prototype.load = async function( path , callback ) {
	var content ;

	this.buffer[ 0 ] = [] ;
	this.buffer.length = 1 ;

	// Naive file loading, should be optimized later
	try {
		content = await fs.promises.readFile( path ) ;
	}
	catch ( error ) {
		if ( callback ) { callback( error ) ; return ; }
		throw error ;
	}

	this.setText( content.toString() ) ;

	if ( callback ) { callback() ; return ; }
} ;



// Naive saving
// Using callback is DEPRECATED.
TextBuffer.prototype.save = async function( path , callback ) {
	// Naive file saving, optimization are for later
	try {
		await fs.promises.writeFile( path , this.getText() ) ;
	}
	catch ( error ) {
		if ( callback ) { callback( error ) ; return ; }
		throw error ;
	}

	if ( callback ) { callback() ; return ; }
} ;





/* Utilities */



TextBuffer.prototype.object2attr = function( attrObject , colorNameToIndex = this.palette?.colorNameToIndex , legacyColor = false ) {
	return this.ScreenBuffer.object2attr( attrObject , colorNameToIndex , legacyColor ) ;
} ;



// TODOC
// A small utility function that returns the coordinate one step backward, if needed it point to the end of the previous line
TextBuffer.prototype.oneStepBackward = function( x = this.cx , y = this.cy ) {
	x -- ;

	if ( x < 0 ) {
		y -- ;
		if ( y < 0 ) { return null ; }
		x = this.buffer[ y ].length - 1 ;
	}

	return { x , y } ;
} ;





/* API for the text-machine module */



TextBuffer.prototype.runStateMachine = function() {
	if ( ! this.stateMachine ) { return ; }

	this.stateMachine.reset() ;

	var checkpointDistance = 0 ;
	
	// DEBUG:
	var potentialCheckpointCount = 0 , checkpointCount = 0 ;

	this.iterate( { finalCall: true , fillerCopyAttr: true } , context => {
		context.textBuffer = this ;
		var isCheckpoint = this.stateMachine.pushEvent( context.text , context ) ;

		// Final call?
		if ( ! context.cell ) { return ; }

		// DEBUG:
		if ( isCheckpoint ) { potentialCheckpointCount ++ ; }

		if ( isCheckpoint && checkpointDistance >= this.stateMachineCheckpointDistance ) {
			let state = this.stateMachine.saveState() ;
			context.cell.checkpoint = state ;
			checkpointDistance = 0 ;

			// DEBUG:
			checkpointCount ++ ;
		}
		else {
			context.cell.checkpoint = null ;
		}
		
		checkpointDistance ++ ;
	} ) ;
	
	console.error( "Checkpoint count:" , checkpointCount , potentialCheckpointCount ) ;
} ;



TextBuffer.prototype.runStateMachineLocally = function( fromX , fromY ) {
	if ( ! this.stateMachine ) { return ; }
	
	var iterateOptions , previousCheckpoint ,
		checkpointDistance = 0 ,
		startX = 0 ,
		startY = 0 ;

	// DEBUG:
	var potentialCheckpointCount = 0 , checkpointCount = 0 ;

	// First, find a cell with a checkpoint
	previousCheckpoint = this.findCell( cell => cell.checkpoint , fromX , fromY , 0 , 0 ) ;

	if ( previousCheckpoint ) {
		startX = previousCheckpoint.x ;
		startY = previousCheckpoint.y ;
		this.stateMachine.restoreState( previousCheckpoint.cell.checkpoint ) ;
		console.error( ">> Restore previous checkpoint at:" , startX , startY , '(' , fromX , fromY , ')' ) ;
	}
	else {
		this.stateMachine.reset() ;
		console.error( ">> Can't find a restore point (" , fromX , fromY , ')' ) ;
	}

	iterateOptions = {
		x: startX ,
		y: startY ,
		finalCall: true ,
		fillerCopyAttr: true
	} ;
	
	this.iterate( iterateOptions , context => {
		context.textBuffer = this ;
		var isCheckpoint = this.stateMachine.pushEvent( context.text , context ) ;

		// Final call?
		if ( ! context.cell ) { return ; }

		// DEBUG:
		if ( isCheckpoint ) { potentialCheckpointCount ++ ; }

		if ( isCheckpoint ) {
			if (
				context.cell.checkpoint
				// Have we passed the local point?
				&& context.y > fromY || ( context.y === fromY && context.x > fromX )
				&& this.stateMachine.isStateEqualTo( context.cell.checkpoint )
			) {
				// We found a state saved on a cell, which is after local modification, and that is equal to the current state:
				// we don't have to continue further more, there will be no hilighting modification.
				console.error( ">>>> Found an equal checkpoint after!" , context.x , context.y ) ;
				return true ;
			}
			
			if ( checkpointDistance >= this.stateMachineCheckpointDistance ) {
				context.cell.checkpoint = this.stateMachine.saveState() ;
				checkpointDistance = 0 ;

				// DEBUG:
				checkpointCount ++ ;
			}
		}
		else {
			context.cell.checkpoint = null ;
		}
		
		checkpointDistance ++ ;
	} ) ;

	console.error( "Local checkpoint count:" , checkpointCount , potentialCheckpointCount ) ;
} ;



const TextMachineApi = {} ;
TextBuffer.TextMachineApi = TextMachineApi ;



TextMachineApi.style = ( context , style ) => {
	if ( ! context || context.x === null ) { return ; }	// This is a newline or end of buffer character, there is no style to apply here
	if ( ! style.code ) { style.code = context.textBuffer.ScreenBuffer.object2attr( style ) ; }	// cache it now

	context.textBuffer.setAttrCodeAt( style.code , context.x , context.y ) ;
} ;



TextMachineApi.blockStyle = function( startingContext , endingContext , style ) {
	if ( ! startingContext || ! endingContext || startingContext.x === null || endingContext.x === null ) { return ; }
	if ( ! style.code ) { style.code = startingContext.textBuffer.ScreenBuffer.object2attr( style ) ; }	// cache it now

	startingContext.textBuffer.setAttrCodeRegion( style.code , {
		xmin: startingContext.x ,
		xmax: endingContext.x ,
		ymin: startingContext.y ,
		ymax: endingContext.y
	} ) ;
} ;



TextMachineApi.hint = function( context , buffer , hints ) {
	if ( ! context || context.x === null || context.y === null ) { return ; }

	if ( hints[ buffer ] ) {
		let misc_ = context.textBuffer.getMiscAt( context.x , context.y ) ;
		if ( misc_ ) { misc_.hint = hints[ buffer ] ; }
	}
} ;

