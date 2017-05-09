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



var NextGenEvents = require( 'nextgen-events' ) ;
var string = require( 'string-kit' ) ;

var noop = function() {} ;



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
	DELETE: 'cancel'
} ;



/*
	singleColumnMenu( menuItems , [options] , callback )
		* menuItems `array` of menu item text
		* options `object` of options, where:
			* y `number` the line where the menu will be displayed, default to the next line
			* style `function` the style of unselected items, default to `term`
			* selectedStyle `function` the style of the selected item, default to `term.inverse`
			* submittededStyle `function` the style of the submitted item, default to `term.cyan.inverse`
			* leftPadding `string` the text to put before a menu item, default to ' '
			* selectedLeftPadding `string` the text to put before a selected menu item, default to ' '
			* submittedLeftPadding `string` the text to put before a submitted menu item, default to ' '
			* extraLines `number` ensure that many lines after the bottom of the menu
			* oneLineItem `boolean` if true (default: false), big items do not span multiple lines, instead they are truncated
			  and ended with an ellipsis char
			* itemMaxWidth `number` the max width for an item, default to the terminal width
			* continueOnSubmit `boolean` submit action do not end the menu
			* selectedIndex `number` selected index at initialization (default: 0)
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
module.exports = function singleColumnMenu( menuItems_ , options , callback )
{
	if ( arguments.length < 1 ) { throw new Error( '[terminal] singleColumnMenu() needs at least an array of menuItems' ) ; }
	if ( ! Array.isArray( menuItems_ ) || ! menuItems_.length ) { throw new TypeError( '[terminal] singleColumnMenu(): argument #0 should be a non-empty array' ) ; }
	
	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	if ( typeof callback !== 'function' ) { callback = noop ; }
	
	if ( ! options.style ) { options.style = this ; }
	if ( ! options.selectedStyle ) { options.selectedStyle = this.inverse ; }
	if ( ! options.submittedStyle ) { options.submittedStyle = this.cyan.inverse ; }
	
	if ( options.leftPadding === undefined ) { options.leftPadding = ' ' ; }
	if ( options.selectedLeftPadding === undefined ) { options.selectedLeftPadding = ' ' ; }
	if ( options.submittedLeftPadding === undefined ) { options.submittedLeftPadding = ' ' ; }
	
	if ( typeof options.extraLines !== 'number' || options.extraLines < 0 ) { options.extraLines = 1 ; }
	
	if ( ! options.itemMaxWidth ) { options.itemMaxWidth = this.width - 1 ; }
	
	var selectedIndex = options.selectedIndex || 0 ;
	
	if ( ! options.y ) { this( '\n' ) ; }
	else { this.moveTo( 1 , options.y ) ; }
	
	var keyBindings = options.keyBindings || defaultKeyBindings ;
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	
	var start = {} , end = {} , submittedIndex = null , textWidth , outerWidth , paddingLength ,
		menuItems , offsetY = 0 , lineCount = 0 ,
		controller , finished = false , alreadyCleanedUp = false , pause = false ;
	
	
	
				// Functions...
	
	
	
	var init = () => {
		computeItems( menuItems_ ) ;
		
		this.getCursorLocation( ( error , x , y ) => {
			if ( error ) { cleanup( error ) ; return ; }
			finishInit( x , y ) ;
		} ) ;
	} ;
	
	
	
	var computeItems = ( menuItems_ ) => {
		textWidth = 0 ;
		
		paddingLength = Math.max( options.leftPadding.length , options.selectedLeftPadding.length ) ;
		menuItems_.forEach( e => textWidth = Math.max( textWidth , e.length ) ) ;
		
		if ( ! options.oneLineItem && textWidth > options.itemMaxWidth - paddingLength )
		{
			outerWidth = Math.min( textWidth + paddingLength , this.width ) ;
			
			menuItems = menuItems_.map( ( element , index ) => {
				
				var item , lines ,
					lineLength = options.itemMaxWidth - paddingLength ;
				
				lines = string.wordwrap( element , lineLength , null )
					.map( line => line + ' '.repeat( lineLength - line.length ) ) ;
				
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
		else
		{
			textWidth = Math.min( textWidth , options.itemMaxWidth - paddingLength ) ;
			outerWidth = Math.min( textWidth + paddingLength , this.width ) ;
			
			menuItems = menuItems_.map( ( element , index ) => ( {
				offsetY: index ,
				index: index ,
				text: element ,
				displayText: [ element.length > textWidth ?
					element.slice( 0 , textWidth - 1 ) + '…' :
					element + ' '.repeat( textWidth - element.length ) ]
			} ) ) ;
			
			lineCount = menuItems.length ;
		}
	} ;
	
	
	
	var finishInit = ( x , y ) => {
		start.x = x ;
		start.y = y ;
		
		end.x = 1 ;
		end.y = y + lineCount ;
		
		var extra = start.y + lineCount - this.height - 1 + options.extraLines ;
		
		if ( extra > 0 )
		{
			// create extra lines
			this( '\n'.repeat( lineCount ) ) ;
			start.y -= extra ;
			end.y -= extra ;
		}
		
		redraw() ;
		
		this.on( 'key' , onKey ) ;
		if ( this.mouseGrabbing ) { this.on( 'mouse' , onMouse ) ; }
		
		controller.emit( 'ready' ) ;
	} ;
	
	
	
	var cleanup = ( error , data ) => {
		if ( alreadyCleanedUp ) { return ; }
		alreadyCleanedUp = true ;
        
        finished = true ;
		this.removeListener( 'key' , onKey ) ;
		this.removeListener( 'mouse' , onMouse ) ;
		
		if ( error === 'abort' ) { return ; }
		
		this.moveTo( 1 , end.y ) ;
		
		if ( error ) { callback( error ) ; return ; }
		
		callback( undefined , data !== undefined ? data : {
			selectedIndex: submittedIndex ,
			selectedText: menuItems[ submittedIndex ].text ,
			submitted: true ,
			x: 1 ,
			y: start.y + menuItems[ submittedIndex ].offsetY
		} ) ;
	} ;
	
	
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = () => {
		
		for ( var i = 0 ; i < menuItems.length ; i ++ ) { redrawItem( i ) ; }
		redrawCursor() ;
	} ;
	
	
	
	var redrawItem = ( index ) => {
		
		var item = menuItems[ index ] ;
		
		item.displayText.forEach( ( text , line ) => {
			
			this.moveTo( 1 , start.y + item.offsetY + line ) ;
			
			if ( index === submittedIndex )
			{
				if ( line ) { options.style.noFormat( options.leftPadding ) ; }
				else { options.selectedStyle.noFormat( options.submittedLeftPadding ) ; }
				
				options.submittedStyle.noFormat( text ) ;
			}
			else if ( index === selectedIndex )
			{
				if ( line ) { options.style.noFormat( options.leftPadding ) ; }
				else { options.selectedStyle.noFormat( options.selectedLeftPadding ) ; }
				
				options.selectedStyle.noFormat( text ) ;
			}
			else
			{
				options.style.noFormat( options.leftPadding ) ;
				options.style.noFormat( text ) ;
			}
		} ) ;
	} ;
	
	
	
	var redrawCursor = () => {
		this.moveTo( 1 , start.y + menuItems[ selectedIndex ].offsetY ) ;
	} ;
	
	
	
	var onKey = ( key , trash , data ) => {
		
		if ( finished || pause ) { return ; }
		
		var oldSelectedIndex = selectedIndex ;
		
		switch ( keyBindings[ key ] )
		{
			case 'submit' :
				if ( submittedIndex !== null ) { return ; }
				submittedIndex = selectedIndex ;
				
				controller.emit( 'submit' , {
					selectedIndex: submittedIndex ,
					selectedText: menuItems[ submittedIndex ].text ,
					submitted: true ,
					x: 1 ,
					y: start.y + menuItems[ submittedIndex ].offsetY
				} ) ;
				
				if ( ! options.continueOnSubmit ) { cleanup() ; }
				
				break ;
			
			case 'previous' :
				if ( submittedIndex !== null ) { return ; }
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
				if ( submittedIndex !== null ) { return ; }
				if ( selectedIndex < menuItems.length - 1 )
				{
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
				if ( submittedIndex !== null ) { return ; }
				if ( selectedIndex !== menuItems.length - 1 )
				{
					selectedIndex = menuItems.length - 1 ;
					redrawItem( oldSelectedIndex ) ;
					redrawItem( selectedIndex ) ;
					redrawCursor() ;
					//redraw() ;
				}
				break ;
			
			case 'cancel' :
				if ( submittedIndex === null ) { return ; }
				submittedIndex = null ;
				redrawItem( oldSelectedIndex ) ;
				break ;
			
			default :
				if ( options.exitOnUnexpectedKey )
				{
					cleanup( undefined , { unexpectedKey: key , unexpectedKeyData: data } ) ;
				}
				break ;
		}
	} ;
	
	
	
	var onMouse = ( name , data ) => {
		
		if ( finished || pause || submittedIndex !== null ) { return ; }
		
		// If out of bounds, exit now!
		if ( data.y < start.y || data.y >= end.y ) { return ; }
		
		var i , yMin , yMax ,
			inBounds = false ,
			oldSelectedIndex = selectedIndex ;
		
		for ( i = 0 ; i < menuItems.length ; i ++ )
		{
			yMin = start.y + menuItems[ i ].offsetY ;
			yMax = start.y + menuItems[ i ].offsetY + menuItems[ i ].displayText.length - 1 ;
			
			if ( data.y >= yMin && data.y <= yMax && data.x < 1 + outerWidth )
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
			submittedIndex = selectedIndex ;
			
			controller.emit( 'submit' , {
				selectedIndex: submittedIndex ,
				selectedText: menuItems[ submittedIndex ].text ,
				submitted: true ,
				x: 1 ,
				y: start.y + menuItems[ submittedIndex ].offsetY
			} ) ;
			
			if ( ! options.continueOnSubmit ) { cleanup() ; }
			
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
	controller.stop = () => {
		if ( finished ) { return ; }
		cleanup( undefined , null ) ;
	} ;
	
	// Pause and resume: the input field will not respond to event when paused
	controller.pause = () => { pause = true ; } ;
	controller.resume = () => { pause = false ; } ;
	controller.focus = ( value ) => { pause = ! value ; } ;
	
	// Get the current state
	controller.getState = () => ( {
		selectedIndex: selectedIndex ,
		selectedText: menuItems[ selectedIndex ].text ,
		submitted: submittedIndex !== null ,
		x: 1 ,
		y: start.y + menuItems[ selectedIndex ].offsetY
	} ) ;
	
	// Get the current position
	controller.getPosition = () => ( { x: start.x , y: start.y } ) ;
	
	// Hide the input field
	controller.hide = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.hide ) ; return ; }
		
		var i , j ;
		
		for ( i = start.x , j = start.y ; j <= end.y ; i = 1 , j ++ )
		{
			this.moveTo.eraseLineAfter( i , j ) ;
		}
	} ;
	
	// Show the input field
	controller.show = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.show ) ; return ; }
		redraw() ;
	} ;
	
	// Redraw the input field
	controller.redraw = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.redraw ) ; return ; }
		redraw() ;
	} ;
	
	// Rebase the input field where the cursor is
	controller.rebase = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.rebase ) ; return ; }
		
		this.getCursorLocation( ( error , x , y ) => {
			
			if ( error ) { cleanup( error ) ; return ; }
			
			start.x = x ;
			start.y = y ;
			end.x = 1 ;
			end.y = y + lineCount ;
			
			redraw() ;
		} ) ;
	} ;
	
	// Init the menu
	init() ;
	
	return controller ;
} ;


