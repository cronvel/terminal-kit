/*
	Terminal Kit
	
	Copyright (c) 2009 - 2016 Cédric Ronvel
	
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



/*
	singleLineMenu( menuItems , [options] , callback )
		* menuItems `array` of menu item text
		* options `object` of options, where:
			* y `number` the line where the menu will be displayed, default to the next line
			* separator `string` (default: '  ') the string separating each menu item
			* nextPageHint `string` (default: ' » ') string indicator for a next page
			* previousPageHint `string` (default: ' « ') string indicator for a previous page
			* style `function` the style of unselected items, default to `term`
			* selectedStyle `function` the style of the selected item, default to `term.dim.blue.bgGreen`
			* exitOnUnexpectedKey `boolean` if an unexpected key is pressed, it exits, calling the callback with undefined values
		* callback( error , response ), where:
			* error
			* response `Object` where:
				* selectedIndex `number` the user-selected menu item index
				* selectedText `string` the user-selected menu item text
				* x `number` the x coordinate of the selected menu item (the first character)
				* y `number` the y coordinate of the selected menu item (same coordinate for all items since it's a single line menu)
				* unexpectedKey `string` when 'exitOnUnexpectedKey' option is set, this contains the key that produced the exit
*/
module.exports = function singleLineMenu( menuItems , options , callback )
{
	if ( arguments.length < 2 ) { throw new Error( '[terminal] singleLineMenu() needs at least an array of menuItems and a callback as argument' ) ; }
	else if ( arguments.length === 2 ) { callback = options ; options = {} ; }
	
	if ( ! Array.isArray( menuItems ) || ! menuItems.length ) { throw new TypeError( '[terminal] singleLineMenu(): argument #0 should be a non-empty array' ) ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	if ( typeof callback !== 'function' ) { throw new TypeError( '[terminal] singleLineMenu(): last argument should be a function' ) ; }
	
	if ( options.separator === undefined ) { options.separator = '  ' ; }
	if ( options.nextPageHint === undefined ) { options.nextPageHint = ' » ' ; }
	if ( options.previousPageHint === undefined ) { options.previousPageHint = ' « ' ; }
	if ( ! options.style ) { options.style = this ; }
	if ( ! options.selectedStyle ) { options.selectedStyle = this.dim.blue.bgGreen ; }
	
	if ( ! options.y ) { this( '\n' ) ; }
	else { this.moveTo( 1 , options.y ) ; }
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	
	var self = this , start = {} , selectedPage = 0 , selectedIndex = 0 , finished = false , menuPages = [] ;
	
	
	var computePages = function computePages()
	{
		var i , p = 0 , endX = 1 , nextEndX , firstItem = true ,
			max = self.width - options.nextPageHint.length ;
		
		menuPages = [ [] ] ;
		
		for ( i = 0 ; i < menuItems.length ; i ++ )
		{
			if ( p >= menuPages.length ) { menuPages.push( [] ) ; }
			
			nextEndX = endX + menuItems[ i ].length + ( i ? options.separator.length : 0 ) ;
			
			if ( nextEndX > max )
			{
				if ( firstItem )
				{
					menuPages[ p ].push( {
						index: i ,
						text: menuItems[ i ] ,
						displayText: menuItems[ i ].slice( 0 , max - endX - 1 ) + '…' ,
						x: endX
					} ) ;
					
					p ++ ;
					endX = 1 + options.previousPageHint.length ;
					firstItem = true ;
					continue ;
				}
				else
				{
					p ++ ;
					endX = 1 + options.previousPageHint.length ;
					firstItem = true ;
					i -- ;
					continue ;
				}
			}
			
			menuPages[ p ].push( {
				index: i ,
				text: menuItems[ i ] ,
				displayText: menuItems[ i ] ,
				x: endX
			} ) ;
			
			endX = nextEndX ;
			firstItem = false ;
		}
	} ;
	
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = function redraw()
	{
		var i , endX = 1 , cursorX ;
		
		self.moveTo.eraseLineAfter( start.x , start.y ) ;
		
		if ( selectedPage )
		{
			options.style.noFormat( options.previousPageHint ) ;
			endX += options.previousPageHint.length ;
		}
		
		for ( i = 0 ; i < menuPages[ selectedPage ].length ; i ++ )
		{
			if ( i )
			{
				options.style.noFormat( options.separator ) ;
				endX += options.separator.length ;
			}
			
			if ( i === selectedIndex )
			{
				options.selectedStyle.noFormat( menuPages[ selectedPage ][ i ].displayText ) ;
				cursorX = endX ;
			}
			else
			{
				options.style.noFormat( menuPages[ selectedPage ][ i ].displayText ) ;
			}
			
			endX += menuPages[ selectedPage ][ i ].displayText.length ;
		}
		
		if ( selectedPage < menuPages.length - 1 )
		{
			options.style.noFormat( options.nextPageHint ) ;
			endX += options.nextPageHint.length ;
		}
		
		self.column( cursorX ) ;
	} ;
	
	
	var onEvent = function onEvent( key , trash , data ) {
		
		if ( finished ) { return ; }
		
		switch ( key )
		{
			case 'ENTER' :
			case 'KP_ENTER' :
				finished = true ;
				self.removeListener( 'key' , onEvent ) ;
				
				callback( undefined , {
					selectedIndex: menuPages[ selectedPage ][ selectedIndex ].index ,
					selectedText: menuPages[ selectedPage ][ selectedIndex ].text ,
					x: menuPages[ selectedPage ][ selectedIndex ].x ,
					y: start.y
				} ) ;
				
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
			
			case 'TAB' :
				if ( selectedPage === menuPages.length - 1 && selectedIndex === menuPages[ selectedPage ].length - 1 )
				{
					selectedPage = 0 ;
					selectedIndex = 0 ;
				}
				else if ( selectedIndex < menuPages[ selectedPage ].length - 1 )
				{
					selectedIndex ++ ;
				}
				else if ( selectedPage < menuPages.length - 1 )
				{
					selectedPage ++ ;
					selectedIndex = 0 ;
				}
				redraw() ;
				break ;
			
			case 'SHIFT_TAB' :
				if ( selectedPage === 0 && selectedIndex === 0 )
				{
					selectedPage = menuPages.length - 1 ;
					selectedIndex = menuPages[ selectedPage ].length - 1 ;
				}
				else if ( selectedIndex > 0 )
				{
					selectedIndex -- ;
				}
				else if ( selectedPage > 0 )
				{
					selectedPage -- ;
					selectedIndex = menuPages[ selectedPage ].length - 1 ;
				}
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
			
			default :
				if ( options.exitOnUnexpectedKey )
				{
					finished = true ;
					self.removeListener( 'key' , onEvent ) ;
					callback( undefined , { unexpectedKey: key , unexpectedKeyData: data } ) ;
				}
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
