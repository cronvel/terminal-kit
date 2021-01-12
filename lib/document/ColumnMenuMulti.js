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



const ColumnMenu = require( './ColumnMenu.js' ) ;
const ToggleButton = require( './ToggleButton.js' ) ;



// Inherit from ColumnMenu for common methods

function ColumnMenuMulti( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	// ColumnMenuMulti value is always a set of values
	if ( options.value && typeof options.value === 'object' ) {
		this.setValue( options.value , true ) ;
	}
	else {
		this.value = {} ;
	}

	ColumnMenu.call( this , options ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'ColumnMenuMulti' && ! options.noDraw ) { this.draw() ; }
}

module.exports = ColumnMenuMulti ;

ColumnMenuMulti.prototype = Object.create( ColumnMenu.prototype ) ;
ColumnMenuMulti.prototype.constructor = ColumnMenuMulti ;
ColumnMenuMulti.prototype.elementType = 'ColumnMenuMulti' ;



ColumnMenuMulti.prototype.ButtonClass = ToggleButton ;
ColumnMenuMulti.prototype.childUseParentKeyValue = true ;



ColumnMenuMulti.prototype.initChildren = function() {
	ColumnMenu.prototype.initChildren.call( this ) ;

	// Only initPage if we are not a superclass of the object
	if ( this.elementType === 'ColumnMenuMulti' ) { this.initPage() ; }
} ;



// Set all existing children ToggleButton to the correct value
ColumnMenuMulti.prototype.setValue = function( value , noDraw ) {
	if ( ! value || typeof value !== 'object' ) { return ; }

	if ( Array.isArray( value ) || value instanceof Set ) {
		this.value = {} ;
		for ( let key of value ) {
			if ( key && typeof key === 'string' ) {
				this.value[ key ] = true ;
			}
		}
	}
	else {
		this.value = value ;
	}

	// Can be called during init, before .initPage() is called
	if ( ! this.buttons ) { return ; }

	this.buttons.forEach( button => {
		if ( button.internalRole || ! button.key || ! ( button instanceof ToggleButton ) ) { return ; }
		button.setValue( this.value[ button.key ] ) ;
	} ) ;

	if ( ! noDraw ) { this.draw() ; }
} ;



ColumnMenuMulti.prototype.onKey = function( key , altKeys , data ) {
	switch( this.keyBindings[ key ] ) {
		case 'previous' :
			this.focusChild = this.focusPreviousChild( ! this.maxPage ) ;
			if ( this.focusChild === this.children[ 0 ] && this.maxPage && this.page > 0 ) {
				this.previousPage( 'backCycle' ) ;
			}
			break ;
		case 'next' :
			this.focusChild = this.focusNextChild( ! this.maxPage ) ;
			if ( this.focusChild === this.children[ this.children.length - 1 ] && this.maxPage && this.page < this.maxPage ) {
				this.nextPage( 'cycle' ) ;
			}
			break ;
		case 'previousPage' :
			if ( this.maxPage && this.page > 0 ) {
				this.previousPage( 'backCycle' ) ;
			}
			break ;
		case 'nextPage' :
			if ( this.maxPage && this.page < this.maxPage ) {
				this.nextPage( 'cycle' ) ;
			}
			break ;
		case 'firstPage' :
			if ( this.maxPage && this.page !== 0 ) {
				this.toPage( 0 , 'backCycle' ) ;
			}
			break ;
		case 'lastPage' :
			if ( this.maxPage && this.page !== this.maxPage ) {
				this.toPage( this.maxPage , 'cycle' ) ;
			}
			break ;
		case 'submit' :
			this.emit( 'submit' , this.value , undefined , this ) ;
			break ;
		default :
			return ;    // Bubble up
	}

	return true ;   // Do not bubble up
} ;



ColumnMenuMulti.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	switch ( button.internalRole ) {
		case 'previousPage' :
			this.previousPage() ;
			break ;
		case 'nextPage' :
			this.nextPage() ;
			break ;
		default :
			this.emit( 'submit' , this.value , action , this ) ;
	}
} ;



ColumnMenuMulti.prototype.onButtonToggle = function( buttonValue , action , button ) {
	if ( ! button.key ) { return ; }

	if ( buttonValue ) { this.value[ button.key ] = true ; }
	else { delete this.value[ button.key ] ; }

	this.emit( 'itemToggle' , button.key , buttonValue , button ) ;
} ;

