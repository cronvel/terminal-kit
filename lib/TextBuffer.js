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

const FILLER_CHAR = '\x00' ;



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

	this.textBuffer = [ [] ] ;
	this.attrBuffer = [ [] ] ;
	this.miscBuffer = [ [] ] ;

	if ( options.hidden ) { this.setHidden( options.hidden ) ; }
}

module.exports = TextBuffer ;



// Backward compatibility
TextBuffer.create = ( ... args ) => new TextBuffer( ... args ) ;



var termkit = require( './termkit.js' ) ;



TextBuffer.prototype.getText = function getText() {
	return this.textBuffer.map( line => string.unicode.fromCells( line ) ).join( '\n' ) ;
} ;



TextBuffer.prototype.setText = function setText( text ) {
	var lines = text.split( '\n' ) ;

	this.textBuffer.length = lines.length ;
	this.attrBuffer.length = lines.length ;
	this.miscBuffer.length = lines.length ;

	lines.forEach( ( line , index ) => {
		var characters = string.unicode.toCells( line , FILLER_CHAR , this.tabWidth ) ;

		this.textBuffer[ index ] = characters ;
		this.attrBuffer[ index ] = characters.length  ?  new Array( characters.length ).fill( this.emptyCellAttr )  :  []  ;
		this.miscBuffer[ index ] = [] ;
	} ) ;
} ;



TextBuffer.prototype.setHidden = function setHidden( value ) {
	this.hidden = typeof value === 'string' && value.length ? value[ 0 ] : ( value ? termkit.spChars.password : false ) ;	// eslint-disable-line
} ;

TextBuffer.prototype.getHidden = function getHidden() { return this.hidden ; } ;



TextBuffer.prototype.getContentSize = function getContentSize() {
	return {
		width: Math.max( 1 , ... this.textBuffer.map( line => line.length ) ) ,
		height: this.textBuffer.length
	} ;
} ;



// /!\ Use the 'startAt' parameter!!! /!\

// Same as tab() but work on both textBuffer and attrBuffer, at the current cursor position
TextBuffer.prototype.tabLine = function tabLine( startAt = 0 ) {
	var line , length , char , tabCells = false , index ;

	if ( this.textBuffer[ this.cy ] === undefined ) { this.textBuffer[ this.cy ] = [] ; }
	if ( this.attrBuffer[ this.cy ] === undefined ) { this.attrBuffer[ this.cy ] = [] ; }
	if ( this.miscBuffer[ this.cy ] === undefined ) { this.miscBuffer[ this.cy ] = [] ; }

	line = this.textBuffer[ this.cy ] ;
	length = line.length ;

	for ( index = startAt ; index < length ; index ++ ) {
		char = line[ index ] ;


		// -------------------------- here

		//if ( tabCells ) {}

		if ( char === '\t' ) {
			tabCells = true ;
		}
	}

	/*
	this.textBuffer[ this.cy ] = this.textBuffer[ this.cy ].replace( /(\t|\x00)(\x00*)/g ,

		( match , tabChar , nullChars , originalIndex ) => {

			var localShift , fillSize = 0 , pos , nullCharsLength , index ;

			nullCharsLength = nullChars ? nullChars.length : 0 ;
			index = originalIndex + shift ;	// we should shift the index depending on previous change on the string

			tabChar = tabChar === '\t' ;
			if ( tabChar ) { fillSize = this.tabWidth - ( index % this.tabWidth ) - 1 ; }	// Do not count the tab itself
			else { nullCharsLength ++ ; }

			localShift = fillSize - nullCharsLength ;	// Adjust the shift
			shift += localShift ;

			if ( originalIndex < originalCx ) { this.cx += localShift ; }

			if ( localShift > 0 ) {
				pos = tabChar ? index + this.width - localShift : index ;

				this.attrBuffer[ this.cy ] =
					this.attrBuffer[ this.cy ].slice( 0 , pos ).concat(
						//array.fill( new Array( localShift ) , this.attrBuffer[ this.cy ][ index ] ) ,
						new Array( localShift ).fill( this.attrBuffer[ this.cy ][ index ] ) ,
						this.attrBuffer[ this.cy ].slice( pos )
					) ;

				this.miscBuffer[ this.cy ] =
					this.miscBuffer[ this.cy ].slice( 0 , pos ).concat(
						//array.fill( new Array( localShift ) , null ) ,
						new Array( localShift ).fill( null ) ,
						this.miscBuffer[ this.cy ].slice( pos )
					) ;
			}
			else if ( localShift < 0 ) {
				pos = tabChar ? index + this.width + localShift : index ;
				this.attrBuffer[ this.cy ].splice( pos , -localShift ) ;
				this.miscBuffer[ this.cy ].splice( pos , -localShift ) ;
			}

			return ( tabChar ? '\t' : '' ) + string.repeat( FILLER_CHAR , fillSize ) ;
		}
	) ;
	*/
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
	if ( ! this.attrBuffer[ y ] ) { this.attrBuffer[ y ] = [] ; }
	this.attrBuffer[ y ][ x ] = attr ;
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

	ymax = Math.min( region.ymax , this.textBuffer.length - 1 ) ;

	for ( y = region.ymin ; y <= ymax ; y ++ ) {
		if ( ! this.textBuffer[ y ] ) { this.textBuffer[ y ] = '' ; }
		if ( ! this.attrBuffer[ y ] ) { this.attrBuffer[ y ] = [] ; }

		xmin = y === region.ymin ? region.xmin : 0 ;
		xmax = y === region.ymax ? Math.min( region.xmax , this.textBuffer[ y ].length - 1 ) : this.textBuffer[ y ].length - 1 ;

		for ( x = xmin ; x <= xmax ; x ++ ) {
			this.attrBuffer[ y ][ x ] = attr ;
		}
	}
} ;



