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
const Text = require( './Text.js' ) ;
const Button = require( './Button.js' ) ;



function ToggleButton( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	// Almost everything is constructed by the normal 'submit-button'
	Button.call( this , options ) ;

	this.value = !! options.value ;
	this.key = options.key || null ;

	if ( this.elementType === 'ToggleButton' && ! options.noDraw ) { this.draw() ; }
}

module.exports = ToggleButton ;

ToggleButton.prototype = Object.create( Button.prototype ) ;
ToggleButton.prototype.constructor = ToggleButton ;
ToggleButton.prototype.elementType = 'ToggleButton' ;



ToggleButton.prototype.keyBindings = {
	ENTER: 'toggle' ,
	KP_ENTER: 'toggle' ,
	ALT_ENTER: 'submit'
} ;



// No blink effect
ToggleButton.prototype.blink = function() {} ;



ToggleButton.prototype.setValue = function( value , noDraw ) {
	value = !! value ;
	if ( this.value === value ) { return ; }
	this.value = value ;
	this.updateStatus() ;
	this.emit( 'toggle' , this.value , undefined , this ) ;
	this.emit( this.value ? 'turnOn' : 'turnOff' , this.value , undefined , this ) ;
	if ( ! noDraw ) { this.draw() ; }
} ;



ToggleButton.prototype.toggle = function( noDraw ) {
	this.setValue( ! this.value , noDraw ) ;
} ;



ToggleButton.prototype.updateStatus = function() {
	if ( this.disabled ) {
		this.attr = this.disabledAttr ;
		this.leftPadding = this.disabledLeftPadding ;
		this.rightPadding = this.disabledRightPadding ;
	}
	else if ( this.hasFocus ) {
		if ( this.value ) {
			this.attr = this.turnedOnFocusAttr ;
			this.leftPadding = this.turnedOnFocusLeftPadding ;
			this.rightPadding = this.turnedOnFocusRightPadding ;
		}
		else {
			this.attr = this.turnedOffFocusAttr ;
			this.leftPadding = this.turnedOffFocusLeftPadding ;
			this.rightPadding = this.turnedOffFocusRightPadding ;
		}
	}
	else if ( this.value ) {
		this.attr = this.turnedOnBlurAttr ;
		this.leftPadding = this.turnedOnBlurLeftPadding ;
		this.rightPadding = this.turnedOnBlurRightPadding ;
	}
	else {
		this.attr = this.turnedOffBlurAttr ;
		this.leftPadding = this.turnedOffBlurLeftPadding ;
		this.rightPadding = this.turnedOffBlurRightPadding ;
	}
} ;



ToggleButton.prototype.onKey = function( key , altKeys , data ) {
	switch( this.keyBindings[ key ] ) {
		case 'toggle' :
			if ( this.disabled ) { break ; }
			this.toggle() ;
			break ;
		case 'submit' :
			if ( this.disabled ) { break ; }
			this.emit( 'submit' , this.key ? { [ this.key ]: this.value } : this.value , this.actionKeyBindings[ key ] , this ) ;
			break ;
		default :
			return ;	// Bubble up
	}

	return true ;	// Do not bubble up
} ;



ToggleButton.prototype.onHover = function( data ) {
	if ( this.disabled ) { return ; }
	this.document.giveFocusTo( this , 'hover' ) ;
} ;



ToggleButton.prototype.onClick = function( data ) {
	if ( this.disabled ) { return ; }
	this.document.giveFocusTo( this , 'select' ) ;
	this.toggle() ;
} ;



ToggleButton.prototype.onShortcut = function() {
	if ( this.disabled ) { return ; }
	this.document.giveFocusTo( this , 'select' ) ;
	this.toggle() ;
} ;

