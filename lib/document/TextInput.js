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



var string = require( 'string-kit' ) ;
//var autoComplete = require( './autoComplete.js' ) ;
var ScreenBuffer = require( '../ScreenBuffer.js' ) ;
var TextBuffer = require( '../TextBuffer.js' ) ;

var Element = require( './Element.js' ) ;



function TextInput( options = {} ) {
	Element.call( this , options ) ;

	this.textAttr = options.textAttr || { bgColor: 'blue' } ;
	this.emptyAttr = options.emptyAttr || { bgColor: 'blue' } ;
	this.labelFocusAttr = options.labelFocusAttr || { bold: true } ;
	this.labelBlurAttr = options.labelBlurAttr || { dim: true } ;
	this.hidden = options.hidden ;
	this.onKey = this.onKey.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;

	this.screenBuffer = null ;
	this.labelTextBuffer = null ;
	this.inputTextBuffer = null ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	this.screenBuffer = new ScreenBuffer( {
		dst: this.outputDst ,
		x: this.outputX ,
		y: this.outputY ,
		width: this.outputWidth ,
		height: this.outputHeight
	} ) ;

	if ( this.label ) {
		this.labelTextBuffer = new TextBuffer( {
			dst: this.screenBuffer ,
			width: this.label.length ,
			height: 1
		} ) ;

		this.labelTextBuffer.setText( this.label ) ;

		this.inputTextBuffer = new TextBuffer( {
			dst: this.screenBuffer ,
			x: this.label.length ,
			hidden: this.hidden ,
			forceInBound: true
		} ) ;
	}
	else {
		this.inputTextBuffer = new TextBuffer( {
			dst: this.screenBuffer ,
			forceInBound: true
		} ) ;
	}

	this.textAttr = ScreenBuffer.object2attr( this.textAttr ) ;
	this.emptyAttr = ScreenBuffer.object2attr( this.emptyAttr ) ;
	this.labelFocusAttr = ScreenBuffer.object2attr( this.labelFocusAttr ) ;
	this.labelBlurAttr = ScreenBuffer.object2attr( this.labelBlurAttr ) ;

	this.inputTextBuffer.setEmptyCellAttr( this.emptyAttr ) ;

	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.on( 'click' , this.onClick ) ;

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
	if ( this.labelTextBuffer ) {
		this.labelTextBuffer.setEmptyCellAttr( this.hasFocus ? this.labelFocusAttr : this.labelBlurAttr ) ;
		this.labelTextBuffer.setAttrCodeRegion( this.hasFocus ? this.labelFocusAttr : this.labelBlurAttr ) ;
		this.labelTextBuffer.draw() ;
	}

	this.inputTextBuffer.draw() ;
	this.screenBuffer.draw() ;
} ;



TextInput.prototype.drawSelfCursor = function drawSelfCursor() {
	this.inputTextBuffer.drawCursor() ;
	this.screenBuffer.drawCursor() ;
} ;



TextInput.prototype.getValue = function getValue() {
	return this.inputTextBuffer.getText() ;
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
	this.draw() ;
} ;



TextInput.prototype.onClick = function onClick( data ) {
	this.document.giveFocusTo( this , 'select' ) ;
} ;

