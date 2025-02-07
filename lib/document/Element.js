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



const misc = require( '../misc.js' ) ;
const string = require( 'string-kit' ) ;
const NextGenEvents = require( 'nextgen-events' ) ;

// Avoid requiring Document at top-level, it could cause circular require troubles
//const Document = require( './Document.js' ) ;

var autoId = 0 ;



function Element( options = {} ) {
	this.setInterruptible( true ) ;

	this.uid = autoId ++ ;	// Useful for debugging
	this.parent = options.parent && options.parent.elementType ? options.parent : null ;
	//console.error( "Creating " + this.elementType + " #" + this.uid + ( this.parent ? " (from parent " + this.parent.elementType + " #" + this.parent.uid + ")" : '' ) ) ;

	this.document = null ;
	this.destroyed = false ;

	// Event handler bindings
	this.onKey = this.onKey.bind( this ) ;

	this.inlineTerm = options.inlineTerm || null ;	// inline mode, with this terminal as output
	this.strictInline = !! (
		this.inlineTerm && this.strictInlineSupport
		&& ( options.strictInline || options.strictInline === undefined )
	) ;
	this.restoreCursorAfterDraw = !! ( this.inlineTerm && this.inlineCursorRestoreAfterDraw && ! this.strictInline ) ;

	this.outputDst = options.outputDst || ( options.parent && options.parent.inputDst ) ,
	this.inputDst = null ;
	this.label = options.label || '' ;
	this.key = options.key || null ;

	if ( this.value === undefined ) {
		// Because it can be set already by the derivative class before calling Element (preprocessing of userland values)
		this.value = options.value === undefined ? null : options.value ;
	}

	this.childId = options.childId === undefined ? null : options.childId ;	// An ID given to this element by its parent, often the index in its children array
	this.def = options.def || null ;	// internal usage, store the original def object that created the item, if any...
	this.hidden = !! options.hidden ;	// hidden: not visible and no interaction possible with this element, it also affects children
	this.disabled = !! options.disabled ;	// disabled: mostly for user-input, the element is often grayed and unselectable, effect depends on the element's type

	// Default value (ensure it's not already set)
	this.content = this.content ?? '' ;
	this.contentHasMarkup = this.contentHasMarkup ?? false ;
	this.contentWidth = this.contentWidth ?? 0 ;
	this.contentHeight = this.contentHeight ?? 0 ;

	if ( this.setContent === Element.prototype.setContent ) {
		this.setContent( options.content || '' , options.contentHasMarkup , true , true ) ;
	}

	this.meta = options.meta ;	// associate data to the element for userland business logic

	this.autoWidth = + options.autoWidth || 0 ;
	this.autoHeight = + options.autoHeight || 0 ;
	this.outputX = options.outputX || options.x || 0 ;
	this.outputY = options.outputY || options.y || 0 ;
	this.savedZIndex = this.zIndex = options.zIndex || options.z || 0 ;
	this.interceptTempZIndex = !! options.interceptTempZIndex ;	// intercept child .topZ()/.bottomZ()/.restoreZ()
	this.outputWidth =
		this.autoWidth && this.outputDst ? Math.round( this.outputDst.width * this.autoWidth ) :
		options.outputWidth ? options.outputWidth :
		options.width ? options.width :
		this.strictInline ? this.inlineTerm.width :
		1 ;
	this.outputHeight =
		this.autoHeight && this.outputDst ? Math.round( this.outputDst.height * this.autoHeight ) :
		options.outputHeight ? options.outputHeight :
		options.height ? options.height :
		this.strictInline ? this.inlineTerm.height :
		1 ;
	this.contentAdaptativeWidth = this.contentAdaptativeWidth ?? !! options.contentAdaptativeWidth ;
	this.contentAdaptativeHeight = this.contentAdaptativeHeight ?? !! options.contentAdaptativeHeight ;

	// Used by .updateDraw()
	this.needOuterDraw = false ;

	this.savedCursorX = 0 ;
	this.savedCursorY = 0 ;

	this.hasFocus = false ;
	this.children = [] ;
	this.zChildren = [] ;	// like children, but ordered by zIndex

	// Children needs an inputDst, by default, everything is the same as for output (except for Container)
	this.inputDst = this.outputDst ;
	this.inputX = this.outputX ;
	this.inputY = this.outputY ;
	this.inputWidth = this.outputWidth ;
	this.inputHeight = this.outputHeight ;

	if ( this.parent ) { this.parent.attach( this , options.id ) ; }

	if ( options.shortcuts && this.document ) {
		if ( Array.isArray( options.shortcuts ) ) { this.document.createShortcuts( this , ... options.shortcuts ) ; }
		else { this.document.createShortcuts( this , options.shortcuts ) ; }
	}
}

