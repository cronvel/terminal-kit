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
const Button = require( './Button.js' ) ;

// Default transfer function
const IDENTITY = v => v ;



function Slider( options = {} ) {
	Element.call( this , options ) ;

	this.onClick = this.onClick.bind( this ) ;
	this.onButtonSubmit = this.onButtonSubmit.bind( this ) ;

	this.isVertical = !! options.isVertical ;
	this.slideRate = 0 ;
	this.handleX = null ;
	this.handleY = null ;

	this.rateToValue = typeof options.rateToValue === 'function' ? options.rateToValue : IDENTITY ;
	this.valueToRate = typeof options.valueToRate === 'function' ? options.valueToRate : IDENTITY ;

	this.buttonBlurAttr = options.buttonBlurAttr || { bgColor: 'black' , color: 'white' , bold: true } ;
	this.buttonFocusAttr = options.buttonFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } ;
	this.buttonSubmittedAttr = options.buttonSubmittedAttr || { bgColor: 'gray' , color: 'brightWhite' , bold: true } ;
	this.upSymbol = options.upSymbol || '▲' ;
	this.downSymbol = options.downSymbol || '▼' ;
	this.leftSymbol = options.leftSymbol || '◀' ;
	this.rightSymbol = options.rightSymbol || '▶' ;

	this.handleAttr = options.handleAttr || { bgColor: 'brightWhite' , color: 'black' } ;
	this.handleSymbol = options.handleSymbol || '◆' ;

	this.barAttr = options.barAttr || { bgColor: 'gray' , color: 'brightWhite' } ;
	this.barSymbol = options.barSymbol || ' ' ;

	this.upButton = this.downButton = this.leftButton = this.rightButton = null ;

	this.on( 'click' , this.onClick ) ;

	this.initChildren() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Slider' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Slider ;

Slider.prototype = Object.create( Element.prototype ) ;
Slider.prototype.constructor = Slider ;
Slider.prototype.elementType = 'Slider' ;



Slider.prototype.keyBindings = {
	UP: 'up' ,
	DOWN: 'down' ,
	PAGE_UP: 'up' ,
	PAGE_DOWN: 'down' ,
	HOME: 'top' ,
	END: 'bottom'
} ;



Slider.prototype.buttonKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit'
} ;



Slider.prototype.destroy = function( isSubDestroy ) {
	this.off( 'click' , this.onClick ) ;
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



// Create Buttons automatically
Slider.prototype.initChildren = function() {
	this.upButton = new Button( {
		parent: this ,
		internalRole: 'up' ,
		content: this.upSymbol ,
		outputX: this.outputX ,
		outputY: this.outputY ,
		blurAttr: this.buttonBlurAttr ,
		focusAttr: this.buttonFocusAttr ,
		//disabledAttr: this.buttonDisabledAttr ,
		submittedAttr: this.buttonSubmittedAttr ,
		keyBindings: this.buttonKeyBindings
		//shortcuts: def.shortcuts ,
		//noDraw: true
	} ) ;

	this.upButton.on( 'submit' , this.onButtonSubmit ) ;

	this.downButton = new Button( {
		parent: this ,
		internalRole: 'down' ,
		content: this.downSymbol ,
		outputX: this.outputX ,
		outputY: this.outputY + this.outputHeight - 1 ,
		blurAttr: this.buttonBlurAttr ,
		focusAttr: this.buttonFocusAttr ,
		//disabledAttr: this.buttonDisabledAttr ,
		submittedAttr: this.buttonSubmittedAttr ,
		keyBindings: this.buttonKeyBindings
		//shortcuts: def.shortcuts ,
		//noDraw: true
	} ) ;

	this.downButton.on( 'submit' , this.onButtonSubmit ) ;
	
	this.computeHandlePosition() ;
} ;



Slider.prototype.postDrawSelf = function() {
	var y = this.outputY + 1 ,
		yMax = this.outputY + this.outputHeight - 2 ;

	for ( ; y <= yMax ; y ++ ) {
		if ( y === this.handleY ) {
			this.outputDst.put( { x: this.outputX , y , attr: this.handleAttr } , this.handleSymbol ) ;
		}
		else {
			this.outputDst.put( { x: this.outputX , y , attr: this.barAttr } , this.barSymbol ) ;
		}
	}
} ;



// Compute the handle y position from the slideRate value
Slider.prototype.computeHandlePosition = function() {
	var yDelta = this.outputHeight - 3 ;	// minus the two buttons
	this.handleY = Math.round( this.outputY + 1 + yDelta * this.slideRate ) ;
} ;



Slider.prototype.setSlideRate = function( rate ) {
	this.slideRate = Math.max( 0 , Math.min( 1 , rate || 0 ) ) ;
	this.computeHandlePosition() ;
	this.draw() ;
} ;



Slider.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	switch ( button.internalRole ) {
		case 'up' :
			this.emit( 'slide' , 0 , -1 ) ;
			break ;
		case 'down' :
			this.emit( 'slide' , 0 , 1 ) ;
			break ;
	}
} ;



Slider.prototype.getValue = function() {
	return this.rateToValue( this.slideRate ) ;
} ;



Slider.prototype.setValue = function( value , noDraw ) {
	return this.setSlideRate( this.valueToRate( value ) ) ;
} ;



Slider.prototype.onClick = function( data ) {
	if ( ! this.hasFocus ) { this.document.giveFocusTo( this , 'select' ) ; }
} ;

