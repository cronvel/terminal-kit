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



var NextGenEvents = require( 'nextgen-events' ) ;
var Promise = require( 'seventh' ) ;
var string = require( 'string-kit' ) ;
var autoComplete = require( './autoComplete.js' ) ;



var defaultKeyBindings = {
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
	TAB: 'autoComplete' ,
	CTRL_LEFT: 'previousWord' ,
	CTRL_RIGHT: 'nextWord' ,
	ALT_D: 'deleteNextWord' ,
	CTRL_W: 'deletePreviousWord' ,
	CTRL_U: 'deleteAllBefore' ,
	CTRL_K: 'deleteAllAfter'
} ;



var defaultTokenRegExp = /\S+/g ;



/*
	inputField( [options] , callback )
		* options `Object` where:
			* y `number` the line where the input field will start (default to the current cursor location)
			* x `number` the column where the input field will start (default to the current cursor location,
			  or 1 if the *y* option is defined)
			* echo `boolean` if true (the default), input are displayed on the terminal
			* echoChar `string` or `true` if set, all characters are replaced by this one (useful for password fields),
			  if true, it is replaced by a dot: •
			* default `string` default input/placeholder
			* cursorPosition `integer` (default: -1, end of input) set the cursor position/offset in the input,
			  negative value starts from the end
			* cancelable `boolean` if true (default: false), it is cancelable by user using the cancel key (default: ESC),
			  thus will return undefined
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
			  If it does not accept a callback but returns a *thenable* (Promise-like), it will be asynchronous too.
				/!\ Also, if autoCompleteMenu is set and the array contains a special property 'prefix', it will be prepended
				after autoCompleteMenu()!
			* autoCompleteMenu `boolean` or `Object` of options, used in conjunction with the 'autoComplete' options, if *truthy*
			  any auto-complete attempt having many completion candidates will display a menu to let the user choose between each
			  possibilities. If an object is given, it should contain options for the [.singleLineMenu()](#ref.singleLineMenu)
			  that is used for the completion (notice: some options are overwritten: 'y' and 'exitOnUnexpectedKey')
			* autoCompleteHint `boolean` if true (default: false) use the hintStyle to write the auto-completion preview
			  at the right of the input
			* keyBindings `Object` overide default key bindings
			* tokenHook `Function( token , isEndOfInput , previousTokens , term , config )` this is a hook called for each
			  token of the input, where:
				* token `String` is the current token
				* isEndOfInput `boolean` true if this is the **last token and if it ends the input string**
				  (e.g. it is possible for the last token to be followed by some blank char, in that case *isEndOfInput*
				  would be false)
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
			  Finally, it can return a string, styled or not, that will be displayed in place of that token,
			  useful if the token should have multiple styles (but that string **MUST** contains the same number of
			  printable character, or it would lead hazardous behavior).
			* tokenResetHook `Function( term , config )` this is a hook called before the first token
			* tokenRegExp `RegExp` this is the regex used to tokenize the input, by default a token is space-delimited,
			  so "one two three" would be tokenized as [ "one" , "two" , "three" ].
		* callback( error , input )
			* error `mixed` truthy if an underlying error occurs
			* input `string` the user input
*/
module.exports = function inputField( options , callback ) {
	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }

	if ( options.echo === undefined ) { options.echo = true ; }

	if ( typeof options.maxLength !== 'number' ) { options.maxLength = Infinity ; }
	if ( typeof options.minLength !== 'number' ) { options.minLength = 0 ; }

	if ( options.echoChar && typeof options.echoChar !== 'string' ) { options.echoChar = '•' ; }

	if ( options.autoCompleteMenu ) {
		if ( typeof options.autoCompleteMenu !== 'object' ) { options.autoCompleteMenu = {} ; }
		options.autoCompleteMenu.exitOnUnexpectedKey = true ;
		delete options.autoCompleteMenu.y ;
	}

	var keyBindings = options.keyBindings || defaultKeyBindings ;

	if ( ! this.grabbing ) { this.grabInput() ; }



	var controller , finished = false , paused = false , alreadyCleanedUp = false ,
		offset = options.cursorPosition !== undefined ? options.cursorPosition : -1 ,
		echo = !! options.echo ,
		start = {} , end = {} , cursor = {} , endHint = {} ,
		inputs = [] , inputIndex ,
		alwaysRedraw = options.tokenHook || options.autoCompleteHint ,
		hint = [] , meta = false ;

	var dynamic = {
		style: options.style || this ,
		hintStyle: options.hintStyle || this.brightBlack ,
		tokenRegExp: options.tokenRegExp || defaultTokenRegExp ,
		autoComplete: options.autoComplete ,
		autoCompleteMenu: options.autoCompleteMenu ,
		autoCompleteHint: !! options.autoCompleteHint
	} ;



	// Now inputs is an array of input, input being an array of char (thanks to JS using UCS-2 instead of UTF-8)

	if ( Array.isArray( options.history ) ) {
		inputs = options.history.map( str => string.unicode.toArray( str ).slice( 0 , options.maxLength ) ) ;
	}


	if ( options.default && typeof options.default === 'string' ) {
		inputs.push( string.unicode.toArray( options.default ).slice( 0 , options.maxLength ) ) ;
	}
	else {
		inputs.push( [] ) ;
	}



	var init = () => {
		inputIndex = inputs.length - 1 ;
		offset = boundOffset( offset ) ;

		if ( options.y !== undefined ) {
			options.x = options.x || 1 ;
			this.moveTo.eraseLineAfter( options.x , options.y ) ;
			finishInit( options.x , options.y ) ;
		}
		else {
			// Get the cursor location before getting started
			this.getCursorLocation( ( error , x , y ) => {
				if ( error ) { cleanup( error ) ; return ; }
				finishInit( x , y ) ;
			} ) ;
		}
	} ;



	var finishInit = ( x , y ) => {
		start.x = end.x = cursor.x = x ;
		start.y = end.y = cursor.y = y ;

		if ( inputs[ inputIndex ].length ) {
			// There is already something (placeholder, ...), so redraw now!
			computeAllCoordinate() ;
			redraw() ;
		}

		this.on( 'key' , onKey ) ;
		//controller.ready = true ;
		controller.emit( 'ready' ) ;
	} ;



	var cleanup = ( error , input ) => {
		if ( alreadyCleanedUp ) { return ; }
		alreadyCleanedUp = true ;

		finished = true ;
		this.removeListener( 'key' , onKey ) ;

		if ( error === 'abort' ) { return ; }

		this.styleReset() ;

		if ( error ) {
			if ( callback ) { callback( error ) ; }
			else { controller.promise.reject( error ) ; }
			return ;
		}

		var value ;

		if ( typeof input === 'string' ) { value = input ; }
		else if ( input ) { value = input.join( '' ) ; }

		if ( callback ) { callback( undefined , value ) ; }
		else { controller.promise.resolve( value ) ; }
	} ;



	// Compute the coordinate of the cursor and end of a string, given a start coordinate
	var computeAllCoordinate = () => {
		var scroll ,
			inputWidth = string.unicode.arrayWidth( inputs[ inputIndex ] ) ,
			hintWidth = string.unicode.arrayWidth( hint ) ;

		end = offsetCoordinate( inputWidth ) ;
		endHint = offsetCoordinate( inputWidth + hintWidth ) ;

		if ( endHint.y > this.height ) {
			// We have gone out of the screen, scroll!
			scroll = endHint.y - this.height ;

			dynamic.style.noFormat( '\n'.repeat( scroll ) ) ;

			start.y -= scroll ;
			end.y -= scroll ;
			endHint.y -= scroll ;
		}

		cursorCoordinate() ;
	} ;



	// Cursor coordinate from the current offset
	var cursorCoordinate = () => {
		cursor = offsetCoordinate( string.unicode.arrayWidth( inputs[ inputIndex ] , offset ) ) ;
	} ;



	// Compute the coordinate of an offset, given a start coordinate
	var offsetCoordinate = offset_ => {
		return {
			x: 1 + ( start.x + offset_ - 1 ) % this.width ,
			y: start.y + Math.floor( ( start.x + offset_ - 1 ) / this.width )
		} ;
	} ;



	var boundOffset = offset_ => {
		if ( typeof offset_ !== 'number' || isNaN( offset_ ) ) { return inputs[ inputIndex ].length ; }

		if ( offset_ < 0 ) { offset_ = inputs[ inputIndex ].length + 1 + offset_ ; }

		if ( offset_ < 0 ) { offset_ = 0 ; }
		else if ( offset_ >= inputs[ inputIndex ].length ) { offset_ = inputs[ inputIndex ].length ; }

		return offset_ ;
	} ;



	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = ( extraLines , forceClear ) => {
		var i , hintCleared ;

		extraLines = extraLines || 0 ;

		if ( ! dynamic.autoCompleteHint && forceClear ) {
			// Used by history, when autoCompleteHint is off, the current line is not erased
			this.moveTo( end.x , end.y ) ;
			dynamic.style.noFormat.eraseLineAfter( '' ) ;
		}

		this.moveTo( start.x , start.y ) ;

		if ( options.tokenHook ) { writeTokens( inputs[ inputIndex ].join( '' ) ) ; }
		else if ( options.echoChar ) { dynamic.style.noFormat( options.echoChar.repeat( inputs[ inputIndex ].length ) ) ; }
		else { dynamic.style.noFormat( inputs[ inputIndex ].join( '' ) ) ; }

		hintCleared = clearHint() ;

		if ( extraLines > 0 ) {
			// If the previous input was using more lines, erase them now
			for ( i = 1 ; i <= extraLines ; i ++ ) {
				this.moveTo( 1 , end.y + i ) ;
				dynamic.style.noFormat.eraseLineAfter( '' ) ;
			}
		}

		if ( ! hintCleared && ( cursor.y < end.y || end.x === this.width ) ) {
			this.moveTo( end.x , end.y ) ;
			dynamic.style.noFormat.eraseLineAfter( '' ) ;
		}

		this.moveTo( cursor.x , cursor.y ) ;
	} ;



	// Not used internally for instance, only for controller.redrawCursor()
	var redrawCursor = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , redrawCursor ) ; return ; }
		this.moveTo( cursor.x , cursor.y ) ;
	} ;



	var pause = () => {
		if ( paused ) { return ; }
		paused = true ;

		// Don't redraw now if not ready, it will be drawn once ready (avoid double-draw)
		//if ( controller.hasState( 'ready' ) ) { redraw() ; }
	} ;



	var resume = () => {
		if ( ! paused ) { return ; }
		paused = false ;

		// Don't redraw now if not ready, it will be drawn once ready (avoid double-draw)
		if ( controller.hasState( 'ready' ) ) { redraw() ; }
	} ;



	var clearHint = () => {
		// First, check if there are some hints to be cleared
		if ( ! dynamic.autoCompleteHint ) { return false ; }

		var y = end.y ;

		this.moveTo( end.x , end.y ) ;
		dynamic.style.noFormat.eraseLineAfter( '' ) ;

		// If the previous input was using more lines, erase them now
		while ( y < endHint.y ) {
			y ++ ;
			this.moveTo( 1 , y ) ;
			dynamic.style.noFormat.eraseLineAfter( '' ) ;
		}

		this.moveTo( cursor.x , cursor.y ) ;

		return true ;
	} ;



	// Compute the coordinate of the end of a string, given a start coordinate
	var autoCompleteMenu = ( menu ) => {
		paused = true ;

		this.singleLineMenu( menu , dynamic.autoCompleteMenu , ( error , response ) => {
			// Unpause unconditionnally
			paused = false ;
			if ( error ) { return ; }

			if ( response.selectedText ) {
				// Prepend something before the text
				if ( menu.prefix ) { response.selectedText = menu.prefix + response.selectedText ; }

				// Append something after the text
				if ( menu.postfix ) { response.selectedText += menu.postfix ; }

				response.selectedText = string.unicode.toArray( response.selectedText ).slice( 0 , options.maxLength ) ;

				inputs[ inputIndex ] = response.selectedText.concat(
					inputs[ inputIndex ].slice( offset , options.maxLength + offset - response.selectedText.length )
				) ;

				offset = response.selectedText.length ;
			}

			if ( echo ) {
				// Erase the menu
				this.column.eraseLineAfter( 1 ) ;

				// If the input field was ending on the last line, we need to move it one line up
				if ( end.y >= this.height && start.y > 1 ) { start.y -- ; }

				computeAllCoordinate() ;
				redraw() ;
				this.moveTo( cursor.x , cursor.y ) ;
			}

			if ( response.unexpectedKey && response.unexpectedKey !== 'TAB' ) {
				// Forward the key to the event handler
				onKey( response.unexpectedKey , undefined , response.unexpectedKeyData ) ;
			}
		} ) ;
	} ;



	var writeTokens = ( text ) => {
		var match , lastIndex , lastEndIndex = 0 , tokens = [] , tokenStyle , isEndOfInput ;

		// Reset dynamic stuffs
		dynamic.style = options.style || this ;
		dynamic.hintStyle = options.hintStyle || this.brightBlack ;
		dynamic.tokenRegExp = options.tokenRegExp || defaultTokenRegExp ;
		dynamic.autoComplete = options.autoComplete ;
		dynamic.autoCompleteMenu = options.autoCompleteMenu ;
		dynamic.autoCompleteHint = !! options.autoCompleteHint ;

		dynamic.tokenRegExp.lastIndex = 0 ;

		if ( options.tokenResetHook ) { options.tokenResetHook( this , dynamic ) ; }

		while ( ( match = dynamic.tokenRegExp.exec( text ) ) !== null ) {
			// Back-up that now, since it can be modified by the hook
			lastIndex = dynamic.tokenRegExp.lastIndex ;

			if ( match.index > lastEndIndex ) { dynamic.style.noFormat( text.slice( lastEndIndex , match.index ) ) ; }

			isEndOfInput = match.index + match[ 0 ].length === text.length ;

			tokenStyle = options.tokenHook( match[ 0 ] , isEndOfInput , tokens , this , dynamic ) ;

			if ( typeof tokenStyle === 'function' ) { tokenStyle.noFormat( match[ 0 ] ) ; }
			else if ( typeof tokenStyle === 'string' ) { this.noFormat( tokenStyle ) ; }
			else { dynamic.style.noFormat( match[ 0 ] ) ; }

			tokens.push( match[ 0 ] ) ;

			lastEndIndex = match.index + match[ 0 ].length ;

			// Restore it, if it was modified
			dynamic.tokenRegExp.lastIndex = lastIndex ;
		}

		if ( lastEndIndex < text.length ) { dynamic.style.noFormat( text.slice( lastEndIndex ) ) ; }
	} ;



	var autoCompleteHint = () => {
		// The cursor should be at the end ATM
		if ( ! dynamic.autoComplete || ! dynamic.autoCompleteHint || offset < inputs[ inputIndex ].length ) {
			return ;
		}

		var autoCompleted , inputText = inputs[ inputIndex ].join( '' ) ;

		var finishCompletion = () => {
			if ( Array.isArray( autoCompleted ) ) { return ; }

			hint = string.unicode.toArray( autoCompleted.slice( inputText.length ) )
				.slice( 0 , options.maxLength - inputs[ inputIndex ].length ) ;

			computeAllCoordinate() ;
			this.moveTo( end.x , end.y ) ;	// computeAllCoordinate() can add some newline
			dynamic.hintStyle.noFormat( hint.join( '' ) ) ;
			this.moveTo( cursor.x , cursor.y ) ;
		} ;

		if ( Array.isArray( dynamic.autoComplete ) ) {
			autoCompleted = autoComplete( dynamic.autoComplete , inputText , dynamic.autoCompleteMenu ) ;
		}
		else if ( typeof dynamic.autoComplete === 'function' ) {
			if ( dynamic.autoComplete.length === 2 ) {
				dynamic.autoComplete( inputText , ( error , autoCompleted_ ) => {
					if ( error ) { cleanup( error ) ; return ; }

					autoCompleted = autoCompleted_ ;
					finishCompletion() ;
				} ) ;
				return ;
			}

			autoCompleted = dynamic.autoComplete( inputText ) ;

			if ( Promise.isThenable( autoCompleted ) ) {
				autoCompleted.then(
					autoCompleted_ => {
						autoCompleted = autoCompleted_ ;
						finishCompletion() ;
					} ,
					error => { cleanup( error ) ; }
				) ;
				return ;
			}
		}

		finishCompletion() ;
	} ;



	// The main method: the key event handler
	var onKey = ( key , trash , data ) => {

		if ( finished || paused ) { return ; }

		var leftPart , autoCompleted , extraLines , lastOffset = offset , cutOffset , altKey ;

		// if previous keystroke triggered the 'meta' keybinding, prepend ALT_ to this key
		if ( meta ) {
			meta = false ;
			altKey = 'ALT_' + key.toUpperCase() ;

			if ( data ) { data.isCharacter = false ; }
			if ( keyBindings[ altKey ] ) { key = altKey ; }
		}

		if ( data && data.isCharacter ) {
			// if data.isCharacter, this is a regular UTF-8 character, not a special key

			if ( inputs[ inputIndex ].length >= options.maxLength ) { return ; }

			// Insert version
			//inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset ) + key + inputs[ inputIndex ].slice( offset ) ;
			inputs[ inputIndex ].splice( offset , 0 , key ) ;
			offset ++ ;

			if ( echo ) {
				if ( offset === inputs[ inputIndex ].length && ! alwaysRedraw ) {
					dynamic.style.noFormat( options.echoChar || key ) ;
					// Now it's done by computeAllCoordinate()
					//if ( cursor.x >= this.width ) { dynamic.style.noFormat( '\n' ) ; }
					computeAllCoordinate() ;
				}
				else {
					// redraw() is mandatory in insert mode
					computeAllCoordinate() ;
					redraw() ;
					if ( dynamic.autoCompleteHint ) { autoCompleteHint() ; }
				}
			}
		}
		else {
			// Here we have a special key

			switch( keyBindings[ key ] ) {
				case 'submit' :
					if ( inputs[ inputIndex ].length < options.minLength ) { break ; }
					clearHint() ;
					cleanup( undefined , inputs[ inputIndex ] ) ;
					break ;

				case 'cancel' :
					if ( options.cancelable ) { cleanup() ; }
					break ;

				case 'meta' :
					meta = true ;
					break ;

				case 'backDelete' :
					if ( inputs[ inputIndex ].length && offset > 0 ) {
						//inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset - 1 ) + inputs[ inputIndex ].slice( offset ) ;
						inputs[ inputIndex ].splice( offset - 1 , 1 ) ;
						offset -- ;
						if ( echo ) {
							// The cursor position check should happen BEFORE we modify it with computeAllCoordinate()
							if ( cursor.y < end.y || cursor.x === 1 || alwaysRedraw ) {
								computeAllCoordinate() ;
								redraw() ;
								if ( dynamic.autoCompleteHint ) { autoCompleteHint() ; }
							}
							else {
								computeAllCoordinate() ;
								this.backDelete() ;
							}
						}
					}
					break ;

				case 'delete' :
					if ( inputs[ inputIndex ].length && offset < inputs[ inputIndex ].length ) {
						//inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset ) + inputs[ inputIndex ].slice( offset + 1 ) ;
						inputs[ inputIndex ].splice( offset , 1 ) ;

						if ( echo ) {
							// The cursor position check should happen BEFORE we modify it with computeAllCoordinate()
							if ( cursor.y < end.y || alwaysRedraw ) {
								computeAllCoordinate() ;
								redraw() ;
								if ( dynamic.autoCompleteHint ) { autoCompleteHint() ; }
							}
							else {
								computeAllCoordinate() ;
								this.delete( 1 ) ;
							}
						}
					}
					break ;

				case 'deleteAllBefore' :
					if ( inputs[ inputIndex ].length && offset > 0 ) {
						//inputs[ inputIndex ] = inputs[ inputIndex ].slice( 0 , offset - 1 ) + inputs[ inputIndex ].slice( offset ) ;
						inputs[ inputIndex ].splice( 0 , offset ) ;
						offset = 0 ;

						if ( echo ) {
							computeAllCoordinate() ;
							// Need forceClear
							redraw( undefined , true ) ;
						}
					}
					break ;

				case 'deleteAllAfter' :
					if ( inputs[ inputIndex ].length && offset < inputs[ inputIndex ].length ) {
						inputs[ inputIndex ].splice( offset , inputs[ inputIndex ].length - offset ) ;

						if ( echo ) {
							computeAllCoordinate() ;
							// Need forceClear
							redraw( undefined , true ) ;
							if ( dynamic.autoCompleteHint ) { autoCompleteHint() ; }
						}
					}
					break ;

				case 'backward' :
					if ( inputs[ inputIndex ].length && offset > 0 ) {
						if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length ) {
							clearHint() ;
						}

						offset -- ;

						if ( echo ) {
							computeAllCoordinate() ;
							this.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;

				case 'forward' :
					if ( inputs[ inputIndex ].length && offset < inputs[ inputIndex ].length ) {
						offset ++ ;

						if ( echo ) {
							computeAllCoordinate() ;
							this.moveTo( cursor.x , cursor.y ) ;
						}

						if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length ) {
							autoCompleteHint() ;
						}
					}

					break ;

				case 'deletePreviousWord' :
					if ( inputs[ inputIndex ].length && offset > 0 ) {
						if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length ) {
							clearHint() ;
						}

						cutOffset = offset -- ;

						while ( offset > 0 && inputs[ inputIndex ][ offset ] === ' ' ) { offset -- ; }
						while ( offset > 0 && inputs[ inputIndex ][ offset - 1 ] !== ' ' ) { offset -- ; }

						inputs[ inputIndex ].splice( offset , cutOffset - offset ) ;

						if ( echo ) {
							computeAllCoordinate() ;
							this.moveTo( cursor.x , cursor.y ) ;
							redraw( undefined , true ) ;
						}
					}
					break ;

				case 'deleteNextWord' :
					if ( inputs[ inputIndex ].length && offset < inputs[ inputIndex ].length ) {
						cutOffset = offset ;

						while ( offset < inputs[ inputIndex ].length && inputs[ inputIndex ][ offset ] === ' ' ) { offset ++ ; }
						while ( offset < inputs[ inputIndex ].length && inputs[ inputIndex ][ offset ] !== ' ' ) { offset ++ ; }
						while ( offset < inputs[ inputIndex ].length && inputs[ inputIndex ][ offset ] === ' ' ) { offset ++ ; }

						inputs[ inputIndex ].splice( cutOffset , offset - cutOffset ) ;
						offset = Math.min( inputs[ inputIndex ].length , cutOffset ) ;

						if ( echo ) {
							computeAllCoordinate() ;
							this.moveTo( cursor.x , cursor.y ) ;
							redraw( undefined , true ) ;
						}

						if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length ) {
							autoCompleteHint() ;
						}
					}
					break ;

				case 'previousWord' :
					if ( inputs[ inputIndex ].length && offset > 0 ) {
						if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length ) {
							clearHint() ;
						}

						offset -- ;

						while ( offset > 0 && inputs[ inputIndex ][ offset ] === ' ' ) { offset -- ; }
						while ( offset > 0 && inputs[ inputIndex ][ offset - 1 ] !== ' ' ) { offset -- ; }

						if ( echo ) {
							computeAllCoordinate() ;
							this.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;

				case 'nextWord' :
					if ( inputs[ inputIndex ].length && offset < inputs[ inputIndex ].length ) {
						while ( offset < inputs[ inputIndex ].length && inputs[ inputIndex ][ offset ] === ' ' ) { offset ++ ; }
						while ( offset < inputs[ inputIndex ].length && inputs[ inputIndex ][ offset ] !== ' ' ) { offset ++ ; }

						if ( echo ) {
							computeAllCoordinate() ;
							this.moveTo( cursor.x , cursor.y ) ;
						}

						if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length ) {
							autoCompleteHint() ;
						}
					}

					break ;

				case 'startOfInput' :
					if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length ) {
						clearHint() ;
					}

					offset = 0 ;

					if ( echo ) {
						computeAllCoordinate() ;
						this.moveTo( cursor.x , cursor.y ) ;
					}
					break ;

				case 'endOfInput' :
					offset = inputs[ inputIndex ].length ;

					if ( echo ) {
						computeAllCoordinate() ;
						this.moveTo( cursor.x , cursor.y ) ;
					}

					if ( dynamic.autoCompleteHint && lastOffset !== inputs[ inputIndex ].length ) {
						autoCompleteHint() ;
					}

					break ;

				case 'historyNext' :
					if ( inputIndex < inputs.length - 1 ) {
						inputIndex ++ ;
						offset = inputs[ inputIndex ].length ;

						if ( echo ) {
							extraLines = end.y - start.y ;
							computeAllCoordinate() ;
							extraLines -= end.y - start.y ;
							redraw( extraLines , true ) ;
							this.moveTo( cursor.x , cursor.y ) ;
						}

						// Not sure if this is desirable
						//if ( dynamic.autoCompleteHint ) { autoCompleteHint() ; }
					}
					break ;

				case 'historyPrevious' :
					if ( inputIndex > 0 ) {
						inputIndex -- ;
						offset = inputs[ inputIndex ].length ;

						if ( echo ) {
							extraLines = end.y - start.y ;
							computeAllCoordinate() ;
							extraLines -= end.y - start.y ;
							redraw( extraLines , true ) ;
							this.moveTo( cursor.x , cursor.y ) ;
						}

						// Not sure if this is desirable
						//if ( dynamic.autoCompleteHint ) { autoCompleteHint() ; }
					}
					break ;

				case 'autoComplete' :

					if ( ! dynamic.autoComplete ) { break ; }

					leftPart = inputs[ inputIndex ].slice( 0 , offset ) ;

					var finishCompletion = () => {

						if ( Array.isArray( autoCompleted ) ) {
							if ( dynamic.autoCompleteMenu ) { autoCompleteMenu( autoCompleted ) ; }
							return ;
						}

						leftPart = string.unicode.toArray( autoCompleted ).slice( 0 , options.maxLength ) ;

						inputs[ inputIndex ] = leftPart.concat(
							inputs[ inputIndex ].slice( offset , options.maxLength + offset - leftPart.length )
						) ;

						offset = leftPart.length ;

						if ( echo ) {
							computeAllCoordinate() ;
							redraw() ;
						}
					} ;

					if ( Array.isArray( dynamic.autoComplete ) ) {
						autoCompleted = autoComplete( dynamic.autoComplete , leftPart.join( '' ) , dynamic.autoCompleteMenu ) ;
					}
					else if ( typeof dynamic.autoComplete === 'function' ) {
						if ( dynamic.autoComplete.length === 2 ) {
							dynamic.autoComplete( leftPart.join( '' ) , ( error , autoCompleted_ ) => {
								if ( error ) { cleanup( error ) ; return ; }

								autoCompleted = autoCompleted_ ;
								finishCompletion() ;
							} ) ;
							return ;
						}

						autoCompleted = dynamic.autoComplete( leftPart.join( '' ) ) ;

						if ( Promise.isThenable( autoCompleted ) ) {
							autoCompleted.then(
								autoCompleted_ => {
									autoCompleted = autoCompleted_ ;
									finishCompletion() ;
								} ,
								error => { cleanup( error ) ; }
							) ;
							return ;
						}
					}

					finishCompletion() ;

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
	controller.abort = () => {
		if ( finished ) { return ; }
		cleanup( 'abort' ) ;
	} ;

	// Stop and call the completion callback with the current input
	controller.stop = () => {
		if ( finished ) { return ; }
		cleanup( undefined , inputs[ inputIndex ] ) ;
	} ;

	// Pause and resume: the input field will not respond to event when paused
	controller.pause = pause ;
	controller.resume = resume ;
	controller.focus = ( value ) => {
		if ( value ) { resume() ; }
		else { pause() ; }
	} ;

	// Get the current input
	controller.getInput = () => inputs[ inputIndex ].join( '' ) ;

	controller.value = controller.getInput ;

	// Get the current position
	controller.getPosition = () => ( { x: start.x , y: start.y } ) ;

	// Hide the input field
	controller.hide = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.hide ) ; return ; }

		var i , j ;

		for ( i = start.x , j = start.y ; j <= end.y ; i = 1 , j ++ ) {
			this.moveTo.eraseLineAfter( i , j ) ;
		}

		echo = false ;
	} ;

	// Show the input field
	controller.show = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.show ) ; return ; }
		echo = true ;
		redraw() ;
	} ;

	// Redraw the input field
	controller.redraw = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.redraw ) ; return ; }
		redraw() ;
	} ;

	// Redraw the cursor
	controller.redrawCursor = () => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.redrawCursor ) ; return ; }
		redrawCursor() ;
	} ;

	controller.getCursorPosition = () => offset ;

	controller.setCursorPosition = newOffset => {

		newOffset = boundOffset( newOffset ) ;

		if ( newOffset !== offset ) {
			if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length ) {
				clearHint() ;
			}

			offset = newOffset ;

			if ( echo ) {
				computeAllCoordinate() ;
				this.moveTo( cursor.x , cursor.y ) ;
			}

			if ( dynamic.autoCompleteHint && offset === inputs[ inputIndex ].length ) {
				autoCompleteHint() ;
			}
		}
	} ;

	// Rebase the input field where the cursor is
	controller.rebase = ( x , y ) => {
		if ( ! controller.hasState( 'ready' ) ) { controller.once( 'ready' , controller.rebase ) ; return ; }

		var rebaseTo = ( x_ , y_ ) => {

			start.x = x_ ;
			start.y = y_ ;

			if ( options.echo ) {
				echo = true ;
				computeAllCoordinate() ;
				redraw() ;
			}

			controller.emit( 'rebased' ) ;
		} ;

		if ( x !== undefined && y !== undefined ) {
			rebaseTo( x , y ) ;
			return ;
		}

		// First, disable echoing: getCursorLocation is async!
		echo = false ;

		this.getCursorLocation( ( error , x_ , y_ ) => {

			if ( error ) { cleanup( error ) ; return ; }
			rebaseTo( x_ , y_ ) ;
		} ) ;
	} ;

	controller.promise = new Promise() ;


	// Init the input field
	init() ;

	return controller ;
} ;


