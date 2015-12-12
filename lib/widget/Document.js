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
	} ) ;
} ;



Document.prototype.focusNext = function focusNext()
{
	var index , currentWidget , bubbled = false ;
	
	currentWidget = this.focusWidget || this ;
	
	while ( )
	{
		if ( ! bubbled && currentWidget.children.length )
		{
			this.focusWidget.focus( false ) ;
			currentWidget.children[ 0 ].focus( true ) ;
		}
		else if ( currentWidget.parentWidget )
		{
			currentWidget.parentWidget
			
			index = currentWidget.parentWidget.children.indexOf( currentWidget ) ;
			
			if ( index + 1 < currentWidget.parentWidget.children.length )
			{
				currentWidget.parentWidget.children[ index + 1 ].focus( true ) ;
			}
			else if ( currentWidget.parentWidget.parentWidget )
			{
				// Here!
				bubbled = true ;
				currentWidget = currentWidget.parentWidget ;
			}
			else
			{
				this.focus( true ) ;
			}
		}
		else
		{
			return ;
		}
	}
	
	
	
	
	
	
	
	
	
	if ( bubbledFrom )
	{
		index = this.children.indexOf( bubbledFrom ) ;
		
		if ( index + 1 < this.children.length )
		{
			this.children[ index + 1 ].focus( true ) ;
		}
		else if ( this.parentWidget )
		{
			this.parentWidget.focusNext( this ) ;
		}
		else
		{
			this.focus( true ) ;
		}
	}
	else
	{
		if ( this.children.length )
		{
			this.focus( false ) ;
			this.children[ 0 ].focus( true ) ;
		}
		else if ( this.parentWidget )
		{
			this.focus( false ) ;
			this.parentWidget.focusNext( this ) ;
		}
	}
} ;



Document.prototype.onKey = function onKey( key , trash , data )
{
	switch ( key )
	{
		case 'TAB' :
			this.focusNext() ;
			break ;
	}
} ;





