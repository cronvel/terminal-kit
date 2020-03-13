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



function Slider( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	Element.call( this , options ) ;

	this.onClick = this.onClick.bind( this ) ;
	this.onDrag = this.onDrag.bind( this ) ;
	this.onWheel = this.onWheel.bind( this ) ;
	this.onButtonSubmit = this.onButtonSubmit.bind( this ) ;

	this.isVertical = !! options.isVertical ;
	this.slideRate = 0 ;
	this.handleOffset = 0 ;

	this.rateToValue = typeof options.rateToValue === 'function' ? options.rateToValue : IDENTITY ;
	this.valueToRate = typeof options.valueToRate === 'function' ? options.valueToRate : IDENTITY ;

	this.buttonBlurAttr = options.buttonBlurAttr || { bgColor: 'black' , color: 'white' , bold: true } ;
	this.buttonFocusAttr = options.buttonFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } ;
	this.buttonSubmittedAttr = options.buttonSubmittedAttr || { bgColor: 'gray' , color: 'brightWhite' , bold: true } ;

	this.backwardSymbol = options.backwardSymbol || ( this.isVertical ? '▲' : '◀' ) ;
	this.forwardSymbol = options.forwardSymbol || ( this.isVertical ? '▼' : '▶' ) ;

	this.handleAttr = options.handleAttr || { bgColor: 'brightWhite' , color: 'black' } ;
	this.handleSymbol = options.handleSymbol || '◆' ;

	this.barAttr = options.barAttr || { bgColor: 'gray' , color: 'brightWhite' } ;
	this.barSymbol = options.barSymbol || ' ' ;

	this.backwardButton = this.forwardButton = null ;

	this.on( 'click' , this.onClick ) ;
	this.on( 'drag' , this.onDrag ) ;
	this.on( 'wheel' , this.onWheel ) ;

	this.initChildren() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Slider' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Slider ;

Slider.prototype = Object.create( Element.prototype ) ;
Slider.prototype.constructor = Slider ;
Slider.prototype.elementType = 'Slider' ;



// Unused ATM: no onKey registered
Slider.prototype.keyBindings = {
	UP: 'backward' ,
	DOWN: 'forward' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	PAGE_UP: 'backward' ,
	PAGE_DOWN: 'forward' ,
	' ': 'forward' ,
	HOME: 'start' ,
	END: 'end'
} ;



Slider.prototype.buttonKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit'
} ;



