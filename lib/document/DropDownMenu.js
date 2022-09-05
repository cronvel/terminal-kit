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



const Element = require( './Element.js' ) ;
const ToggleButton = require( './ToggleButton.js' ) ;
const RowMenu = require( './RowMenu.js' ) ;
const ColumnMenuMixed = require( './ColumnMenuMixed.js' ) ;



function DropDownMenu( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	var i , iMax ;

	if ( options.value && typeof options.value === 'object' ) {
		this.setValue( options.value , true ) ;
	}
	else {
		this.value = {} ;
	}

	RowMenu.call( this , options ) ;

	this.initPage() ;

	this.columnMenu = null ;
	this.columnButtonBlurAttr = options.buttonBlurAttr || { bgColor: 'gray' , color: 'white' , bold: true } ;
	this.columnButtonFocusAttr = options.buttonFocusAttr || { bgColor: 'blue' , color: 'white' , bold: true } ;
	this.columnButtonTurnedOnBlurAttr = options.buttonTurnedOnBlurAttr || { bgColor: 'gray' , color: 'white' , bold: true } ;
	this.columnButtonTurnedOnFocusAttr = options.buttonTurnedOnFocusAttr || { bgColor: 'blue' , color: 'white' , bold: true } ;
	this.columnButtonTurnedOffBlurAttr = options.buttonTurnedOffBlurAttr || { bgColor: 'gray' , color: 'white' , dim: true } ;
	this.columnButtonTurnedOffFocusAttr = options.buttonTurnedOffFocusAttr || { bgColor: 'blue' , color: 'white' , dim: true } ;

	this.clearColumnMenuOnSubmit = !! options.clearColumnMenuOnSubmit ;

	this.lastFocusButton = null ;

	this.onClickOut = this.onClickOut.bind( this ) ;
	this.onColumnMenuSubmit = this.onColumnMenuSubmit.bind( this ) ;
	//this.onColumnMenuFocus = this.onColumnMenuFocus.bind( this ) ;
	// Bounded by BaseMenu:
	//this.onButtonSubmit = this.onButtonSubmit.bind( this ) ;
	//this.onButtonFocus = this.onButtonFocus.bind( this ) ;

	this.on( 'clickOut' , this.onClickOut ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'DropDownMenu' && ! options.noDraw ) { this.draw() ; }
}

module.exports = DropDownMenu ;
Element.inherit( DropDownMenu , RowMenu ) ;



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



DropDownMenu.prototype.dropDown = function( index , x , y , submittedButtonValue , submittedButtonAction , button ) {
	var itemsDef = this.itemsDef[ index ].items ;

	if ( this.columnMenu ) {
		// Already dropped down? Nothing to do!
		if ( this.columnMenu.index === index ) { return ; }
		this.clearColumnMenu() ;
	}

	// No submenu, leave now...
	if ( ! itemsDef || ! itemsDef.length ) {
		if ( submittedButtonValue && this.itemsDef[ index ].topSubmit ) {
			// Top-button without submenu that have a 'topSubmit' flag on submits themselves
			this.emit( 'submit' , submittedButtonValue , submittedButtonAction , this , button ) ;
		}

		return ;
	}

	var hasToggle = itemsDef.some( def => def.type === 'toggle' ) ;

	// Make the ColumnMenu a child of the button, so focus cycle will work as expected
	var columnMenuOptions = {
		internal: true ,
		parent: this.children[ index ] ,
		x: x ,
		y: y ,
		width: this.outputWidth - x ,
		leftPadding: ' ' ,
		rightPadding: ' ' ,
		items: itemsDef ,
		value: this.value ,
		buttonFocusAttr: this.columnButtonFocusAttr ,
		buttonBlurAttr: this.columnButtonBlurAttr ,
		buttonTurnedOnBlurAttr: this.columnButtonTurnedOnBlurAttr ,
		buttonTurnedOnFocusAttr: this.columnButtonTurnedOnFocusAttr ,
		buttonTurnedOffBlurAttr: this.columnButtonTurnedOffBlurAttr ,
		buttonTurnedOffFocusAttr: this.columnButtonTurnedOffFocusAttr
	} ;

	if ( hasToggle ) {
		columnMenuOptions.leftPadding = '   ' ;
		//columnMenuOptions.turnedOnLeftPadding = ' ✓ ' ;
		//columnMenuOptions.turnedOffLeftPadding = ' ✗ ' ;
		columnMenuOptions.turnedOnLeftPadding = ' ☑ ' ;
		columnMenuOptions.turnedOffLeftPadding = ' ☐ ' ;
	}

	this.columnMenu = new ColumnMenuMixed( columnMenuOptions ) ;

	this.columnMenu.on( 'submit' , this.onColumnMenuSubmit ) ;
	//this.columnMenu.on( 'focus' , this.onColumnMenuFocus ) ;

	// unused ATM
	//this.columnMenu.menuIndex = index ;

	//this.document.giveFocusTo( this.columnMenu , 'delegate' ) ;
} ;



