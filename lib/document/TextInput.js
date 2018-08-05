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



var Text = require( './Text.js' ) ;
var Element = require( './Element.js' ) ;

var ScreenBuffer = require( '../ScreenBuffer.js' ) ;
var TextBuffer = require( '../TextBuffer.js' ) ;
var Rect = require( '../Rect.js' ) ;

var string = require( 'string-kit' ) ;
//var autoComplete = require( './autoComplete.js' ) ;



function TextInput( options = {} ) {
	Element.call( this , options ) ;

	// TextBufffer needs computed attr, not object one
	this.textAttr = ScreenBuffer.object2attr( options.textAttr || { bgColor: 'blue' } ) ;
	this.emptyAttr = ScreenBuffer.object2attr( options.emptyAttr || { bgColor: 'blue' } ) ;

	this.labelFocusAttr = options.labelFocusAttr || { bold: true } ;
	this.labelBlurAttr = options.labelBlurAttr || { dim: true } ;

	this.hidden = options.hidden ;
	this.onKey = this.onKey.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;

	this.inputTextBuffer = null ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	if ( this.label ) {
		this.labelText = new Text( {
			parent: this ,
			x: this.outputX ,
			y: this.outputY ,
			content: this.label ,
			attr: this.labelBlurAttr ,
			leftPadding: this.labelBlurLeftPadding ,
			rightPadding: this.labelBlurRightPadding ,
			height: 1 ,
			noDraw: true
		} ) ;
	}

	this.inputTextBuffer = new TextBuffer( {
		dst: this.outputDst ,
		x: this.outputX + ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		y: this.outputY ,
		hidden: this.hidden ,
		forceInBound: true
	} ) ;

	this.inputTextBuffer.setEmptyCellAttr( this.emptyAttr ) ;

	// Clipping Rect needed for drawing, should never change
	this.inputTextBufferClipRect = new Rect( 0 , 0 , this.outputWidth - ( this.labelText ? this.labelText.outputWidth : 0 ) - 1 , this.outputHeight - 1 ) ;

	this.updateStatus() ;

	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.on( 'click' , this.onClick ) ;

	if ( options.content ) {
		this.setContent( options.content , options.contentHasMarkup , true ) ;
	}

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'TextInput' ) { this.draw() ; }
}



module.exports = TextInput ;

TextInput.prototype = Object.create( Element.prototype ) ;
TextInput.prototype.constructor = TextInput ;
TextInput.prototype.elementType = 'TextInput' ;



TextInput.prototype.destroy = function destroy( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;
	this.off( 'click' , this.onClick ) ;

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



TextInput.prototype.keyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	//ESCAPE: 'cancel' ,
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	UP: 'up' ,
	DOWN: 'down' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine' ,
	TAB: 'autoComplete'
} ;



TextInput.prototype.postDrawSelf = function postDrawSelf() {
	if ( this.labelText ) {
		this.labelText.draw() ;
	}

	this.inputTextBuffer.draw( { srcClipRect: this.inputTextBufferClipRect } ) ;
} ;



TextInput.prototype.drawSelfCursor = function drawSelfCursor() {
	this.inputTextBuffer.drawCursor() ;
} ;



TextInput.prototype.getValue = function getValue() {
	return this.inputTextBuffer.getText() ;
} ;



TextInput.prototype.setContent = function setContent( content , hasMarkup , dontDraw ) {
	var contentSize ;

	this.content = content ;
	this.contentHasMarkup = !! hasMarkup ;

	if ( hasMarkup ) { throw new Error( 'TextInput does not support markup' ) ; }

	this.inputTextBuffer.setText( this.content ) ;
	this.inputTextBuffer.setAttrCodeRegion( this.textAttr ) ;

	// Move the cursor at the end of the input
	this.inputTextBuffer.moveToEndOfLine() ;

	if ( ! dontDraw ) {
		this.drawCursor() ;
		this.redraw() ;
	}
} ;



TextInput.prototype.onKey = function onKey( key , trash , data ) {
	if ( data && data.isCharacter ) {
		this.inputTextBuffer.insert( key , this.textAttr ) ;
		this.draw() ;
	}
	else {
		// Here we have a special key

		switch( this.keyBindings[ key ] ) {
			case 'submit' :
				this.emit( 'submit' , this.inputTextBuffer.getText() , undefined , this ) ;
				break ;

			case 'newLine' :
				this.inputTextBuffer.newLine() ;
				this.draw() ;
				break ;

			/*
			case 'cancel' :
				if ( options.cancelable ) { cleanup() ; }
				break ;
			*/

			case 'backDelete' :
				this.inputTextBuffer.backDelete() ;
				this.draw() ;
				break ;

			case 'delete' :
				this.inputTextBuffer.delete() ;
				this.draw() ;
				break ;

			case 'backward' :
				this.inputTextBuffer.moveBackward() ;
				this.drawCursor() ;
				break ;

			case 'forward' :
				this.inputTextBuffer.moveForward() ;
				this.drawCursor() ;
				break ;

			case 'startOfLine' :
				this.inputTextBuffer.moveToColumn( 0 ) ;
				this.drawCursor() ;
				break ;

			case 'endOfLine' :
				this.inputTextBuffer.moveToEndOfLine() ;
				this.drawCursor() ;
				break ;

			case 'down' :
				this.inputTextBuffer.moveDown() ;
				this.drawCursor() ;
				break ;

			case 'up' :
				this.inputTextBuffer.moveUp() ;
				this.drawCursor() ;
				break ;

			case 'left' :
				this.inputTextBuffer.moveLeft() ;
				this.drawCursor() ;
				break ;

			case 'right' :
				this.inputTextBuffer.moveRight() ;
				this.drawCursor() ;
				break ;

			default :
				return ;	// Bubble up
		}
	}

	return true ;		// Do not bubble up
} ;



TextInput.prototype.onFocus = function onFocus( focus , type ) {
	this.hasFocus = focus ;
	this.updateStatus() ;
	this.draw() ;
} ;



TextInput.prototype.onClick = function onClick( data ) {
	this.document.giveFocusTo( this , 'select' ) ;
} ;



TextInput.prototype.updateStatus = function updateStatus() {
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
	if ( this.hasFocus ) {
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

