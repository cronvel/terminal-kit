/*
	Terminal Kit

	Copyright (c) 2009 - 2022 Cédric Ronvel

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
const Text = require( './Text.js' ) ;
const EditableTextBox = require( './EditableTextBox.js' ) ;
const SelectList = require( './SelectList.js' ) ;
const SelectListMulti = require( './SelectListMulti.js' ) ;

const string = require( 'string-kit' ) ;
//const autoComplete = require( './autoComplete.js' ) ;


// Labeled: american english, Labelled british english
// (to me, 'labelled' seems more natural, but there are 10 times more results on Google for 'labeled', so I will go for it)
function LabeledInput( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	Element.call( this , options ) ;

	// For text-input only
	this.hiddenContent = options.hiddenContent ;
	this.hasInputFocus = false ;

	// For SelectList, this apply temp zIndex manipulation for the children to this element
	this.interceptTempZIndex = true ;

	this.labelFocusAttr = options.labelFocusAttr || { bold: true } ;
	this.labelBlurAttr = options.labelBlurAttr || { dim: true } ;

	this.buttonBlurAttr = options.buttonBlurAttr || { bgColor: 'cyan' , color: 'white' , bold: true } ;
	this.buttonFocusAttr = options.buttonFocusAttr || { bgColor: 'brightCyan' , color: 'black' , bold: true } ;
	this.buttonDisabledAttr = options.buttonDisabledAttr || { bgColor: 'cyan' , color: 'gray' , bold: true } ;
	this.buttonSubmittedAttr = options.buttonSubmittedAttr || { bgColor: 'brightCyan' , color: 'brightWhite' , bold: true } ;
	this.turnedOnBlurAttr = options.turnedOnBlurAttr || { bgColor: 'cyan' } ;
	this.turnedOnFocusAttr = options.turnedOnFocusAttr || { bgColor: 'brightCyan' , color: 'gray' , bold: true } ;
	this.turnedOffBlurAttr = options.turnedOffBlurAttr || { bgColor: 'gray' , dim: true } ;
	this.turnedOffFocusAttr = options.turnedOffFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } ;

	// TextBufffer needs computed attr, not object one
	this.textAttr = options.textAttr || { bgColor: 'blue' } ;
	this.voidAttr = options.voidAttr || options.emptyAttr || { bgColor: 'blue' } ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	if ( this.label ) {
		this.labelText = new Text( {
			internal: true ,
			parent: this ,
			content: this.label ,
			x: this.outputX ,
			y: this.outputY ,
			height: 1 ,
			attr: this.labelBlurAttr ,
			leftPadding: this.labelBlurLeftPadding ,
			rightPadding: this.labelBlurRightPadding ,
			noDraw: true
		} ) ;
	}

	this.inputType = options.type || 'text' ;

	this.onFocus = this.onFocus.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;
	this.onInputSubmit = this.onInputSubmit.bind( this ) ;

	this.initInput( options ) ;
	this.updateStatus() ;

	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.on( 'click' , this.onClick ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'LabeledInput' && ! options.noDraw ) { this.draw() ; }
}

module.exports = LabeledInput ;
Element.inherit( LabeledInput ) ;



LabeledInput.prototype.needInput = true ;
LabeledInput.prototype.noChildFocus = true ;
LabeledInput.prototype.propagateZ = true ;



LabeledInput.prototype.keyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	ALT_ENTER: 'submit'
	//ESCAPE: 'cancel' ,
} ;



LabeledInput.prototype.editableTextBoxKeyBindings = {
	CTRL_K: 'meta' ,
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	CTRL_LEFT: 'startOfWord' ,
	CTRL_RIGHT: 'endOfWord' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine' ,
	CTRL_B: 'startOfSelection' ,
	CTRL_E: 'endOfSelection' ,

	// T for Transfer
	CTRL_T: 'moveSelection' ,
	ALT_T: 'copyToDocumentClipboard' ,
	META_T: 'copyToSystemClipboard' ,
	// P for Paste / Put
	CTRL_P: 'pasteSelection' ,
	ALT_P: 'pasteDocumentClipboard' ,
	META_P: 'pasteSystemClipboard' ,
	// D for Delete
	CTRL_D: 'deleteSelection' ,
	ALT_D: 'clearDocumentClipboard' ,
	META_D: 'clearSystemClipboard'
} ;



LabeledInput.prototype.multiLineEditableTextBoxKeyBindings = Object.assign( {} , LabeledInput.prototype.editableTextBoxKeyBindings , {
	ENTER: 'newLine' ,
	KP_ENTER: 'newLine' ,
	UP: 'up' ,
	DOWN: 'down' ,
	PAGE_UP: 'scrollUp' ,
	PAGE_DOWN: 'scrollDown' ,
	CTRL_B: 'startOfSelection' ,
	CTRL_E: 'endOfSelection' ,
	CTRL_K: 'meta' ,
	// We copy vi/vim here, that use 'y' for copy (yank) and 'p' for paste (put)
	CTRL_Y: 'copy' ,
	META_Y: 'copyClipboard' ,
	CTRL_P: 'paste' ,
	META_P: 'pasteClipboard'
} ) ;



LabeledInput.prototype.selectListKeyBindings = {
	UP: 'previous' ,
	DOWN: 'next' ,
	ENTER: 'submit' ,
	KP_ENTER: 'submit'
} ;



LabeledInput.prototype.selectListMultiKeyBindings = {
	UP: 'previous' ,
	DOWN: 'next' ,
	ENTER: 'submit' ,
	KP_ENTER: 'submit'
} ;



LabeledInput.prototype.initInput = function( options ) {
	switch ( this.inputType ) {
		case 'text' :
			this.initTextInput( options ) ;
			break ;
		case 'select' :
			this.initSelectInput( options ) ;
			break ;
		case 'selectMulti' :
			this.initSelectMultiInput( options ) ;
			break ;
		default :
			throw new Error( 'Unknown input type: ' + this.inputType ) ;
	}

	// Allow label highlight
	this.input.on( 'focus' , this.onChildFocus.bind( this ) ) ;
} ;



LabeledInput.prototype.initTextInput = function( options ) {
	if ( options.inputKeyBindings ) { this.inputKeyBindings = options.inputKeyBindings ; }
	else if ( options.allowNewLine ) { this.inputKeyBindings = this.multiLineEditableTextBoxKeyBindings ; }
	else { this.inputKeyBindings = this.editableTextBoxKeyBindings ; }

	this.input = new EditableTextBox( {
		internal: true ,
		parent: this ,
		content: options.content ,
		value: options.value ,
		x: this.outputX + ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		y: this.outputY ,
		width: this.outputWidth - ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		height: this.outputHeight ,
		lineWrap: !! options.lineWrap ,
		wordWrap: !! options.wordWrap ,
		scrollable: !! options.scrollable ,
		vScrollBar: !! options.vScrollBar ,
		hScrollBar: !! options.hScrollBar ,
		hiddenContent: this.hiddenContent ,
		textAttr: this.textAttr ,
		voidAttr: this.voidAttr ,
		keyBindings: this.inputKeyBindings ,
		noDraw: true
	} ) ;
} ;



LabeledInput.prototype.initSelectInput = function( options ) {
	if ( options.inputKeyBindings ) { this.inputKeyBindings = options.inputKeyBindings ; }
	else { this.inputKeyBindings = this.selectListKeyBindings ; }

	this.input = new SelectList( {
		internal: true ,
		parent: this ,
		content: options.content ,
		value: options.value ,
		x: this.outputX + ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		y: this.outputY ,
		width: this.outputWidth - ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		items: options.items ,
		buttonBlurAttr: this.buttonBlurAttr ,
		buttonFocusAttr: this.buttonFocusAttr ,
		buttonDisabledAttr: this.buttonDisabledAttr ,
		buttonSubmittedAttr: this.buttonSubmittedAttr ,
		keyBindings: this.inputKeyBindings ,
		noDraw: true
	} ) ;

	this.input.on( 'submit' , this.onInputSubmit ) ;
} ;



LabeledInput.prototype.initSelectMultiInput = function( options ) {
	if ( options.inputKeyBindings ) { this.inputKeyBindings = options.inputKeyBindings ; }
	else { this.inputKeyBindings = this.selectListMultiKeyBindings ; }

	this.input = new SelectListMulti( {
		internal: true ,
		parent: this ,
		content: options.content ,
		value: options.value ,
		x: this.outputX + ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		y: this.outputY ,
		width: this.outputWidth - ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		items: options.items ,
		buttonBlurAttr: this.buttonBlurAttr ,
		buttonFocusAttr: this.buttonFocusAttr ,
		buttonDisabledAttr: this.buttonDisabledAttr ,
		buttonSubmittedAttr: this.buttonSubmittedAttr ,
		turnedOnBlurAttr: this.turnedOnBlurAttr ,
		turnedOnFocusAttr: this.turnedOnFocusAttr ,
		turnedOffBlurAttr: this.turnedOffBlurAttr ,
		turnedOffFocusAttr: this.turnedOffFocusAttr ,
		keyBindings: this.inputKeyBindings ,
		noDraw: true
	} ) ;

	this.input.on( 'submit' , this.onInputSubmit ) ;
} ;



LabeledInput.prototype.updateStatus = function() {
	/*
	if ( this.disabled ) {
		this.labelText.attr = this.labelDisabledAttr ;
		this.labelText.leftPadding = this.labelDisabledLeftPadding ;
		this.labelText.rightPadding = this.labelDisabledRightPadding ;
	}
	else if ( this.submitted ) {
		this.labelText.attr = this.labelSubmittedAttr ;
		this.labelText.leftPadding = this.labelSubmittedLeftPadding ;
		this.labelText.rightPadding = this.labelSubmittedRightPadding ;
	}
	else */
	if ( this.hasFocus || this.hasInputFocus ) {
		if ( this.labelText ) {
			this.labelText.attr = this.labelFocusAttr ;
			this.labelText.leftPadding = this.labelFocusLeftPadding ;
			this.labelText.rightPadding = this.labelFocusRightPadding ;
		}
	}
	else if ( this.labelText ) {
		this.labelText.attr = this.labelBlurAttr ;
		this.labelText.leftPadding = this.labelBlurLeftPadding ;
		this.labelText.rightPadding = this.labelBlurRightPadding ;
	}
} ;



