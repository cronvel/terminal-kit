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
var ScreenBuffer = require( '../ScreenBuffer.js' ) ;
var TextBuffer = require( '../TextBuffer.js' ) ;



function Text() { throw new Error( 'Use Text.create() instead' ) ; }
module.exports = Text ;
Text.prototype = Object.create( Element.prototype ) ;
Text.prototype.constructor = Text ;
Text.prototype.elementType = 'Text' ;



Text.create = function createText( options )
{
	var text = Object.create( Text.prototype ) ;
	text.create( options ) ;
	return text ;
} ;



Text.prototype.create = function create( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	Element.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		textAttr: { value: options.textAttr || options.attr || { bgColor: 'black' , color: 'white' } , enumerable: true , writable: true } ,
		emptyAttr: { value: options.emptyAttr || options.textAttr || options.attr || { bgColor: 'black' , color: 'white' } , enumerable: true , writable: true } ,
		textBuffer: { value: null , enumerable: true , writable: true } ,
		contentSize: { value: null , enumerable: true , writable: true } ,
	} ) ;
	
	this.textBuffer = TextBuffer.create( {
		dst: this.outputDst ,
		x: this.outputX ,
		y: this.outputY
	} ) ;
	
	this.textAttr = ScreenBuffer.object2attr( this.textAttr ) ;
	this.emptyAttr = ScreenBuffer.object2attr( this.emptyAttr ) ;
	this.textBuffer.setEmptyCellAttr( this.emptyAttr ) ;
	
	this.setContent( this.content , true ) ;
	
	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Text' ) { this.draw() ; }
} ;



Text.prototype.getContent = function getContent()
{
	return this.textBuffer.getText() ;
} ;



Text.prototype.setContent = function setContent( content , dontDraw )
{
	var contentSize ;
	
	this.content = content ;
	
	this.textBuffer.setText( this.content ) ;
	contentSize = this.textBuffer.getContentSize() ;
	this.outputWidth = contentSize.width ;
	this.outputHeight = contentSize.height ;
	
	this.textBuffer.setAttrCodeRegion( this.textAttr ) ;
	
	if ( ! dontDraw ) { this.redraw() ; }
} ;



Text.prototype.destroy = function destroy( isSubDestroy )
{
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



Text.prototype.postDrawSelf = function postDrawSelf()
{
	//this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.textAttr } , this.content ) ;
	this.textBuffer.draw( { srcClipRect: { x: 0 , y: 0 , width: this.outputWidth , height: this.outputHeight } } ) ;
} ;


