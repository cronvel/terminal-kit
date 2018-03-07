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



var termkit = {} ;
module.exports = termkit ;



// Global config
termkit.globalConfig = {} ;



// Load submodules in the termkit tree
termkit.tty = require( './tty.js' ) ;

// For some reason, starting from node v4, once process.stdin getter is triggered, the 'tty' command would not work properly.
// This 'hack' cache the result of the command 'tty' if we are in the linux console, so 'gpm' can work.
if ( process.env.TERM === 'linux' ) { termkit.tty.getPath() ; }

Object.assign( termkit , require( './misc.js' ) ) ;
Object.assign( termkit , require( './detectTerminal.js' ) ) ;

termkit.image = require( './image.js' ) ;
termkit.Rect = require( './Rect.js' ) ;
termkit.ScreenBuffer = require( './ScreenBuffer.js' ) ;
termkit.ScreenBufferHD = require( './ScreenBufferHD.js' ) ;
termkit.TextBuffer = require( './TextBuffer.js' ) ;
termkit.autoComplete = require( './autoComplete.js' ) ;
termkit.spChars = require( './spChars.js' ) ;

termkit.Terminal = require( './Terminal.js' ) ;
termkit.createTerminal = termkit.Terminal.create ;

// Lazy loading?
termkit.Element = require( './document/Element.js' ) ;
termkit.Document = require( './document/Document.js' ) ;
termkit.Container = require( './document/Container.js' ) ;
termkit.Text = require( './document/Text.js' ) ;
termkit.Button = require( './document/Button.js' ) ;
termkit.TextInput = require( './document/TextInput.js' ) ;
termkit.Form = require( './document/Form.js' ) ;
termkit.RowMenu = require( './document/RowMenu.js' ) ;
termkit.ColumnMenu = require( './document/ColumnMenu.js' ) ;
termkit.DropDownMenu = require( './document/DropDownMenu.js' ) ;
termkit.Layout = require( './document/Layout.js' ) ;



if ( process.platform === 'win32' ) {
	// Windows compatibility
	require( './windows.js' )( termkit ) ;
}



// The default terminal will be lazily created
Object.defineProperty( termkit , 'terminal' , {
	configurable: true ,
	enumerable: true ,
	get: function() {

		var guessed = termkit.guessTerminal() ;
		var guessedTerminal = termkit.createTerminal( {
			stdin: process.stdin ,
			stdout: process.stdout ,
			stderr: process.stderr ,
			generic: guessed.generic || 'unknown' ,
			appId: guessed.safe ? guessed.appId : undefined ,
			//	appName: guessed.safe ? guessed.appName : undefined ,
			processSigwinch: true ,
			preferProcessSigwinch: !! termkit.globalConfig.preferProcessSigwinch
			// couldTTY: true
		} ) ;

		Object.defineProperty( termkit , 'terminal' , { value: guessedTerminal , enumerable: true } ) ;

		return guessedTerminal ;
	}
} ) ;



// The default terminal will be lazily created
Object.defineProperty( termkit , 'realTerminal' , {
	configurable: true ,
	enumerable: true ,
	get: function() {

		var guessed = termkit.guessTerminal() ;
		var input = termkit.tty.getInput() ;
		var output = termkit.tty.getOutput() ;

		var guessedTerminal = termkit.createTerminal( {
			stdin: input ,
			stdout: output ,
			stderr: process.stderr ,
			generic: guessed.generic || 'unknown' ,
			appId: guessed.safe ? guessed.appId : undefined ,
			//	appName: guessed.safe ? guessed.appName : undefined ,
			processSigwinch: true ,
			preferProcessSigwinch: !! termkit.globalConfig.preferProcessSigwinch
			// couldTTY: true
		} ) ;

		Object.defineProperty( termkit , 'realTerminal' , { value: guessedTerminal , enumerable: true } ) ;

		return guessedTerminal ;
	}
} ) ;



