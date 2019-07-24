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



const ColumnMenu = require( './ColumnMenu.js' ) ;
const ToggleButton = require( './ToggleButton.js' ) ;



// Inherit from ColumnMenu for common methods

function ColumnMultiMenu( options = {} ) {
	ColumnMenu.call( this , options ) ;

	// ColumnMultiMenu value is always a set of values
	this.value = new Set() ;
	
	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'ColumnMultiMenu' && ! options.noDraw ) { this.draw() ; }
}

module.exports = ColumnMultiMenu ;

ColumnMultiMenu.prototype = Object.create( ColumnMenu.prototype ) ;
ColumnMultiMenu.prototype.constructor = ColumnMultiMenu ;
ColumnMultiMenu.prototype.elementType = 'ColumnMultiMenu' ;



ColumnMultiMenu.prototype.ButtonClass = ToggleButton ;



ColumnMultiMenu.prototype.keyBindings = {
	UP: 'previous' ,
	DOWN: 'next' ,
	ENTER: 'toggle' ,
	KP_ENTER: 'toggle' ,
	ALT_ENTER: 'submit'
} ;



ColumnMultiMenu.prototype.initChildren = function() {
	ColumnMenu.prototype.initChildren.call( this ) ;
	
	// Only initPage if we are not a superclass of the object
	if ( this.elementType === 'ColumnMultiMenu' ) { this.initPage() ; }
} ;



ColumnMultiMenu.prototype.onButtonSubmit = function( buttonValue , trash , button ) {
	switch ( button.internalRole ) {
		case 'previousPage' :
			this.previousPage() ;
			break ;
		case 'nextPage' :
			this.nextPage() ;
			break ;
		default :
			this.emit( 'submit' , this.value , undefined , this ) ;
	}
} ;



ColumnMultiMenu.prototype.onButtonToggle = function( buttonValue , trash , button ) {
	if ( ! button.key ) { return ; }
	this.value[ button.key ] = buttonValue ;
} ;

