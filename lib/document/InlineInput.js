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
const EditableTextBox = require( './EditableTextBox.js' ) ;
const RowMenu = require( './RowMenu.js' ) ;

const Promise = require( 'seventh' ) ;
const string = require( 'string-kit' ) ;
const computeAutoCompleteArray = require( '../autoComplete.js' ) ;



/*
	This is the Document-model version of .inputField().
	Like an EditableTextBox, with a one-line hard-line-wrap TextBuffer, outputHeight start at 1 but can grow
	as more input is entered by the user, can auto-complete with or without menu, have history, and so on...
*/

/*
	Check-list of things that .inputField() has and InlineInput still don't:
		* Inline mode, capable of adding a new line at the end of the screen when it is needed
		* editing actions: deleteAllBefore, deleteAllAfter, deletePreviousWord, deleteNextWord
		* allow placeholder to be used as default (submitting without actually entering anything) when appropriate
		* disable echoing (no output and no cursor movements)
		* setting the cursor "offset" position beforehand
		* min/max length
		* Maybe (very low priority): support for the .inputField()'s token feature (tokenHook, tokenResetHook, tokenRegExp).
*/

function InlineInput( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	if ( options.value ) { options.content = options.value ; }

	// It is always 1 at the begining
	options.outputHeight = 1 ;

	// No scrolling
	options.scrollable = options.hasVScrollBar = options.hasHScrollBar = options.extraScrolling = false ;
	options.scrollX = options.scrollY = 0 ;

	// It always have line-wrapping on
	options.lineWrap = true ;

	this.onAutoCompleteMenuSubmit = this.onAutoCompleteMenuSubmit.bind( this ) ;
	this.onAutoCompleteMenuItemFocus = this.onAutoCompleteMenuItemFocus.bind( this ) ;
	this.onAutoCompleteMenuCancel = this.onAutoCompleteMenuCancel.bind( this ) ;

	this.promptTextBox = null ;

	if ( options.prompt ) {
		this.promptTextBox = new TextBox( Object.assign(
			{
				textAttr: options.textAttr
			} ,
			options.prompt ,
			{
				internal: true ,
				//parent: this ,
				outputX: options.outputX || options.x ,
				outputY: options.outputY || options.y ,
				outputWidth: options.outputWidth || options.width ,
				outputHeight: options.outputHeight || options.height ,
				lineWrap: options.lineWrap ,
				wordWrap: options.wordWrap || options.wordwrap
			}
		) ) ;

		// Drop void cells
		this.promptTextBox.textBuffer.setVoidAttr( null ) ;

		let size = this.promptTextBox.getContentSize() ;
		this.promptTextBox.setSizeAndPosition( size ) ;

		if ( size.height > 1 ) {
			options.outputY = ( options.outputY || options.y ) + size.height - 1 ;
			options.firstLineRightShift = this.promptTextBox.textBuffer.buffer[ this.promptTextBox.textBuffer.buffer.length - 1 ].length ;
		}
		else {
			options.firstLineRightShift = size.width ;
		}
	}

	EditableTextBox.call( this , options ) ;


	this.history = options.history ;
	this.contentArray = options.history ? [ ... options.history , this.content ] : [ this.content ] ;
	this.contentIndex = this.contentArray.length - 1 ;

	this.noEmpty = !! options.noEmpty ;	// if set, do not submit empty string

	this.disabled = !! options.disabled ;
	this.submitted = !! options.submitted ;
	this.cancelable = !! options.cancelable ;
	this.canceled = !! options.canceled ;

	this.autoComplete = options.autoComplete ;
	this.useAutoCompleteHint = !! ( this.autoComplete && ( options.useAutoCompleteHint || options.autoCompleteHint ) ) ;
	this.autoCompleteHintMinInput = options.autoCompleteHintMinInput || 1 ;	// number of input chars before starting to hint
	this.useAutoCompleteMenu = !! ( this.autoComplete && ( options.useAutoCompleteMenu || options.autoCompleteMenu ) ) ;
	this.autoCompleteMenu = null ;
	this.autoCompleteLeftPart = null ;
	this.autoCompleteRightPart = null ;
	this.autoCompleteCursorCell = null ;
	this.autoCompleteMenuPrefix = null ;
	this.autoCompleteMenuPostfix = null ;

	this.menuOptions = Object.assign( {} , this.defaultMenuOptions , options.menu ) ;

	this.placeholder = options.placeholder ;
	this.placeholderHasMarkup = options.placeholderHasMarkup ;

	if ( this.placeholder ) {
		this.setAltContent( this.placeholder , this.placeholderHasMarkup ) ;
	}

	if ( this.promptTextBox ) {
		this.attach( this.promptTextBox ) ;
	}

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'InlineInput' && ! options.noDraw ) { this.draw() ; }
}

