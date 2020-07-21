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

	this.onDrag = this.onDrag.bind( this ) ;

	// No scrolling for instance: input coords is equals to output coords
	this.inputX = options.inputX || this.outputX + this.containerBorderSize ;
	this.inputY = options.inputY || this.outputY + this.containerBorderSize ;
	this.inputWidth = options.inputWidth || this.outputWidth - this.containerBorderSize * 2 ;
	this.inputHeight = options.inputHeight || this.outputHeight - this.containerBorderSize * 2 ;

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

	this.movable = !! options.movable ;

	this.on( 'drag' , this.onDrag ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Container' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Container ;

Container.prototype = Object.create( Element.prototype ) ;
Container.prototype.constructor = Container ;
Container.prototype.elementType = 'Container' ;

Container.prototype.isContainer = true ;
Container.prototype.containerBorderSize = 0 ;



Container.prototype.destroy = function( isSubDestroy ) {
	this.off( 'drag' , this.onDrag ) ;

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
	this.children.forEach( child => child.emit( 'parentResize' , to ) ) ;
} ;



Container.prototype.move = function( dx , dy , noDraw = false ) {
	return this.moveTo( this.outputX + dx , this.outputY + dy , noDraw ) ;
} ;



Container.prototype.moveTo = function( x , y , noDraw = false ) {
	var dx = x - this.outputX ,
		dy = y - this.outputY ;

	this.outputX = x ;
	this.outputY = y ;

	this.inputX += dx ;
	this.inputY += dy ;
	this.inputDst.x = this.inputX ;
	this.inputDst.y = this.inputY ;

	if ( ! noDraw ) { this.redraw() ; }
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



Container.prototype.onDrag = function( data ) {
	if ( ! this.movable || ( ! data.dx && ! data.dy ) ) { return ; }
	this.move( data.dx , data.dy ) ;
} ;

