/*
	Terminal Kit
	
	Copyright (c) 2009 - 2016 Cédric Ronvel
	
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



// Load modules
var Element = require( './Element.js' ) ;
var RowMenu = require( './RowMenu.js' ) ;
var ColumnMenu = require( './ColumnMenu.js' ) ;



function DropDownMenu() { throw new Error( 'Use DropDownMenu.create() instead' ) ; }
module.exports = DropDownMenu ;
DropDownMenu.prototype = Object.create( RowMenu.prototype ) ;
DropDownMenu.prototype.constructor = DropDownMenu ;
DropDownMenu.prototype.elementType = 'DropDownMenu' ;



DropDownMenu.create = function createDropDownMenu( options )
{
	var dropDownMenu = Object.create( DropDownMenu.prototype ) ;
	dropDownMenu.create( options ) ;
	return dropDownMenu ;
} ;



DropDownMenu.prototype.create = function create( options )
{
	var i , iMax ;
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	RowMenu.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		columnMenu: { value: null , enumerable: true , writable: true } ,
		columnButtonFocusAttr: { value: options.buttonFocusAttr || { bgColor: 'blue' , color: 'white' , bold: true } , enumerable: true , writable: true } ,
		columnButtonBlurAttr: { value: options.buttonBlurAttr || { bgColor: 'brightBlack' , color: 'white' , bold: true } , enumerable: true , writable: true } ,
		onButtonFocus: { value: this.onButtonFocus.bind( this ) , enumerable: true } ,
		onColumnMenuSubmit: { value: this.onColumnMenuSubmit.bind( this ) , enumerable: true } ,
	} ) ;
	
	for ( i = 0 , iMax = this.buttons.length ; i < iMax ; i ++ )
	{
		this.buttons[ i ].on( 'focus' , this.onButtonFocus ) ;
	}
	
	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'DropDownMenu' ) { this.draw() ; }
} ;



DropDownMenu.prototype.destroy = function destroy( isSubDestroy )
{
	RowMenu.prototype.destroy.call( this , isSubDestroy ) ;
} ;



DropDownMenu.prototype.keyBindings = {
	LEFT: 'previous' ,
	RIGHT: 'next' ,
	ESCAPE: 'clearColumnMenu' ,
	UP: 'clearColumnMenu' ,
	DOWN: 'dropDown' ,
} ;



DropDownMenu.prototype.dropDown = function dropDown( index , x , y )
{
	var itemsDef = this.itemsDef[ index ].items ;
	
	//console.error( "Submit!" , button.childIndex ) ;
	
	if ( this.columnMenu )
	{
		// Already dropped down? Nothing to do!
		if ( this.columnMenu.index === index ) { return ; }
		this.clearColumnMenu() ;
	}
	
	// No submenu, leave now...
	if ( ! itemsDef || ! itemsDef.length ) { return ; }
	
	// Make the ColumnMenu a child of the button, so focus cycle will work as expected
	this.columnMenu = ColumnMenu.create( {
		parent: this.children[ index ] ,
		x: x ,
		y: y ,
		items: itemsDef ,
		buttonFocusAttr: this.columnButtonFocusAttr ,
		buttonBlurAttr: this.columnButtonBlurAttr ,
	} ) ;
	
	this.columnMenu.on( 'submit' , this.onColumnMenuSubmit ) ;
	
	this.columnMenu.menuIndex = index ;
	
	//this.document.giveFocusTo( this.columnMenu , 'delegate' ) ;
} ;



DropDownMenu.prototype.clearColumnMenu = function clearColumnMenu()
{
	if ( ! this.columnMenu ) { return ; }
	this.columnMenu.destroy() ;
	this.columnMenu = null ;
} ;



DropDownMenu.prototype.onColumnMenuSubmit = function onColumnMenuSubmit( buttonValue , data , button )
{
	this.emit( 'submit' , buttonValue , undefined , this ) ;
} ;



DropDownMenu.prototype.onButtonSubmit = function onButtonSubmit( buttonValue , data , button )
{
	this.dropDown( button.childIndex , button.outputX , button.outputY + 1 ) ;
} ;



DropDownMenu.prototype.onButtonFocus = function onButtonFocus( focus , type , button )
{
	if ( focus ) { this.dropDown( button.childIndex , button.outputX , button.outputY + 1 ) ; }
} ;



DropDownMenu.prototype.onKey = function onKey( key , trash , data )
{
	switch( this.keyBindings[ key ] )
	{
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
			this.clearColumnMenu() ;
			break ;
		default :
			return ;	// Bubble up
	}
	
	return true ;	// Do not bubble up
} ;



