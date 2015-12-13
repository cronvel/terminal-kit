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


function Text() { throw new Error( 'Use Text.create() instead' ) ; }
module.exports = Text ;
Text.prototype = Object.create( Element.prototype ) ;
Text.prototype.constructor = Text ;
Text.prototype.elementType = 'text' ;



Text.create = function createText( options )
{
	var text = Object.create( Text.prototype ) ;
	text.create( options ) ;
	return text ;
} ;



Text.prototype.create = function createText( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	Element.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		attr: { value: options.attr || {} , enumerable: true , writable: true } ,
	} ) ;
	
	this.draw() ;
} ;



Text.prototype.draw = function draw()
{
	if ( ! this.dst ) { return ; }
	
	this.dst.put( { x: this.x , y: this.y , attr: this.attr } , this.content ) ;
	
	// Move the cursor back to the first cell?
	//this.dst.moveTo( this.x , this.y ) ;
} ;