module.exports = InlineInput ;
Element.inherit( InlineInput , EditableTextBox ) ;



// Has a fallback textBuffer for hint/placeholder
InlineInput.prototype.useAltTextBuffer = true ;



InlineInput.prototype.defaultMenuOptions = {
	buttonBlurAttr: { bgColor: 'default' , color: 'default' } ,
	buttonFocusAttr: { bgColor: 'green' , color: 'blue' , dim: true } ,
	buttonDisabledAttr: { bgColor: 'white' , color: 'brightBlack' } ,
	buttonSubmittedAttr: { bgColor: 'brightWhite' , color: 'brightBlack' } ,
	buttonSeparatorAttr: { bgColor: 'default' } ,
	backgroundAttr: { bgColor: 'default' } ,
	//leftPadding: ' ' , rightPadding: ' ' ,
	justify: true ,
	keyBindings: Object.assign( {} , RowMenu.prototype.keyBindings , {
		TAB: 'next' ,
		SHIFT_TAB: 'previous'
	} )
} ;



InlineInput.prototype.keyBindings = {
	CTRL_K: 'meta' ,
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
	CTRL_B: 'startOfSelection' ,
	CTRL_E: 'endOfSelection' ,

	// T for Transfer
	//CTRL_T: 'moveSelection' ,		// TODO
	ALT_T: 'copyToDocumentClipboard' ,
	META_T: 'copyToSystemClipboard' ,
	// P for Paste / Put
	CTRL_P: 'pasteSelection' ,
	ALT_P: 'pasteDocumentClipboard' ,
	META_P: 'pasteSystemClipboard' ,
	// D for Delete
	//CTRL_D: 'deleteSelection' ,	// TODO
	ALT_D: 'clearDocumentClipboard' ,
	META_D: 'clearSystemClipboard'
} ;



InlineInput.prototype.insert = function( str ) {
	this.textBuffer.insert( str , this.textAttr ) ;
	this.textBuffer.runStateMachine() ;
	if ( this.useAutoCompleteHint ) { this.runAutoCompleteHint( this.autoComplete ) ; } // async
	else { this.autoResizeAndDraw() ; }
} ;



InlineInput.prototype.preDrawSelf = function() {
	/*
	if ( this.promptTextBuffer ) {
		// It's best to force the dst now, because it avoids to set textBuffer.dst everytime it changes,
		// and it could be changed by userland (so hard to keep it in sync without setters/getters)
		this.promptTextBuffer.draw( { dst: this.outputDst } ) ;
	}
	//*/

	EditableTextBox.prototype.preDrawSelf.call( this ) ;
} ;



