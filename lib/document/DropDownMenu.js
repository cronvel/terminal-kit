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



//const Element = require( './Element.js' ) ;
const RowMenu = require( './RowMenu.js' ) ;
const ColumnMenu = require( './ColumnMenu.js' ) ;



function DropDownMenu( options = {} ) {
	var i , iMax ;

	RowMenu.call( this , options ) ;

	this.columnMenu = null ;
	this.columnButtonFocusAttr = options.buttonFocusAttr || { bgColor: 'blue' , color: 'white' , bold: true } ;
	this.columnButtonBlurAttr = options.buttonBlurAttr || { bgColor: 'brightBlack' , color: 'white' , bold: true } ;
	this.onClickOut = this.onClickOut.bind( this ) ;
	this.onButtonFocus = this.onButtonFocus.bind( this ) ;
	this.onButtonSubmit = this.onButtonSubmit.bind( this ) ;
	this.onColumnMenuSubmit = this.onColumnMenuSubmit.bind( this ) ;

	this.on( 'clickOut' , this.onClickOut ) ;

	for ( i = 0 , iMax = this.buttons.length ; i < iMax ; i ++ ) {
		this.buttons[ i ].on( 'focus' , this.onButtonFocus ) ;
	}

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'DropDownMenu' && ! options.noDraw ) { this.draw() ; }
}

module.exports = DropDownMenu ;

DropDownMenu.prototype = Object.create( RowMenu.prototype ) ;
DropDownMenu.prototype.constructor = DropDownMenu ;
DropDownMenu.prototype.elementType = 'DropDownMenu' ;



DropDownMenu.prototype.destroy = function( isSubDestroy ) {
	this.off( 'clickOut' , this.onClickOut ) ;

	RowMenu.prototype.destroy.call( this , isSubDestroy ) ;
} ;



DropDownMenu.prototype.keyBindings = {
	LEFT: 'previous' ,
	RIGHT: 'next' ,
	ESCAPE: 'clearColumnMenu' ,
	UP: 'clearColumnMenu' ,
	DOWN: 'dropDown' ,
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	ALT_ENTER: 'submit'
} ;



DropDownMenu.prototype.dropDown = function( index , x , y , submittedButtonValue ) {
	var itemsDef = this.itemsDef[ index ].items ;

	//console.error( "Submit!" , button.childIndex ) ;

	if ( this.columnMenu ) {
		// Already dropped down? Nothing to do!
		if ( this.columnMenu.index === index ) { return ; }
		this.clearColumnMenu() ;
	}

	// No submenu, leave now...
	if ( ! itemsDef || ! itemsDef.length ) {
		if ( submittedButtonValue && this.itemsDef[ index ].topSubmit ) {
			// Top-button without submenu that have a 'topSubmit' flag on submits themselves
			this.emit( 'submit' , submittedButtonValue , undefined , this ) ;
		}

		return ;
	}

	// Make the ColumnMenu a child of the button, so focus cycle will work as expected
	this.columnMenu = new ColumnMenu( {
		parent: this.children[ index ] ,
		x: x ,
		y: y ,
		width: this.outputWidth - x ,
		leftPadding: ' ' ,
		rightPadding: ' ' ,
		items: itemsDef ,
		buttonFocusAttr: this.columnButtonFocusAttr ,
		buttonBlurAttr: this.columnButtonBlurAttr
	} ) ;

	this.columnMenu.on( 'submit' , this.onColumnMenuSubmit ) ;

	this.columnMenu.menuIndex = index ;

	//this.document.giveFocusTo( this.columnMenu , 'delegate' ) ;
} ;



DropDownMenu.prototype.clearColumnMenu = function() {
	if ( ! this.columnMenu ) { return false ; }
	this.columnMenu.destroy() ;
	this.columnMenu = null ;
	return true ;
} ;



DropDownMenu.prototype.onClickOut = function( buttonValue , data , button ) {
	if ( this.columnMenu ) {
		this.clearColumnMenu() ;
	}
} ;



DropDownMenu.prototype.onButtonSubmit = function( buttonValue , data , button ) {
	this.dropDown( button.childIndex , button.outputX , button.outputY + 1 , buttonValue ) ;
} ;



DropDownMenu.prototype.onButtonFocus = function( focus , type , button ) {
	if ( focus ) { this.dropDown( button.childIndex , button.outputX , button.outputY + 1 ) ; }
} ;



DropDownMenu.prototype.onColumnMenuSubmit = function( buttonValue , data , button ) {
	this.emit( 'submit' , buttonValue , undefined , this ) ;
} ;



DropDownMenu.prototype.onKey = function( key , trash , data ) {
	switch( this.keyBindings[ key ] ) {
		case 'previous' :
			this.focusChild = this.focusPreviousChild() ;
			//this.clearColumnMenu() ;
			break ;
		case 'next' :
			this.focusChild = this.focusNextChild() ;
			//this.clearColumnMenu() ;
			break ;
		case 'dropDown' :
			if ( this.columnMenu ) { this.columnMenu.focusNextChild() ; }
			//this.focusChild = this.focusNextChild() ;
			//this.clearColumnMenu() ;
			break ;
		case 'clearColumnMenu' :
			// Bubble up only if something was cleared
			return this.clearColumnMenu() ;
		default :
			return ;	// Bubble up
	}

	return true ;	// Do not bubble up
} ;

