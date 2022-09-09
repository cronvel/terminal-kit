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
const BaseMenu = require( './BaseMenu.js' ) ;
const Button = require( './Button.js' ) ;
const ToggleButton = require( './ToggleButton.js' ) ;

const misc = require( '../misc.js' ) ;
const string = require( 'string-kit' ) ;



// Inherit from BaseMenu for common methods

function RowMenu( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	if ( ! options.outputWidth && ! options.width ) {
		options.outputWidth = Math.min( options.parent.inputWidth , options.parent.outputWidth ) ;
	}

	this.buttonPaddingWidth = 0 ;
	this.buttonSymbolWidth = 0 ;
	this.pageItemsDef = [] ;

	BaseMenu.call( this , options ) ;

	this.justify = !! options.justify ;
	this.leftMargin = this.leftMargin ?? 0 ;	// useful for InlineMenu: it's the place where the prompt is put

	this.separator = options.separator || options.buttonSeparator || ' ' ;
	this.separatorHasMarkup = !! ( options.separatorHasMarkup || options.buttonSeparatorHasMarkup ) ;
	this.separatorAttr = Object.assign( {} , this.backgroundAttr , options.separatorAttr || options.buttonSeparatorAttr ) ;
	this.separatorWidth = 0 ;	// Computed later

	this.initChildren() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'RowMenu' && ! options.noDraw ) { this.draw() ; }
}

module.exports = RowMenu ;
Element.inherit( RowMenu , BaseMenu ) ;



RowMenu.prototype.inlineNewLine = true ;
RowMenu.prototype.ButtonClass = Button ;



RowMenu.prototype.defaultOptions = {
	buttonBlurAttr: { bgColor: 'white' , color: 'black' } ,
	buttonFocusAttr: { bgColor: 'green' , color: 'blue' , dim: true } ,
	buttonDisabledAttr: { bgColor: 'white' , color: 'brightBlack' } ,
	buttonSubmittedAttr: { bgColor: 'brightWhite' , color: 'brightBlack' }
} ;



RowMenu.prototype.keyBindings = {
	LEFT: 'previous' ,
	RIGHT: 'next' ,
	PAGE_UP: 'previousPage' ,
	PAGE_DOWN: 'nextPage' ,
	HOME: 'firstPage' ,
	END: 'lastPage' ,
	//ENTER: 'submit' ,
	//KP_ENTER: 'submit' ,
	ALT_ENTER: 'submit'
} ;



RowMenu.prototype.buttonKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit'
} ;



RowMenu.prototype.toggleButtonKeyBindings = {
	ENTER: 'toggle' ,
	KP_ENTER: 'toggle'
} ;



// Pre-compute page and eventually create Buttons automatically
RowMenu.prototype.initChildren = function( noInitPage = false ) {
	if ( ! this.itemsDef.length ) { return ; }

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

	if ( this.buttonPaddingWidth > this.outputWidth - this.leftMargin ) {
		// The padding itself is bigger than the width... so what should we do?
		return ;
	}

	var ellipsisWidth = Element.computeContentWidth( this.contentEllipsis , false ) ;
	this.separatorWidth = Element.computeContentWidth( this.separator , this.separatorHasMarkup ) ;


	this.previousPageDef = Object.assign( { content: '◀' , internalRole: 'previousPage' } , this.previousPageDef ) ;
	this.previousPageDef.contentHasMarkup = this.previousPageDef.contentHasMarkup || this.previousPageDef.markup ;
	this.previousPageDef.width = this.buttonPaddingWidth + Element.computeContentWidth( this.previousPageDef.content , this.previousPageDef.contentHasMarkup ) ;
	this.previousPageDef.buttonContent = this.previousPageDef.content ;

	this.nextPageDef = Object.assign( { content: '▶' , internalRole: 'nextPage' } , this.nextPageDef ) ;
	this.nextPageDef.contentHasMarkup = this.nextPageDef.contentHasMarkup || this.nextPageDef.markup ;
	this.nextPageDef.width = this.buttonPaddingWidth + Element.computeContentWidth( this.nextPageDef.content , this.nextPageDef.contentHasMarkup ) ;
	this.nextPageDef.buttonContent = this.nextPageDef.content ;


	var page = 0 , pageWidth = 0 , pageItemCount = 0 ;

	this.itemsDef.forEach( ( def , index ) => {
		def.buttonContent = def.content ;
		def.contentHasMarkup = def.contentHasMarkup || def.markup ;

		var contentWidth = Element.computeContentWidth( def.content , def.contentHasMarkup ) ,
			isLastItem = index === this.itemsDef.length - 1 ;

		def.width = contentWidth + this.buttonPaddingWidth + this.buttonSymbolWidth ;

		var overflow = pageWidth + def.width
			+ ( pageItemCount ? this.separatorWidth : 0 )
			+ ( isLastItem ? 0 : this.nextPageDef.width + this.separatorWidth )
			- this.outputWidth - this.leftMargin ;

		//console.error( "overflow",overflow,pageWidth,def.width,isLastItem,this.nextPageDef.width,this.separatorWidth,this.outputWidth,this.leftMargin);
		if ( overflow > 0 ) {
			if ( pageItemCount ) {
				page ++ ;
				pageItemCount = 0 ;
				pageWidth = this.previousPageDef.width + this.separatorWidth ;

				overflow = pageWidth + def.width
					+ ( isLastItem ? 0 : this.nextPageDef.width + this.separatorWidth )
					- this.outputWidth - this.leftMargin ;
			}

			if ( overflow > 0 ) {
				def.buttonContent = Element.truncateContent( def.content , contentWidth - overflow - ellipsisWidth , def.contentHasMarkup ) + this.contentEllipsis ;
				contentWidth = Element.computeContentWidth( def.buttonContent , def.contentHasMarkup ) ;
			}
		}

		def.page = page ;
		pageWidth += def.width + ( pageItemCount ? this.separatorWidth : 0 ) ;
		pageItemCount ++ ;

		if ( ! this.pageItemsDef[ page ] ) { this.pageItemsDef[ page ] = [] ; }
		this.pageItemsDef[ page ].push( def ) ;
	} ) ;

	this.maxPage = page ;

	// Force at least an empty page
	if ( ! this.pageItemsDef.length ) { this.pageItemsDef.push( [] ) ; }

	this.pageItemsDef.forEach( ( pageDef , index ) => {
		if ( index ) { pageDef.unshift( this.previousPageDef ) ; }
		if ( index < this.pageItemsDef.length - 1 ) { pageDef.push( this.nextPageDef ) ; }
		pageDef.buttonsWidth = pageDef.reduce( ( acc , def ) => acc + def.width , 0 ) ;
		pageDef.buttonsAndSeparatorsWidth = pageDef.buttonsWidth + ( pageDef.length - 1 ) * this.separatorWidth ;
		pageDef.justifyWidth = Math.max( 0 ,
			this.justify ? ( this.outputWidth - this.leftMargin - pageDef.buttonsAndSeparatorsWidth ) / ( pageDef.length - 1 )
			: 0
		) ;
		//console.error( '\n>>> ' , pageDef.buttonsWidth,pageDef.buttonsAndSeparatorsWidth,pageDef.justifyWidth) ;
	} ) ;

	// Only initPage if we are not a superclass of the object
	if ( this.elementType === 'RowMenu' && ! noInitPage ) { this.initPage() ; }
} ;



