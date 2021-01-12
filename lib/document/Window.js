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



const Element = require( './Element.js' ) ;
const Container = require( './Container.js' ) ;
const boxesChars = require( '../spChars.js' ).box ;



function Window( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	if ( options.movable === undefined ) { options.movable = true ; }
	if ( options.title ) { options.content = options.title ; }
	if ( options.titleHasMarkup ) { options.contentHasMarkup = options.titleHasMarkup ; }

	Container.call( this , options ) ;

	this.boxChars = boxesChars.double ;

	if ( options.boxChars ) {
		if ( typeof options.boxChars === 'object' ) {
			this.boxChars = options.boxChars ;
		}
		else if ( typeof options.boxChars === 'string' && boxesChars[ options.boxChars ] ) {
			this.boxChars = boxesChars[ options.boxChars ] ;
		}
	}

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Window' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Window ;

Window.prototype = Object.create( Container.prototype ) ;
Window.prototype.constructor = Window ;
Window.prototype.elementType = 'Window' ;

Window.prototype.containerBorderSize = 1 ;



Window.prototype.preDrawSelf = function() {
	var y , title , titleWidth ,
		titleMaxWidth = this.outputWidth - 8 ;

	// Draw the top border
	if ( this.content && titleMaxWidth >= 1 ) {
		title = Element.truncateContent( this.content , titleMaxWidth , this.contentHasMarkup ) ;
		titleWidth = Element.getLastTruncateWidth() ;

		this.outputDst.put(
			{ x: this.outputX , y: this.outputY , markup: this.contentHasMarkup } ,
			this.boxChars.topLeft + this.boxChars.horizontal
			+ '[' + title + ']'
			+ this.boxChars.horizontal.repeat( this.outputWidth - 5 - titleWidth )
			+ this.boxChars.topRight
		) ;
	}
	else {
		this.outputDst.put(
			{ x: this.outputX , y: this.outputY } ,
			this.boxChars.topLeft + this.boxChars.horizontal.repeat( this.outputWidth - 2 ) + this.boxChars.topRight
		) ;
	}

	// Draw the bottom border
	this.outputDst.put(
		{ x: this.outputX , y: this.outputY + this.outputHeight - 1 } ,
		this.boxChars.bottomLeft + this.boxChars.horizontal.repeat( this.outputWidth - 2 ) + this.boxChars.bottomRight
	) ;

	// Draw the left and right border
	for ( y = this.outputY + 1 ; y < this.outputY + this.outputHeight - 1 ; y ++ ) {
		this.outputDst.put( { x: this.outputX , y: y } , this.boxChars.vertical ) ;
		this.outputDst.put( { x: this.outputX + this.outputWidth - 1 , y: y } , this.boxChars.vertical ) ;
	}

	Container.prototype.preDrawSelf.call( this ) ;
} ;



// Allow only the top-border/title-bar to be draggable?
//Window.prototype.onDrag = function( data ) { Container.prototype.onDrag.call( this , data ) ; } ;

