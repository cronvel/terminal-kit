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
var string = require( 'string-kit' ) ;
//var autoComplete = require( './autoComplete.js' ) ;
var ScreenBuffer = require( '../ScreenBuffer.js' ) ;
var TextBuffer = require( '../TextBuffer.js' ) ;

var Element = require( './Element.js' ) ;


function TextInput() { throw new Error( 'Use TextInput.create() instead' ) ; }
module.exports = TextInput ;
TextInput.prototype = Object.create( Element.prototype ) ;
TextInput.prototype.constructor = TextInput ;
TextInput.prototype.elementType = 'TextInput' ;



TextInput.create = function createTextInput( options )
{
	var textInput = Object.create( TextInput.prototype ) ;
	textInput.create( options ) ;
	return textInput ;
} ;



var defaultKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	//ESCAPE: 'cancel' ,
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	UP: 'up' ,
	DOWN: 'down' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine' ,
	TAB: 'autoComplete'
} ;



TextInput.prototype.create = function createTextInput( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	Element.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		textAttr: { value: options.textAttr || { bgColor: 'blue' } , enumerable: true , writable: true } ,
		emptyAttr: { value: options.emptyAttr || { bgColor: 'blue' } , enumerable: true , writable: true } ,
		labelFocusAttr: { value: options.labelFocusAttr || { bold: true } , enumerable: true , writable: true } ,
		labelBlurAttr: { value: options.labelBlurAttr || { dim: true } , enumerable: true , writable: true } ,
		onKey: { value: this.onKey.bind( this ) , enumerable: true } ,
		onFocus: { value: this.onFocus.bind( this ) , enumerable: true } ,
		keyBindings: { value: options.keyBindings || defaultKeyBindings , enumerable: true , writable: true } ,
		screenBuffer: { value: null , enumerable: true , writable: true } ,
		labelTextBuffer: { value: null , enumerable: true , writable: true } ,
		inputTextBuffer: { value: null , enumerable: true , writable: true } ,
	} ) ;
	
	this.screenBuffer = ScreenBuffer.create( {
		dst: this.dst ,
		x: this.x ,
		y: this.y ,
		width: this.width ,
		height: this.height
	} ) ;
	
	if ( this.label )
	{
		this.labelTextBuffer = TextBuffer.create( {
			dst: this.screenBuffer ,
			width: this.label.length ,
			height: 1
		} ) ;
		
		this.labelTextBuffer.setText( this.label ) ;
		
		this.inputTextBuffer = TextBuffer.create( {
			dst: this.screenBuffer ,
			x: this.label.length ,
			forceInBound: true
		} ) ;
	}
	else
	{
		this.inputTextBuffer = TextBuffer.create( {
			dst: this.screenBuffer ,
			forceInBound: true
		} ) ;
	}
	
	this.textAttr = ScreenBuffer.object2attr( this.textAttr ) ;
	this.emptyAttr = ScreenBuffer.object2attr( this.emptyAttr ) ;
	this.labelFocusAttr = ScreenBuffer.object2attr( this.labelFocusAttr ) ;
	this.labelBlurAttr = ScreenBuffer.object2attr( this.labelBlurAttr ) ;
	
	this.inputTextBuffer.setEmptyCellAttr( this.emptyAttr ) ;
	
	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.draw() ;
} ;



TextInput.prototype.onKey = function onKey( key , trash , data )
{
	if ( data && data.isCharacter )
	{
		this.inputTextBuffer.insert( key , this.textAttr ) ;
		this.draw() ;
	}
	else
	{
		// Here we have a special key
		
		switch( this.keyBindings[ key ] )
		{
			case 'submit' :
				this.emit( 'submit' , this.inputTextBuffer.getText() ) ;
				break ;
			
			case 'newLine' :
				this.inputTextBuffer.newLine() ;
				this.draw() ;
				break ;
			
			/*
			case 'cancel' :
				if ( options.cancelable ) { cleanup() ; }
				break ;
			*/
			
			case 'backDelete' :
				this.inputTextBuffer.backDelete() ;
				this.draw() ;
				break ;
			
			case 'delete' :
				this.inputTextBuffer.delete() ;
				this.draw() ;
				break ;
			
			case 'backward' :
				this.inputTextBuffer.moveBackward() ;
				this.drawCursor() ;
				break ;
			
			case 'forward' :
				this.inputTextBuffer.moveForward() ;
				this.drawCursor() ;
				break ;
			
			case 'startOfLine' :
				this.inputTextBuffer.moveToColumn( 0 ) ;
				this.drawCursor() ;
				break ;
			
			case 'endOfLine' :
				this.inputTextBuffer.moveToEndOfLine() ;   
				this.drawCursor() ;
				break ;
			
			case 'down' :
				this.inputTextBuffer.moveDown() ;
				this.drawCursor() ;
				break ;
			
			case 'up' :
				this.inputTextBuffer.moveUp() ;
				this.drawCursor() ;
				break ;
		}
	}
} ;



TextInput.prototype.draw = function draw()
{
	if ( this.labelTextBuffer )
	{
		this.labelTextBuffer.setEmptyCellAttr( this.hasFocus ? this.labelFocusAttr : this.labelBlurAttr ) ;
		this.labelTextBuffer.setAttrCodeRegion(
			this.hasFocus ? this.labelFocusAttr : this.labelBlurAttr ,
			{ xmin: 0 , xmax: Infinity , ymin: 0 , ymax: Infinity }
		) ;
		
		this.labelTextBuffer.draw() ;
	}
	
	this.inputTextBuffer.draw() ;
	this.screenBuffer.draw() ;
	
	this.inputTextBuffer.drawCursor() ;
	this.screenBuffer.drawCursor() ;
	
	return this ;
} ;



TextInput.prototype.drawCursor = function drawCursor()
{
	this.inputTextBuffer.drawCursor() ;
	this.screenBuffer.drawCursor() ;
	
	return this ;
} ;



TextInput.prototype.onFocus = function onFocus( focus )
{
	this.hasFocus = focus ;
	this.draw() ;
} ;



TextInput.prototype.getValue = function getValue()
{
	return this.inputTextBuffer.getText() ;
} ;
        

