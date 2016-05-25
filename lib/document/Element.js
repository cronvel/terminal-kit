/*
	Terminal Kit
	
	Copyright (c) 2009 - 2016 Cédric Ronvel
	
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



// Load modules
//var events = require( 'events' ) ;
var NextGenEvents = require( 'nextgen-events' ) ;



function Element() { throw new Error( 'Use Element.create() instead' ) ; }
module.exports = Element ;
Element.prototype = Object.create( NextGenEvents.prototype ) ;
Element.prototype.constructor = Element ;
Element.prototype.elementType = 'Element' ;



Element.create = function createElement( options )
{
	var element = Object.create( Element.prototype ) ;
	element.create( options ) ;
	return element ;
} ;



// Useful to split that for inheritance
Element.prototype.create = function create( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	this.setInterruptible( true ) ;
	
	Object.defineProperties( this , {
		parent: { value: options.parent && options.parent.elementType ? options.parent : null , enumerable: true , writable: true } ,
		document: { value: null , enumerable: true , writable: true } ,
		outputDst: { value: options.outputDst || options.parent.inputDst } ,
		inputDst: { value: null , enumerable: true , writable: true } ,
		label: { value: options.label || '' , enumerable: true , writable: true } ,
		content: { value: options.content || '' , enumerable: true , writable: true } ,
		key: { value: options.key || null , enumerable: true , writable: true } ,
		value: { value: options.value || null , enumerable: true , writable: true } ,
		
		outputX: { value: options.outputX || options.x || 0 , enumerable: true , writable: true } ,
		outputY: { value: options.outputY || options.y || 0 , enumerable: true , writable: true } ,
		outputWidth: { value: options.outputWidth || options.width || 1 , enumerable: true , writable: true } ,
		outputHeight: { value: options.outputHeight || options.height || 1 , enumerable: true , writable: true } ,
		
		savedCursorX: { value: 0 , enumerable: true , writable: true } ,
		savedCursorY: { value: 0 , enumerable: true , writable: true } ,
		
		hasFocus: { value: false , enumerable: true , writable: true } ,
		children: { value: [] , enumerable: true , writable: true } ,
		childIndex: { value: null , enumerable: true , writable: true } ,
		//onKey: { value: this.onKey.bind( this ) , writable: true } ,
	} ) ;
	
	// Children needs an inputDst, by default, everything is the same as for output (except for Container)
	this.inputDst = this.outputDst ;
	this.inputX = this.outputX ;
	this.inputY = this.outputY ;
	this.inputWidth = this.outputWidth ;
	this.inputHeight = this.outputHeight ;
	
	if ( this.parent ) { this.parent.attach( this , options.id ) ; }
} ;



// Destroy the element and all its children, detaching them and removing listeners
Element.prototype.destroy = function destroy( isSubDestroy )
{
	var i , iMax ;
	
	// Destroy children first
	for ( i = 0 , iMax = this.children.length ; i < iMax ; i ++ )
	{
		this.children[ i ].destroy( true ) ;
	}
	
	this.children = [] ;
	
	if ( ! isSubDestroy )
	{
		this.detach() ;
	}
	else
	{
		delete this.document.elements[ this.id ] ;
		Object.defineProperty( this , 'id' , { value: null , enumerable: true , configurable: true } ) ;
		
		this.parent = null ;
		this.document = null ;
	}
} ;



// Clear the Element, destroy all children
Element.prototype.clear = function clear()
{
	var i , iMax ;
	
	// Destroy children first
	for ( i = 0 , iMax = this.children.length ; i < iMax ; i ++ )
	{
		this.children[ i ].destroy( true ) ;
	}
	
	this.children = [] ;
	this.draw() ;
} ;



Element.prototype.attach = function attach( child , id )
{
	// Insert it if it is not already a child
	if ( this.children.indexOf( child ) === -1 )
	{
		child.parent = this ;
		child.document = this.document ;
		this.children.push( child ) ;
		child.childIndex = this.children.length - 1 ;
		//this.document.assignId( this , options.id ) ;
		
		child.document = this.document ;
		this.document.assignId( child , id ) ;
	}
	
	// /!\ Draw? /!\
	
	return this ;
} ;



Element.prototype.attachTo = function attachTo( parent , id )
{
	if ( parent.elementType ) { parent.attach( this , id ) ; }
	return this ;
} ;



Element.prototype.detach = function detach()
{
	var index , parent = this.parent ;
	
	// Already detached
	if ( ! parent ) { return ; }
	
	index = parent.children.indexOf( this ) ;
	
	if ( index >= 0 )
	{
		parent.children.splice( index , 1 ) ;
	}
	
	delete this.document.elements[ this.id ] ;
	Object.defineProperty( this , 'id' , { value: null , enumerable: true , configurable: true } ) ;
	
	this.parent = null ;
	this.document = null ;
	
	// Redraw
	
	// /!\ Draw parent should work, but it does not always /!\
	//parent.draw() ;
	parent.document.draw() ;
	
	return this ;
} ;



Element.prototype.isAncestorOf = function isAncestorOf( element )
{
	var currentElement = element ;
	
	for (;;)
	{
		if ( currentElement === this )
		{
			// Self found: ancestor match!
			return true ;
		}
		else if ( ! currentElement.parent )
		{
			// The element is either detached or attached to another parent element
			return false ;
		}
		else if ( currentElement.parent.children.indexOf( currentElement ) === -1 )
		{
			// Detached but still retain a ref to its parent.
			// It's probably a bug, so we will remove that link now.
			currentElement.parent = null ;
			return false ;
		}
		
		currentElement = currentElement.parent ;
	}
} ;



Element.prototype.getParentContainer = function getParentContainer()
{
	var currentElement = this ;
	
	for (;;)
	{
		if ( ! currentElement.parent ) { return null ; }
		if ( currentElement.parent.isContainer ) { return currentElement.parent ; }
		
		currentElement = currentElement.parent ;
	}
} ;



// Internal: get the index of the direct child that have the focus or have a descendant having the focus
Element.prototype.getFocusBranchIndex = function getFocusBranchIndex()
{
	var index , currentElement ;
	
	if ( ! this.document.focusElement ) { return null ; }
	
	currentElement = this.document.focusElement ;
	
	for (;;)
	{
		if ( currentElement === this )
		{
			// Self found: ancestor match!
			return null ;
		}
		else if ( ! currentElement.parent )
		{
			// The element is either detached or attached to another parent element
			return null ;
		}
		
		if ( currentElement.parent === this )
		{
			index = currentElement.parent.children.indexOf( currentElement ) ;
			
			if ( index === -1 )
			{
				// Detached but still retain a ref to its parent.
				// It's probably a bug, so we will remove that link now.
				currentElement.parent = null ;
				return null ;
			}
			else
			{
				return index ;
			}
		}
		else
		{
			currentElement = currentElement.parent ;
		}
	}
} ;



Element.prototype.focusNextChild = function focusNextChild()
{
	var index , startingIndex , focusAware ;
	
	if ( ! this.children.length || ! this.document ) { return null ; }
	
	//if ( ! this.document.focusElement || ( index = this.children.indexOf( this.document.focusElement ) ) === -1 )
	if ( ! this.document.focusElement || ( index = this.getFocusBranchIndex() ) === null )
	{
		index = this.children.length - 1 ;
	}
	
	startingIndex = index ;
	
	for (;;)
	{
		index ++ ;
		if ( index >= this.children.length ) { index = 0 ; }
		
		focusAware = this.document.giveFocusTo_( this.children[ index ] , 'cycle' ) ;
		
		// Exit if the focus was given to a focus-aware element or if we have done a full loop already
		if ( focusAware || startingIndex === index ) { break ; }
	}
	
	return this.children[ index ] ;
} ;



Element.prototype.focusPreviousChild = function focusPreviousChild()
{
	var index , startingIndex , focusAware ;
	
	if ( ! this.children.length || ! this.document ) { return null ; }
	
	//if ( ! this.document.focusElement || ( index = this.children.indexOf( this.document.focusElement ) ) === -1 )
	if ( ! this.document.focusElement || ( index = this.getFocusBranchIndex() ) === null )
	{
		index = 0 ;
	}
	
	startingIndex = index ;
	
	for (;;)
	{
		index -- ;
		if ( index < 0 ) { index = this.children.length - 1 ; }
		
		focusAware = this.document.giveFocusTo_( this.children[ index ] , 'cycle' ) ;
		
		// Exit if the focus was given to a focus-aware element or if we have done a full loop already
		if ( focusAware || startingIndex === index ) { break ; }
	}
	
	return this.children[ index ] ;
} ;



// Get all child element matching a x,y coordinate relative to the current element
Element.prototype.childrenAt = function childrenAt( x , y , matches )
{
	var i , iMax , current ;
	
	if ( ! matches ) { matches = [] ; }
	
	for ( i = 0 , iMax = this.children.length ; i < iMax ; i ++ )
	{
		current = this.children[ i ] ;
		
		//console.error( 'Checking: ' , x , y , current.id , current.outputX , current.outputY , current.outputWidth , current.outputHeight ) ;
		
		if (
			x >= current.outputX && x <= current.outputX + current.outputWidth - 1 &&
			y >= current.outputY && y <= current.outputY + current.outputHeight - 1
		)
		{
			// Bounding box match!
			
			// Check and add children of children first (depth-first)
			if ( current.isContainer )
			{
				current.childrenAt( x - current.outputX , y - current.outputY , matches ) ;
			}
			else
			{
				current.childrenAt( x , y , matches ) ;
			}
			
			matches.push( { element: current , x: x - current.outputX , y: y - current.outputY } ) ;
		}
		else if ( ! current.isContainer )
		{
			// If it is not a container, give a chance to its children to get selected
			current.childrenAt( x , y , matches ) ;
		}
	}
	
	return matches ;
} ;



Element.prototype.saveCursor = function saveCursor()
{
	if ( this.inputDst )
	{
		this.savedCursorX = this.inputDst.cx ;
		this.savedCursorY = this.inputDst.cy ;
	}
	else if ( this.outputDst )
	{
		this.savedCursorX = this.outputDst.cx ;
		this.savedCursorY = this.outputDst.cy ;
	}
	
	return this ;
} ;



Element.prototype.restoreCursor = function restoreCursor()
{
	if ( this.inputDst )
	{
		this.inputDst.cx = this.savedCursorX ;
		this.inputDst.cy = this.savedCursorY ;
		this.inputDst.drawCursor() ;
	}
	else if ( this.outputDst )
	{
		this.outputDst.cx = this.savedCursorX ;
		this.outputDst.cy = this.savedCursorY ;
		this.outputDst.drawCursor() ;
	}
	
	return this ;
} ;



Element.prototype.draw = function draw()
{
	if ( ! this.document ) { return this ; }
	
	this.saveCursor() ;
	this.descendantDraw() ;
	this.ascendantDraw() ;
	this.drawCursor() ;
	return this ;
} ;



// .draw() is used when drawing the current Element is enough: the Element has not moved, and has not been resized.
// If it has, then it is necessary to draw the closest ancestor which is a container.
Element.prototype.redraw = function redraw()
{
	if ( ! this.document ) { return this ; }
	
	var container = this.getParentContainer() ;
	
	//console.error( "parentContainer:" , container ) ;
	if ( ! container ) { this.draw() ; }
	else { container.draw() ; }
	
	return this ;
} ;



// Draw all the children
Element.prototype.descendantDraw = function descendantDraw( isSubcall )
{
	var i , iMax ;
	
	//console.error( '\ndescendantDraw: ' , this.elementType , this.id , "  (" + this.children.length + " children)" ) ;
	
	if ( this.preDrawSelf )
	{
		//console.error( 'preDrawSelf: ' , this.elementType , this.id ) ;
		this.preDrawSelf( ! isSubcall ) ;
	}
	
	for ( i = 0 , iMax = this.children.length ; i < iMax ; i ++ )
	{
		//console.error( ">>>" , i , iMax ) ;
		this.children[ i ].descendantDraw( true ) ;
	}
	
	if ( isSubcall && this.postDrawSelf )
	{
		//console.error( 'postDrawSelf: ' , this.elementType , this.id ) ;
		this.postDrawSelf( ! isSubcall ) ;
	}
	
	return this ;
} ;



// Post-draw from the current element through all the ancestor chain
Element.prototype.ascendantDraw = function ascendantDraw()
{
	//console.error( '\nascendantDraw: ' , this.elementType , this.id ) ;
	var currentElement ;
	
	if ( this.postDrawSelf )
	{
		//console.error( 'postDrawSelf: ' , this.elementType , this.id ) ;
		this.postDrawSelf( true ) ;
	}
	
	currentElement = this ;
	
	while ( currentElement.parent && currentElement.outputDst !== currentElement.document.outputDst )
	{
		currentElement = currentElement.parent ;
		
		if ( currentElement.outputDst !== currentElement.inputDst && currentElement.postDrawSelf )
		{
			//console.error( 'postDrawSelf: ' , currentElement.elementType , currentElement.id ) ;
			currentElement.postDrawSelf( false ) ;
		}
	}
	
	return this ;
} ;



// Draw cursor from the current element through all the ancestor chain
Element.prototype.drawCursor = function drawCursor()
{
	var currentElement ;
	
	if ( this.drawSelfCursor )
	{
		this.drawSelfCursor( true ) ;
	}
	
	currentElement = this ;
	
	while ( currentElement.outputDst !== currentElement.document.outputDst && currentElement.parent )
	{
		currentElement = currentElement.parent ;
		
		if ( currentElement.drawSelfCursor )
		{
			currentElement.drawSelfCursor( false ) ;
		}
	}
	
	return this ;
} ;



// Should be redefined
Element.prototype.isContainer = false ;	// true if it's a container, having a different inputDst and outputDst and local coords
Element.prototype.computeBoundingBoxes = null ;	// should be a function if this element can be drawn
Element.prototype.preDrawSelf = null ;	// should be a function if this element can be drawn
Element.prototype.postDrawSelf = null ;	// should be a function if this element can be drawn
Element.prototype.drawSelfCursor = null ;	// should be a function if this element's cursor can be drawn
Element.prototype.getValue = function getValue() { return null ; } ;
Element.prototype.setValue = function setValue() {} ;


