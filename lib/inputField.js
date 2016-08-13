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



// Load modules
//var events = require( 'events' ) ;
var NextGenEvents = require( 'nextgen-events' ) ;
var string = require( 'string-kit' ) ;
var autoComplete = require( './autoComplete.js' ) ;
var ScreenBuffer = require( './ScreenBuffer.js' ) ;
var TextBuffer = require( './TextBuffer.js' ) ;



var defaultInlineKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	ESCAPE: 'cancel' ,
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	UP: 'historyPrevious' ,
	DOWN: 'historyNext' ,
	HOME: 'startOfInput' ,
	END: 'endOfInput' ,
	TAB: 'autoComplete'
} ;



var defaultAreaKeyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	ESCAPE: 'cancel' ,
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	UP: 'up' ,
	DOWN: 'down' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine' ,
	TAB: 'autoComplete'
} ;



/*
	inputField( [options] , callback )
		* options `Object` where:
			* echo `boolean` if true (the default), input are displayed on the terminal
			* default `string` default input/placeholder
			* cancelable `boolean` if true (default: false), it is cancelable by user using the ESC key, thus will return null
			* style `function` style used, default to `term()`
			* maxLength `number` maximum length of the input
			* minLength `number` minimum length of the input
			* history `Array` (optional) an history array, so UP and DOWN keys move up and down in the history
			* autoComplete `Array` or `Function( inputString , [callback] )` (optional) an array of possible completion,
			  so the TAB key will auto-complete the input field. If it is a function, it should accept an input `string`
			  and return the completed `string` (if no completion can be done, it should return the input string,
			  if multiple candidate are possible, it should return an array of string), if **the function accepts 2 arguments**
			  (checked using *function*.length), then **the auto-completer will be asynchronous**!
				/!\ Also, if autoCompleteMenu is set and the array contains a special property 'prefix', it will be prepended
				after autoCompleteMenu()!
			* autoCompleteMenu `boolean` or `Object` of options, used in conjunction with the 'autoComplete' options, if *truthy*
			  any auto-complete attempt having many completion candidates will display a menu to let the user choose between each
			  possibilities. If an object is given, it should contain options for the [.singleLineMenu()](#ref.singleLineMenu)
			  that is used for the completion (notice: some options are overwritten: 'y' and 'exitOnUnexpectedKey')
			* keyBindings `Object` overide default key bindings
			* area `Object` define a rectangular area for the inputField, where
				* x `number` x coordinate of the top-left corner
				* y `number` y coordinate of the top-left corner
				* width `number` width of the area
				* height `number`  height of the area
				* textAttr `Object` an attr object for text cells
				* emptyAttr `Object` an attr object for empty cells
		* callback( error , input )
			* error `mixed` truthy if an underlying error occurs
			* input `string` the user input
*/
module.exports = function inputField( options , callback )
{
	if ( arguments.length <= 0 ) { throw new Error( '[terminal] .inputField(): should at least provide one callback as argument' ) ; }
	if ( arguments.length === 1 ) { callback = options ; options = {} ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( options.echo === undefined ) { options.echo = true ; }
	
	if ( typeof options.maxLength !== 'number' ) { options.maxLength = Infinity ; }
	if ( typeof options.minLength !== 'number' ) { options.minLength = 0 ; }
	
	if ( options.autoCompleteMenu )
	{
		if ( typeof options.autoCompleteMenu !== 'object' ) { options.autoCompleteMenu = {} ; }
		options.autoCompleteMenu.exitOnUnexpectedKey = true ;
		delete options.autoCompleteMenu.y ;
	}
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	
	
	var self = this , controler , finished = false , pause = false , alreadyCleanedUp = false ,
		offset = 0 , echo = !! options.echo ,
		keyBindings ,
		start = {} , end = {} , cursor = {} ,
		inputs = [] , inputIndex ,
		inlineMode , screenBuffer , textBuffer , textAttr ,
		// IMPORTANT: force noFormat, because things like ^ will be interpreted without that
		writeStyle = ( options.style && options.style.noFormat ) || self.noFormat ;
	
	
	
	// Now inputs is an array of input, input being an array of char (thanks to JS using UCS-2 instead of UTF-8)
	
	if ( Array.isArray( options.history ) )
	{
		inputs = options.history.map( function( str ) {
			return string.unicode.toArray( str ).slice( 0 , options.maxLength ) ;
		} ) ;
	}
	
	
	if ( options.default && typeof options.default === 'string' )
	{
		inputs.push( string.unicode.toArray( options.default ).slice( 0 , options.maxLength ) ) ;
	}
	else
	{
		inputs.push( [] ) ;
	}
	
	
	inputIndex = inputs.length - 1 ;
	offset = inputs[ inputIndex ].length ;
	
	
	var init = function init()
	{
		if ( options.area )
		{
			inlineMode = false ;
			
			keyBindings = options.keyBindings || defaultAreaKeyBindings ;
			
			screenBuffer = ScreenBuffer.create( {
				dst: options.dst || self ,
				x: options.area.x ,
				y: options.area.y ,
				width: options.area.width ,
				height: options.area.height
			} ) ;
			
			textBuffer = TextBuffer.create( {
				dst: screenBuffer ,
				forceInBound: true
			} ) ;
			
			if ( options.area.emptyAttr ) { textBuffer.setEmptyCellAttr( options.area.emptyAttr ) ; }
			if ( options.area.textAttr ) { textAttr = ScreenBuffer.object2attr( options.area.textAttr ) ; }
			
			finishInit() ;
			return ;
		}
		
		inlineMode = true ;
		
		keyBindings = options.keyBindings || defaultInlineKeyBindings ;
		
		// Get the cursor location before getting started
		self.getCursorLocation( function( error , x , y ) {
			if ( error ) { cleanup( error ) ; return ; }
			finishInit( x , y ) ;
		} ) ;
	} ;
	
	
	var finishInit = function finishInit( x , y )
	{
		if ( inlineMode )
		{
			start.x = end.x = cursor.x = x ;
			start.y = end.y = cursor.y = y ;
			
			if ( inputs[ inputIndex ].length )
			{
				// There is already something (placeholder, ...), so redraw now!
				if ( inlineMode ) { computeAllCoordinate() ; }
				redraw() ;
			}
		}
		else
		{
			areaDraw() ;
		}
		
		self.on( 'key' , onKey ) ;
		//controler.ready = true ;
		controler.emit( 'ready' ) ;
	} ;
	
	
	var cleanup = function cleanup( error , input )
	{
		if ( alreadyCleanedUp ) { return ; }
		alreadyCleanedUp = true ;
		
		finished = true ;
		self.removeListener( 'key' , onKey ) ;
		
		if ( error === 'abort' ) { return ; }
		
		self.styleReset() ;
		
		if ( error ) { callback( error ) ; }
		else if ( typeof input === 'string' ) { callback( undefined , input ) ; }
		else if ( input ) { callback( undefined , input.join( '' ) ) ; }
		else { callback() ; }
	} ;
	
	
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
	var redraw = function redraw( extraLines )
	{
		var i ;
		
		if ( ! inlineMode )
		{
			textBuffer.draw() ;
			screenBuffer.draw() ;
			textBuffer.drawCursor() ;
			screenBuffer.drawCursor() ;
			return ;
		}
		
		extraLines = extraLines || 0 ;
		
		if ( extraLines < 0 )
		{
			// For some reason (probably because of history search) the number of lines has grown up,
			// so we need to force some scrolling first
			for ( i = extraLines ; i < 0 ; i ++ ) { self( '\n' ) ; }
		}
		
		self.moveTo( start.x , start.y ) ;
		writeStyle( inputs[ inputIndex ].join( '' ) ) ;
		self.moveTo( end.x , end.y ) ;
		writeStyle.eraseLineAfter( '' ) ;
		
		if ( extraLines > 0 )
		{
			// If the previous input was using more lines, erase them now
			for ( i = 1 ; i <= extraLines ; i ++ )
			{
				self.moveTo( 1 , end.y + i ) ;
				writeStyle.eraseLineAfter( '' ) ;
			}
		}
		
		self.moveTo( cursor.x , cursor.y ) ;
	} ;
	
	
	var areaDraw = function areaDraw()
	{
		textBuffer.draw() ;
		screenBuffer.draw() ;
		textBuffer.drawCursor() ;
		screenBuffer.drawCursor() ;
	} ;
	
	
	var areaDrawCursor = function areaDrawCursor()
	{
		textBuffer.drawCursor() ;
		screenBuffer.drawCursor() ;
	} ;
	
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var autoCompleteMenu = function autoCompleteMenu( menu )
	{
		pause = true ;
		
		self.singleLineMenu( menu , options.autoCompleteMenu , function( error , response ) {
			// Unpause unconditionnally
			pause = false ;
			if ( error ) { return ; }
			
			if ( response.selectedText )
			{
				// Prepend something before the text
				if ( menu.prefix ) { response.selectedText = menu.prefix + response.selectedText ; }
				
				response.selectedText = string.unicode.toArray( response.selectedText ).slice( 0 , options.maxLength ) ;
				
				inputs[ inputIndex ] = response.selectedText.concat(
					inputs[ inputIndex ].slice( offset , options.maxLength + offset - response.selectedText.length )
				) ;
				
				offset = response.selectedText.length ;
			}
			
			if ( echo )
			{
				// Erase the menu
				self.column.eraseLineAfter( 1 ) ;
				
				// If the input field was ending on the last line, we need to move it one line up
				if ( end.y >= self.height && start.y > 1 ) { start.y -- ; }
				
				computeAllCoordinate() ;
				redraw() ;
				self.moveTo( cursor.x , cursor.y ) ;
			}
			
			if ( response.unexpectedKey && response.unexpectedKey !== 'TAB' )
			{
				// Forward the key to the event handler
				onKey( response.unexpectedKey , undefined , response.unexpectedKeyData ) ;
			}
		} ) ;
	} ;
	
	
	
	// The main method: the key event handler for the inline mode
	
	var onKey = function onKey( key , trash , data ) {
		if ( finished || pause ) { return ; }
		
		if ( inlineMode ) { onInlineKey( key , trash , data ) ; }
		else { onAreaKey( key , trash , data ) ; }
	} ;
	
	
	
	var onInlineKey = function onInlineKey( key , trash , data ) {
		
		var leftPart , autoCompleted , extraLines ;
		
		if ( data && data.isCharacter )
		{
			// if data.isCharacter, this is a regular UTF-8 character, not a special key
			
			if ( inputs[ inputIndex ].length >= options.maxLength ) { return ; }
			
			// Insert version
			//inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset ) + key + inputs[ inputIndex ].slice( offset ) ;
			inputs[ inputIndex ].splice( offset , 0 , key ) ;
			offset ++ ;
			
			if ( echo )
			{
				if ( offset === inputs[ inputIndex ].length )
				{
					writeStyle( key ) ;
					if ( cursor.x >= self.width ) { writeStyle( '\n' ) ; }
					computeAllCoordinate() ;
				}
				else
				{
					// redraw() is mandatory in insert mode
					computeAllCoordinate() ;
					redraw() ;
				}
			}
		}
		else
		{
			// Here we have a special key
			
			switch( keyBindings[ key ] )
			{
				//case 'ENTER' :
				//case 'KP_ENTER' :
				case 'submit' :
					if ( inputs[ inputIndex ].length < options.minLength ) { break ; }
					cleanup( undefined , inputs[ inputIndex ] ) ;
					break ;
				
				//case 'ESCAPE' :
				case 'cancel' :
					if ( options.cancelable ) { cleanup() ; }
					break ;
				
				//case 'BACKSPACE' :
				case 'backDelete' :
					if ( inputs[ inputIndex ].length && offset > 0 )
					{
						//inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset - 1 ) + inputs[ inputIndex ].slice( offset ) ;
						inputs[ inputIndex ].splice( offset - 1 , 1 ) ;
						offset -- ;
						
						if ( echo )
						{
							// The cursor position check should happen BEFORE we modify it with computeAllCoordinate()
							if ( cursor.y < end.y || cursor.x === 1 )
							{
								computeAllCoordinate() ;
								redraw() ;
							}
							else
							{
								computeAllCoordinate() ;
								self.backDelete() ;
							}
						}
					}
					break ;
				
				//case 'DELETE' :
				case 'delete' :
					if ( inputs[ inputIndex ].length && offset < inputs[ inputIndex ].length )
					{
						//inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset ) + inputs[ inputIndex ].slice( offset + 1 ) ;
						inputs[ inputIndex ].splice( offset , 1 ) ;
						
						if ( echo )
						{
							// The cursor position check should happen BEFORE we modify it with computeAllCoordinate()
							if ( cursor.y < end.y )
							{
								computeAllCoordinate() ;
								redraw() ;
							}
							else
							{
								computeAllCoordinate() ;
								self.delete( 1 ) ;
							}
						}
					}
					break ;
				
				//case 'LEFT' :
				case 'backward' :
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
				
				//case 'RIGHT' :
				case 'forward' :
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
				
				//case 'HOME' :
				case 'startOfInput' :
					offset = 0 ;
					if ( echo )
					{
						computeAllCoordinate() ;
						self.moveTo( cursor.x , cursor.y ) ;
					}
					break ;
				
				//case 'END' :
				case 'endOfInput' :
					offset = inputs[ inputIndex ].length ;
					if ( echo )
					{
						computeAllCoordinate() ;
						self.moveTo( cursor.x , cursor.y ) ;
					}
					break ;
				
				//case 'DOWN' :
				case 'historyNext' :
					if ( inputIndex < inputs.length - 1 )
					{
						inputIndex ++ ;
						offset = inputs[ inputIndex ].length ;
						
						if ( echo )
						{
							extraLines = end.y - start.y ;
							computeAllCoordinate() ;
							extraLines -= end.y - start.y ;
							redraw( extraLines ) ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;
				
				//case 'UP' :
				case 'historyPrevious' :
					if ( inputIndex > 0 )
					{
						inputIndex -- ;
						offset = inputs[ inputIndex ].length ;
						
						if ( echo )
						{
							extraLines = end.y - start.y ;
							computeAllCoordinate() ;
							extraLines -= end.y - start.y ;
							redraw( extraLines ) ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;
				
				//case 'TAB' :
				case 'autoComplete' :
						
					if ( ! options.autoComplete ) { break ; }
					
					leftPart = inputs[ inputIndex ].slice( 0 , offset ) ;
					
					var finishCompletion = function finishCompletion()
					{
						if ( Array.isArray( autoCompleted ) && options.autoCompleteMenu )
						{
							autoCompleteMenu( autoCompleted ) ;
							return ;
						}
						
						leftPart = string.unicode.toArray( autoCompleted ).slice( 0 , options.maxLength ) ;
						
						inputs[ inputIndex ] = leftPart.concat(
							inputs[ inputIndex ].slice( offset , options.maxLength + offset - leftPart.length )
						) ;
						
						offset = leftPart.length ;
						
						if ( echo )
						{
							computeAllCoordinate() ;
							redraw() ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					} ;
					
					if ( Array.isArray( options.autoComplete ) )
					{
						autoCompleted = autoComplete( options.autoComplete , leftPart.join( '' ) , options.autoCompleteMenu ) ;
					}
					else if ( typeof options.autoComplete === 'function' )
					{
						if ( options.autoComplete.length === 2 )
						{
							options.autoComplete( leftPart.join( '' ) , function( error , autoCompleted_ ) {
								
								if ( error ) { cleanup( error ) ; return ; }
								
								autoCompleted = autoCompleted_ ;
								finishCompletion() ;
							} ) ;
							return ;
						}
						else
						{
							autoCompleted = options.autoComplete( leftPart.join( '' ) ) ;
						}
					}
					
					finishCompletion() ;
					
					break ;
			}
		}
	} ;
	
	
	
	var onAreaKey = function onAreaKey( key , trash , data ) {
		
		//var leftPart , autoCompleted , extraLines ;
		
		if ( data && data.isCharacter )
		{
			// if data.isCharacter, this is a regular UTF-8 character, not a special key
			//if ( inputs[ inputIndex ].length >= options.maxLength ) { return ; }
			if ( textAttr ) { textBuffer.insert( key , textAttr ) ; }
			else { textBuffer.insert( key ) ; }
			//textBuffer.insert( key , { color: 'white' } ) ;
			areaDraw() ;
		}
		else
		{
			// Here we have a special key
			
			switch( keyBindings[ key ] )
			{
				//case 'ENTER' :
				//case 'KP_ENTER' :
				case 'submit' :
					
					//if ( inputs[ inputIndex ].length < options.minLength ) { break ; }
					//cleanup( undefined , inputs[ inputIndex ] ) ;
					
					cleanup( undefined , textBuffer.getText() ) ;
					break ;
				
				case 'newLine' :
					textBuffer.newLine() ;
					areaDraw() ;
					break ;
				
				//case 'ESCAPE' :
				case 'cancel' :
					if ( options.cancelable ) { cleanup() ; }
					break ;
				
				//case 'BACKSPACE' :
				case 'backDelete' :
					textBuffer.backDelete() ;
					areaDraw() ;
					break ;
				
				//case 'DELETE' :
				case 'delete' :
					textBuffer.delete() ;
					areaDraw() ;
					break ;
				
				//case 'LEFT' :
				case 'backward' :
					textBuffer.moveBackward() ;
					areaDrawCursor() ;
					break ;
				
				//case 'RIGHT' :
				case 'forward' :
					textBuffer.moveForward() ;
					areaDrawCursor() ;
					break ;
				
				//case 'HOME' :
				case 'startOfLine' :
					textBuffer.moveToColumn( 0 ) ;
					areaDrawCursor() ;
					break ;
				
				//case 'END' :
				case 'endOfLine' :
					textBuffer.moveToEndOfLine() ;   
					areaDrawCursor() ;
					break ;
				
				//case 'DOWN' :
				case 'down' :
					textBuffer.moveDown() ;
					areaDrawCursor() ;
					break ;
				
				//case 'UP' :
				case 'up' :
					textBuffer.moveUp() ;
					areaDrawCursor() ;
					break ;
			}
		}
	} ;
	
	
	
	// Return a controler for the input field
	
	controler = Object.create( NextGenEvents.prototype ) ;
	
	controler.defineStates( 'ready' ) ;
	
	// /!\ .ready is deprecated, it is now a getter to .hasState('ready')
	Object.defineProperty( controler , 'ready' , {
		get: function() { return this.hasState( 'ready' ) ; }
	} ) ;
	
	// Tmp, for compatibility
	controler.widgetType = 'inputField' ;
	
	// Stop everything and do not even call the callback
	controler.abort = function controlerAbort()
	{
		if ( finished ) { return ; }
		cleanup( 'abort' ) ;
	} ;
	
	// Stop and call the completion callback with the current input
	controler.stop = function controlerStop()
	{
		if ( finished ) { return ; }
		cleanup( undefined , inputs[ inputIndex ] ) ;
	} ;
	
	// Pause and resume: the input field will not respond to event when paused
	controler.pause = function controlerPause() { pause = true ; } ;
	controler.resume = function controlerResume() { pause = false ; } ;
	
	controler.focus = function controlerFocus( value )
	{
		pause = ! value ;
		if ( ! inlineMode ) { areaDrawCursor() ; }
	} ;
	
	// Get the current input
	controler.getInput = function controlerGetInput() {
		if ( inlineMode ) { return inputs[ inputIndex ].join( '' ) ; }
		else { return textBuffer.getText() ; }
	} ;
	
	controler.value = controler.getInput ;
	
	// Get the current input
	controler.getPosition = function controlerGetPosition() { return { x: start.x , y: start.y } ; } ;
	
	// Hide the input field
	controler.hide = function controlerHide()
	{
		if ( ! controler.hasState( 'ready' ) ) { controler.once( 'ready' , controler.hide ) ; return ; }
		
		var i , j ;
		
		for ( i = start.x , j = start.y ; j <= end.y ; i = 1 , j ++ )
		{
			self.moveTo.eraseLineAfter( i , j ) ;
		}
		
		echo = false ;
	} ;
	
	// Show the input field
	controler.show = function controlerShow()
	{
		if ( ! controler.hasState( 'ready' ) ) { controler.once( 'ready' , controler.show ) ; return ; }
		
		echo = true ;
		redraw() ;
	} ;
	
	// Redraw the input field
	controler.redraw = function controlerRedraw()
	{
		if ( ! controler.hasState( 'ready' ) ) { controler.once( 'ready' , controler.redraw ) ; return ; }
		
		redraw() ;
	} ;
	
	// Rebase the input field where the cursor is
	controler.rebase = function controlerRebase()
	{
		if ( ! inlineMode ) { return ; }
		if ( ! controler.hasState( 'ready' ) ) { controler.once( 'ready' , controler.rebase ) ; return ; }
		
		// First, disable echoing: getCursorLocation is async!
		echo = false ;
		
		self.getCursorLocation( function( error , x , y ) {
			
			if ( error ) { cleanup( error ) ; return ; }
			
			start.x = x ;
			start.y = y ;
			
			if ( options.echo )
			{
				echo = true ;
				
				// This is a modified version of the redraw() code
				
				// No moveTo(), we are rebasing to the current cursor location
				writeStyle( inputs[ inputIndex ].join( '' ) ) ;
				computeAllCoordinate() ;
				self.moveTo.eraseLineAfter( end.x , end.y ) ;
				self.moveTo( cursor.x , cursor.y ) ;
			}
		} ) ;
	} ;
	
	// Init the input field
	init() ;
	
	return controler ;
} ;



