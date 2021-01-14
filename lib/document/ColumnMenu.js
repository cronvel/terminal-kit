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
const BaseMenu = require( './BaseMenu.js' ) ;
const Button = require( './Button.js' ) ;
const ToggleButton = require( './ToggleButton.js' ) ;



// Inherit from BaseMenu for common methods

function ColumnMenu( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	this.onParentResize = this.onParentResize.bind( this ) ;

	// Overwritten by Element() when .autoWidth is set
	if ( ! options.outputWidth && ! options.width ) {
		if ( options.parent ) {
			options.outputWidth = Math.min( options.parent.inputWidth , options.parent.outputWidth ) ;
		}
		else if ( options.inlineTerm ) {
			options.outputWidth = options.inlineTerm.width ;
		}
	}

	this.buttonsMaxWidth = 0 ;
	this.buttonPaddingWidth = 0 ;
	this.buttonSymbolWidth = 0 ;

	this.pageHeight = 0 ;	// current page height, computed
	this.pageItemsDef = null ;
	//this.masterItem = options.masterItem || null ;

	if ( ! options.multiLineItems ) {
		options.height = options.items && options.items.length ;
	}

	BaseMenu.call( this , options ) ;

	this.maxHeight =
		this.autoHeight && this.outputDst ? Math.round( this.outputDst.height * this.autoHeight ) :
		options.maxHeight ? options.maxHeight :
		options.pageMaxHeight ? options.pageMaxHeight :	// for backward compatibility
		this.strictInline ? this.inlineTerm.height :
		Infinity ;

	this.on( 'parentResize' , this.onParentResize ) ;

	this.multiLineItems = !! options.multiLineItems ;

	this.initChildren() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'ColumnMenu' && ! options.noDraw ) { this.draw() ; }
}

module.exports = ColumnMenu ;

ColumnMenu.prototype = Object.create( BaseMenu.prototype ) ;
ColumnMenu.prototype.constructor = ColumnMenu ;
ColumnMenu.prototype.elementType = 'ColumnMenu' ;



ColumnMenu.prototype.inlineNewLine = true ;
ColumnMenu.prototype.ButtonClass = Button ;



ColumnMenu.prototype.defaultOptions = {
	buttonBlurAttr: { bgColor: 'black' , color: 'white' , bold: true } ,
	buttonEvenBlurAttr: null ,
	buttonFocusAttr: { bgColor: 'white' , color: 'black' , bold: true } ,
	buttonDisabledAttr: { bgColor: 'black' , color: 'gray' , bold: true } ,
	buttonSubmittedAttr: { bgColor: 'gray' , color: 'brightWhite' , bold: true } ,
	turnedOnBlurAttr: { bgColor: 'cyan' } ,
	turnedOnFocusAttr: { bgColor: 'brightCyan' , bold: true } ,
	turnedOffBlurAttr: { bgColor: 'gray' , dim: true } ,
	turnedOffFocusAttr: { bgColor: 'white' , color: 'black' , bold: true }
} ;



ColumnMenu.prototype.destroy = function( isSubDestroy , noDraw = false ) {
	if ( this.destroyed ) { return ; }

	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;
	this.off( 'parentResize' , this.onParentResize ) ;

	Element.prototype.destroy.call( this , isSubDestroy , noDraw ) ;
} ;



ColumnMenu.prototype.keyBindings = {
	UP: 'previous' ,
	DOWN: 'next' ,
	PAGE_UP: 'previousPage' ,
	PAGE_DOWN: 'nextPage' ,
	HOME: 'firstPage' ,
	END: 'lastPage' ,
	//	ENTER: 'submit' ,
	//	KP_ENTER: 'submit' ,
	ALT_ENTER: 'submit'
} ;

ColumnMenu.prototype.buttonKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit'
} ;

ColumnMenu.prototype.toggleButtonKeyBindings = {
	ENTER: 'toggle' ,
	KP_ENTER: 'toggle'
} ;



