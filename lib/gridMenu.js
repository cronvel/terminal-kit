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



var defaultKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	//LEFT: 'previous' ,
	//RIGHT: 'next' ,
	//UP: 'previousRow' ,
	//DOWN: 'nextRow' ,
	UP: 'previous' ,
	DOWN: 'next' ,
	LEFT: 'previousColumn' ,
	RIGHT: 'nextColumn' ,
	TAB: 'cycleNext' ,
	SHIFT_TAB: 'cyclePrevious' ,
	HOME: 'first' ,
	END: 'last'
} ;



/*
	gridMenu( menuItems , [options] , callback )
		* menuItems `array` of menu item text
		* options `object` of options, where:
			* y `number` the line where the menu will be displayed, default to the next line
			* style `function` the style of unselected items, default to `term`
			* selectedStyle `function` the style of the selected item, default to `term.inverse`
			* leftPad `string` the text to put before a menu item, default to ' '
			* selectedLeftPad `string` the text to put before a selected menu item, default to ' '
			* rightPad `string` the text to put after a menu item, default to ' '
			* selectedRightPad `string` the text to put after a selected menu item, default to ' '
			* itemMaxWidth `number` the max width for an item, default to the 1/3 of the terminal width
			* keyBindings `Object` overide default key bindings
			* exitOnUnexpectedKey `boolean` if an unexpected key is pressed, it exits, calling the callback with undefined values
		* callback( error , response ), where:
			* error
			* response `Object` where:
				* selectedIndex `number` the user-selected menu item index
				* selectedText `string` the user-selected menu item text
				* x `number` the x coordinate of the selected menu item (the first character)
				* y `number` the y coordinate of the selected menu item
				* unexpectedKey `string` when 'exitOnUnexpectedKey' option is set, this contains the key that produced the exit
*/
module.exports = function gridMenu( menuItems_ , options , callback )
{
	if ( arguments.length < 2 ) { throw new Error( '[terminal] gridMenu() needs at least an array of menuItems and a callback as argument' ) ; }
	else if ( arguments.length === 2 ) { callback = options ; options = {} ; }
	
	if ( ! Array.isArray( menuItems_ ) || ! menuItems_.length ) { throw new TypeError( '[terminal] gridMenu(): argument #0 should be a non-empty array' ) ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	if ( typeof callback !== 'function' ) { throw new TypeError( '[terminal] gridMenu(): last argument should be a function' ) ; }
	
	if ( ! options.style ) { options.style = this ; }
	if ( ! options.selectedStyle ) { options.selectedStyle = this.inverse ; }
	
	if ( ! options.leftPad ) { options.leftPad = ' ' ; }
	if ( ! options.selectedLeftPad ) { options.selectedLeftPad = ' ' ; }
	if ( ! options.rightPad ) { options.rightPad = ' ' ; }
	if ( ! options.selectedRightPad ) { options.selectedRightPad = ' ' ; }
	
	// itemMaxWidth default to 1/3 of the terminal width
	if ( ! options.itemMaxWidth ) { options.itemMaxWidth = Math.floor( ( this.width - 1 ) / 3 ) ; }
	
	if ( ! options.y ) { this( '\n' ) ; }
	else { this.moveTo( 1 , options.y ) ; }
	
	var keyBindings = options.keyBindings || defaultKeyBindings ;
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	
	var start = {} , selectedIndex = 0 , finished = false ,
		itemInnerWidth = 0 , itemOuterWidth = 0 ,
		menuItems , columns , rows , padLength ;
	
	padLength = Math.max( options.leftPad.length , options.selectedLeftPad.length ) +
		Math.max( options.rightPad.length , options.selectedRightPad.length ) ;
	
	menuItems_.forEach( e => itemInnerWidth = Math.max( itemInnerWidth , e.length ) ) ;
	
	itemInnerWidth = Math.min( itemInnerWidth , options.itemMaxWidth - padLength ) ;
	itemOuterWidth = itemInnerWidth + padLength ;
	columns = Math.floor( this.width / itemOuterWidth ) ;
	rows = Math.ceil( menuItems_.length / columns ) ;
	
	menuItems = menuItems_.map( ( element , index ) => {
		return {
			// row first
			//offsetX: ( index % columns ) * itemOuterWidth ,
			//offsetY: Math.floor( index / columns ) ,
			
			// column first
			offsetY: index % rows ,
			offsetX: Math.floor( index / rows ) * itemOuterWidth ,
			
			index: index ,
			text: element ,
			displayText: element.length > itemInnerWidth ?
				element.slice( 0 , itemInnerWidth - 1 ) + '…' :
				element + ' '.repeat( itemInnerWidth - element.length )
		} ;
	} ) ;
	
	
	//console.log( menuItems ) ; process.exit() ;
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = () => {
		
		for ( var i = 0 ; i < menuItems.length ; i ++ ) { redrawItem( i ) ; }
		redrawCursor() ;
	} ;
	
	var redrawItem = ( index ) => {
		
		var item = menuItems[ index ] ;
		
		this.moveTo( 1 + item.offsetX , start.y + item.offsetY ) ;
		
		if ( index === selectedIndex )
		{
			options.selectedStyle.noFormat( options.selectedLeftPad ) ;
			options.selectedStyle.noFormat( item.displayText ) ;
			options.selectedStyle.noFormat( options.selectedRightPad ) ;
		}
		else
		{
			options.style.noFormat( options.leftPad ) ;
			options.style.noFormat( item.displayText ) ;
			options.style.noFormat( options.rightPad ) ;
		}
	} ;
	
	var redrawCursor = () => {
		this.moveTo( 1 + menuItems[ selectedIndex ].offsetX , start.y + menuItems[ selectedIndex ].offsetY ) ;
	} ;
	
	
	var onKey = ( key , trash , data ) => {
		
		if ( finished ) { return ; }
		
		var oldSelectedIndex = selectedIndex ;
		
		switch( keyBindings[ key ] )
		{
			case 'submit' :
				finished = true ;
				this.removeListener( 'key' , onKey ) ;
				this.removeListener( 'mouse' , onMouse ) ;
				this.moveTo( 1 , start.y + rows ) ;
				
				callback( undefined , {
					selectedIndex: selectedIndex ,
					selectedText: menuItems[ selectedIndex ].text ,
					x: 1 + menuItems[ selectedIndex ].offsetX ,
					y: start.y + menuItems[ selectedIndex ].offsetY
				} ) ;
				
				break ;
			
			case 'previous' :
				if ( selectedIndex > 0 )
				{
					selectedIndex -- ;
					redrawItem( selectedIndex ) ;
					redrawItem( selectedIndex + 1 ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			
			case 'next' :
				if ( selectedIndex < menuItems.length - 1 )
				{
					selectedIndex ++ ;
					redrawItem( selectedIndex - 1 ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			/*
			case 'previousRow' :
				if ( selectedIndex >= columns )
				{
					selectedIndex -= columns ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			
			case 'nextRow' :
				if ( selectedIndex < menuItems.length - columns )
				{
					selectedIndex += columns ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			*/
			case 'previousColumn' :
				if ( selectedIndex >= rows )
				{
					selectedIndex -= rows ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			
			case 'nextColumn' :
				if ( selectedIndex < menuItems.length - rows )
				{
					selectedIndex += rows ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			
			case 'cyclePrevious' :
				selectedIndex -- ;
				
				if ( selectedIndex < 0 ) { selectedIndex = menuItems.length - 1 ; }
				
				redrawItem( oldSelectedIndex ) ;
				redrawItem( selectedIndex ) ;
				redrawCursor() ;
				//redraw() ;
				break ;
			
			case 'cycleNext' :
				selectedIndex ++ ;
				
				if ( selectedIndex >= menuItems.length ) { selectedIndex = 0 ; }
				
				redrawItem( oldSelectedIndex ) ;
				redrawItem( selectedIndex ) ;
				redrawCursor() ;
				//redraw() ;
				break ;
			
			case 'first' :
				if ( selectedIndex !== 0 )
				{
					selectedIndex = 0 ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			
			case 'last' :
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
					this.removeListener( 'key' , onKey ) ;
					this.removeListener( 'mouse' , onMouse ) ;
					callback( undefined , { unexpectedKey: key , unexpectedKeyData: data } ) ;
				}
				break ;
		}
	} ;
	
	
	var onMouse = ( name , data ) => {
		
		if ( finished ) { return ; }
		
		// If out of bounds, exit now!
		if ( data.y < start.y || data.y >= start.y + rows ) { return ; }
		
		var i , inBounds = false ,
			oldSelectedIndex = selectedIndex ;
		
		for ( i = 0 ; i < menuItems.length ; i ++ )
		{
			if (
				data.y === start.y + menuItems[ i ].offsetY &&
				data.x >= 1 + menuItems[ i ].offsetX &&
				data.x < 1 + menuItems[ i ].offsetX + itemOuterWidth
			)
			{
				inBounds = true ;
				
				if ( selectedIndex !== i )
				{
					selectedIndex = i ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
				}
				
				break ;
			}
		}
		
		if ( inBounds && name === 'MOUSE_LEFT_BUTTON_PRESSED' )
		{
			finished = true ;
			this.removeListener( 'key' , onKey ) ;
			this.removeListener( 'mouse' , onMouse ) ;
			this.moveTo( 1 , start.y + rows ) ;
			
			callback( undefined , {
				selectedIndex: selectedIndex ,
				selectedText: menuItems[ selectedIndex ].text ,
				x: 1 + menuItems[ selectedIndex ].offsetX ,
				y: start.y + menuItems[ selectedIndex ].offsetY
			} ) ;
		}
	} ;	
	
	
	this.getCursorLocation( ( error , x , y ) => {
		
		start.x = x ;
		start.y = y ;
		
		var extra = start.y + rows - this.height ;
		
		if ( extra > 0 )
		{
			// create extra lines
			this( '\n'.repeat( rows ) ) ;
			start.y -= extra ;
		}
		
		redraw() ;
		
		this.on( 'key' , onKey ) ;
		if ( this.mouseGrabbing ) { this.on( 'mouse' , onMouse ) ; }
	} ) ;
} ;


