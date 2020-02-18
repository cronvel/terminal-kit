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
const Slider = require( './Slider.js' ) ;

const ScreenBuffer = require( '../ScreenBuffer.js' ) ;
const TextBuffer = require( '../TextBuffer.js' ) ;
const Rect = require( '../Rect.js' ) ;

const string = require( 'string-kit' ) ;



function TextBox( options = {} ) {
	Element.call( this , options ) ;

	this.onKey = this.onKey.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;
	this.onDrag = this.onDrag.bind( this ) ;
	this.onWheel = this.onWheel.bind( this ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	// TextBuffer needs computed attr, not object one
	// /!\ ... and this should be fixed! /!\
	this.textAttr = this.document.object2attr( options.textAttr || options.attr || { bgColor: 'default' } ) ;
	this.emptyAttr = this.document.object2attr( options.emptyAttr || options.attr || { bgColor: 'default' } ) ;

	this.scrollable = !! options.scrollable ;
	this.hasVScrollBar = this.scrollable && !! options.vScrollBar ;
	this.scrollX = options.scrollX || 0 ;
	this.scrollY = options.scrollY || 0 ;

	// false: scroll down to the bottom of the content, both content bottom and textBox bottom on the same cell
	// true: scroll down until the bottom of the content reaches the top of the textBox
	this.extraScrolling = !! options.extraScrolling ;

	this.wordwrap = !! options.wordwrap ;

	this.hiddenContent = options.hiddenContent ;

	this.stateMachine = options.stateMachine ;

	this.textBuffer = new TextBuffer( {
		dst: this.outputDst ,
		//palette: this.document.palette ,
		x: this.outputX ,
		y: this.outputY ,
		width: this.hasVScrollBar ? this.outputWidth - 1 : this.outputWidth ,
		//height: this.outputHeight ,
		wordwrap: this.wordwrap ,
		wrap: true ,
		dstClipRect: {
			x: this.outputX ,
			y: this.outputY ,
			width: this.hasVScrollBar ? this.outputWidth - 1 : this.outputWidth ,
			height: this.outputHeight
		} ,
		hidden: this.hiddenContent ,
		forceInBound: true ,
		stateMachine: this.stateMachine
	} ) ;

	this.textBuffer.setEmptyCellAttr( this.emptyAttr ) ;

	if ( this.setContent === TextBox.prototype.setContent ) {
		this.setContent( options.content , options.contentHasMarkup , true ) ;
	}

	this.on( 'key' , this.onKey ) ;
	this.on( 'click' , this.onClick ) ;
	this.on( 'drag' , this.onDrag ) ;
	this.on( 'wheel' , this.onWheel ) ;

	this.vScrollBarSlider = null ;

	this.initChildren() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'TextBox' && ! options.noDraw ) { this.draw() ; }
}

module.exports = TextBox ;

TextBox.prototype = Object.create( Element.prototype ) ;
TextBox.prototype.constructor = TextBox ;
TextBox.prototype.elementType = 'TextBox' ;



TextBox.prototype.destroy = function( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'click' , this.onClick ) ;
	this.off( 'drag' , this.onDrag ) ;
	this.off( 'wheel' , this.onWheel ) ;

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



TextBox.prototype.initChildren = function() {
	if ( ! this.hasVScrollBar ) { return ; }

	this.vScrollBarSlider = new Slider( {
		parent: this ,
		x: this.outputX + this.outputWidth - 1 ,
		y: this.outputY ,
		height: this.outputHeight ,
		isVertical: true ,
		valueToRate: scrollY => -scrollY / Math.max( 1 , this.textBuffer.buffer.length - this.outputHeight ) ,
		rateToValue: rate => -rate * Math.max( 1 , this.textBuffer.buffer.length - this.outputHeight ) ,
		noDraw: true
	} ) ;

	this.vScrollBarSlider.on( 'slideStep' , d => this.scroll( 0 , -d * Math.ceil( this.outputHeight / 2 ) ) ) ;
	this.vScrollBarSlider.on( 'slide' , value => {
		this.scrollTo( 0 , value ) ;
		this.draw() ;
	} ) ;
} ;



TextBox.prototype.keyBindings = {
	UP: 'tinyScrollUp' ,
	DOWN: 'tinyScrollDown' ,
	PAGE_UP: 'scrollUp' ,
	PAGE_DOWN: 'scrollDown' ,
	' ': 'scrollDown' ,
	HOME: 'scrollTop' ,
	END: 'scrollBottom' ,
	CTRL_O: 'copyClipboard'
} ;



TextBox.prototype.preDrawSelf = function() {
	this.textBuffer.draw() ;
} ;



TextBox.prototype.scroll = function( dx , dy ) {
	return this.scrollTo( dx ? this.scrollX + dx : null , dy ? this.scrollY + dy : null ) ;
} ;



TextBox.prototype.scrollTo = function( x , y , internalAndNoDraw = false ) {
	if ( ! this.scrollable ) { return ; }

	if ( x !== undefined || x !== null ) {
		this.scrollX = Math.min( 0 , Math.round( x ) ) ;
		this.textBuffer.x = this.outputX + this.scrollX ;
	}

	if ( y !== undefined || y !== null ) {
		this.scrollY = Math.min( 0 , Math.max( Math.round( y ) ,
			( this.extraScrolling ? 1 : this.outputHeight ) - this.textBuffer.buffer.length )
		) ;

		this.textBuffer.y = this.outputY + this.scrollY ;
	}

	if ( ! internalAndNoDraw ) {
		if ( this.vScrollBarSlider ) {
			this.vScrollBarSlider.setValue( this.scrollY , true ) ;
		}

		this.draw() ;
	}
} ;



