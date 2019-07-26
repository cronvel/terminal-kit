/*
	Terminal Kit

	Copyright (c) 2009 - 2019 Cédric Ronvel

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
const Container = require( './Container.js' ) ;



function Document( options = {} ) {
	if ( ! options.inlineTerm ) {
		options.outputX = 1 ;
		options.outputY = 1 ;
		options.outputWidth = options.outputDst.width ;
		options.outputHeight = options.outputDst.height ;
	}

	Container.call( this , options ) ;

	// A document do not have parent
	this.parent = null ;

	// The document of a document is itself
	this.document = this ;

	// Being the top-level element before the Terminal object, this must use delta-drawing
	this.deltaDraw = true ;

	this.id = '_document' + '_' + ( nextId ++ ) ;
	this.eventSource = options.eventSource ,
	this.focusElement = null ;
	this.hoverElement = null ;
	this.clickOutCandidates = new Set() ;
	this.elements = {} ;
	this.onEventSourceKey = this.onEventSourceKey.bind( this ) ;
	this.onEventSourceMouse = this.onEventSourceMouse.bind( this ) ;
	this.onEventSourceResize = this.onEventSourceResize.bind( this ) ;

	this.eventSource.grabInput( { mouse: 'motion' } ) ;
	//this.eventSource.grabInput( { mouse: 'button' } ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }
	this.elementByShortcut = {} ;

	this.eventSource.on( 'key' , this.onEventSourceKey ) ;
	this.eventSource.on( 'mouse' , this.onEventSourceMouse ) ;
	this.eventSource.on( 'resize' , this.onEventSourceResize ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Document' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Document ;

//Document.prototype = Object.create( Element.prototype ) ;
Document.prototype = Object.create( Container.prototype ) ;
Document.prototype.constructor = Document ;
Document.prototype.elementType = 'Document' ;



Document.prototype.destroy = function( isSubDestroy ) {
	this.eventSource.off( 'key' , this.onEventSourceKey ) ;
	this.eventSource.off( 'mouse' , this.onEventSourceMouse ) ;
	this.eventSource.off( 'resize' , this.onEventSourceResize ) ;

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



Document.prototype.keyBindings = {
	TAB: 'focusNext' ,
	SHIFT_TAB: 'focusPrevious'
} ;



// Next element ID
var nextId = 0 ;

Document.prototype.assignId = function( element , id ) {
	if ( ! id || typeof id !== 'string' || id[ 0 ] === '_' || this.elements[ id ] ) {
		id = '_' + element.elementType + '_' + ( nextId ++ ) ;
	}

	element.id = id ;
	this.elements[ id ] = element ;
} ;



Document.prototype.unassignId = function( element , id ) {
	element.id = null ;
	delete this.elements[ id ] ;
} ;



Document.prototype.giveFocusTo = function( element , type ) {
	if ( ! ( element instanceof Element ) ) { throw new TypeError( '' + element + ' is not an instance of Element.' ) ; }
	if ( ! type ) { type = 'direct' ; }
	if ( this.isAncestorOf( element ) ) { return this.giveFocusTo_( element , type ) ; }
} ;



Document.prototype.giveFocusTo_ = function( element , type ) {
	var ancestor , focusAware ;

	if ( this.focusElement !== element ) {
		if ( this.focusElement ) { this.focusElement.emit( 'focus' , false , type , this.focusElement ) ; }
		this.focusElement = element ;
		this.focusElement.emit( 'focus' , true , type , this.focusElement ) ;

	}

	// Return false if the focus was given to an element that does not care about focus and key event
	focusAware = ! this.focusElement.disabled && ( this.focusElement.listenerCount( 'focus' ) || this.focusElement.listenerCount( 'key' ) ) ;

	if ( focusAware ) {
		ancestor = this.focusElement ;

		while ( ancestor ) {
			if ( ancestor.listenerCount( 'clickOut' ) ) { this.clickOutCandidates.add( ancestor ) ; }
			ancestor = ancestor.parent ;
		}
	}

	return focusAware ;
} ;



Document.prototype.focusNext = function() {
	var index , startingElement , currentElement , focusAware ;

	if ( ! this.focusElement || ! this.isAncestorOf( this.focusElement ) ) { currentElement = this ; }
	else { currentElement = this.focusElement ; }

	if ( currentElement === this && ! this.children.length ) { return ; }

	startingElement = currentElement ;

	for ( ;; ) {
		if ( currentElement.children.length && ! currentElement.noChildFocus ) {
			// Give focus to the first child of the element
			currentElement = currentElement.children[ 0 ] ;
			if ( ! currentElement.hidden ) { focusAware = this.giveFocusTo_( currentElement , 'cycle' ) ; }
		}
		else if ( currentElement.parent ) {
			for ( ;; ) {
				index = currentElement.parent.children.indexOf( currentElement ) ;

				if ( index + 1 < currentElement.parent.children.length ) {
					// Give focus to the next sibling
					currentElement = currentElement.parent.children[ index + 1 ] ;
					if ( ! currentElement.hidden ) {
						focusAware = this.giveFocusTo_( currentElement , 'cycle' ) ;
						break ;
					}
				}
				else if ( currentElement.parent.parent ) {
					currentElement = currentElement.parent ;
				}
				else {
					// We are at the top-level, just below the document, so cycle again at the first-top-level child

					// This check fixes infinite loop
					if ( startingElement === currentElement.parent ) { return ; }

					currentElement = currentElement.parent.children[ 0 ] ;
					if ( ! currentElement.hidden ) {
						focusAware = this.giveFocusTo_( currentElement , 'cycle' ) ;
						break ;
					}
				}
			}
		}
		else {
			// Nothing to do: no children, no parent, nothing...
			return ;
		}

		// Exit if the focus was given to a focus-aware element or if we have done a full loop already
		//console.error( 'end of loop: ' , focusAware , startingElement.content , currentElement.content ) ;
		if ( startingElement === currentElement || ( ! currentElement.hidden && focusAware ) ) { break ; }
	}
} ;



Document.prototype.focusPrevious = function() {
	var index , startingElement , currentElement , focusAware ;

	if ( ! this.focusElement || ! this.isAncestorOf( this.focusElement ) ) { currentElement = this ; }
	else { currentElement = this.focusElement ; }

	startingElement = currentElement ;

	for ( ;; ) {
		if ( currentElement.parent ) {
			index = currentElement.parent.children.indexOf( currentElement ) ;

			if ( index - 1 >= 0 ) {
				// Give focus to the last child of the last child of the ... of the previous sibling
				currentElement = currentElement.parent.children[ index - 1 ] ;

				while ( currentElement.children.length && ! currentElement.noChildFocus ) {
					currentElement = currentElement.children[ currentElement.children.length - 1 ] ;
				}

				if ( ! currentElement.hidden ) { focusAware = this.giveFocusTo_( currentElement , 'cycle' ) ; }
			}
			else if ( currentElement.parent.parent ) {
				currentElement = currentElement.parent ;
				if ( ! currentElement.hidden ) { focusAware = this.giveFocusTo_( currentElement , 'cycle' ) ; }
			}
			else {
				// We are at the top-level, just below the document, so cycle again to the last child of the last child
				// of the ... of the last-top-level child

				// This check fixes infinite loop
				if ( startingElement === currentElement.parent ) { return ; }

				currentElement = currentElement.parent.children[ currentElement.parent.children.length - 1 ] ;

				while ( currentElement.children.length && ! currentElement.noChildFocus ) {
					currentElement = currentElement.children[ currentElement.children.length - 1 ] ;
				}

				if ( ! currentElement.hidden ) { focusAware = this.giveFocusTo_( currentElement , 'cycle' ) ; }
			}
		}
		else if ( currentElement.children.length ) {
			// Give focus to the last child of the element
			currentElement = currentElement.children[ currentElement.children.length - 1 ] ;

			while ( currentElement.children.length && ! currentElement.noChildFocus ) {
				currentElement = currentElement.children[ currentElement.children.length - 1 ] ;
			}

			if ( ! currentElement.hidden ) { focusAware = this.giveFocusTo_( currentElement , 'cycle' ) ; }
		}
		else {
			// Nothing to do: no children, no parent, nothing...
			return ;
		}

		// Exit if the focus was given to a focus-aware element or if we have done a full loop already
		//console.error( 'end of loop: ' , focusAware , startingElement.content , currentElement.content ) ;
		if ( startingElement === currentElement || ( ! currentElement.hidden && focusAware ) ) { break ; }
	}
} ;



Document.prototype.onEventSourceKey = function( key , altKeys , data ) {
	if ( this.focusElement ) {
		this.bubblingEvent( this.focusElement , key , altKeys , data ) ;
	}
	else {
		this.defaultKeyHandling( key , altKeys , data ) ;
	}
} ;



Document.prototype.bubblingEvent = function( element , key , altKeys , data ) {
	if ( element !== this ) {
		element.emit( 'key' , key , altKeys , data , ( interruption , event ) => {
			// Interruption means: the child consume the event, it does not want bubbling
			if ( ! interruption ) {
				if ( element.parent ) { this.bubblingEvent( element.parent , key , altKeys , data ) ; }
				else { this.defaultKeyHandling( key , altKeys , data ) ; }
			}
		} ) ;
	}
	else {
		this.defaultKeyHandling( key , altKeys , data ) ;
	}
} ;



Document.prototype.defaultKeyHandling = function( key , altKeys , data ) {
	switch ( this.keyBindings[ key ] ) {
		case 'focusNext' :
			this.focusNext() ;
			break ;
		case 'focusPrevious' :
			this.focusPrevious() ;
			break ;
		default :
			if ( this.elementByShortcut[ key ] && this.elementByShortcut[ key ].document === this ) {
				this.elementByShortcut[ key ].emit( 'shortcut' , key , altKeys , data ) ;
			}
			else {
				this.emit( 'key' , key , altKeys , data ) ;
			}
			break ;
	}
} ;



Document.prototype.createShortcuts = function( element , ... keys ) {
	if ( element.document !== this ) { return ; }
	keys.forEach( key => this.elementByShortcut[ key ] = element ) ;
} ;



Document.prototype.removeElementShortcuts = function( element ) {
	for ( let key in this.elementByShortcut ) {
		if ( this.elementByShortcut[ key ] === element ) { this.elementByShortcut[ key ] = null ; }
	}
} ;



Document.prototype.onEventSourceMouse = function( name , data ) {
	var matches ;

	switch ( name ) {
		case 'MOUSE_LEFT_BUTTON_PRESSED' :
			this.mouseClick( data ) ;
			break ;

		case 'MOUSE_MOTION' :
			this.mouseMotion( data ) ;
			break ;
	}
} ;



Document.prototype.mouseClick = function( data ) {
	var matches = this.childrenAt(
		data.x - this.outputX ,
		data.y - this.outputY ,
		element => element.listenerCount( 'click' ) || element.listenerCount( 'clickOut' ) ||
			element.listenerCount( 'hover' ) || element.listenerCount( 'leave' ) || element.listenerCount( 'enter' )
	) ;

	//console.error( "\n\n\n\n" , matches ) ;

	if ( ! matches.length ) {
		if ( this.clickOutCandidates.size ) {
			for ( let candidate of this.clickOutCandidates ) {
				// Check that the candidate is still attached
				if ( candidate.document === this ) {
					candidate.emit( 'clickOut' ) ;
				}
			}
			this.clickOutCandidates.clear() ;
		}

		return ;
	}

	if ( this.clickOutCandidates.size ) {
		for ( let candidate of this.clickOutCandidates ) {
			// Check that the candidate is still attached and is not on the click's tree branch
			if ( candidate.document === this && candidate !== matches[ 0 ].element && ! candidate.isAncestorOf( matches[ 0 ].element ) ) {
				candidate.emit( 'clickOut' ) ;
			}
		}

		this.clickOutCandidates.clear() ;
	}

	matches[ 0 ].element.emit( 'click' , { x: matches[ 0 ].x , y: matches[ 0 ].y } , matches[ 0 ].element ) ;
} ;



Document.prototype.mouseMotion = function( data ) {
	var matches = this.childrenAt(
		data.x - this.outputX ,
		data.y - this.outputY ,
		element => element.listenerCount( 'click' ) || element.listenerCount( 'clickOut' ) ||
			element.listenerCount( 'hover' ) || element.listenerCount( 'leave' ) || element.listenerCount( 'enter' )
	) ;
	//console.error( "\n\n\n\n" , matches ) ;

	if ( ! matches.length ) {
		if ( this.hoverElement ) {
			this.hoverElement.emit( 'leave' ) ;
			this.hoverElement = null ;
		}

		return ;
	}

	matches[ 0 ].element.emit( 'hover' , { x: matches[ 0 ].x , y: matches[ 0 ].y } , matches[ 0 ].element ) ;

	matches.forEach( match => {
		if ( match.element.listenerCount( 'clickOut' ) ) {
			this.clickOutCandidates.add( match.element ) ;
		}
	} ) ;

	if ( matches[ 0 ].element !== this.hoverElement ) {
		if ( this.hoverElement ) { this.hoverElement.emit( 'leave' ) ; }

		this.hoverElement = matches[ 0 ].element ;
		this.hoverElement.emit( 'enter' ) ;
	}
} ;



Document.prototype.onEventSourceResize = function( width , height ) {
	//console.error( "Document#onEventSourceResize() " , width , height ) ;

	// Always resize inputDst to match outputDst (Terminal)
	this.resizeInput( {
		x: 0 ,
		y: 0 ,
		width: width ,
		height: height
	} ) ;

	//this.inputDst.clear() ;
	//this.postDrawSelf() ;

	this.draw() ;
} ;

