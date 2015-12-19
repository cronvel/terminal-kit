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


function Button() { throw new Error( 'Use Button.create() instead' ) ; }
module.exports = Button ;
Button.prototype = Object.create( Element.prototype ) ;
Button.prototype.constructor = Button ;
Button.prototype.elementType = 'Button' ;



Button.create = function createButton( options )
{
	var button = Object.create( Button.prototype ) ;
	button.create( options ) ;
	return button ;
} ;



Button.prototype.create = function createButton( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	Element.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		focusAttr: { value: options.focusAttr || { bgColor: 'blue' } , enumerable: true , writable: true } ,
		blurAttr: { value: options.blurAttr || { bgColor: 'brightBlack' } , enumerable: true , writable: true } ,
		onKey: { value: this.onKey.bind( this ) , enumerable: true } ,
		onFocus: { value: this.onFocus.bind( this ) , enumerable: true } ,
	} ) ;
	
	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.draw() ;
} ;



Button.prototype.postDrawSelf = function postDrawSelf()
{
	if ( ! this.outputDst ) { return this ; }
	
	if ( this.hasFocus ) { this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.focusAttr } , this.content ) ; }
	else { this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.blurAttr } , this.content ) ; }
} ;



Button.prototype.drawSelfCursor = function drawSelfCursor()
{
	// Move the cursor back to the first cell
	this.outputDst.moveTo( this.outputX , this.outputY ) ;
	this.outputDst.drawCursor() ;
} ;



Button.prototype.onFocus = function onFocus( focus )
{
	this.hasFocus = focus ;
	this.draw() ;
} ;



Button.prototype.onKey = function onKey( key , trash , data )
{
	switch ( key )
	{
		case 'KP_ENTER' :
		case 'ENTER' :
			this.emit( 'submit' , this.value ) ;
			break ;
		default :
			return ;	// Bubble up
	}
	
	return true ;	// Do not bubble up
} ;



