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
const ColumnMenu = require( './ColumnMenu.js' ) ;
const Button = require( './Button.js' ) ;



// Inherit from ColumnMenu for common methods

const defaultMaster = {
	content: 'select-list' ,
	symbol: '▼' ,
	internalRole: 'toggle'
} ;

const defaultSeparator = {
	content: '-' ,
	contentRepeat: true ,
	internalRole: 'separator'
} ;



function SelectList( options = {} ) {
	if ( ! options.master || typeof options.master !== 'object' ) {
		options.master = Object.assign( {} , defaultMaster ) ;
	}
	else {
		options.master = Object.assign( {} , defaultMaster , options.master ) ;
	}

	if ( ! options.separator || typeof options.separator !== 'object' ) {
		options.separator = Object.assign( {} , defaultSeparator ) ;
	}
	else {
		options.separator = Object.assign( {} , defaultSeparator , options.separator ) ;
	}

	ColumnMenu.call( this , options ) ;

	this.show = false ;
	this.toggle( this.show , options.noDraw ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'SelectList' && ! options.noDraw ) { this.draw() ; }
}

module.exports = SelectList ;

SelectList.prototype = Object.create( ColumnMenu.prototype ) ;
SelectList.prototype.constructor = SelectList ;
SelectList.prototype.elementType = 'SelectList' ;



SelectList.prototype.toggle = function( show = null , noDraw = false ) {
	var i , iMax ;

	if ( show === null ) { this.show = ! this.show ; }
	else { this.show = !! show ; }

	for ( i = 1 , iMax = this.buttons.length ; i < iMax ; i ++ ) {
		this.buttons[ i ].hidden = ! this.show ;
	}

	// Return now if noDraw is set, bypassing both drawing and focus
	if ( noDraw ) { return ; }

	if ( show ) {
		for ( i = 1 , iMax = this.buttons.length ; i < iMax ; i ++ ) {
			if ( this.buttons[ i ].value === this.value ) {
				this.document.giveFocusTo( this.buttons[ i ] ) ;
				break ;
			}
		}
	}
	else {
		this.document.giveFocusTo( this.buttons[ 0 ] ) ;
	}

	this.redraw() ;
} ;



SelectList.prototype.select = function( button ) {
	var width ,
		buttonDef = this.pageItemsDef[ this.page ][ button.childId ] ;

	if ( buttonDef ) {
		width = Element.computeContentWidth( buttonDef.content , buttonDef.contentHasMarkup ) + this.buttonPaddingWidth + this.buttonSymbolWidth ;

		if ( width < this.buttonsMaxWidth ) {
			this.masterDef.buttonContent = buttonDef.content + ' ' + ' '.repeat( this.buttonsMaxWidth - width ) + this.masterDef.symbol ;
		}
		else {
			this.masterDef.buttonContent = buttonDef.content + ' ' + this.masterDef.symbol ;
		}

		this.masterDef.contentHasMarkup = buttonDef.contentHasMarkup ;
		this.masterDef.width = this.buttonsMaxWidth ;
		this.value = this.masterDef.value = buttonDef.value ;
		this.initPage() ;
	}

	this.toggle( false ) ;
	this.redraw() ;
} ;



SelectList.prototype.onButtonSubmit = function( buttonValue , trash , button ) {
	switch ( button.internalRole ) {
		case 'previousPage' :
			this.previousPage() ;
			break ;
		case 'nextPage' :
			this.nextPage() ;
			break ;
		case 'toggle' :
			this.toggle() ;
			break ;
		default :
			this.select( button ) ;
			this.emit( 'submit' , buttonValue , undefined , this ) ;
	}
} ;



SelectList.prototype.getValue = function() { return this.value ; } ;

