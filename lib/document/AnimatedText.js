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



const Text = require( './Text.js' ) ;
const spChars = require( '../spChars.js' ) ;



function AnimatedText( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	options.attr = options.attr || {} ;

	if ( Array.isArray( options.animation ) ) {
		this.animation = options.animation ;
	}
	else if ( typeof options.animation === 'string' ) {
		this.animation = spChars.animation[ options.animation ] || spChars.animation.lineSpinner ;
	}
	else {
		this.animation = spChars.animation.lineSpinner ;
	}
	
	this.animation = this.animation.map( e => Array.isArray( e ) ? e : [ e ] ) ;

	this.isAnimated = false ;
	this.frameDuration = options.frameDuration || 200 ;
	this.frame = options.frame || 0 ;
	this.timer = null ;

	options.content = this.animation[ this.frame ] ;
	
	Text.call( this , options ) ;

	if ( this.elementType === 'AnimatedText' && ! options.noDraw ) {
		this.draw() ;
		this.animate() ;
	}
}

module.exports = AnimatedText ;

AnimatedText.prototype = Object.create( Text.prototype ) ;
AnimatedText.prototype.constructor = AnimatedText ;
AnimatedText.prototype.elementType = 'AnimatedText' ;



AnimatedText.prototype.animate = function( isAnimated = true , frameDuration = this.frameDuration ) {
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



AnimatedText.prototype.update = function() {
	var lastContent = this.content ;
	this.frame = ( this.frame + 1 ) % this.animation.length ;
	this.content = this.animation[ this.frame ] ;

	if ( this.content !== lastContent ) { this.draw() ; }
} ;

