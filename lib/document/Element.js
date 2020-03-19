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



const misc = require( '../misc.js' ) ;
const string = require( 'string-kit' ) ;
const NextGenEvents = require( 'nextgen-events' ) ;



function Element( options = {} ) {
	this.setInterruptible( true ) ;

	this.parent = options.parent && options.parent.elementType ? options.parent : null ;
	this.document = null ;
	this.inlineTerm = options.inlineTerm || null ;	// inline mode, with this terminal as output
	this.strictInline = !! (
		this.inlineTerm && this.strictInlineSupport
		&& ( options.strictInline || options.strictInline === undefined )
	) ;

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

	this.content = '' ;
	this.contentHasMarkup = false ;
	this.contentWidth = 0 ;

	if ( this.setContent === Element.prototype.setContent ) {
		this.setContent( options.content || '' , options.contentHasMarkup , true ) ;
	}

	this.meta = options.meta ;	// associate data to the element for userland business logic

	this.outputX = options.outputX || options.x || 0 ;
	this.outputY = options.outputY || options.y || 0 ;
	this.savedZIndex = this.zIndex = options.zIndex || options.z || 0 ;
	this.interceptTempZIndex = !! options.interceptTempZIndex ;	// intercept child .topZ()/.bottomZ()/.restoreZ()
	this.outputWidth = options.outputWidth || options.width || ( this.strictInline ? this.inlineTerm.width : 1 ) ;
	this.outputHeight = options.outputHeight || options.height || ( this.strictInline ? this.inlineTerm.height : 1 ) ;

	this.savedCursorX = 0 ;
	this.savedCursorY = 0 ;

	this.hasFocus = false ;
	this.children = [] ;
	this.zChildren = [] ;	// like children, but ordered by zIndex
	//this.onKey = this.onKey.bind( this ) , writable: true } ,

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



// Destroy the element and all its children, detaching them and removing listeners
Element.prototype.destroy = function( isSubDestroy = false , noDraw = false ) {
	var i , iMax ;

	// Destroy children first
	for ( i = 0 , iMax = this.children.length ; i < iMax ; i ++ ) {
		this.children[ i ].destroy( true ) ;
	}

	this.children.length = 0 ;
	this.zChildren.length = 0 ;
	this.document.removeElementShortcuts( this ) ;

	if ( ! isSubDestroy ) {
		this.detach( noDraw ) ;
	}
	else {
		delete this.document.elements[ this.id ] ;
		this.id = null ;
		this.parent = null ;
		this.document = null ;
	}
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
		//console.error( ">>>" , i , iMax ) ;
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



// Sort zChildren, only necessary when a child zIndex changed
Element.prototype.zSort = function() {
	this.zChildren.sort( ( a , b ) => a.zIndex - b.zIndex ) ;
} ;



// Insert a child into the zChildren array, shift all greater zIndex to the left
// Used this instead of .push() and .zSort()
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



// Change zIndex to make it on bottom of all siblings
Element.prototype.restoreZ = function() {
	if ( this.parent.interceptTempZIndex ) { return this.parent.restoreZ() ; }

	this.zIndex = this.savedZIndex ;
	this.parent.zSort() ;
} ;



Element.computeContentWidth = ( content , hasMarkup ) => {
	if ( Array.isArray( content ) ) {
		if ( hasMarkup ) {
			return Math.max( ... content.map( line => misc.markupWidth( line ) ) ) ;
		}

		return Math.max( ... content.map( line => string.unicode.width( line ) ) ) ;
	}
	else if ( hasMarkup ) {
		return misc.markupWidth( content ) ;
	}

	return string.unicode.width( content ) ;
} ;

Element.truncateContent = ( content , maxWidth , hasMarkup ) =>
	hasMarkup ? misc.truncateMarkupString( content , maxWidth ) : string.unicode.truncateWidth( content , maxWidth ) ;

Element.wordwrapContent = 	// <-- DEPRECATED
Element.wordWrapContent = ( content , width , hasMarkup ) =>
	hasMarkup ? misc.wordWrapMarkup( content , width ) : string.wordwrap( content , { width , fill: true , noJoin: true } ) ;



Element.prototype.setContent = function( content , hasMarkup , dontDraw ) {
	this.content = content ;
	this.contentHasMarkup = !! hasMarkup ;
	this.contentWidth = Element.computeContentWidth( content , this.contentHasMarkup ) ;

	if ( ! dontDraw ) { this.redraw() ; }
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



Element.prototype.focusNextChild = function( loop = true ) {
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

		focusAware = this.document.giveFocusTo_( this.children[ index ] , 'cycle' ) ;

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

		focusAware = this.document.giveFocusTo_( this.children[ index ] , 'cycle' ) ;

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

		//console.error( 'Checking: ' , x , y , current.id , current.outputX , current.outputY , current.outputWidth , current.outputHeight ) ;

		if (
			x >= current.outputX && x <= current.outputX + current.outputWidth - 1 &&
			y >= current.outputY && y <= current.outputY + current.outputHeight - 1
		) {
			// Bounding box match!

			// Check and add children of children first (depth-first)
			if ( current.isContainer ) {
				current.childrenAt( x - current.outputX , y - current.outputY , filter , matches ) ;
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



Element.prototype.draw = function() {
	if ( ! this.document || this.hidden ) { return this ; }

	if ( ! this.strictInline ) { this.saveCursor() ; }
	this.descendantDraw() ;
	this.ascendantDraw() ;
	if ( ! this.strictInline ) { this.drawCursor() ; }
	return this ;
} ;



// .draw() is used when drawing the current Element is enough: the Element has not moved, and has not been resized.
// If it has, then it is necessary to draw the closest ancestor which is a container.
Element.prototype.redraw = function() {
	if ( ! this.document || this.hidden ) { return this ; }

	var container = this.getParentContainer() ;

	//console.error( "parentContainer:" , container ) ;
	if ( ! container ) { this.draw() ; }
	else { container.draw() ; }

	return this ;
} ;



// Draw all the children
Element.prototype.descendantDraw = function( isSubcall ) {
	var i , iMax ;

	if ( this.hidden ) { return this ; }

	if ( this.preDrawSelf ) {
		//console.error( 'preDrawSelf: ' , this.elementType , this.id ) ;
		this.preDrawSelf( ! isSubcall ) ;
	}

	// Draw children, order by ascending zIndex
	for ( i = 0 , iMax = this.zChildren.length ; i < iMax ; i ++ ) {
		this.zChildren[ i ].descendantDraw( true ) ;
	}

	if ( isSubcall && this.postDrawSelf ) {
		//console.error( 'postDrawSelf: ' , this.elementType , this.id ) ;
		this.postDrawSelf( ! isSubcall ) ;
	}

	return this ;
} ;



// Post-draw from the current element through all the ancestor chain
Element.prototype.ascendantDraw = function() {
	//console.error( '\nascendantDraw: ' , this.elementType , this.id ) ;
	var currentElement ;

	if ( this.postDrawSelf && ! this.hidden ) {
		//console.error( 'postDrawSelf: ' , this.elementType , this.id ) ;
		this.postDrawSelf( true ) ;
	}

	currentElement = this ;

	while ( currentElement.parent && currentElement.outputDst !== currentElement.document.outputDst ) {
		currentElement = currentElement.parent ;

		if ( currentElement.outputDst !== currentElement.inputDst && currentElement.postDrawSelf && ! currentElement.hidden ) {
			//console.error( 'postDrawSelf: ' , currentElement.elementType , currentElement.id ) ;
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



// For inline widget, having eventually a document just for him, that fit its own size
Element.createInline = async function( term , Type , options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	options.inlineTerm = term ;
	//options.outputDst = term ;
	//options.eventSource = term ;

	var cursorPosition , position = {
		x: options.outputX || options.x ,
		y: options.outputY || options.y
	} ;

	delete options.x ;
	delete options.y ;
	delete options.outputX ;
	delete options.outputY ;

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
		//console.error( "INLINE -- element.outputHeight" , element.outputHeight ) ;
		//console.error( "INLINE -- element.outputY" , element.outputY ) ;
		//console.error( "INLINE -- scrollY" , scrollY ) ;

		if ( scrollY > 0 ) {
			term.scrollUp( scrollY ) ;
			position.y -= scrollY ;
		}
	}

	var documentOptions = {
		internal: true ,
		inlineTerm: term ,
		strictInline: element.strictInline ,
		outputX: position.x ,
		outputY: position.y ,
		outputWidth: element.outputWidth ,
		outputHeight: element.outputHeight ,
		outputDst: term ,
		eventSource: term ,
		noDraw: true
	} ;

	var document = new Document( documentOptions ) ;

	document.attach( element ) ;

	// Should probably resize the container
	element.on( 'resize' , () => { throw new Error( 'not coded!' ) ; } ) ;

	element.draw() ;

	return element ;
} ;



// Should be redefined
Element.prototype.isContainer = false ;	// boolean, true if it's a container, having a different inputDst and outputDst and local coords
Element.prototype.noChildFocus = false ;	// boolean, true if the focus should not be transmitted to children of this Element
Element.prototype.computeBoundingBoxes = null ;	// function, bounding boxes for elements that can be drawn
Element.prototype.preDrawSelf = null ;	// function, things to draw for the element before drawing its children
Element.prototype.postDrawSelf = null ;	// function, things to draw for the element after drawing its children
Element.prototype.drawSelfCursor = null ;	// function, draw the element cursor
Element.prototype.getValue = () => null ;	// function, get the value of the element if any...
Element.prototype.setValue = () => undefined ;	// function, set the value of the element if any...
Element.prototype.strictInlineSupport = false ;	// No support for strictInline mode by default

const Document = require( './Document.js' ) ;