TextBuffer.prototype.getMisc = function getMisc() {
	if ( ! this.miscBuffer[ this.cy ] ) { this.miscBuffer[ this.cy ] = [] ; }
	if ( ! this.miscBuffer[ this.cy ][ this.cx ] ) { this.miscBuffer[ this.cy ][ this.cx ] = {} ; }
	return this.miscBuffer[ this.cy ][ this.cx ] ;
} ;



TextBuffer.prototype.getMiscAt = function getMiscAt( x , y ) {
	if ( ! this.miscBuffer[ y ] ) { this.miscBuffer[ y ] = [] ; }
	if ( ! this.miscBuffer[ y ][ x ] ) { this.miscBuffer[ y ][ x ] = {} ; }
	return this.miscBuffer[ y ][ x ] ;
} ;



TextBuffer.prototype.iterate = function iterate( options , callback ) {
	var x , y , offset , length ;

	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }

	if ( ! this.textBuffer.length ) { return ; }

	offset = 0 ;
	y = 0 ;

	for ( ;; ) {
		if ( this.textBuffer[ y ] ) {
			length = this.textBuffer[ y ].length ;

			for ( x = 0 ; x < length ; x ++ ) {
				if ( this.textBuffer[ y ][ x ] === FILLER_CHAR ) { continue ; }

				callback( {
					offset: offset ,
					x: x ,
					y: y ,
					text: this.textBuffer[ y ][ x ] ,
					attr: this.attrBuffer[ y ][ x ] ,
					misc: this.miscBuffer[ y ][ x ]
				} ) ;

				offset ++ ;
			}
		}

		// Another iteration?
		if ( y + 1 >= this.textBuffer.length ) { break ; }

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

	if ( justSkipFiller && ( ! this.textBuffer[ this.cy ] || this.textBuffer[ this.cy ][ this.cx ] !== FILLER_CHAR ) ) { return ; }

	for ( ;; ) {
		this.cx ++ ;

		if ( ! this.textBuffer[ this.cy ] || this.cx > this.textBuffer[ this.cy ].length ) {
			if ( this.cy + 1 < this.textBuffer.length || ! this.forceInBound ) {
				this.cy ++ ;
				this.cx = 0 ;
			}
			else {
				this.cx = oldCx ;
			}

			break ;
		}

		if ( ! this.textBuffer[ this.cy ] || this.textBuffer[ this.cy ][ this.cx ] !== FILLER_CHAR ) { break ; }
	}

	if ( this.forceInBound ) { this.moveInBound() ; }
} ;



