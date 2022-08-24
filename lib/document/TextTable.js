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



const Element = require( './Element.js' ) ;
const TextBox = require( './TextBox.js' ) ;
const boxesChars = require( '../spChars.js' ).box ;



function TextTable( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	Element.call( this , options ) ;

	this.cellContents = options.cellContents ;	// Should be an array of array of text

	// This replace .contentWidth/.contentHeight for cell-only size (without shrinking/expanding/fitting)
	this.rawContentWidth = 0 ;
	this.rawContentHeight = 0 ;

	this.contentHasMarkup = options.contentHasMarkup ;

	this.textBoxes = null ;				// Same format: array of array of textBoxes
	this.rowCount = 0 ;
	this.columnCount = 0 ;

	this.rowHeights = [] ;
	this.columnWidths = [] ;

	this.textAttr = options.textAttr || { bgColor: 'default' } ;
	this.voidAttr = options.voidAttr || options.emptyAttr || null ;

	this.firstRowTextAttr = options.firstRowTextAttr || null ;
	this.firstRowVoidAttr = options.firstRowVoidAttr || null ;
	this.evenRowTextAttr = options.evenRowTextAttr || null ;
	this.evenRowVoidAttr = options.evenRowVoidAttr || null ;

	this.firstColumnTextAttr = options.firstColumnTextAttr || null ;
	this.firstColumnVoidAttr = options.firstColumnVoidAttr || null ;
	this.evenColumnTextAttr = options.evenColumnTextAttr || null ;
	this.evenColumnVoidAttr = options.evenColumnVoidAttr || null ;

	this.firstCellTextAttr = options.firstCellTextAttr || null ;
	this.firstCellVoidAttr = options.firstCellVoidAttr || null ;

	// When rowNumber AND columnNumber are both even
	this.evenCellTextAttr = options.evenCellTextAttr || null ;
	this.evenCellVoidAttr = options.evenCellVoidAttr || null ;

	// Checker-like: when rowNumber + columnNumber is even
	this.checkerEvenCellTextAttr = options.checkerEvenCellTextAttr || null ;
	this.checkerEvenCellVoidAttr = options.checkerEvenCellVoidAttr || null ;

	/*
	// Select attr
	// /!\ NOT IMPLEMENTED YET /!\
	// Would allow one to navigate the table (it could be useful for making editable cells)
	this.selectedTextAttr = options.selectedTextAttr || null ;
	this.selectedVoidAttr = options.selectedVoidAttr || null ;
	this.selectable = options.selectable || null ;	// Can be 'row', 'column' or 'cell'
	this.selectedX = this.selectedY = 0 ;
	*/

	this.expandToWidth = options.expandToWidth !== undefined ? !! options.expandToWidth : !! options.fit ;
	this.shrinkToWidth = options.shrinkToWidth !== undefined ? !! options.shrinkToWidth : !! options.fit ;
	this.expandToHeight =
		options.expandToHeight !== undefined ? !! options.expandToHeight :
		! options.height ? false :
		!! options.fit ;
	this.shrinkToHeight =
		options.shrinkToHeight !== undefined ? !! options.shrinkToHeight :
		! options.height ? false :
		!! options.fit ;
	this.wordWrap = options.wordWrap !== undefined || options.wordwrap !== undefined ?
		!! ( options.wordWrap || options.wordwrap ) : !! options.fit ;
	this.lineWrap = this.wordWrap || ( options.lineWrap !== undefined ? !! options.lineWrap : !! options.fit ) ;

	this.hasBorder = options.hasBorder !== undefined ? !! options.hasBorder : true ;	// Default to true
	this.borderAttr = options.borderAttr || this.textAttr ;
	this.borderChars = boxesChars.light ;

	if ( typeof options.borderChars === 'object' ) {
		this.borderChars = boxesChars.__fix__( options.borderChars ) ;
	}
	else if ( typeof options.borderChars === 'string' && boxesChars[ options.borderChars ] ) {
		this.borderChars = boxesChars[ options.borderChars ] ;
	}

	if ( options.textBoxKeyBindings ) { this.textBoxKeyBindings = options.textBoxKeyBindings ; }

	this.initChildren() ;
	this.computeCells() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'TextTable' && ! options.noDraw ) { this.draw() ; }
}