module.exports = Element ;

Element.prototype = Object.create( NextGenEvents.prototype ) ;
Element.prototype.constructor = Element ;
Element.prototype.elementType = 'Element' ;

const termkit = require( '../termkit.js' ) ;



// Destroy the element and all its children, detaching them and removing listeners
Element.prototype.destroy = function( isSubDestroy = false , noDraw = false ) {
	if ( this.destroyed ) { return ; }
	//console.error( "Destroying" , this.elementType , this.uid , this.key ) ;

	var i , iMax , document = this.document ;

	// Destroy children first
	for ( i = 0 , iMax = this.children.length ; i < iMax ; i ++ ) {
		this.children[ i ].destroy( true ) ;
	}

	this.removeAllListeners() ;
	this.children.length = 0 ;
	this.zChildren.length = 0 ;
	this.document.removeElementShortcuts( this ) ;

	if ( ! isSubDestroy ) {
		this.detach( noDraw ) ;
		if ( this.inlineTerm && document !== this ) { document.destroy() ; }
	}
	else {
		delete this.document.elements[ this.id ] ;
		this.id = null ;
		this.parent = null ;
		this.document = null ;
	}

	this.destroyed = true ;
} ;

// User API
Element.prototype.destroyNoRedraw = function() { return this.destroy( undefined , true ) ; } ;



Element.inherit = function( Class , FromClass = Element ) {
	Class.prototype = Object.create( FromClass.prototype ) ;
	Class.prototype.constructor = Class ;
	Class.prototype.elementType = Class.name ;

	Class.prototype.userActions = Object.create( FromClass.prototype.userActions ) ;
	Class.prototype.userActions.__parent = FromClass.prototype.userActions ;
} ;



// Debug function
Element.prototype.debugId = function() { return this.elementType + '#' + this.uid ; } ;



Element.prototype.show = function( noDraw = false ) {
	if ( ! this.hidden ) { return this ; }
	this.hidden = false ;
	if ( ! noDraw ) { this.outerDraw() ; }
	return this ;
} ;



Element.prototype.hide = function( noDraw = false ) {
	if ( this.hidden ) { return this ; }
	this.hidden = true ;

	if ( ! noDraw ) {
		// .outerDraw() with the 'force' option on, because .outerDraw() does nothing if the element is hidden, but here we want to clear it from its parent
		this.outerDraw( true ) ;
	}

	return this ;
} ;



// Clear the Element, destroy all children
Element.prototype.clear = function() {
	var i , iMax ;

	// Destroy children first
	for ( i = 0 , iMax = this.children.length ; i < iMax ; i ++ ) {
		this.children[ i ].destroy( true ) ;
	}

	this.children.length = 0 ;
	this.zChildren.length = 0 ;
	this.draw() ;
} ;



Element.prototype.attach = function( child , id ) {
	// Insert it if it is not already a child
	if ( this.children.indexOf( child ) === -1 ) {
		child.parent = this ;
		this.children.push( child ) ;
		this.zInsert( child ) ;
		//this.zSort() ;

		//this.document.assignId( this , options.id ) ;

		// Re-assign the child's outputDst to this inputDst
		child.outputDst = this.inputDst ;
		if ( ! child.inputDst ) { child.inputDst = child.outputDst ; }

		if ( this.document !== child.document ) {
			child.recursiveFixAttachment( this.document , id ) ;
		}
	}

	// /!\ Draw? /!\

	return this ;
} ;



Element.prototype.attachTo = function( parent , id ) {
	if ( parent.elementType ) { parent.attach( this , id ) ; }
	return this ;
} ;