// Pre-compute page and eventually create Buttons automatically
ColumnMenu.prototype.initChildren = function() {
	// Do not exit now: maybe there are masterDef and separatorDef (SelectList*)
	//if ( ! this.itemsDef.length ) { return ; }

	// Reset things, because .initChildren() can be called multiple times on 'parentResize' events
	this.pageItemsDef = [] ;

	this.buttonPaddingWidth =
		Math.max(
			Element.computeContentWidth( this.blurLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.focusLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.disabledLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.submittedLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.turnedOnFocusLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.turnedOffFocusLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.turnedOnBlurLeftPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.turnedOffBlurLeftPadding , this.paddingHasMarkup )
		) + Math.max(
			Element.computeContentWidth( this.blurRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.focusRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.disabledRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.submittedRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.turnedOnFocusRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.turnedOffFocusRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.turnedOnBlurRightPadding , this.paddingHasMarkup ) ,
			Element.computeContentWidth( this.turnedOffBlurRightPadding , this.paddingHasMarkup )
		) ;

	if ( this.buttonPaddingWidth > this.outputWidth ) {
		// The padding itself is bigger than the width... so what should we do?
		return ;
	}

	var ellipsisWidth = Element.computeContentWidth( this.contentEllipsis , false ) ;


	this.previousPageDef = Object.assign( { content: '▲' , internalRole: 'previousPage' } , this.previousPageDef ) ;
	this.previousPageDef.contentHasMarkup = this.previousPageDef.contentHasMarkup || this.previousPageDef.markup ;
	this.previousPageDef.width = this.buttonPaddingWidth + Element.computeContentWidth( this.previousPageDef.content , this.previousPageDef.contentHasMarkup ) ;
	this.previousPageDef.buttonContent = this.previousPageDef.content ;

	this.nextPageDef = Object.assign( { content: '▼' , internalRole: 'nextPage' } , this.nextPageDef ) ;
	this.nextPageDef.contentHasMarkup = this.nextPageDef.contentHasMarkup || this.nextPageDef.markup ;
	this.nextPageDef.width = this.buttonPaddingWidth + Element.computeContentWidth( this.nextPageDef.content , this.nextPageDef.contentHasMarkup ) ;
	this.nextPageDef.buttonContent = this.nextPageDef.content ;

	if ( this.masterDef ) {
		this.masterDef = Object.assign( { content: 'column-menu' , internalRole: 'master' } , this.masterDef ) ;
		this.masterDef.contentHasMarkup = this.masterDef.contentHasMarkup || this.masterDef.markup ;

		this.masterDef.buttonContent = this.masterDef.content ;

		if ( this.masterDef.symbol ) {
			this.buttonSymbolWidth = 1 + Element.computeContentWidth( this.masterDef.symbol ) ;
			this.masterDef.buttonContent += ' ' + this.masterDef.symbol ;
		}

		this.masterDef.width = this.buttonPaddingWidth + Element.computeContentWidth( this.masterDef.buttonContent , this.masterDef.contentHasMarkup ) ;
	}

	this.buttonsMaxWidth = Math.max( this.buttonsMaxWidth , this.previousPageDef.width , this.nextPageDef.width , this.masterDef ? this.masterDef.width : 0 ) ;


	var page = 0 , pageHeight = 0 ;

	this.itemsDef.forEach( ( def , index ) => {
		def.contentHasMarkup = def.contentHasMarkup || def.markup ;
		def.buttonContent = def.content ;
		def.buttonBlurContent = def.blurContent ;
		def.buttonFocusContent = def.focusContent ;
		def.buttonDisabledContent = def.disabledContent ;
		def.buttonSubmittedContent = def.submittedContent ;
		def.buttonTurnedOnBlurContent = def.turnedOnBlurContent ;
		def.buttonTurnedOffBlurContent = def.turnedOffBlurContent ;
		def.buttonTurnedOnFocusContent = def.turnedOnFocusContent ;
		def.buttonTurnedOffFocusContent = def.turnedOffFocusContent ;

		// Computing all button content variant like suggested by issue #144 is really complicated,
		// All variant should come out with the same width and height.

		var contentWidth = Element.computeContentWidth( def.content , def.contentHasMarkup ) ,
			buttonHeight = 1 ,
			isLastItem = index === this.itemsDef.length - 1 ,
			// height without previous/next buttons:
			pageMaxInnerHeight = Math.max( 1 , ! isLastItem ? this.maxHeight - 1 : this.maxHeight ) ,
			overflow = this.buttonPaddingWidth + contentWidth - this.outputWidth ;

		if ( overflow > 0 ) {
			if ( this.multiLineItems ) {
				def.buttonContent = Element.wordWrapContent( def.content , this.outputWidth - this.buttonPaddingWidth , def.contentHasMarkup ) ;
				contentWidth = this.outputWidth - this.buttonPaddingWidth ;
				buttonHeight = def.buttonContent.length ;
			}
			else {
				def.buttonContent = Element.truncateContent( def.content , contentWidth - overflow - ellipsisWidth , def.contentHasMarkup ) + this.contentEllipsis ;
				contentWidth = Element.computeContentWidth( def.buttonContent , def.contentHasMarkup ) ;
			}
		}

		if ( index && pageHeight + buttonHeight > pageMaxInnerHeight ) {
			// ^--- check if there is content on this page, which is always true except for the very first item of page 0
			page ++ ;
			pageHeight = 1 ;

			// Still too big?
			if ( pageHeight + buttonHeight > pageMaxInnerHeight && buttonHeight > 1 ) {
				buttonHeight = pageMaxInnerHeight - pageHeight ;
				def.buttonContent.length = buttonHeight ;
				def.buttonContent[ buttonHeight - 1 ] =
					Element.truncateContent(
						def.buttonContent[ buttonHeight - 1 ].trimRight() ,
						contentWidth - ellipsisWidth ,
						def.contentHasMarkup
					)
					+ this.contentEllipsis ;
			}
		}

		pageHeight += buttonHeight ;

		def.width = this.buttonPaddingWidth + contentWidth ;
		def.page = page ;

		if ( def.width + this.buttonSymbolWidth > this.buttonsMaxWidth ) {
			this.buttonsMaxWidth = def.width + this.buttonSymbolWidth ;
		}

		if ( ! this.pageItemsDef[ page ] ) { this.pageItemsDef[ page ] = [] ; }
		this.pageItemsDef[ page ].push( def ) ;
	} ) ;

	this.maxPage = page ;

	if ( this.separatorDef ) {
		this.separatorDef = Object.assign( { content: '-' , disabled: true , internalRole: 'separator' } , this.separatorDef ) ;
		this.separatorDef.width = Element.computeContentWidth( this.separatorDef.content , this.separatorDef.contentHasMarkup ) ;

		if ( this.separatorDef.contentRepeat && this.separatorDef.width < this.buttonsMaxWidth - this.buttonPaddingWidth ) {
			this.separatorDef.content = this.separatorDef.content.repeat( Math.floor( ( this.buttonsMaxWidth - this.buttonPaddingWidth ) / this.separatorDef.width ) ) ;
			this.separatorDef.width = Element.computeContentWidth( this.separatorDef.content , this.separatorDef.contentHasMarkup ) ;
		}

		this.separatorDef.width += this.buttonPaddingWidth ;
		this.separatorDef.buttonContent = this.separatorDef.content ;
	}

	if ( this.masterDef && this.masterDef.width < this.buttonsMaxWidth ) {
		this.masterDef.buttonContent = this.masterDef.content + ' ' + ' '.repeat( this.buttonsMaxWidth - this.masterDef.width ) + this.masterDef.symbol ;
		this.masterDef.width = this.buttonsMaxWidth ;
	}


	// Force at least an empty page
	if ( ! this.pageItemsDef.length ) { this.pageItemsDef.push( [] ) ; }

	this.pageItemsDef.forEach( ( pageDef , index ) => {
		if ( index ) { pageDef.unshift( this.previousPageDef ) ; }
		if ( index < this.pageItemsDef.length - 1 ) { pageDef.push( this.nextPageDef ) ; }
		if ( this.separatorDef ) { pageDef.unshift( this.separatorDef ) ; }
		if ( this.masterDef ) { pageDef.unshift( this.masterDef ) ; }
	} ) ;

	// /!\ Adjust the output width? /!\
	if ( this.outputWidth > this.buttonsMaxWidth ) {
		this.outputWidth = this.buttonsMaxWidth ;
	}

	// Only initPage if we are not a superclass of the object
	if ( this.elementType === 'ColumnMenu' ) { this.initPage() ; }
} ;



