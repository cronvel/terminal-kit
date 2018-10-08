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
const TextInput = require( './TextInput.js' ) ;
const Button = require( './Button.js' ) ;



function Form( options = {} ) {
	if ( ! options.outputWidth && ! options.width ) { options.outputWidth = 78 ; }

	Element.call( this , options ) ;

	this.submitValue = null ;

	// /!\ options.textInputs is only use for backward compatibility, and will be removed later (writing this on 17/08/18)
	this.inputsDef = options.inputs || options.textInputs || [] ;
	this.textInputs = [] ;
	this.buttonsDef = options.buttons || [] ;
	this.buttons = [] ;
	this.focusChild = null ;
	this.onButtonSubmit = this.onButtonSubmit.bind( this ) ;
	this.onKey = this.onKey.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;

	// Global default attributes
	this.textAttr = options.textAttr || null ;
	this.emptyAttr = options.emptyAttr || null ;
	this.labelFocusAttr = options.labelFocusAttr || null ;
	this.labelBlurAttr = options.labelBlurAttr || null ;
	this.buttonFocusAttr = options.buttonFocusAttr || null ;
	this.buttonBlurAttr = options.buttonBlurAttr || null ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }
	if ( options.textInputKeyBindings ) { this.textInputKeyBindings = options.textInputKeyBindings ; }

	this.initChildren() ;

	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Form' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Form ;

Form.prototype = Object.create( Element.prototype ) ;
Form.prototype.constructor = Form ;
Form.prototype.elementType = 'Form' ;



Form.prototype.destroy = function destroy( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



Form.prototype.keyBindings = {
	LEFT: 'previous' ,
	RIGHT: 'next' ,
	UP: 'previous' ,
	DOWN: 'next' ,
	ENTER: 'next' ,
	KP_ENTER: 'next'
} ;



Form.prototype.textInputKeyBindings = {
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	//	UP: 'up' ,
	//	DOWN: 'down' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine'
} ;



// Create TextInput and Button automatically
Form.prototype.initChildren = function initChildren() {
	var labelMaxWidth = 0 ,
		offsetX = 0 , offsetY = 0 ,
		buttonsTextWidth = 0 , buttonSpacing = 0 ;

	this.inputsDef.forEach( def => {
		def.labelWidth = Element.computeContentWidth( def.label , def.labelHasMarkup ) ;
		if ( def.labelWidth > labelMaxWidth ) { labelMaxWidth = def.labelWidth ; }
	} ) ;

	this.inputsDef.forEach( ( def , index ) => {
		var label = def.label + ' '.repeat( labelMaxWidth - def.labelWidth ) ;
		var height = def.height || 1 ;

		this.textInputs[ index ] = new TextInput( {
			parent: this ,
			label: label ,
			content: def.content ,
			key: def.key ,
			outputX: this.outputX ,
			outputY: this.outputY + offsetY ,
			outputWidth: def.outputWidth || def.width || this.outputWidth ,
			outputHeight: height ,
			textAttr: def.textAttr || this.textAttr ,
			emptyAttr: def.emptyAttr || this.emptyAttr ,
			hidden: def.hidden ,
			labelFocusAttr: def.labelFocusAttr || this.labelFocusAttr ,
			labelBlurAttr: def.labelBlurAttr || this.labelBlurAttr ,
			keyBindings: this.textInputKeyBindings ,
			allowNewLine: height > 1 ,
			noDraw: true
		} ) ;

		offsetY += height ;
	} ) ;


	// Submit Button part
	if ( ! this.buttonsDef.length ) {
		this.buttonsDef.push( {
			content: 'Submit' ,
			value: 'submit'
		} ) ;
	}

	this.buttonsDef.forEach( def => {
		def.contentWidth = Element.computeContentWidth( def.content , def.contentHasMarkup ) ;
		buttonsTextWidth += def.contentWidth ;
	} ) ;

	buttonSpacing = Math.floor( ( this.outputWidth - buttonsTextWidth ) / ( this.buttonsDef.length + 1 ) ) ;

	offsetX = buttonSpacing ;
	offsetY ++ ;

	this.buttonsDef.forEach( ( def , index ) => {
		this.buttons[ index ] = new Button( {
			parent: this ,
			content: def.content ,
			value: def.value ,
			outputX: this.outputX + offsetX ,
			outputY: this.outputY + offsetY ,
			focusAttr: def.focusAttr || this.buttonFocusAttr ,
			blurAttr: def.blurAttr || this.buttonBlurAttr ,
			noDraw: true
		} ) ;

		this.buttons[ index ].on( 'submit' , this.onButtonSubmit ) ;

		offsetX += def.contentWidth + buttonSpacing ;
	} ) ;
} ;



Form.prototype.getValue = function getValue() {
	var fields = {} ;

	this.textInputs.forEach( textInput => {
		fields[ textInput.key ] = textInput.getValue() ;
	} ) ;

	return { submit: this.submitValue , fields } ;
} ;



Form.prototype.onKey = function onKey( key , trash , data ) {
	switch( this.keyBindings[ key ] ) {
		case 'previous' :
			this.focusChild = this.focusPreviousChild() ;
			break ;
		case 'next' :
			this.focusChild = this.focusNextChild() ;
			break ;
		default :
			return ;	// Bubble up
	}

	return true ;	// Do not bubble up
} ;



Form.prototype.onFocus = function onFocus( focus , type ) {
	if ( type === 'cycle' ) { return ; }

	if ( focus ) {
		if ( this.focusChild ) { this.document.giveFocusTo( this.focusChild , 'delegate' ) ; }
		else { this.focusChild = this.focusNextChild() ; }
	}
} ;



Form.prototype.onButtonSubmit = function onButtonSubmit( buttonValue ) {
	this.submitValue = buttonValue ;
	this.emit( 'submit' , this.getValue() , undefined , this ) ;
} ;

