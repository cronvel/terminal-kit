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
const Text = require( './Text.js' ) ;



function Button( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	if ( ! Array.isArray( options.content ) ) { options.content = [ options.content || '' ] ; }

	this.blurLeftPadding = options.blurLeftPadding ?? options.leftPadding ?? '' ;
	this.blurRightPadding = options.blurRightPadding ?? options.rightPadding ?? '' ;
	this.focusLeftPadding = options.focusLeftPadding ?? options.leftPadding ?? '' ;
	this.focusRightPadding = options.focusRightPadding ?? options.rightPadding ?? '' ;
	this.disabledLeftPadding = options.disabledLeftPadding ?? options.leftPadding ?? '' ;
	this.disabledRightPadding = options.disabledRightPadding ?? options.rightPadding ?? '' ;
	this.submittedLeftPadding = options.submittedLeftPadding ?? options.leftPadding ?? '' ;
	this.submittedRightPadding = options.submittedRightPadding ?? options.rightPadding ?? '' ;

	// Used by ToggleButton, it's easier to move the functionality here to compute size at only one place
	this.turnedOnBlurLeftPadding = options.turnedOnBlurLeftPadding ?? options.turnedOnLeftPadding ?? this.blurLeftPadding ;
	this.turnedOnBlurRightPadding = options.turnedOnBlurRightPadding ?? options.turnedOnRightPadding ?? this.blurRightPadding ;
	this.turnedOffBlurLeftPadding = options.turnedOffBlurLeftPadding ?? options.turnedOffLeftPadding ?? this.blurLeftPadding ;
	this.turnedOffBlurRightPadding = options.turnedOffBlurRightPadding ?? options.turnedOffRightPadding ?? this.blurRightPadding ;
	this.turnedOnFocusLeftPadding = options.turnedOnFocusLeftPadding ?? options.turnedOnLeftPadding ?? this.focusLeftPadding ;
	this.turnedOnFocusRightPadding = options.turnedOnFocusRightPadding ?? options.turnedOnRightPadding ?? this.focusRightPadding ;
	this.turnedOffFocusLeftPadding = options.turnedOffFocusLeftPadding ?? options.turnedOffLeftPadding ?? this.focusLeftPadding ;
	this.turnedOffFocusRightPadding = options.turnedOffFocusRightPadding ?? options.turnedOffRightPadding ?? this.focusRightPadding ;

	this.contentHasMarkup = !! options.contentHasMarkup ;	// Force this now, instead of Element behavior
	this.paddingHasMarkup = !! options.paddingHasMarkup ;

	// Set by .setContent()
	this.content =
		this.blurContent = this.focusContent =
		this.disabledContent = this.submittedContent =
		this.turnedOnBlurContent = this.turnedOffBlurContent =
		this.turnedOnFocusContent = this.turnedOffFocusContent = '' ;

	// We need to compute that now
	if ( this.setContent === Button.prototype.setContent ) {
		this.setContent( options , this.contentHasMarkup , true , true ) ;
	}

	// Used by menus, to assign nextPage/previousPage action
	this.internalRole = options.internalRole || null ;

	// Force delete on width/height, should be computed from content
	delete options.width ;
	delete options.height ;

	Text.call( this , options ) ;

	this.blurAttr = options.blurAttr || { bgColor: 'brightBlack' } ;
	this.focusAttr = options.focusAttr || { bgColor: 'blue' } ;
	this.disabledAttr = options.disabledAttr || { bgColor: 'black' , color: 'brightBlack' } ;
	this.submittedAttr = options.submittedAttr || { bgColor: 'brightBlue' } ;
	this.turnedOnBlurAttr = options.turnedOnBlurAttr || { bgColor: 'cyan' } ;
	this.turnedOnFocusAttr = options.turnedOnFocusAttr || { bgColor: 'brightCyan' , color: 'gray' , bold: true } ;
	this.turnedOffBlurAttr = options.turnedOffBlurAttr || { bgColor: 'gray' , dim: true } ;
	this.turnedOffFocusAttr = options.turnedOffFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } ;

	this.disabled = !! options.disabled ;
	this.submitted = !! options.submitted ;
	this.submitOnce = !! options.submitOnce ;

	this.attr = null ;
	this.leftPadding = null ;
	this.rightPadding = null ;
	this.updateStatus() ;

	this.onShortcut = this.onShortcut.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;
	this.onRightClick = this.onRightClick.bind( this ) ;
	this.onMiddleClick = this.onMiddleClick.bind( this ) ;
	this.onHover = this.onHover.bind( this ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }
	if ( options.actionKeyBindings ) { this.actionKeyBindings = options.actionKeyBindings ; }

	this.on( 'key' , this.onKey ) ;
	this.on( 'shortcut' , this.onShortcut ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.on( 'click' , this.onClick ) ;
	this.on( 'rightClick' , this.onRightClick ) ;
	this.on( 'middleClick' , this.onMiddleClick ) ;
	this.on( 'hover' , this.onHover ) ;

	if ( this.elementType === 'Button' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Button ;
Element.inherit( Button , Text ) ;



Button.prototype.needInput = true ;



Button.prototype.keyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	ALT_ENTER: 'submit'
} ;



Button.prototype.actionKeyBindings = {} ;



// Utility function
Button.prototype._toContentArray = function( content ) {
	return ! this.forceContentArray || Array.isArray( content ) ? content : [ content || '' ] ;
} ;



Button.prototype.setContent = function( content , hasMarkup , dontDraw = false , dontResize = false ) {
	this.contentHasMarkup = hasMarkup ;

	if ( ! content || typeof content !== 'object' || Array.isArray( content ) ) {
		this.content = this._toContentArray( content ) ;
		this.contentWidth = Element.computeContentWidth( this.content , this.contentHasMarkup ) ;

		this.blurContent = this.focusContent =
			this.disabledContent = this.submittedContent =
			this.turnedOnBlurContent = this.turnedOffBlurContent =
			this.turnedOnFocusContent = this.turnedOffFocusContent =
			this.content ;
	}
	else {
		if ( content.internal ) {
			// This is called from the constructor using the options argument
			this.content = this._toContentArray( content.content ) ;
			this.blurContent = this._toContentArray( content.blurContent ?? this.content ) ;
			this.focusContent = this._toContentArray( content.focusContent ?? this.content ) ;
			this.disabledContent = this._toContentArray( content.disabledContent ?? this.content ) ;
			this.submittedContent = this._toContentArray( content.submittedContent ?? this.content ) ;
			this.turnedOnBlurContent = this._toContentArray( content.turnedOnBlurContent ?? content.turnedOnContent ?? this.content ) ;
			this.turnedOffBlurContent = this._toContentArray( content.turnedOffBlurContent ?? content.turnedOffContent ?? this.content ) ;
			this.turnedOnFocusContent = this._toContentArray( content.turnedOnFocusContent ?? content.turnedOnContent ?? this.content ) ;
			this.turnedOffFocusContent = this._toContentArray( content.turnedOffFocusContent ?? content.turnedOffContent ?? this.content ) ;
		}
		else {
			// Regular call (user, normal case)
			this.content = this._toContentArray( content.default ) ;
			this.blurContent = this._toContentArray( content.blur ?? this.content ) ;
			this.focusContent = this._toContentArray( content.focus ?? this.content ) ;
			this.disabledContent = this._toContentArray( content.disabled ?? this.content ) ;
			this.submittedContent = this._toContentArray( content.submitted ?? this.content ) ;
			this.turnedOnBlurContent = this._toContentArray( content.turnedOnBlur ?? content.turnedOn ?? this.content ) ;
			this.turnedOffBlurContent = this._toContentArray( content.turnedOffBlur ?? content.turnedOff ?? this.content ) ;
			this.turnedOnFocusContent = this._toContentArray( content.turnedOnFocus ?? content.turnedOn ?? this.content ) ;
			this.turnedOffFocusContent = this._toContentArray( content.turnedOffFocus ?? content.turnedOff ?? this.content ) ;
		}

		this.computeContentWidth( content , this.contentHasMarkup ) ;
	}

	if ( ! dontResize && this.resizeOnContent ) { this.resizeOnContent() ; }
	if ( ! dontDraw ) { this.outerDraw() ; }
} ;



Button.prototype.computeContentWidth = function() {
	this.contentWidth = Math.max(
		Element.computeContentWidth( this.blurContent , this.contentHasMarkup ) ,
		Element.computeContentWidth( this.focusContent , this.contentHasMarkup ) ,
		Element.computeContentWidth( this.disabledContent , this.contentHasMarkup ) ,
		Element.computeContentWidth( this.submittedContent , this.contentHasMarkup ) ,
		Element.computeContentWidth( this.turnedOnFocusContent , this.contentHasMarkup ) ,
		Element.computeContentWidth( this.turnedOffFocusContent , this.contentHasMarkup ) ,
		Element.computeContentWidth( this.turnedOnBlurContent , this.contentHasMarkup ) ,
		Element.computeContentWidth( this.turnedOffBlurContent , this.contentHasMarkup )
	) ;

	return this.contentWidth ;
} ;



Button.prototype.computeRequiredWidth = function() {
	return (
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
		) + Math.max(
			Element.computeContentWidth( this.blurContent , this.contentHasMarkup ) ,
			Element.computeContentWidth( this.focusContent , this.contentHasMarkup ) ,
			Element.computeContentWidth( this.disabledContent , this.contentHasMarkup ) ,
			Element.computeContentWidth( this.submittedContent , this.contentHasMarkup ) ,
			Element.computeContentWidth( this.turnedOnFocusContent , this.contentHasMarkup ) ,
			Element.computeContentWidth( this.turnedOffFocusContent , this.contentHasMarkup ) ,
			Element.computeContentWidth( this.turnedOnBlurContent , this.contentHasMarkup ) ,
			Element.computeContentWidth( this.turnedOffBlurContent , this.contentHasMarkup )
		) || 1
	) ;
} ;