module.exports = TextTable ;
Element.inherit( TextTable ) ;



// Support for strictInline mode
TextTable.prototype.strictInlineSupport = true ;
TextTable.prototype.staticInline = true ;
TextTable.prototype.inlineResizeToContent = true ;



TextTable.prototype.textBoxKeyBindings = TextBox.prototype.keyBindings ;



TextTable.prototype.setCellContent = function( x , y , content , dontDraw = false , dontUpdateLayout = false ) {
	var textBox = this.textBoxes[ y ] && this.textBoxes[ y ][ x ] ;

	// We don't add cell, it should already exists
	if ( ! textBox ) { return ; }

	// Save cell content
	this.cellContents[ y ][ x ] = content ;
	textBox.setContent( content , this.contentHasMarkup , true ) ;

	if ( ! dontUpdateLayout ) {
		this.computeCells() ;
		if ( ! dontDraw ) { this.draw() ; }
	}
	else {
		if ( ! dontDraw ) { textBox.draw() ; }
	}
} ;



TextTable.prototype.setCellAttr = function( x , y , textAttr , voidAttr , dontDraw = false ) {
	var textBox = this.textBoxes[ y ] && this.textBoxes[ y ][ x ] ;
	if ( ! textBox ) { return ; }

	if ( voidAttr === undefined ) { voidAttr = textAttr ; }

	textBox.setAttr( textAttr , voidAttr , dontDraw ) ;
} ;



TextTable.prototype.resetCellAttr = function( x , y , dontDraw = false ) {
	var textBox = this.textBoxes[ y ] && this.textBoxes[ y ][ x ] ;
	if ( ! textBox ) { return ; }

	var textAttr = this.getTextAttrForCell( x , y ) ,
		voidAttr = this.getVoidAttrForCell( x , y , textAttr ) ;

	textBox.setAttr( textAttr , voidAttr , dontDraw ) ;
} ;



TextTable.prototype.setRowAttr = function( y , textAttr , voidAttr , dontDraw = false ) {
	for ( let x = 0 ; x < this.columnCount ; x ++ ) { this.setCellAttr( x , y , textAttr , voidAttr , true ) ; }
	if ( ! dontDraw ) { this.draw() ; }
} ;



TextTable.prototype.resetRowAttr = function( y , dontDraw = false ) {
	for ( let x = 0 ; x < this.columnCount ; x ++ ) { this.resetCellAttr( x , y , true ) ; }
	if ( ! dontDraw ) { this.draw() ; }
} ;



TextTable.prototype.setColumnAttr = function( x , textAttr , voidAttr , dontDraw = false ) {
	for ( let y = 0 ; y < this.rowCount ; y ++ ) { this.setCellAttr( x , y , textAttr , voidAttr , true ) ; }
	if ( ! dontDraw ) { this.draw() ; }
} ;



TextTable.prototype.resetColumnAttr = function( x , dontDraw = false ) {
	for ( let y = 0 ; y < this.rowCount ; y ++ ) { this.resetCellAttr( x , y , true ) ; }
	if ( ! dontDraw ) { this.draw() ; }
} ;



TextTable.prototype.setTableAttr = function( textAttr , voidAttr , dontDraw = false ) {
	for ( let y = 0 ; y < this.rowCount ; y ++ ) {
		for ( let x = 0 ; x < this.columnCount ; x ++ ) { this.setCellAttr( x , y , textAttr , voidAttr , true ) ; }
	}

	if ( ! dontDraw ) { this.draw() ; }
} ;



TextTable.prototype.resetTableAttr = function( dontDraw = false ) {
	for ( let y = 0 ; y < this.rowCount ; y ++ ) {
		for ( let x = 0 ; x < this.columnCount ; x ++ ) { this.resetCellAttr( x , y , true ) ; }
	}

	if ( ! dontDraw ) { this.draw() ; }
} ;



