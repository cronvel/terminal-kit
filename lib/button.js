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



function Button() { throw new Error( 'Use Button.create() instead' ) ; }
//module.exports = Button ;
Button.prototype = Object.create( events.prototype ) ;
Button.prototype.constructor = Button ;
Button.prototype.widgetType = 'button' ;



Button.create = function createButton( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var button = Object.create( Button.prototype , {
		term: { value: this } ,
		label: { value: options.label , enumerable: true } ,
		x: { value: options.x || 1 , enumerable: true , writable: true } ,
		y: { value: options.y || 1 , enumerable: true , writable: true } ,
		hasFocus: { value: !! options.focus , enumerable: true , writable: true } ,
		blurAttr: { value: options.blurAttr || {} , enumerable: true , writable: true } ,
		focusAttr: { value: options.focusAttr || {} , enumerable: true , writable: true } ,
	} ) ;
	
	Object.defineProperties( button , {
		onKey: { value: onKey.bind( button ) }
	} ) ;
	
	button.run() ;
	
	return button ;
} ;

module.exports = Button.create ;



Button.prototype.run = function run()
{
	this.term.on( 'key' , this.onKey ) ;
	this.draw() ;
} ;



Button.prototype.focus = function focus( value )
{
	value = !! value ;
	
	if ( value !== this.hasFocus )
	{
		this.hasFocus = value ;
		this.draw() ;
	}
} ;



Button.prototype.redraw =
Button.prototype.draw = function draw()
{
	this.term.moveTo( this.x , this.y ) ;
	
	if ( this.hasFocus ) { this.term.bgBlue( this.label ) ; }
	else { this.term.bgBrightBlack( this.label ) ; }
	
	// Move the cursor back to the first cell
	this.term.moveTo( this.x , this.y ) ;
} ;



Button.prototype.value = function() { return null } ;



function onKey( key , trash , data )
{
	if ( ! this.hasFocus ) { return ; }
	
	switch ( key )
	{
		case 'KP_ENTER' :
		case 'ENTER' :
			this.emit( 'press' ) ;
			break ;
	}
}



