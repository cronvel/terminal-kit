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



/*
	This is a mix between ColumnMenu and ColumnMenuMulti: some items have states, some haven't.
	In fact it is closer from ColumnMenu in behavior: any click submit the button, not a key/value object.
	This is useful to improve the DropDownMenu, where it is common to have menu items states (turned on/off).
*/

const Element = require( './Element.js' ) ;
const ColumnMenu = require( './ColumnMenu.js' ) ;
const Button = require( './Button.js' ) ;
const ToggleButton = require( './ToggleButton.js' ) ;



// Inherit from ColumnMenu for common methods

function ColumnMenuMixed( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	// ColumnMenuMixed value is always a set of values
	if ( options.value && typeof options.value === 'object' ) {
		this.setValue( options.value , true ) ;
	}
	else {
		this.value = {} ;
	}

	ColumnMenu.call( this , options ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'ColumnMenuMixed' && ! options.noDraw ) { this.draw() ; }
}

module.exports = ColumnMenuMixed ;
Element.inherit( ColumnMenuMixed , ColumnMenu ) ;



ColumnMenuMixed.prototype.ButtonClass = null ;
ColumnMenuMixed.prototype.childUseParentKeyValue = true ;



ColumnMenuMixed.prototype.initChildren = function( noInitPage = false ) {
	ColumnMenu.prototype.initChildren.call( this ) ;

	// Only initPage if we are not a superclass of the object
	if ( this.elementType === 'ColumnMenuMixed' && ! noInitPage ) { this.initPage() ; }
} ;



// Set all existing children ToggleButton to the correct value
ColumnMenuMixed.prototype.setValue = function( value , noDraw ) {
	if ( ! value || typeof value !== 'object' ) { return ; }

	this.value = {} ;
	for ( let key in value ) { this.value[ key ] = !! value[ key ] ; }

	// Can be called during init, before .initPage() is called
	if ( ! this.buttons ) { return ; }

	this.buttons.forEach( button => {
		if ( button.internalRole || ! button.key || ! ( button instanceof ToggleButton ) ) { return ; }
		button.setValue( !! this.value[ button.key ] , true , true ) ;
	} ) ;

	if ( ! noDraw ) { this.draw() ; }
} ;



ColumnMenuMixed.prototype.setKeyValue = function( key , value , noDraw ) {
	if ( ! key ) { return ; }

	this.value[ key ] = !! value ;

	// Can be called during init, before .initPage() is called
	if ( ! this.buttons ) { return ; }

	this.buttons.forEach( button => {
		if ( button.internalRole || button.key !== key || ! ( button instanceof ToggleButton ) ) { return ; }
		button.setValue( !! value , true , true ) ;
	} ) ;

	if ( ! noDraw ) { this.draw() ; }
} ;



ColumnMenuMixed.prototype.onButtonToggle = function( buttonValue , action , button ) {
	if ( ! button.key ) { return ; }

	if ( buttonValue ) { this.value[ button.key ] = true ; }
	else { delete this.value[ button.key ] ; }

	this.emit( 'submit' , button.key , buttonValue , this , button ) ;
} ;

