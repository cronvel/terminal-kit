/*
	Terminal Kit

	Copyright (c) 2009 - 2018 Cédric Ronvel

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



const Element = require( './Element.js' ) ;

const ScreenBuffer = require( '../ScreenBuffer.js' ) ;
const TextBuffer = require( '../TextBuffer.js' ) ;
const Rect = require( '../Rect.js' ) ;

const string = require( 'string-kit' ) ;



function TextBox( options = {} ) {
	Element.call( this , options ) ;

	// TextBufffer needs computed attr, not object one
	this.textAttr = ScreenBuffer.object2attr( options.textAttr || options.attr || { bgColor: 'default' } ) ;
	this.emptyAttr = ScreenBuffer.object2attr( options.emptyAttr || options.attr || { bgColor: 'default' } ) ;

	this.hidden = options.hidden ;

	this.stateMachine = options.stateMachine ;

	this.textBuffer = new TextBuffer( {
		dst: this.outputDst ,
		x: this.outputX + ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		y: this.outputY ,
		width: this.outputWidth ,
		height: this.outputHeight ,
		hidden: this.hidden ,
		forceInBound: true ,
		stateMachine: this.stateMachine
	} ) ;

	this.textBuffer.setEmptyCellAttr( this.emptyAttr ) ;

	if ( this.setContent === TextBox.prototype.setContent ) {
		this.setContent( options.content || '' , options.contentHasMarkup , true ) ;
	}

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'TextBox' && ! options.noDraw ) { this.draw() ; }
}

module.exports = TextBox ;

TextBox.prototype = Object.create( Element.prototype ) ;
TextBox.prototype.constructor = TextBox ;
TextBox.prototype.elementType = 'TextBox' ;



TextBox.prototype.destroy = function destroy( isSubDestroy ) {
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



TextBox.prototype.postDrawSelf = function postDrawSelf() {
	this.textBuffer.draw() ;
} ;



/*	Move that to editable text box
TextBox.prototype.drawSelfCursor = function drawSelfCursor() {
	this.textBuffer.drawCursor() ;
} ;
*/


/*	getValue() has no sens for a non-interactive element, move that to editable text box too
TextBox.prototype.getValue = function getValue() {
	return this.textBuffer.getText() ;
} ;
*/



TextBox.prototype.getContent = function getContent() {
	return this.textBuffer.getText() ;
} ;



TextBox.prototype.setContent = function setContent( content , hasMarkup , dontDraw ) {
	var contentSize ;

	this.content = content ;
	this.contentHasMarkup = !! hasMarkup ;

	if ( hasMarkup ) { throw new Error( 'TextBox does not support markup' ) ; }

	this.textBuffer.setText( this.content ) ;

	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
	}
	else {
		this.textBuffer.setAttrCodeRegion( this.textAttr ) ;
	}

	// Move the cursor at the end of the input
	this.textBuffer.moveToEndOfLine() ;

	if ( ! dontDraw ) {
		this.drawCursor() ;
		this.redraw() ;
	}
} ;

