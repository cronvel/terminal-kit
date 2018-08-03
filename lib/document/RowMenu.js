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

function RowMenu( options = {} ) {
	if ( ! options.outputWidth && ! options.width ) {
		options.outputWidth = Math.min( options.parent.inputWidth , options.parent.outputWidth ) ;
	}

	BaseMenu.call( this , options , defaultOptions ) ;

	this.justify = !! options.justify ;
	this.buttonSpacing = options.buttonSpacing || 1 ;

	this.initChildren() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'RowMenu' && ! options.noDraw ) { this.draw() ; }
}

module.exports = RowMenu ;

RowMenu.prototype = Object.create( BaseMenu.prototype ) ;
RowMenu.prototype.constructor = RowMenu ;
RowMenu.prototype.elementType = 'RowMenu' ;



const defaultOptions = {
	buttonBlurAttr: { bgColor: 'white' , color: 'black' } ,
	buttonFocusAttr: { bgColor: 'green' , color: 'blue' , dim: true } ,
	buttonDisabledAttr: { bgColor: 'white' , color: 'brightBlack' } ,
	buttonSubmittedAttr: { bgColor: 'brightWhite' , color: 'brightBlack' }
} ;



RowMenu.prototype.destroy = function destroy( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



RowMenu.prototype.keyBindings = {
	LEFT: 'previous' ,
	RIGHT: 'next' ,
	//UP: 'previous' ,
	//DOWN: 'next' ,
	KP_ENTER: 'submit' ,
	ENTER: 'submit'
} ;



// Create Buttons automatically
RowMenu.prototype.initChildren = function initChildren() {
	var buttonsTextWidth = 0 , buttonSpacing , buttonOffsetX , buttonOffsetY ;

	if ( ! this.itemsDef.length ) { return ; }

	this.itemsDef.forEach( def => {
		def.contentHasMarkup = def.contentHasMarkup || def.markup ;
		def.width = Element.computeContentWidth( def.content , def.contentHasMarkup ) ;
		buttonsTextWidth += def.width ;
	} ) ;

	buttonSpacing = this.justify ? Math.floor( ( this.outputWidth - buttonsTextWidth ) / ( this.itemsDef.length - 1 ) ) : this.buttonSpacing ;

	buttonOffsetX = 0 ;
	buttonOffsetY = 0 ;

	// /!\ What about the padding?

	this.itemsDef.forEach( ( def , index ) => {
		this.buttons[ index ] = new Button( {
			parent: this ,
			content: def.content ,
			contentHasMarkup: def.contentHasMarkup ,
			value: def.value ,
			outputX: this.outputX + buttonOffsetX ,
			outputY: this.outputY + buttonOffsetY ,
			focusAttr: def.focusAttr || this.buttonFocusAttr ,
			blurAttr: def.blurAttr || this.buttonBlurAttr ,
			keyBindings: this.keyBindings ,
			noDraw: true
		} ) ;

		this.buttons[ index ].on( 'submit' , this.onButtonSubmit ) ;

		buttonOffsetX += def.width + buttonSpacing ;
	} ) ;
} ;



RowMenu.prototype.preDrawSelf = function preDrawSelf() {
	// /!\ What about the padding?
	this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.backgroundAttr } , ' '.repeat( this.outputWidth ) ) ;
} ;