Button.prototype.drawSelfCursor = function() {
	// Move the cursor back to the first cell
	this.outputDst.moveTo( this.outputX , this.outputY ) ;
	this.outputDst.drawCursor() ;
} ;



// Blink effect, when the button is submitted
Button.prototype.blink = function( special = null , animationCountdown = 4 ) {
	if ( animationCountdown ) {
		if ( animationCountdown % 2 ) { this.attr = this.focusAttr ; }
		else { this.attr = this.blurAttr ; }

		this.draw() ;
		setTimeout( () => this.blink( special , animationCountdown - 1 ) , 80 ) ;
	}
	else {
		this.updateStatus() ;
		this.draw() ;
		this.emit( 'blinked' , this.value , special , this ) ;
	}
} ;



Button.prototype.onFocus = function( focus , type ) {
	this.updateStatus() ;
	this.draw() ;
} ;



Button.prototype.updateStatus = function() {
	if ( this.disabled ) {
		this.attr = this.disabledAttr ;
		this.content = this.disabledContent ;
		this.leftPadding = this.disabledLeftPadding ;
		this.rightPadding = this.disabledRightPadding ;
	}
	else if ( this.submitted ) {
		this.attr = this.submittedAttr ;
		this.content = this.submittedContent ;
		this.leftPadding = this.submittedLeftPadding ;
		this.rightPadding = this.submittedRightPadding ;
	}
	else if ( this.hasFocus ) {
		this.attr = this.focusAttr ;
		this.content = this.focusContent ;
		this.leftPadding = this.focusLeftPadding ;
		this.rightPadding = this.focusRightPadding ;
	}
	else {
		this.attr = this.blurAttr ;
		this.content = this.blurContent ;
		this.leftPadding = this.blurLeftPadding ;
		this.rightPadding = this.blurRightPadding ;
	}
} ;



