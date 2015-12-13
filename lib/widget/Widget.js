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
var events = require( 'events' ) ;



function Widget() { throw new Error( 'Use Widget.create() instead' ) ; }
module.exports = Widget ;
Widget.prototype = Object.create( events.prototype ) ;
Widget.prototype.constructor = Widget ;
Widget.prototype.widgetType = 'widget' ;



Widget.create = function createWidget( options )
{
	var widget = Object.create( Widget.prototype ) ;
	widget.create( options ) ;
	return widget ;
} ;



// Useful to split that for inheritance
Widget.prototype.create = function createWidget( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	Object.defineProperties( this , {
		parent: { value: options.parent } ,
		parentWidget: { value: options.parent.widgetType ? options.parent : null } ,
		eventSource: { value: options.events || options.parent } ,
		dst: { value: options.dst || options.parent.dst || options.parent } ,
		label: { value: options.label || '' , enumerable: true , writable: true } ,
		x: { value: options.x || 1 , enumerable: true , writable: true } ,
		y: { value: options.y || 1 , enumerable: true , writable: true } ,
		enabled: { value: false , enumerable: true , writable: true } ,
		hasFocus: { value: false , enumerable: true , writable: true } ,
		children: { value: [] , enumerable: true , writable: true } ,
		//onKey: { value: this.onKey.bind( this ) , writable: true } ,
	} ) ;
	
	if ( this.parentWidget )
	{
		this.parentWidget.attach( this ) ;
	}
} ;



Widget.prototype.attach = function attach( widget )
{
	// Insert it if it is not already a child
	if ( this.children.indexOf( widget ) === -1 ) { this.children.push( widget ) ; }
} ;



Widget.prototype.isAncestorOf = function isAncestorOf( widget )
{
	var currentWidget = widget ;
	
	while ( true )
	{
		if ( currentWidget === this )
		{
			// Self found: ancestor match!
			return true ;
		}
		else if ( ! currentWidget.parentWidget )
		{
			// The widget is either detached or attached to another parent element
			return false ;
		}
		else if ( currentWidget.parentWidget.children.indexOf( currentWidget ) === -1 )
		{
			// Detached but still retain a ref to its parent.
			// It's probably a bug, so we will remove that link now.
			currentWidget.parentWidget = null ;
			return false ;
		}
		
		currentWidget = currentWidget.parentWidget ;
	}
} ;





Widget.prototype.enable = function enable( value )
{
	value = !! value ;
	
	if ( value !== this.enabled )
	{
		this.enabled = value ;
		
		if ( this.enabled )
		{
			this.focus( this.hasFocus , true ) ;
			this.draw() ;
		}
		else
		{
			this.focus( false ) ;
		}
	}
} ;





// Should be redefined
Widget.prototype.draw = function draw() {} ;
Widget.prototype.getValue = function getValue() { return null ; } ;
Widget.prototype.setValue = function setValue() {} ;


/*
Widget.prototype.onKey = function onKey( key , trash , data )
{
	switch ( key )
	{
		case 'TAB' :
			this.focusNext() ;
			break ;
	}
} ;
*/


/*
Widget.prototype.focus = function focus( value , reset )
{
	value = !! value ;
	
	if ( reset || value !== this.hasFocus )
	{
		this.hasFocus = value ;
		
		if ( this.hasFocus )
		{
			this.events.on( 'key' , this.onKey ) ;
			this.draw() ;
		}
		else
		{
			this.events.removeListener( 'key' , this.onKey ) ;
			this.draw() ;
		}
	}
} ;
*/