TextBuffer.prototype.moveBackward = function moveBackward( justSkipFiller ) {
	var lineLength ;

	if ( justSkipFiller && ( ! this.textBuffer[ this.cy ] || this.textBuffer[ this.cy ][ this.cx ] !== FILLER_CHAR ) ) { return ; }

	for ( ;; ) {
		lineLength = this.textBuffer[ this.cy ] ? this.textBuffer[ this.cy ].length : 0 ;

		if ( this.cx > lineLength ) { this.cx = lineLength ; }
		else { this.cx -- ; }

		if ( this.cx < 0 ) {
			this.cy -- ;

			if ( this.cy < 0 ) { this.cy = 0 ; this.cx = 0 ; break ; }

			lineLength = this.textBuffer[ this.cy ] ? this.textBuffer[ this.cy ].length : 0 ;
			this.cx = lineLength ;
			break ;
		}

		if ( ! this.textBuffer[ this.cy ] || this.textBuffer[ this.cy ][ this.cx ] !== FILLER_CHAR ) { break ; }
	}

	if ( this.forceInBound ) { this.moveInBound() ; }
} ;



TextBuffer.prototype.moveToEndOfLine = function moveToEndOfLine() {
	this.cx = this.textBuffer[ this.cy ] ? this.textBuffer[ this.cy ].length : 0 ;
} ;



