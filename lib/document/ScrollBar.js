/*
	Terminal Kit

	Copyright (c) 2009 - 2020 Cédric Ronvel

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
const Button = require( './Button.js' ) ;



function ScrollBar( options = {} ) {
	Element.call( this , options ) ;

	this.onClick = this.onClick.bind( this ) ;

	this.on( 'click' , this.onClick ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'ScrollBar' && ! options.noDraw ) { this.draw() ; }
}

module.exports = ScrollBar ;

ScrollBar.prototype = Object.create( Element.prototype ) ;
ScrollBar.prototype.constructor = ScrollBar ;
ScrollBar.prototype.elementType = 'ScrollBar' ;



ScrollBar.prototype.defaultOptions = {
	buttonBlurAttr: { bgColor: 'gray' , color: 'white' , bold: true } ,
	buttonFocusAttr: { bgColor: 'white' , color: 'black' , bold: true } ,
	buttonDisabledAttr: {
		bgColor: 'gray' , color: 'white' , bold: true , dim: true
	} ,
	buttonSubmittedAttr: { bgColor: 'gray' , color: 'brightWhite' , bold: true } ,
	upSymbol: '▲' ,
	handleSymbol: '◆' ,
	downSymbol: '▼'
} ;




ScrollBar.prototype.destroy = function( isSubDestroy ) {
	this.off( 'click' , this.onClick ) ;
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



ScrollBar.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	/*
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
			this.emit( 'submit' , buttonValue , action , this ) ;
	}
	*/
} ;



// Maybe for scrolling at xx% of the related content
/*
ScrollBar.prototype.setValue = function( value , noDraw ) {
	var buttonDef = this.itemsDef.find( b => b.value === value ) ;
	if ( ! buttonDef ) { return false ; }
	this.select( buttonDef , noDraw ) ;
	return true ;
} ;

ScrollBar.prototype.getValue = function() { return this.value ; } ;
*/



//ScrollBar.prototype.onClick = function() { this.toggle( false ) ; } ;

