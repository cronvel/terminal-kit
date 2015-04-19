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



/*
	options:
		* echo `boolean` if input should be echoed
*/
module.exports = function inputField( options , callback )
{
	if ( arguments.length <= 0 ) { throw new Error( '[terminal] inputField(): should at least provide one callback as argument' ) ; }
	if ( arguments.length === 1 ) { callback = options ; options = undefined ; }
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( options.echo === undefined ) { options.echo = true ; }
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	
	
	var self = this , controler , finished = false ,
		offset = 0 , echo = !! options.echo ,
		start = {} , end = {} , cursor = {} ,
		inputs = Array.isArray( options.history ) ? options.history.slice().concat( '' ) : [ '' ] ,
		inputIndex = inputs.length - 1 ;
	
	
	
	// Compute the coordinate of the cursor and end of a string, given a start coordinate
	var computeAllCoordinate = function computeAllCoordinate()
	{
		end = offsetCoordinate( inputs[ inputIndex ].length ) ;
		
		if ( end.y > self.height )
		{
			start.y -= end.y - self.height ;
			end.y = self.height ;
		}
		
		cursor = offsetCoordinate( offset ) ;
	} ;
	
	
	
	// Compute the coordinate of an offset, given a start coordinate
	var offsetCoordinate = function offsetCoordinate( offset )
	{
		return {
			x: 1 + ( start.x + offset - 1 ) % self.width ,
			y: start.y + Math.floor( ( start.x + offset - 1 ) / self.width )
		} ;
	} ;
	
	
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = function redraw()
	{
		self.moveTo( start.x , start.y , inputs[ inputIndex ] ) ;
		self.moveTo.eraseLineAfter( end.x , end.y ) ;
		self.moveTo( cursor.x , cursor.y ) ;
	} ;
	
	
	
	var onEvent = function onEvent( key ) {
		
		if ( finished ) { return ; }
		
		if ( key.length === 1 )
		{
			// if length = 1, this is a regular UTF8 character, not a special key
			
			// Insert version
			inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset ) + key + inputs[ inputIndex ].slice( offset ) ;
			
			// Overwrite version
			//inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset ) + key + inputs[ inputIndex ].slice( offset + 1 ) ;
			
			offset ++ ;
			
			if ( echo )
			{
				computeAllCoordinate() ;
				if ( offset === inputs[ inputIndex ].length ) { self( key ) ; }
				else { redraw() ; }		// necessary in insert mode
			}
		}
		else
		{
			// Here we have a special key
			
			switch ( key )
			{
				case '__abort' :
					finished = true ;
					self.removeListener( 'key' , onEvent ) ;
					break ;
				
				case '__stop' :
					finished = true ;
					self.removeListener( 'key' , onEvent ) ;
					callback( undefined , inputs[ inputIndex ] ) ;
					break ;
					
				case 'ENTER' :
				case 'KP_ENTER' :
					finished = true ;
					self.removeListener( 'key' , onEvent ) ;
					callback( undefined , inputs[ inputIndex ] ) ;
					break ;
				
				case 'BACKSPACE' :
					if ( inputs[ inputIndex ].length && offset > 0 )
					{
						inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset - 1 ) + inputs[ inputIndex ].slice( offset ) ;
						offset -- ;
						
						if ( echo )
						{
							computeAllCoordinate() ;
							if ( cursor.y < end.y || end.x === 1 ) { redraw() ; }
							else { self.backDelete() ; }
						}
					}
					break ;
				
				case 'DELETE' :
					if ( inputs[ inputIndex ].length && offset < inputs[ inputIndex ].length )
					{
						inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset ) + inputs[ inputIndex ].slice( offset + 1 ) ;
						
						if ( echo )
						{
							computeAllCoordinate() ;
							if ( cursor.y < end.y || end.x === 1 ) { redraw() ; }
							else { self.delete( 1 ) ; }
						}
					}
					break ;
				
				case 'LEFT' :
					if ( inputs[ inputIndex ].length && offset > 0 )
					{
						offset -- ;
						
						if ( echo )
						{
							computeAllCoordinate() ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;
				
				case 'RIGHT' :
					if ( inputs[ inputIndex ].length && offset < inputs[ inputIndex ].length )
					{
						offset ++ ;
						
						if ( echo )
						{
							computeAllCoordinate() ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;
				
				case 'HOME' :
					offset = 0 ;
					if ( echo )
					{
						computeAllCoordinate() ;
						self.moveTo( cursor.x , cursor.y ) ;
					}
					break ;
				
				case 'END' :
					offset = inputs[ inputIndex ].length ;
					if ( echo )
					{
						computeAllCoordinate() ;
						self.moveTo( cursor.x , cursor.y ) ;
					}
					break ;
				
				case 'DOWN' :
					if ( inputIndex < inputs.length - 1 )
					{
						inputIndex ++ ;
						offset = inputs[ inputIndex ].length ;
						
						if ( echo )
						{
							computeAllCoordinate() ;
							redraw() ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;
				
				case 'UP' :
					if ( inputIndex > 0 )
					{
						inputIndex -- ;
						offset = inputs[ inputIndex ].length ;
						
						if ( echo )
						{
							computeAllCoordinate() ;
							redraw() ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;
				
			}
		}
	} ;
	
	
	
	// Get the cursor location before getting started
	
	this.getCursorLocation( function( error , x , y ) {
		start.x = end.x = cursor.x = x ;
		start.y = end.y = cursor.y = y ;
		self.on( 'key' , onEvent ) ;
	} ) ;
	
	
	
	// Return a controler for the input field
	
	controler = {
		// Stop everything and do not even call the callback
		abort: function abort() { onEvent( '__abort' ) ; } ,
		
		// Stop and call the completion callback with the current input
		stop: function stop() { onEvent( '__stop' ) ; } ,
		
		// Get the current input
		getInput: function getInput() { return inputs[ inputIndex ] ; } ,
		
		// Get the current input
		getPosition: function getPosition() { return { x: start.x , y: start.y } ; } ,
		
		// Hide the input field
		hide: function hide()
		{
			var i , j ;
			
			for ( i = start.x , j = start.y ; j <= end.y ; i = 1 , j ++ )
			{
				self.moveTo.eraseLineAfter( i , j ) ;
			}
			
			echo = false ;
		} ,
		
		// Show the input field
		show: function show()
		{
			echo = true ;
			redraw() ;
		} ,
		
		// Rebase the input field where the cursor is
		rebase: function rebase() {
			// First, disable echoing: getCursorLocation is async!
			echo = false ;
			
			self.getCursorLocation( function( error , x , y ) {
				
				start.x = x ;
				start.y = y ;
				
				if ( options.echo )
				{
					echo = true ;
					
					// This is a modified version of the redraw() code
					
					// No moveTo(), we are rebasing to the current cursor location
					self( inputs[ inputIndex ] ) ;
					computeAllCoordinate() ;
					self.moveTo.eraseLineAfter( end.x , end.y ) ;
					self.moveTo( cursor.x , cursor.y ) ;
				}
			} ) ;
		}
	} ;
	
	
	return controler ;
} ;



