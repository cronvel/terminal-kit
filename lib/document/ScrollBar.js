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



function ScrollBar( options = {} ) {
	Element.call( this , options ) ;

	this.onClick = this.onClick.bind( this ) ;
	this.onButtonSubmit = this.onButtonSubmit.bind( this ) ;

	this.buttonBlurAttr = options.buttonBlurAttr || { bgColor: 'gray' , color: 'white' , bold: true } ;
	this.buttonFocusAttr = options.buttonFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } ;
	this.buttonSubmittedAttr = options.buttonSubmittedAttr || { bgColor: 'gray' , color: 'brightWhite' , bold: true } ;
	this.upSymbol = options.upSymbol || '▲' ;
	this.downSymbol = options.downSymbol || '▼' ;
	this.handleSymbol = options.handleSymbol || '◆' ;

	this.on( 'click' , this.onClick ) ;

	this.initChildren() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'ScrollBar' && ! options.noDraw ) { this.draw() ; }
}

module.exports = ScrollBar ;

ScrollBar.prototype = Object.create( Element.prototype ) ;
ScrollBar.prototype.constructor = ScrollBar ;
ScrollBar.prototype.elementType = 'ScrollBar' ;



ScrollBar.prototype.keyBindings = {
	UP: 'up' ,
	DOWN: 'down' ,
	PAGE_UP: 'up' ,
	PAGE_DOWN: 'down' ,
	HOME: 'top' ,
	END: 'bottom'
} ;



ScrollBar.prototype.buttonKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit'
} ;



ScrollBar.prototype.destroy = function( isSubDestroy ) {
	this.off( 'click' , this.onClick ) ;
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



// Create Buttons automatically
ScrollBar.prototype.initChildren = function() {
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
		keyBindings: this.buttonKeyBindings ,
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
		keyBindings: this.buttonKeyBindings ,
		//shortcuts: def.shortcuts ,
		//noDraw: true
	} ) ;

	this.downButton.on( 'submit' , this.onButtonSubmit ) ;
} ;



ScrollBar.prototype.postDrawSelf = function() {
	
} ;



ScrollBar.prototype.scroll = function( dx , dy ) {
	//console.log( "Scroll:" , dx , dy ) ;
} ;



ScrollBar.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	switch ( button.internalRole ) {
		case 'up' :
			this.scroll( 0 , -1 ) ;
			break ;
		case 'down' :
			this.scroll( 0 , 1 ) ;
			break ;
	}
} ;



// Maybe for scrolling at xx% of the related content
/*
ScrollBar.prototype.setValue = function( value , noDraw ) {
	var buttonDef = this.itemsDef.find( b => b.value === value ) ;
	if ( ! buttonDef ) { return false ; }
	this.select( buttonDef , noDraw ) ;
	return true ;
} ;

ScrollBar.prototype.getValue = function() { return this.value ; } ;
*/



ScrollBar.prototype.onClick = function( data ) {
	if ( ! this.hasFocus ) { this.document.giveFocusTo( this , 'select' ) ; }
} ;