TextBuffer.prototype.moveInBound = function moveInBound( ignoreCx ) {
	if ( this.cy > this.textBuffer.length ) { this.cy = this.textBuffer.length ; }

	if ( ignoreCx ) { return ; }

	if ( ! this.textBuffer[ this.cy ] ) { this.cx = 0 ; }
	else if ( this.cx > this.textBuffer[ this.cy ].length ) { this.cx = this.textBuffer[ this.cy ].length ; }
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
	var currentLineLength , attrArray , miscArray , tabIndex , filler ;

	this.moveForward( true ) ;	// just skip filler char

	// Should come after moving forward
	var characters = string.unicode.toCells( text , FILLER_CHAR , this.tabWidth , this.cx ) ;

	if ( this.textBuffer[ this.cy ] === undefined ) { this.textBuffer[ this.cy ] = [] ; }
	if ( this.attrBuffer[ this.cy ] === undefined ) { this.attrBuffer[ this.cy ] = [] ; }
	if ( this.miscBuffer[ this.cy ] === undefined ) { this.miscBuffer[ this.cy ] = [] ; }

	currentLineLength = this.textBuffer[ this.cy ].length ;


	// Check if attrBuffer is okey
	if ( currentLineLength !== this.attrBuffer[ this.cy ].length || currentLineLength !== this.miscBuffer[ this.cy ].length ) {
		this.fixBuffers( this.cy ) ;
	}


	// Create the attribute array to insert
	//attrArray = array.fill( new Array( characters.length ) , attr ) ;
	//miscArray = array.fill( new Array( characters.length ) , null ) ;
	attrArray = new Array( characters.length ).fill( attr ) ;
	miscArray = new Array( characters.length ).fill( null ) ;


	// Apply
	if ( this.cx === currentLineLength ) {
		this.textBuffer[ this.cy ].push( ... characters ) ;
		this.attrBuffer[ this.cy ].push( ... attrArray ) ;
		this.miscBuffer[ this.cy ].push( ... miscArray ) ;
	}
	else if ( this.cx < currentLineLength ) {
		this.textBuffer[ this.cy ].splice( this.cx , 0 , ... characters ) ;
		this.attrBuffer[ this.cy ].splice( this.cx , 0 , ... attrArray ) ;
		this.miscBuffer[ this.cy ].splice( this.cx , 0 , ... miscArray ) ;

		/*
		this.textBuffer[ this.cy ] =
			this.textBuffer[ this.cy ].slice( 0 , this.cx ) +
			text +
			this.textBuffer[ this.cy ].slice( this.cx ) ;

		this.attrBuffer[ this.cy ] =
			this.attrBuffer[ this.cy ].slice( 0 , this.cx ).concat(
				attrArray ,
				this.attrBuffer[ this.cy ].slice( this.cx )
			) ;

		this.miscBuffer[ this.cy ] =
			this.miscBuffer[ this.cy ].slice( 0 , this.cx ).concat(
				miscArray ,
				this.miscBuffer[ this.cy ].slice( this.cx )
			) ;
		*/
	}
	else {
		// if ( this.cx > currentLineLength )
		filler = new Array( this.cx - currentLineLength ).fill( ' ' ) ;
		this.textBuffer[ this.cy ].push( ... filler , ... characters ) ;
		filler.fill( this.emptyCellAttr ) ;
		this.attrBuffer[ this.cy ].push( ... filler , ... attrArray ) ;
		filler.fill( null ) ;
		this.miscBuffer[ this.cy ].push( ... filler , ... miscArray ) ;

		/*
		this.textBuffer[ this.cy ] += string.repeat( ' ' , this.cx - currentLineLength ) + text ;

		this.attrBuffer[ this.cy ] =
			this.attrBuffer[ this.cy ].concat(
				//array.fill( new Array( this.cx - currentLineLength ) , this.emptyCellAttr ) ,
				new Array( this.cx - currentLineLength ).fill( this.emptyCellAttr ) ,
				attrArray
			) ;

		this.miscBuffer[ this.cy ] =
			this.miscBuffer[ this.cy ].concat(
				//array.fill( new Array( this.cx - currentLineLength ) , null ) ,
				new Array( this.cx - currentLineLength ).fill( null ) ,
				miscArray
			) ;
		*/
	}

	// Patch tab if needed
	tabIndex = this.textBuffer[ this.cy ].indexOf( '\t' , this.cx ) ;
	this.cx += characters.length ;
	if ( filler ) { this.cx += filler.length ; }
	if ( tabIndex !== -1 ) { this.tabLine( tabIndex ) ; }
} ;



// /!\ Bug with tabs and count > 1 !!! /!\