TextTable.prototype.getTextAttrForCell = function( x , y ) {
	return this.firstCellTextAttr && ! x && ! y  ?  this.firstCellTextAttr  :
		this.firstRowTextAttr && ! y  ?  this.firstRowTextAttr  :
		this.firstColumnTextAttr && ! x  ?  this.firstColumnTextAttr  :
		this.evenCellTextAttr && ! ( x % 2 ) && ! ( y % 2 )  ?  this.evenCellTextAttr  :
		this.checkerEvenCellTextAttr && ! ( ( x + y ) % 2 )  ?  this.checkerEvenCellTextAttr  :
		this.evenRowTextAttr && ! ( y % 2 )  ?  this.evenRowTextAttr  :
		this.evenColumnTextAttr && ! ( y % 2 )  ?  this.evenColumnTextAttr  :
		this.textAttr ;
} ;



TextTable.prototype.getVoidAttrForCell = function( x , y , textAttr ) {
	return this.firstCellVoidAttr && ! x && ! y  ?  this.firstCellVoidAttr  :
		this.firstRowVoidAttr && ! y  ?  this.firstRowVoidAttr  :
		this.firstColumnVoidAttr && ! x  ?  this.firstColumnVoidAttr  :
		this.evenCellVoidAttr && ! ( x % 2 ) && ! ( y % 2 )  ?  this.evenCellVoidAttr  :
		this.checkerEvenCellVoidAttr && ! ( ( x + y ) % 2 )  ?  this.checkerEvenCellVoidAttr  :
		this.evenRowVoidAttr && ! ( y % 2 )  ?  this.evenRowVoidAttr  :
		this.evenColumnVoidAttr && ! ( y % 2 )  ?  this.evenColumnVoidAttr  :
		this.voidAttr || textAttr ;
} ;



