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
TextInput.prototype.elementType = 'textInput' ;



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
		emptyAttr: { value: options.emptyAttr || { bgColor: 'blue' } , enumerable: true , writable: true } ,
		textAttr: { value: options.textAttr || { bgColor: 'blue' } , enumerable: true , writable: true } ,
		onKey: { value: this.onKey.bind( this ) , enumerable: true } ,
		onFocus: { value: this.onFocus.bind( this ) , enumerable: true } ,
		keyBindings: { value: options.keyBindings || defaultKeyBindings , enumerable: true , writable: true } ,
		screenBuffer: { value: null , enumerable: true , writable: true } ,
		textBuffer: { value: null , enumerable: true , writable: true } ,
	} ) ;
	
	this.screenBuffer = ScreenBuffer.create( {
		dst: this.dst ,
		x: this.x ,
		y: this.y ,
		width: this.width ,
		height: this.height
	} ) ;
	
	this.textBuffer = TextBuffer.create( {
		dst: this.screenBuffer ,
		forceInBound: true
	} ) ;
	
	this.textBuffer.setEmptyCellAttr( this.emptyAttr ) ;
	this.textAttr = ScreenBuffer.object2attr( this.textAttr ) ;
	
	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.draw() ;
} ;



TextInput.prototype.onKey = function onKey( key , trash , data )
{
	if ( data && data.isCharacter )
	{
		this.textBuffer.insert( key , this.textAttr ) ;
		this.draw() ;
	}
	else
	{
		// Here we have a special key
		
		switch( this.keyBindings[ key ] )
		{
			case 'submit' :
				this.emit( 'submit' , this.textBuffer.getText() ) ;
				break ;
			
			case 'newLine' :
				this.textBuffer.newLine() ;
				this.draw() ;
				break ;
			
			/*
			case 'cancel' :
				if ( options.cancelable ) { cleanup() ; }
				break ;
			*/
			
			case 'backDelete' :
				this.textBuffer.backDelete() ;
				this.draw() ;
				break ;
			
			case 'delete' :
				this.textBuffer.delete() ;
				this.draw() ;
				break ;
			
			case 'backward' :
				this.textBuffer.moveBackward() ;
				this.drawCursor() ;
				break ;
			
			case 'forward' :
				this.textBuffer.moveForward() ;
				this.drawCursor() ;
				break ;
			
			case 'startOfLine' :
				this.textBuffer.moveToColumn( 0 ) ;
				this.drawCursor() ;
				break ;
			
			case 'endOfLine' :
				this.textBuffer.moveToEndOfLine() ;   
				this.drawCursor() ;
				break ;
			
			case 'down' :
				this.textBuffer.moveDown() ;
				this.drawCursor() ;
				break ;
			
			case 'up' :
				this.textBuffer.moveUp() ;
				this.drawCursor() ;
				break ;
		}
	}
} ;



TextInput.prototype.draw = function draw()
{
	this.textBuffer.draw() ;
	this.screenBuffer.draw() ;
	this.textBuffer.drawCursor() ;
	this.screenBuffer.drawCursor() ;
} ;



TextInput.prototype.drawCursor = function drawCursor()
{
	this.textBuffer.drawCursor() ;
	this.screenBuffer.drawCursor() ;
} ;



TextInput.prototype.onFocus = function onFocus( focus )
{
	this.hasFocus = focus ;
	this.drawCursor() ;
} ;



TextInput.prototype.getValue = function getValue()
{
	return this.textBuffer.getText() ;
} ;
        

