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



// Container: an enclosed surface (ScreenBuffer).
// Later it will feature a viewport and an internal surface, to allow scrolling.



const Element = require( './Element.js' ) ;
const ScreenBuffer = require( '../ScreenBuffer.js' ) ;



function Container( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	Element.call( this , options ) ;

	// No scrolling for instance: input coords is equals to output coords
	this.inputX = options.inputX || this.outputX ;
	this.inputY = options.inputY || this.outputY ;
	this.inputWidth = options.inputWidth || this.outputWidth ;
	this.inputHeight = options.inputHeight || this.outputHeight ;

	//console.error( 'this.document:' , !! this.document , !! ( this.document && this.document.palette ) , !! options.palette ) ;
	this.palette = options.palette || ( this.document && this.document.palette ) ;
	this.object2attr = object => ScreenBuffer.object2attr( object , this.palette && this.palette.colorNameToIndex ) ;

	this.inputDst = new ScreenBuffer( {
		dst: this.outputDst ,
		x: this.inputX ,
		y: this.inputY ,
		width: this.inputWidth ,
		height: this.inputHeight ,
		palette: this.palette
	} ) ;

	this.deltaDraw = false ;	// Useful for Document, not so useful for other containers
	this.backgroundAttr = options.backgroundAttr || { bgColor: 'default' } ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Container' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Container ;

Container.prototype = Object.create( Element.prototype ) ;
Container.prototype.constructor = Container ;
Container.prototype.elementType = 'Container' ;

Container.prototype.isContainer = true ;



Container.prototype.destroy = function( isSubDestroy ) {
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



// /!\ TODO /!\
/*
	Accept ScreenBuffer#resize() argument: x, y, width, height.
	Should it support output* and input* args?
*/
Container.prototype.resize =
Container.prototype.resizeInput = function( to ) {
	if ( ! to.x ) { to.x = 0 ; }
	if ( ! to.y ) { to.y = 0 ; }

	this.inputDst.resize( to ) ;
} ;



Container.prototype.moveTo = function( x , y ) {
	this.outputX = this.inputDst.x = x ;
	this.outputY = this.inputDst.y = y ;
} ;



Container.prototype.preDrawSelf = function() {
	this.inputDst.fill( { char: ' ' , attr: this.backgroundAttr } ) ;
} ;



Container.prototype.postDrawSelf = function() {
	// No scrolling for instance, so nothing to do, just draw it
	//this.inputDst.x = this.outputX ;
	//this.inputDst.y = this.outputY ;

	this.inputDst.draw( {
		delta: this.deltaDraw ,		// Draw only diff or not?
		inline: this.strictInline
	} ) ;
} ;



Container.prototype.drawSelfCursor = function( elementTargeted ) {
	if ( elementTargeted ) { this.restoreCursor() ; }
	else { this.inputDst.drawCursor() ; }
} ;



Container.prototype.onOutputDstResize = function( data ) {
} ;