ColumnMenu.prototype.initPage = function( page = this.page ) {
	var buttonOffsetX = 0 , buttonOffsetY = 0 ;

	if ( ! this.pageItemsDef[ page ] ) { return ; }

	this.buttons.forEach( button => button.destroy( false , true ) ) ;
	this.buttons.length = 0 ;

	this.pageItemsDef[ page ].forEach( ( def , index ) => {
		var ButtonConstructor , isToggle , key , value , blurAttr ;

		if ( ! Array.isArray( def.buttonContent ) ) {
			def.buttonContent = [ def.buttonContent + ' '.repeat( this.buttonsMaxWidth - def.width ) ] ;
		}

		ButtonConstructor = def.internalRole ? Button : this.ButtonClass ;
		isToggle = ButtonConstructor === ToggleButton || ButtonConstructor.prototype instanceof ToggleButton ;

		key = def.key ;		// For ToggleButton
		value = this.childUseParentKeyValue && key && this.value && typeof this.value === 'object' ? this.value[ key ] : def.value ;

		if ( index % 2 ) {
			// Odd
			blurAttr = def.blurAttr || this.buttonBlurAttr ;
		}
		else {
			// Even
			blurAttr = def.evenBlurAttr || def.blurAttr || this.buttonEvenBlurAttr || this.buttonBlurAttr ;
		}

		this.buttons[ index ] = new ButtonConstructor( {
			internal: true ,
			parent: this ,
			childId: index ,
			internalRole: def.internalRole ,
			contentHasMarkup: def.contentHasMarkup ,
			content: def.buttonContent ,
			blurContent: def.buttonBlurContent ,
			focusContent: def.buttonFocusContent ,
			disabledContent: def.buttonDisabledContent ,
			submittedContent: def.buttonSubmittedContent ,
			turnedOnBlurContent: def.buttonTurnedOnBlurContent ,
			turnedOffBlurContent: def.buttonTurnedOffBlurContent ,
			turnedOnFocusContent: def.buttonTurnedOnFocusContent ,
			turnedOffFocusContent: def.buttonTurnedOffFocusContent ,
			disabled: def.disabled ,
			def ,
			key ,
			value ,
			outputX: this.outputX + buttonOffsetX ,
			outputY: this.outputY + buttonOffsetY ,

			blurAttr ,
			focusAttr: def.focusAttr || this.buttonFocusAttr ,
			disabledAttr: def.disabledAttr || this.buttonDisabledAttr ,
			submittedAttr: def.submittedAttr || this.buttonSubmittedAttr ,
			turnedOnFocusAttr: def.turnedOnFocusAttr || this.turnedOnFocusAttr ,
			turnedOffFocusAttr: def.turnedOffFocusAttr || this.turnedOffFocusAttr ,
			turnedOnBlurAttr: def.turnedOnBlurAttr || this.turnedOnBlurAttr ,
			turnedOffBlurAttr: def.turnedOffBlurAttr || this.turnedOffBlurAttr ,

			blurLeftPadding: this.blurLeftPadding ,
			blurRightPadding: this.blurRightPadding ,
			focusLeftPadding: this.focusLeftPadding ,
			focusRightPadding: this.focusRightPadding ,
			disabledLeftPadding: this.disabledLeftPadding ,
			disabledRightPadding: this.disabledRightPadding ,
			submittedLeftPadding: this.submittedLeftPadding ,
			submittedRightPadding: this.submittedRightPadding ,

			turnedOnFocusLeftPadding: this.turnedOnFocusLeftPadding ,
			turnedOnFocusRightPadding: this.turnedOnFocusRightPadding ,
			turnedOffFocusLeftPadding: this.turnedOffFocusLeftPadding ,
			turnedOffFocusRightPadding: this.turnedOffFocusRightPadding ,
			turnedOnBlurLeftPadding: this.turnedOnBlurLeftPadding ,
			turnedOnBlurRightPadding: this.turnedOnBlurRightPadding ,
			turnedOffBlurLeftPadding: this.turnedOffBlurLeftPadding ,
			turnedOffBlurRightPadding: this.turnedOffBlurRightPadding ,

			paddingHasMarkup: this.paddingHasMarkup ,

			keyBindings: isToggle ? this.toggleButtonKeyBindings : this.buttonKeyBindings ,
			actionKeyBindings: isToggle ? this.toggleButtonActionKeyBindings : this.buttonActionKeyBindings ,
			shortcuts: def.shortcuts ,

			noDraw: true
		} ) ;

		this.buttons[ index ].on( 'submit' , this.onButtonSubmit ) ;
		this.buttons[ index ].on( 'focus' , this.onButtonFocus ) ;

		if ( isToggle ) {
			this.buttons[ index ].on( 'toggle' , this.onButtonToggle ) ;
		}

		buttonOffsetY += this.buttons[ index ].outputHeight ;
	} ) ;

	// Set outputHeight to the correct value
	if ( buttonOffsetY < this.outputHeight ) { this.needRedraw = true ; }
	this.pageHeight = this.outputHeight = buttonOffsetY ;
} ;



ColumnMenu.prototype.onParentResize = function() {
	if ( ! this.autoWidth && ! this.autoHeight ) { return ; }

	if ( this.autoWidth ) {
		this.outputWidth = Math.round( this.outputDst.width * this.autoWidth ) ;
	}

	if ( this.autoHeight ) {
		this.maxHeight = Math.round( this.outputDst.height * this.autoHeight ) ;
	}

	this.initChildren() ;
	this.page = 0 ;
	this.initPage() ;
	this.draw() ;
} ;

