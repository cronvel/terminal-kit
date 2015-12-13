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


function Document() { throw new Error( 'Use Document.create() instead' ) ; }
module.exports = Document ;
Document.prototype = Object.create( Element.prototype ) ;
Document.prototype.constructor = Document ;
Document.prototype.elementType = 'document' ;



Document.create = function createDocument( options )
{
	var document = Object.create( Document.prototype ) ;
	document.create( options ) ;
	return document ;
} ;



Document.prototype.create = function createDocument( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	Element.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		focusElement: { value: null , enumerable: true , writable: true } ,
		eventSource: { value: options.events || options.parent } ,
		onKey: { value: this.onKey.bind( this ) , enumerable: true } ,
	} ) ;
	
	this.eventSource.on( 'key' , this.onKey ) ;
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
		
		console.error(
			'Giving focus to' , this.focusElement.label ,
			this.focusElement.listenerCount( 'focus' ) ,
			this.focusElement.listenerCount( 'key' )
		) ;
	}
	
	// Return false if the focus was given to a element that does not care about focus and key event
	return ( this.focusElement.listenerCount( 'focus' ) || this.focusElement.listenerCount( 'key' ) ) ;
} ;



Document.prototype.focusNext = function focusNext()
{
	var index , currentElement , focusAware ;
	
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
		else if ( currentElement.parentElement )
		{
			while ( true )
			{
				index = currentElement.parentElement.children.indexOf( currentElement ) ;
				
				if ( index + 1 < currentElement.parentElement.children.length )
				{
					// Give focus to the next sibling
					currentElement = currentElement.parentElement.children[ index + 1 ] ;
					focusAware = this.giveFocusTo_( currentElement ) ;
					break ;
				}
				else if ( currentElement.parentElement.parentElement )
				{
					currentElement = currentElement.parentElement ;
				}
				else
				{
					// We are at the top-level, just below the document, so cycle again at the first-top-level child
					currentElement = currentElement.parentElement.children[ 0 ] ;
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
		console.error( 'end of loop: ' , focusAware , startingElement.label , currentElement.label ) ;
		if ( focusAware || startingElement === currentElement ) { break ; }
	}
} ;



Document.prototype.focusPrevious = function focusPrevious()
{
	var index , currentElement , focusAware ;
	
	if ( ! this.focusElement || ! this.isAncestorOf( this.focusElement ) ) { currentElement = this ; }
	else { currentElement = this.focusElement ; }
	
	startingElement = currentElement ;
	
	while ( true )
	{
		if ( currentElement.parentElement )
		{
			while ( true )
			{
				index = currentElement.parentElement.children.indexOf( currentElement ) ;
				
				if ( index - 1 >= 0 )
				{
					// Give focus to the previous sibling
					currentElement = currentElement.parentElement.children[ index - 1 ] ;
					focusAware = this.giveFocusTo_( currentElement ) ;
					break ;
				}
				else if ( currentElement.parentElement.parentElement )
				{
					currentElement = currentElement.parentElement ;
				}
				else
				{
					// We are at the top-level, just below the document, so cycle again at the last-top-level child
					currentElement = currentElement.parentElement.children[ currentElement.parentElement.children.length - 1 ] ;
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
		console.error( 'end of loop: ' , focusAware , startingElement.label , currentElement.label ) ;
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





