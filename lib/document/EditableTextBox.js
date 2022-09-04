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

	// Hooks
	this.newLineAutoIndentHook = options.newLineAutoIndentHook ?? null ;

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
	CTRL_DELETE: 'deleteLine' ,
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
	CTRL_X: 'deleteSelection' ,
	SHIFT_LEFT: 'expandSelectionBackward' ,
	SHIFT_RIGHT: 'expandSelectionForward' ,
	SHIFT_UP: 'expandSelectionUp' ,
	SHIFT_DOWN: 'expandSelectionDown' ,
	CTRL_SHIFT_LEFT: 'expandSelectionStartOfWord' ,
	CTRL_SHIFT_RIGHT: 'expandSelectionEndOfWord' ,
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



EditableTextBox.prototype.setValue = function( value , dontDraw ) {
	return this.setContent( value , false , dontDraw ) ;
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
				if ( this.stateMachine ) {
					this.textBuffer.runStateMachine() ;
					this.textBuffer.hilightSelection() ;
				}
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

userActions.character = function( key ) {
	var x = this.textBuffer.cx ,
		y = this.textBuffer.cy ;

	var count = this.textBuffer.insert( key , this.textAttr ) ;
	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
		this.textBuffer.hilightSelection() ;
	}
	this.autoScrollAndDraw() ;
	this.emit( 'change' , {
		type: 'insert' ,
		insertedString: key ,
		count ,
		startPosition: { x , y } ,
		endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
	} ) ;
} ;

userActions.newLine = function() {
	var insertedString = '\n' ,
		count = 1 ,
		x = this.textBuffer.cx ,
		y = this.textBuffer.cy ;

	this.textBuffer.newLine() ;

	if ( this.newLineAutoIndentHook ) {
		let indentStr = this.newLineAutoIndentHook() ;
		if ( indentStr ) {
			count += this.textBuffer.insert( indentStr ) ;
			insertedString += indentStr ;
		}
	}

	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
		this.textBuffer.hilightSelection() ;
	}
	this.autoScrollAndDraw() ;
	this.emit( 'change' , {
		type: 'insert' ,
		insertedString ,
		count ,
		startPosition: { x , y } ,
		endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
	} ) ;
} ;

userActions.tab = function() {
	var x = this.textBuffer.cx ,
		y = this.textBuffer.cy ;

	this.textBuffer.insert( '\t' , this.textAttr ) ;
	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
		this.textBuffer.hilightSelection() ;
	}
	this.autoScrollAndDraw() ;
	this.emit( 'change' , {
		type: 'insert' ,
		insertedString: '\t' ,
		count: 1 ,
		startPosition: { x , y } ,
		endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
	} ) ;
} ;

userActions.delete = function() {
	var x = this.textBuffer.cx ,
		y = this.textBuffer.cy ;

	var deleted = this.textBuffer.delete( 1 , true ) ;
	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
		this.textBuffer.hilightSelection() ;
	}
	this.autoScrollAndDraw() ;

	if ( deleted && deleted.count ) {
		this.emit( 'change' , {
			type: 'delete' ,
			count: deleted.count ,
			deletedString: deleted.string ,
			startPosition: { x , y } ,
			endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
		} ) ;
	}
} ;

userActions.backDelete = function() {
	var x = this.textBuffer.cx ,
		y = this.textBuffer.cy ;

	var deleted = this.textBuffer.backDelete( 1 , true ) ;
	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
		this.textBuffer.hilightSelection() ;
	}
	this.autoScrollAndDraw() ;

	if ( deleted && deleted.count ) {
		this.emit( 'change' , {
			type: 'backDelete' ,
			count: deleted.count ,
			deletedString: deleted.string ,
			startPosition: { x , y } ,
			endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
		} ) ;
	}
} ;

userActions.deleteLine = function() {
	var y = this.textBuffer.cy ;

	var deleted = this.textBuffer.deleteLine( true ) ;
	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
		this.textBuffer.hilightSelection() ;
	}
	this.autoScrollAndDraw() ;

	if ( deleted && deleted.count ) {
		this.emit( 'change' , {
			type: 'delete' ,
			count: deleted.count ,
			deletedString: deleted.string ,
			startPosition: { x: 0 , y } ,
			endPosition: { x: 0 , y: this.textBuffer.cy }
		} ) ;
	}
} ;

