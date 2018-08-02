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



var Element = require( './Element.js' ) ;
var TextInput = require( './TextInput.js' ) ;
var Button = require( './Button.js' ) ;


function Form( options = {} ) {
	if ( ! options.outputWidth && ! options.width ) { options.outputWidth = 78 ; }

	Element.call( this , options ) ;

	this.submitValue = null ;

	this.textInputsDef = options.textInputs || [] ;
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
	if ( this.elementType === 'Form' ) { this.draw() ; }
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



Form.prototype.keyBindings = {
	LEFT: 'previous' ,
	RIGHT: 'next' ,
	UP: 'previous' ,
	DOWN: 'next' ,
	ENTER: 'next' ,
	KP_ENTER: 'next'
} ;



// Create TextInput and Button automatically
Form.prototype.initChildren = function initChildren() {
	var i , iMax ,
		labelMaxLength = 0 , label ,
		buttonsTextLength = 0 , buttonSpacing = 0 , buttonOffsetX , buttonOffsetY ;


	// TextInput part
	iMax = this.textInputsDef.length ;

	for ( i = 0 ; i < iMax ; i ++ ) {
		if ( this.textInputsDef[ i ].label.length > labelMaxLength ) { labelMaxLength = this.textInputsDef[ i ].label.length ; }
	}

	for ( i = 0 ; i < iMax ; i ++ ) {
		label = this.textInputsDef[ i ].label + ' '.repeat( labelMaxLength - this.textInputsDef[ i ].label.length ) ;

		this.textInputs[ i ] = new TextInput( {
			parent: this ,
			label: label ,
			content: this.textInputsDef[ i ].content ,
			key: this.textInputsDef[ i ].key ,
			outputX: this.outputX ,
			outputY: this.outputY + i ,
			outputWidth: this.textInputsDef[ i ].outputWidth || this.textInputsDef[ i ].width || this.outputWidth ,
			outputHeight: 1 ,
			textAttr: this.textInputsDef[ i ].textAttr || this.textAttr ,
			emptyAttr: this.textInputsDef[ i ].emptyAttr || this.emptyAttr ,
			hidden: this.textInputsDef[ i ].hidden ,
			labelFocusAttr: this.textInputsDef[ i ].labelFocusAttr || this.labelFocusAttr ,
			labelBlurAttr: this.textInputsDef[ i ].labelBlurAttr || this.labelBlurAttr ,
			keyBindings: this.textInputKeyBindings
		} ) ;
	}


	// Submit Button part
	if ( ! this.buttonsDef.length ) {
		this.buttonsDef.push( {
			content: 'Submit' ,
			value: 'submit'
		} ) ;
	}

	iMax = this.buttonsDef.length ;

	for ( i = 0 ; i < iMax ; i ++ ) { buttonsTextLength += this.buttonsDef[ i ].content.length ; }
	buttonSpacing = Math.floor( ( this.outputWidth - buttonsTextLength ) / ( this.buttonsDef.length + 1 ) ) ;

	buttonOffsetX = buttonSpacing ;
	buttonOffsetY = this.textInputsDef.length + 1 ;

	for ( i = 0 ; i < iMax ; i ++ ) {
		this.buttons[ i ] = new Button( {
			parent: this ,
			content: this.buttonsDef[ i ].content ,
			value: this.buttonsDef[ i ].value ,
			outputX: this.outputX + buttonOffsetX ,
			outputY: this.outputY + buttonOffsetY ,
			focusAttr: this.buttonsDef[ i ].focusAttr || this.buttonFocusAttr ,
			blurAttr: this.buttonsDef[ i ].blurAttr || this.buttonBlurAttr
		} ) ;

		this.buttons[ i ].on( 'submit' , this.onButtonSubmit ) ;

		buttonOffsetX += this.buttonsDef[ i ].content.length + buttonSpacing ;
	}

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

