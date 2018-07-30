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

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'RowMenu' ) { this.draw() ; }
}

module.exports = RowMenu ;

RowMenu.prototype = Object.create( BaseMenu.prototype ) ;
RowMenu.prototype.constructor = RowMenu ;
RowMenu.prototype.elementType = 'RowMenu' ;



const defaultOptions = {
	buttonFocusAttr: { bgColor: 'green' , color: 'blue' , dim: true } ,
	buttonBlurAttr: { bgColor: 'white' , color: 'black' }
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
	var i , iMax ,
		labelMaxLength = 0 , label ,
		buttonsTextLength = 0 , buttonSpacing = 0 , buttonOffsetX , buttonOffsetY ;


	iMax = this.itemsDef.length ;
	if ( ! iMax ) { return ; }

	for ( i = 0 ; i < iMax ; i ++ ) { buttonsTextLength += this.itemsDef[ i ].content.length ; }

	//buttonSpacing = Math.floor( ( this.outputWidth - buttonsTextLength ) / ( this.itemsDef.length ) ) ;
	buttonSpacing = 1 ;

	buttonOffsetX = 0 ;
	buttonOffsetY = 0 ;
	
	for ( i = 0 ; i < iMax ; i ++ ) {
		this.buttons[ i ] = new Button( {
			parent: this ,
			content: this.itemsDef[ i ].content ,
			value: this.itemsDef[ i ].value ,
			outputX: this.outputX + buttonOffsetX ,
			outputY: this.outputY + buttonOffsetY ,
			focusAttr: this.itemsDef[ i ].focusAttr || this.buttonFocusAttr ,
			blurAttr: this.itemsDef[ i ].blurAttr || this.buttonBlurAttr ,
			keyBindings: this.keyBindings
		} ) ;

		this.buttons[ i ].on( 'submit' , this.onButtonSubmit ) ;

		buttonOffsetX += this.itemsDef[ i ].content.length + buttonSpacing ;
	}

} ;



RowMenu.prototype.preDrawSelf = function preDrawSelf() {
	this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.backgroundAttr } , ' '.repeat( this.outputWidth ) ) ;
} ;


