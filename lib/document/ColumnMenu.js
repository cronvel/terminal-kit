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
const BaseMenu = require( './BaseMenu.js' ) ;
const Button = require( './Button.js' ) ;



// Inherit from BaseMenu for common methods

function ColumnMenu( options = {} ) {
	if ( ! options.outputWidth && ! options.width ) {
		if ( options.parent ) {
			options.outputWidth = Math.min( options.parent.inputWidth , options.parent.outputWidth ) ;
		}
		else if ( options.inlineTerm ) {
			options.outputWidth = options.inlineTerm.width ;
		}
	}

	this.buttonsMaxWidth = 0 ;
	this.pageMaxHeight = options.pageMaxHeight || null ;
	this.pageItemsDef = [] ;

	if ( ! options.multiLineItems ) {
		options.height = options.items && options.items.length ;
	}

	BaseMenu.call( this , options , defaultOptions ) ;

	this.multiLineItems = !! options.multiLineItems ;

	this.initChildren() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'ColumnMenu' && ! options.noDraw ) { this.draw() ; }
}

module.exports = ColumnMenu ;

ColumnMenu.prototype = Object.create( BaseMenu.prototype ) ;
ColumnMenu.prototype.constructor = ColumnMenu ;
ColumnMenu.prototype.elementType = 'ColumnMenu' ;



const defaultOptions = {
	buttonBlurAttr: { bgColor: 'black' , color: 'white' , bold: true } ,
	buttonFocusAttr: { bgColor: 'white' , color: 'black' , bold: true } ,
	buttonDisabledAttr: { bgColor: 'black' , color: 'brightBlack' , bold: true } ,
	buttonSubmittedAttr: { bgColor: 'brightBlack' , color: 'brightWhite' , bold: true }
} ;



ColumnMenu.prototype.inlineNewLine = true ;



