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
const ColumnMenuMulti = require( './ColumnMenuMulti.js' ) ;
const Button = require( './Button.js' ) ;



// Inherit from ColumnMenuMulti for common methods

function SelectListMulti( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	if ( ! options.master || typeof options.master !== 'object' ) {
		options.master = Object.assign( {} , this.defaultOptions.master ) ;
	}
	else {
		options.master = Object.assign( {} , this.defaultOptions.master , options.master ) ;
	}

	if ( options.content ) {
		options.master.content = options.content ;
	}

	if ( ! options.separator || typeof options.separator !== 'object' ) {
		options.separator = Object.assign( {} , this.defaultOptions.separator ) ;
	}
	else {
		options.separator = Object.assign( {} , this.defaultOptions.separator , options.separator ) ;
	}

	ColumnMenuMulti.call( this , options ) ;

	this.show = false ;
	this.zIndexRef = this.zIndex ;	// Back-up for zIndex

	this.initPage() ;
	this.toggle( this.show , options.noDraw ) ;

	this.onClickOut = this.onClickOut.bind( this ) ;

	this.on( 'clickOut' , this.onClickOut ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'SelectListMulti' && ! options.noDraw ) { this.draw() ; }
}

module.exports = SelectListMulti ;

SelectListMulti.prototype = Object.create( ColumnMenuMulti.prototype ) ;
SelectListMulti.prototype.constructor = SelectListMulti ;
SelectListMulti.prototype.elementType = 'SelectListMulti' ;



SelectListMulti.prototype.defaultOptions = {
	buttonBlurAttr: { bgColor: 'gray' , color: 'white' , bold: true } ,
	buttonFocusAttr: { bgColor: 'white' , color: 'black' , bold: true } ,
	buttonDisabledAttr: {
		bgColor: 'gray' , color: 'white' , bold: true , dim: true
	} ,
	buttonSubmittedAttr: { bgColor: 'gray' , color: 'brightWhite' , bold: true } ,
	turnedOnBlurAttr: { bgColor: 'cyan' } ,
	turnedOnFocusAttr: { bgColor: 'brightCyan' , bold: true } ,
	turnedOffBlurAttr: { bgColor: 'gray' , dim: true } ,
	turnedOffFocusAttr: { bgColor: 'white' , color: 'black' , bold: true } ,

	master: {
		content: 'select-list-multi' ,
		symbol: '▼' ,
		internalRole: 'toggle'
	} ,
	separator: {
		content: '-' ,
		contentRepeat: true ,
		internalRole: 'separator'
	}
} ;



SelectListMulti.prototype.destroy = function( isSubDestroy , noDraw = false ) {
	if ( this.destroyed ) { return ; }

	this.off( 'clickOut' , this.onClickOut ) ;

	ColumnMenuMulti.prototype.destroy.call( this , isSubDestroy , noDraw ) ;
} ;



SelectListMulti.prototype.toggle = function( show = null , noDraw = false ) {
	var i , iMax ;

	if ( show === null ) { this.show = ! this.show ; }
	else { this.show = !! show ; }

	for ( i = 1 , iMax = this.buttons.length ; i < iMax ; i ++ ) {
		this.buttons[ i ].hidden = ! this.show ;
	}

	// Adjust outputHeight, to avoid the list to be clickable when reduced
	this.outputHeight = this.show ? this.pageHeight : 1 ;

	if ( this.show ) { this.topZ() ; }
	else { this.restoreZ() ; }

	// Return now if noDraw is set, bypassing both drawing and focus
	if ( noDraw ) { return ; }

	this.document.giveFocusTo( this.buttons[ 0 ] ) ;

	this.redraw() ;
} ;



SelectListMulti.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	switch ( button.internalRole ) {
		case 'previousPage' :
			this.previousPage() ;
			break ;
		case 'nextPage' :
			this.nextPage() ;
			break ;
		case 'toggle' :
			this.toggle() ;

			// Submit when reducing
			if ( ! this.show ) {
				this.emit( 'submit' , this.value , action , this ) ;
			}
			break ;
		default :
			this.emit( 'submit' , this.value , action , this ) ;
	}
} ;



SelectListMulti.prototype.onClickOut = function() {
	if ( this.show ) {
		this.toggle( false ) ;
		// We also submit when the menu is closed on click out
		this.emit( 'submit' , this.value , undefined , this ) ;
	}
} ;

SelectListMulti.prototype.getValue = function() { return this.value ; } ;