Slider.prototype.destroy = function( isSubDestroy ) {
	this.off( 'click' , this.onClick ) ;
	this.off( 'drag' , this.onDrag ) ;
	this.off( 'wheel' , this.onWheel ) ;
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



// Create Buttons automatically
Slider.prototype.initChildren = function() {
	this.backwardButton = new Button( {
		internal: true ,
		parent: this ,
		internalRole: 'backward' ,
		content: this.backwardSymbol ,
		outputX: this.outputX ,
		outputY: this.outputY ,
		blurAttr: this.buttonBlurAttr ,
		focusAttr: this.buttonFocusAttr ,
		//disabledAttr: this.buttonDisabledAttr ,
		submittedAttr: this.buttonSubmittedAttr ,
		keyBindings: this.buttonKeyBindings ,
		//shortcuts: def.shortcuts ,
		noDraw: true
	} ) ;

	this.backwardButton.on( 'submit' , this.onButtonSubmit ) ;

	this.forwardButton = new Button( {
		internal: true ,
		parent: this ,
		internalRole: 'forward' ,
		content: this.forwardSymbol ,
		outputX: this.isVertical ? this.outputX : this.outputX + this.outputWidth - 1 ,
		outputY: this.isVertical ? this.outputY + this.outputHeight - 1 : this.outputY ,
		blurAttr: this.buttonBlurAttr ,
		focusAttr: this.buttonFocusAttr ,
		//disabledAttr: this.buttonDisabledAttr ,
		submittedAttr: this.buttonSubmittedAttr ,
		keyBindings: this.buttonKeyBindings ,
		//shortcuts: def.shortcuts ,
		noDraw: true
	} ) ;

	this.forwardButton.on( 'submit' , this.onButtonSubmit ) ;

	this.computeHandleOffset() ;
} ;



Slider.prototype.preDrawSelf = function() {
	return this.isVertical ? this.preDrawSelfVertical() : this.preDrawSelfHorizontal() ;
} ;



Slider.prototype.preDrawSelfVertical = function() {
	var offset = 0 ,
		y = this.outputY + 1 ,
		yMax = this.outputY + this.outputHeight - 2 ;

	for ( ; y <= yMax ; y ++ , offset ++ ) {
		if ( offset === this.handleOffset ) {
			this.outputDst.put( { x: this.outputX , y , attr: this.handleAttr } , this.handleSymbol ) ;
		}
		else {
			this.outputDst.put( { x: this.outputX , y , attr: this.barAttr } , this.barSymbol ) ;
		}
	}
} ;



Slider.prototype.preDrawSelfHorizontal = function() {
	var offset = 0 ,
		x = this.outputX + 1 ,
		xMax = this.outputX + this.outputWidth - 2 ;

	for ( ; x <= xMax ; x ++ , offset ++ ) {
		if ( offset === this.handleOffset ) {
			this.outputDst.put( { x , y: this.outputY , attr: this.handleAttr } , this.handleSymbol ) ;
		}
		else {
			this.outputDst.put( { x , y: this.outputY , attr: this.barAttr } , this.barSymbol ) ;
		}
	}
} ;



// No need to draw the cursor, however, when drawing, it is necessary to move it (not draw) at the handle position,
// in case no other widget would draw the cursor, it avoid the cursor to be hanging at the bottom and one cell off
// to the right of the slider, which is pretty annoying...
Slider.prototype.postDrawSelf = function() {
	if ( this.isVertical ) {
		this.outputDst.moveTo( this.outputX , this.outputY + this.handleOffset + 1 ) ;
	}
	else {
		this.outputDst.moveTo( this.outputX + this.handleOffset + 1 , this.outputY ) ;
	}
} ;

/*
Slider.prototype.drawSelfCursor = function() {
	// Move the cursor back to the handle
	this.outputDst.moveTo( this.outputX , this.outputY + this.handleOffset + 1 ) ;
	this.outputDst.drawCursor() ;
} ;
*/



// Compute the handle y position from the slideRate value
Slider.prototype.computeHandleOffset = function() {
	var delta = ( this.isVertical ? this.outputHeight : this.outputWidth ) - 3 ;	// minus the two buttons
	this.handleOffset = Math.round( delta * this.slideRate ) ;
} ;



// Set the handle position and compute the slideRate
Slider.prototype.setHandleOffset = function( offset , internalAndNoDraw = false ) {
	var delta = ( this.isVertical ? this.outputHeight : this.outputWidth ) - 3 ;	// minus the two buttons

	this.handleOffset = Math.max( 0 , Math.min( delta , Math.round( offset || 0 ) ) ) ;
	this.slideRate = Math.max( 0 , Math.min( 1 , this.handleOffset / delta || 0 ) ) ;

	if ( ! internalAndNoDraw ) {
		this.emit( 'slide' , this.getValue() ) ;
		this.draw() ;
	}
} ;



Slider.prototype.setSlideRate = function( rate , internalAndNoDraw = false ) {
	this.slideRate = Math.max( 0 , Math.min( 1 , rate || 0 ) ) ;
	this.computeHandleOffset() ;

	if ( ! internalAndNoDraw ) {
		this.emit( 'slide' , this.getValue() ) ;
		this.draw() ;
	}
} ;



Slider.prototype.getHandleOffset = function() { return this.handleOffset ; } ;
Slider.prototype.getSlideRate = function() { return this.slideRate ; } ;



Slider.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	switch ( button.internalRole ) {
		case 'backward' :
			this.emit( 'slideStep' , -1 ) ;
			break ;
		case 'forward' :
			this.emit( 'slideStep' , 1 ) ;
			break ;
	}
} ;



Slider.prototype.getValue = function() {
	return this.rateToValue( this.slideRate ) ;
} ;



Slider.prototype.setValue = function( value , internalAndNoDraw ) {
	return this.setSlideRate( this.valueToRate( value ) , internalAndNoDraw ) ;
} ;



Slider.prototype.onClick = function( data ) {
	if ( ! this.hasFocus ) { this.document.giveFocusTo( this , 'select' ) ; }
	this.setHandleOffset( ( this.isVertical ? data.y : data.x ) - 1 ) ;
} ;



Slider.prototype.onDrag = function( data ) {
	this.setHandleOffset( ( this.isVertical ? data.y : data.x ) - 1 ) ;
} ;



Slider.prototype.onWheel = function( data ) {
	this.emit( 'slideStep' , data.yDirection ) ;
} ;

