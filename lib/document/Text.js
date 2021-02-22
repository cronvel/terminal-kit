/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

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

	if ( ! Array.isArray( options.content ) ) { options.content = [ options.content || '' ] ; }

	// Usually done by the Element's constructor, but it's required now
	this.content = options.content ;
	this.contentHasMarkup = options.contentHasMarkup ;

	// For width and height, we centralize here works for sub-class having animations
	if ( ! options.width ) {
		options.width = this.computeRequiredWidth() ;
	}

	options.height = this.computeRequiredHeight() ;

	Element.call( this , options ) ;

	if ( this.elementType === 'Text' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Text ;

Text.prototype = Object.create( Element.prototype ) ;
Text.prototype.constructor = Text ;
Text.prototype.elementType = 'Text' ;

Text.prototype.forceContentArray = true ;



Text.prototype.computeRequiredWidth = function() {
	return (
		Element.computeContentWidth( this.leftPadding , this.paddingHasMarkup )
		+ Element.computeContentWidth( this.rightPadding , this.paddingHasMarkup )
		+ ( this.animation ?
			Math.max( ... this.animation.map( e => Element.computeContentWidth( e , this.contentHasMarkup ) ) ) :
			Element.computeContentWidth( this.content , this.contentHasMarkup ) || 1
		)
	) ;
} ;



Text.prototype.computeRequiredHeight = function() {
	return (
		this.animation ?
			Math.max( ... this.animation.map( e => e.length ) ) :
			this.content.length
	) ;
} ;



Text.prototype.resizeOnContent = function() {
	this.width = this.computeRequiredWidth( this.content , this.contentHasMarkup ) ;
	this.height = this.computeRequiredHeight( this.content , this.contentHasMarkup ) ;
} ;



Text.prototype.postDrawSelf = function() {
	if ( ! this.outputDst ) { return this ; }

	var gap , resumeAttr , lineNumber , contentLine ;

	for ( lineNumber = 0 ; lineNumber < this.outputHeight ; lineNumber ++ ) {
		contentLine = this.content[ lineNumber ] || '' ;

		// Prepare the cursor position, since we will not "put at"
		// We use cx/cy directly because we can violate bounds limit, and let .put() clip things away
		this.outputDst.cx = this.outputX ;
		this.outputDst.cy = this.outputY + lineNumber ;
		//this.outputDst.moveTo( this.outputX , this.outputY + lineNumber ) ;

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

		// NOTE: this.outputDst.cx is not incremented when it is already at the last column,
		// so the "gap" formula only works if lesser than width - 1
		if ( this.outputDst.cx < this.outputDst.width - 1 ) {
			gap = this.outputX + this.outputWidth - this.outputDst.cx ;

			if ( gap > 0 ) {
				this.outputDst.put( { attr: this.attr } , ' '.repeat( gap ) ) ;
			}
		}
	}
} ;