Element.prototype.recursiveFixAttachment = function( document , id = this.id ) {
	var i , iMax ;

	// Can be null when in inline mode, or when detaching
	if ( document ) { document.assignId( this , id ) ; }
	else if ( this.document ) { this.document.unassignId( this , this.id ) ; }	// force actual id here
	else { this.id = null ; }

	this.document = document || null ;

	if ( this.parent ) {
		// Re-assign the outputDst to the parent's inputDst
		this.outputDst = this.parent.inputDst ;
		if ( ! this.inputDst ) { this.inputDst = this.outputDst ; }
	}

	for ( i = 0 , iMax = this.children.length ; i < iMax ; i ++ ) {
		this.children[ i ].recursiveFixAttachment( document ) ;
	}
} ;




Element.prototype.detach = function( noDraw = false ) {
	var index , parent = this.parent ;

	// Already detached
	if ( ! parent ) { return ; }

	index = parent.children.indexOf( this ) ;
	if ( index >= 0 ) { parent.children.splice( index , 1 ) ; }

	index = parent.zChildren.indexOf( this ) ;
	if ( index >= 0 ) { parent.zChildren.splice( index , 1 ) ; }

	delete this.document.elements[ this.id ] ;
	this.parent = null ;
	this.recursiveFixAttachment( null ) ;

	// Redraw
	if ( ! noDraw ) {
		// /!\ Draw parent should work, but not always /!\
		//parent.draw() ;
		parent.document.draw() ;
	}

	return this ;
} ;



// Resize the element to its content
Element.prototype.resizeToContent = function() {
	this.outputWidth = this.contentWidth ;
	this.outputHeight = this.contentHeight ;
} ;



// Sort zChildren, only necessary when a child zIndex changed
Element.prototype.zSort = function() {
	this.zChildren.sort( ( a , b ) => a.zIndex - b.zIndex ) ;
} ;



// Insert a child into the zChildren array, shift all greater zIndex to the left
// Use this instead of .push() and .zSort()
Element.prototype.zInsert = function( child ) {
	var current ,
		i = this.zChildren.length ;

	while ( i -- ) {
		current = this.zChildren[ i ] ;
		if ( child.zIndex >= current.zIndex ) {
			this.zChildren[ i + 1 ] = child ;
			return ;
		}

		this.zChildren[ i + 1 ] = current ;
	}

	this.zChildren[ 0 ] = child ;
} ;



// Change zIndex and call parent.zSort() immediately
Element.prototype.updateZ = Element.prototype.updateZIndex = function( z ) {
	this.savedZIndex = this.zIndex = z ;
	this.parent.zSort() ;
} ;



// Change zIndex to make it on top of all siblings
Element.prototype.topZ = function() {
	if ( this.parent.interceptTempZIndex ) { return this.parent.topZ() ; }

	if ( ! this.parent.zChildren.length ) { return ; }
	this.zIndex = this.parent.zChildren[ this.parent.zChildren.length - 1 ].zIndex + 1 ;
	this.parent.zSort() ;
} ;



// Change zIndex to make it on bottom of all siblings
Element.prototype.bottomZ = function() {
	if ( this.parent.interceptTempZIndex ) { return this.parent.bottomZ() ; }

	if ( ! this.parent.zChildren.length ) { return ; }
	this.zIndex = this.parent.zChildren[ 0 ].zIndex - 1 ;
	this.parent.zSort() ;
} ;



Element.prototype.restoreZ = function() {
	if ( this.parent.interceptTempZIndex ) { return this.parent.restoreZ() ; }

	this.zIndex = this.savedZIndex ;
	this.parent.zSort() ;
} ;



Element.computeContentWidth = ( content , hasMarkup ) => {
	if ( Array.isArray( content ) ) {
		return (
			hasMarkup === 'ansi' || hasMarkup === 'legacyAnsi' ? Math.max( ... content.map( line => misc.ansiWidth( line ) ) ) :
			hasMarkup ? Math.max( ... content.map( line => misc.markupWidth( line ) ) ) :
			Math.max( ... content.map( line => string.unicode.width( line ) ) )
		) ;
	}

	return (
		hasMarkup === 'ansi' || hasMarkup === 'legacyAnsi' ? misc.ansiWidth( content ) :
		hasMarkup ? misc.markupWidth( content ) :
		string.unicode.width( content )
	) ;
} ;

var lastTruncateWidth = 0 ;
Element.getLastTruncateWidth = () => lastTruncateWidth ;

