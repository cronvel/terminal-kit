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



const TextBox = require( './TextBox.js' ) ;

/*
const ScreenBuffer = require( '../ScreenBuffer.js' ) ;
const TextBuffer = require( '../TextBuffer.js' ) ;
const Rect = require( '../Rect.js' ) ;
*/

const string = require( 'string-kit' ) ;



function EditableTextBox( options = {} ) {
	if ( options.value ) { options.content = options.value ; }

	TextBox.call( this , options ) ;

	this.onKey = this.onKey.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	this.updateStatus() ;

	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.on( 'click' , this.onClick ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'EditableTextBox' && ! options.noDraw ) { this.draw() ; }
}

module.exports = EditableTextBox ;

EditableTextBox.prototype = Object.create( TextBox.prototype ) ;
EditableTextBox.prototype.constructor = EditableTextBox ;
EditableTextBox.prototype.elementType = 'EditableTextBox' ;



EditableTextBox.prototype.destroy = function destroy( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;
	this.off( 'click' , this.onClick ) ;

	TextBox.prototype.destroy.call( this , isSubDestroy ) ;
} ;



EditableTextBox.prototype.keyBindings = {
	ENTER: 'newLine' ,
	KP_ENTER: 'newLine' ,
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	UP: 'up' ,
	DOWN: 'down' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine' ,
	TAB: 'tab'
} ;



EditableTextBox.prototype.drawSelfCursor = function drawSelfCursor() {
	this.textBuffer.drawCursor() ;
} ;



EditableTextBox.prototype.getValue = TextBox.prototype.getContent ;



EditableTextBox.prototype.setValue = function setValue( value , dontDraw ) {
	return TextBox.prototype.setContent.call( value , false , dontDraw ) ;
} ;



EditableTextBox.prototype.onKey = function onKey( key , trash , data ) {
	if ( data && data.isCharacter ) {
		this.textBuffer.insert( key , this.textAttr ) ;
		this.textBuffer.runStateMachine() ;
		this.draw() ;
	}
	else {
		// Here we have a special key

		switch( this.keyBindings[ key ] ) {
			case 'newLine' :
				this.textBuffer.newLine() ;
				this.textBuffer.runStateMachine() ;
				this.draw() ;
				break ;

			case 'backDelete' :
				this.textBuffer.backDelete() ;
				this.textBuffer.runStateMachine() ;
				this.draw() ;
				break ;

			case 'delete' :
				this.textBuffer.delete() ;
				this.textBuffer.runStateMachine() ;
				this.draw() ;
				break ;

			case 'backward' :
				this.textBuffer.moveBackward() ;
				this.drawCursor() ;
				break ;

			case 'forward' :
				this.textBuffer.moveForward() ;
				this.drawCursor() ;
				break ;

			case 'startOfLine' :
				this.textBuffer.moveToColumn( 0 ) ;
				this.drawCursor() ;
				break ;

			case 'endOfLine' :
				this.textBuffer.moveToEndOfLine() ;
				this.drawCursor() ;
				break ;

			case 'down' :
				this.textBuffer.moveDown() ;
				this.drawCursor() ;
				break ;

			case 'up' :
				this.textBuffer.moveUp() ;
				this.drawCursor() ;
				break ;

			case 'left' :
				this.textBuffer.moveLeft() ;
				this.drawCursor() ;
				break ;

			case 'right' :
				this.textBuffer.moveRight() ;
				this.drawCursor() ;
				break ;

			case 'tab' :
				this.textBuffer.insert( '\t' , this.textAttr ) ;
				this.textBuffer.runStateMachine() ;
				this.draw() ;
				break ;

			default :
				return ;	// Bubble up
		}
	}

	return true ;		// Do not bubble up
} ;



EditableTextBox.prototype.onFocus = function onFocus( focus , type ) {
	this.hasFocus = focus ;
	this.updateStatus() ;
	this.draw() ;
} ;



EditableTextBox.prototype.onClick = function onClick( data ) {
	this.document.giveFocusTo( this , 'select' ) ;
} ;



// There isn't much to do ATM
EditableTextBox.prototype.updateStatus = function updateStatus() {} ;

