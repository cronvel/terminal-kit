/*
	Terminal Kit

	Copyright (c) 2009 - 2022 Cédric Ronvel

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



const termkit = require( './termkit' ) ;
const stringWidth = termkit.stringWidth ;
const NextGenEvents = require( 'nextgen-events' ) ;
const Promise = require( 'seventh' ) ;



const defaultKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	LEFT: 'previous' ,
	RIGHT: 'next' ,
	UP: 'previousPage' ,
	DOWN: 'nextPage' ,
	TAB: 'cycleNext' ,
	SHIFT_TAB: 'cyclePrevious' ,
	HOME: 'first' ,
	END: 'last' ,
	ESCAPE: 'escape'
} ;



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
			* selectedIndex `number` selected index at initialization (default: 0)
			* align `string` one of 'left' (default), 'right' or 'center', align the menu accordingly
			* fillIn `boolean` if true (default: false), the menu will fill in the whole line with white chars
			* keyBindings `Object` overide default key bindings
			* cancelable `boolean` if ESCAPE is pressed, it exits, calling the callback with undefined values
			* exitOnUnexpectedKey `boolean` if an unexpected key is pressed, it exits, calling the callback with undefined values
		* callback( error , response ), where:
			* error
			* response `Object` where:
				* selectedIndex `number` the user-selected menu item index
				* selectedText `string` the user-selected menu item text
				* x `number` the x coordinate of the selected menu item (the first character)
				* y `number` the y coordinate of the selected menu item (same coordinate for all items since it's a single line menu)
				* unexpectedKey `string` when 'exitOnUnexpectedKey' option is set, this contains the key that produced the exit
				* canceled `bool` when 'cancelable' option is set, this is set to true
*/
module.exports = function singleLineMenu( menuItems_ , options , callback ) {
	if ( arguments.length < 1 ) { throw new Error( '[terminal] singleLineMenu() needs at least an array of menuItems' ) ; }
	if ( ! Array.isArray( menuItems_ ) || ! menuItems_.length ) { throw new TypeError( '[terminal] singleLineMenu(): argument #0 should be a non-empty array' ) ; }

	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }

	if ( options.separator === undefined ) { options.separator = '  ' ; }
	if ( options.nextPageHint === undefined ) { options.nextPageHint = ' » ' ; }
	if ( options.previousPageHint === undefined ) { options.previousPageHint = ' « ' ; }
	if ( ! options.style ) { options.style = this ; }
	if ( ! options.selectedStyle ) { options.selectedStyle = this.dim.blue.bgGreen ; }

	if ( ! options.y ) { this( '\n' ) ; }
	else { this.moveTo( 1 , options.y ) ; }

	var keyBindings = options.keyBindings || defaultKeyBindings ;

	if ( ! this.grabbing ) { this.grabInput() ; }

	var menuItems = menuItems_.map( e => typeof e === 'string' ? e : '' + e ) ;

	var selectedIndexInPage = options.selectedIndex = options.selectedIndex || 0 ;
	var start = {} , selectedPage = 0 , finished = false , menuPages = [] , alreadyCleanedUp = false ;

	// Width
	var nextPageHintWidth = stringWidth( options.nextPageHint ) ,
		previousPageHintWidth = stringWidth( options.previousPageHint ) ,
		separatorWidth = stringWidth( options.separator ) ;

	var computePages = () => {
		var i , itemWidth , displayText , p = 0 , endX = 1 , nextEndX , firstItem = true ,
			lastItem , lineWidth , offset ,
			xMax = this.width - nextPageHintWidth ;

		menuPages = [ [] ] ;

		for ( i = 0 ; i < menuItems.length ; i ++ ) {
			if ( p >= menuPages.length ) { menuPages.push( [] ) ; }

			itemWidth = stringWidth( menuItems[ i ] ) ;
			nextEndX = endX + itemWidth + separatorWidth ;

			if ( nextEndX > xMax ) {
				if ( firstItem ) {
					itemWidth = xMax - endX ;
					displayText = termkit.truncateString( menuItems[ i ] , itemWidth - 1 ) + '…' ;

					if ( i === options.selectedIndex ) {
						selectedPage = p ;
						selectedIndexInPage = menuPages[ p ].length ;
					}

					menuPages[ p ].push( {
						index: i ,
						text: menuItems[ i ] ,
						displayText: displayText ,
						displayTextWidth: itemWidth ,
						x: endX
					} ) ;
				}
				else {
					i -- ;
				}

				p ++ ;
				endX = 1 + previousPageHintWidth ;
				firstItem = true ;

				continue ;
			}

			if ( i === options.selectedIndex ) {
				selectedPage = p ;
				selectedIndexInPage = menuPages[ p ].length ;
			}

			menuPages[ p ].push( {
				index: i ,
				text: menuItems[ i ] ,
				displayText: menuItems[ i ] ,
				displayTextWidth: itemWidth ,
				x: endX
			} ) ;

			endX = nextEndX ;
			firstItem = false ;
		}

		for ( p = 0 ; p < menuPages.length ; p ++ ) {
			lastItem = menuPages[ p ][ menuPages[ p ].length - 1 ] ;
			lineWidth = lastItem.x + lastItem.displayTextWidth - 1 ;
			if ( p < menuPages.length - 1 ) { lineWidth += nextPageHintWidth ; }

			menuPages[ p ].x = 1 ;

			if ( lineWidth < this.width ) {
				if ( options.align === 'right' ) { offset = this.width - lineWidth ; }
				else if ( options.align === 'center' ) { offset = Math.floor( ( this.width - lineWidth ) / 2 ) ; }
				else { offset = 0 ; }

				menuPages[ p ].x += offset ;

				if ( offset ) {
					menuPages[ p ].forEach( item => item.x += offset ) ;
				}
			}
		}
	} ;

	var cleanup = ( error , data ) => {
		if ( alreadyCleanedUp ) { return ; }
		alreadyCleanedUp = true ;

		finished = true ;
		this.removeListener( 'key' , onKey ) ;
		this.removeListener( 'mouse' , onMouse ) ;

		if ( error ) {
			if ( callback ) { callback( error ) ; }
			else { controller.promise.reject( error ) ; }
			return ;
		}

		var page = menuPages[ selectedPage ] ;

		var value = data !== undefined ? data : {
			selectedIndex: page[ selectedIndexInPage ].index ,
			selectedText: page[ selectedIndexInPage ].text ,
			x: page[ selectedIndexInPage ].x ,
			y: start.y
		} ;

		if ( callback ) { callback( undefined , value ) ; }
		else { controller.promise.resolve( value ) ; }
	} ;

	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = () => {
		var i , cursorX ,
			page = menuPages[ selectedPage ] ,
			endX = page.x ;

		this.moveTo.eraseLineAfter( 1 , start.y ) ;

		if ( options.fillIn && endX > 1 ) { options.style.noFormat( ' '.repeat( endX - 1 ) ) ; }
		else { this.column( endX ) ; }

		if ( selectedPage ) {
			options.style.forceStyleOnReset.noFormat( options.previousPageHint ) ;
			endX += previousPageHintWidth ;
		}

		for ( i = 0 ; i < page.length ; i ++ ) {
			if ( i ) {
				options.style.forceStyleOnReset.noFormat( options.separator ) ;
				endX += separatorWidth ;
			}

			if ( i === selectedIndexInPage ) {
				options.selectedStyle.forceStyleOnReset.noFormat( page[ i ].displayText ) ;
				cursorX = endX ;
			}
			else {
				options.style.forceStyleOnReset.noFormat( page[ i ].displayText ) ;
			}

			endX += page[ i ].displayTextWidth ;
		}

		if ( selectedPage < menuPages.length - 1 ) {
			options.style.forceStyleOnReset.noFormat( options.nextPageHint ) ;
			endX += nextPageHintWidth ;
		}

		if ( options.fillIn && endX < this.width ) { options.style.noFormat( ' '.repeat( this.width - endX ) ) ; }

		this.column( cursorX ) ;
	} ;

	var emitHighlight = () => {
		var item = menuPages[ selectedPage ][ selectedIndexInPage ] ;

		controller.emit( 'highlight' , {
			highlightedIndex: item.index ,
			highlightedText: item.text ,
			x: item.x ,
			y: start.y
		} ) ;
	} ;


	var onKey = ( key , trash , data ) => {
		if ( finished ) { return ; }

		var changed = false ,
			page = menuPages[ selectedPage ] ;

		switch( keyBindings[ key ] ) {
			case 'submit' :
				cleanup() ;
				break ;

			case 'previous' :
				if ( selectedIndexInPage > 0 ) {
					selectedIndexInPage -- ;
					changed = true ;
				}
				else if ( selectedPage > 0 ) {
					selectedPage -- ;
					selectedIndexInPage = menuPages[ selectedPage ].length - 1 ;
					changed = true ;
				}
				break ;

			case 'next' :
				if ( selectedIndexInPage < page.length - 1 ) {
					selectedIndexInPage ++ ;
					changed = true ;
				}
				else if ( selectedPage < menuPages.length - 1 ) {
					selectedPage ++ ;
					selectedIndexInPage = 0 ;
					changed = true ;
				}
				break ;

			case 'cycleNext' :
				if ( selectedPage === menuPages.length - 1 && selectedIndexInPage === page.length - 1 ) {
					selectedPage = 0 ;
					selectedIndexInPage = 0 ;
					changed = true ;
				}
				else if ( selectedIndexInPage < page.length - 1 ) {
					selectedIndexInPage ++ ;
					changed = true ;
				}
				else if ( selectedPage < menuPages.length - 1 ) {
					selectedPage ++ ;
					selectedIndexInPage = 0 ;
					changed = true ;
				}
				break ;

			case 'cyclePrevious' :
				if ( selectedPage === 0 && selectedIndexInPage === 0 ) {
					selectedPage = menuPages.length - 1 ;
					selectedIndexInPage = menuPages[ selectedPage ].length - 1 ;
					changed = true ;
				}
				else if ( selectedIndexInPage > 0 ) {
					selectedIndexInPage -- ;
					changed = true ;
				}
				else if ( selectedPage > 0 ) {
					selectedPage -- ;
					selectedIndexInPage = menuPages[ selectedPage ].length - 1 ;
					changed = true ;
				}
				break ;

			case 'first' :
				if ( selectedPage !== 0 || selectedIndexInPage !== 0 ) {
					selectedPage = 0 ;
					selectedIndexInPage = 0 ;
					changed = true ;
				}
				break ;

			case 'last' :
				if ( selectedPage !== menuPages.length - 1 || selectedIndexInPage !== menuPages[ selectedPage ].length - 1 ) {
					selectedPage = menuPages.length - 1 ;
					selectedIndexInPage = menuPages[ selectedPage ].length - 1 ;
					changed = true ;
				}
				break ;

			case 'previousPage' :
				if ( selectedPage > 0 ) {
					selectedPage -- ;
					selectedIndexInPage = 0 ;
					changed = true ;
				}
				break ;

			case 'nextPage' :
				if ( selectedPage < menuPages.length - 1 ) {
					selectedPage ++ ;
					selectedIndexInPage = 0 ;
					changed = true ;
				}
				break ;

			case 'escape' :
				if ( options.cancelable ) {
					cleanup( undefined , { canceled: true } ) ;
				}
				if ( options.exitOnUnexpectedKey ) {
					cleanup( undefined , { unexpectedKey: key , unexpectedKeyData: data } ) ;
				}
				break ;

			default :
				if ( options.exitOnUnexpectedKey ) {
					cleanup( undefined , { unexpectedKey: key , unexpectedKeyData: data } ) ;
				}
				break ;

		}

		if ( changed ) {
			redraw() ;
			emitHighlight() ;
		}
	} ;


	var onMouse = ( name , data ) => {
		if ( finished ) { return ; }

		// If out of bounds, exit now!
		if ( data.y !== start.y ) { return ; }

		var i , item , nextButtonX ,
			inBounds = false ,
			page = menuPages[ selectedPage ] ;

		// First check previous/next page button click
		if ( name === 'MOUSE_LEFT_BUTTON_PRESSED' ) {
			if ( selectedPage > 0 && data.x >= 1 && data.x < 1 + previousPageHintWidth ) {
				selectedPage -- ;
				selectedIndexInPage = 0 ;
				redraw() ;
				emitHighlight() ;
				return ;
			}

			nextButtonX = page[ page.length - 1 ].x + page[ page.length - 1 ].displayTextWidth ;

			if ( selectedPage < menuPages.length - 1 && data.x >= nextButtonX && data.x < nextButtonX + nextPageHintWidth ) {
				selectedPage ++ ;
				selectedIndexInPage = 0 ;
				redraw() ;
				emitHighlight() ;
				return ;
			}
		}

		for ( i = 0 ; i < page.length ; i ++ ) {
			item = page[ i ] ;

			if ( data.x >= item.x && data.x < item.x + item.displayTextWidth ) {
				inBounds = true ;

				if ( selectedIndexInPage !== i ) {
					selectedIndexInPage = i ;
					redraw() ;
					emitHighlight() ;
				}

				break ;
			}
		}

		if ( inBounds && name === 'MOUSE_LEFT_BUTTON_PRESSED' ) {
			cleanup() ;
		}
	} ;

	var controller = Object.create( NextGenEvents.prototype ) ;

	controller.promise = new Promise() ;

	this.getCursorLocation( ( error , x , y ) => {
		if ( error ) {
			// Some bad terminals (windows...) doesn't support cursor location request, we should fallback to a decent behavior.
			// So we just move to the last line and create a new line.
			//cleanup( error ) ; return ;
			this.row.eraseLineAfter( this.height )( '\n' ) ;
			x = 1 ;
			y = this.height ;
		}

		start.x = x ;
		start.y = y ;
		computePages() ;
		redraw() ;

		// Emit the first auto-selected item
		emitHighlight() ;

		this.on( 'key' , onKey ) ;
		if ( this.mouseGrabbing ) { this.on( 'mouse' , onMouse ) ; }
	} ) ;

	return controller ;
} ;

