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



const Element = require( './Element.js' ) ;
const Slider = require( './Slider.js' ) ;

const ScreenBuffer = require( '../ScreenBuffer.js' ) ;
const TextBuffer = require( '../TextBuffer.js' ) ;
const Rect = require( '../Rect.js' ) ;

const string = require( 'string-kit' ) ;



function TextBox( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	Element.call( this , options ) ;

	this.onKey = this.onKey.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;
	this.onDrag = this.onDrag.bind( this ) ;
	this.onWheel = this.onWheel.bind( this ) ;
	this.onParentResize = this.onParentResize.bind( this ) ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	this.textAttr = options.textAttr || options.attr || { bgColor: 'default' } ;
	this.altTextAttr = options.altTextAttr || Object.assign( {} , this.textAttr , { color: 'gray' , italic: true } ) ;
	this.voidAttr = options.voidAttr || options.emptyAttr || options.attr || { bgColor: 'default' } ;

	this.scrollable = !! options.scrollable ;
	this.hasVScrollBar = this.scrollable && !! options.vScrollBar ;
	this.hasHScrollBar = this.scrollable && !! options.hScrollBar ;
	this.scrollX = options.scrollX || 0 ;
	this.scrollY = options.scrollY || 0 ;

	// false: scroll down to the bottom of the content, both content bottom and textBox bottom on the same cell
	// true: scroll down until the bottom of the content reaches the top of the textBox
	this.extraScrolling = !! options.extraScrolling ;

	// Right shift of the first-line, may be useful for prompt, or continuing another box in the flow
	this.firstLineRightShift = options.firstLineRightShift || 0 ;

	this.wordWrap = !! ( options.wordWrap || options.wordwrap ) ;
	this.lineWrap = !! ( options.lineWrap || this.wordWrap ) ;

	this.hiddenContent = options.hiddenContent ;

	this.stateMachine = options.stateMachine ;

	this.textAreaWidth = this.hasVScrollBar ? this.outputWidth - 1 : this.outputWidth ;
	this.textAreaHeight = this.hasHScrollBar ? this.outputHeight - 1 : this.outputHeight ;

	this.textBuffer = null ;
	this.altTextBuffer = null ;
	this.vScrollBarSlider = null ;
	this.hScrollBarSlider = null ;

	this.on( 'key' , this.onKey ) ;
	this.on( 'click' , this.onClick ) ;
	this.on( 'drag' , this.onDrag ) ;
	this.on( 'wheel' , this.onWheel ) ;
	this.on( 'parentResize' , this.onParentResize ) ;

	this.initChildren() ;

	if ( this.setContent === TextBox.prototype.setContent ) {
		this.setContent( options.content , options.contentHasMarkup , true ) ;
	}

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'TextBox' && ! options.noDraw ) { this.draw() ; }
}

module.exports = TextBox ;

TextBox.prototype = Object.create( Element.prototype ) ;
TextBox.prototype.constructor = TextBox ;
TextBox.prototype.elementType = 'TextBox' ;



// Support for strictInline mode
TextBox.prototype.strictInlineSupport = true ;



TextBox.prototype.destroy = function( isSubDestroy , noDraw = false ) {
	if ( this.destroyed ) { return ; }

	this.off( 'key' , this.onKey ) ;
	this.off( 'click' , this.onClick ) ;
	this.off( 'drag' , this.onDrag ) ;
	this.off( 'wheel' , this.onWheel ) ;
	this.off( 'parentResize' , this.onParentResize ) ;

	Element.prototype.destroy.call( this , isSubDestroy , noDraw ) ;
} ;



TextBox.prototype.keyBindings = {
	UP: 'tinyScrollUp' ,
	DOWN: 'tinyScrollDown' ,
	PAGE_UP: 'scrollUp' ,
	PAGE_DOWN: 'scrollDown' ,
	' ': 'scrollDown' ,
	HOME: 'scrollTop' ,
	END: 'scrollBottom' ,
	LEFT: 'scrollLeft' ,
	RIGHT: 'scrollRight' ,
	CTRL_O: 'copyClipboard'
} ;



