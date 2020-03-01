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



TextTable.prototype.computeColumnWidths = function() {
	var x , y , textBox , max , width ;
	
	for ( x = 0 ; x < this.columnCount ; x ++ ) {
		max = 0 ;
		for ( y = 0 ; y < this.rowCount ; y ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;
			if ( ! textBox ) { continue ; }
			width = textBox.getContentSize().width ;
			if ( width > max ) { max = width ; }
		}
		this.columnWidths[ x ] = max ;
	}
} ;



TextTable.prototype.computeRowHeights = function() {
	var x , y , textBox , max , height ;
	
	for ( y = 0 ; y < this.rowCount ; y ++ ) {
		max = 0 ;
		for ( x = 0 ; x < this.columnCount ; x ++ ) {
			textBox = this.textBoxes[ y ][ x ] ;
			if ( ! textBox ) { continue ; }
			height = textBox.getContentSize().height ;
			if ( height > max ) { max = height ; }
		}
		this.rowHeights[ y ] = max ;
	}
} ;



TextTable.prototype.preDrawSelf = function() {
//TextTable.prototype.postDrawSelf = function() {
	var i , j , x , y ,
		outerWidth = this.columnWidths.reduce( ( c , w ) => c + w + 1 , 1 ) ,
		outerHeight = this.rowHeights.reduce( ( c , w ) => c + w + 1 , 1 ) ;
	
	//console.log( outerWidth , outerHeight , this.columnWidths , this.rowHeights ) ;
	//console.log( this.columnCount , this.rowCount ) ;
	
	y = this.outputY ;

	for ( j = 0 ; j < this.rowHeights.length ; j ++ ) {
		x = this.outputX ;
		
		for ( i = 0 ; i < this.columnWidths.length ; i ++ ) {
			this.outputDst.put( { x , y } ,
				j ? 
					( i ? this.boxChars.cross : this.boxChars.leftTee ) :
					( i ? this.boxChars.topTee : this.boxChars.topLeft )
			) ;
			x ++ ;
			this.outputDst.put( { x , y } , this.boxChars.horizontal.repeat( this.columnWidths[ i ] ) ) ;
			x += this.columnWidths[ i ] ;
		}

		this.outputDst.put( { x , y } , j ? this.boxChars.rightTee : this.boxChars.topRight ) ;
		y += this.rowHeights[ j ] + 1 ;
	}
	

	x = this.outputX ;

	for ( i = 0 ; i < this.columnWidths.length ; i ++ ) {
		this.outputDst.put( { x , y } , i ? this.boxChars.bottomTee : this.boxChars.bottomLeft ) ;
		x ++ ;
		this.outputDst.put( { x , y } , this.boxChars.horizontal.repeat( this.columnWidths[ i ] ) ) ;
		x += this.columnWidths[ i ] ;
	}

	this.outputDst.put( { x , y } , this.boxChars.bottomRight ) ;
} ;