Element.truncateContent = ( content , maxWidth , hasMarkup ) => {
	var str ;

	if ( hasMarkup === 'ansi' || hasMarkup === 'legacyAnsi' ) {
		str = misc.truncateAnsiString( content , maxWidth ) ;
		lastTruncateWidth = misc.getLastTruncateWidth() ;
	}
	else if ( hasMarkup ) {
		str = misc.truncateMarkupString( content , maxWidth ) ;
		lastTruncateWidth = misc.getLastTruncateWidth() ;
	}
	else {
		str = string.unicode.truncateWidth( content , maxWidth ) ;
		lastTruncateWidth = string.unicode.getLastTruncateWidth() ;
	}

	return str ;
} ;

Element.wordwrapContent = 	// <-- DEPRECATED
Element.wordWrapContent = ( content , width , hasMarkup ) =>
	hasMarkup === 'ansi' || hasMarkup === 'legacyAnsi' ? misc.wordWrapAnsi( content , width ) :
	hasMarkup ? misc.wordWrapMarkup( content , width ) :
	string.wordwrap( content , { width , fill: true , noJoin: true } ) ;



Element.prototype.setContent = function( content , hasMarkup , dontDraw = false , dontResize = false ) {
	if ( this.forceContentArray && ! Array.isArray( content ) ) { content = [ content || '' ] ; }

	var oldOutputWidth = this.outputWidth ,
		oldOutputHeight = this.outputHeight ;

	this.content = content ;
	this.contentHasMarkup = hasMarkup ;

	this.contentWidth = Element.computeContentWidth( content , this.contentHasMarkup ) ;
	this.contentHeight = Array.isArray( content ) ? content.length : 1 ;

	if ( ! dontResize && this.resizeOnContent ) { this.resizeOnContent() ; }

	if ( ! dontDraw ) {
		if ( this.outputWidth < oldOutputWidth || this.outputHeight < oldOutputHeight ) {
			this.outerDraw() ;
		}
		else {
			this.draw() ;
		}
	}
} ;



Element.prototype.isAncestorOf = function( element ) {
	var currentElement = element ;

	for ( ;; ) {
		if ( currentElement === this ) {
			// Self found: ancestor match!
			return true ;
		}
		else if ( ! currentElement.parent ) {
			// The element is either detached or attached to another parent element
			return false ;
		}
		else if ( currentElement.parent.children.indexOf( currentElement ) === -1 ) {
			// Detached but still retain a ref to its parent.
			// It's probably a bug, so we will remove that link now.
			currentElement.parent = null ;
			return false ;
		}

		currentElement = currentElement.parent ;
	}
} ;



Element.prototype.getParentContainer = function() {
	var currentElement = this ;

	for ( ;; ) {
		if ( ! currentElement.parent ) { return null ; }
		if ( currentElement.parent.isContainer ) { return currentElement.parent ; }

		currentElement = currentElement.parent ;
	}
} ;



// Internal: get the index of the direct child that have the focus or have a descendant having the focus
Element.prototype.getFocusBranchIndex = function() {
	var index , currentElement ;

	if ( ! this.document.focusElement ) { return null ; }

	currentElement = this.document.focusElement ;

	for ( ;; ) {
		if ( currentElement === this ) {
			// Self found: ancestor match!
			return null ;
		}
		else if ( ! currentElement.parent ) {
			// The element is either detached or attached to another parent element
			return null ;
		}

		if ( currentElement.parent === this ) {
			index = currentElement.parent.children.indexOf( currentElement ) ;

			if ( index === -1 ) {
				// Detached but still retain a ref to its parent.
				// It's probably a bug, so we will remove that link now.
				currentElement.parent = null ;
				return null ;
			}

			return index ;
		}

		currentElement = currentElement.parent ;
	}
} ;



Element.prototype.focusNextChild = function( loop = true , type = 'cycle' ) {
	var index , startingIndex , focusAware ;

	if ( ! this.children.length || ! this.document ) { return null ; }

	//if ( ! this.document.focusElement || ( index = this.children.indexOf( this.document.focusElement ) ) === -1 )
	if ( ! this.document.focusElement || ( index = this.getFocusBranchIndex() ) === null ) {
		index = this.children.length - 1 ;
	}

	startingIndex = index ;

	for ( ;; ) {
		index ++ ;
		if ( index >= this.children.length ) {
			if ( loop ) { index = 0 ; }
			else { index = this.children.length - 1 ; break ; }
		}

		focusAware = this.document.giveFocusTo_( this.children[ index ] , type ) ;

		// Exit if the focus was given to a focus-aware element or if we have done a full loop already
		if ( focusAware || startingIndex === index ) { break ; }
	}

	return this.children[ index ] ;
} ;