TextBox.prototype.initChildren = function() {
	this.textBuffer = new TextBuffer( {
		dst: this.outputDst ,
		//palette: this.document.palette ,
		x: this.outputX ,
		y: this.outputY ,
		//width: this.textAreaWidth ,
		//height: this.textAreaHeight
		firstLineRightShift: this.firstLineRightShift ,
		lineWrapWidth: this.lineWrap ? this.textAreaWidth : null ,
		wordWrap: this.wordWrap ,
		dstClipRect: {
			x: this.outputX ,
			y: this.outputY ,
			width: this.textAreaWidth ,
			height: this.textAreaHeight
		} ,
		hidden: this.hiddenContent ,
		forceInBound: true ,
		stateMachine: this.stateMachine
	} ) ;

	this.textBuffer.setDefaultAttr( this.textAttr ) ;
	this.textBuffer.setVoidAttr( this.voidAttr ) ;


	if ( this.useAltTextBuffer ) {
		this.altTextBuffer = new TextBuffer( {
			firstLineRightShift: this.firstLineRightShift ,
			lineWrapWidth: this.lineWrap ? this.textAreaWidth : null ,
			wordWrap: this.wordWrap ,
			dstClipRect: {
				x: this.outputX ,
				y: this.outputY ,
				width: this.textAreaWidth ,
				height: this.textAreaHeight
			}
			//, stateMachine: this.stateMachine
		} ) ;

		this.altTextBuffer.setDefaultAttr( this.altTextAttr ) ;
		this.altTextBuffer.setVoidAttr( this.voidAttr ) ;
		this.textBuffer.setVoidTextBuffer( this.altTextBuffer ) ;
	}


	if ( this.hasVScrollBar ) {
		this.vScrollBarSlider = new Slider( {
			internal: true ,
			parent: this ,
			x: this.outputX + this.outputWidth - 1 ,
			y: this.outputY ,
			height: this.outputHeight ,
			isVertical: true ,
			valueToRate: scrollY => -scrollY / Math.max( 1 , this.textBuffer.buffer.length - this.textAreaHeight ) ,
			rateToValue: rate => -rate * Math.max( 1 , this.textBuffer.buffer.length - this.textAreaHeight ) ,
			noDraw: true
		} ) ;

		this.vScrollBarSlider.on( 'slideStep' , d => this.scroll( 0 , -d * Math.ceil( this.textAreaHeight / 2 ) ) ) ;
		this.vScrollBarSlider.on( 'slide' , value => this.scrollTo( null , value ) ) ;
	}

	if ( this.hasHScrollBar ) {
		this.hScrollBarSlider = new Slider( {
			internal: true ,
			parent: this ,
			x: this.outputX ,
			y: this.outputY + this.outputHeight - 1 ,
			width: this.outputWidth - this.hasVScrollBar ,
			valueToRate: scrollX => {
				var lineWidth = this.textBuffer.getContentSize().width ;
				return -scrollX / Math.max( 1 , lineWidth - this.textAreaWidth ) ;
			} ,
			rateToValue: rate => {
				var lineWidth = this.textBuffer.getContentSize().width ;
				return -rate * Math.max( 1 , lineWidth - this.textAreaWidth ) ;
			} ,
			noDraw: true
		} ) ;

		this.hScrollBarSlider.on( 'slideStep' , d => this.scroll( -d * Math.ceil( this.textAreaWidth / 2 ) , 0 ) ) ;
		this.hScrollBarSlider.on( 'slide' , value => this.scrollTo( value , null ) ) ;
	}
} ;



TextBox.prototype.setSizeAndPosition = function( options ) {
	this.outputX =
		options.outputX !== undefined ? options.outputX :
		options.x !== undefined ? options.x :
		this.outputX || 0 ;
	this.outputY =
		options.outputY !== undefined ? options.outputY :
		options.y !== undefined ? options.y :
		this.outputY || 0 ;
	this.outputWidth =
		options.outputWidth !== undefined ? options.outputWidth :
		options.width !== undefined ? options.width :
		this.outputWidth || 1 ;
	this.outputHeight =
		options.outputHeight !== undefined ? options.outputHeight :
		options.height !== undefined ? options.height :
		this.outputHeight || 1 ;

	this.textAreaWidth = this.hasVScrollBar ? this.outputWidth - 1 : this.outputWidth ;
	this.textAreaHeight = this.hasHScrollBar ? this.outputHeight - 1 : this.outputHeight ;

	this.textBuffer.lineWrapWidth = this.lineWrap ? this.textAreaWidth : null ;
	if ( this.altTextBuffer ) { this.altTextBuffer.lineWrapWidth = this.lineWrap ? this.textAreaWidth : null ; }

	this.textBuffer.x = this.outputX ;
	this.textBuffer.y = this.outputY ;

	this.textBuffer.dstClipRect = new Rect( {
		x: this.outputX ,
		y: this.outputY ,
		width: this.textAreaWidth ,
		height: this.textAreaHeight
	} ) ;

	// Update word-wrap
	if ( this.lineWrap ) {
		this.textBuffer.wrapAllLines() ;
		if ( this.altTextBuffer ) { this.altTextBuffer.wrapAllLines() ; }
	}

	if ( this.vScrollBarSlider ) {
		this.vScrollBarSlider.setSizeAndPosition( {
			outputX: this.outputX + this.outputWidth - 1 ,
			outputY: this.outputY ,
			outputHeight: this.outputHeight
		} ) ;
	}

	if ( this.hScrollBarSlider ) {
		this.hScrollBarSlider.setSizeAndPosition( {
			outputX: this.outputX ,
			outputY: this.outputY + this.outputHeight - 1 ,
			outputWidth: this.hasVScrollBar ? this.outputWidth - 1 : this.outputWidth
		} ) ;
	}
} ;