userActions.deleteSelection = function() {
	var x = this.textBuffer.cx ,
		y = this.textBuffer.cy ;

	var deleted = this.textBuffer.deleteSelection( true ) ;
	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
		// No .hilightSelection() here, cause we just deleted it
	}
	this.autoScrollAndDraw() ;

	if ( deleted && deleted.count ) {
		this.emit( 'change' , {
			type: 'delete' ,
			count: deleted.count ,
			deletedString: deleted.string ,
			startPosition: { x , y } ,
			endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
		} ) ;
	}
} ;

userActions.backward = function() {
	this.textBuffer.moveBackward() ;
	this.autoScrollAndDrawCursor() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.forward = function() {
	this.textBuffer.moveForward() ;
	this.autoScrollAndDrawCursor() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.startOfWord = function() {
	this.textBuffer.moveToStartOfWord() ;
	this.autoScrollAndDrawCursor() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.endOfWord = function() {
	this.textBuffer.moveToEndOfWord() ;
	this.autoScrollAndDrawCursor() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.startOfLine = function() {
	this.textBuffer.moveToColumn( 0 ) ;
	this.autoScrollAndDrawCursor() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.endOfLine = function() {
	this.textBuffer.moveToEndOfLine() ;
	this.autoScrollAndDrawCursor() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.down = function() {
	this.textBuffer.moveDown() ;
	this.autoScrollAndDrawCursor() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.up = function() {
	this.textBuffer.moveUp() ;
	this.autoScrollAndDrawCursor() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.left = function() {
	this.textBuffer.moveLeft() ;
	this.autoScrollAndDrawCursor() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.right = function() {
	this.textBuffer.moveRight() ;
	this.autoScrollAndDrawCursor() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.scrollUp = function() {
	var dy = Math.ceil( this.outputHeight / 2 ) ;
	this.textBuffer.move( 0 , -dy ) ;
	this.scroll( 0 , dy ) ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.scrollDown = function() {
	var dy = -Math.ceil( this.outputHeight / 2 ) ;
	this.textBuffer.move( 0 , -dy ) ;
	this.scroll( 0 , dy ) ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.expandSelectionBackward = function() {
	var selection = this.textBuffer.selectionRegion ,
		cx = this.textBuffer.cx ,
		cy = this.textBuffer.cy ;

	if ( selection && selection.xmin === cx && selection.ymin === cy ) {
		// Can expand
		this.textBuffer.moveBackward() ;
		this.textBuffer.startOfSelection() ;
	}
	else if ( selection && selection.xmax === cx - 1 && selection.ymax === cy ) {
		// Can contract
		this.textBuffer.moveBackward() ;
		this.textBuffer.endOfSelection() ;
	}
	else {
		// Start a new selection
		this.textBuffer.endOfSelection() ;
		this.textBuffer.moveBackward() ;
		this.textBuffer.startOfSelection() ;
	}

	this.autoScrollAndDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.expandSelectionStartOfWord = function() {
	var selection = this.textBuffer.selectionRegion ,
		cx = this.textBuffer.cx ,
		cy = this.textBuffer.cy ;

	if ( selection && selection.xmin === cx && selection.ymin === cy ) {
		// Can expand
		this.textBuffer.moveToStartOfWord() ;
		this.textBuffer.startOfSelection() ;
	}
	else if ( selection && selection.xmax === cx - 1 && selection.ymax === cy ) {
		// Can contract
		this.textBuffer.moveToStartOfWord() ;
		this.textBuffer.endOfSelection() ;
	}
	else {
		// Start a new selection
		this.textBuffer.endOfSelection() ;
		this.textBuffer.moveToStartOfWord() ;
		this.textBuffer.startOfSelection() ;
	}

	this.autoScrollAndDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.expandSelectionUp = function() {
	var selection = this.textBuffer.selectionRegion ,
		cx = this.textBuffer.cx ,
		cy = this.textBuffer.cy ;

	if ( selection && selection.xmin === cx && selection.ymin === cy ) {
		// Can expand
		this.textBuffer.moveUp() ;
		this.textBuffer.startOfSelection() ;
	}
	else if ( selection && selection.xmax === cx - 1 && selection.ymax === cy
		&& ( selection.ymin < cy - 1 || ( selection.ymin === cy - 1 && selection.xmin <= cx ) )
	) {
		// Can contract
		this.textBuffer.moveUp() ;
		this.textBuffer.endOfSelection() ;
	}
	else {
		// Start a new selection
		this.textBuffer.endOfSelection() ;
		this.textBuffer.moveUp() ;
		this.textBuffer.startOfSelection() ;
	}

	this.autoScrollAndDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.expandSelectionForward = function() {
	var selection = this.textBuffer.selectionRegion ,
		cx = this.textBuffer.cx ,
		cy = this.textBuffer.cy ;

	if ( selection && selection.xmax === cx - 1 && selection.ymax === cy ) {
		// Can expand
		this.textBuffer.moveForward() ;
		this.textBuffer.endOfSelection() ;
	}
	else if ( selection && selection.xmin === cx && selection.ymin === cy ) {
		// Can contract
		this.textBuffer.moveForward() ;
		this.textBuffer.startOfSelection() ;
	}
	else {
		// Start a new selection
		this.textBuffer.startOfSelection() ;
		this.textBuffer.moveForward() ;
		this.textBuffer.endOfSelection() ;
	}

	this.autoScrollAndDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.expandSelectionEndOfWord = function() {
	var selection = this.textBuffer.selectionRegion ,
		cx = this.textBuffer.cx ,
		cy = this.textBuffer.cy ;

	if ( selection && selection.xmax === cx - 1 && selection.ymax === cy ) {
		// Can expand
		this.textBuffer.moveToEndOfWord() ;
		this.textBuffer.endOfSelection() ;
	}
	else if ( selection && selection.xmin === cx && selection.ymin === cy ) {
		// Can contract
		this.textBuffer.moveToEndOfWord() ;
		this.textBuffer.startOfSelection() ;
	}
	else {
		// Start a new selection
		this.textBuffer.startOfSelection() ;
		this.textBuffer.moveToEndOfWord() ;
		this.textBuffer.endOfSelection() ;
	}

	this.autoScrollAndDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.expandSelectionDown = function() {
	var selection = this.textBuffer.selectionRegion ,
		cx = this.textBuffer.cx ,
		cy = this.textBuffer.cy ;

	if ( selection && selection.xmax === cx - 1 && selection.ymax === cy ) {
		// Can expand
		this.textBuffer.moveDown() ;
		this.textBuffer.endOfSelection() ;
	}
	else if ( selection && selection.xmin === cx && selection.ymin === cy
		&& ( selection.ymax > cy + 1 || ( selection.ymax === cy + 1 && selection.xmax >= cx - 1 ) )
	) {
		// Can contract
		this.textBuffer.moveDown() ;
		this.textBuffer.startOfSelection() ;
	}
	else {
		// Start a new selection
		this.textBuffer.startOfSelection() ;
		this.textBuffer.moveDown() ;
		this.textBuffer.endOfSelection() ;
	}

	this.autoScrollAndDraw() ;
	this.emit( 'cursorMove' ) ;
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
			let x = this.textBuffer.cx ,
				y = this.textBuffer.cy ;

			let count = this.textBuffer.insert( str , this.textAttr ) ;
			if ( this.stateMachine ) {
				this.textBuffer.runStateMachine() ;
				this.textBuffer.hilightSelection() ;
			}
			this.autoScrollAndDraw() ;
			this.emit( 'change' , {
				type: 'insert' ,
				insertedString: str ,
				count ,
				startPosition: { x , y } ,
				endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
			} ) ;
		}
	}
} ;

userActions.pasteClipboard = function() {
	if ( this.document ) {
		this.document.getClipboard()
			.then( str => {
				if ( str ) {
					let x = this.textBuffer.cx ,
						y = this.textBuffer.cy ;

					let count = this.textBuffer.insert( str , this.textAttr ) ;
					if ( this.stateMachine ) {
						this.textBuffer.runStateMachine() ;
						this.textBuffer.hilightSelection() ;
					}
					this.autoScrollAndDraw() ;
					this.emit( 'change' , {
						type: 'insert' ,
						insertedString: str ,
						count ,
						startPosition: { x , y } ,
						endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
					} ) ;
				}
			} )
			.catch( () => undefined ) ;
	}
} ;

