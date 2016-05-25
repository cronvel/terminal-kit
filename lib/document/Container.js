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



// Container: an enclosed surface (ScreenBuffer).
// Later it will feature a viewport and an internal surface, to allow scrolling.



// Load modules
var Element = require( './Element.js' ) ;
var ScreenBuffer = require( '../ScreenBuffer.js' ) ;



function Container() { throw new Error( 'Use Container.create() instead' ) ; }
module.exports = Container ;
Container.prototype = Object.create( Element.prototype ) ;
Container.prototype.constructor = Container ;
Container.prototype.elementType = 'Container' ;

Container.prototype.isContainer = true ;



Container.create = function createContainer( options )
{
	var container = Object.create( Container.prototype ) ;
	container.create( options ) ;
	return container ;
} ;



Container.prototype.create = function create( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	Element.prototype.create.call( this , options ) ;
	
	// No scrolling for instance: input coords is equals to output coords
	this.inputX = options.inputX || this.outputX ;
	this.inputY = options.inputY || this.outputY ;
	this.inputWidth = options.inputWidth || this.outputWidth ;
	this.inputHeight = options.inputHeight || this.outputHeight ;
	
	this.inputDst = ScreenBuffer.create( {
		dst: this.outputDst ,
		x: this.inputX ,
		y: this.inputY ,
		width: this.inputWidth ,
		height: this.inputHeight
	} ) ;
	
	Object.defineProperties( this , {
		deltaDraw: { value: false , enumerable: true , writable: true } ,	// Useful for Document, not so useful for other containers
		backgroundAttr: { value: options.backgroundAttr || { bgColor: 'black' } , enumerable: true , writable: true } ,
	} ) ;
	
	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Container' ) { this.draw() ; }
} ;



Container.prototype.destroy = function destroy( isSubDestroy )
{
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



// /!\ TODO /!\
/*
	Accept ScreenBuffer#resize() argument: x, y, width, height.
	Should it support output* and input* args?
*/
Container.prototype.resize =
Container.prototype.resizeInput = function resizeInput( to )
{
	if ( ! to.x ) { to.x = 0 ; }
	if ( ! to.y ) { to.y = 0 ; }
	
	this.inputDst.resize( to ) ;
} ;



Container.prototype.moveTo = function moveTo( x , y )
{
	this.outputX = this.inputDst.x = x ;
	this.outputY = this.inputDst.y = y ;
} ;



Container.prototype.preDrawSelf = function preDrawSelf()
{
	this.inputDst.fill( { char: ' ' , attr: this.backgroundAttr } ) ;
} ;



Container.prototype.postDrawSelf = function postDrawSelf()
{
	// No scrolling for instance, so nothing to do, just draw it
	//this.inputDst.x = this.outputX ;
	//this.inputDst.y = this.outputY ;
	
	this.inputDst.draw( {
		delta: this.deltaDraw		// Draw only diff or not?
	} ) ;
} ;



Container.prototype.drawSelfCursor = function drawSelfCursor( elementTargeted )
{
	if ( elementTargeted ) { this.restoreCursor() ; }
	else { this.inputDst.drawCursor() ; }
} ;



Container.prototype.onOutputDstResize = function onOutputDstResize( data )
{
} ;



