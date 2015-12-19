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
var Button = require( './Button.js' ) ;



function ColumnMenu() { throw new Error( 'Use ColumnMenu.create() instead' ) ; }
module.exports = ColumnMenu ;
ColumnMenu.prototype = Object.create( Element.prototype ) ;
ColumnMenu.prototype.constructor = ColumnMenu ;
ColumnMenu.prototype.elementType = 'ColumnMenu' ;



var defaultKeyBindings = {
	LEFT: 'previous' ,
	RIGHT: 'next' ,
//	UP: 'previous' ,
//	DOWN: 'next' ,
} ;



ColumnMenu.create = function createColumnMenu( options )
{
	var columnMenu = Object.create( ColumnMenu.prototype ) ;
	columnMenu.create( options ) ;
	return columnMenu ;
} ;



ColumnMenu.prototype.create = function createColumnMenu( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( ! options.outputWidth && ! options.width )
	{
		options.outputWidth = Math.min( options.parent.inputWidth , options.parent.outputWidth ) ;
	}
	
	Element.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		backgroundAttr: { value: options.backgroundAttr || { bgColor: 'white' } , enumerable: true , writable: true } ,
		buttonsDef: { value: options.buttons || [] , enumerable: true , writable: true } ,
		buttons: { value: [] , enumerable: true , writable: true } ,
		keyBindings: { value: options.keyBindings || defaultKeyBindings , enumerable: true , writable: true } ,
		focusChild: { value: null , enumerable: true , writable: true } ,
		onButtonSubmit: { value: this.onButtonSubmit.bind( this ) , enumerable: true } ,
		onKey: { value: this.onKey.bind( this ) , enumerable: true } ,
		onFocus: { value: this.onFocus.bind( this ) , enumerable: true } ,
		
		// Global default attributes
		buttonFocusAttr: { value: options.buttonFocusAttr || { bgColor: 'green' , color: 'blue' , dim: true } , enumerable: true , writable: true } ,
		buttonBlurAttr: { value: options.buttonBlurAttr || { bgColor: 'white' , color: 'black' } , enumerable: true , writable: true } ,
	} ) ;
	
	this.initChildren() ;
	
	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	
	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'ColumnMenu' ) { this.draw() ; }
} ;



// Create TextInput and Button automatically
ColumnMenu.prototype.initChildren = function initChildren()
{
	var i , iMax ,
		labelMaxLength = 0 , label ,
		buttonsTextLength = 0 , buttonSpacing = 0 , buttonOffsetX , buttonOffsetY ;
	
	
	iMax = this.buttonsDef.length ;
	if ( ! iMax ) { return ; } 
	
	for ( i = 0 ; i < iMax ; i ++ ) { buttonsTextLength += this.buttonsDef[ i ].content.length ; }
	
	//buttonSpacing = Math.floor( ( this.outputWidth - buttonsTextLength ) / ( this.buttonsDef.length ) ) ;
	buttonSpacing = 1 ;
	
	buttonOffsetX = 0 ;
	buttonOffsetY = 0 ;
	
	for ( i = 0 ; i < iMax ; i ++ )
	{
		this.buttons[ i ] = Button.create( {
			parent: this ,
			content: this.buttonsDef[ i ].content ,
			value: this.buttonsDef[ i ].value ,
			outputX: this.outputX + buttonOffsetX ,
			outputY: this.outputY + buttonOffsetY ,
			focusAttr: this.buttonsDef[ i ].focusAttr || this.buttonFocusAttr ,
			blurAttr: this.buttonsDef[ i ].blurAttr || this.buttonBlurAttr ,
		} ) ;
		
		this.buttons[ i ].on( 'submit' , this.onButtonSubmit ) ;
		
		buttonOffsetX += this.buttonsDef[ i ].content.length + buttonSpacing ;
	}
	
} ;



ColumnMenu.prototype.preDrawSelf = function preDrawSelf()
{
	this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.backgroundAttr } , ' '.repeat( this.outputWidth ) ) ;
} ;



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



ColumnMenu.prototype.onFocus = function onFocus( focus )
{
	if ( focus )
	{
		if ( this.focusChild !== null ) { this.document.giveFocusTo( this.focusChild ) ; }
		else { this.focusChild = this.focusNextChild() ; }
	}
} ;



ColumnMenu.prototype.onButtonSubmit = function onButtonSubmit( buttonValue )
{
	this.emit( 'submit' , buttonValue ) ;
} ;



