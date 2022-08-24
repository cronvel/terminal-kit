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
const TextBox = require( './TextBox.js' ) ;
const string = require( 'string-kit' ) ;



function EditableTextBox( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	if ( options.value ) { options.content = options.value ; }

	TextBox.call( this , options ) ;

	this.onFocus = this.onFocus.bind( this ) ;
	this.onMiddleClick = this.onMiddleClick.bind( this ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	// Editable textbox get extraScrolling by default
	this.extraScrolling = options.extraScrolling !== undefined ? !! options.extraScrolling : true ;

	this.updateStatus() ;

	this.on( 'focus' , this.onFocus ) ;
	this.on( 'middleClick' , this.onMiddleClick ) ;

	if ( this.setContent === EditableTextBox.prototype.setContent ) {
		this.setContent( options.content , options.contentHasMarkup , true ) ;
	}

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'EditableTextBox' && ! options.noDraw ) { this.draw() ; }
}

module.exports = EditableTextBox ;
Element.inherit( EditableTextBox , TextBox ) ;



EditableTextBox.prototype.needInput = true ;



EditableTextBox.prototype.keyBindings = {
	ENTER: 'newLine' ,
	KP_ENTER: 'newLine' ,
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	CTRL_LEFT: 'startOfWord' ,
	CTRL_RIGHT: 'endOfWord' ,
	UP: 'up' ,
	DOWN: 'down' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine' ,
	TAB: 'tab' ,
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
} ;



EditableTextBox.prototype.drawSelfCursor = function() {
	this.textBuffer.drawCursor() ;
} ;



EditableTextBox.prototype.getValue = TextBox.prototype.getContent ;



EditableTextBox.prototype.setValue = EditableTextBox.prototype.setContent = function( value , dontDraw ) {
	return TextBox.prototype.setContent.call( this , value , false , dontDraw ) ;
} ;



EditableTextBox.prototype.onFocus = function( focus , type ) {
	this.hasFocus = focus ;
	this.updateStatus() ;
	this.draw() ;
} ;



EditableTextBox.prototype.onClick = function( data ) {
	if ( ! this.hasFocus ) {
		this.document.giveFocusTo( this , 'select' ) ;
	}
	else {
		this.textBuffer.moveTo( data.x - this.scrollX , data.y - this.scrollY ) ;
		this.drawCursor() ;
	}
} ;



EditableTextBox.prototype.onMiddleClick = function( data ) {
	if ( ! this.hasFocus ) {
		this.document.giveFocusTo( this , 'select' ) ;
	}

	// Do not moveTo, it's quite boring
	//this.textBuffer.moveTo( data.x , data.y ) ;

	if ( this.document ) {
		this.document.getClipboard( 'primary' ).then( str => {
			if ( str ) {
				this.textBuffer.insert( str , this.textAttr ) ;
				this.textBuffer.runStateMachine() ;
				this.autoScrollAndDraw() ;
			}
			//else { this.drawCursor() ; }
		} )
			.catch( () => undefined ) ;
	}
	//else { this.drawCursor() ; }
} ;



// There isn't much to do ATM
EditableTextBox.prototype.updateStatus = function() {} ;



const userActions = EditableTextBox.prototype.userActions ;

userActions.character = function( key , trash , data ) {
	this.textBuffer.insert( key , this.textAttr ) ;
	this.textBuffer.runStateMachine() ;
	this.autoScrollAndDraw() ;
} ;

userActions.newLine = function() {
	this.textBuffer.newLine() ;
	this.textBuffer.runStateMachine() ;
	this.autoScrollAndDraw() ;
} ;

userActions.backDelete = function() {
	this.textBuffer.backDelete() ;
	this.textBuffer.runStateMachine() ;
	this.autoScrollAndDraw() ;
} ;

userActions.delete = function() {
	this.textBuffer.delete() ;
	this.textBuffer.runStateMachine() ;
	this.autoScrollAndDraw() ;
} ;

userActions.backward = function() {
	this.textBuffer.moveBackward() ;
	this.autoScrollAndDrawCursor() ;
} ;

userActions.forward = function() {
	this.textBuffer.moveForward() ;
	this.autoScrollAndDrawCursor() ;
} ;

userActions.startOfWord = function() {
	this.textBuffer.moveToStartOfWord() ;
	this.autoScrollAndDrawCursor() ;
} ;

userActions.endOfWord = function() {
	this.textBuffer.moveToEndOfWord() ;
	this.autoScrollAndDrawCursor() ;
} ;

userActions.startOfLine = function() {
	this.textBuffer.moveToColumn( 0 ) ;
	this.autoScrollAndDrawCursor() ;
} ;

userActions.endOfLine = function() {
	this.textBuffer.moveToEndOfLine() ;
	this.autoScrollAndDrawCursor() ;
} ;

userActions.down = function() {
	this.textBuffer.moveDown() ;
	this.autoScrollAndDrawCursor() ;
} ;

userActions.up = function() {
	this.textBuffer.moveUp() ;
	this.autoScrollAndDrawCursor() ;
} ;

userActions.left = function() {
	this.textBuffer.moveLeft() ;
	this.autoScrollAndDrawCursor() ;
} ;

userActions.right = function() {
	this.textBuffer.moveRight() ;
	this.autoScrollAndDrawCursor() ;
} ;

userActions.tab = function() {
	this.textBuffer.insert( '\t' , this.textAttr ) ;
	this.textBuffer.runStateMachine() ;
	this.autoScrollAndDraw() ;
} ;

userActions.scrollUp = function() {
	var dy = Math.ceil( this.outputHeight / 2 ) ;
	this.textBuffer.move( 0 , -dy ) ;
	this.scroll( 0 , dy ) ;
} ;

userActions.scrollDown = function() {
	var dy = -Math.ceil( this.outputHeight / 2 ) ;
	this.textBuffer.move( 0 , -dy ) ;
	this.scroll( 0 , dy ) ;
} ;

userActions.startOfSelection = function() {
	this.textBuffer.startOfSelection() ;
	this.draw() ;
} ;

userActions.endOfSelection = function() {
	this.textBuffer.endOfSelection() ;
	this.draw() ;
} ;

userActions.paste = function() {
	if ( this.document ) {
		let str = this.document.getCopyBuffer() ;
		if ( str && typeof str === 'string' ) {
			this.textBuffer.insert( str , this.textAttr ) ;
			this.textBuffer.runStateMachine() ;
			this.autoScrollAndDraw() ;
		}
	}
} ;

userActions.pasteClipboard = function() {
	if ( this.document ) {
		this.document.getClipboard()
			.then( str => {
				if ( str ) {
					this.textBuffer.insert( str , this.textAttr ) ;
					this.textBuffer.runStateMachine() ;
					this.autoScrollAndDraw() ;
				}
			} )
			.catch( () => undefined ) ;
	}
} ;

