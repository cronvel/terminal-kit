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


function Menu() { throw new Error( 'Use Menu.create() instead' ) ; }
module.exports = Menu ;
Menu.prototype = Object.create( Element.prototype ) ;
Menu.prototype.constructor = Menu ;
Menu.prototype.elementType = 'Menu' ;



Menu.create = function createMenu( options )
{
	var menu = Object.create( Menu.prototype ) ;
	menu.create( options ) ;
	return menu ;
} ;



Menu.prototype.create = function createMenu( options )
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
		onButtonSubmit: { value: this.onButtonSubmit.bind( this ) , enumerable: true } ,
		
		// Global default attributes
		buttonFocusAttr: { value: options.buttonFocusAttr || { bgColor: 'green' , color: 'blue' , dim: true } , enumerable: true , writable: true } ,
		buttonBlurAttr: { value: options.buttonBlurAttr || { bgColor: 'white' , color: 'black' } , enumerable: true , writable: true } ,
	} ) ;
	
	this.initChildren() ;
	this.draw() ;
} ;



// Create TextInput and Button automatically
Menu.prototype.initChildren = function initChildren()
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



Menu.prototype.preDrawSelf = function preDrawSelf()
{
	this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.backgroundAttr } , ' '.repeat( this.outputWidth ) ) ;
} ;



Menu.prototype.onButtonSubmit = function onButtonSubmit( buttonValue )
{
	this.emit( 'submit' , buttonValue ) ;
} ;