InlineInput.prototype.autoResizeAndDraw = function( onlyDrawCursor = false ) {
	var height = Math.max( this.textBuffer.buffer.length , ( this.altTextBuffer && this.altTextBuffer.buffer.length ) || 0 ) ;

	if ( height > this.outputHeight ) {
		this.setSizeAndPosition( { outputHeight: height } ) ;
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



InlineInput.prototype.runAutoCompleteHint = async function( autoComplete ) {
	if ( this.textBuffer.cy === 0 && this.textBuffer.cx < this.autoCompleteHintMinInput ) {
		// Not enough input for starting to hint
		this.altTextBuffer.setText( '' ) ;
		this.autoResizeAndDraw() ;
		return ;
	}

	var autoCompleted ;

	var [ leftPart , rightPart ] = this.textBuffer.getCursorSplittedText() ;

	if ( rightPart ) {
		this.altTextBuffer.setText( '' ) ;
		this.autoResizeAndDraw() ;
		return ;
	}

	if ( Array.isArray( autoComplete ) ) {
		autoCompleted = computeAutoCompleteArray( autoComplete , leftPart , false ) ;
	}
	else if ( typeof autoComplete === 'function' ) {
		autoCompleted = await autoComplete( leftPart , false ) ;
	}
	else {
		this.altTextBuffer.setText( '' ) ;
		this.autoResizeAndDraw() ;
		return ;
	}

	if ( Array.isArray( autoCompleted ) ) {
		if ( ! autoCompleted.length || autoCompleted.length > 1 ) {
			this.altTextBuffer.setText( '' ) ;
			this.autoResizeAndDraw() ;
			return ;
		}

		autoCompleted = ( autoCompleted.prefix ?? '' ) + autoCompleted[ 0 ] + ( autoCompleted.postfix ?? '' ) ;
	}

	if ( autoCompleted === leftPart ) {
		this.altTextBuffer.setText( '' ) ;
	}
	else {
		this.altTextBuffer.setText( autoCompleted ) ;
		//this.altTextBuffer.runStateMachine() ;
	}

	this.autoResizeAndDraw() ;
} ;



InlineInput.prototype.runAutoComplete = async function( autoComplete ) {
	var autoCompleted ;

	this.autoCompleteCursorCell = this.textBuffer.getCursorCell() ;
	[ this.autoCompleteLeftPart , this.autoCompleteRightPart ] = this.textBuffer.getCursorSplittedText() ;

	if ( Array.isArray( autoComplete ) ) {
		autoCompleted = computeAutoCompleteArray( autoComplete , this.autoCompleteLeftPart , this.useAutoCompleteMenu ) ;
	}
	else if ( typeof autoComplete === 'function' ) {
		autoCompleted = await autoComplete( this.autoCompleteLeftPart , this.useAutoCompleteMenu ) ;
	}
	else {
		return ;
	}

	if ( Array.isArray( autoCompleted ) ) {
		if ( ! autoCompleted.length ) { return ; }

		if ( this.useAutoCompleteMenu ) {
			this.runAutoCompleteMenu( autoCompleted ) ;
			return ;
		}

		autoCompleted = ( autoCompleted.prefix ?? '' ) + autoCompleted[ 0 ] + ( autoCompleted.postfix ?? '' ) ;
	}

	this.runAutoCompleted( autoCompleted ) ;
} ;



InlineInput.prototype.runAutoCompleted = async function( autoCompleted ) {
	if ( autoCompleted.startsWith( this.autoCompleteLeftPart ) ) {
		this.textBuffer.insert( autoCompleted.slice( this.autoCompleteLeftPart.length ) ) ;
		if ( ! this.textBuffer.updateCursorFromCell( this.autoCompleteCursorCell ) ) {
			this.textBuffer.moveToEndOfBuffer() ;
		}
	}
	else {
		this.textBuffer.setText( autoCompleted + this.autoCompleteRightPart ) ;
		this.textBuffer.moveToEndOfBuffer() ;
	}

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
	this.autoCompleteMenu = new RowMenu( Object.assign( {} , this.menuOptions , {
		internal: true ,
		parent: this ,
		x: this.outputX ,
		y: this.outputY + this.outputHeight ,
		outputWidth: this.outputWidth ,
		items: items.map( item => ( { value: item , content: item } ) )
	} ) ) ;

	this.autoCompleteMenuPrefix = items.prefix ?? '' ;
	this.autoCompleteMenuPostfix = items.postfix ?? '' ;

	this.document.giveFocusTo( this.autoCompleteMenu ) ;

	this.autoCompleteMenu.once( 'submit' , this.onAutoCompleteMenuSubmit ) ;
	this.autoCompleteMenu.once( 'cancel' , this.onAutoCompleteMenuCancel ) ;
	this.autoCompleteMenu.on( 'itemFocus' , this.onAutoCompleteMenuItemFocus ) ;
} ;



InlineInput.prototype.onAutoCompleteMenuSubmit = function( selectedText ) {
	selectedText = this.autoCompleteMenuPrefix + selectedText + this.autoCompleteMenuPostfix ;

	this.autoCompleteMenu.destroy() ;
	this.autoCompleteMenu = null ;
	this.autoCompleteMenuPrefix = null ;
	this.autoCompleteMenuPostfix = null ;

	this.document.giveFocusTo( this ) ;
	this.runAutoCompleted( selectedText ) ;
} ;



InlineInput.prototype.onAutoCompleteMenuItemFocus = function( selectedText , focus ) {
	if ( ! focus || this.autoCompleteRightPart ) { return ; }
	selectedText = this.autoCompleteMenuPrefix + selectedText + this.autoCompleteMenuPostfix ;

	if ( selectedText === this.autoCompleteLeftPart ) {
		this.altTextBuffer.setText( '' ) ;
	}
	else {
		this.altTextBuffer.setText( selectedText ) ;
		//this.altTextBuffer.runStateMachine() ;
	}

	this.autoResizeAndDraw() ;
} ;



InlineInput.prototype.onAutoCompleteMenuCancel = function() {
	this.autoCompleteMenu.destroy() ;
	this.autoCompleteMenu = null ;
	this.document.giveFocusTo( this ) ;
} ;



// Can be derived (e.g. by InlineFileInput)
InlineInput.prototype.submit = function() {
	if ( this.disabled || this.submitted || this.canceled ) { return ; }

	var value = this.getValue() ;
	if ( this.noEmpty && ! value ) { return ; }

	//this.submitted = true ;
	this.emit( 'submit' , value , undefined , this ) ;
} ;



InlineInput.prototype.onKey = function( key , trash , data ) {
	if ( this.autoCompleteMenu ) {
		// If the autoCompleteMenu is on, force a cancel
		this.autoCompleteMenu.emit( 'cancel' ) ;
	}

	return Element.prototype.onKey.call( this , key , trash , data ) ;
} ;



const userActions = InlineInput.prototype.userActions ;

userActions.character = function( key , trash , data ) {
	if ( this.placeholder ) {
		// Remove the placeholder on the first user input
		this.placeholder = null ;
		this.setAltContent( '' , false , true ) ;
	}

	this.insert( key ) ;
} ;

userActions.submit = function() {
	this.submit() ;
} ;

userActions.cancel = function() {
	if ( ! this.cancelable || this.disabled || this.canceled ) { return ; }
	//this.canceled = true ;
	this.emit( 'cancel' , this ) ;
} ;

userActions.autoComplete = function() {
	if ( ! this.autoComplete ) { return ; }
	this.runAutoComplete( this.autoComplete ) ;
} ;

userActions.historyAutoComplete = function() {
	if ( ! this.autoComplete ) { return ; }
	this.runAutoComplete( this.history ) ;
} ;

userActions.historyPrevious = function() {
	if ( this.contentIndex <= 0 ) { return ; }
	this.contentArray[ this.contentIndex ] = this.getContent() ;
	this.contentIndex -- ;
	this.setContent( this.contentArray[ this.contentIndex ] ) ;
	this.textBuffer.runStateMachine() ;
	this.autoResizeAndDraw() ;
} ;

userActions.historyNext = function() {
	if ( this.contentIndex >= this.contentArray.length - 1 ) { return ; }
	this.contentArray[ this.contentIndex ] = this.getContent() ;
	this.contentIndex ++ ;
	this.setContent( this.contentArray[ this.contentIndex ] ) ;
	this.textBuffer.runStateMachine() ;
	this.autoResizeAndDraw() ;
} ;

userActions.backDelete = function() {
	this.textBuffer.backDelete() ;
	this.textBuffer.runStateMachine() ;

	if ( this.useAutoCompleteHint ) { this.runAutoCompleteHint( this.autoComplete ) ; } // async
	else { this.autoResizeAndDraw() ; }
} ;

userActions.delete = function() {
	this.textBuffer.delete() ;
	this.textBuffer.runStateMachine() ;

	if ( this.useAutoCompleteHint ) { this.runAutoCompleteHint( this.autoComplete ) ; }	// async
	else { this.autoResizeAndDraw() ; }
} ;

