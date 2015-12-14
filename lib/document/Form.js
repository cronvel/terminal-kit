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
var TextInput = require( './TextInput.js' ) ;
var Button = require( './Button.js' ) ;


function Form() { throw new Error( 'Use Form.create() instead' ) ; }
module.exports = Form ;
Form.prototype = Object.create( Element.prototype ) ;
Form.prototype.constructor = Form ;
Form.prototype.elementType = 'form' ;



Form.create = function createForm( options )
{
	var form = Object.create( Form.prototype ) ;
	form.create( options ) ;
	return form ;
} ;



Form.prototype.create = function createForm( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( ! options.width ) { options.width = 78 ; }
	
	Element.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		textInputsDef: { value: options.textInputs || [] , enumerable: true , writable: true } ,
		textInputs: { value: [] , enumerable: true , writable: true } ,
		buttonsDef: { value: options.buttons || [] , enumerable: true , writable: true } ,
		buttons: { value: [] , enumerable: true , writable: true } ,
		onKey: { value: this.onKey.bind( this ) , enumerable: true } ,
		onFocus: { value: this.onFocus.bind( this ) , enumerable: true } ,
		
		// Global default attributes
		textAttr: { value: options.textAttr || null , enumerable: true , writable: true } ,
		emptyAttr: { value: options.emptyAttr || null , enumerable: true , writable: true } ,
		labelFocusAttr: { value: options.labelFocusAttr || null , enumerable: true , writable: true } ,
		labelBlurAttr: { value: options.labelBlurAttr || null , enumerable: true , writable: true } ,
	} ) ;
	
	this.draw() ;
} ;



var textInputKeyBindings = {
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	UP: 'up' ,
	DOWN: 'down' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine'
} ;



// Create TextInput and Button automatically
Form.prototype.initChildren = function initChildren()
{
	var i , iMax ,
		labelMaxLength = 0 , label ,
		buttonsTextLength = 0 , buttonSpacing = 0 , buttonOffsetX , buttonOffsetY ;
	
	iMax = this.inputsDef.length ;
	
	for ( i = 0 ; i < iMax ; i ++ )
	{
		if ( this.textInputsDef[ i ].label.length > labelMaxLength ) { labelMaxLength = this.textInputsDef[ i ].label.length ; }
	}
	
	for ( i = 0 ; i < iMax ; i ++ )
	{
		label = this.textInputsDef[ i ].label + ' '.repeat( labelMaxLength - this.textInputsDef[ i ].label.length ) ;
		
		this.textInputs[ i ] = TextInput.create( {
			parent: this ,
			label: label ,
			x: this.x , 
			y: this.y + i ,
			width: this.textInputsDef[ i ].width || this.width ,
			height: 1 ,
			textAttr: this.textInputsDef[ i ].textAttr || this.textAttr ,
			emptyAttr: this.textInputsDef[ i ].emptyAttr || this.emptyAttr ,
			labelFocusAttr: this.textInputsDef[ i ].labelFocusAttr || this.labelFocusAttr ,
			labelBlurAttr: this.textInputsDef[ i ].labelBlurAttr || this.labelBlurAttr ,
		} ) ;
	}
	
	
	if ( ! this.buttonsDef.length )
	{
		this.buttonsDef.push( {
			content: 'Submit'
		} ) ;
	}
	
	iMax = this.buttonsDef.length ;
	
	if ( iMax >= 2 )
	{
		for ( i = 0 ; i < iMax ; i ++ ) { buttonsTextLength += this.buttonsDef[ i ].content.length ; }
		buttonSpacing = Math.floor( ( this.width - buttonsTextLength ) / ( this.inputs.length - 1 ) ) ;
	}
	
	buttonOffsetX = 0 ;
	buttonOffsetY = i + 2 ;
	
	for ( i = 0 ; i < iMax ; i ++ )
	{
		this.buttons[ i ] = Button.create( {
			parent: this ,
			content: this.buttonsDef[ i ].content ,
			value: this.buttonsDef[ i ].value ,
			x: this.x + buttonOffsetX , 
			y: this.y + buttonOffsetY ,
		} ) ;
		
		buttonOffsetX += this.buttonsDef[ i ].content.length + buttonSpacing ;
	}
	
	this.term.on( 'key' , this.onKey ) ;
} ;



Form.prototype.draw = function draw() {} ;



