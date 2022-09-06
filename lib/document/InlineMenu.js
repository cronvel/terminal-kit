/*
	Terminal Kit

	Copyright (c) 2009 - 2022 Cédric Ronvel

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
const TextBox = require( './TextBox.js' ) ;
const RowMenu = require( './RowMenu.js' ) ;

const Promise = require( 'seventh' ) ;
const string = require( 'string-kit' ) ;



function InlineMenu( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	if ( options.value ) { options.content = options.value ; }

	// It is always 1 at the begining
	options.outputHeight = 1 ;

	this.promptTextBox = null ;

	if ( options.prompt ) {
		this.promptTextBox = new TextBox( Object.assign(
			{
				textAttr: options.textAttr
			} ,
			options.prompt ,
			{
				internal: true ,
				//parent: this ,
				outputX: options.outputX || options.x ,
				outputY: options.outputY || options.y ,
				outputWidth: options.outputWidth || options.width ,
				outputHeight: options.outputHeight || options.height ,
				lineWrap: options.lineWrap ,
				wordWrap: options.wordWrap || options.wordwrap
			}
		) ) ;

		// Drop void cells
		this.promptTextBox.textBuffer.setVoidAttr( null ) ;

		let size = this.promptTextBox.getContentSize() ;
		this.promptTextBox.setSizeAndPosition( size ) ;

		if ( size.height > 1 ) {
			options.outputY = ( options.outputY || options.y ) + size.height - 1 ;
		}

		this.leftMargin = this.promptTextBox.outputWidth ;
	}

	RowMenu.call( this , options ) ;

	if ( this.promptTextBox ) {
		this.attach( this.promptTextBox ) ;
	}

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'InlineMenu' && ! options.noDraw ) { this.draw() ; }
}

module.exports = InlineMenu ;
Element.inherit( InlineMenu , RowMenu ) ;



// Pre-compute page and eventually create Buttons automatically
InlineMenu.prototype.initChildren = function( noInitPage = false ) {
	RowMenu.prototype.initChildren.call( this ) ;

	// Only initPage if we are not a superclass of the object
	if ( this.elementType === 'InlineMenu' && ! noInitPage ) { this.initPage() ; }
} ;

