/*
	Terminal Kit

	Copyright (c) 2009 - 2018 Cédric Ronvel

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



var termkit = require( './termkit' ) ;
var stringWidth = termkit.stringWidth ;
var NextGenEvents = require( 'nextgen-events' ) ;
var Promise = require( 'seventh' ) ;
var string = require( 'string-kit' ) ;



var defaultKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	UP: 'previous' ,
	DOWN: 'next' ,
	TAB: 'cycleNext' ,
	SHIFT_TAB: 'cyclePrevious' ,
	HOME: 'first' ,
	END: 'last' ,
	BACKSPACE: 'cancel' ,
	DELETE: 'cancel' ,
	ESCAPE: 'escape'
} ;



/*
	singleColumnMenu( menuItems , [options] , callback )
		* menuItems `array` of menu item text
		* options `object` of options, where:
			* y `number` the line where the menu will be displayed, default to the next line
			* style `function` the style of unselected items, default to `term`
			* selectedStyle `function` the style of the selected item, default to `term.inverse`
			* submittedStyle `function` the style of the submitted item, default to `term.bgGray.bold`
			* disabledStyle `function` the style of unselected items **when the menu is paused/disabled**,
			  default to `term.dim`
			* disabledSelectedStyle `function` the style of the selected item **when the menu is paused/disabled**,
			  default to `term.bgGray.dim`
			* disabledSubmittedStyle `function` the style of the submitted item **when the menu is paused/disabled**,
			  default to `term.bgGray`
			* leftPadding `string` the text to put before a menu item, default to ' '
			* selectedLeftPadding `string` the text to put before a selected menu item, default to ' '
			* submittedLeftPadding `string` the text to put before a submitted menu item, default to ' '
			* extraLines `number` ensure that many lines after the bottom of the menu
			* oneLineItem `boolean` if true (default: false), big items do not span multiple lines, instead they are truncated
			  and ended with an ellipsis char
			* itemMaxWidth `number` the max width for an item, default to the terminal width
			* continueOnSubmit `boolean` if true, the submit action does not end the menu, the callback argument is ignored.
			  The 'submit' event should be listened instead.
			* selectedIndex `number` selected index at initialization (default: 0)
			* unsubmittableIndexes `Array` of `boolean` indexes that are not submittable (default: [])
			* submitted `boolean` if true, selected index is already submitted at initialization (default: false)
			* paused `boolean` (default: false) true if the menu start in paused/disabled mode
			* scrollRegionBottom `number` if set, it indicates the bottom line of the current scroll region
			* keyBindings `Object` overide default key bindings
			* cancelable `boolean` if ESCAPE is pressed, it exits, calling the callback with undefined values
			* exitOnUnexpectedKey `boolean` if an unexpected key is pressed, it exits, calling the callback with undefined values
		* callback( error , response ), where:
			* error
			* response `Object` where:
				* selectedIndex `number` the user-selected menu item index
				* selectedText `string` the user-selected menu item text
				* x `number` the x coordinate of the selected menu item (the first character)
				* y `number` the y coordinate of the selected menu item
				* unexpectedKey `string` when 'exitOnUnexpectedKey' option is set, this contains the key that produced the exit
				* canceled `bool` when 'cancelable' option is set, this is set to true
*/
module.exports = function singleColumnMenu( menuItemsArg , options , callback ) {
	if ( arguments.length < 1 ) { throw new Error( '[terminal] singleColumnMenu() needs at least an array of menuItems' ) ; }
	if ( ! Array.isArray( menuItemsArg ) || ! menuItemsArg.length ) { throw new TypeError( '[terminal] singleColumnMenu(): argument #0 should be a non-empty array' ) ; }

	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }

	if ( ! options.style ) { options.style = this ; }
	if ( ! options.selectedStyle ) { options.selectedStyle = this.inverse ; }
	if ( ! options.submittedStyle ) { options.submittedStyle = this.bgGray.bold ; }
	if ( ! options.disabledStyle ) { options.disabledStyle = this.dim ; }
	if ( ! options.disabledSelectedStyle ) { options.disabledSelectedStyle = this.bgGray.dim ; }
	if ( ! options.disabledSubmittedStyle ) { options.disabledSubmittedStyle = this.bgGray ; }

	if ( options.leftPadding === undefined ) { options.leftPadding = ' ' ; }
	if ( options.selectedLeftPadding === undefined ) { options.selectedLeftPadding = options.leftPadding ; }
	if ( options.submittedLeftPadding === undefined ) { options.submittedLeftPadding = options.leftPadding ; }

	if ( typeof options.extraLines !== 'number' || options.extraLines < 0 ) { options.extraLines = 1 ; }

	if ( ! options.itemMaxWidth ) { options.itemMaxWidth = this.width - 1 ; }

	if ( ! options.unsubmittableIndexes ) { options.unsubmittableIndexes = [] ; }

	var selectedIndex = options.selectedIndex || 0 ;
	var submittedIndex = options.submitted ? options.selectedIndex : null ;
	var paused = !! options.paused ;

	var keyBindings = options.keyBindings || defaultKeyBindings ;

	if ( ! this.grabbing ) { this.grabInput() ; }


	var start = {} , end = {} , textWidth , outerWidth , paddingLength ,
		menuItems , offsetY = 0 , lineCount = 0 , scrollLines = 0 ,
		controller , finished = false , alreadyCleanedUp = false ;



	// Functions...



	var init = () => {
		computeItems( menuItemsArg ) ;

		if ( options.y !== undefined ) {
			this.moveTo( 1 , options.y ) ;
			finishInit( 1 , options.y ) ;
		}
		else {
			this( '\n' ) ;
			this.getCursorLocation( ( error , x , y ) => {
				if ( error ) { cleanup( error ) ; return ; }
				finishInit( x , y ) ;
			} ) ;
		}
	} ;



	var computeItems = ( menuItems_ ) => {
		textWidth = 0 ;

		paddingLength = Math.max( stringWidth( options.leftPadding ) , stringWidth( options.selectedLeftPadding ) ) ;

		menuItems_ = menuItems_.map( element => {
			if ( typeof element !== 'string' ) { element = '' + element ; }
			textWidth = Math.max( textWidth , stringWidth( element ) ) ;
			return element ;
		} ) ;

		if ( ! options.oneLineItem && textWidth > options.itemMaxWidth - paddingLength ) {
			outerWidth = Math.min( textWidth + paddingLength , this.width ) ;

			menuItems = menuItems_.map( ( element , index ) => {

				var item , lines ,
					lineLength = options.itemMaxWidth - paddingLength ;

				lines = string.wordwrap( element , {
					width: lineLength ,
					noJoin: true ,
					fill: true ,
					skipFn: termkit.escapeSequenceSkipFn
				} ) ;

				item = {
					offsetY: offsetY ,
					index: index ,
					text: element ,
					displayText: lines
				} ;

				offsetY += lines.length ;

				return item ;
			} ) ;

			lineCount = offsetY ;
		}
		else {
			textWidth = Math.min( textWidth , options.itemMaxWidth - paddingLength ) ;
			outerWidth = Math.min( textWidth + paddingLength , this.width ) ;

			menuItems = menuItems_.map( ( element , index ) => {
				var elementWidth = stringWidth( element ) ;

				return {
					offsetY: index ,
					index: index ,
					text: element ,
					displayText: [ elementWidth > textWidth ?
						element.slice( 0 , textWidth - 1 ) + '…' :
						element + ' '.repeat( textWidth - elementWidth ) ]
				} ;
			} ) ;

			lineCount = menuItems.length ;
		}
	} ;



	var finishInit = ( x , y ) => {
		// It is possible for userland to end the menu immediately
		if ( finished ) { return ; }

		prepareArea( x , y ) ;
		redraw() ;

		this.on( 'key' , onKey ) ;
		if ( this.mouseGrabbing ) { this.on( 'mouse' , onMouse ) ; }

		controller.emit( 'ready' ) ;
	} ;



	var prepareArea = ( x , y ) => {
		start.x = x ;
		start.y = y ;

		end.x = 1 ;
		end.y = y + lineCount ;

		scrollLines = start.y + lineCount - ( options.scrollRegionBottom || this.height ) - 1 + options.extraLines ;

		if ( scrollLines > 0 ) {
			// create extra lines
			this( '\n'.repeat( scrollLines ) ) ;
			start.y -= scrollLines ;
			end.y -= scrollLines ;
		}
	} ;



	var cleanup = ( error , data , eraseMenu ) => {
		if ( alreadyCleanedUp ) { return ; }
		alreadyCleanedUp = true ;

		finished = true ;
		this.removeListener( 'key' , onKey ) ;
		this.removeListener( 'mouse' , onMouse ) ;

		if ( error === 'abort' ) { return ; }

		if ( controller.hasState( 'ready' ) ) {
			if ( eraseMenu ) { erase() ; }
			else { this.moveTo( 1 , end.y ) ; }
		}

		if ( error ) {
			if ( callback ) { callback( error ) ; }
			else { controller.promise.reject( error ) ; }
			return ;
		}

		var value = data !== undefined ? data : {
			selectedIndex: selectedIndex ,
			selectedText: menuItems[ selectedIndex ].text ,
			submitted: submittedIndex !== null ,
			x: 1 ,
			y: start.y + menuItems[ selectedIndex ].offsetY
		} ;

		if ( callback ) { callback( undefined , value ) ; }
		else { controller.promise.resolve( value ) ; }
	} ;



	var erase = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , erase ) ; return ; }

		var i , j ;

		for ( i = start.x , j = start.y ; j <= end.y ; i = 1 , j ++ ) {
			this.moveTo.eraseLineAfter( i , j ) ;
		}

		this.moveTo( 1 , start.y ) ;
	} ;



	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = () => {
		for ( var i = 0 ; i < menuItems.length ; i ++ ) { redrawItem( i ) ; }
		redrawCursor() ;
	} ;



	var redrawItem = ( index ) => {

		// Called by finishInit before emitting 'ready'
		//if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , redrawItem.bind( undefined , index ) ) ; return ; }

		var item = menuItems[ index ] ;

		item.displayText.forEach( ( text , line ) => {

			this.moveTo( 1 , start.y + item.offsetY + line ) ;

			if ( paused || options.unsubmittableIndexes[ index ] ) {
				if ( index === submittedIndex ) {
					if ( line ) { options.disabledSubmittedStyle.forceStyleOnReset.noFormat( options.leftPadding ) ; }
					else { options.disabledSubmittedStyle.forceStyleOnReset.noFormat( options.submittedLeftPadding ) ; }

					options.disabledSubmittedStyle.forceStyleOnReset.noFormat( text ) ;
				}
				else if ( index === selectedIndex ) {
					if ( line ) { options.disabledSelectedStyle.forceStyleOnReset.noFormat( options.leftPadding ) ; }
					else { options.disabledSelectedStyle.forceStyleOnReset.noFormat( options.selectedLeftPadding ) ; }

					options.disabledSelectedStyle.forceStyleOnReset.noFormat( text ) ;
				}
				else {
					options.disabledStyle.forceStyleOnReset.noFormat( options.leftPadding ) ;
					options.disabledStyle.forceStyleOnReset.noFormat( text ) ;
				}
			}
			else if ( index === submittedIndex ) {
				if ( line ) { options.submittedStyle.forceStyleOnReset.noFormat( options.leftPadding ) ; }
				else { options.submittedStyle.forceStyleOnReset.noFormat( options.submittedLeftPadding ) ; }

				options.submittedStyle.forceStyleOnReset.noFormat( text ) ;
			}
			else if ( index === selectedIndex ) {
				if ( line ) { options.selectedStyle.forceStyleOnReset.noFormat( options.leftPadding ) ; }
				else { options.selectedStyle.forceStyleOnReset.noFormat( options.selectedLeftPadding ) ; }

				options.selectedStyle.forceStyleOnReset.noFormat( text ) ;
			}
			else {
				options.style.forceStyleOnReset.noFormat( options.leftPadding ) ;
				options.style.forceStyleOnReset.noFormat( text ) ;
			}
		} ) ;
	} ;



	var redrawCursor = () => {
		// Called by finishInit before emitting 'ready'
		//if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , redrawCursor ) ; return ; }
		this.moveTo( 1 , start.y + menuItems[ selectedIndex ].offsetY ) ;
	} ;



	var select = ( index ) => {
		var oldSelectedIndex = selectedIndex ;

		if ( selectedIndex !== index && index >= 0 && index < menuItems.length ) {
			selectedIndex = index ;

			// Don't redraw now if not ready, it will be drawn once ready (avoid double-draw)
			if ( controller.hasState( 'ready' ) ) {
				redrawItem( oldSelectedIndex ) ;
				redrawItem( selectedIndex ) ;
				redrawCursor() ;
			}
		}
	} ;



	var submit = () => {
		if ( submittedIndex !== null || options.unsubmittableIndexes[ selectedIndex ] ) { return ; }
		submittedIndex = selectedIndex ;

		// Don't redraw now if not ready, it will be drawn once ready (avoid double-draw)
		if ( controller.hasState( 'ready' ) ) {
			redrawItem( submittedIndex ) ;
			redrawCursor() ;
		}

		controller.emit( 'submit' , {
			selectedIndex: submittedIndex ,
			selectedText: menuItems[ submittedIndex ].text ,
			submitted: true ,
			x: 1 ,
			y: start.y + menuItems[ submittedIndex ].offsetY
		} ) ;

		if ( ! options.continueOnSubmit ) { cleanup() ; }
	} ;



	var cancel = () => {
		var oldSelectedIndex = submittedIndex ;

		if ( submittedIndex === null ) { return ; }
		submittedIndex = null ;
		redrawItem( oldSelectedIndex ) ;
		redrawCursor() ;
		controller.emit( 'cancel' ) ;
	} ;



	var pause = () => {
		if ( paused ) { return ; }
		paused = true ;

		// Don't redraw now if not ready, it will be drawn once ready (avoid double-draw)
		if ( controller.hasState( 'ready' ) ) { redraw() ; }
	} ;



	var resume = () => {
		if ( ! paused ) { return ; }
		paused = false ;

		// Don't redraw now if not ready, it will be drawn once ready (avoid double-draw)
		if ( controller.hasState( 'ready' ) ) { redraw() ; }
	} ;



	var onKey = ( key , trash , data ) => {

		if ( finished || paused ) { return ; }

		var oldSelectedIndex = selectedIndex ;

		switch ( keyBindings[ key ] ) {
			case 'submit' :
				submit() ;
				break ;

			case 'previous' :
				if ( submittedIndex !== null ) { return ; }
				if ( selectedIndex > 0 ) {
					selectedIndex -- ;
					redrawItem( selectedIndex ) ;
					redrawItem( selectedIndex + 1 ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;

			case 'next' :
				if ( submittedIndex !== null ) { return ; }
				if ( selectedIndex < menuItems.length - 1 ) {
					selectedIndex ++ ;
					redrawItem( selectedIndex - 1 ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;

			case 'cyclePrevious' :
				if ( submittedIndex !== null ) { return ; }
				selectedIndex -- ;

				if ( selectedIndex < 0 ) { selectedIndex = menuItems.length - 1 ; }

				redrawItem( oldSelectedIndex ) ;
				redrawItem( selectedIndex ) ;
				redrawCursor() ;
				//redraw() ;
				break ;

			case 'cycleNext' :
				if ( submittedIndex !== null ) { return ; }
				selectedIndex ++ ;

				if ( selectedIndex >= menuItems.length ) { selectedIndex = 0 ; }

				redrawItem( oldSelectedIndex ) ;
				redrawItem( selectedIndex ) ;
				redrawCursor() ;
				//redraw() ;
				break ;

			case 'first' :
				if ( submittedIndex !== null ) { return ; }
				if ( selectedIndex !== 0 ) {
					selectedIndex = 0 ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;

			case 'last' :
				if ( submittedIndex !== null ) { return ; }
				if ( selectedIndex !== menuItems.length - 1 ) {
					selectedIndex = menuItems.length - 1 ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;

			case 'cancel' :
				cancel() ;
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
	} ;



	var onMouse = ( name , data ) => {

		if ( finished || paused || submittedIndex !== null ) { return ; }

		// If out of bounds, exit now!
		if ( data.y < start.y || data.y >= end.y ) { return ; }

		var i , yMin , yMax ,
			inBounds = false ;

		for ( i = 0 ; i < menuItems.length ; i ++ ) {
			yMin = start.y + menuItems[ i ].offsetY ;
			yMax = start.y + menuItems[ i ].offsetY + menuItems[ i ].displayText.length - 1 ;

			if ( data.y >= yMin && data.y <= yMax && data.x < 1 + outerWidth ) {
				inBounds = true ;
				select( i ) ;
				break ;
			}
		}

		if ( inBounds && name === 'MOUSE_LEFT_BUTTON_PRESSED' ) {
			submit() ;
		}
	} ;



	// Return a controller for the menu

	controller = Object.create( NextGenEvents.prototype ) ;

	controller.defineStates( 'ready' ) ;

	// Stop everything and do not even call the callback
	controller.abort = () => {
		if ( finished ) { return ; }
		cleanup( 'abort' ) ;
	} ;

	// Stop and call the completion callback with no item
	controller.stop = ( eraseMenu ) => {
		if ( finished ) { return ; }
		cleanup( undefined , undefined , eraseMenu ) ;
	} ;

	controller.select = select ;
	controller.submit = submit ;
	controller.cancel = cancel ;
	controller.erase = erase ;

	// Pause and resume: the menu will not respond to event when paused
	controller.pause = pause ;
	controller.resume = resume ;
	controller.focus = ( value ) => {
		if ( value ) { resume() ; }
		else { pause() ; }
	} ;

	// Get the current state
	controller.getState = () => ( {
		selectedIndex: selectedIndex ,
		selectedText: menuItems[ selectedIndex ].text ,
		submitted: submittedIndex !== null ,
		start: start ,
		end: end ,
		x: 1 ,
		y: start.y + menuItems[ selectedIndex ].offsetY
		//scrollLines: scrollLines
	} ) ;

	// Get the current position
	controller.getPosition = () => ( { x: start.x , y: start.y } ) ;

	// Hide the menu
	controller.hide = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.hide ) ; return ; }
		erase() ;
	} ;

	// Show the menu
	controller.show = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.show ) ; return ; }
		redraw() ;
	} ;

	// Redraw the menu
	controller.redraw = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.redraw ) ; return ; }
		redraw() ;
	} ;

	// Redraw the cursor
	controller.redrawCursor = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.redrawCursor ) ; return ; }
		redrawCursor() ;
	} ;

	// Rebase the menu where the cursor is
	controller.rebase = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.rebase ) ; return ; }

		// First, disable the menu: getCursorLocation is async!
		var wasPaused = paused ;
		paused = true ;

		this.getCursorLocation( ( error , x , y ) => {

			if ( error ) { cleanup( error ) ; return ; }

			paused = wasPaused ;
			prepareArea( x , y ) ;
			redraw() ;
			controller.emit( 'rebased' ) ;
		} ) ;
	} ;

	controller.promise = new Promise() ;

	// Init the menu
	init() ;

	return controller ;
} ;


