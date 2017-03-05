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



var defaultTokenRegExp = /\S+/g ;



/*
	inputField( [options] , callback )
		* options `Object` where:
			* echo `boolean` if true (the default), input are displayed on the terminal
			* default `string` default input/placeholder
			* cancelable `boolean` if true (default: false), it is cancelable by user using the cancel key (default: ESC),
			  thus will return null
			* style `Function` style used, default to the terminal instance (no style)
			* hintStyle `Function` style used for hint (auto-completion preview), default to `terminal.brightBlack` (gray)
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
			* autoCompleteHint `boolean` if true (default: false) use the hintStyle to write the auto-completion preview
			  at the right of the input
			* keyBindings `Object` overide default key bindings
			* area `Object` define a rectangular area for the inputField, where
				* x `number` x coordinate of the top-left corner
				* y `number` y coordinate of the top-left corner
				* width `number` width of the area
				* height `number`  height of the area
				* textAttr `Object` an attr object for text cells
				* emptyAttr `Object` an attr object for empty cells
			* tokenHook `Function( token , previousTokens , term , config )` this is a hook called for each token of the input,
			  where:
				* token `String` is the current token
				* previousTokens `Array` of `String` is a array containing all tokens before the current one
				* term is a Terminal instance
				* config `Object` is an object containing dynamic settings that can be altered by the hook, where:
					* style `Function` style in use (see the *style* option)
					* hintStyle `Function` style in use for hint (see the *hintStyle* option)
					* tokenRegExp `RegExp` the regexp in use for tokenization (see the *tokenRegExp* option)
					* autoComplete `Array` or `Function( inputString , [callback] )` (see the *autoComplete* option)
					* autoCompleteMenu `boolean` or `Object` (see the *autoCompleteMenu* option)
					* autoCompleteHint `boolean` enable/disable the auto-completion preview (see the *autoCompleteHint* option)
			  The config settings are always reset on new input, on new tokenization pass.
			  The hook can return a *style* (`Function`, like the *style* option) that will be used to print that token.
			  Used together, this can achieve syntax hilighting, as well as dynamic behavior suitable for a shell.
			* tokenResetHook `Function( term , config )` this is a hook called before the first token
			* tokenRegExp `RegExp` this is the regex used to tokenize the input, by default a token is space-delimited,
			  so "one two three" would be tokenized as [ "one" , "two" , "three" ].
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
	
	
	
	var self = this , controller , finished = false , pause = false , alreadyCleanedUp = false ,
		offset = 0 , echo = !! options.echo ,
		keyBindings ,
		start = {} , end = {} , cursor = {} , endHint = {} ,
		inputs = [] , inputIndex ,
		inlineMode , screenBuffer , textBuffer , textAttr ,
		alwaysRedraw = options.tokenHook || options.autoCompleteHint ,
		hint = [] ;
	
	var dynamic = {
		style: options.style || self ,
		hintStyle: options.hintStyle || self.brightBlack ,
		tokenRegExp: options.tokenRegExp || defaultTokenRegExp ,
		autoComplete: options.autoComplete ,
		autoCompleteMenu: options.autoCompleteMenu ,
		autoCompleteHint: !! options.autoCompleteHint
	} ;
	
	
	
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
		//controller.ready = true ;
		controller.emit( 'ready' ) ;
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
		var scroll ;
		
		end = offsetCoordinate( inputs[ inputIndex ].length ) ;
		endHint = offsetCoordinate( inputs[ inputIndex ].length + hint.length ) ;
		
		if ( endHint.y > self.height )
		{
			// We have gone out of the screen, scroll!
			scroll = endHint.y - self.height ;
			
			dynamic.style.noFormat( '\n'.repeat( scroll ) ) ;
			
			start.y -= scroll ;
			end.y -= scroll ;
			endHint.y -= scroll ;
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
		
		self.moveTo( start.x , start.y ) ;
		
		if ( options.tokenHook ) { writeTokens( inputs[ inputIndex ].join( '' ) ) ; }
		else { dynamic.style.noFormat( inputs[ inputIndex ].join( '' ) ) ; }
		
		clearHint() ;
		
		if ( extraLines > 0 )
		{
			// If the previous input was using more lines, erase them now
			for ( i = 1 ; i <= extraLines ; i ++ )
			{
				self.moveTo( 1 , end.y + i ) ;
				dynamic.style.noFormat.eraseLineAfter( '' ) ;
			}
			
			self.moveTo( cursor.x , cursor.y ) ;
		}
	} ;
	
	
	
	var clearHint = function clearHint()
	{	
		var y = end.y ;
		
		self.moveTo( end.x , end.y ) ;
		dynamic.style.noFormat.eraseLineAfter( '' ) ;
		
		// If the previous input was using more lines, erase them now
		while ( y < endHint.y )
		{
			y ++ ;
			self.moveTo( 1 , y ) ;
			dynamic.style.noFormat.eraseLineAfter( '' ) ;
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
		
		self.singleLineMenu( menu , dynamic.autoCompleteMenu , function( error , response ) {
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
	
	
	
	var writeTokens = function writeTokens( text )
	{
		var match , lastIndex , lastEndIndex = 0 , tokens = [] , tokenStyle , extra ;
		
		// Reset dynamic stuffs
		dynamic.style = options.style || self ;
		dynamic.hintStyle = options.hintStyle || self.brightBlack ;
		dynamic.tokenRegExp = options.tokenRegExp || defaultTokenRegExp ;
		dynamic.autoComplete = options.autoComplete ;
		dynamic.autoCompleteMenu = options.autoCompleteMenu ;
		dynamic.autoCompleteHint = !! options.autoCompleteHint ;
		
		dynamic.tokenRegExp.lastIndex = 0 ;
		
		if ( options.tokenResetHook ) { options.tokenResetHook( self , dynamic ) ; }
		
		while ( ( match = dynamic.tokenRegExp.exec( text ) ) !== null )
		{
			// Back-up that now, since it can be modified by the hook
			lastIndex = dynamic.tokenRegExp.lastIndex ;
			
			if ( match.index > lastEndIndex ) { dynamic.style.noFormat( text.slice( lastEndIndex , match.index ) ) ; }
			
			tokenStyle = options.tokenHook( match[ 0 ] , tokens , self , dynamic ) || dynamic.style ;
			tokenStyle.noFormat( match[ 0 ] ) ;
			tokens.push( match[ 0 ] ) ;
			
			lastEndIndex = match.index + match[ 0 ].length ;
			
			// Restore it, if it was modified
			dynamic.tokenRegExp.lastIndex = lastIndex ;
		}
		
		if ( lastEndIndex < text.length ) { dynamic.style.noFormat( text.slice( lastEndIndex ) ) ; }
	} ;
	
	
	
	var autoCompleteHint = function autoCompleteHint()
	{
		// The cursor should be at the end ATM
		if ( ! dynamic.autoComplete || ! dynamic.autoCompleteHint || offset < inputs[ inputIndex ].length )
		{
			return ;
		}
		
		var autoCompleted , inputText = inputs[ inputIndex ].join( '' ) ;
		
		var finishCompletion = function finishCompletion()
		{
			if ( Array.isArray( autoCompleted ) ) { return ; }
			
			hint = string.unicode.toArray( autoCompleted.slice( inputText.length ) )
				.slice( 0 , options.maxLength - inputs[ inputIndex ].length ) ;
			
			computeAllCoordinate() ;
			self.moveTo( end.x , end.y ) ;	// computeAllCoordinate() can add some newline
			dynamic.hintStyle.noFormat( hint.join( '' ) ) ;
			self.moveTo( cursor.x , cursor.y ) ;
		} ;
		
		if ( Array.isArray( dynamic.autoComplete ) )
		{
			autoCompleted = autoComplete( dynamic.autoComplete , inputText , dynamic.autoCompleteMenu ) ;
		}
		else if ( typeof dynamic.autoComplete === 'function' )
		{
			if ( dynamic.autoComplete.length === 2 )
			{
				dynamic.autoComplete( inputText , function( error , autoCompleted_ ) {
					
					if ( error ) { cleanup( error ) ; return ; }
					
					autoCompleted = autoCompleted_ ;
					finishCompletion() ;
				} ) ;
				return ;
			}
			else
			{
				autoCompleted = dynamic.autoComplete( inputText ) ;
			}
		}
		
		finishCompletion() ;
	} ;
	
	
	
	var onKey = function onKey( key , trash , data ) {
		if ( finished || pause ) { return ; }
		
		if ( inlineMode ) { onInlineKey( key , trash , data ) ; }
		else { onAreaKey( key , trash , data ) ; }
	} ;
	
	
	
	// The main method: the key event handler for the inline mode
	var onInlineKey = function onInlineKey( key , trash , data ) {
		
		var leftPart , autoCompleted , extraLines , lastOffset = offset ;
		
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
				if ( offset === inputs[ inputIndex ].length && ! alwaysRedraw )
				{
					dynamic.style.noFormat( key ) ;
					// Now it's done by computeAllCoordinate()
					//if ( cursor.x >= self.width ) { dynamic.style.noFormat( '\n' ) ; }
					computeAllCoordinate() ;
				}
				else
				{
					// redraw() is mandatory in insert mode
					computeAllCoordinate() ;
					redraw() ;
					if ( dynamic.autoCompleteHint ) { autoCompleteHint() ; }
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
							if ( cursor.y < end.y || cursor.x === 1 || alwaysRedraw )
							{
								computeAllCoordinate() ;
								redraw() ;
								if ( dynamic.autoCompleteHint ) { autoCompleteHint() ; }
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
							if ( cursor.y < end.y || alwaysRedraw )
							{
								computeAllCoordinate() ;
								redraw() ;
								if ( dynamic.autoCompleteHint ) { autoCompleteHint() ; }
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
						if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length )
						{
							clearHint() ;
						}
						
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
						
						if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length )
						{
							autoCompleteHint() ;
						}
					}
					
					break ;
				
				//case 'HOME' :
				case 'startOfInput' :
					if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length )
					{
						clearHint() ;
					}
					
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
					
					if ( dynamic.autoCompleteHint && lastOffset !== inputs[ inputIndex ].length )
					{
						autoCompleteHint() ;
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
						
					if ( ! dynamic.autoComplete ) { break ; }
					
					leftPart = inputs[ inputIndex ].slice( 0 , offset ) ;
					
					var finishCompletion = function finishCompletion()
					{
						if ( Array.isArray( autoCompleted ) )
						{
							if ( dynamic.autoCompleteMenu ) { autoCompleteMenu( autoCompleted ) ; }
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
						}
					} ;
					
					if ( Array.isArray( dynamic.autoComplete ) )
					{
						autoCompleted = autoComplete( dynamic.autoComplete , leftPart.join( '' ) , dynamic.autoCompleteMenu ) ;
					}
					else if ( typeof dynamic.autoComplete === 'function' )
					{
						if ( dynamic.autoComplete.length === 2 )
						{
							dynamic.autoComplete( leftPart.join( '' ) , function( error , autoCompleted_ ) {
								
								if ( error ) { cleanup( error ) ; return ; }
								
								autoCompleted = autoCompleted_ ;
								finishCompletion() ;
							} ) ;
							return ;
						}
						else
						{
							autoCompleted = dynamic.autoComplete( leftPart.join( '' ) ) ;
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
	
	
	
	// Return a controller for the input field
	
	controller = Object.create( NextGenEvents.prototype ) ;
	
	controller.defineStates( 'ready' ) ;
	
	// /!\ .ready is deprecated, it is now a getter to .hasState('ready')
	Object.defineProperty( controller , 'ready' , {
		get: function() { return this.hasState( 'ready' ) ; }
	} ) ;
	
	// Tmp, for compatibility
	controller.widgetType = 'inputField' ;
	
	// Stop everything and do not even call the callback
	controller.abort = function controllerAbort()
	{
		if ( finished ) { return ; }
		cleanup( 'abort' ) ;
	} ;
	
	// Stop and call the completion callback with the current input
	controller.stop = function controllerStop()
	{
		if ( finished ) { return ; }
		cleanup( undefined , inputs[ inputIndex ] ) ;
	} ;
	
	// Pause and resume: the input field will not respond to event when paused
	controller.pause = function controllerPause() { pause = true ; } ;
	controller.resume = function controllerResume() { pause = false ; } ;
	
	controller.focus = function controllerFocus( value )
	{
		pause = ! value ;
		if ( ! inlineMode ) { areaDrawCursor() ; }
	} ;
	
	// Get the current input
	controller.getInput = function controllerGetInput() {
		if ( inlineMode ) { return inputs[ inputIndex ].join( '' ) ; }
		else { return textBuffer.getText() ; }
	} ;
	
	controller.value = controller.getInput ;
	
	// Get the current input
	controller.getPosition = function controllerGetPosition() { return { x: start.x , y: start.y } ; } ;
	
	// Hide the input field
	controller.hide = function controllerHide()
	{
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.hide ) ; return ; }
		
		var i , j ;
		
		for ( i = start.x , j = start.y ; j <= end.y ; i = 1 , j ++ )
		{
			self.moveTo.eraseLineAfter( i , j ) ;
		}
		
		echo = false ;
	} ;
	
	// Show the input field
	controller.show = function controllerShow()
	{
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.show ) ; return ; }
		
		echo = true ;
		redraw() ;
	} ;
	
	// Redraw the input field
	controller.redraw = function controllerRedraw()
	{
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.redraw ) ; return ; }
		
		redraw() ;
	} ;
	
	// Rebase the input field where the cursor is
	controller.rebase = function controllerRebase()
	{
		if ( ! inlineMode ) { return ; }
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.rebase ) ; return ; }
		
		// First, disable echoing: getCursorLocation is async!
		echo = false ;
		
		self.getCursorLocation( function( error , x , y ) {
			
			if ( error ) { cleanup( error ) ; return ; }
			
			start.x = x ;
			start.y = y ;
			
			if ( options.echo )
			{
				echo = true ;
				computeAllCoordinate() ;
				redraw() ;
			}
		} ) ;
	} ;
	
	// Init the input field
	init() ;
	
	return controller ;
} ;



