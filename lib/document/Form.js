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
const LabeledInput = require( './LabeledInput.js' ) ;
const Button = require( './Button.js' ) ;



function Form( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	if ( ! options.outputWidth && ! options.width ) { options.outputWidth = 78 ; }

	Element.call( this , options ) ;

	this.submitValue = null ;

	this.inputsDef = options.inputs || [] ;
	this.labeledInputs = [] ;
	this.buttonsDef = options.buttons || [] ;
	this.buttons = [] ;
	this.focusChild = null ;
	this.onButtonSubmit = this.onButtonSubmit.bind( this ) ;
	this.onKey = this.onKey.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;

	// Global default attributes
	this.textAttr = options.textAttr || null ;
	this.voidAttr = options.voidAttr || options.emptyAttr || null ;
	this.labelFocusAttr = options.labelFocusAttr || null ;
	this.labelBlurAttr = options.labelBlurAttr || null ;
	this.buttonFocusAttr = options.buttonFocusAttr || null ;
	this.buttonBlurAttr = options.buttonBlurAttr || null ;
	this.turnedOnBlurAttr = options.turnedOnBlurAttr || null ;
	this.turnedOnFocusAttr = options.turnedOnFocusAttr || null ;
	this.turnedOffBlurAttr = options.turnedOffBlurAttr || null ;
	this.turnedOffFocusAttr = options.turnedOffFocusAttr || null ;

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

Form.prototype.needInput = true ;



Form.prototype.destroy = function( isSubDestroy , noDraw = false ) {
	if ( this.destroyed ) { return ; }

	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;

	Element.prototype.destroy.call( this , isSubDestroy , noDraw ) ;
} ;



Form.prototype.keyBindings = {
	LEFT: 'previous' ,
	RIGHT: 'next' ,
	UP: 'previous' ,
	DOWN: 'next' ,
	ENTER: 'next' ,
	KP_ENTER: 'next' ,
	ALT_ENTER: 'next'
} ;



Form.prototype.textInputKeyBindings = {} ;
Form.prototype.selectInputKeyBindings = {} ;
Form.prototype.selectMultiInputKeyBindings = {} ;



// Create LabeledInput and Button automatically
Form.prototype.initChildren = function() {
	var labelMaxWidth = 0 ,
		offsetX = 0 , offsetY = 0 ,
		buttonsTextWidth = 0 , buttonSpacing = 0 ;

	this.inputsDef.forEach( def => {
		def.labelWidth = Element.computeContentWidth( def.label , def.labelHasMarkup ) ;
		if ( def.labelWidth > labelMaxWidth ) { labelMaxWidth = def.labelWidth ; }
	} ) ;

	this.inputsDef.forEach( ( def , index ) => {
		var height = 1 ,
			label = def.label + ' '.repeat( labelMaxWidth - def.labelWidth ) ;

		switch ( def.type ) {
			case 'select' :
				//def.type = 'select' ;
				//if ( def.height ) { height = 1 ; }

				this.labeledInputs[ index ] = new LabeledInput( {
					internal: true ,
					parent: this ,
					type: def.type ,
					key: def.key ,
					label: label ,
					content: def.content ,
					value: def.value ,
					items: def.items ,
					outputX: this.outputX ,
					outputY: this.outputY + offsetY ,
					outputWidth: def.outputWidth || def.width || this.outputWidth ,
					outputHeight: height ,
					labelFocusAttr: def.labelFocusAttr || this.labelFocusAttr ,
					labelBlurAttr: def.labelBlurAttr || this.labelBlurAttr ,
					buttonBlurAttr: def.buttonBlurAttr || this.buttonBlurAttr ,
					buttonFocusAttr: def.buttonFocusAttr || this.buttonFocusAttr ,
					buttonDisabledAttr: def.buttonDisabledAttr || this.buttonDisabledAttr ,
					buttonSubmittedAttr: def.buttonSubmittedAttr || this.buttonSubmittedAttr ,
					keyBindings: this.selectInputKeyBindings ,
					noDraw: true
				} ) ;

				break ;

			case 'select-multi' :
			case 'selectMulti' :
				//def.type = 'select' ;
				//if ( def.height ) { height = 1 ; }

				this.labeledInputs[ index ] = new LabeledInput( {
					internal: true ,
					parent: this ,
					type: def.type ,
					key: def.key ,
					label: label ,
					content: def.content ,
					value: def.value ,
					items: def.items ,
					outputX: this.outputX ,
					outputY: this.outputY + offsetY ,
					outputWidth: def.outputWidth || def.width || this.outputWidth ,
					outputHeight: height ,
					labelFocusAttr: def.labelFocusAttr || this.labelFocusAttr ,
					labelBlurAttr: def.labelBlurAttr || this.labelBlurAttr ,
					buttonBlurAttr: def.buttonBlurAttr || this.buttonBlurAttr ,
					buttonFocusAttr: def.buttonFocusAttr || this.buttonFocusAttr ,
					buttonDisabledAttr: def.buttonDisabledAttr || this.buttonDisabledAttr ,
					buttonSubmittedAttr: def.buttonSubmittedAttr || this.buttonSubmittedAttr ,
					turnedOnBlurAttr: def.turnedOnBlurAttr || this.turnedOnBlurAttr ,
					turnedOnFocusAttr: def.turnedOnFocusAttr || this.turnedOnFocusAttr ,
					turnedOffBlurAttr: def.turnedOffBlurAttr || this.turnedOffBlurAttr ,
					turnedOffFocusAttr: def.turnedOffFocusAttr || this.turnedOffFocusAttr ,
					keyBindings: this.selectInputKeyBindings ,
					noDraw: true
				} ) ;

				break ;

			case 'text' :
			default :
				def.type = 'text' ;
				if ( def.height ) { height = def.height ; }

				this.labeledInputs[ index ] = new LabeledInput( {
					internal: true ,
					parent: this ,
					type: def.type ,
					key: def.key ,
					label: label ,
					content: def.content ,
					outputX: this.outputX ,
					outputY: this.outputY + offsetY ,
					outputWidth: def.outputWidth || def.width || this.outputWidth ,
					outputHeight: height ,
					lineWrap: !! def.lineWrap ,
					wordWrap: !! def.wordWrap ,
					scrollable: !! def.scrollable ,
					vScrollBar: !! def.vScrollBar ,
					hScrollBar: !! def.hScrollBar ,
					hiddenContent: def.hiddenContent ,
					labelFocusAttr: def.labelFocusAttr || this.labelFocusAttr ,
					labelBlurAttr: def.labelBlurAttr || this.labelBlurAttr ,
					textAttr: def.textAttr || this.textAttr ,
					voidAttr: def.voidAttr || def.emptyAttr || this.voidAttr ,
					keyBindings: this.textInputKeyBindings ,
					allowNewLine: height > 1 ,
					noDraw: true
				} ) ;

				break ;
		}

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
			internal: true ,
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



Form.prototype.getValue = function() {
	var fields = {} ;

	this.labeledInputs.forEach( labeledInput => {
		fields[ labeledInput.key ] = labeledInput.getValue() ;
	} ) ;

	return { submit: this.submitValue , fields } ;
} ;



Form.prototype.onKey = function( key , altKeys , data ) {
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



Form.prototype.onFocus = function( focus , type ) {
	if ( type === 'cycle' || type === 'backCycle' ) { return ; }

	if ( focus ) {
		// Defer to the next tick to avoid recursive events producing wrong listener order
		process.nextTick( () => {
			if ( this.focusChild ) { this.document.giveFocusTo( this.focusChild , 'delegate' ) ; }
			else { this.focusChild = this.focusNextChild() ; }
		} ) ;
	}
} ;



Form.prototype.onButtonSubmit = function( buttonValue , action ) {
	this.submitValue = buttonValue ;
	this.emit( 'submit' , this.getValue() , action , this ) ;
} ;