RowMenu.prototype.initPage = function( page = this.page ) {
	var pageDef = this.pageItemsDef[ page ] ,
		justifyWidthError = 0 ,
		buttonOffsetX = this.leftMargin ,
		buttonOffsetY = 0 ;

	if ( ! pageDef ) { return ; }

	this.buttons.forEach( button => button.destroy( false , true ) ) ;
	this.buttons.length = 0 ;
	this.hotkeyToButtonIndex.clear() ;

	//console.error( "pageDef.justifyWidth" , pageDef.justifyWidth ) ;

	pageDef.forEach( ( def , index ) => {
		var ButtonConstructor , isToggle , key , value , blurAttr ;

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
			content: def.buttonContent ,
			contentHasMarkup: def.contentHasMarkup ,
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
			turnedOnFocusAttr: def.turnedOnFocusAttr || this.buttonTurnedOnFocusAttr ,
			turnedOffFocusAttr: def.turnedOffFocusAttr || this.buttonTurnedOffFocusAttr ,
			turnedOnBlurAttr: def.turnedOnBlurAttr || this.buttonTurnedOnBlurAttr ,
			turnedOffBlurAttr: def.turnedOffBlurAttr || this.buttonTurnedOffBlurAttr ,

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
		this.buttons[ index ].on( 'blinked' , this.onButtonBlinked ) ;

		if ( def.hotkey ) {
			if ( Array.isArray( def.hotkey ) ) {
				def.hotkey.forEach( hotkey => this.hotkeyToButtonIndex.set( hotkey , index ) ) ;
			}
			else {
				this.hotkeyToButtonIndex.set( def.hotkey , index ) ;
			}
		}

		if ( isToggle ) {
			this.buttons[ index ].on( 'toggle' , this.onButtonToggle ) ;
		}

		var justifyWidthFloat = pageDef.justifyWidth + justifyWidthError ;
		var justifyWidth = Math.round( justifyWidthFloat ) ;
		justifyWidthError = justifyWidthFloat - justifyWidth ;

		buttonOffsetX += this.buttons[ index ].outputWidth + this.separatorWidth + justifyWidth ;
	} ) ;

	// Set outputWidth to the correct value
	//if ( buttonOffsetX < this.outputWidth ) { this.needOuterDraw = true ; }
	//this.pageWidth = buttonOffsetX ;
	//this.outputWidth = buttonOffsetY ;
} ;



RowMenu.prototype.preDrawSelf = function() {
	//console.error( string.format( "Call preDrawSelf(), page %i" , this.page ));
	this.outputDst.put( { x: this.outputX + this.leftMargin , y: this.outputY , attr: this.backgroundAttr } , ' '.repeat( this.outputWidth - this.leftMargin ) ) ;

	if ( this.separator ) {
		let index , button , nextButton ;
		for ( index = 0 ; index < this.buttons.length - 1 ; index ++ ) {
			button = this.buttons[ index ] ;
			nextButton = this.buttons[ index + 1 ] ;
			this.outputDst.put( {
				x: Math.round( button.outputX + button.outputWidth + nextButton.outputX ) / 2 ,
				y: this.outputY ,
				attr: this.separatorAttr
			} ,
			this.separator
			) ;
			//console.error( string.format( "Add one at %i" , button.outputX + button.outputWidth + Math.round( this.pageItemsDef[ this.page ].justifyWidth / 2 )));
		}
		//console.error( string.format( "%Y" , this.buttons[this.buttons.length-1].content ));
	}
} ;