Element.prototype.focusPreviousChild = function( loop = true ) {
	var index , startingIndex , focusAware ;

	if ( ! this.children.length || ! this.document ) { return null ; }

	//if ( ! this.document.focusElement || ( index = this.children.indexOf( this.document.focusElement ) ) === -1 )
	if ( ! this.document.focusElement || ( index = this.getFocusBranchIndex() ) === null ) {
		index = 0 ;
	}

	startingIndex = index ;

	for ( ;; ) {
		index -- ;
		if ( index < 0 ) {
			if ( loop ) { index = this.children.length - 1 ; }
			else { index = 0 ; break ; }
		}

		focusAware = this.document.giveFocusTo_( this.children[ index ] , 'backCycle' ) ;

		// Exit if the focus was given to a focus-aware element or if we have done a full loop already
		if ( focusAware || startingIndex === index ) { break ; }
	}

	return this.children[ index ] ;
} ;



// Get all child element matching a x,y coordinate relative to the current element
Element.prototype.childrenAt = function( x , y , filter = null , matches = [] ) {
	var i , current ;

	// Search children, order by descending zIndex, because we want the top element first
	i = this.zChildren.length ;
	while ( i -- ) {
		current = this.zChildren[ i ] ;

		// Filter out hidden element now
		if ( current.hidden ) { continue ; }

		if (
			x >= current.outputX && x <= current.outputX + current.outputWidth - 1 &&
			y >= current.outputY && y <= current.outputY + current.outputHeight - 1
		) {
			// Bounding box match!

			// Check and add children of children first (depth-first)
			if ( current.isContainer ) {
				current.childrenAt( x - current.inputX , y - current.inputY , filter , matches ) ;
			}
			else {
				current.childrenAt( x , y , filter , matches ) ;
			}

			if ( ! filter || filter( current ) ) {
				matches.push( { element: current , x: x - current.outputX , y: y - current.outputY } ) ;
			}
		}
		else if ( ! current.isContainer ) {
			// If it is not a container, give a chance to its children to get selected
			current.childrenAt( x , y , filter , matches ) ;
		}
	}

	return matches ;
} ;



Element.prototype.saveCursor = function() {
	if ( this.inputDst ) {
		this.savedCursorX = this.inputDst.cx ;
		this.savedCursorY = this.inputDst.cy ;
	}
	else if ( this.outputDst ) {
		this.savedCursorX = this.outputDst.cx ;
		this.savedCursorY = this.outputDst.cy ;
	}

	return this ;
} ;



Element.prototype.restoreCursor = function() {
	if ( this.inputDst ) {
		this.inputDst.cx = this.savedCursorX ;
		this.inputDst.cy = this.savedCursorY ;
		this.inputDst.drawCursor() ;
	}
	else if ( this.outputDst ) {
		this.outputDst.cx = this.savedCursorX ;
		this.outputDst.cy = this.savedCursorY ;
		this.outputDst.drawCursor() ;
	}

	return this ;
} ;



Element.prototype.draw = function( isInitialInlineDraw = false ) {
	//console.error( "\n----------------------------\nCalling .draw() for" , this.debugId() , new Error( 'trace:' ) ) ;
	if ( ! this.document || this.hidden ) { return this ; }

	if ( ! isInitialInlineDraw ) {
		if ( this.restoreCursorAfterDraw ) { this.inlineTerm.saveCursor() ; }
		else if ( ! this.strictInline ) { this.saveCursor() ; }
	}

	this.descendantDraw() ;
	this.ascendantDraw() ;

	if ( ! isInitialInlineDraw ) {
		if ( this.restoreCursorAfterDraw ) { this.inlineTerm.restoreCursor() ; }
		else if ( ! this.strictInline ) { this.drawCursor() ; }
	}

	return this ;
} ;



// .draw() is used when drawing the current Element is enough: the Element has not moved, and has not been resized.
// If it has, then it is necessary to draw the closest ancestor which is a container.
// /!\ IS THIS METHOD WRONG? it should draw the parent container, but don't redraw any children of its children Container
// Option 'force' redraw even if the element is hidden, in fact it is used by the .hide() method to effectively hide the element on the parent container.
Element.prototype.redraw = 	// DEPRECATED name, use .outerDraw()
Element.prototype.outerDraw = function( force = false ) {
	if ( ! this.document || ( this.hidden && ! force ) ) { return this ; }

	var container = this.getParentContainer() ;

	if ( ! container ) { this.draw() ; }
	else { container.draw() ; }

	return this ;
} ;