DropDownMenu.prototype.clearColumnMenu = function( focusHeadButton = false ) {
	if ( ! this.columnMenu ) { return false ; }
	this.columnMenu.destroy() ;
	this.columnMenu = null ;

	if ( focusHeadButton && this.lastFocusButton ) {
		this.document.giveFocusTo( this.lastFocusButton , 'clear' ) ;
	}

	return true ;
} ;



DropDownMenu.prototype.setValue = function( value , noDraw ) {
	if ( ! value || typeof value !== 'object' ) { return ; }

	this.value = {} ;
	for ( let key in value ) { this.value[ key ] = !! value[ key ] ; }

	if ( this.columnMenu ) { this.columnMenu.setValue( value , noDraw ) ; }
} ;



DropDownMenu.prototype.setKeyValue = function( key , value , noDraw ) {
	if ( ! key ) { return ; }
	this.value[ key ] = !! value ;
	if ( this.columnMenu ) { this.columnMenu.setKeyValue( key , value , noDraw ) ; }
} ;



DropDownMenu.prototype.setDropDownItem = function( topItemValue , dropDownItemValue , itemOptions ) {
	var topItem = this.itemsDef.find( e => e.value === topItemValue ) ;
	if ( ! topItem ) { return false ; }
	var dropDownItem = topItem.items && topItem.items.find( e => e.value === dropDownItemValue ) ;
	if ( ! dropDownItem ) { return false ; }
	this.clearColumnMenu() ;
	Object.assign( dropDownItem , itemOptions ) ;
	return true ;
} ;



DropDownMenu.prototype.onClickOut = function( buttonValue , data , button ) {
	this.clearColumnMenu() ;
} ;



/*	Does not work: focus is on column-menu children, we should have a way to make focus event bubbling up
DropDownMenu.prototype.onColumnMenuFocus = function( focus , type ) {
	if ( ! focus && this.columnMenu ) {
		this.clearColumnMenu() ;
	}
} ;
*/



DropDownMenu.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	this.dropDown( button.childId , button.outputX , button.outputY + 1 , buttonValue , action , button ) ;
} ;



DropDownMenu.prototype.onButtonFocus = function( focus , type , button ) {
	this.lastFocusButton = button ;

	if ( focus && type !== 'clear' ) {
		this.dropDown( button.childId , button.outputX , button.outputY + 1 ) ;
	}
} ;



DropDownMenu.prototype.onColumnMenuSubmit = function( buttonValue , action , columnMenu , button ) {
	//console.error( "DropDownMenu#onColumnMenuSubmit()" , buttonValue , action , columnMenu?.elementType , button?.elementType ) ;
	if ( button instanceof ToggleButton ) {
		//console.error( ">>> is ToggleButton" ) ;
		if ( button.key ) {
			this.value[ button.key ] = button.value ;
		}

		if ( this.clearColumnMenuOnSubmit ) {
			setTimeout( () => this.clearColumnMenu( true ) , 400 ) ;
		}
	}
	else {
		columnMenu.once( 'blinked' , ( buttonValue_ , reserved , columnMenu_ , button_ ) => {
			if ( this.clearColumnMenuOnSubmit ) { this.clearColumnMenu( true ) ; }
			this.emit( 'blinked' , buttonValue_ , reserved , this , button_ ) ;
		} ) ;
	}

	this.emit( 'submit' , buttonValue , action , this , button ) ;
} ;



const userActions = DropDownMenu.prototype.userActions ;

userActions.previous = function() {
	this.focusChild = this.focusPreviousChild() ;
	//this.clearColumnMenu() ;
} ;

userActions.next = function() {
	this.focusChild = this.focusNextChild() ;
	//this.clearColumnMenu() ;
} ;

userActions.dropDown = function() {
	if ( this.columnMenu ) {
		this.columnMenu.focusNextChild() ;
	}
	else if ( this.lastFocusButton ) {
		this.dropDown( this.lastFocusButton.childId , this.lastFocusButton.outputX , this.lastFocusButton.outputY + 1 ) ;
	}

	//this.focusChild = this.focusNextChild() ;
	//this.clearColumnMenu() ;
} ;

userActions.clearColumnMenu = function() {
	// Bubble up only if something was cleared
	return this.clearColumnMenu( true ) ;
} ;

