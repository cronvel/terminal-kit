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
		dst: { value: options.dst || options.parent.dst || options.parent } ,
		events: { value: options.events || options.parent.events || options.parent } ,
		parentWidget: { value: options.parent.widgetType ? options.parent : null } ,
		label: { value: options.label || '' , enumerable: true , writable: true } ,
		x: { value: options.x || 1 , enumerable: true , writable: true } ,
		y: { value: options.y || 1 , enumerable: true , writable: true } ,
		enabled: { value: false , enumerable: true , writable: true } ,
		hasFocus: { value: !! options.focus , enumerable: true , writable: true } ,
		children: { value: [] , enumerable: true , writable: true } ,
		onKey: { value: this.onKey.bind( this ) , writable: true } ,
	} ) ;
	
	if ( this.parentWidget )
	{
		this.parentWidget.children.push( this ) ;
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



Widget.prototype.focusNext = function focusNext( bubbledFrom )
{
	var index ;
	
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



// Should be redefined
Widget.prototype.draw = function draw() {} ;
Widget.prototype.getValue = function getValue() { return null ; } ;
Widget.prototype.setValue = function setValue() {} ;



Widget.prototype.onKey = function onKey( key , trash , data )
{
	switch ( key )
	{
		case 'TAB' :
			this.focusNext() ;
			break ;
	}
} ;