TextBox.prototype.preDrawSelf = function() {
	// It's best to force the dst now, because it avoids to set textBuffer.dst everytime it changes,
	// and it could be changed by userland (so hard to keep it in sync without setters/getters)
	this.textBuffer.draw( { dst: this.outputDst } ) ;
} ;



TextBox.prototype.scroll = function( dx , dy , dontDraw = false ) {
	return this.scrollTo( dx ? this.scrollX + dx : null , dy ? this.scrollY + dy : null , dontDraw ) ;
} ;



TextBox.prototype.scrollToTop = function( dontDraw = false ) {
	return this.scrollTo( null , 0 , dontDraw ) ;
} ;



TextBox.prototype.scrollToBottom = function( dontDraw = false ) {
	// Ignore extra scrolling here
	return this.scrollTo( null , this.textAreaHeight - this.textBuffer.buffer.length , dontDraw ) ;
} ;



TextBox.prototype.scrollTo = function( x , y , noDraw = false ) {
	if ( ! this.scrollable ) { return ; }

	if ( x !== undefined && x !== null ) {
		// Got a +1 after content size because of the word-wrap thing and eventual invisible \n
		this.scrollX = Math.min( 0 , Math.max( Math.round( x ) ,
			( this.extraScrolling ? 1 : this.textAreaWidth ) - this.textBuffer.getContentSize().width + 1
		) ) ;

		this.textBuffer.x = this.outputX + this.scrollX ;
	}

	if ( y !== undefined && y !== null ) {
		this.scrollY = Math.min( 0 , Math.max( Math.round( y ) ,
			( this.extraScrolling ? 1 : this.textAreaHeight ) - this.textBuffer.buffer.length
		) ) ;

		this.textBuffer.y = this.outputY + this.scrollY ;
	}

	if ( this.vScrollBarSlider ) {
		this.vScrollBarSlider.setValue( this.scrollY , true ) ;
	}

	if ( this.hScrollBarSlider ) {
		this.hScrollBarSlider.setValue( this.scrollX , true ) ;
	}

	if ( ! noDraw ) { this.draw() ; }
} ;



