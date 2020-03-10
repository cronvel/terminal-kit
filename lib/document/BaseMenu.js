/*
	Terminal Kit

	Copyright (c) 2009 - 2020 Cédric Ronvel

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



/* Base class for menus (ColumnMenu, RowMenu, etc) */



const Element = require( './Element.js' ) ;
const Button = require( './Button.js' ) ;



function BaseMenu( options = {} ) {
	Element.call( this , options ) ;

	this.backgroundAttr = options.backgroundAttr || { bgColor: 'white' , color: 'black' } ;
	this.contentEllipsis = options.contentEllipsis || '…' ;
	this.previousPageContent = options.previousPageContent || '«' ;
	this.previousPageContentHasMarkup = !! options.previousPageContentHasMarkup ;
	this.nextPageContent = options.nextPageContent || '»' ;
	this.nextPageContentHasMarkup = !! options.nextPageContentHasMarkup ;
	this.itemsDef = options.items || [] ;
	this.previousPageDef = options.previousPage ;
	this.nextPageDef = options.nextPage ;
	this.masterDef = options.master ;
	this.separatorDef = options.separator ;
	this.buttons = [] ;
	this.focusChild = null ;

	// Pagination
	this.page = 0 ;
	this.maxPage = 0 ;

	this.onButtonSubmit = this.onButtonSubmit.bind( this ) ;
	this.onButtonToggle = this.onButtonToggle.bind( this ) ;
	this.onKey = this.onKey.bind( this ) ;
	this.onWheel = this.onWheel.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;

	// Global default attributes
	this.buttonBlurAttr = options.buttonBlurAttr || this.defaultOptions.buttonBlurAttr || { bgColor: 'black' , color: 'white' , bold: true } ;
	this.buttonEvenBlurAttr = options.buttonEvenBlurAttr || null ;
	this.buttonFocusAttr = options.buttonFocusAttr || this.defaultOptions.buttonFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } ;
	this.buttonDisabledAttr = options.buttonDisabledAttr || this.defaultOptions.buttonDisabledAttr || { bgColor: 'black' , color: 'brightBlack' , bold: true } ;
	this.buttonSubmittedAttr = options.buttonSubmittedAttr || this.defaultOptions.buttonSubmittedAttr || { bgColor: 'brightBlack' , color: 'brightWhite' , bold: true } ;
	this.turnedOnBlurAttr = options.turnedOnBlurAttr || this.defaultOptions.turnedOnBlurAttr || { bgColor: 'cyan' } ;
	this.turnedOnFocusAttr = options.turnedOnFocusAttr || this.defaultOptions.turnedOnFocusAttr || { bgColor: 'brightCyan' , bold: true } ;
	this.turnedOffBlurAttr = options.turnedOffBlurAttr || this.defaultOptions.turnedOffBlurAttr || { bgColor: 'gray' , dim: true } ;
	this.turnedOffFocusAttr = options.turnedOffFocusAttr || this.defaultOptions.turnedOffFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } ;

	// Padding
	this.blurLeftPadding = options.blurLeftPadding || options.leftPadding || '' ;
	this.blurRightPadding = options.blurRightPadding || options.rightPadding || '' ;
	this.focusLeftPadding = options.focusLeftPadding || options.leftPadding || '' ;
	this.focusRightPadding = options.focusRightPadding || options.rightPadding || '' ;
	this.disabledLeftPadding = options.disabledLeftPadding || options.leftPadding || '' ;
	this.disabledRightPadding = options.disabledRightPadding || options.rightPadding || '' ;
	this.submittedLeftPadding = options.submittedLeftPadding || options.leftPadding || '' ;
	this.submittedRightPadding = options.submittedRightPadding || options.rightPadding || '' ;
	this.turnedOnFocusLeftPadding = options.turnedOnFocusLeftPadding || options.turnedOnLeftPadding || options.leftPadding || '' ;
	this.turnedOnFocusRightPadding = options.turnedOnFocusRightPadding || options.turnedOnRightPadding || options.rightPadding || '' ;
	this.turnedOffFocusLeftPadding = options.turnedOffFocusLeftPadding || options.turnedOffLeftPadding || options.leftPadding || '' ;
	this.turnedOffFocusRightPadding = options.turnedOffFocusRightPadding || options.turnedOffRightPadding || options.rightPadding || '' ;
	this.turnedOnBlurLeftPadding = options.turnedOnBlurLeftPadding || options.turnedOnLeftPadding || options.leftPadding || '' ;
	this.turnedOnBlurRightPadding = options.turnedOnBlurRightPadding || options.turnedOnRightPadding || options.rightPadding || '' ;
	this.turnedOffBlurLeftPadding = options.turnedOffBlurLeftPadding || options.turnedOffLeftPadding || options.leftPadding || '' ;
	this.turnedOffBlurRightPadding = options.turnedOffBlurRightPadding || options.turnedOffRightPadding || options.rightPadding || '' ;
	this.paddingHasMarkup = !! options.paddingHasMarkup ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }
	if ( options.buttonKeyBindings ) { this.buttonKeyBindings = options.buttonKeyBindings ; }
	if ( options.buttonActionKeyBindings ) { this.buttonActionKeyBindings = options.buttonActionKeyBindings ; }
	if ( options.toggleButtonKeyBindings ) { this.toggleButtonKeyBindings = options.toggleButtonKeyBindings ; }
	if ( options.toggleButtonActionKeyBindings ) { this.toggleButtonActionKeyBindings = options.toggleButtonActionKeyBindings ; }

	this.on( 'key' , this.onKey ) ;
	this.on( 'wheel' , this.onWheel ) ;
	this.on( 'focus' , this.onFocus ) ;
}

