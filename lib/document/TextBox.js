/*
	Terminal Kit

	Copyright (c) 2009 - 2019 Cédric Ronvel

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

	this.onKey = this.onKey.bind( this ) ;
	this.onDrag = this.onDrag.bind( this ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	// TextBuffer needs computed attr, not object one
	// /!\ ... and this should be fixed! /!\
	this.textAttr = this.document.object2attr( options.textAttr || options.attr || { bgColor: 'default' } ) ;
	this.emptyAttr = this.document.object2attr( options.emptyAttr || options.attr || { bgColor: 'default' } ) ;

	this.hiddenContent = options.hiddenContent ;

	this.stateMachine = options.stateMachine ;

	this.textBuffer = new TextBuffer( {
		dst: this.outputDst ,
		//palette: this.document.palette ,
		x: this.outputX + ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		y: this.outputY ,
		width: this.outputWidth ,
		height: this.outputHeight ,
		hidden: this.hiddenContent ,
		forceInBound: true ,
		stateMachine: this.stateMachine
	} ) ;

	this.textBuffer.setEmptyCellAttr( this.emptyAttr ) ;

	if ( this.setContent === TextBox.prototype.setContent ) {
		this.setContent( options.content , options.contentHasMarkup , true ) ;
	}

	this.on( 'key' , this.onKey ) ;
	this.on( 'drag' , this.onDrag ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'TextBox' && ! options.noDraw ) { this.draw() ; }
}

module.exports = TextBox ;

TextBox.prototype = Object.create( Element.prototype ) ;
TextBox.prototype.constructor = TextBox ;
TextBox.prototype.elementType = 'TextBox' ;



TextBox.prototype.destroy = function( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'drag' , this.onDrag ) ;

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



TextBox.prototype.keyBindings = {
	CTRL_O: 'copyClipboard'
} ;



TextBox.prototype.postDrawSelf = function() {
	this.textBuffer.draw() ;
} ;



/*	Move that to editable text box
TextBox.prototype.drawSelfCursor = function() {
	this.textBuffer.drawCursor() ;
} ;
*/


/*	getValue() has no sens for a non-interactive element, move that to editable text box too
TextBox.prototype.getValue = function() {
	return this.textBuffer.getText() ;
} ;
*/



TextBox.prototype.getContent = function() {
	return this.textBuffer.getText() ;
} ;



TextBox.prototype.setContent = function( content , hasMarkup , dontDraw ) {
	var contentSize ;

	if ( typeof content !== 'string' ) {
		if ( content === null || content === undefined ) { content = '' ; }
		else { content = '' + content ; }
	}

	this.content = content ;
	this.contentHasMarkup = !! hasMarkup ;

	//if ( hasMarkup ) { throw new Error( 'TextBox does not support markup' ) ; }

	this.textBuffer.setText( this.content , this.contentHasMarkup ) ;

	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
	}
	else if ( ! this.contentHasMarkup ) {
		this.textBuffer.setAttrCodeRegion( this.textAttr ) ;
	}

	// Move the cursor at the end of the input
	this.textBuffer.moveToEndOfLine() ;

	if ( ! dontDraw ) {
		this.drawCursor() ;
		this.redraw() ;
	}
} ;



TextBox.prototype.onKey = function( key , trash , data ) {
	if ( data && data.isCharacter ) {
		return ;	// Bubble up
	}

	// Here we have a special key

	switch( this.keyBindings[ key ] ) {
		case 'copyClipboard' :
			if ( this.document ) {
				this.document.setClipboard( this.textBuffer.getSelectionText() ).catch( () => undefined ) ;
			}
			break ;

		default :
			return ;	// Bubble up
	}

	return true ;		// Do not bubble up
} ;



TextBox.prototype.onDrag = function( data ) {
	var xmin , ymin , xmax , ymax ;

	if ( ! this.hasFocus ) {
		this.document.giveFocusTo( this , 'select' ) ;
	}

	if ( data.yFrom < data.y || ( data.yFrom === data.y && data.xFrom <= data.x ) ) {
		ymin = data.yFrom ;
		ymax = data.y ;
		xmin = data.xFrom ;
		xmax = data.x ;
	}
	else {
		ymin = data.y ;
		ymax = data.yFrom ;
		xmin = data.x ;
		xmax = data.xFrom ;
	}

	this.textBuffer.setSelectionRegion( {
		xmin , xmax , ymin , ymax
	} ) ;

	if ( this.document ) {
		this.document.setClipboard( this.textBuffer.getSelectionText() , 'primary' ).catch( () => undefined ) ;
	}

	this.draw() ;
} ;

