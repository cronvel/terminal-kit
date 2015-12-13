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
var Widget = require( './Widget.js' ) ;


function Document() { throw new Error( 'Use Document.create() instead' ) ; }
module.exports = Document ;
Document.prototype = Object.create( Widget.prototype ) ;
Document.prototype.constructor = Document ;
Document.prototype.widgetType = 'document' ;



Document.create = function createDocument( options )
{
	var document = Object.create( Document.prototype ) ;
	document.create( options ) ;
	return document ;
} ;



Document.prototype.create = function createDocument( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	Widget.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		focusWidget: { value: null , enumerable: true , writable: true } ,
		onKey: { value: this.onKey.bind( this ) , enumerable: true } ,
	} ) ;
	
	this.eventSource.on( 'key' , this.onKey ) ;
} ;



Document.prototype.giveFocusTo = function giveFocusTo( widget )
{
	if ( this.isAncestorOf( widget ) ) { return this.giveFocusTo_( widget ) ; }
} ;



Document.prototype.giveFocusTo_ = function giveFocusTo_( widget )
{
	if ( this.focusWidget !== widget )
	{
		this.focusWidget.emit( 'focus' , false ) ;
		this.focusWidget = widget ;
		this.focusWidget.emit( 'focus' , true ) ;
	}
	
	// Return false if the focus was given to a widget that does not care about focus and key event
	return ( this.focusWidget.listenerCount( 'focus' ) || this.focusWidget.listenerCount( 'key' ) ) ;
} ;



Document.prototype.focusNext = function focusNext()
{
	var index , currentWidget , focusAware ;
	
	if ( ! this.isAncestorOf( this.focusWidget ) ) { currentWidget = this ; }
	else { currentWidget = this.focusWidget || this ; }
	
	startingWidget = currentWidget ;
	
	while ( true )
	{
		if ( currentWidget.children.length )
		{
			// Give focus to the first child of the widget
			focusAware = this.giveFocusTo_( currentWidget.children[ 0 ] ) ;
		}
		else if ( currentWidget.parentWidget )
		{
			while ( true )
			{
				index = currentWidget.parentWidget.children.indexOf( currentWidget ) ;
				
				if ( index + 1 < currentWidget.parentWidget.children.length )
				{
					// Give focus to the next sibling
					focusAware = this.giveFocusTo_( currentWidget.parentWidget.children[ index + 1 ] ) ;
					break ;
				}
				else if ( currentWidget.parentWidget.parentWidget )
				{
					currentWidget = currentWidget.parentWidget ;
				}
				else
				{
					// We are at the top-level, just below the document, so cycle again at the first-top-level child
					focusAware = this.giveFocusTo_( currentWidget.parentWidget.children[ 0 ] ) ;
					break ;
				}
			}
		}
		else
		{
			// Nothing to do: no children, no parent, nothing...
			return ;
		}
		
		// Exit if the focus was given to a focus-aware widget or if we have done a full loop already
		if ( focusAware || startingWidget === currentWidget ) { break ; }
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
	}
} ;