TextBox.prototype.autoScrollAndDraw = function( onlyDrawCursor = false ) {
	var x , y ;

	// We use cx-1 because at least we want to see the char just before the cursor (backspace, etc...)
	// But do nothing if there is no scrolling yet (do not set x to 0 if it's unnecessary)
	if ( this.textBuffer.cx - 1 < -this.scrollX && this.scrollX !== 0 ) {
		x = -Math.max( 0 , this.textBuffer.cx - 1 ) ;
	}
	else if ( this.textBuffer.cx > this.textAreaWidth - this.scrollX - 1 ) {
		x = this.textAreaWidth - 1 - this.textBuffer.cx ;
	}

	if ( this.textBuffer.cy < -this.scrollY ) {
		y = -this.textBuffer.cy ;
	}
	else if ( this.textBuffer.cy > this.textAreaHeight - this.scrollY - 1 ) {
		y = this.textAreaHeight - 1 - this.textBuffer.cy ;
	}

	if ( x !== undefined || y !== undefined ) {
		// .scrollTo() call .draw(), so no need to do that here...
		this.scrollTo( x , y ) ;
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



TextBox.prototype.getContentSize = function() {
	return this.textBuffer.getContentSize() ;
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
	this.contentHasMarkup = hasMarkup ;

	this.textBuffer.setText( this.content , this.contentHasMarkup , this.textAttr ) ;

	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
	}

	// Move the cursor at the end of the input
	this.textBuffer.moveToEndOfBuffer() ;

	if ( ! dontDraw ) {
		this.drawCursor() ;
		this.redraw() ;
	}
} ;



// Get content for alternate textBuffer
TextBox.prototype.getAltContent = function() {
	if ( ! this.altTextBuffer ) { return null ; }
	return this.altTextBuffer.getText() ;
} ;



// Set content for alternate textBuffer
TextBox.prototype.setAltContent = function( content , hasMarkup , dontDraw ) {
	if ( ! this.altTextBuffer ) { return ; }

	var contentSize ;

	if ( typeof content !== 'string' ) {
		if ( content === null || content === undefined ) { content = '' ; }
		else { content = '' + content ; }
	}

	//this.content = content ;
	//this.contentHasMarkup = hasMarkup ;

	this.altTextBuffer.setText( content , hasMarkup , this.altTextAttr ) ;

	//if ( this.stateMachine ) { this.altTextBuffer.runStateMachine() ; }

	if ( ! dontDraw ) {
		this.drawCursor() ;
		this.redraw() ;
	}
} ;



TextBox.prototype.prependContent = function( content , dontDraw ) { return this.addContent( content , 'prepend' , dontDraw ) ; } ;
TextBox.prototype.appendContent = function( content , dontDraw ) { return this.addContent( content , 'append' , dontDraw ) ; } ;
TextBox.prototype.appendLog = function( content , dontDraw ) { return this.addContent( content , 'appendLog' , dontDraw ) ; } ;



TextBox.prototype.addContent = function( content , mode , dontDraw ) {
	var contentSize , scroll = false ;

	if ( typeof content !== 'string' ) {
		if ( content === null || content === undefined ) { content = '' ; }
		else { content = '' + content ; }
	}

	switch ( mode ) {
		case 'prepend' :
			this.content = content + this.content ;
			this.textBuffer.prepend( content , this.contentHasMarkup , this.textAttr ) ;
			break ;
		case 'appendLog' :
			scroll = this.textBuffer.buffer.length <= this.textAreaHeight || this.scrollY <= this.textAreaHeight - this.textBuffer.buffer.length ;
			content = '\n' + content ;
			this.content += content ;
			this.textBuffer.append( content , this.contentHasMarkup , this.textAttr ) ;
			break ;
		case 'append' :
		default :
			this.content += content ;
			this.textBuffer.append( content , this.contentHasMarkup , this.textAttr ) ;
			break ;
	}

	if ( this.stateMachine ) {
		this.textBuffer.runStateMachine() ;
	}

	// Move the cursor at the end of the input
	this.textBuffer.moveToEndOfBuffer() ;

	if ( scroll ) {
		this.scrollToBottom( dontDraw ) ;
	}
	else if ( ! dontDraw ) {
		// Set it again to the scrollY value: it forces re-computing of the slider rate depending on new content
		if ( this.vScrollBarSlider ) {
			this.vScrollBarSlider.setValue( this.scrollY , true ) ;
		}

		this.drawCursor() ;
		this.draw() ;
		//this.redraw() ;
	}
} ;



TextBox.prototype.onKey = function( key , trash , data ) {
	switch( this.keyBindings[ key ] ) {
		case 'tinyScrollUp' :
			this.scroll( 0 , Math.ceil( this.textAreaHeight / 5 ) ) ;
			break ;

		case 'tinyScrollDown' :
			this.scroll( 0 , -Math.ceil( this.textAreaHeight / 5 ) ) ;
			break ;

		case 'scrollUp' :
			this.scroll( 0 , Math.ceil( this.textAreaHeight / 2 ) ) ;
			break ;

		case 'scrollDown' :
			this.scroll( 0 , -Math.ceil( this.textAreaHeight / 2 ) ) ;
			break ;

		case 'scrollLeft' :
			this.scroll( Math.ceil( this.textAreaWidth / 2 ) , 0 ) ;
			break ;

		case 'scrollRight' :
			this.scroll( -Math.ceil( this.textAreaWidth / 2 ) , 0 ) ;
			break ;

		case 'scrollTop' :
			this.scrollToTop() ;
			break ;

		case 'scrollBottom' :
			this.scrollToBottom() ;
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
	if ( ! this.hasFocus ) {
		this.document.giveFocusTo( this , 'select' ) ;
	}

	if ( this.scrollable ) {
		this.scroll( 0 , -data.yDirection * Math.ceil( this.textAreaHeight / 5 ) ) ;
	}
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



TextBox.prototype.onParentResize = function() {
	if ( ! this.autoWidth && ! this.autoHeight ) { return ; }

	var options = {} ;

	if ( this.autoWidth ) {
		options.outputWidth = Math.round( this.outputDst.width * this.autoWidth ) ;
	}

	if ( this.autoHeight ) {
		options.outputHeight = Math.round( this.outputDst.height * this.autoHeight ) ;
	}

	this.setSizeAndPosition( options ) ;
	this.draw() ;
} ;

