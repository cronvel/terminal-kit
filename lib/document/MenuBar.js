/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2015 Cédric Ronvel 
	
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



// Load modules
var Element = require( './Element.js' ) ;
var RowMenu = require( './RowMenu.js' ) ;
var ColumnMenu = require( './ColumnMenu.js' ) ;



function MenuBar() { throw new Error( 'Use MenuBar.create() instead' ) ; }
module.exports = MenuBar ;
MenuBar.prototype = Object.create( RowMenu.prototype ) ;
MenuBar.prototype.constructor = MenuBar ;
MenuBar.prototype.elementType = 'MenuBar' ;



MenuBar.create = function createMenuBar( options )
{
	var menuBar = Object.create( MenuBar.prototype ) ;
	menuBar.create( options ) ;
	return menuBar ;
} ;



MenuBar.prototype.create = function createMenuBar( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	RowMenu.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		columnMenu: { value: null , enumerable: true , writable: true } ,
		columnButtonFocusAttr: { value: options.buttonFocusAttr || { bgColor: 'blue' , color: 'white' , bold: true } , enumerable: true , writable: true } ,
		columnButtonBlurAttr: { value: options.buttonBlurAttr || { bgColor: 'brightBlack' , color: 'white' , bold: true } , enumerable: true , writable: true } ,
	} ) ;
	
	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'MenuBar' ) { this.draw() ; }
} ;



MenuBar.prototype.keyBindings = {
	LEFT: 'previous' ,
	RIGHT: 'next' ,
	ESCAPE: 'clearColumnMenu' ,
//	UP: 'previous' ,
//	DOWN: 'next' ,
} ;



MenuBar.prototype.onButtonSubmit = function onButtonSubmit( buttonValue , button )
{
	var itemsDef = this.itemsDef[ button.childIndex ].items ;
	
	//console.error( "Submit!" , button.childIndex ) ;
	
	this.clearColumnMenu() ;
	
	// No submenu, leave now...
	if ( ! itemsDef || ! itemsDef.length ) { return ; }
	
	this.columnMenu = ColumnMenu.create( {
		parent: this ,
		x: button.outputX ,
		y: button.outputY + 1 ,
		items: itemsDef ,
		buttonFocusAttr: this.columnButtonFocusAttr ,
		buttonBlurAttr: this.columnButtonBlurAttr ,
	} ) ;
	
	this.document.giveFocusTo( this.columnMenu ) ;
} ;



MenuBar.prototype.clearColumnMenu = function clearColumnMenu()
{
	if ( ! this.columnMenu ) { return ; }
	this.columnMenu.detach() ;
	this.columnMenu = null ;
} ;



MenuBar.prototype.onKey = function onKey( key , trash , data )
{
	switch( this.keyBindings[ key ] )
	{
		case 'previous' :
			this.focusChild = this.focusPreviousChild() ;
			this.clearColumnMenu() ;
			break ;
		case 'next' :
			this.focusChild = this.focusNextChild() ;
			this.clearColumnMenu() ;
			break ;
		case 'clearColumnMenu' :
			this.clearColumnMenu() ;
			break ;
		default :
			return ;	// Bubble up
	}
	
	return true ;	// Do not bubble up
} ;



