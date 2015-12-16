/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2015 Cédric Ronvel 
	
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



// Load modules
var Element = require( './Element.js' ) ;
var Container = require( './Container.js' ) ;
var ScreenBuffer = require( '../ScreenBuffer.js' ) ;


function Document() { throw new Error( 'Use Document.create() instead' ) ; }
module.exports = Document ;
//Document.prototype = Object.create( Element.prototype ) ;
Document.prototype = Object.create( Container.prototype ) ;
Document.prototype.constructor = Document ;
Document.prototype.elementType = 'Document' ;



Document.create = function createDocument( options )
{
	var document = Object.create( Document.prototype ) ;
	document.create( options ) ;
	return document ;
} ;



Document.prototype.create = function createDocument( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	options.outputX = 1 ;
	options.outputY = 1 ;
	options.outputWidth = options.outputDst.width ;
	options.outputHeight = options.outputDst.height ;
	
	//Element.prototype.create.call( this , options ) ;
	Container.prototype.create.call( this , options ) ;
	
	// A document do not have parent
	this.parent = null ;
	
	// The document of a document is itself
	this.document = this ;
	
	// Being the top-level element before the Terminal object, this must use delta-drawing
	this.deltaDraw = true ;
	
	Object.defineProperties( this , {
		eventSource: { value: options.eventSource } ,
		focusElement: { value: null , enumerable: true , writable: true } ,
		elements: { value: {} , enumerable: true } ,
		onKey: { value: this.onKey.bind( this ) , enumerable: true } ,
		onOutputDstResize: { value: this.onOutputDstResize.bind( this ) , enumerable: true } ,
	} ) ;
	
	this.assignId( this , options.id ) ;
	
	this.eventSource.on( 'key' , this.onKey ) ;
	this.eventSource.on( 'resize' , this.onOutputDstResize ) ;
	
	//this.draw()
} ;



// Next element ID
var nextId = 0 ;

Document.prototype.assignId = function assignId( element , id )
{
	if ( ! id || typeof id !== 'string' || id[ 0 ] === '_' || this.elements[ id ] )
	{
		id = '_' + ( nextId ++ ) ;
	}
	
	Object.defineProperty( element , 'id' , { value: id , enumerable: true } ) ;
	this.elements[ id ] = element ;
} ;



Document.prototype.giveFocusTo = function giveFocusTo( element )
{
	if ( this.isAncestorOf( element ) ) { return this.giveFocusTo_( element ) ; }
} ;



Document.prototype.giveFocusTo_ = function giveFocusTo_( element )
{
	if ( this.focusElement !== element )
	{
		if ( this.focusElement ) { this.focusElement.emit( 'focus' , false ) ; }
		this.focusElement = element ;
		this.focusElement.emit( 'focus' , true ) ;
		
		/*
		console.error(
			'Giving focus to' , this.focusElement.content ,
			this.focusElement.listenerCount( 'focus' ) ,
			this.focusElement.listenerCount( 'key' )
		) ;
		*/
	}
	
	// Return false if the focus was given to a element that does not care about focus and key event
	return ( this.focusElement.listenerCount( 'focus' ) || this.focusElement.listenerCount( 'key' ) ) ;
} ;



Document.prototype.focusNext = function focusNext()
{
	var index , startingElement , currentElement , focusAware ;
	
	if ( ! this.focusElement || ! this.isAncestorOf( this.focusElement ) ) { currentElement = this ; }
	else { currentElement = this.focusElement ; }
	
	startingElement = currentElement ;
	
	while ( true )
	{
		if ( currentElement.children.length )
		{
			// Give focus to the first child of the element
			currentElement = currentElement.children[ 0 ] ;
			focusAware = this.giveFocusTo_( currentElement ) ;
		}
		else if ( currentElement.parent )
		{
			while ( true )
			{
				index = currentElement.parent.children.indexOf( currentElement ) ;
				
				if ( index + 1 < currentElement.parent.children.length )
				{
					// Give focus to the next sibling
					currentElement = currentElement.parent.children[ index + 1 ] ;
					focusAware = this.giveFocusTo_( currentElement ) ;
					break ;
				}
				else if ( currentElement.parent.parent )
				{
					currentElement = currentElement.parent ;
				}
				else
				{
					// We are at the top-level, just below the document, so cycle again at the first-top-level child
					currentElement = currentElement.parent.children[ 0 ] ;
					focusAware = this.giveFocusTo_( currentElement ) ;
					break ;
				}
			}
		}
		else
		{
			// Nothing to do: no children, no parent, nothing...
			return ;
		}
		
		// Exit if the focus was given to a focus-aware element or if we have done a full loop already
		//console.error( 'end of loop: ' , focusAware , startingElement.content , currentElement.content ) ;
		if ( focusAware || startingElement === currentElement ) { break ; }
	}
} ;



Document.prototype.focusPrevious = function focusPrevious()
{
	var index , startingElement , currentElement , focusAware ;
	
	if ( ! this.focusElement || ! this.isAncestorOf( this.focusElement ) ) { currentElement = this ; }
	else { currentElement = this.focusElement ; }
	
	startingElement = currentElement ;
	
	while ( true )
	{
		if ( currentElement.parent )
		{
			while ( true )
			{
				index = currentElement.parent.children.indexOf( currentElement ) ;
				
				if ( index - 1 >= 0 )
				{
					// Give focus to the previous sibling
					currentElement = currentElement.parent.children[ index - 1 ] ;
					focusAware = this.giveFocusTo_( currentElement ) ;
					break ;
				}
				else if ( currentElement.parent.parent )
				{
					currentElement = currentElement.parent ;
				}
				else
				{
					// We are at the top-level, just below the document, so cycle again at the last-top-level child
					currentElement = currentElement.parent.children[ currentElement.parent.children.length - 1 ] ;
					focusAware = this.giveFocusTo_( currentElement ) ;
					break ;
				}
			}
		}
		else if ( currentElement.children.length )
		{
			// Give focus to the last child of the element
			currentElement = currentElement.children[ currentElement.children.length - 1 ] ;
			focusAware = this.giveFocusTo_( currentElement ) ;
		}
		else
		{
			// Nothing to do: no children, no parent, nothing...
			return ;
		}
		
		// Exit if the focus was given to a focus-aware element or if we have done a full loop already
		//console.error( 'end of loop: ' , focusAware , startingElement.content , currentElement.content ) ;
		if ( focusAware || startingElement === currentElement ) { break ; }
	}
} ;



Document.prototype.onKey = function onKey( key , trash , data )
{
	this.emit( 'key' , key , trash , data ) ;
	
	switch ( key )
	{
		case 'TAB' :
			this.focusNext() ;
			break ;
		case 'SHIFT_TAB' :
			this.focusPrevious() ;
			break ;
		default :
			if ( this.focusElement && this.focusElement !== this ) { this.focusElement.emit( 'key' , key , trash , data ) ; }
	}
} ;



Document.prototype.onOutputDstResize = function onOutputDstResize( width , height )
{
	//console.error( "Document#onOutputDstResize() " , width , height ) ;
	
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



// Useful? Or use Container#preDrawSelf?
//Document.prototype.preDrawSelf = function preDrawSelf() { this.inputDst.clear() ; } ;



