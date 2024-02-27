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



function Text( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	this.attr = options.attr || { bgColor: 'brightBlack' } ;

	this.leftPadding = options.leftPadding || '' ;
	this.rightPadding = options.rightPadding || '' ;
	this.leftPaddingWidth = 0 ;
	this.rightPaddingWidth = 0 ;

	if ( ! Array.isArray( options.content ) ) { options.content = [ options.content || '' ] ; }

	// Usually done by the Element's constructor, but it's required now
	// Also check that sub-class hasn't defined it yet...
	this.content = this.content ?? options.content ;
	this.contentHasMarkup = this.contentHasMarkup ?? options.contentHasMarkup ;
	this.contentEllipsis = options.contentEllipsis === true ? '…' : options.contentEllipsis || '' ;

	let requiredWidth = this.computeRequiredWidth() ;

	// For width and height, we centralize here the work for sub-class having animations
	if ( ! options.width ) {
		options.width = requiredWidth ;
		options.contentAdaptativeWidth = true ;
	}

	if ( ! options.height ) {
		options.height = this.computeRequiredHeight() ;
		options.contentAdaptativeHeight = true ;
	}

	Element.call( this , options ) ;

	if ( this.elementType === 'Text' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Text ;
Element.inherit( Text ) ;



Text.prototype.forceContentArray = true ;



Text.prototype.computeRequiredWidth = function() {
	this.leftPaddingWidth = Element.computeContentWidth( this.leftPadding , this.paddingHasMarkup ) ;
	this.rightPaddingWidth = Element.computeContentWidth( this.rightPadding , this.paddingHasMarkup ) ;
	this.contentWidth =
		this.animation ? Math.max( ... this.animation.map( e => Element.computeContentWidth( e , this.contentHasMarkup ) ) ) :
		Element.computeContentWidth( this.content , this.contentHasMarkup ) || 1 ;

	return this.leftPaddingWidth + this.rightPaddingWidth + this.contentWidth ;
} ;



Text.prototype.computeRequiredHeight = function() {
	return (
		this.animation ?
			Math.max( ... this.animation.map( e => e.length ) ) :
			this.content.length
	) ;
} ;



Text.prototype.resizeOnContent = function() {
	if ( this.contentAdaptativeWidth ) {
		this.outputWidth = this.computeRequiredWidth( this.content , this.contentHasMarkup ) ;
	}

	if ( this.contentAdaptativeHeight ) {
		this.outputHeight = this.computeRequiredHeight( this.content , this.contentHasMarkup ) ;
	}
} ;



Text.prototype.postDrawSelf = function() {
	if ( ! this.outputDst ) { return this ; }

	var resumeAttr ;

	var contentClip = {
		x: this.outputX + this.leftPaddingWidth ,
		y: this.outputY ,
		width: this.outputWidth - this.leftPaddingWidth - this.rightPaddingWidth ,
		height: this.outputHeight
	} ;

	var elementClip = {
		x: this.outputX ,
		y: this.outputY ,
		width: this.outputWidth ,
		height: this.outputHeight
	} ;

	for ( let lineNumber = 0 ; lineNumber < this.outputHeight ; lineNumber ++ ) {
		let contentLine = this.content[ lineNumber ] || '' ;

		// Write the left padding
		if ( this.leftPadding ) {
			this.outputDst.put(
				{
					x: this.outputX ,
					y: this.outputY + lineNumber ,
					attr: this.attr ,
					markup: this.paddingHasMarkup ,
					clip: elementClip
				} ,
				this.leftPadding
			) ;
		}

		// Write the content
		resumeAttr = this.outputDst.put(
			{
				x: this.outputX + this.leftPaddingWidth ,
				y: this.outputY + lineNumber ,
				attr: this.attr ,
				resumeAttr: resumeAttr ,
				markup: this.contentHasMarkup ,
				clip: contentClip ,
				clipChar: this.contentEllipsis
			} ,
			contentLine
		) ;

		let gap = this.outputWidth - ( this.leftPaddingWidth + this.rightPaddingWidth + this.contentWidth ) ;
		if ( gap > 0 ) {
			this.outputDst.put( { attr: this.attr } , ' '.repeat( gap ) ) ;
		}

		// Write the right padding
		if ( this.rightPadding ) {
			this.outputDst.put(
				{
					x: this.outputX + this.outputWidth - this.rightPaddingWidth ,
					y: this.outputY + lineNumber ,
					attr: this.attr ,
					markup: this.paddingHasMarkup ,
					clip: elementClip
				} ,
				this.rightPadding
			) ;
		}
	}
} ;

