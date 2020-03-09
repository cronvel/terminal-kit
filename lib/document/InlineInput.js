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
const RowMenu = require( './RowMenu.js' ) ;
const string = require( 'string-kit' ) ;
const computeAutoCompleteArray = require( '../autoComplete.js' ) ;



/*
	This is the Document-model version of .inputField().
	Like an EditableTextBox, with a one-line hard-line-wrap TextBuffer, outputHeight start at 1 but can grow when the user
	type a lot of thing, can auto-complete with or without menu, have history, and so on...
*/

function InlineInput( options = {} ) {
	if ( options.value ) { options.content = options.value ; }

	// It is always 1 at the begining
	options.outputHeight = 1 ;
	
	// No scrolling
	options.scrollable = options.hasVScrollBar = options.hasHScrollBar = options.extraScrolling = false ;
	options.scrollX = options.scrollY = 0 ;

	// It always have line-wrapping on
	options.lineWrap = true ;

	EditableTextBox.call( this , options ) ;
	
	this.onAutoCompleteMenuSubmit = this.onAutoCompleteMenuSubmit.bind( this ) ;
	this.onAutoCompleteMenuCancel = this.onAutoCompleteMenuCancel.bind( this ) ;
	
	this.contentArray = options.history ? [ ... options.history , this.content ] : [ this.content ] ;
	this.contentIndex = this.contentArray.length - 1 ;
	
	this.disabled = !! options.disabled ;
	this.submitted = !! options.submitted ;
	this.cancelable = !! options.cancelable ;
	this.canceled = !! options.canceled ;

	this.autoComplete = options.autoComplete ;
	this.useAutoCompleteMenu = !! ( options.useAutoCompleteMenu || options.autoCompleteMenu ) ;
	this.autoCompleteMenu = null ;
	
	this.menuButtonFocusAttr = options.buttonFocusAttr || { bgColor: 'blue' , color: 'white' , bold: true } ;
	this.menuButtonBlurAttr = options.buttonBlurAttr || { bgColor: 'brightBlack' , color: 'white' , bold: true } ;
	
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
	if ( this.textBuffer.buffer.length > this.outputHeight ) {
		this.setSizeAndPosition( { outputHeight: this.textBuffer.buffer.length } ) ;
	}

	if ( ! onlyDrawCursor ) {
		this.draw() ;
	}
	else {
		this.drawCursor() ;
	}
} ;



InlineInput.prototype.autoResizeAndDrawCursor = function() {
	return this.autoResizeAndDraw( true ) ;
} ;



InlineInput.prototype.runAutoComplete = async function( autoComplete ) {
	var autoCompleted ,
		[ leftPart , rightPart ] = this.textBuffer.getCursorSplittedText() ;
	
	if ( Array.isArray( autoComplete ) ) {
		autoCompleted = computeAutoCompleteArray( autoComplete , leftPart , this.useAutoCompleteMenu ) ;
	}
	else if ( typeof autoComplete === 'function' ) {
		autoCompleted = await autoComplete( leftPart , this.useAutoCompleteMenu ) ;
	}
	else {
		return ;
	}

	console.error( "autoCompleted:" , autoCompleted ) ;
	if ( Array.isArray( autoCompleted ) ) {
		console.error( "ARRAY:" , autoCompleted ) ;
		if ( ! autoCompleted.length ) { return ; }

		if ( this.useAutoCompleteMenu ) {
			autoCompleted = await this.runAutoCompleteMenu( autoCompleted ) ;
			return ;
		}
		else {
			autoCompleted = autoCompleted[ 0 ] ;
		}
	}
	
	this.textBuffer.setText( autoCompleted + rightPart ) ;
	this.textBuffer.setCursorOffset( autoCompleted.length ) ;
	this.textBuffer.runStateMachine() ;
	this.autoResizeAndDraw() ;
} ;



InlineInput.prototype.runAutoCompleteMenu = async function( items ) {
	// No items, leave now...
	if ( ! items || ! items.length ) { return ; }

	if ( this.autoCompleteMenu ) {
		// Should never happen, but just in case...
		this.autoCompleteMenu.destroy() ;
	}
	
	// Make the ColumnMenu a child of the button, so focus cycle will work as expected
	this.autoCompleteMenu = new RowMenu( {
		parent: this ,
		x: this.outputX ,
		y: this.outputY + this.outputHeight ,
		width: this.outputWidth ,
		leftPadding: ' ' ,
		rightPadding: ' ' ,
		items: items.map( item => ( { value: item , content: item } ) ) ,
		buttonFocusAttr: this.menuButtonFocusAttr ,
		buttonBlurAttr: this.menuButtonBlurAttr
	} ) ;

	this.autoCompleteMenu.on( 'submit' , this.onAutoCompleteMenuSubmit ) ;
	//this.columnMenu.on( 'focus' , this.onColumnMenuFocus ) ;

	// unused ATM
	//this.columnMenu.menuIndex = index ;

	//this.document.giveFocusTo( this.columnMenu , 'delegate' ) ;
} ;



InlineInput.prototype.onAutoCompleteMenuSubmit = function( ... args ) {
	console.error( 'submit menu' , ... args ) ;
	// Should never happen, but just in case...
	if ( ! this.autoCompleteMenu ) { return ; }
	
	this.autoCompleteMenu.destroy() ;
	this.autoCompleteMenu = null ;
} ;



InlineInput.prototype.onAutoCompleteMenuCancel = function( ... args ) {
	console.error( 'cancel menu' , ... args ) ;
	// Should never happen, but just in case...
	if ( ! this.autoCompleteMenu ) { return ; }
	
	this.autoCompleteMenu.destroy() ;
	this.autoCompleteMenu = null ;
} ;



InlineInput.prototype.onKey = function( key , trash , data ) {
	if ( this.autoCompleteMenu ) {
		// The autoCompleteMenu is on, do nothing
		return ;
	}


	if ( data && data.isCharacter ) {
		this.textBuffer.insert( key , this.textAttr ) ;
		this.textBuffer.runStateMachine() ;
		this.autoResizeAndDraw() ;
	}
	else {
		// Here we have a special key

		switch( this.keyBindings[ key ] ) {
			case 'submit' :
				if ( this.disabled || this.submitted || this.canceled ) { break ; }
				//this.submitted = true ;
				this.emit( 'submit' , this.getValue() , undefined , this ) ;
				break ;

			case 'cancel' :
				if ( ! this.cancelable || this.disabled || this.canceled ) { break ; }
				//this.canceled = true ;
				this.emit( 'cancel' , this ) ;
				break ;

			case 'autoComplete' :
				if ( ! this.autoComplete ) { break ; }
				this.runAutoComplete( this.autoComplete ) ;
				break ;

			case 'historyAutoComplete' :
// --------------- TODO ---------------------------------------------------------------------------------
				break ;

			case 'historyPrevious' :
				if ( this.contentIndex <= 0 ) { break ; }
				this.contentArray[ this.contentIndex ] = this.getContent() ;
				this.contentIndex -- ;
				this.setContent( this.contentArray[ this.contentIndex ] ) ;
				this.textBuffer.runStateMachine() ;
				this.autoResizeAndDraw() ;
				break ;

			case 'historyNext' :
				if ( this.contentIndex >= this.contentArray.length - 1 ) { break ; }
				this.contentArray[ this.contentIndex ] = this.getContent() ;
				this.contentIndex ++ ;
				this.setContent( this.contentArray[ this.contentIndex ] ) ;
				this.textBuffer.runStateMachine() ;
				this.autoResizeAndDraw() ;
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