// Delete chars
TextBuffer.prototype.delete = function delete_( count ) {
	var inlineCount , tabIndex ;

	if ( count === undefined ) { count = 1 ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	if ( this.textBuffer[ this.cy ] && this.textBuffer[ this.cy ][ this.cx ] === FILLER_CHAR ) {
		this.moveBackward( true ) ;	// just skip filler char
		count -- ;
	}

	while ( count > 0 ) {
		// If we are already at the end of the buffer...
		if ( this.cy >= this.textBuffer.length ||
			( this.cy === this.textBuffer.length - 1 && this.cx >= this.textBuffer[ this.cy ].length ) ) {
			return ;
		}

		if ( this.textBuffer[ this.cy ] ) {
			if ( this.attrBuffer[ this.cy ] === undefined ) { this.attrBuffer[ this.cy ] = [] ; }
			if ( this.miscBuffer[ this.cy ] === undefined ) { this.miscBuffer[ this.cy ] = [] ; }

			// Check if attrBuffer is okey
			if ( this.textBuffer[ this.cy ].length !== this.attrBuffer[ this.cy ].length ||
				this.textBuffer[ this.cy ].length !== this.miscBuffer[ this.cy ].length ) {
				this.fixBuffers( this.cy ) ;
			}

			// If the cursor is too far away, move it at the end of the line
			if ( this.cx > this.textBuffer[ this.cy ].length ) { this.cx = this.textBuffer[ this.cy ].length ; }

			// Compute inline delete
			//inlineCount = Math.min( count , this.textBuffer[ this.cy ].length - this.cx ) ;
			inlineCount = this.countInlineForward( count ) ;

			// Apply inline delete
			if ( inlineCount > 0 ) {
				this.textBuffer[ this.cy ].splice( this.cx , inlineCount ) ;
				this.attrBuffer[ this.cy ].splice( this.cx , inlineCount ) ;
				this.miscBuffer[ this.cy ].splice( this.cx , inlineCount ) ;

				/*
				this.textBuffer[ this.cy ] =
					this.textBuffer[ this.cy ].slice( 0 , this.cx ) +
					this.textBuffer[ this.cy ].slice( this.cx + inlineCount ) ;

				this.attrBuffer[ this.cy ] =
					this.attrBuffer[ this.cy ].slice( 0 , this.cx ).concat(
						this.attrBuffer[ this.cy ].slice( this.cx + inlineCount )
					) ;

				this.miscBuffer[ this.cy ] =
					this.miscBuffer[ this.cy ].slice( 0 , this.cx ).concat(
						this.miscBuffer[ this.cy ].slice( this.cx + inlineCount )
					) ;
				*/
			}

			count -= inlineCount ;
		}

		if ( count > 0 ) {
			this.joinLine( true ) ;
			count -- ;
		}
	}

	// Patch tab if needed
	//tabIndex = this.textBuffer[ this.cy ].indexOf( '\t' , this.cx ) ;
	//if ( tabIndex !== -1 ) { this.tabLine( tabIndex ) ; }
	this.tabLine( tabIndex ) ;	// Do it every time, before finding a better way to do it
} ;



// /!\ Bug with tabs and count > 1 !!! /!\

// Delete backward chars
TextBuffer.prototype.backDelete = function backDelete( count ) {
	var inlineCount , tabIndex ;

	if ( count === undefined ) { count = 1 ; }

	if ( this.forceInBound ) { this.moveInBound() ; }

	if ( this.textBuffer[ this.cy ] && this.cx && this.textBuffer[ this.cy ][ this.cx - 1 ] === FILLER_CHAR ) {
		this.moveBackward( true ) ;	// just skip filler char
		//count -- ;	// do not downcount: the cursor is always on a \x00 before deleting a \t
	}

	while ( count > 0 ) {
		// If we are already at the begining of the buffer...
		if ( this.cy === 0 && this.cx === 0 ) { return ; }

		if ( this.textBuffer[ this.cy ] ) {
			if ( this.attrBuffer[ this.cy ] === undefined ) { this.attrBuffer[ this.cy ] = [] ; }
			if ( this.miscBuffer[ this.cy ] === undefined ) { this.miscBuffer[ this.cy ] = [] ; }

			// Check if attrBuffer is okey
			if ( this.textBuffer[ this.cy ].length !== this.attrBuffer[ this.cy ].length ||
				this.textBuffer[ this.cy ].length !== this.miscBuffer[ this.cy ].length ) {
				this.fixBuffers( this.cy ) ;
			}

			// If the cursor is to far away, move it at the end of the line, it will cost one 'count'
			if ( this.cx > this.textBuffer[ this.cy ].length ) {
				this.cx = this.textBuffer[ this.cy ].length ;
				count -- ;
			}

			// Compute inline delete
			inlineCount = this.countInlineBackward( count ) ;

			// Apply inline delete
			if ( inlineCount > 0 ) {
				this.textBuffer[ this.cy ].splice( this.cx - inlineCount , inlineCount ) ;
				this.attrBuffer[ this.cy ].splice( this.cx - inlineCount , inlineCount ) ;
				this.miscBuffer[ this.cy ].splice( this.cx - inlineCount , inlineCount ) ;

				/*
				this.textBuffer[ this.cy ] =
					this.textBuffer[ this.cy ].slice( 0 , this.cx - inlineCount ) +
					this.textBuffer[ this.cy ].slice( this.cx ) ;

				this.attrBuffer[ this.cy ] =
					this.attrBuffer[ this.cy ].slice( 0 , this.cx - inlineCount ).concat(
						this.attrBuffer[ this.cy ].slice( this.cx )
					) ;

				this.miscBuffer[ this.cy ] =
					this.miscBuffer[ this.cy ].slice( 0 , this.cx - inlineCount ).concat(
						this.miscBuffer[ this.cy ].slice( this.cx )
					) ;
				*/

				this.cx -= inlineCount ;
			}

			count -= inlineCount ;
		}

		if ( count > 0 ) {
			this.cy -- ;
			this.cx = this.textBuffer[ this.cy ] ? this.textBuffer[ this.cy ].length : 0 ;
			this.joinLine( true ) ;
			count -- ;
		}
	}

	// Patch tab if needed
	//tabIndex = this.textBuffer[ this.cy ].indexOf( '\t' , this.cx ) ;
	//if ( tabIndex !== -1 ) { this.tabLine( tabIndex ) ; }
	this.tabLine( tabIndex ) ;	// Do it every time, before finding a better way to do it
} ;



// Fix a backward counter, get an additional count for each null char encountered
TextBuffer.prototype.countInlineBackward = function countInlineBackward( count ) {
	var c , x ;

	for ( x = this.cx - 1 , c = 0 ; x >= 0 && c < count ; x -- , c ++ ) {
		if ( this.textBuffer[ this.cy ][ x ] === FILLER_CHAR ) { count ++ ; }
	}

	return c ;
} ;



// Fix a forward counter, get an additional count for each null char encountered
TextBuffer.prototype.countInlineForward = function countInlineForward( count ) {
	var c , x , xMax = this.textBuffer[ this.cy ].length ;

	for ( x = this.cx , c = 0 ; x < xMax && c < count ; x ++ , c ++ ) {
		if ( this.textBuffer[ this.cy ][ x ] === FILLER_CHAR ) { count ++ ; }
	}

	return c ;
} ;



TextBuffer.prototype.newLine = function newLine( internalCall ) {
	var currentLineLength , nextTextLine = '' , nextAttrLine = [] , nextMiscLine = [] , tabIndex ;

	if ( ! internalCall && this.forceInBound ) { this.moveInBound() ; }

	if ( this.textBuffer[ this.cy ] === undefined ) { this.textBuffer[ this.cy ] = [] ; }
	if ( this.attrBuffer[ this.cy ] === undefined ) { this.attrBuffer[ this.cy ] = [] ; }
	if ( this.miscBuffer[ this.cy ] === undefined ) { this.miscBuffer[ this.cy ] = [] ; }

	currentLineLength = this.textBuffer[ this.cy ].length ;


	// Check if attrBuffer is okey
	if ( currentLineLength !== this.attrBuffer[ this.cy ].length || currentLineLength !== this.miscBuffer[ this.cy ].length ) {
		this.fixBuffers( this.cy ) ;
	}


	// Apply
	if ( this.cx < currentLineLength ) {
		nextTextLine = this.textBuffer[ this.cy ].slice( this.cx ) ;
		this.textBuffer[ this.cy ] = this.textBuffer[ this.cy ].slice( 0 , this.cx ) ;

		nextAttrLine = this.attrBuffer[ this.cy ].slice( this.cx ) ;
		this.attrBuffer[ this.cy ] = this.attrBuffer[ this.cy ].slice( 0 , this.cx ) ;

		nextMiscLine = this.miscBuffer[ this.cy ].slice( this.cx ) ;
		this.miscBuffer[ this.cy ] = this.miscBuffer[ this.cy ].slice( 0 , this.cx ) ;
	}

	this.textBuffer.splice( this.cy + 1 , 0 , nextTextLine ) ;
	this.attrBuffer.splice( this.cy + 1 , 0 , nextAttrLine ) ;
	this.miscBuffer.splice( this.cy + 1 , 0 , nextMiscLine ) ;

	this.cx = 0 ;
	this.cy ++ ;

	// Patch tab if needed
	if ( ! internalCall ) {
		tabIndex = this.textBuffer[ this.cy ].indexOf( '\t' , this.cx ) ;
		if ( tabIndex !== -1 ) { this.tabLine( tabIndex ) ; }
	}
} ;



TextBuffer.prototype.joinLine = function joinLine( internalCall ) {
	var tabIndex ;

	if ( ! internalCall && this.forceInBound ) { this.moveInBound() ; }

	if ( this.textBuffer[ this.cy ] === undefined ) { this.textBuffer[ this.cy ] = [] ; }
	if ( this.textBuffer[ this.cy + 1 ] === undefined ) { this.textBuffer[ this.cy + 1 ] = [] ; }
	if ( this.attrBuffer[ this.cy ] === undefined ) { this.attrBuffer[ this.cy ] = [] ; }
	if ( this.attrBuffer[ this.cy + 1 ] === undefined ) { this.attrBuffer[ this.cy + 1 ] = [] ; }
	if ( this.miscBuffer[ this.cy ] === undefined ) { this.miscBuffer[ this.cy ] = [] ; }
	if ( this.miscBuffer[ this.cy + 1 ] === undefined ) { this.miscBuffer[ this.cy + 1 ] = [] ; }


	// Check if attrBuffer is okey
	if ( this.textBuffer[ this.cy ].length !== this.attrBuffer[ this.cy ].length ||
		this.textBuffer[ this.cy ].length !== this.miscBuffer[ this.cy ].length ) {
		this.fixBuffers( this.cy ) ;
	}

	if ( this.textBuffer[ this.cy + 1 ].length !== this.attrBuffer[ this.cy + 1 ].length ||
		this.textBuffer[ this.cy + 1 ].length !== this.miscBuffer[ this.cy + 1 ].length ) {
		this.fixBuffers( this.cy + 1 ) ;
	}

	this.cx = this.textBuffer[ this.cy ].length ;

	this.textBuffer[ this.cy ] = this.textBuffer[ this.cy ].concat( this.textBuffer[ this.cy + 1 ] ) ;
	//this.textBuffer[ this.cy ] += this.textBuffer[ this.cy + 1 ] ;
	this.attrBuffer[ this.cy ] = this.attrBuffer[ this.cy ].concat( this.attrBuffer[ this.cy + 1 ] ) ;
	this.miscBuffer[ this.cy ] = this.miscBuffer[ this.cy ].concat( this.miscBuffer[ this.cy + 1 ] ) ;

	this.textBuffer.splice( this.cy + 1 , 1 ) ;
	this.attrBuffer.splice( this.cy + 1 , 1 ) ;
	this.miscBuffer.splice( this.cy + 1 , 1 ) ;

	// Patch tab if needed
	if ( ! internalCall ) {
		tabIndex = this.textBuffer[ this.cy ].indexOf( '\t' , this.cx ) ;
		if ( tabIndex !== -1 ) { this.tabLine( tabIndex ) ; }
	}
} ;



TextBuffer.prototype.fixBuffers = function fixBuffers( y ) {
	// Something was wrong, try to fix that now
	//console.error( "attrBuffer and/or miscBuffer is fucked up at line " + y + ", fixing it now..." ) ;

	var currentLineTextLength = this.textBuffer[ y ].length ;
	var currentLineAttrLength = this.attrBuffer[ y ].length ;
	var currentLineMiscLength = this.miscBuffer[ y ].length ;

	if ( currentLineTextLength > currentLineAttrLength ) {
		this.attrBuffer[ y ] = this.attrBuffer[ y ].concat(
			//array.fill( new Array( currentLineTextLength - currentLineAttrLength ) , this.emptyCellAttr )
			new Array( currentLineTextLength - currentLineAttrLength ).fill( this.emptyCellAttr )
		) ;
	}
	else {
		this.attrBuffer[ y ] = this.attrBuffer[ y ].slice( 0 , currentLineTextLength ) ;
	}

	if ( currentLineTextLength > currentLineMiscLength ) {
		this.miscBuffer[ y ] = this.miscBuffer[ y ].concat(
			//array.fill( new Array( currentLineTextLength - currentLineMiscLength ) , null )
			new Array( currentLineTextLength - currentLineMiscLength ).fill( null )
		) ;
	}
	else {
		this.miscBuffer[ y ] = this.miscBuffer[ y ].slice( 0 , currentLineTextLength ) ;
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
			srcTextBuffer: this.textBuffer ,
			srcAttrBuffer: this.attrBuffer ,
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
	var srcX , srcExistingXmax , dstOffset , attrs , attr , chars , char , charCode ;

	//if ( ! global.deb ) { global.deb = [] ; }
	//global.deb.push( p ) ;

	chars = p.context.srcTextBuffer[ p.srcY ] || [] ;
	attrs = p.context.srcAttrBuffer[ p.srcY ] || [] ;

	srcExistingXmax = p.srcXmax ;

	if ( srcExistingXmax >= chars.length ) { srcExistingXmax = chars.length - 1 ; }

	srcX = p.srcXmin ;
	dstOffset = p.dstStart ;

	// Write existing chars
	for ( ; srcX <= srcExistingXmax ; srcX ++ , dstOffset += this.ScreenBuffer.prototype.ITEM_SIZE ) {
		attr = attrs[ srcX ] ;
		char = chars[ srcX ] ;
		charCode = char.charCodeAt( 0 ) ;

		// Write the attributes
		p.context.writeAttr( p.context.dstBuffer , attr , dstOffset ) ;

		if ( charCode < 0x20 || charCode === 0x7f ) {
			// Replace the control char by a white space
			p.context.dstBuffer.write( ' ' , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
		}
		else {
			// Write the character
			p.context.dstBuffer.write( char , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
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
	var srcX , srcExistingXmax , dstOffset , attrs , attr , chars , char ;

	//if ( ! global.deb ) { global.deb = [] ; }
	//global.deb.push( p ) ;

	char = p.context.char ;
	chars = p.context.srcTextBuffer[ p.srcY ] || [] ;
	attrs = p.context.srcAttrBuffer[ p.srcY ] || [] ;

	srcExistingXmax = p.srcXmax ;

	if ( srcExistingXmax >= chars.length ) { srcExistingXmax = chars.length - 1 ; }

	srcX = p.srcXmin ;
	dstOffset = p.dstStart ;

	// Write existing chars, turn them into the hidden char
	for ( ; srcX <= srcExistingXmax ; srcX ++ , dstOffset += this.ScreenBuffer.prototype.ITEM_SIZE ) {
		attr = attrs[ srcX ] ;

		// Write the attributes
		p.context.writeAttr( p.context.dstBuffer , attr , dstOffset ) ;

		// Write the character
		p.context.dstBuffer.write( char , dstOffset + this.ScreenBuffer.prototype.ATTR_SIZE , this.ScreenBuffer.prototype.CHAR_SIZE ) ;
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
	/*
	this.textBuffer = [] ;
	this.attrBuffer = [[]] ;
	this.miscBuffer = [[]] ;
	*/

	this.textBuffer[ 0 ] = [] ;
	this.textBuffer.length = 1 ;

	this.attrBuffer[ 0 ] = [] ;
	this.attrBuffer.length = 1 ;

	this.miscBuffer[ 0 ] = [] ;
	this.miscBuffer.length = 1 ;

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



