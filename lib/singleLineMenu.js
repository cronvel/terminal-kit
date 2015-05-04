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
	singleLineMenu( menuItems , [options] , callback )
		* menuItems `array` of menu entry texts
		* options `object` of options, where:
			* y `number` the line where the menu will be displayed, default to the next line
			* style `function` the style of non-selected menu item, default to `term`
			* selectedStyle `function` the style of nonselected menu item, default to `term.bgYellow.magenta`
		* callback( error , selectedIndex , selectedText ), where:
			* error
			* selectedIndex `number` the user-selected menu entry index
			* selectedText `number` the user-selected menu entry text
*/
module.exports = function singleLineMenu( menuItems , options , callback )
{
	if ( arguments.length < 2 ) { throw new Error( '[terminal] singleLineMenu() needs at least an array of menuItems and a callback as argument' ) ; }
	else if ( arguments.length === 2 ) { callback = options ; options = {} ; }
	
	if ( ! Array.isArray( menuItems ) || ! menuItems.length ) { throw new TypeError( '[terminal] singleLineMenu(): argument #0 should be a non-empty array' ) ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	if ( typeof callback !== 'function' ) { throw new TypeError( '[terminal] singleLineMenu(): last argument should be a function' ) ; }
	
	if ( ! options.style ) { options.style = this ; }
	if ( ! options.selectedStyle ) { options.selectedStyle = this.bgYellow.magenta ; }
	
	if ( ! options.y ) { this( '\n' ) ; }
	else { this.moveTo( 1 , options.y ) ; }
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	
	var self = this , start = {} , selectedPage = 0 , selectedIndex = 0 , finished = false , menuPages = [] ;
	
	
	var computePages = function computePages()
	{
		var i , p = 0 , endX = 1 , nextEndX ;
		
		menuPages = [ [] ] ;
		
		for ( i = 0 ; i < menuItems.length ; i ++ )
		{
			nextEndX = endX + menuItems[ i ].length + 1 ;
			
			if ( nextEndX >= self.width )
			{
				if ( endX === 1 )
				{
					menuPages[ p ].push( {
						index: i ,
						text: menuItems[ i ] ,
						displayText: menuItems[ i ].slice( 0 , self.width - 1 )
					} ) ;
					
					p ++ ;
					endX = 1 ;
					continue ;
				}
				else
				{
					menuPages.push( [] ) ;
					p ++ ;
					endX = 1 ;
					i -- ;
					continue ;
				}
			}
			
			menuPages[ p ].push( { index: i , text: menuItems[ i ] , displayText: menuItems[ i ] } ) ;
			
			endX = nextEndX ;
		}
	} ;
	
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = function redraw()
	{
		var i , endX = 1 , cursorX ;
		
		self.moveTo.eraseLineAfter( start.x , start.y ) ;
		
		for ( i = 0 ; i < menuPages[ selectedPage ].length ; i ++ )
		{
			if ( i === selectedIndex )
			{
				options.selectedStyle.noFormat( menuPages[ selectedPage ][ i ].displayText ) ;
				cursorX = endX ;
			}
			else
			{
				options.style.noFormat( menuPages[ selectedPage ][ i ].displayText ) ;
			}
			
			options.style.noFormat( ' ' ) ;
			endX += menuPages[ selectedPage ][ i ].displayText.length + 1 ;
		}
		
		self.column( cursorX ) ;
	} ;
	
	
	var onEvent = function onEvent( key ) {
		
		if ( finished ) { return ; }
		
		switch ( key )
		{
			case 'ENTER' :
			case 'KP_ENTER' :
				finished = true ;
				self.removeListener( 'key' , onEvent ) ;
				
				callback(
					undefined ,
					menuPages[ selectedPage ][ selectedIndex ].index ,
					menuPages[ selectedPage ][ selectedIndex ].text
				) ;
				
				break ;
			
			case 'LEFT' :
				if ( selectedIndex > 0 ) { selectedIndex -- ; }
				else if ( selectedPage > 0 ) { selectedPage -- ; selectedIndex = menuPages[ selectedPage ].length - 1 ; }
				redraw() ;
				break ;
			
			case 'RIGHT' :
				if ( selectedIndex < menuPages[ selectedPage ].length - 1 ) { selectedIndex ++ ; }
				else if ( selectedPage < menuPages.length - 1 ) { selectedPage ++ ; selectedIndex = 0 ; }
				redraw() ;
				break ;
			
			case 'HOME' :
				selectedPage = 0 ;
				selectedIndex = 0 ;
				redraw() ;
				break ;
			
			case 'END' :
				selectedPage = menuPages.length - 1 ;
				selectedIndex = menuPages[ selectedPage ].length - 1 ;
				redraw() ;
				break ;
			
			case 'UP' :
				if ( selectedPage > 0 ) { selectedPage -- ; selectedIndex = 0 ; }
				redraw() ;
				break ;
			
			case 'DOWN' :
				if ( selectedPage < menuPages.length - 1 ) { selectedPage ++ ; selectedIndex = 0 ; }
				redraw() ;
				break ;
			
		}
	} ;
	
	
	this.getCursorLocation( function( error , x , y ) {
		start.x = x ;
		start.y = y ;
		computePages() ;
		redraw() ;
		self.on( 'key' , onEvent ) ;
	} ) ;
} ;
