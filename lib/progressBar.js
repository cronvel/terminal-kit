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
//var string = require( 'string-kit' ) ;



/*
	progressBar( options )
*/
module.exports = function progressBar( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var self = this , controler = {} , progress = 0 , ready = false ,
		width , y , startX , endX ;
	
	
	var redraw = function redraw() {
		
		var i , maxSize , progressSize , voidSize , innerBar = '' ;
		
		if ( ! ready ) { return ; }
		
		self.saveCursor() ;
		self.moveTo( startX , y ) ;
		
		//self.noFormat( Math.floor( progress * 100 ) + '%' ) ;
		
		maxSize = width - 2 ;
		progressSize = Math.round( maxSize * progress ) ;
		voidSize = maxSize - progressSize ;
		
		i = progressSize ;
		while ( i -- ) { innerBar += '=' ; }
		
		i = voidSize ;
		while ( i -- ) { innerBar += ' ' ; }
		
		//console.error( startX , endX , width , i , innerBar ) ;
		self.blue( '[' ).cyan( innerBar ).blue( ']' ) ;
		
		self.restoreCursor() ;
	} ;
	
	
	// Get the cursor location before getting started
	
	this.getCursorLocation( function( error , x_ , y_ ) {
		startX = x_ ;
		endX = self.width ;
		y = y_ ;
		width = endX - startX ;
		ready = true ;
		redraw() ;
	} ) ;
	
	
	controler.update = function update( value ) {
		
		if ( typeof value !== 'number' ) { throw new TypeError( "[terminal] .progressBar().progress(): argument #0 should be a number" ) ; }
		
		if ( value > 1 ) { value = 1 ; }
		else if ( value < 0 ) { value = 0 ; }
		
		// Not sure if it is a good thing to let the user set it to a value that is lesser than the current one
		
		progress = value ;
		
		redraw() ;
	} ;
	
	
	return controler ;
} ;


