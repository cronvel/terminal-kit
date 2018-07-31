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



const Element = require( './Element.js' ) ;
const BaseMenu = require( './BaseMenu.js' ) ;
const Button = require( './Button.js' ) ;



// Inherit from BaseMenu for common methods

function ColumnMenu( options = {} ) {
	if ( ! options.outputWidth && ! options.width ) {
		if ( options.parent ) {
			options.outputWidth = Math.min( options.parent.inputWidth , options.parent.outputWidth ) ;
		}
		else if ( options.inlineTerm ) {
			options.outputWidth = options.inlineTerm.width ;
		}
	}

	options.height = options.items && options.items.length ;

	BaseMenu.call( this , options , defaultOptions ) ;
	
	this.blurLeftPadding = options.blurLeftPadding || options.leftPadding || '' ;
	this.blurRightPadding = options.blurRightPadding || options.rightPadding || '' ;
	this.focusLeftPadding = options.focusLeftPadding || options.leftPadding || '' ;
	this.focusRightPadding = options.focusRightPadding || options.rightPadding || '' ;
	this.paddingHasMarkup = !! options.paddingHasMarkup ;

	this.initChildren() ;
	
	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'ColumnMenu' ) { this.draw() ; }
}

module.exports = ColumnMenu ;

ColumnMenu.prototype = Object.create( BaseMenu.prototype ) ;
ColumnMenu.prototype.constructor = ColumnMenu ;
ColumnMenu.prototype.elementType = 'ColumnMenu' ;



const defaultOptions = {
	buttonFocusAttr: { bgColor: 'white' , color: 'black' , bold: true } ,
	buttonBlurAttr: { bgColor: 'black' , color: 'white' , bold: true }
} ;



ColumnMenu.prototype.inlineNewLine = true ;



ColumnMenu.prototype.destroy = function destroy( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



ColumnMenu.prototype.keyBindings = {
	//LEFT: 'previous' ,
	//RIGHT: 'next' ,
	UP: 'previous' ,
	DOWN: 'next' ,
	KP_ENTER: 'submit' ,
	ENTER: 'submit'
} ;



// Create Buttons automatically
ColumnMenu.prototype.initChildren = function initChildren() {
	var buttonsMaxWidth = 0 , buttonPaddingWidth , buttonOffsetX , buttonOffsetY ;

	if ( ! this.itemsDef.length ) { return ; }
	
	buttonPaddingWidth =
		Math.max(
			Element.computeContentWidth( this.blurLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.focusLeftPadding , this.paddingHasMarkup )
		) + Math.max(
			Element.computeContentWidth( this.blurRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.focusRightPadding , this.paddingHasMarkup )
		) ;

	this.itemsDef.forEach( def => {
		def.buttonContent = def.content ;
		def.contentHasMarkup = def.contentHasMarkup || def.markup ;
		
		var contentWidth = buttonPaddingWidth + Element.computeContentWidth( def.content , def.contentHasMarkup ) ;
		var overflow = buttonPaddingWidth + contentWidth - this.outputWidth ;
		
		if ( overflow > this.outputWidth ) {
			if ( overflow > contentWidth ) {
				// Error case here, wont fix
				def.buttonContent = this.contentEllipsis ;
				contentWidth = Element.computeContentWidth( def.buttonContent , def.contentHasMarkup ) ;
			}
			else {
				// /!\ IN PROGRESS!!! --- need misc.markupTruncateString()
				def.buttonContent = def.content
			}
			
			def.width = this.outputWidth ;
		}
		
		def.width = buttonPaddingWidth + contentWidth ;
		
		if ( def.width > buttonsMaxWidth ) { buttonsMaxWidth = def.width ; }
	} ) ;
	
	//buttonSpacing = Math.floor( ( this.outputWidth - buttonsTextWidth ) / ( this.itemsDef.length ) ) ;
	//buttonSpacing = 1 ;

	buttonOffsetX = 0 ;
	buttonOffsetY = 0 ;

	this.itemsDef.forEach( ( def , index ) => {
		this.buttons[ index ] = new Button( {
			parent: this ,
			content: def.content + ' '.repeat( buttonsMaxWidth - def.width ) ,
			contentHasMarkup: def.contentHasMarkup ,
			value: def.value ,
			outputX: this.outputX + buttonOffsetX ,
			outputY: this.outputY + buttonOffsetY ,
			focusAttr: def.focusAttr || this.buttonFocusAttr ,
			blurAttr: def.blurAttr || this.buttonBlurAttr ,
			
			blurLeftPadding: this.blurLeftPadding ,
			blurRightPadding: this.blurRightPadding ,
			focusLeftPadding: this.focusLeftPadding ,
			focusRightPadding: this.focusRightPadding ,
			paddingHasMarkup: this.paddingHasMarkup ,
			
			keyBindings: this.keyBindings
		} ) ;

		this.buttons[ index ].on( 'submit' , this.onButtonSubmit ) ;

		buttonOffsetY ++ ;
	} ) ;
} ;



/*
ColumnMenu.prototype.preDrawSelf = function preDrawSelf() {
	//this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.backgroundAttr } , ' '.repeat( this.outputWidth ) ) ;
} ;
*/

