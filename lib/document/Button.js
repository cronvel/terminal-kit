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



Button.prototype.create = function create( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	options.width = options.content.length || 1 ;
	options.height = 1 ;
	
	Element.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		focusAttr: { value: options.focusAttr || { bgColor: 'blue' } , enumerable: true , writable: true } ,
		blurAttr: { value: options.blurAttr || { bgColor: 'brightBlack' } , enumerable: true , writable: true } ,
		currentAttr: { value: null , enumerable: true , writable: true } ,
		animationCountdown: { value: 0 , enumerable: true , writable: true } ,
		onKey: { value: this.onKey.bind( this ) , enumerable: true } ,
		onFocus: { value: this.onFocus.bind( this ) , enumerable: true } ,
		onHover: { value: this.onHover.bind( this ) , enumerable: true } ,
		onClick: { value: this.onClick.bind( this ) , enumerable: true } ,
	} ) ;
	
	this.currentAttr = this.blurAttr ;
	
	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.on( 'click' , this.onClick ) ;
	this.on( 'hover' , this.onHover ) ;
	
	this.draw() ;
} ;



Button.prototype.destroy = function destroy( isSubDestroy )
{
	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;
	this.off( 'click' , this.onClick ) ;
	this.off( 'hover' , this.onHover ) ;
	
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



Button.prototype.postDrawSelf = function postDrawSelf()
{
	if ( ! this.outputDst ) { return this ; }
	
	this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.currentAttr } , this.content ) ;
} ;



Button.prototype.drawSelfCursor = function drawSelfCursor()
{
	// Move the cursor back to the first cell
	this.outputDst.moveTo( this.outputX , this.outputY ) ;
	this.outputDst.drawCursor() ;
} ;



// Blink effect, when the button is submitted
Button.prototype.blink = function blink()
{
	if ( ! this.animationCountdown ) { this.animationCountdown = 4 ; }
	else { this.animationCountdown -- ; }
	
	if ( this.animationCountdown )
	{
		if ( this.animationCountdown % 2 ) { this.currentAttr = this.focusAttr ; }
		else { this.currentAttr = this.blurAttr ; }
		
		this.draw() ;
		
		setTimeout( this.blink.bind( this ) , 80 ) ;
	}
	else
	{
		this.currentAttr = this.hasFocus ? this.focusAttr : this.blurAttr ;
		this.draw() ;
	}
} ;



Button.prototype.onFocus = function onFocus( focus , type )
{
	this.hasFocus = focus ;
	this.currentAttr = this.hasFocus ? this.focusAttr : this.blurAttr ;
	this.draw() ;
} ;



Button.prototype.onKey = function onKey( key , trash , data )
{
	switch ( key )
	{
		case 'KP_ENTER' :
		case 'ENTER' :
			this.emit( 'submit' , this.value , undefined , this ) ;
			this.blink() ;
			break ;
		default :
			return ;	// Bubble up
	}
	
	return true ;	// Do not bubble up
} ;



Button.prototype.onHover = function onHover( data )
{
	this.document.giveFocusTo( this , 'hover' ) ;
} ;



Button.prototype.onClick = function onClick( data )
{
	this.document.giveFocusTo( this , 'select' ) ;
	this.emit( 'submit' , this.value , undefined , this ) ;
	this.blink() ;
} ;