TextBox.prototype.autoScrollAndDraw = function( onlyDrawCursor = false ) {
	var dx = 0 , dy = 0 ;

	if ( this.textBuffer.cx < -this.scrollX ) {
		dx = -this.scrollX - this.textBuffer.cx ;
	}
	else if ( this.textBuffer.cx > this.outputWidth - this.scrollX - 1 ) {
		dx = this.outputWidth - this.scrollX - 1 - this.textBuffer.cx ;
	}

	if ( this.textBuffer.cy < -this.scrollY ) {
		dy = -this.scrollY - this.textBuffer.cy ;
	}
	else if ( this.textBuffer.cy > this.outputHeight - this.scrollY - 1 ) {
		dy = this.outputHeight - this.scrollY - 1 - this.textBuffer.cy ;
	}

	if ( dx || dy ) {
		// .scroll() call .draw(), so no need to do that here...
		this.scroll( dx , dy ) ;
	}
	else if ( ! onlyDrawCursor ) {
		this.draw() ;
	}
	else {
		this.drawCursor() ;
	}
} ;



TextBox.prototype.autoScrollAndDrawCursor = function() {
	return this.autoScrollAndDraw( true ) ;
} ;



TextBox.prototype.getContent = function() {
	return this.textBuffer.getText() ;
} ;



TextBox.prototype.setContent = function( content , hasMarkup , dontDraw ) {
	var contentSize ;

	if ( typeof content !== 'string' ) {
		if ( content === null || content === undefined ) { content = '' ; }
		else { content = '' + content ; }
	}

	this.content = content ;
	this.contentHasMarkup = !! hasMarkup ;

	//if ( hasMarkup ) { throw new Error( 'TextBox does not support markup' ) ; }

	this.textBuffer.setText( this.content , this.contentHasMarkup ) ;

	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
	}
	else if ( ! this.contentHasMarkup ) {
		this.textBuffer.setAttrCodeRegion( this.textAttr ) ;
	}

	// Move the cursor at the end of the input
	this.textBuffer.moveToEndOfLine() ;

	if ( ! dontDraw ) {
		this.drawCursor() ;
		this.redraw() ;
	}
} ;



TextBox.prototype.onKey = function( key , trash , data ) {
	switch( this.keyBindings[ key ] ) {
		case 'tinyScrollUp' :
			this.scroll( 0 , Math.ceil( this.outputHeight / 5 ) ) ;
			break ;

		case 'tinyScrollDown' :
			this.scroll( 0 , -Math.ceil( this.outputHeight / 5 ) ) ;
			break ;

		case 'scrollUp' :
			this.scroll( 0 , Math.ceil( this.outputHeight / 2 ) ) ;
			break ;

		case 'scrollDown' :
			this.scroll( 0 , -Math.ceil( this.outputHeight / 2 ) ) ;
			break ;

		case 'scrollTop' :
			this.scroll( 0 , 0 ) ;
			break ;

		case 'scrollBottom' :
			// Ignore extra scrolling here
			this.scroll( 0 , this.outputHeight - this.textBuffer.buffer.length ) ;
			break ;

		case 'copyClipboard' :
			if ( this.document ) {
				this.document.setClipboard( this.textBuffer.getSelectionText() ).catch( () => undefined ) ;
			}
			break ;

		default :
			return ;	// Bubble up
	}

	return true ;		// Do not bubble up
} ;



TextBox.prototype.onClick = function( data ) {
	// It is susceptible to click event only when it is scrollable
	if ( this.scrollable && ! this.hasFocus ) {
		this.document.giveFocusTo( this , 'select' ) ;
	}
} ;



TextBox.prototype.onWheel = function( data ) {
	// It's a "tiny" scroll
	this.scroll( 0 , -data.yDirection * Math.ceil( this.outputHeight / 5 ) ) ;
} ;



TextBox.prototype.onDrag = function( data ) {
	var xmin , ymin , xmax , ymax ;

	if ( ! this.hasFocus ) {
		this.document.giveFocusTo( this , 'select' ) ;
	}

	if ( data.yFrom < data.y || ( data.yFrom === data.y && data.xFrom <= data.x ) ) {
		ymin = data.yFrom ;
		ymax = data.y ;
		xmin = data.xFrom ;
		xmax = data.x ;
	}
	else {
		ymin = data.y ;
		ymax = data.yFrom ;
		xmin = data.x ;
		xmax = data.xFrom ;
	}

	this.textBuffer.setSelectionRegion( {
		xmin: xmin - this.scrollX ,
		xmax: xmax - this.scrollX ,
		ymin: ymin - this.scrollY ,
		ymax: ymax - this.scrollY
	} ) ;

	if ( this.document ) {
		this.document.setClipboard( this.textBuffer.getSelectionText() , 'primary' ).catch( () => undefined ) ;
	}

	this.draw() ;
} ;

