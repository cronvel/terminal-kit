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



const Element = require( './Element.js' ) ;
const Text = require( './Text.js' ) ;



function Button( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	this.blurLeftPadding = options.blurLeftPadding || options.leftPadding || '' ;
	this.blurRightPadding = options.blurRightPadding || options.rightPadding || '' ;
	this.focusLeftPadding = options.focusLeftPadding || options.leftPadding || '' ;
	this.focusRightPadding = options.focusRightPadding || options.rightPadding || '' ;
	this.disabledLeftPadding = options.disabledLeftPadding || options.leftPadding || '' ;
	this.disabledRightPadding = options.disabledRightPadding || options.rightPadding || '' ;
	this.submittedLeftPadding = options.submittedLeftPadding || options.leftPadding || '' ;
	this.submittedRightPadding = options.submittedRightPadding || options.rightPadding || '' ;

	// Used by ToggleButton, it's easier to move the functionality here to compute size at only one place
	this.turnedOnFocusLeftPadding = options.turnedOnFocusLeftPadding || options.turnedOnLeftPadding || options.leftPadding || '' ;
	this.turnedOnFocusRightPadding = options.turnedOnFocusRightPadding || options.turnedOnRightPadding || options.rightPadding || '' ;
	this.turnedOffFocusLeftPadding = options.turnedOffFocusLeftPadding || options.turnedOffLeftPadding || options.leftPadding || '' ;
	this.turnedOffFocusRightPadding = options.turnedOffFocusRightPadding || options.turnedOffRightPadding || options.rightPadding || '' ;
	this.turnedOnBlurLeftPadding = options.turnedOnBlurLeftPadding || options.turnedOnLeftPadding || options.leftPadding || '' ;
	this.turnedOnBlurRightPadding = options.turnedOnBlurRightPadding || options.turnedOnRightPadding || options.rightPadding || '' ;
	this.turnedOffBlurLeftPadding = options.turnedOffBlurLeftPadding || options.turnedOffLeftPadding || options.leftPadding || '' ;
	this.turnedOffBlurRightPadding = options.turnedOffBlurRightPadding || options.turnedOffRightPadding || options.rightPadding || '' ;

	this.paddingHasMarkup = !! options.paddingHasMarkup ;

	// Used by menus, to assign nextPage/previousPage action
	this.internalRole = options.internalRole || null ;

	if ( ! Array.isArray( options.content ) ) {
		options.content = [ options.content || '' ] ;
	}

	options.width =
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
		) +
		Element.computeContentWidth( options.content , options.contentHasMarkup ) || 1 ;

	options.height = options.content.length ;

	Text.call( this , options ) ;

	this.blurAttr = options.blurAttr || { bgColor: 'brightBlack' } ;
	this.focusAttr = options.focusAttr || { bgColor: 'blue' } ;
	this.disabledAttr = options.disabledAttr || { bgColor: 'black' , color: 'brightBlack' } ;
	this.submittedAttr = options.submittedAttr || { bgColor: 'brightBlue' } ;
	this.turnedOnBlurAttr = options.turnedOnBlurAttr || { bgColor: 'cyan' } ;
	this.turnedOnFocusAttr = options.turnedOnFocusAttr || { bgColor: 'brightCyan' , bold: true } ;
	this.turnedOffBlurAttr = options.turnedOffBlurAttr || { bgColor: 'gray' , dim: true } ;
	this.turnedOffFocusAttr = options.turnedOffFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } ;

	this.disabled = !! options.disabled ;
	this.submitted = !! options.submitted ;

	this.attr = null ;
	this.leftPadding = null ;
	this.rightPadding = null ;
	this.updateStatus() ;

	this.onKey = this.onKey.bind( this ) ;
	this.onShortcut = this.onShortcut.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;
	this.onHover = this.onHover.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }
	if ( options.actionKeyBindings ) { this.actionKeyBindings = options.actionKeyBindings ; }

	this.on( 'key' , this.onKey ) ;
	this.on( 'shortcut' , this.onShortcut ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.on( 'click' , this.onClick ) ;
	this.on( 'hover' , this.onHover ) ;

	if ( this.elementType === 'Button' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Button ;

Button.prototype = Object.create( Text.prototype ) ;
Button.prototype.constructor = Button ;
Button.prototype.elementType = 'Button' ;



Button.prototype.keyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	ALT_ENTER: 'submit'
} ;



Button.prototype.actionKeyBindings = {} ;



Button.prototype.destroy = function( isSubDestroy , noDraw ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'shortcut' , this.onShortcut ) ;
	this.off( 'focus' , this.onFocus ) ;
	this.off( 'click' , this.onClick ) ;
	this.off( 'hover' , this.onHover ) ;

	Element.prototype.destroy.call( this , isSubDestroy , noDraw ) ;
} ;



Button.prototype.drawSelfCursor = function() {
	// Move the cursor back to the first cell
	this.outputDst.moveTo( this.outputX , this.outputY ) ;
	this.outputDst.drawCursor() ;
} ;



// Blink effect, when the button is submitted
Button.prototype.blink = function( animationCountdown = 4 ) {
	if ( animationCountdown ) {
		if ( animationCountdown % 2 ) { this.attr = this.focusAttr ; }
		else { this.attr = this.blurAttr ; }

		this.draw() ;
		setTimeout( () => this.blink( animationCountdown - 1 ) , 80 ) ;
	}
	else {
		this.updateStatus() ;
		this.draw() ;
	}
} ;



Button.prototype.onFocus = function( focus , type ) {
	this.hasFocus = focus ;
	this.updateStatus() ;
	this.draw() ;
} ;



Button.prototype.updateStatus = function() {
	if ( this.disabled ) {
		this.attr = this.disabledAttr ;
		this.leftPadding = this.disabledLeftPadding ;
		this.rightPadding = this.disabledRightPadding ;
	}
	else if ( this.submitted ) {
		this.attr = this.submittedAttr ;
		this.leftPadding = this.submittedLeftPadding ;
		this.rightPadding = this.submittedRightPadding ;
	}
	else if ( this.hasFocus ) {
		this.attr = this.focusAttr ;
		this.leftPadding = this.focusLeftPadding ;
		this.rightPadding = this.focusRightPadding ;
	}
	else {
		this.attr = this.blurAttr ;
		this.leftPadding = this.blurLeftPadding ;
		this.rightPadding = this.blurRightPadding ;
	}
} ;



Button.prototype.onKey = function( key , altKeys , data ) {
	switch( this.keyBindings[ key ] ) {
		case 'submit' :
			if ( this.disabled || this.submitted ) { break ; }
			this.emit( 'submit' , this.value , this.actionKeyBindings[ key ] , this ) ;
			this.blink() ;
			break ;
		default :
			return ;	// Bubble up
	}

	return true ;	// Do not bubble up
} ;



Button.prototype.onHover = function( data ) {
	if ( this.disabled || this.submitted ) { return ; }
	this.document.giveFocusTo( this , 'hover' ) ;
} ;



Button.prototype.onClick = function( data ) {
	if ( this.disabled || this.submitted ) { return ; }
	this.document.giveFocusTo( this , 'select' ) ;
	this.emit( 'submit' , this.value , undefined , this ) ;
	this.blink() ;
} ;



Button.prototype.onShortcut = function() {
	if ( this.disabled || this.submitted ) { return ; }
	this.document.giveFocusTo( this , 'select' ) ;
	this.emit( 'submit' , this.value , undefined , this ) ;
	this.blink() ;
} ;

