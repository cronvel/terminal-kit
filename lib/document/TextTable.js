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

	//this.computed = {} ;
	this.boxesContainer = {} ;
	this.boxChars = boxesChars.light ;

	this.textAttr = options.textAttr || { bgColor: 'default' } ;
	this.emptyAttr = options.emptyAttr || { bgColor: 'default' } ;

	if ( options.textBoxKeyBindings ) { this.textBoxKeyBindings = options.textBoxKeyBindings ; }

	if ( options.boxChars ) {
		if ( typeof options.boxChars === 'object' ) {
			this.boxChars = options.boxChars ;
		}
		else if ( typeof options.boxChars === 'string' && boxesChars[ options.boxChars ] ) {
			this.boxChars = boxesChars[ options.boxChars ] ;
		}
	}
	
	this.initChildren() ;
	this.computeCells() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'TextTable' && ! options.noDraw ) { this.draw() ; }
}

module.exports = TextTable ;

TextTable.prototype = Object.create( Element.prototype ) ;
TextTable.prototype.constructor = TextTable ;
TextTable.prototype.elementType = 'TextTable' ;



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
	var x , y , outputX , outputY , textBox ;
	
	this.computeColumnWidths() ;
	this.computeRowHeights() ;
	
	outputY = this.outputY + 1 ;

	for ( y = 0 ; y < this.columnCount ; y ++ ) {
		outputX = this.outputX + 1 ;
		
		for ( x = 0 ; x < this.rowCount ; x ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;
			
			textBox.setSizeAndPosition( {
				outputX ,
				outputY ,
				outputWidth: this.columnWidths[ y ] ,
				outputHeight: this.rowHeights[ x ]
			} ) ;

			outputX += this.columnWidths[ x ] + 1 ;
		}

		outputY += this.rowHeights[ y ] + 1 ;
	}
} ;



TextTable.prototype.computeColumnWidths = function() {
	var x , y , textBox , max , width ;
	
	for ( y = 0 ; y < this.columnCount ; y ++ ) {
		max = 0 ;
		for ( x = 0 ; x < this.rowCount ; x ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;
			if ( ! textBox ) { continue ; }
			width = textBox.getContentSize().width ;
			if ( width > max ) { max = width ; }
		}
		this.columnWidths[ y ] = max ;
	}
} ;



TextTable.prototype.computeRowHeights = function() {
	var x , y , textBox , max , height ;
	
	for ( x = 0 ; x < this.rowCount ; x ++ ) {
		max = 0 ;
		for ( y = 0 ; y < this.columnCount ; y ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;
			if ( ! textBox ) { continue ; }
			height = textBox.getContentSize().height ;
			if ( height > max ) { max = height ; }
		}
		this.rowHeights[ x ] = max ;
	}
} ;



TextTable.prototype.preDrawSelf = function() {
//TextTable.prototype.postDrawSelf = function() {
	var y ,
		outerWidth = this.columnWidths.reduce( ( c , w ) => c + w + 1 , 1 ) ,
		outerHeight = this.rowHeights.reduce( ( c , w ) => c + w + 1 , 1 ) ;
	
	//console.log( outerWidth , outerHeight , this.columnWidths , this.rowHeights ) ;
	//console.log( this.columnCount , this.rowCount ) ;
	
	// Draw the top border
	this.outputDst.put(
		{ x: this.outputX , y: this.outputY } ,
		this.boxChars.topLeft + this.boxChars.horizontal.repeat( outerWidth - 2 ) + this.boxChars.topRight
	) ;

	// Draw the bottom border
	this.outputDst.put(
		{ x: this.outputX , y: this.outputY + outerHeight - 1 } ,
		this.boxChars.bottomLeft + this.boxChars.horizontal.repeat( outerWidth - 2 ) + this.boxChars.bottomRight
	) ;

	// Draw the left and right border
	for ( y = this.outputY + 1 ; y <= this.outputY + outerHeight - 2 ; y ++ ) {
		this.outputDst.put( { x: this.outputX , y: y } , this.boxChars.vertical ) ;
		this.outputDst.put( { x: this.outputX + outerWidth - 1 , y: y } , this.boxChars.vertical ) ;
	}
} ;





// Useful???

TextTable.prototype.drawColumn = function( computed , tees , last ) {
	var y ;

	if ( ! last ) {
		// Draw Tee-junction
		this.drawTee( computed.xmax , computed.ymin , 'top' , tees ) ;
		this.drawTee( computed.xmax , computed.ymax , 'bottom' , tees ) ;

		// Draw the right border
		for ( y = computed.ymin + 1 ; y < computed.ymax ; y ++ ) {
			this.outputDst.put( { x: computed.xmax , y: y } , this.boxChars.vertical ) ;
		}
	}

	this.drawRecursive( computed , tees ) ;
} ;



TextTable.prototype.drawTee = function( x , y , type , tees ) {
	var key = x + ':' + y ;

	if ( ! tees[ key ] ) {
		this.outputDst.put( { x: x , y: y } , this.boxChars[ type + 'Tee' ] ) ;
		tees[ key ] = type ;
	}
	else if ( tees[ key ] !== type ) {
		this.outputDst.put( { x: x , y: y } , this.boxChars.cross ) ;
	}
} ;



TextTable.prototype.drawRow = function( computed , tees , last ) {
	if ( ! last ) {
		// Draw Tee-junction
		this.drawTee( computed.xmin , computed.ymax , 'left' , tees ) ;
		this.drawTee( computed.xmax , computed.ymax , 'right' , tees ) ;

		// Draw the bottom border
		this.outputDst.put( { x: computed.xmin + 1 , y: computed.ymax } , this.boxChars.horizontal.repeat( computed.dx - 1 ) ) ;
	}

	this.drawRecursive( computed , tees ) ;
} ;