// Hard to find a good name, .draw() or .outerDraw() depending on what have been updated
Element.prototype.updateDraw = function() {
	if ( this.needOuterDraw ) { this.outerDraw() ; }
	else { this.draw() ; }
	this.needOuterDraw = false ;
} ;



// Draw all the children
Element.prototype.descendantDraw = function( isSubcall ) {
	var i , iMax ;

	if ( this.hidden ) { return this ; }

	if ( this.preDrawSelf ) {
		this.preDrawSelf( ! isSubcall ) ;
	}

	// Draw children, order by ascending zIndex
	for ( i = 0 , iMax = this.zChildren.length ; i < iMax ; i ++ ) {
		this.zChildren[ i ].descendantDraw( true ) ;
	}

	if ( isSubcall && this.postDrawSelf ) {
		this.postDrawSelf( ! isSubcall ) ;
	}

	return this ;
} ;



// Post-draw from the current element through all the ancestor chain
Element.prototype.ascendantDraw = function() {
	var currentElement ;

	if ( this.postDrawSelf && ! this.hidden ) {
		this.postDrawSelf( true ) ;
	}

	currentElement = this ;

	while ( currentElement.parent && currentElement.outputDst !== currentElement.document.outputDst ) {
		currentElement = currentElement.parent ;

		if ( currentElement.outputDst !== currentElement.inputDst && currentElement.postDrawSelf && ! currentElement.hidden ) {
			currentElement.postDrawSelf( false ) ;
		}
	}

	return this ;
} ;



// Draw cursor from the current element through all the ancestor chain
Element.prototype.drawCursor = function() {
	var currentElement ;

	if ( this.drawSelfCursor && ! this.hidden ) {
		this.drawSelfCursor( true ) ;
	}

	currentElement = this ;

	while ( currentElement.outputDst !== currentElement.document.outputDst && currentElement.parent ) {
		currentElement = currentElement.parent ;

		if ( currentElement.drawSelfCursor && ! currentElement.hidden ) {
			currentElement.drawSelfCursor( false ) ;
		}
	}

	return this ;
} ;



// TODOC
Element.prototype.bindKey = function( key , action ) { this.keyBindings[ key ] = action ; } ;
// TODOC
Element.prototype.getKeyBinding = function( key ) { return this.keyBindings[ key ] ?? null ; } ;
// TODOC
Element.prototype.getAllKeyBindings = function( key ) { return Object.assign( {} , this.keyBindings ) ; } ;
// TODOC
Element.prototype.getActionBindings = function( action , ui = false ) {
	var keys = [] ;

	for ( let key in this.keyBindings ) {
		if ( this.keyBindings[ key ] === action ) {
			keys.push( ui ? misc.keyToUserInterfaceName( key ) : key ) ;
		}
	}

	return keys ;
} ;