ColumnMenu.prototype.destroy = function( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



ColumnMenu.prototype.keyBindings = {
	//LEFT: 'previous' ,
	//RIGHT: 'next' ,
	UP: 'previous' ,
	DOWN: 'next' ,
	KP_ENTER: 'submit' ,
	ENTER: 'submit'
} ;



// Create Buttons automatically
ColumnMenu.prototype.initChildren = function() {
	var buttonPaddingWidth ;

	if ( ! this.itemsDef.length ) { return ; }

	buttonPaddingWidth =
		Math.max(
			Element.computeContentWidth( this.blurLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.focusLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.disabledLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.submittedLeftPadding , this.paddingHasMarkup )
		) + Math.max(
			Element.computeContentWidth( this.blurRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.focusRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.disabledRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.submittedRightPadding , this.paddingHasMarkup )
		) ;

	if ( buttonPaddingWidth > this.outputWidth ) {
		// The padding itself is bigger than the width... so what should we do?
		return ;
	}

	var ellipsisWidth = Element.computeContentWidth( this.contentEllipsis , false ) ;
	var page = 0 , pageHeight = 0 ;

	this.itemsDef.forEach( ( def , index ) => {
		def.buttonContent = def.content ;
		def.contentHasMarkup = def.contentHasMarkup || def.markup ;

		var isLastItem = index === this.itemsDef.length - 1 ;
		var currentPageMaxHeight = this.pageMaxHeight && ! isLastItem ? this.pageMaxHeight - 1 : this.pageMaxHeight ;
		var contentWidth = Element.computeContentWidth( def.content , def.contentHasMarkup ) ;
		var overflow = buttonPaddingWidth + contentWidth - this.outputWidth ;
		var currentHeight = 1 ;

		if ( overflow > 0 ) {
			if ( this.multiLineItems ) {
				def.buttonContent = Element.wordwrapContent( def.content , this.outputWidth - buttonPaddingWidth , def.contentHasMarkup ) ;
				contentWidth = this.outputWidth - buttonPaddingWidth ;
				currentHeight = def.buttonContent.length ;
			}
			else {
				def.buttonContent = Element.truncateContent( def.content , contentWidth - overflow - ellipsisWidth , def.contentHasMarkup ) + this.contentEllipsis ;
				contentWidth = Element.computeContentWidth( def.buttonContent , def.contentHasMarkup ) ;
			}
		}

		if ( this.pageMaxHeight && pageHeight && pageHeight + currentHeight > currentPageMaxHeight ) {
			page ++ ;
			pageHeight = 1 + currentHeight ;
		}
		else {
			pageHeight += currentHeight ;
		}

		def.width = buttonPaddingWidth + contentWidth ;
		def.page = page ;

		if ( def.width > this.buttonsMaxWidth ) { this.buttonsMaxWidth = def.width ; }

		if ( ! this.pageItemsDef[ page ] ) { this.pageItemsDef[ page ] = [] ; }
		this.pageItemsDef[ page ].push( def ) ;
	} ) ;

	this.maxPage = page ;

	var previousPageContentWidth = buttonPaddingWidth + Element.computeContentWidth( this.previousPageContent , this.previousPageContentHasMarkup ) ;
	var nextPageContentWidth = buttonPaddingWidth + Element.computeContentWidth( this.nextPageContent , this.nextPageContentHasMarkup ) ;

	this.pageItemsDef.forEach( ( pageDef , index ) => {
		if ( index ) {
			pageDef.unshift( {
				buttonContent: this.previousPageContent ,
				contentHasMarkup: this.previousPageContentHasMarkup ,
				width: previousPageContentWidth ,
				internalRole: 'previousPage'
			} ) ;
		}

		if ( index < this.pageItemsDef.length - 1 ) {
			pageDef.push( {
				buttonContent: this.nextPageContent ,
				contentHasMarkup: this.nextPageContentHasMarkup ,
				width: nextPageContentWidth ,
				internalRole: 'nextPage'
			} ) ;
		}
	} ) ;

	this.initPage() ;
} ;



ColumnMenu.prototype.initPage = function( page = this.page ) {
	var buttonOffsetX = 0 , buttonOffsetY = 0 ;

	if ( ! this.pageItemsDef[ page ] ) { return ; }

	this.buttons.forEach( button => button.destroy() ) ;
	this.buttons.length = 0 ;

	this.pageItemsDef[ page ].forEach( ( def , index ) => {
		if ( ! Array.isArray( def.buttonContent ) ) {
			def.buttonContent = [ def.buttonContent + ' '.repeat( this.buttonsMaxWidth - def.width ) ] ;
		}

		this.buttons[ index ] = new Button( {
			parent: this ,
			internalRole: def.internalRole ,
			content: def.buttonContent ,
			contentHasMarkup: def.contentHasMarkup ,
			disabled: def.disabled ,
			value: def.value ,
			outputX: this.outputX + buttonOffsetX ,
			outputY: this.outputY + buttonOffsetY ,

			blurAttr: def.blurAttr || this.buttonBlurAttr ,
			focusAttr: def.focusAttr || this.buttonFocusAttr ,
			disabledAttr: def.disabledAttr || this.buttonDisabledAttr ,
			submittedAttr: def.submittedAttr || this.buttonSubmittedAttr ,

			blurLeftPadding: this.blurLeftPadding ,
			blurRightPadding: this.blurRightPadding ,
			focusLeftPadding: this.focusLeftPadding ,
			focusRightPadding: this.focusRightPadding ,
			disabledLeftPadding: this.disabledLeftPadding ,
			disabledRightPadding: this.disabledRightPadding ,
			submittedLeftPadding: this.submittedLeftPadding ,
			submittedRightPadding: this.submittedRightPadding ,
			paddingHasMarkup: this.paddingHasMarkup ,

			keyBindings: this.keyBindings ,
			shortcuts: def.shortcuts ,

			noDraw: true
		} ) ;

		this.buttons[ index ].on( 'submit' , this.onButtonSubmit ) ;

		buttonOffsetY += this.buttons[ index ].outputHeight ;
	} ) ;

	if ( this.multiLineItems ) {
		// Set outputHeight to the correct value
		this.outputHeight = buttonOffsetY ;
	}
} ;



/*
ColumnMenu.prototype.preDrawSelf = function() {
	//this.outputDst.put( { x: this.outputX , y: this.outputY , attr: this.backgroundAttr } , ' '.repeat( this.outputWidth ) ) ;
} ;
*/

