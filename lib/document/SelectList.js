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

function SelectList( options = {} ) {
	if ( ! options.master || typeof options.master !== 'object' ) {
		options.master = {
			content: 'select-list' ,
			internalRole: 'toggle'
		} ;
	}
	
	if ( ! options.separator || typeof options.separator !== 'object' ) {
		options.separator = {
			content: '-' ,
			contentRepeat: true ,
			internalRole: 'separator'
		}
	}
	
	ColumnMenu.call( this , options ) ;
	
	this.show = false ;
	this.toggle( this.show ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'SelectList' && ! options.noDraw ) { this.draw() ; }
}

module.exports = SelectList ;

SelectList.prototype = Object.create( ColumnMenu.prototype ) ;
SelectList.prototype.constructor = SelectList ;
SelectList.prototype.elementType = 'SelectList' ;



SelectList.prototype.toggle = function( show = null ) {
	var i , iMax ;
	
	if ( show === null ) { this.show = ! this.show ; }
	else { this.show = !! show ; }
	
	for ( i = 1 , iMax = this.buttons.length ; i < iMax ; i ++ ) {
		this.buttons[ i ].hidden = ! this.show ;
	}
	
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
		case 'master' :
			this.toggle() ;
			break ;
		default :
			//this.setMaster
			this.emit( 'submit' , buttonValue , undefined , this ) ;
	}
} ;