module.exports = BaseMenu ;

BaseMenu.prototype = Object.create( Element.prototype ) ;
BaseMenu.prototype.constructor = BaseMenu ;
BaseMenu.prototype.elementType = 'BaseMenu' ;



BaseMenu.prototype.destroy = function( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'wheel' , this.onWheel ) ;
	this.off( 'focus' , this.onFocus ) ;

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



BaseMenu.prototype.previousPage = function( focusType ) {
	var focusAware ;

	if ( this.maxPage && this.page > 0 ) {
		this.page -- ;
		this.initPage() ;
		this.focusChild = this.children[ this.children.length - 2 ] ;
		focusAware = this.document.giveFocusTo_( this.focusChild , focusType ) ;
		if ( ! focusAware ) { this.document.focusPrevious() ; }
		this.draw() ;
	}
} ;



BaseMenu.prototype.nextPage = function( focusType ) {
	var focusAware ;

	if ( this.maxPage && this.page < this.maxPage ) {
		this.page ++ ;
		this.initPage() ;
		this.focusChild = this.children[ 1 ] ;
		focusAware = this.document.giveFocusTo_( this.focusChild , focusType ) ;
		if ( ! focusAware ) { this.document.focusNext() ; }
		this.draw() ;
	}
} ;



BaseMenu.prototype.toPage = function( page , focusType ) {
	var focusAware ;

	if ( this.maxPage && page !== this.page ) {
		this.page = page ;
		this.initPage() ;
		this.focusChild = this.children[ 1 ] ;
		focusAware = this.document.giveFocusTo_( this.focusChild , focusType ) ;
		if ( ! focusAware ) { this.document.focusNext() ; }
		this.draw() ;
	}
} ;



BaseMenu.prototype.focusValue = function( value , focusType ) {
	var focusAware , itemDef , item ;

	itemDef = this.itemsDef.find( it => ! it.disabled && it.value === value ) ;
	if ( ! itemDef ) { return ; }

	if ( this.page !== itemDef.page ) {
		this.page = itemDef.page ;
		this.initPage() ;
	}

	item = this.buttons.find( it => it.def === itemDef ) ;
	if ( ! item ) { return ; }	// Not possible, but well...

	this.focusChild = item ;

	focusAware = this.document.giveFocusTo_( this.focusChild , focusType ) ;
	if ( ! focusAware ) { this.document.focusNext() ; }

	this.draw() ;
} ;



BaseMenu.prototype.onKey = function( key , trash , data ) {
	switch( this.keyBindings[ key ] ) {
		case 'previous' :
			this.focusChild = this.focusPreviousChild( ! this.maxPage ) ;
			if ( this.focusChild === this.children[ 0 ] && this.maxPage && this.page > 0 ) {
				this.previousPage( 'cycle' ) ;
			}
			break ;
		case 'next' :
			this.focusChild = this.focusNextChild( ! this.maxPage ) ;
			if ( this.focusChild === this.children[ this.children.length - 1 ] && this.maxPage && this.page < this.maxPage ) {
				this.nextPage( 'cycle' ) ;
			}
			break ;
		case 'previousPage' :
			if ( this.maxPage && this.page > 0 ) {
				this.previousPage( 'cycle' ) ;
			}
			break ;
		case 'nextPage' :
			if ( this.maxPage && this.page < this.maxPage ) {
				this.nextPage( 'cycle' ) ;
			}
			break ;
		case 'firstPage' :
			if ( this.maxPage && this.page !== 0 ) {
				this.toPage( 0 , 'cycle' ) ;
			}
			break ;
		case 'lastPage' :
			if ( this.maxPage && this.page !== this.maxPage ) {
				this.toPage( this.maxPage , 'cycle' ) ;
			}
			break ;
		default :
			return ;	// Bubble up
	}

	return true ;	// Do not bubble up
} ;



BaseMenu.prototype.onWheel = function( data ) {
	if ( data.yDirection < 0 ) { this.previousPage( 'cycle' ) ; }
	else if ( data.yDirection > 0 ) { this.nextPage( 'cycle' ) ; }
} ;



BaseMenu.prototype.onFocus = function( focus , type ) {
	if ( type === 'cycle' ) { return ; }

	if ( focus ) {
		if ( this.focusChild ) { this.document.giveFocusTo( this.focusChild , 'delegate' ) ; }
		else { this.focusChild = this.focusNextChild() ; }
	}
} ;



BaseMenu.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	switch ( button.internalRole ) {
		case 'previousPage' :
			this.previousPage() ;
			break ;
		case 'nextPage' :
			this.nextPage() ;
			break ;
		default :
			this.emit( 'submit' , buttonValue , action , this ) ;
	}
} ;



// Should be redefined in the derivative class
BaseMenu.prototype.defaultOptions = {} ;
BaseMenu.prototype.keyBindings = {} ;
BaseMenu.prototype.buttonKeyBindings = {} ;
BaseMenu.prototype.buttonActionKeyBindings = {} ;
BaseMenu.prototype.toggleButtonKeyBindings = {} ;
BaseMenu.prototype.toggleButtonActionKeyBindings = {} ;
BaseMenu.prototype.initPage = function() {} ;
BaseMenu.prototype.onButtonToggle = function() {} ;
BaseMenu.prototype.childUseParentKeyValue = false ;

