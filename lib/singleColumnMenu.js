/*
	Terminal Kit
	
	Copyright (c) 2009 - 2017 Cédric Ronvel
	
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
	singleColumnMenu( menuItems , [options] , callback )
		* menuItems `array` of menu item text
		* options `object` of options, where:
			* y `number` the line where the menu will be displayed, default to the next line
			* style `function` the style of unselected items, default to `term`
			* selectedStyle `function` the style of the selected item, default to `term.inverse`
			* leftPad `string` the text to put before a menu entry, default to ' '
			* selectedLeftPad `string` the text to put before a selected menu entry, default to ' '
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
module.exports = function singleColumnMenu( menuItems , options , callback )
{
	if ( arguments.length < 2 ) { throw new Error( '[terminal] singleColumnMenu() needs at least an array of menuItems and a callback as argument' ) ; }
	else if ( arguments.length === 2 ) { callback = options ; options = {} ; }
	
	if ( ! Array.isArray( menuItems ) || ! menuItems.length ) { throw new TypeError( '[terminal] singleColumnMenu(): argument #0 should be a non-empty array' ) ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	if ( typeof callback !== 'function' ) { throw new TypeError( '[terminal] singleColumnMenu(): last argument should be a function' ) ; }
	
	if ( ! options.style ) { options.style = this ; }
	if ( ! options.selectedStyle ) { options.selectedStyle = this.inverse ; }
	
	if ( ! options.leftPad ) { options.leftPad = ' ' ; }
	if ( ! options.selectedLeftPad ) { options.selectedLeftPad = ' ' ; }
	
	if ( ! options.y ) { this( '\n' ) ; }
	else { this.moveTo( 1 , options.y ) ; }
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	
	var self = this , start = {} , selectedIndex = 0 , finished = false , width = 0 ,
		padLength = Math.max( options.leftPad , options.selectedLeftPad ) ;
	
	menuItems.forEach( e => width = Math.max( width , e.length ) ) ;
	width = Math.min( width , this.width - padLength - 1 ) ;
	
	var menuItemTexts = menuItems.map( e => e.length > width ? e.slice( 0 , width - 1 ) + '…' : e + ' '.repeat( width - e.length ) ) ;
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = function redraw()
	{
		var i , cursorY ;
		
		self.moveTo.eraseLineAfter( start.x , start.y ) ;
		
		for ( i = 0 ; i < menuItemTexts.length ; i ++ )
		{
			if ( i === selectedIndex )
			{
				options.selectedStyle.noFormat( options.selectedLeftPad ) ;
				options.selectedStyle.noFormat( menuItemTexts[ i ] + '\n' ) ;
				cursorY = start.y + i ;
			}
			else
			{
				options.style.noFormat( options.leftPad ) ;
				options.style.noFormat( menuItemTexts[ i ] + '\n' ) ;
			}
		}
		
		self.moveTo( 1 , cursorY ) ;
	} ;
	
	
	var onEvent = function onEvent( key , trash , data ) {
		
		if ( finished ) { return ; }
		
		switch ( key )
		{
			case 'ENTER' :
			case 'KP_ENTER' :
				finished = true ;
				self.removeListener( 'key' , onEvent ) ;
				self.moveTo( 1 , start.y + menuItems.length ) ;
				
				callback( undefined , {
					selectedIndex: selectedIndex ,
					selectedText: menuItems[ selectedIndex ] ,
					x: 1 ,
					y: start.y + selectedIndex
				} ) ;
				
				break ;
			
			case 'UP' :
				if ( selectedIndex > 0 )
				{
					selectedIndex -- ;
					redraw() ;
				}
				break ;
			
			case 'DOWN' :
				if ( selectedIndex < menuItems.length - 1 )
				{
					selectedIndex ++ ;
					redraw() ;
				}
				break ;
			
			case 'TAB' :
				selectedIndex = ( selectedIndex + 1 ) % menuItems.length ;
				redraw() ;
				break ;
			
			case 'SHIFT_TAB' :
				selectedIndex -- ;
				if ( selectedIndex < 0 ) { selectedIndex = menuItems.length - 1 ; }
				redraw() ;
				break ;
			
			case 'HOME' :
				if ( selectedIndex !== 0 )
				{
					selectedIndex = 0 ;
					redraw() ;
				}
				break ;
			
			case 'END' :
				if ( selectedIndex !== menuItems.length - 1 )
				{
					selectedIndex = menuItems.length - 1 ;
					redraw() ;
				}
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
		redraw() ;
		
		if ( start.y + menuItems.length > self.height )
		{
			start.y = self.height - menuItems.length ;
			self.moveTo( 1 , start.y ) ;
		}
		
		self.on( 'key' , onEvent ) ;
	} ) ;
} ;


