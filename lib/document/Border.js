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
const framesChars = require( '../spChars.js' ).box ;



function Border( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	this.onParentResize = this.onParentResize.bind( this ) ;

	Element.call( this , options ) ;

	if ( ! this.parent ) {
		throw new Error( "Border requires a parent widget" ) ;
	}

	this.attr = options.attr || { bgColor: 'gray' , color: 'white' , dim: true } ;

	this.shadow = !! options.shadow ;
	this.shadowChar = options.shadowChar || ' ' ;
	this.shadowAttr = options.shadowAttr || { bgColor: 'black' , color: 'gray' } ;

	this.outputX = this.parent.outputX - 1 ;
	this.outputY = this.parent.outputY - 1 ;
	this.outputWidth = this.parent.outputWidth + ( this.shadow ? 3 : 2 ) ;
	this.outputHeight = this.parent.outputHeight + ( this.shadow ? 3 : 2 ) ;

	this.frameChars = framesChars.double ;

	if ( options.frameChars ) {
		if ( typeof options.frameChars === 'object' ) {
			this.frameChars = options.frameChars ;
		}
		else if ( typeof options.frameChars === 'string' && framesChars[ options.frameChars ] ) {
			this.frameChars = framesChars[ options.frameChars ] ;
		}
	}

	this.on( 'parentResize' , this.onParentResize ) ;

	if ( this.elementType === 'Border' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Border ;
Element.inherit( Border ) ;



Border.prototype.preDrawSelf = function() {
	var y , ymax , vFrame ,
		extra = this.shadow ? 1 : 0 ;

	// Draw the top border
	this.outputDst.put(
		{ x: this.outputX , y: this.outputY , attr: this.attr } ,
		this.frameChars.topLeft + this.frameChars.horizontal.repeat( this.outputWidth - 2 - extra ) + this.frameChars.topRight
	) ;

	// Draw the bottom border
	this.outputDst.put(
		{ x: this.outputX , y: this.outputY + this.outputHeight - 1 - extra , attr: this.attr } ,
		this.frameChars.bottomLeft + this.frameChars.horizontal.repeat( this.outputWidth - 2 - extra ) + this.frameChars.bottomRight
	) ;

	// Draw the left and right border
	vFrame = this.frameChars.vertical.repeat( this.outputHeight - 2 - extra ) ;
	this.outputDst.put( {
		x: this.outputX , y: this.outputY + 1 , direction: 'down' , attr: this.attr
	} , vFrame ) ;
	this.outputDst.put( {
		x: this.outputX + this.outputWidth - 1 - extra , y: this.outputY + 1 , direction: 'down' , attr: this.attr
	} , vFrame ) ;

	if ( this.shadow ) {
		// Draw the bottom shadow
		this.outputDst.put(
			{ x: this.outputX + 1 , y: this.outputY + this.outputHeight - 1 , attr: this.shadowAttr } ,
			this.shadowChar.repeat( this.outputWidth - 1 )
		) ;

		// Draw the right shadow
		this.outputDst.put(
			{
				x: this.outputX + this.outputWidth - 1 , y: this.outputY + 1 , direction: 'down' , attr: this.shadowAttr
			} ,
			this.shadowChar.repeat( this.outputHeight - 2 )
		) ;
	}
} ;



Border.prototype.onParentResize = function() {
	//this.outputX = this.parent.outputX - 1 ;
	//this.outputY = this.parent.outputY - 1 ;
	this.outputWidth = this.parent.outputWidth + ( this.shadow ? 3 : 2 ) ;
	this.outputHeight = this.parent.outputHeight + ( this.shadow ? 3 : 2 ) ;
	this.draw() ;
} ;

