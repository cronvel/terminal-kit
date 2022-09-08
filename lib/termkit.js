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



const path = require( 'path' ) ;

if ( process.browser || require.cache[ path.join( __dirname , 'termkit-no-lazy-require.js' ) ] ) {
	console.log( 'using termkit-no-lazy-require.js' ) ;
	module.exports = require( './termkit-no-lazy-require.js' ) ;
	return ;
}



const termkit = {} ;
module.exports = termkit ;

const lazy = require( 'lazyness' )( require ) ;



// Global config
termkit.globalConfig = {} ;



lazy.requireProperty( termkit , 'tty' , './tty.js' ) ;

// For some reason, starting from node v4, once process.stdin getter is triggered, the 'tty' command would not work properly.
// This 'hack' cache the result of the command 'tty' if we are in the linux console, so 'gpm' can work.
if ( process.env.TERM === 'linux' ) { termkit.tty.getPath() ; }



// Core submodules
Object.assign( termkit , require( './misc.js' ) ) ;
Object.assign( termkit , require( './detectTerminal.js' ) ) ;

termkit.Terminal = require( './Terminal.js' ) ;
termkit.createTerminal = termkit.Terminal.create ;

// Windows patches
if ( process.platform === 'win32' ) { require( './windows.js' )( termkit ) ; }



// Lazy submodules
lazy.requireProperties( termkit , {
	image: './image.js' ,
	Palette: './Palette.js' ,
	Rect: './Rect.js' ,
	ScreenBuffer: './ScreenBuffer.js' ,
	ScreenBufferHD: './ScreenBufferHD.js' ,
	TextBuffer: './TextBuffer.js' ,
	Vte: './vte/Vte.js' ,
	autoComplete: './autoComplete.js' ,
	spChars: './spChars.js' ,

	// Document model
	Element: './document/Element.js' ,
	Document: './document/Document.js' ,
	Container: './document/Container.js' ,
	Text: './document/Text.js' ,
	AnimatedText: './document/AnimatedText.js' ,
	Button: './document/Button.js' ,
	ToggleButton: './document/ToggleButton.js' ,
	TextBox: './document/TextBox.js' ,
	EditableTextBox: './document/EditableTextBox.js' ,
	Slider: './document/Slider.js' ,
	Bar: './document/Bar.js' ,
	LabeledInput: './document/LabeledInput.js' ,
	InlineInput: './document/InlineInput.js' ,
	InlineFileInput: './document/InlineFileInput.js' ,
	InlineMenu: './document/InlineMenu.js' ,
	Form: './document/Form.js' ,
	RowMenu: './document/RowMenu.js' ,
	ColumnMenu: './document/ColumnMenu.js' ,
	ColumnMenuMulti: './document/ColumnMenuMulti.js' ,
	ColumnMenuMixed: './document/ColumnMenuMixed.js' ,
	SelectList: './document/SelectList.js' ,
	SelectListMulti: './document/SelectListMulti.js' ,
	DropDownMenu: './document/DropDownMenu.js' ,
	TextTable: './document/TextTable.js' ,
	Layout: './document/Layout.js' ,
	Border: './document/Border.js' ,
	Window: './document/Window.js' ,

	// External modules
	chroma: 'chroma-js'
} ) ;



lazy.properties( termkit , {
	terminal: () => {
		var guessed = termkit.guessTerminal() ;
		return termkit.createTerminal( {
			stdin: process.stdin ,
			stdout: process.stdout ,
			stderr: process.stderr ,
			generic: guessed.generic || 'unknown' ,
			appId: guessed.safe ? guessed.appId : undefined ,
			//	appName: guessed.safe ? guessed.appName : undefined ,
			isTTY: guessed.isTTY ,
			isSSH: guessed.isSSH ,
			processSigwinch: true ,
			preferProcessSigwinch: !! termkit.globalConfig.preferProcessSigwinch
		} ) ;
	} ,
	realTerminal: () => {
		var guessed = termkit.guessTerminal( true ) ;
		var input = termkit.tty.getInput() ;
		var output = termkit.tty.getOutput() ;

		return termkit.createTerminal( {
			stdin: input ,
			stdout: output ,
			stderr: process.stderr ,
			generic: guessed.generic || 'unknown' ,
			appId: guessed.safe ? guessed.appId : undefined ,
			//	appName: guessed.safe ? guessed.appName : undefined ,
			isTTY: true ,
			isSSH: guessed.isSSH ,
			processSigwinch: true ,
			preferProcessSigwinch: !! termkit.globalConfig.preferProcessSigwinch
		} ) ;
	}
} , true ) ;