Button.prototype.submit = function( special ) {
	if ( this.submitOnce ) { this.submitted = true ; }
	this.emit( 'submit' , this.value , special , this ) ;

	// Blink call .updateStatus()
	this.blink( special ) ;
} ;



Button.prototype.unsubmit = function() {
	this.submitted = false ;
	this.updateStatus() ;
} ;



Button.prototype.onHover = function( data ) {
	if ( this.disabled || this.submitted ) { return ; }
	this.document.giveFocusTo( this , 'hover' ) ;
} ;



Button.prototype.onClick = function( data ) {
	if ( this.disabled || this.submitted ) { return ; }
	this.document.giveFocusTo( this , 'select' ) ;
	this.submit( this.actionKeyBindings.click ) ;
} ;



Button.prototype.onRightClick = function( data ) {
	if ( this.disabled || this.submitted ) { return ; }
	this.document.giveFocusTo( this , 'select' ) ;
	this.submit( this.actionKeyBindings.rightClick ) ;
} ;



Button.prototype.onMiddleClick = function( data ) {
	if ( this.disabled || this.submitted ) { return ; }
	this.document.giveFocusTo( this , 'select' ) ;
	this.submit( this.actionKeyBindings.middleClick ) ;
} ;



Button.prototype.onShortcut = function() {
	if ( this.disabled || this.submitted ) { return ; }
	this.document.giveFocusTo( this , 'select' ) ;
	this.submit() ;
} ;



const userActions = Button.prototype.userActions ;

userActions.submit = function( key ) {
	if ( this.disabled || this.submitted ) { return ; }
	this.submit( this.actionKeyBindings[ key ] ) ;
} ;