TextTable.prototype.initChildren = function() {
	var row , cellContent , textAttr , voidAttr ;

	this.rowCount = this.cellContents.length ;
	this.columnCount = 0 ;
	this.textBoxes = [] ;

	var x = 0 , y = 0 ;

	for ( row of this.cellContents ) {
		this.textBoxes[ y ] = [] ;
		x = 0 ;

		for ( cellContent of row ) {
			if ( x >= this.columnCount ) { this.columnCount = x + 1 ; }

			textAttr = this.getTextAttrForCell( x , y ) ;
			voidAttr = this.getVoidAttrForCell( x , y , textAttr ) ;

			this.textBoxes[ y ][ x ] = new TextBox( {
				internal: true ,
				parent: this ,
				content: cellContent ,
				contentHasMarkup: this.contentHasMarkup ,
				//value: cellContent ,
				x: this.outputX ,
				y: this.outputY ,
				width: this.outputWidth ,
				height: this.outputHeight ,
				lineWrap: this.lineWrap ,
				wordWrap: this.wordWrap ,
				//scrollable: !! this.scrollable ,
				//vScrollBar: !! this.vScrollBar ,
				//hScrollBar: !! this.hScrollBar ,
				//hiddenContent: this.hiddenContent ,
				textAttr ,
				voidAttr ,
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

	this.rawContentWidth = + this.hasBorder ;	// +true = 1

	for ( x = 0 ; x < this.columnCount ; x ++ ) {
		max = 0 ;
		for ( y = 0 ; y < this.rowCount ; y ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;
			if ( ! textBox ) { continue ; }
			width = textBox.getContentSize().width || 1 ;
			if ( width > max ) { max = width ; }
		}
		this.columnWidths[ x ] = max ;
		this.rawContentWidth += max + this.hasBorder ;	// +true = 1
	}

	this.contentWidth = this.rawContentWidth ;

	if ( this.expandToWidth && this.rawContentWidth < this.outputWidth ) {
		this.expand( this.rawContentWidth , this.outputWidth , this.columnWidths ) ;
		this.contentWidth = this.outputWidth ;
	}
	else if ( this.shrinkToWidth && this.rawContentWidth > this.outputWidth ) {
		this.shrink( this.rawContentWidth , this.outputWidth , this.columnWidths ) ;
		this.contentWidth = this.outputWidth ;
		return true ;
	}

	return false ;
} ;



TextTable.prototype.computeRowHeights = function() {
	var x , y , textBox , max , height ;

	this.rawContentHeight = + this.hasBorder ;	// +true = 1

	for ( y = 0 ; y < this.rowCount ; y ++ ) {
		max = 0 ;
		for ( x = 0 ; x < this.columnCount ; x ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;
			if ( ! textBox ) { continue ; }
			height = textBox.getContentSize().height || 1 ;
			if ( height > max ) { max = height ; }
		}
		this.rowHeights[ y ] = max ;
		this.rawContentHeight += max + this.hasBorder ;	// +true = 1
	}

	this.contentHeight = this.rawContentHeight ;

	if ( this.expandToHeight && this.rawContentHeight < this.outputHeight ) {
		this.expand( this.rawContentHeight , this.outputHeight , this.rowHeights ) ;
		this.contentHeight = this.outputHeight ;
	}
	else if ( this.shrinkToHeight && this.rawContentHeight > this.outputHeight ) {
		this.shrink( this.rawContentHeight , this.outputHeight , this.rowHeights ) ;
		this.contentHeight = this.outputHeight ;
		return true ;
	}

	return false ;
} ;



// Expand an array of size, using proportional expansion
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



// Shrink an array of size, larger are shrinked first
TextTable.prototype.shrink = function( contentSize , outputSize , sizeArray ) {
	var x , max ,
		secondMax = 0 ,
		maxIndexes = [] ,
		count = sizeArray.length ,
		floatColumnDelta , columnDelta , partialColumn ,
		delta = contentSize - outputSize ;

	while ( delta > 0 ) {
		max = 0 ;
		secondMax = 0 ;
		maxIndexes.length = 0 ;

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

		// We can't shrink anymore
		// /!\ we should probably test that before entering the loop!
		if ( ! max ) { return ; }

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

	outputY = this.outputY + this.hasBorder ;

	for ( y = 0 ; y < this.rowCount ; y ++ ) {
		outputX = this.outputX + this.hasBorder ;

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

			outputX += this.columnWidths[ x ] + this.hasBorder ;
		}

		outputY += this.rowHeights[ y ] + this.hasBorder ;
	}
} ;



TextTable.prototype.preDrawSelf = function() {
	// This only draw the frame/border
	if ( ! this.hasBorder ) { return ; }

	var i , j , x , y ;

	y = this.outputY ;

	for ( j = 0 ; j < this.rowHeights.length ; j ++ ) {
		x = this.outputX ;

		for ( i = 0 ; i < this.columnWidths.length ; i ++ ) {
			// For each cell...

			// ... draw the top-left corner
			this.outputDst.put( { x , y , attr: this.borderAttr } ,
				j ?
					( i ? this.borderChars.cross : this.borderChars.leftTee ) :
					( i ? this.borderChars.topTee : this.borderChars.topLeft )
			) ;

			// ... draw the left border
			this.outputDst.put( {
				x , y: y + 1 , direction: 'down' , attr: this.borderAttr
			} , this.borderChars.vertical.repeat( this.rowHeights[ j ] ) ) ;
			x ++ ;

			// ... draw the top border
			this.outputDst.put( { x , y , attr: this.borderAttr } , this.borderChars.horizontal.repeat( this.columnWidths[ i ] ) ) ;
			x += this.columnWidths[ i ] ;
		}

		// Draw the top-right corner only for the last cell
		this.outputDst.put( { x , y , attr: this.borderAttr } , j ? this.borderChars.rightTee : this.borderChars.topRight ) ;

		// Draw the right border only for the last cell
		this.outputDst.put( {
			x , y: y + 1 , direction: 'down' , attr: this.borderAttr
		} , this.borderChars.vertical.repeat( this.rowHeights[ j ] ) ) ;
		y += this.rowHeights[ j ] + 1 ;
	}


	// Only for the last row, we have to draw the bottom border and corners
	x = this.outputX ;

	for ( i = 0 ; i < this.columnWidths.length ; i ++ ) {
		// For each bottom cells...

		// ... draw the bottom-left corner
		this.outputDst.put( { x , y , attr: this.borderAttr } , i ? this.borderChars.bottomTee : this.borderChars.bottomLeft ) ;
		x ++ ;

		// ... draw the bottom border
		this.outputDst.put( { x , y , attr: this.borderAttr } , this.borderChars.horizontal.repeat( this.columnWidths[ i ] ) ) ;
		x += this.columnWidths[ i ] ;
	}

	// Draw the bottom-right corner only for the last cell of the last row
	this.outputDst.put( { x , y , attr: this.borderAttr } , this.borderChars.bottomRight ) ;
} ;

