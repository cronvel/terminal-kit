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
		* options `object` of options, all of them are OPTIONAL, where:
			* width: `number` the total width of the progress bar, default to the max available width
			* percent: `boolean` if true, it shows the progress in percent alongside with the progress bar
			* barStyle `function` the style of the progress bar items, default to `term.cyan`
			* barBracketStyle `function` the style of the progress bar bracket character, default to options.barStyle if given
			  or `term.blue`
			* percentStyle `function` the style of percent value string, default to `term.yellow`
			* barChar `string` the char used for the bar, default to '='
			* barHeadChar `string` the char used for the bar, default to '>'
*/
module.exports = function progressBar( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var self = this , controler = {} , progress = 0 , ready = false ,
		width , y , startX , endX ;
	
	width = options.width || this.width ;
	
	if ( ! options.barBracketStyle )
	{
		if ( options.barStyle ) { options.barBracketStyle = options.barStyle ; }
		else { options.barBracketStyle = this.blue ; }
	}
	
	if ( ! options.barStyle ) { options.barStyle = this.cyan ; }
	if ( ! options.percentStyle ) { options.percentStyle = this.yellow ; }
	
	if ( ! options.barChar ) { options.barChar = '=' ; }
	else { options.barChar = options.barChar[ 0 ] ; }
	
	if ( ! options.barHeadChar ) { options.barHeadChar = '>' ; }
	else { options.barHeadChar = options.barHeadChar[ 0 ] ; }
	
	var redraw = function redraw() {
		
		var i , innerBarSize , progressSize , voidSize , progressBar = '' , voidBar = '' , percent = '' ;
		
		if ( ! ready ) { return ; }
		
		self.saveCursor() ;
		self.moveTo( startX , y ) ;
		
		//self.noFormat( Math.floor( progress * 100 ) + '%' ) ;
		
		innerBarSize = width - 2 ;
		
		if ( options.percent )
		{
			innerBarSize -= 4 ;
			percent = ( '   ' + Math.round( progress * 100 ) + '%' ).slice( -4 ) ;
		}
		
		progressSize = Math.round( innerBarSize * progress ) ;
		voidSize = innerBarSize - progressSize ;
		
		if ( progressSize )
		{
			i = progressSize - 1 ;
			while ( i -- ) { progressBar += options.barChar ; }
			progressBar += options.barHeadChar ;
		}
		
		i = voidSize ;
		while ( i -- ) { voidBar += ' ' ; }
		
		if ( percent ) { options.percentStyle( percent ) ; }
		options.barBracketStyle( '[' ) ;
		options.barStyle( progressBar ) ;
		self( voidBar ) ;
		options.barBracketStyle( ']' ) ;
		
		self.restoreCursor() ;
	} ;
	
	
	// Get the cursor location before getting started
	
	this.getCursorLocation( function( error , x_ , y_ ) {
		startX = x_ ;
		endX = Math.min( x_ + width , self.width ) ;
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