// For inline widget, having eventually a document just for him, that fit its own size
Element.createInline = async function( term , Type , options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	options.inlineTerm = term ;
	//options.outputDst = term ;
	//options.eventSource = term ;

	var cursorPosition ,
		position = {
			x: options.outputX || options.x ,
			y: options.outputY || options.y
		} ;

	// Don't use 'delete', because options = Object.create( options ) -- doesn't work with inheritance
	options.x = options.y = options.outputX = options.outputY = 0 ;

	var element = new Type( options ) ;

	if ( position.x === undefined || position.y === undefined ) {
		if ( element.strictInline ) {
			// We do not want any asyncness for pure inline elements, and since we draw in inline mode, we don't care about it...
			// ... BUT we need a position anyway for the clipping purpose! It can't be 0 since we draw on the terminal and top-left is (1,1).
			position.x = position.y = 1 ;
		}
		else {
			cursorPosition = await term.getCursorLocation() ;

			if ( position.x === undefined ) {
				position.x = cursorPosition.x ;

				if ( cursorPosition.x > 1 && element.inlineNewLine ) {
					position.x = 1 ;
					if ( position.y === undefined ) { position.y = cursorPosition.y + 1 ; }
				}
			}

			if ( position.y === undefined ) { position.y = cursorPosition.y ; }
		}
	}

	if ( ! element.strictInline ) {
		let scrollY = position.y + element.outputHeight - term.height ;

		if ( scrollY > 0 ) {
			term.scrollUp( scrollY ) ;
			term.up( scrollY ) ;	// move the cursor up, so save/restore cursor could work
			position.y -= scrollY ;
		}
	}

	if ( element.inlineResizeToContent ) {
		element.resizeToContent() ;
	}

	var documentOptions = {
		internal: true ,
		inlineTerm: term ,
		strictInline: element.strictInline ,
		noInput: element.strictInline || ! element.needInput ,
		outputX: position.x ,
		outputY: position.y ,
		outputWidth: element.outputWidth ,
		outputHeight: element.outputHeight ,
		outputDst: term ,
		eventSource: term ,
		noDraw: true
	} ;

	var document = new termkit.Document( documentOptions ) ;

	document.attach( element ) ;

	// Should probably resize the container
	element.on( 'resize' , () => { throw new Error( 'not coded!' ) ; } ) ;

	element.draw( true ) ;
	term.styleReset() ;

	if ( element.staticInline ) { element.destroy( undefined , true ) ; }

	return element ;
} ;



// Default 'key' event management, suitable for almost all use-case, but could be derivated if needed
Element.prototype.onKey = function( key , trash , data ) {
	var action = this.keyBindings[ key ] ;
	//console.error( this.debugId() , "Key:" , key , "Actions:" , action , !! this.userActions?.[ action ] ) ; // action && this.userActions[ action ] ? "fn: " + this.userActions[ action ].toString() : '' ) ;

	if ( action ) {
		if ( action === 'meta' ) {
			if ( this.document ) {
				this.document.setMetaKeyPrefix( 'META' , 'CTRL' ) ;
			}
			return true ;	// Do not bubble up
		}
		else if ( this.userActions[ action ] ) {
			// Do not bubble up except if explicitly false
			return ( this.userActions[ action ].call( this , key , trash , data ) ?? true ) || undefined ;
		}
	}
	else if ( data && data.isCharacter ) {
		if ( this.userActions.character ) {
			// Do not bubble up except if explicitly false
			return ( this.userActions.character.call( this , key , trash , data ) ?? true ) || undefined ;
		}
	}
	else if ( this.userActions.specialKey ) {
		// Do not bubble up except if explicitly false
		return ( this.userActions.specialKey.call( this , key , trash , data ) ?? true ) || undefined ;
	}

	// Nothing found, bubble up
	return ;
} ;



// Should be redefined
Element.prototype.isContainer = false ;	// boolean, true if it's a container, having a different inputDst and outputDst and local coords
Element.prototype.forceContentArray = false ;	// boolean, true if content should be an array of string instead of a string
Element.prototype.noChildFocus = false ;	// boolean, true if the focus should not be transmitted to children of this Element
Element.prototype.computeBoundingBoxes = null ;	// function, bounding boxes for elements that can be drawn
Element.prototype.resizeOnContent = null ;	// function, if set, resize on content update, called by .setContent()
Element.prototype.preDrawSelf = null ;	// function, things to draw for the element before drawing its children
Element.prototype.postDrawSelf = null ;	// function, things to draw for the element after drawing its children
Element.prototype.drawSelfCursor = null ;	// function, draw the element cursor
Element.prototype.getValue = () => null ;	// function, get the value of the element if any...
Element.prototype.setValue = () => undefined ;	// function, set the value of the element if any...
Element.prototype.strictInlineSupport = false ;	// no support for strictInline mode by default
Element.prototype.staticInline = false ;	// boolean, true if the inline version is static and could be destroyed immediately after been drawn
Element.prototype.inlineCursorRestoreAfterDraw = false ;	// when set, save/restore cursor in inline mode (forced when strictInline is true)
Element.prototype.needInput = false ;	// no need for input by default (used to configure inline mode)
Element.prototype.outerDrag = false ;	// boolean, true if drag event are sent when out of bounds (e.g. useful for moving windows)

Element.prototype.keyBindings = {} ;	// object, store key bindings, the key is a Terminal Kit key code, the value is an user-action name
Element.prototype.userActions = {} ;	// object, the key is an user-action name, the value is a function... THIS IS INHERITED

