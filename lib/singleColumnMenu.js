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
			* bigItems `boolean` if true, big entries can use multiple line to be displayed
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
module.exports = function singleColumnMenu( menuItems_ , options , callback )
{
	if ( arguments.length < 2 ) { throw new Error( '[terminal] singleColumnMenu() needs at least an array of menuItems and a callback as argument' ) ; }
	else if ( arguments.length === 2 ) { callback = options ; options = {} ; }
	
	if ( ! Array.isArray( menuItems_ ) || ! menuItems_.length ) { throw new TypeError( '[terminal] singleColumnMenu(): argument #0 should be a non-empty array' ) ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	if ( typeof callback !== 'function' ) { throw new TypeError( '[terminal] singleColumnMenu(): last argument should be a function' ) ; }
	
	if ( ! options.style ) { options.style = this ; }
	if ( ! options.selectedStyle ) { options.selectedStyle = this.inverse ; }
	
	if ( ! options.leftPad ) { options.leftPad = ' ' ; }
	if ( ! options.selectedLeftPad ) { options.selectedLeftPad = ' ' ; }
	
	if ( ! options.y ) { this( '\n' ) ; }
	else { this.moveTo( 1 , options.y ) ; }
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	
	var start = {} , selectedIndex = 0 , finished = false , width = 0 ,
		menuItems , offsetY = 0 ,
		padLength = Math.max( options.leftPad , options.selectedLeftPad ) ;
	
	menuItems_.forEach( e => width = Math.max( width , e.length ) ) ;
	
	if ( options.bigItems && width > this.width - padLength - 1 )
	{
		menuItems = menuItems_.map( ( element , index ) => {
			
			var item , startOffset , lines = [] ,
				lineLength = this.width - padLength - 1 ;
			
			for ( startOffset = 0 ; startOffset < element.length ; startOffset += lineLength )
			{
				lines.push( element.slice( startOffset , startOffset + lineLength ) ) ;
			}
			
			lines[ lines.length - 1 ] += ' '.repeat( this.width - padLength - lines[ lines.length - 1 ].length - 1 ) ;
			
			item = {
				offsetY: offsetY ,
				index: index ,
				text: element ,
				displayText: lines
			} ;
			
			offsetY += lines.length ;
			
			return item ;
		} ) ;
	}
	else
	{
		width = Math.min( width , this.width - padLength - 1 ) ;
	
		menuItems = menuItems_.map( ( element , index ) => {
			return {
				offsetY: index ,
				index: index ,
				text: element ,
				displayText: [ element.length > width ?
					element.slice( 0 , width - 1 ) + '…' :
					element + ' '.repeat( width - element.length ) ]
			} ;
		} ) ;
		
		offsetY = menuItems.length ;
	}
	
	//console.log( menuItems ) ; process.exit() ;
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = () => {
		
		for ( var i = 0 ; i < menuItems.length ; i ++ ) { redrawItem( i ) ; }
		redrawCursor() ;
	} ;
	
	var redrawItem = ( index ) => {
		
		var item = menuItems[ index ] ;
		
		item.displayText.forEach( ( text , line ) => {
			
			this.moveTo( 1 , start.y + item.offsetY + line ) ;
			
			if ( index === selectedIndex )
			{
				if ( line ) { options.style.noFormat( options.leftPad ) ; }
				else { options.selectedStyle.noFormat( options.selectedLeftPad ) ; }
				
				options.selectedStyle.noFormat( text ) ;
			}
			else
			{
				options.style.noFormat( options.leftPad ) ;
				options.style.noFormat( text ) ;
			}
		} ) ;
	} ;
	
	var redrawCursor = () => {
		this.moveTo( 1 , start.y + menuItems[ selectedIndex ].offsetY ) ;
	} ;
	
	
	var onEvent = ( key , trash , data ) => {
		
		if ( finished ) { return ; }
		
		var oldSelectedIndex = selectedIndex ;
		
		switch ( key )
		{
			case 'ENTER' :
			case 'KP_ENTER' :
				finished = true ;
				this.removeListener( 'key' , onEvent ) ;
				this.moveTo( 1 , start.y + offsetY ) ;
				
				callback( undefined , {
					selectedIndex: selectedIndex ,
					selectedText: menuItems[ selectedIndex ].text ,
					x: 1 ,
					y: start.y + menuItems[ selectedIndex ].offsetY
				} ) ;
				
				break ;
			
			case 'UP' :
				if ( selectedIndex > 0 )
				{
					selectedIndex -- ;
					redrawItem( selectedIndex ) ;
					redrawItem( selectedIndex + 1 ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			
			case 'DOWN' :
				if ( selectedIndex < menuItems.length - 1 )
				{
					selectedIndex ++ ;
					redrawItem( selectedIndex - 1 ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			
			case 'TAB' :
				selectedIndex ++ ;
				
				if ( selectedIndex >= menuItems.length ) { selectedIndex = 0 ; }
				
				redrawItem( oldSelectedIndex ) ;
				redrawItem( selectedIndex ) ;
				redrawCursor() ;
				//redraw() ;
				break ;
			
			case 'SHIFT_TAB' :
				selectedIndex -- ;
				
				if ( selectedIndex < 0 ) { selectedIndex = menuItems.length - 1 ; }
				
				redrawItem( oldSelectedIndex ) ;
				redrawItem( selectedIndex ) ;
				redrawCursor() ;
				//redraw() ;
				break ;
			
			case 'HOME' :
				if ( selectedIndex !== 0 )
				{
					selectedIndex = 0 ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			
			case 'END' :
				if ( selectedIndex !== menuItems.length - 1 )
				{
					selectedIndex = menuItems.length - 1 ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			
			default :
				if ( options.exitOnUnexpectedKey )
				{
					finished = true ;
					this.removeListener( 'key' , onEvent ) ;
					callback( undefined , { unexpectedKey: key , unexpectedKeyData: data } ) ;
				}
				break ;
		}
	} ;
	
	
	this.getCursorLocation( ( error , x , y ) => {
		
		start.x = x ;
		start.y = y ;
		
		var extra = start.y + offsetY - this.height ;
		
		if ( extra > 0 )
		{
			// create extra lines
			this( '\n'.repeat( offsetY + 1 ) ) ;
			start.y -= extra ;
		}
		
		redraw() ;
		
		this.on( 'key' , onEvent ) ;
	} ) ;
} ;


