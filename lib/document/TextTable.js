/*
	Terminal Kit

	Copyright (c) 2009 - 2020 Cédric Ronvel

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



const Element = require( './Element.js' ) ;
const TextBox = require( './TextBox.js' ) ;
const boxesChars = require( '../spChars.js' ).box ;



function TextTable( options = {} ) {
	Element.call( this , options ) ;

	this.cellContents = options.cellContents ;	// Should be an array of array of text
	this.textBoxes = null ;				// Same format: array of array of textBoxes
	this.rowCount = 0 ;
	this.columnCount = 0 ;

	this.rowHeights = [] ;
	this.columnWidths = [] ;

	this.textAttr = options.textAttr || { bgColor: 'default' } ;
	this.emptyAttr = options.emptyAttr || { bgColor: 'default' } ;

	this.expandToWidth = options.expandToWidth !== undefined ? !! options.expandToWidth : !! options.fit ;
	this.shrinkToWidth = options.shrinkToWidth !== undefined ? !! options.shrinkToWidth : !! options.fit ;
	this.expandToHeight = options.expandToHeight !== undefined ? !! options.expandToHeight : !! options.fit ;
	this.shrinkToHeight = options.shrinkToHeight !== undefined ? !! options.shrinkToHeight : !! options.fit ;
	this.wordwrap = options.wordwrap !== undefined ? !! options.wordwrap : !! options.fit ;

	this.hasBorder = options.hasBorder !== undefined ? !! options.hasBorder : true ;	// Default to true
	this.borderChars = options.borderChars || boxesChars.light ;

	if ( options.borderChars ) {
		if ( typeof options.borderChars === 'object' ) {
			this.borderChars = options.borderChars ;
		}
		else if ( typeof options.borderChars === 'string' && boxesChars[ options.borderChars ] ) {
			this.borderChars = boxesChars[ options.borderChars ] ;
		}
	}

	if ( options.textBoxKeyBindings ) { this.textBoxKeyBindings = options.textBoxKeyBindings ; }

	this.initChildren() ;
	this.computeCells() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'TextTable' && ! options.noDraw ) { this.draw() ; }
}

module.exports = TextTable ;

TextTable.prototype = Object.create( Element.prototype ) ;
TextTable.prototype.constructor = TextTable ;
TextTable.prototype.elementType = 'TextTable' ;



// Support for strictInline mode
TextTable.prototype.strictInlineSupport = true ;



TextTable.prototype.destroy = function( isSubDestroy ) {
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



TextTable.prototype.textBoxKeyBindings = TextBox.prototype.keyBindings ;



TextTable.prototype.initChildren = function() {
	var row , cellContent ;

	this.rowCount = this.cellContents.length ;
	this.columnCount = 0 ;
	this.textBoxes = [] ;

	var x = 0 , y = 0 ;

	for ( row of this.cellContents ) {
		this.textBoxes[ y ] = [] ;
		x = 0 ;

		for ( cellContent of row ) {
			if ( x >= this.columnCount ) { this.columnCount = x + 1 ; }
			this.textBoxes[ y ][ x ] = new TextBox( {
				parent: this ,
				content: cellContent ,
				//value: cellContent ,
				x: this.outputX ,
				y: this.outputY ,
				width: this.outputWidth ,
				height: this.outputHeight ,
				wordwrap: this.wordwrap ,
				//scrollable: !! this.scrollable ,
				//vScrollBar: !! this.vScrollBar ,
				//hScrollBar: !! this.hScrollBar ,
				//hiddenContent: this.hiddenContent ,
				textAttr: this.textAttr ,
				emptyAttr: this.emptyAttr ,
				keyBindings: this.textBoxKeyBindings ,
				noDraw: true
			} ) ;

			x ++ ;
		}

		y ++ ;
	}
} ;



TextTable.prototype.computeCells = function() {
	var shrinked = this.computeColumnWidths() ;

	if ( shrinked ) {
		this.textBoxesWordWrap() ;
		//this.computeColumnWidths() ;
	}

	this.computeRowHeights() ;
	this.textBoxesSizeAndPosition() ;
} ;



TextTable.prototype.computeColumnWidths = function() {
	var x , y , textBox , max , width ;

	this.contentWidth = + this.hasBorder ;	// +true = 1

	for ( x = 0 ; x < this.columnCount ; x ++ ) {
		max = 0 ;
		for ( y = 0 ; y < this.rowCount ; y ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;
			if ( ! textBox ) { continue ; }
			width = textBox.getContentSize().width ;
			if ( width > max ) { max = width ; }
		}
		this.columnWidths[ x ] = max ;
		this.contentWidth += max + this.hasBorder ;	// +true = 1
	}

	if ( this.expandToWidth && this.contentWidth < this.outputWidth ) {
		this.expand( this.contentWidth , this.outputWidth , this.columnWidths ) ;
	}
	else if ( this.shrinkToWidth && this.contentWidth > this.outputWidth ) {
		this.shrink( this.contentWidth , this.outputWidth , this.columnWidths ) ;
		return true ;
	}

	return false ;
} ;



TextTable.prototype.computeRowHeights = function() {
	var x , y , textBox , max , height ;

	this.contentHeight = + this.hasBorder ;	// +true = 1
	for ( y = 0 ; y < this.rowCount ; y ++ ) {
		max = 0 ;
		for ( x = 0 ; x < this.columnCount ; x ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;
			if ( ! textBox ) { continue ; }
			height = textBox.getContentSize().height ;
			if ( height > max ) { max = height ; }
		}
		this.rowHeights[ y ] = max ;
		this.contentHeight += max + this.hasBorder ;	// +true = 1
	}

	if ( this.expandToHeight && this.contentHeight < this.outputHeight ) {
		this.expand( this.contentHeight , this.outputHeight , this.rowHeights ) ;
	}
	else if ( this.shrinkToHeight && this.contentHeight > this.outputHeight ) {
		this.shrink( this.contentHeight , this.outputHeight , this.rowHeights ) ;
		return true ;
	}
} ;



// Expand an array of size
TextTable.prototype.expand = function( contentSize , outputSize , sizeArray ) {
	var x ,
		floatSize = 0 ,
		remainder = 0 ,
		count = sizeArray.length ,
		noBorderWantedSize = outputSize - ( this.hasBorder ? count + 1 : 0 ) ;

	if ( noBorderWantedSize <= 0 ) { return ; }

	var noBorderSize = contentSize - ( this.hasBorder ? count + 1 : 0 ) ,
		rate = noBorderWantedSize / noBorderSize ;

	// Adjust from left to right
	for ( x = 0 ; x < count ; x ++ ) {
		floatSize = sizeArray[ x ] * rate + remainder ;
		sizeArray[ x ] = Math.max( 1 , Math.round( floatSize ) ) ;
		remainder = floatSize - sizeArray[ x ] ;
	}
} ;



// Shrink an array of size
TextTable.prototype.shrink = function( contentSize , outputSize , sizeArray ) {
	var x , max ,
		secondMax = 0 ,
		maxIndexes = [] ,
		count = sizeArray.length ,
		floatColumnDelta , columnDelta , partialColumn ,
		delta = contentSize - outputSize ;

	//console.log( contentSize , outputSize , delta ) ;

	while ( delta > 0 ) {
		max = 0 ;
		secondMax = 0 ;

		for ( x = 0 ; x < count ; x ++ ) {
			if ( sizeArray[ x ] > max ) {
				secondMax = max ;
				max = sizeArray[ x ] ;
				maxIndexes.length = 0 ;
				maxIndexes.push( x ) ;
			}
			else if ( sizeArray[ x ] === max ) {
				maxIndexes.push( x ) ;
			}
			else if ( sizeArray[ x ] > secondMax ) {
				secondMax = sizeArray[ x ] ;
			}
		}

		floatColumnDelta = Math.min( max - secondMax , delta / maxIndexes.length ) ;
		columnDelta = Math.floor( floatColumnDelta ) ;

		if ( columnDelta >= 0 ) {
			for ( let index of maxIndexes ) {
				sizeArray[ index ] -= columnDelta ;
				delta -= columnDelta ;
			}
		}

		if ( columnDelta !== floatColumnDelta ) {
			partialColumn = delta % maxIndexes.length ;
			for ( let i = 0 ; i < maxIndexes.length && i < partialColumn ; i ++ ) {
				sizeArray[ maxIndexes[ i ] ] -- ;
			}
			delta -= partialColumn ;
		}
	}
} ;



TextTable.prototype.textBoxesWordWrap = function() {
	var x , y , textBox ;

	for ( y = 0 ; y < this.rowCount ; y ++ ) {
		for ( x = 0 ; x < this.columnCount ; x ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;

			if ( textBox ) {
				textBox.setSizeAndPosition( {
					outputX: this.outputX ,
					outputY: this.outputY ,
					outputWidth: this.columnWidths[ x ] ,
					outputHeight: this.outputHeight
				} ) ;
			}
		}
	}
} ;



TextTable.prototype.textBoxesSizeAndPosition = function() {
	var x , y , outputX , outputY , textBox ;

	outputY = this.outputY + 1 ;

	for ( y = 0 ; y < this.rowCount ; y ++ ) {
		outputX = this.outputX + 1 ;

		for ( x = 0 ; x < this.columnCount ; x ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;

			if ( textBox ) {
				textBox.setSizeAndPosition( {
					outputX ,
					outputY ,
					outputWidth: this.columnWidths[ x ] ,
					outputHeight: this.rowHeights[ y ]
				} ) ;
			}

			outputX += this.columnWidths[ x ] + 1 ;
		}

		outputY += this.rowHeights[ y ] + 1 ;
	}
} ;



TextTable.prototype.preDrawSelf = function() {
//TextTable.prototype.postDrawSelf = function() {
	var i , j , x , y ;

	//console.log( this.columnWidths , this.rowHeights , this.columnCount , this.rowCount ) ;

	y = this.outputY ;

	for ( j = 0 ; j < this.rowHeights.length ; j ++ ) {
		x = this.outputX ;

		for ( i = 0 ; i < this.columnWidths.length ; i ++ ) {
			// For each cell...

			// ... draw the top-left corner
			this.outputDst.put( { x , y } ,
				j ?
					( i ? this.borderChars.cross : this.borderChars.leftTee ) :
					( i ? this.borderChars.topTee : this.borderChars.topLeft )
			) ;

			// ... draw the left border
			this.outputDst.put( { x , y: y + 1 , direction: 'down' } , this.borderChars.vertical.repeat( this.rowHeights[ j ] ) ) ;
			x ++ ;

			// ... draw the top border
			this.outputDst.put( { x , y } , this.borderChars.horizontal.repeat( this.columnWidths[ i ] ) ) ;
			x += this.columnWidths[ i ] ;
		}

		// Draw the top-right corner only for the last cell
		this.outputDst.put( { x , y } , j ? this.borderChars.rightTee : this.borderChars.topRight ) ;

		// Draw the right border only for the last cell
		this.outputDst.put( { x , y: y + 1 , direction: 'down' } , this.borderChars.vertical.repeat( this.rowHeights[ j ] ) ) ;
		y += this.rowHeights[ j ] + 1 ;
	}


	// Only for the last row, we have to draw the bottom border and corners
	x = this.outputX ;

	for ( i = 0 ; i < this.columnWidths.length ; i ++ ) {
		// For each bottom cells...

		// ... draw the bottom-left corner
		this.outputDst.put( { x , y } , i ? this.borderChars.bottomTee : this.borderChars.bottomLeft ) ;
		x ++ ;

		// ... draw the bottom border
		this.outputDst.put( { x , y } , this.borderChars.horizontal.repeat( this.columnWidths[ i ] ) ) ;
		x += this.columnWidths[ i ] ;
	}

	// Draw the bottom-right corner only for the last cell of the last row
	this.outputDst.put( { x , y } , this.borderChars.bottomRight ) ;
} ;

