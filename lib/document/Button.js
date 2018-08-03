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
const Text = require( './Text.js' ) ;



function Button( options = {} ) {
	this.blurLeftPadding = options.blurLeftPadding || options.leftPadding || '' ;
	this.blurRightPadding = options.blurRightPadding || options.rightPadding || '' ;
	this.focusLeftPadding = options.focusLeftPadding || options.leftPadding || '' ;
	this.focusRightPadding = options.focusRightPadding || options.rightPadding || '' ;
	this.disabledLeftPadding = options.disabledLeftPadding || options.leftPadding || '' ;
	this.disabledRightPadding = options.disabledRightPadding || options.rightPadding || '' ;
	this.submittedLeftPadding = options.submittedLeftPadding || options.leftPadding || '' ;
	this.submittedRightPadding = options.submittedRightPadding || options.rightPadding || '' ;
	this.paddingHasMarkup = !! options.paddingHasMarkup ;

	if ( ! Array.isArray( options.content ) ) {
		options.content = [ options.content || '' ] ;
	}

	options.width =
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
		) +
		Element.computeContentWidth( options.content , options.contentHasMarkup ) || 1 ;

	options.height = options.content.length ;

	Text.call( this , options ) ;

	this.focusAttr = options.focusAttr || { bgColor: 'blue' } ;
	this.blurAttr = options.blurAttr || { bgColor: 'brightBlack' } ;
	this.disabledAttr = options.disabledAttr || { bgColor: 'black' , color: 'brightBlack' } ;
	this.submittedAttr = options.submittedAttr || { bgColor: 'brightBlue' } ;

	this.disabled = !! options.disabled ;
	this.submitted = !! options.submitted ;

	this.attr = null ;
	this.leftPadding = null ;
	this.rightPadding = null ;
	this.updateStatus() ;

	this.animationCountdown = 0 ;

	this.onKey = this.onKey.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;
	this.onHover = this.onHover.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	this.on( 'key' , this.onKey ) ;
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
	KP_ENTER: 'submit' ,
	ENTER: 'submit'
} ;



Button.prototype.destroy = function destroy( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;
	this.off( 'click' , this.onClick ) ;
	this.off( 'hover' , this.onHover ) ;

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



Button.prototype.drawSelfCursor = function drawSelfCursor() {
	// Move the cursor back to the first cell
	this.outputDst.moveTo( this.outputX , this.outputY ) ;
	this.outputDst.drawCursor() ;
} ;



// Blink effect, when the button is submitted
Button.prototype.blink = function blink() {
	if ( ! this.animationCountdown ) { this.animationCountdown = 4 ; }
	else { this.animationCountdown -- ; }

	if ( this.animationCountdown ) {
		if ( this.animationCountdown % 2 ) { this.attr = this.focusAttr ; }
		else { this.attr = this.blurAttr ; }

		this.draw() ;

		setTimeout( this.blink.bind( this ) , 80 ) ;
	}
	else {
		this.updateStatus() ;
		this.draw() ;
	}
} ;



Button.prototype.onFocus = function onFocus( focus , type ) {
	this.hasFocus = focus ;
	this.updateStatus() ;
	this.draw() ;
} ;



Button.prototype.updateStatus = function updateStatus() {
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



Button.prototype.onKey = function onKey( key , trash , data ) {
	switch( this.keyBindings[ key ] ) {
		case 'submit' :
			if ( this.disabled || this.submitted ) { break ; }
			this.emit( 'submit' , this.value , undefined , this ) ;
			this.blink() ;
			break ;
		default :
			return ;	// Bubble up
	}

	return true ;	// Do not bubble up
} ;



Button.prototype.onHover = function onHover( data ) {
	if ( this.disabled || this.submitted ) { return ; }
	this.document.giveFocusTo( this , 'hover' ) ;
} ;



Button.prototype.onClick = function onClick( data ) {
	if ( this.disabled || this.submitted ) { return ; }
	this.document.giveFocusTo( this , 'select' ) ;
	this.emit( 'submit' , this.value , undefined , this ) ;
	this.blink() ;
} ;

