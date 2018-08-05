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



function Text( options = {} ) {
	this.attr = options.attr || { bgColor: 'brightBlack' } ;
	this.leftPadding = options.leftPadding || '' ;
	this.rightPadding = options.rightPadding || '' ;

	if ( ! Array.isArray( options.content ) ) {
		options.content = [ options.content || '' ] ;
	}

	if ( ! options.width ) {
		options.width =
			Element.computeContentWidth( this.leftPadding , this.paddingHasMarkup )
			+ Element.computeContentWidth( this.rightPadding , this.paddingHasMarkup )
			+ ( Element.computeContentWidth( options.content , options.contentHasMarkup ) || 1 ) ;
	}

	options.height = options.content.length ;

	Element.call( this , options ) ;

	if ( this.elementType === 'Text' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Text ;

Text.prototype = Object.create( Element.prototype ) ;
Text.prototype.constructor = Text ;
Text.prototype.elementType = 'Text' ;



Text.prototype.postDrawSelf = function postDrawSelf() {
	if ( ! this.outputDst ) { return this ; }

	var gap , resumeAttr ;

	this.content.forEach( ( contentLine , lineNumber ) => {
		// Prepare the cursor position, since we will not "put at"
		this.outputDst.moveTo( this.outputX , this.outputY + lineNumber ) ;

		// Write the left padding
		if ( this.leftPadding ) {
			this.outputDst.put( { attr: this.attr , markup: this.paddingHasMarkup } , this.leftPadding ) ;
		}

		// Write the content
		resumeAttr = this.outputDst.put( { attr: this.attr , resumeAttr: resumeAttr , markup: this.contentHasMarkup } , contentLine ) ;

		// Write the right padding
		if ( this.rightPadding ) {
			this.outputDst.put( { attr: this.attr , markup: this.paddingHasMarkup } , this.rightPadding ) ;
		}

		gap = this.outputX + this.outputWidth - this.outputDst.cx ;

		if ( gap > 0 ) {
			this.outputDst.put( { attr: this.attr } , ' '.repeat( gap ) ) ;
		}
	} ) ;
} ;

