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
var Button = require( './Button.js' ) ;



function ColumnMenu() { throw new Error( 'Use ColumnMenu.create() instead' ) ; }
module.exports = ColumnMenu ;
ColumnMenu.prototype = Object.create( Element.prototype ) ;
ColumnMenu.prototype.constructor = ColumnMenu ;
ColumnMenu.prototype.elementType = 'ColumnMenu' ;



ColumnMenu.create = function createColumnMenu( options )
{
	var columnMenu = Object.create( ColumnMenu.prototype ) ;
	columnMenu.create( options ) ;
	return columnMenu ;
} ;



ColumnMenu.prototype.create = function create( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( ! options.outputWidth && ! options.width )
	{
		options.outputWidth = Math.min( options.parent.inputWidth , options.parent.outputWidth ) ;
	}
	
	options.height = options.items && options.items.length ;
	
	Element.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		//backgroundAttr: { value: options.backgroundAttr || { bgColor: 'white' } , enumerable: true , writable: true } ,
		itemsDef: { value: options.items || [] , enumerable: true , writable: true } ,
		buttons: { value: [] , enumerable: true , writable: true } ,
		focusChild: { value: null , enumerable: true , writable: true } ,
		onButtonSubmit: { value: this.onButtonSubmit.bind( this ) , enumerable: true } ,
		onKey: { value: this.onKey.bind( this ) , enumerable: true } ,
		onFocus: { value: this.onFocus.bind( this ) , enumerable: true } ,
		
		// Global default attributes
		buttonFocusAttr: { value: options.buttonFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } , enumerable: true , writable: true } ,
		buttonBlurAttr: { value: options.buttonBlurAttr || { bgColor: 'black' , color: 'white' , bold: true } , enumerable: true , writable: true } ,
	} ) ;
	
	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }
	
	this.initChildren() ;
	
	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	
	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'ColumnMenu' ) { this.draw() ; }
} ;



ColumnMenu.prototype.destroy = function destroy( isSubDestroy )
{
	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;
	
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



ColumnMenu.prototype.keyBindings = {
//	LEFT: 'previous' ,
//	RIGHT: 'next' ,
	UP: 'previous' ,
	DOWN: 'next' ,
} ;



// Create TextInput and Button automatically
ColumnMenu.prototype.initChildren = function initChildren()
{
	var i , iMax ,
		labelMaxLength = 0 , label ,
		buttonsMaxLength = 0 , //buttonSpacing = 0 ,
		buttonOffsetX , buttonOffsetY ;
	
	
	iMax = this.itemsDef.length ;
	if ( ! iMax ) { return ; } 
	
	for ( i = 0 ; i < iMax ; i ++ )
	{
		if ( buttonsMaxLength < this.itemsDef[ i ].content.length )
		{
			buttonsMaxLength = this.itemsDef[ i ].content.length ;
		}
	}
	
	//buttonSpacing = Math.floor( ( this.outputWidth - buttonsTextLength ) / ( this.itemsDef.length ) ) ;
	//buttonSpacing = 1 ;
	
	buttonOffsetX = 0 ;
	buttonOffsetY = 0 ;
	
	for ( i = 0 ; i < iMax ; i ++ )
	{
		this.buttons[ i ] = Button.create( {
			parent: this ,
			content: ' ' + this.itemsDef[ i ].content + ' '.repeat( buttonsMaxLength - this.itemsDef[ i ].content.length ) + ' ' ,
			value: this.itemsDef[ i ].value ,
			outputX: this.outputX + buttonOffsetX ,
			outputY: this.outputY + buttonOffsetY ,
			focusAttr: this.itemsDef[ i ].focusAttr || this.buttonFocusAttr ,
			blurAttr: this.itemsDef[ i ].blurAttr || this.buttonBlurAttr ,
		} ) ;
		
		this.buttons[ i ].on( 'submit' , this.onButtonSubmit ) ;
		
		buttonOffsetY ++ ;
	}
	
} ;



/*
ColumnMenu.prototype.preDrawSelf = function preDrawSelf()
{
	//this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.backgroundAttr } , ' '.repeat( this.outputWidth ) ) ;
} ;
*/



ColumnMenu.prototype.onKey = function onKey( key , trash , data )
{
	switch( this.keyBindings[ key ] )
	{
		case 'previous' :
			this.focusChild = this.focusPreviousChild() ;
			break ;
		case 'next' :
			this.focusChild = this.focusNextChild() ;
			break ;
		default :
			return ;	// Bubble up
	}
	
	return true ;	// Do not bubble up
} ;



ColumnMenu.prototype.onFocus = function onFocus( focus , type )
{
	if ( type === 'cycle' ) { return ; }
	
	if ( focus )
	{
		if ( this.focusChild ) { this.document.giveFocusTo( this.focusChild , 'delegate' ) ; }
		else { this.focusChild = this.focusNextChild() ; }
	}
} ;



ColumnMenu.prototype.onButtonSubmit = function onButtonSubmit( buttonValue )
{
	this.emit( 'submit' , buttonValue , undefined , this ) ;
} ;



