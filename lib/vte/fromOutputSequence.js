/*
	Terminal Kit

	Copyright (c) 2009 - 2019 Cédric Ronvel

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



exports.control = {
	'\\x0a': 'newLine'
} ;



// CSI tree (Control Sequence Introducer)
exports.CSI = {
	m: {
		// Known as SGR (Select Graphic Rendition)
		event: 'attr' ,
		subTypes: {
			'0': { subType: 'styleReset' , continue: true } ,
			
			'30': { subType: 'color' , arg: 'black' , continue: true } ,
			'31': { subType: 'color' , arg: 'red' , continue: true } ,
			'32': { subType: 'color' , arg: 'green' , continue: true } ,
			'33': { subType: 'color' , arg: 'yellow' , continue: true } ,
			'34': { subType: 'color' , arg: 'blue' , continue: true } ,
			'35': { subType: 'color' , arg: 'magenta' , continue: true } ,
			'36': { subType: 'color' , arg: 'cyan' , continue: true } ,
			'37': { subType: 'color' , arg: 'white' , continue: true } ,
			//'38': { subType: 'color' , arg: '' , continue: true } ,
			'39': { subType: 'color' , arg: 'default' , continue: true } ,

			'90': { subType: 'color' , arg: 'gray' , continue: true } ,
			'91': { subType: 'color' , arg: 'brightRed' , continue: true } ,
			'92': { subType: 'color' , arg: 'brightGreen' , continue: true } ,
			'93': { subType: 'color' , arg: 'brightYellow' , continue: true } ,
			'94': { subType: 'color' , arg: 'brightBlue' , continue: true } ,
			'95': { subType: 'color' , arg: 'brightMagenta' , continue: true } ,
			'96': { subType: 'color' , arg: 'brightCyan' , continue: true } ,
			'97': { subType: 'color' , arg: 'brightWhite' , continue: true } ,
		}
	}
} ;



// OSC tree (OS Command)
exports.OSC = {
	'0': { event: 'system' , subType: 'setWindowTitle' } ,
	'1': { event: 'system' , subType: 'setIconName' } ,
	'2': { event: 'system' , subType: 'setWindowTitle' } ,
	'4': { event: 'palette' , subType: 'setColor' } ,
	'7': { event: 'system' , subType: 'setCwd' } ,
	'9': { event: 'system' , subType: 'notify' } ,	// iTerm2 growl notification, only a body argument
	'10': { event: 'palette' , subType: 'setDefaultColor' } ,
	'11': { event: 'palette' , subType: 'setDefaultBgColor' } ,
	'12': { event: 'cursorAttr' , subType: 'setColor' } ,
	'17': { event: 'palette' , subType: 'setHighlightBgColor' } ,
	'50': { event: 'cursorAttr' , subType: 'setShape' } ,
	'104': { event: 'palette' , subType: 'resetColor' } ,
	'110': { event: 'palette' , subType: 'resetDefaultColor' } ,
	'111': { event: 'palette' , subType: 'resetDefaultBgColor' } ,
	'112': { event: 'cursorAttr' , subType: 'resetColor' } ,
	'117': { event: 'palette' , subType: 'resetHighlightBgColor' } ,
	'777': {	// rxvt/urxvt module, only support notifications
		event: 'system' ,
		subTypes: {
			'notify': { subType: 'notify' }	// notify with a title and body arguments
		}
	}
} ;

