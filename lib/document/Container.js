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



// Container: an enclosed surface (ScreenBuffer), with a viewport to allow scrolling.



const Element = require( './Element.js' ) ;
const Slider = require( './Slider.js' ) ;
const ScreenBuffer = require( '../ScreenBuffer.js' ) ;



function Container( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	Element.call( this , options ) ;

	this.onKey = this.onKey.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;
	this.onDrag = this.onDrag.bind( this ) ;
	this.onWheel = this.onWheel.bind( this ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	//console.error( 'this.document:' , !! this.document , !! ( this.document && this.document.palette ) , !! options.palette ) ;
	this.palette = options.palette || ( this.document && this.document.palette ) ;
	this.object2attr = object => ScreenBuffer.object2attr( object , this.palette && this.palette.colorNameToIndex ) ;

	this.scrollable = !! options.scrollable ;
	this.hasVScrollBar = this.scrollable && !! options.vScrollBar ;
	this.hasHScrollBar = this.scrollable && !! options.hScrollBar ;
	this.scrollX = options.scrollX || 0 ;
	this.scrollY = options.scrollY || 0 ;
	this.vScrollBarSlider = null ;
	this.hScrollBarSlider = null ;

	this.movable = !! options.movable ;

	this.viewportX = this.outputX + this.containerBorderSize ;
	this.viewportY = this.outputY + this.containerBorderSize ;
	this.viewportWidth = this.outputWidth - this.containerBorderSize * 2 ;
	this.viewportHeight = this.outputHeight - this.containerBorderSize * 2 ;

	this.inputX = options.inputX || this.viewportX + this.scrollX ;
	this.inputY = options.inputY || this.viewportY + this.scrollY ;
	this.inputWidth = options.inputWidth || this.viewportWidth ;
	this.inputHeight = options.inputHeight || this.viewportHeight ;

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

	this.on( 'key' , this.onKey ) ;
	this.on( 'click' , this.onClick ) ;
	this.on( 'drag' , this.onDrag ) ;
	this.on( 'wheel' , this.onWheel ) ;

	this.initChildren() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Container' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Container ;

Container.prototype = Object.create( Element.prototype ) ;
Container.prototype.constructor = Container ;
Container.prototype.elementType = 'Container' ;

Container.prototype.isContainer = true ;
Container.prototype.containerBorderSize = 0 ;



Container.prototype.destroy = function( isSubDestroy , noDraw = false ) {
	if ( this.destroyed ) { return ; }

	this.off( 'key' , this.onKey ) ;
	this.off( 'click' , this.onClick ) ;
	this.off( 'drag' , this.onDrag ) ;
	this.off( 'wheel' , this.onWheel ) ;

	Element.prototype.destroy.call( this , isSubDestroy , noDraw ) ;
} ;



Container.prototype.keyBindings = {
	UP: 'tinyScrollUp' ,
	DOWN: 'tinyScrollDown' ,
	PAGE_UP: 'scrollUp' ,
	PAGE_DOWN: 'scrollDown' ,
	' ': 'scrollDown' ,
	HOME: 'scrollTop' ,
	END: 'scrollBottom' ,
	LEFT: 'scrollLeft' ,
	RIGHT: 'scrollRight'
} ;



Container.prototype.initChildren = function() {
	if ( this.hasVScrollBar ) {
		this.vScrollBarSlider = new Slider( {
			internal: true ,
			parent: this ,
			x: this.viewportWidth - 1 ,
			y: 0 ,
			height: this.viewportHeight ,
			isVertical: true ,
			valueToRate: scrollY => -scrollY / Math.max( 1 , this.inputHeight - this.viewportHeight ) ,
			rateToValue: rate => -rate * Math.max( 1 , this.inputHeight - this.viewportHeight ) ,
			noDraw: true
		} ) ;

		this.vScrollBarSlider.on( 'slideStep' , d => this.scroll( 0 , -d * Math.ceil( this.viewportHeight / 2 ) ) ) ;
		this.vScrollBarSlider.on( 'slide' , value => this.scrollTo( null , value ) ) ;
	}

	if ( this.hasHScrollBar ) {
		this.hScrollBarSlider = new Slider( {
			internal: true ,
			parent: this ,
			x: 0 ,
			y: this.inputWidth - this.containerBorderSize * 2 - 1 ,
			width: this.viewportWidth - this.hasVScrollBar ,
			valueToRate: scrollY => -scrollY / Math.max( 1 , this.inputWidth - this.viewportWidth ) ,
			rateToValue: rate => -rate * Math.max( 1 , this.inputWidth - this.viewportWidth ) ,
			noDraw: true
		} ) ;

		this.hScrollBarSlider.on( 'slideStep' , d => this.scroll( -d * Math.ceil( this.viewportWidth / 2 ) , 0 ) ) ;
		this.hScrollBarSlider.on( 'slide' , value => this.scrollTo( value , null ) ) ;
	}
} ;



// Accept ScreenBuffer#resize() argument: x, y, width, height.
// Should it support output* and input* args?
Container.prototype.resizeViewport = function( to ) {
	this.viewportWidth = to.width ;
	this.viewportHeight = to.height ;
} ;



Container.prototype.resizeInput = function( to ) {
	if ( ! to.x ) { to.x = 0 ; }
	if ( ! to.y ) { to.y = 0 ; }

	this.inputDst.resize( to ) ;

	this.inputWidth = this.inputDst.width ;
	this.inputHeight = this.inputDst.height ;

	this.children.forEach( child => child.emit( 'parentResize' , to ) ) ;
} ;



Container.prototype.resize = function( to ) {
	if ( ! to.x ) { to.x = 0 ; }
	if ( ! to.y ) { to.y = 0 ; }

	this.inputDst.resize( to ) ;

	this.viewportWidth = this.inputWidth = this.inputDst.width ;
	this.viewportHeight = this.inputHeight = this.inputDst.height ;

	this.children.forEach( child => child.emit( 'parentResize' , to ) ) ;
} ;



Container.prototype.move = function( dx , dy , noDraw = false ) {
	return this.moveTo( this.outputX + dx , this.outputY + dy , noDraw ) ;
} ;



Container.prototype.moveTo = function( x , y , noDraw = false ) {
	this.outputX = x ;
	this.outputY = y ;
	this.viewportX = this.outputX + this.containerBorderSize ;
	this.viewportY = this.outputY + this.containerBorderSize ;
	this.inputDst.x = this.inputX = this.viewportX + this.scrollX ;
	this.inputDst.y = this.inputY = this.viewportY + this.scrollY ;

	if ( ! noDraw ) { this.redraw() ; }
} ;



Container.prototype.scroll = function( dx , dy , dontDraw = false ) {
	return this.scrollTo( dx ? this.scrollX + dx : null , dy ? this.scrollY + dy : null , dontDraw ) ;
} ;



Container.prototype.scrollToTop = function( dontDraw = false ) {
	return this.scrollTo( null , 0 , dontDraw ) ;
} ;



Container.prototype.scrollToBottom = function( dontDraw = false ) {
	// Ignore extra scrolling here
	return this.scrollTo( null , this.viewportHeight - this.inputHeight , dontDraw ) ;
} ;



Container.prototype.scrollTo = function( x , y , noDraw = false ) {
	if ( ! this.scrollable ) { return ; }

	if ( x !== undefined && x !== null ) {
		// Got a +1 after content size because of the word-wrap thing and eventual invisible \n
		this.scrollX = Math.min( 0 , Math.max( Math.round( x ) ,
			this.viewportWidth - this.inputWidth + 1
		) ) ;

		this.inputDst.x = this.inputX = this.viewportX + this.scrollX ;
		//console.error( "New x-scrolling:" , x , this.scrollX , this.viewportX , this.inputX ) ;
	}

	if ( y !== undefined && y !== null ) {
		this.scrollY = Math.min( 0 , Math.max( Math.round( y ) ,
			this.viewportHeight - this.inputHeight
		) ) ;

		this.inputDst.y = this.inputY = this.viewportY + this.scrollY ;
		//console.error( "New y-scrolling:" , y , this.scrollY , this.viewportY , this.inputY ) ;
	}

	if ( this.vScrollBarSlider ) {
		this.vScrollBarSlider.setValue( this.scrollY , true ) ;
		this.vScrollBarSlider.setSizeAndPosition( { y: -this.scrollY } ) ;
	}

	if ( this.hScrollBarSlider ) {
		this.hScrollBarSlider.setValue( this.scrollX , true ) ;
	}

	if ( ! noDraw ) { this.draw() ; }
} ;



Container.prototype.preDrawSelf = function() {
	this.inputDst.fill( { char: ' ' , attr: this.backgroundAttr } ) ;
} ;



Container.prototype.postDrawSelf = function() {
	this.inputDst.draw( {
		dst: this.outputDst ,
		delta: this.deltaDraw ,		// Draw only diff or not?
		inline: this.strictInline ,
		x: this.inputX ,
		y: this.inputY ,
		dstClipRect: {
			x: this.viewportX ,
			y: this.viewportY ,
			width: this.viewportWidth ,
			height: this.viewportHeight
		}
	} ) ;
} ;



Container.prototype.drawSelfCursor = function( elementTargeted ) {
	if ( elementTargeted ) { this.restoreCursor() ; }
	else { this.inputDst.drawCursor() ; }
} ;



Container.prototype.onKey = function( key , trash , data ) {
	switch( this.keyBindings[ key ] ) {
		case 'tinyScrollUp' :
			this.scroll( 0 , Math.ceil( this.viewportHeight / 5 ) ) ;
			break ;

		case 'tinyScrollDown' :
			this.scroll( 0 , -Math.ceil( this.viewportHeight / 5 ) ) ;
			break ;

		case 'scrollUp' :
			this.scroll( 0 , Math.ceil( this.viewportHeight / 2 ) ) ;
			break ;

		case 'scrollDown' :
			this.scroll( 0 , -Math.ceil( this.viewportHeight / 2 ) ) ;
			break ;

		case 'scrollLeft' :
			this.scroll( Math.ceil( this.viewportWidth / 2 ) , 0 ) ;
			break ;

		case 'scrollRight' :
			this.scroll( -Math.ceil( this.viewportWidth / 2 ) , 0 ) ;
			break ;

		case 'scrollTop' :
			this.scrollToTop() ;
			break ;

		case 'scrollBottom' :
			this.scrollToBottom() ;
			break ;

		default :
			return ;	// Bubble up
	}

	return true ;		// Do not bubble up
} ;



Container.prototype.onClick = function( data ) {
	// It is susceptible to click event only when it is scrollable
	if ( this.scrollable && ! this.hasFocus ) {
		this.document.giveFocusTo( this , 'select' ) ;
	}
} ;



Container.prototype.onWheel = function( data ) {
	// It's a "tiny" scroll
	if ( ! this.hasFocus ) {
		this.document.giveFocusTo( this , 'select' ) ;
	}

	if ( this.scrollable ) {
		this.scroll( 0 , -data.yDirection * Math.ceil( this.viewportHeight / 5 ) ) ;
	}
} ;



Container.prototype.onDrag = function( data ) {
	if ( ! this.movable || ( ! data.dx && ! data.dy ) ) { return ; }
	this.move( data.dx , data.dy ) ;
} ;

