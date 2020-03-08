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



const EditableTextBox = require( './EditableTextBox.js' ) ;
const string = require( 'string-kit' ) ;



/*
	This is the Document-model version of .inputField().
	Like an EditableTextBox, with a one-line hard-line-wrap TextBuffer, outputHeight start at 1 but can grow when the user
	type a lot of thing, can auto-complete with or without menu, have history, and so on...
*/

function InlineInput( options = {} ) {
	if ( options.value ) { options.content = options.value ; }

	options.scrollable = options.hasVScrollBar = options.hasHScrollBar = options.extraScrolling = false ;
	options.scrollX = options.scrollY = 0 ;
	options.lineWrap = true ;

	EditableTextBox.call( this , options ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'InlineInput' && ! options.noDraw ) { this.draw() ; }
}

module.exports = InlineInput ;

InlineInput.prototype = Object.create( EditableTextBox.prototype ) ;
InlineInput.prototype.constructor = InlineInput ;
InlineInput.prototype.elementType = 'InlineInput' ;



InlineInput.prototype.destroy = function( isSubDestroy ) {
	EditableTextBox.prototype.destroy.call( this , isSubDestroy ) ;
} ;



InlineInput.prototype.keyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	ESCAPE: 'cancel' ,
	TAB: 'autoComplete' ,
	CTRL_R: 'historyAutoComplete' ,
	UP: 'historyPrevious' ,
	DOWN: 'historyNext' ,
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	CTRL_LEFT: 'startOfWord' ,
	CTRL_RIGHT: 'endOfWord' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine' ,
	CTRL_O: 'copyClipboard' ,
	CTRL_P: 'pasteClipboard'
} ;



InlineInput.prototype.autoResizeAndDraw = function( onlyDrawCursor = false ) {


// --------------- TODO ---------------------------------------------------------------------------------


	if ( ! onlyDrawCursor ) {
		this.draw() ;
	}
	else {
		this.drawCursor() ;
	}
} ;



InlineInput.prototype.onKey = function( key , trash , data ) {
	var dy ;

	if ( data && data.isCharacter ) {
		this.textBuffer.insert( key , this.textAttr ) ;
		this.textBuffer.runStateMachine() ;
		this.autoResizeAndDraw() ;
	}
	else {
		// Here we have a special key

		switch( this.keyBindings[ key ] ) {
			case 'submit' :
// --------------- TODO ---------------------------------------------------------------------------------
				break ;

			case 'cancel' :
// --------------- TODO ---------------------------------------------------------------------------------
				break ;

			case 'autoComplete' :
// --------------- TODO ---------------------------------------------------------------------------------
				break ;

			case 'historyAutoComplete' :
// --------------- TODO ---------------------------------------------------------------------------------
				break ;

			case 'historyPrevious' :
// --------------- TODO ---------------------------------------------------------------------------------
				break ;

			case 'historyNext' :
// --------------- TODO ---------------------------------------------------------------------------------
				break ;

			case 'backDelete' :
				this.textBuffer.backDelete() ;
				this.textBuffer.runStateMachine() ;
				this.autoResizeAndDraw() ;
				break ;

			case 'delete' :
				this.textBuffer.delete() ;
				this.textBuffer.runStateMachine() ;
				this.autoResizeAndDraw() ;
				break ;

			case 'backward' :
				this.textBuffer.moveBackward() ;
				this.autoResizeAndDrawCursor() ;
				break ;

			case 'forward' :
				this.textBuffer.moveForward() ;
				this.autoResizeAndDrawCursor() ;
				break ;

			case 'startOfWord' :
				this.textBuffer.moveToStartOfWord() ;
				this.autoResizeAndDrawCursor() ;
				break ;

			case 'endOfWord' :
				this.textBuffer.moveToEndOfWord() ;
				this.autoResizeAndDrawCursor() ;
				break ;

			case 'startOfLine' :
				this.textBuffer.moveToColumn( 0 ) ;
				this.autoResizeAndDrawCursor() ;
				break ;

			case 'endOfLine' :
				this.textBuffer.moveToEndOfLine() ;
				this.autoResizeAndDrawCursor() ;
				break ;

			case 'left' :
				this.textBuffer.moveLeft() ;
				this.autoResizeAndDrawCursor() ;
				break ;

			case 'right' :
				this.textBuffer.moveRight() ;
				this.autoResizeAndDrawCursor() ;
				break ;

			case 'pasteClipboard' :
				if ( this.document ) {
					this.document.getClipboard().then( str => {
						if ( str ) {
							this.textBuffer.insert( str , this.textAttr ) ;
							this.textBuffer.runStateMachine() ;
							this.autoResizeAndDraw() ;
						}
					} )
						.catch( () => undefined ) ;
				}
				break ;

			case 'copyClipboard' :
				if ( this.document ) {
					this.document.setClipboard( this.textBuffer.getSelectionText() ).catch( () => undefined ) ;
				}
				break ;

			default :
				return ;	// Bubble up
		}
	}

	return true ;		// Do not bubble up
} ;



/*
InlineInput.prototype.onFocus = function( focus , type ) {
	this.hasFocus = focus ;
	this.updateStatus() ;
	this.draw() ;
} ;
*/


/*
InlineInput.prototype.onClick = function( data ) {
	if ( ! this.hasFocus ) {
		this.document.giveFocusTo( this , 'select' ) ;
	}
	else {
		this.textBuffer.moveTo( data.x - this.scrollX , data.y - this.scrollY ) ;
		this.drawCursor() ;
	}
} ;
*/

/*
InlineInput.prototype.onMiddleClick = function( data ) {
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
				this.autoResizeAndDraw() ;
			}
			//else { this.drawCursor() ; }
		} )
			.catch( () => undefined ) ;
	}
	//else { this.drawCursor() ; }
} ;
*/


// There isn't much to do ATM
//InlineInput.prototype.updateStatus = function() {} ;

