/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2014 Cédric Ronvel 
	
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
	
	if ( ! options || typeof options !== 'object' )
	{
		options = {
			echo: true
		} ;
	}
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	var self = this , input = '' , offset = 0 , start = {} , end = {} , cursor = {} ;
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var computeAllCoordinate = function computeAllCoordinate()
	{
		end = offsetCoordinate( input.length ) ;
		
		if ( end.y > self.height )
		{
			start.y -= end.y - self.height ;
			end.y = self.height ;
		}
		
		cursor = offsetCoordinate( offset ) ;
	} ;
	
	// Compute the coordinate of the end of a string, given a start coordinate
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
		self.moveTo( start.x , start.y , input ) ;
		self.moveTo.eraseLineAfter( end.x , end.y ) ;
		self.moveTo( cursor.x , cursor.y ) ;
	} ;
	
	var onKey = function onKey( key ) {
		
		if ( key.length === 1 )
		{
			// if length = 1, this is a regular UTF8 character, not a special key
			
			// Insert version
			input = input.slice( 0 , offset ) + key + input.slice( offset ) ;
			
			// Overwrite version
			//input = input.slice( 0 , offset ) + key + input.slice( offset + 1 ) ;
			
			offset ++ ;
			
			if ( options.echo )
			{
				computeAllCoordinate() ;
				if ( offset === input.length ) { self( key ) ; }
				else { redraw() ; }		// necessary in insert mode
			}
		}
		else
		{
			// Here we have a special key
			
			switch ( key )
			{
				case 'ENTER' :
				case 'KP_ENTER' :
					this.removeListener( 'key' , onKey ) ;
					callback( undefined , input ) ;
					break ;
				
				case 'BACKSPACE' :
					if ( input.length && offset > 0 )
					{
						input = input.slice( 0 , offset - 1 ) + input.slice( offset ) ;
						offset -- ;
						
						if ( options.echo )
						{
							computeAllCoordinate() ;
							if ( cursor.y < end.y || end.x === 1 ) { redraw() ; }
							else { self.backDelete() ; }
						}
					}
					break ;
				
				case 'DELETE' :
					if ( input.length && offset < input.length )
					{
						input = input.slice( 0 , offset ) + input.slice( offset + 1 ) ;
						
						if ( options.echo )
						{
							computeAllCoordinate() ;
							if ( cursor.y < end.y || end.x === 1 ) { redraw() ; }
							else { self.delete( 1 ) ; }
						}
					}
					break ;
				
				case 'LEFT' :
					if ( input.length && offset > 0 )
					{
						offset -- ;
						
						if ( options.echo )
						{
							computeAllCoordinate() ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;
				
				case 'RIGHT' :
					if ( input.length && offset < input.length )
					{
						offset ++ ;
						
						if ( options.echo )
						{
							computeAllCoordinate() ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;
				
				case 'HOME' :
					offset = 0 ;
					if ( options.echo )
					{
						computeAllCoordinate() ;
						self.moveTo( cursor.x , cursor.y ) ;
					}
					break ;
				
				case 'END' :
					offset = input.length ;
					if ( options.echo )
					{
						computeAllCoordinate() ;
						self.moveTo( cursor.x , cursor.y ) ;
					}
					break ;
			}
		}
	} ;
	
	if ( options.echo )
	{
		this.getCursorLocation( function( error , x , y ) {
			start.x = end.x = cursor.x = x ;
			start.y = end.y = cursor.y = y ;
			self.on( 'key' , onKey ) ;
		} ) ;
	}
	else
	{
		this.on( 'key' , onKey ) ;
	}
} ;



