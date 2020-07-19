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
const builtinBarChars = require( '../spChars.js' ).bar ;



function Bar( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	Element.call( this , options ) ;

	this.minValue = + options.minValue || 0 ;
	this.maxValue = options.maxValue !== undefined ? + options.maxValue || 0 : 1 ;
	this.value = + options.value || 0 ;

	if ( this.value < this.minValue ) { this.value = this.minValue ; }
	else if ( this.value > this.maxValue ) { this.value = this.maxValue ; }

	this.borderAttr = options.borderAttr || { bgColor: 'gray' , color: 'brightWhite' } ;
	this.bodyAttr = options.bodyAttr || { bgColor: 'gray' , color: 'brightWhite' } ;
	this.barChars = builtinBarChars.classic ;
	
	if ( typeof options.barChars === 'object' ) {
        this.barChars = options.barChars ;
    }
    else if ( typeof options.barChars === 'string' && builtinBarChars[ options.barChars ] ) {
        this.barChars = builtinBarChars[ options.barChars ] ;
    }

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Bar' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Bar ;

Bar.prototype = Object.create( Element.prototype ) ;
Bar.prototype.constructor = Bar ;
Bar.prototype.elementType = 'Bar' ;



Bar.prototype.destroy = function( isSubDestroy ) {
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



Bar.prototype.preDrawSelf = function() {
	var str , x , fullCells , emptyCells , partialCellRate , partialCell ,
		innerSize = this.outputWidth - 2 ,
		rate = this.value - this.minValue / ( this.maxValue - this.minValue ) ;

	if ( ! rate || rate < 0 ) { rate = 0 ; }
	else if ( rate > 1 ) { rate = 1 ; }

	fullCells = Math.floor( rate * innerSize ) ,
	emptyCells = innerSize - fullCells - 1 ,
	partialCellRate = ( rate * innerSize - fullCells ) ;

	if ( this.barChars.body.length <= 2 ) {
		// There is no chars for partial cell, so use either full or empty
		partialCell = this.barChars.body[ rate < 0.5 ? 1 : 0 ] ;
	}
	else {
		partialCell = this.barChars.body[ 1 + Math.floor( rate * ( this.barChars.body.length - 2 ) ) ] ;
	}

	str = this.barChars.border[ 0 ]
		+ this.barChars.body[ 0 ].repeat( fullCells )
		+ partialCell
		+ this.barChars.body[ this.barChars.body.length - 1 ].repeat( emptyCells )
		+ this.barChars.border[ 1 ] ;

	x = this.outputX ;
	this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.bodyAttr , markup: true } , str ) ;
} ;



Bar.prototype.setValue = function( value , internalAndNoDraw ) {
	this.value = + value || 0 ;

	if ( this.value < this.minValue ) { this.value = this.minValue ; }
	else if ( this.value > this.maxValue ) { this.value = this.maxValue ; }
	
	if ( ! internalAndNoDraw ) { this.draw() ; }
} ;

