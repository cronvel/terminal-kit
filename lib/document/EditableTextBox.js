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
	this.onDragEnd = this.onDragEnd.bind( this ) ;
	this.onMiddleClick = this.onMiddleClick.bind( this ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	// Editable textbox get extraScrolling by default
	this.extraScrolling = options.extraScrolling !== undefined ? !! options.extraScrolling : true ;

	this.updateStatus() ;

	this.on( 'focus' , this.onFocus ) ;
	this.on( 'dragEnd' , this.onDragEnd ) ;
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
	CTRL_K: 'meta' ,
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
	META_HOME: 'scrollToCursor' ,
	CTRL_B: 'startOfSelection' ,
	CTRL_E: 'endOfSelection' ,
	SHIFT_LEFT: 'expandSelectionBackward' ,
	SHIFT_RIGHT: 'expandSelectionForward' ,
	SHIFT_UP: 'expandSelectionUp' ,
	SHIFT_DOWN: 'expandSelectionDown' ,
	CTRL_SHIFT_LEFT: 'expandSelectionStartOfWord' ,
	CTRL_SHIFT_RIGHT: 'expandSelectionEndOfWord' ,

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



EditableTextBox.prototype.insert = function( str , selectIt = false , internal = false ) {
	let x = this.textBuffer.cx ,
		y = this.textBuffer.cy ;

	let count = this.textBuffer.insert( str , this.textAttr ) ;

	if ( ! internal ) {
		if ( this.stateMachine ) {
			this.textBuffer.runStateMachine() ;
		}

		if ( selectIt ) {
			this.textBuffer.setSelectionRegion( {
				xmin: x , ymin: y , xmax: this.textBuffer.cx , ymax: this.textBuffer.cy
			} ) ;
		}

		this.autoScrollAndDraw() ;
	}
	else if ( selectIt ) {
		this.textBuffer.setSelectionRegion( {
			xmin: x , ymin: y , xmax: this.textBuffer.cx , ymax: this.textBuffer.cy
		} ) ;
	}

	this.emit( 'change' , {
		type: 'insert' ,
		insertedString: str ,
		count ,
		internal ,
		startPosition: { x , y } ,
		endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
	} ) ;
} ;



EditableTextBox.prototype.deleteSelection = function( internal = false ) {
	if ( ! this.textBuffer.selectionRegion ) { return ; }

	var { xmin , xmax , ymin , ymax } = this.textBuffer.selectionRegion ;
	var deleted = this.textBuffer.deleteSelection( true ) ;

	if ( deleted && deleted.count ) {
		if ( ! internal ) {
			this.textBuffer.cx = xmin ;
			this.textBuffer.cy = ymin ;

			if ( this.stateMachine ) {
				this.textBuffer.runStateMachine() ;
			}
			this.autoScrollAndDraw() ;
		}

		this.emit( 'change' , {
			type: 'delete' ,
			count: deleted.count ,
			internal ,
			deletedString: deleted.string ,
			startPosition: { x: xmin , y: ymin } ,
			endPosition: { x: xmin , y: ymin }
		} ) ;
	}
} ;



EditableTextBox.prototype.deleteRegion = function( region , internal = false ) {
	var { xmin , xmax , ymin , ymax } = region ;
	var deleted = this.textBuffer.deleteRegion( region , true ) ;

	if ( deleted && deleted.count ) {
		if ( ! internal ) {
			this.textBuffer.cx = xmin ;
			this.textBuffer.cy = ymin ;

			if ( this.stateMachine ) {
				this.textBuffer.runStateMachine() ;
			}
			this.autoScrollAndDraw() ;
		}

		this.emit( 'change' , {
			type: 'delete' ,
			count: deleted.count ,
			internal ,
			deletedString: deleted.string ,
			startPosition: { x: xmin , y: ymin } ,
			endPosition: { x: xmin , y: ymin }
		} ) ;
	}
} ;



EditableTextBox.prototype.drawSelfCursor = function() {
	this.textBuffer.drawCursor() ;
} ;



EditableTextBox.prototype.getValue = TextBox.prototype.getContent ;



EditableTextBox.prototype.setValue = function( value , dontDraw ) {
	return this.setContent( value , false , dontDraw ) ;
} ;



EditableTextBox.prototype.onFocus = function( focus , type ) {
	this.updateStatus() ;
	this.draw() ;
} ;



EditableTextBox.prototype.onClick = function( data ) {
	//console.error( "ETB Click:" , data ) ;
	if ( this.hasFocus ) {
		this.textBuffer.moveTo( data.x - this.scrollX , data.y - this.scrollY ) ;

		if ( this.textBuffer.selectionRegion ) {
			this.textBuffer.resetSelectionRegion() ;
			this.draw() ;
		}
		else {
			this.drawCursor() ;
		}
	}
	else {
		this.document.giveFocusTo( this , 'select' ) ;
	}
} ;



EditableTextBox.prototype.onDragEnd = function( data ) {
	if ( this.hasFocus ) {
		if ( data.yFrom < data.y || ( data.yFrom === data.y && data.xFrom <= data.x ) ) {
			// Forward selection, put the cursor one cell to the right
			this.textBuffer.moveTo( data.x - this.scrollX + 1 , data.y - this.scrollY ) ;
		}
		else {
			// Backward selection, put the cursor one the current cell
			this.textBuffer.moveTo( data.x - this.scrollX , data.y - this.scrollY ) ;
		}

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
		this.document.getSystemClipboard( 'primary' ).then( str => {
			if ( str ) {
				this.textBuffer.insert( str , this.textAttr ) ;
				if ( this.stateMachine ) {
					this.textBuffer.runStateMachine() ;
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
	}
	this.autoScrollAndDraw() ;
	this.emit( 'change' , {
		type: 'insert' ,
		insertedString: key ,
		count ,
		internal: false ,
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

	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
	}
	this.autoScrollAndDraw() ;
	this.emit( 'change' , {
		type: 'insert' ,
		insertedString ,
		count ,
		internal: false ,
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
	}
	this.autoScrollAndDraw() ;
	this.emit( 'change' , {
		type: 'insert' ,
		insertedString: '\t' ,
		count: 1 ,
		internal: false ,
		startPosition: { x , y } ,
		endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
	} ) ;
} ;

userActions.delete = function() {
	var x = this.textBuffer.cx ,
		y = this.textBuffer.cy ,
		selectionRegion = this.textBuffer.selectionRegion ;

	if ( selectionRegion && selectionRegion.ymin === y && selectionRegion.xmin === x ) {
		// Instead, delete the whole selection
		this.deleteSelection() ;
		return ;
	}

	var deleted = this.textBuffer.delete( 1 , true ) ;
	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
	}
	this.autoScrollAndDraw() ;

	if ( deleted && deleted.count ) {
		this.emit( 'change' , {
			type: 'delete' ,
			count: deleted.count ,
			internal: false ,
			deletedString: deleted.string ,
			startPosition: { x , y } ,
			endPosition: { x: this.textBuffer.cx , y: this.textBuffer.cy }
		} ) ;
	}
} ;

userActions.backDelete = function() {
	var x = this.textBuffer.cx ,
		y = this.textBuffer.cy ,
		selectionRegion = this.textBuffer.selectionRegion ;

	if ( selectionRegion ) {
		let coord = this.textBuffer.oneStepBackward() ;
		if ( selectionRegion.ymax === coord.y && selectionRegion.xmax === coord.x ) {
			// Instead, delete the whole selection
			this.deleteSelection() ;
			return ;
		}
	}

	var deleted = this.textBuffer.backDelete( 1 , true ) ;
	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
	}
	this.autoScrollAndDraw() ;

	if ( deleted && deleted.count ) {
		this.emit( 'change' , {
			type: 'backDelete' ,
			count: deleted.count ,
			internal: false ,
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
	}
	this.autoScrollAndDraw() ;

	if ( deleted && deleted.count ) {
		this.emit( 'change' , {
			type: 'delete' ,
			count: deleted.count ,
			internal: false ,
			deletedString: deleted.string ,
			startPosition: { x: 0 , y } ,
			endPosition: { x: 0 , y: this.textBuffer.cy }
		} ) ;
	}
} ;

userActions.backward = function() {
	this.textBuffer.moveBackward() ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.forward = function() {
	this.textBuffer.moveForward() ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.startOfWord = function() {
	this.textBuffer.moveToStartOfWord() ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.endOfWord = function() {
	this.textBuffer.moveToEndOfWord() ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.startOfLine = function() {
	this.textBuffer.moveToColumn( 0 ) ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

// Start of line, but if already at cx = 0, move to the first non-white char (skip indent),
// Also known as “smart home”.
userActions.smartStartOfLine = function() {
	if ( this.textBuffer.cx !== 0 ) {
		this.textBuffer.moveToColumn( 0 ) ;
	}
	else {
		let cy = this.textBuffer.cy ;
		this.textBuffer.moveForward( ( char , x , y ) => y !== cy || ( char !== ' ' && char !== '\t' ) ) ;

		if ( this.textBuffer.cy !== cy ) {
			// Line has changed, it was an empty line: fallback!
			this.textBuffer.moveTo( 0 , cy ) ;
		}
	}

	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.endOfLine = function() {
	this.textBuffer.moveToEndOfLine() ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.down = function() {
	this.textBuffer.moveDown() ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.up = function() {
	this.textBuffer.moveUp() ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.left = function() {
	this.textBuffer.moveLeft() ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.right = function() {
	this.textBuffer.moveRight() ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.scrollUp = function() {
	var dy = Math.ceil( this.outputHeight / 2 ) ;
	this.textBuffer.move( 0 , -dy ) ;
	this.scroll( 0 , dy , true ) ; this.autoScrollAndDraw() ;
	//this.scroll( 0 , dy ) ; this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.scrollDown = function() {
	var dy = -Math.ceil( this.outputHeight / 2 ) ;
	this.textBuffer.move( 0 , -dy ) ;
	this.scroll( 0 , dy , true ) ; this.autoScrollAndDraw() ;
	//this.scroll( 0 , dy ) ; this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.scrollTop = function() {
	this.textBuffer.moveTo( 0 , 0 ) ;
	this.scrollTo( 0 , 0 ) ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.scrollBottom = function() {
	this.textBuffer.moveTo( 0 , this.textBuffer.buffer.length - 1 ) ;
	this.autoScrollAndSmartDraw() ;
	this.emit( 'cursorMove' ) ;
} ;

userActions.scrollToCursor = function() {
	this.autoScrollAndDraw() ;
} ;

userActions.expandSelectionBackward = function() {
	var selection = this.textBuffer.selectionRegion ,
		cx = this.textBuffer.cx ,
		cy = this.textBuffer.cy ,
		oneStepBackward = this.textBuffer.oneStepBackward() ;

	if ( selection && selection.xmin === cx && selection.ymin === cy ) {
		// Can expand
		this.textBuffer.moveBackward() ;
		this.textBuffer.startOfSelection() ;
	}
	else if ( selection && selection.xmax === oneStepBackward.x && selection.ymax === oneStepBackward.y ) {
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
		cy = this.textBuffer.cy ,
		oneStepBackward = this.textBuffer.oneStepBackward() ;

	if ( selection && selection.xmin === cx && selection.ymin === cy ) {
		// Can expand
		this.textBuffer.moveToStartOfWord() ;
		this.textBuffer.startOfSelection() ;
	}
	else if ( selection && selection.xmax === oneStepBackward.x && selection.ymax === oneStepBackward.y ) {
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
		cy = this.textBuffer.cy ,
		oneStepBackward = this.textBuffer.oneStepBackward() ;

	if ( selection && selection.xmin === cx && selection.ymin === cy ) {
		// Can expand
		this.textBuffer.moveUp() ;
		this.textBuffer.startOfSelection() ;
	}
	else if (
		selection && selection.xmax === oneStepBackward.x && selection.ymax === oneStepBackward.y
		// Check that there is at least one line of selection
		&& ( selection.ymin < oneStepBackward.y - 1 || ( selection.ymin === oneStepBackward.y - 1 && selection.xmin <= oneStepBackward.x ) )
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
		cy = this.textBuffer.cy ,
		oneStepBackward = this.textBuffer.oneStepBackward() ;

	if ( selection && selection.xmax === oneStepBackward.x && selection.ymax === oneStepBackward.y ) {
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
		cy = this.textBuffer.cy ,
		oneStepBackward = this.textBuffer.oneStepBackward() ;

	if ( selection && selection.xmax === oneStepBackward.x && selection.ymax === oneStepBackward.y ) {
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
		cy = this.textBuffer.cy ,
		oneStepBackward = this.textBuffer.oneStepBackward() ;

	if ( selection && selection.xmax === oneStepBackward.x && selection.ymax === oneStepBackward.y ) {
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

userActions.moveSelection = function() {
	var str = this.textBuffer.getSelectionText() ;
	if ( ! str ) { return ; }

	this.deleteSelection( true ) ;
	this.insert( str , true ) ;
} ;

userActions.pasteSelection = function() {
	var str = this.textBuffer.getSelectionText() ;
	if ( str ) { this.insert( str ) ; }
} ;

userActions.pasteDocumentClipboard = function() {
	if ( this.document ) {
		let str = this.document.getDocumentClipboard() ;
		if ( str && typeof str === 'string' ) {
			this.insert( str ) ;
		}
	}
} ;

userActions.pasteSystemClipboard = function() {
	if ( this.document ) {
		this.document.getSystemClipboard()
			.then( str => {
				if ( str && typeof str === 'string' ) {
					this.insert( str ) ;
				}
			} )
			.catch( () => undefined ) ;
	}
} ;

userActions.deleteSelection = function() {
	this.deleteSelection() ;
} ;

userActions.clearDocumentClipboard = function() {
	if ( this.document ) {
		this.document.clearDocumentClipboard( this.textBuffer.getSelectionText() ) ;
	}
} ;

userActions.clearSystemClipboard = function() {
	if ( this.document ) {
		this.document.clearSystemClipboard( this.textBuffer.getSelectionText() ).catch( () => undefined ) ;
	}
} ;
