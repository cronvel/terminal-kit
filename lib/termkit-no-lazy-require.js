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



const termkit = {} ;
module.exports = termkit ;

const lazy = require( 'lazyness' )( require ) ;



// Global config
termkit.globalConfig = {} ;



termkit.tty = require( './tty.js' ) ;

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



termkit.image = require( './image.js' ) ;
termkit.Palette = require( './Palette.js' ) ;
termkit.Rect = require( './Rect.js' ) ;
termkit.ScreenBuffer = require( './ScreenBuffer.js' ) ;
termkit.ScreenBufferHD = require( './ScreenBufferHD.js' ) ;
termkit.TextBuffer = require( './TextBuffer.js' ) ;
termkit.Vte = require( './vte/Vte.js' ) ;
termkit.autoComplete = require( './autoComplete.js' ) ;
termkit.spChars = require( './spChars.js' ) ;

// Document model
termkit.Element = require( './document/Element.js' ) ;
termkit.Document = require( './document/Document.js' ) ;
termkit.Container = require( './document/Container.js' ) ;
termkit.Text = require( './document/Text.js' ) ;
termkit.AnimatedText = require( './document/AnimatedText.js' ) ;
termkit.Button = require( './document/Button.js' ) ;
termkit.ToggleButton = require( './document/ToggleButton.js' ) ;
termkit.TextBox = require( './document/TextBox.js' ) ;
termkit.EditableTextBox = require( './document/EditableTextBox.js' ) ;
termkit.Slider = require( './document/Slider.js' ) ;
termkit.Bar = require( './document/Bar.js' ) ;
termkit.LabeledInput = require( './document/LabeledInput.js' ) ;
termkit.InlineInput = require( './document/InlineInput.js' ) ;
termkit.InlineFileInput = require( './document/InlineFileInput.js' ) ;
termkit.InlineMenu = require( './document/InlineMenu.js' ) ;
termkit.Form = require( './document/Form.js' ) ;
termkit.RowMenu = require( './document/RowMenu.js' ) ;
termkit.ColumnMenu = require( './document/ColumnMenu.js' ) ;
termkit.ColumnMenuMulti = require( './document/ColumnMenuMulti.js' ) ;
termkit.ColumnMenuMixed = require( './document/ColumnMenuMixed.js' ) ;
termkit.SelectList = require( './document/SelectList.js' ) ;
termkit.SelectListMulti = require( './document/SelectListMulti.js' ) ;
termkit.DropDownMenu = require( './document/DropDownMenu.js' ) ;
termkit.TextTable = require( './document/TextTable.js' ) ;
termkit.Layout = require( './document/Layout.js' ) ;
termkit.Border = require( './document/Border.js' ) ;
termkit.Window = require( './document/Window.js' ) ;

// External modules
termkit.chroma = require( 'chroma-js' ) ;



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

