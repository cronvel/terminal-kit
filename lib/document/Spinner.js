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
const spChars = require( '../spChars.js' ) ;



function Spinner( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	this.attr = options.attr || {} ;

	if ( Array.isArray( options.animation ) ) {
		this.animation = options.animation.filter( e => e && typeof e === 'string' ) ;
	}
	else if ( typeof options.animation === 'string' ) {
		this.animation = spChars.spinner[ options.animation ] || spChars.spinner.ascii ;
	}
	else {
		this.animation = spChars.spinner.ascii ;
	}

	this.isAnimated = false ;
	this.frameDuration = options.frameDuration || 200 ;
	this.frame = options.frame || 0 ;
	this.timer = null ;

	options.content = this.animation[ this.frame ] ;
	options.width = Math.max( ... this.animation.map( e => Element.computeContentWidth( e , options.contentHasMarkup ) ) ) ;
	options.height = 1 ;
	
	Element.call( this , options ) ;

	if ( this.elementType === 'Spinner' && ! options.noDraw ) {
		this.draw() ;
		this.animate() ;
	}
}

module.exports = Spinner ;

Spinner.prototype = Object.create( Element.prototype ) ;
Spinner.prototype.constructor = Spinner ;
Spinner.prototype.elementType = 'Spinner' ;



Spinner.prototype.animate = function( isAnimated = true , frameDuration = this.frameDuration ) {
	this.isAnimated = !! isAnimated ;
	this.frameDuration = frameDuration ;

	if ( this.timer ) { clearInterval( this.timer ) ; }
	this.timer = null ;

	if ( this.isAnimated ) {
		if ( this.timer ) { clearInterval( this.timer ) ; }
		this.timer = setInterval(
			() => this.update() ,
			this.frameDuration
		) ;
	}
} ;



Spinner.prototype.update = function() {
	this.frame = ( this.frame + 1 ) % this.animation.length ;
	this.content = this.animation[ this.frame ] ;
	this.draw() ;
} ;



Spinner.prototype.postDrawSelf = function() {
	if ( ! this.outputDst ) { return this ; }

	// Write the content
	this.outputDst.put( {
			x: this.outputX ,
			y: this.outputY ,
			attr: this.attr ,
			markup: this.contentHasMarkup
		} ,
		this.content
	) ;
} ;

