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
	var items = [
		{
			content: 'select-list' ,
			value: 'select-list'
		}
	] ;
	
	if ( Array.isArray( options.items ) ) { items.push( ... options.items ) ; }
	
	options = Object.assign( {} , options , { items } ) ;
	
	ColumnMenu.call( this , options ) ;
	
	this.onMasterButtonClick = this.onMasterButtonClick.bind( this ) ;
	
	this.buttons[ 0 ].on( 'click' , this.onMasterButtonClick ) ;

	this.show = false ;
	this.showHide( this.show ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'SelectList' && ! options.noDraw ) { this.draw() ; }
}

module.exports = SelectList ;

SelectList.prototype = Object.create( ColumnMenu.prototype ) ;
SelectList.prototype.constructor = SelectList ;
SelectList.prototype.elementType = 'SelectList' ;



SelectList.prototype.showHide = function( show = null ) {
	var i , iMax ;
	
	if ( show === null ) { this.show = ! this.show ; }
	else { this.show = !! show ; }
	
	for ( i = 1 , iMax = this.buttons.length ; i < iMax ; i ++ ) {
		this.buttons[ i ].hidden = ! this.show ;
	}
	
	this.redraw() ;
} ;



SelectList.prototype.onMasterButtonClick = function() {
	this.showHide() ;
} ;