// Directly linked to the EditableTextBox
LabeledInput.prototype.getValue = function() { return this.input.getValue() ; } ;
LabeledInput.prototype.setValue = function( value , dontDraw ) { return this.input.setValue( value , dontDraw ) ; } ;
LabeledInput.prototype.getContent = function() { return this.input.getContent() ; } ;
LabeledInput.prototype.setContent = function( content , hasMarkup , dontDraw ) { return this.input.setContent( content , hasMarkup , dontDraw ) ; } ;



LabeledInput.prototype.drawSelfCursor = function() {
	if ( this.input.drawSelfCursor ) { this.input.drawSelfCursor() ; }
} ;



LabeledInput.prototype.onKey = function( key , altKeys , data ) {
	// Give full priority to the child input
	if ( this.input.emit( 'key' , key , altKeys , data ).interrupt ) { return true ; }

	return Element.prototype.onKey.call( this , key , altKeys , data ) ;
} ;



LabeledInput.prototype.onInputSubmit = function( data ) {
	this.emit( 'submit' , this.getValue() , undefined , this ) ;
} ;



LabeledInput.prototype.onFocus = function( focus , type ) {
	if ( type === 'delegate' ) { return ; }

	if ( focus && type !== 'backCycle' && this.input ) {
		// Defer to the next tick to avoid recursive events producing wrong listener order
		process.nextTick( () => {
			this.document.giveFocusTo( this.input , 'delegate' ) ;
		} ) ;
	}
	else {
		// This is done by .onChildFocus() if there is an attached input
		this.updateStatus() ;
		//this.draw() ;
		if ( this.labelText ) { this.labelText.draw() ; }
	}
} ;



LabeledInput.prototype.onChildFocus = function( focus , type ) {
	this.hasInputFocus = focus ;
	this.updateStatus() ;
	if ( this.labelText ) { this.labelText.draw() ; }
} ;



LabeledInput.prototype.onClick = function( data ) {
	this.document.giveFocusTo( this , 'select' ) ;
} ;



const userActions = LabeledInput.prototype.userActions ;

userActions.submit = function() {
	this.emit( 'submit' , this.getValue() , undefined , this ) ;
} ;

