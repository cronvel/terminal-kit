#!/usr/bin/env node
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



var termkit = require( '../../lib/termkit.js' ) ;
var term = termkit.terminal ;



term.clear() ;

var document = term.createDocument() ;



var inlineMenu = new termkit.InlineMenu( {
	parent: document ,
	x: 0 ,
	y: 10 ,
	//*
	prompt: {
		textAttr: { bgColor: 'blue' } ,
		content: '^WReplace? ' ,
		contentHasMarkup: true
	} ,
	//*/
	width: 30 ,
	items: [
		{
			content: '(Y)es' ,
			value: 'yes' ,
			hotkey: 'y'
		} ,
		{
			content: '(N)o' ,
			value: 'no' ,
			hotkey: 'n'
		} ,
		{
			content: '(R)est' ,
			value: 'rest' ,
			hotkey: 'r'
		} ,
		{
			content: '(A)bort (ESC)' ,
			value: 'abort' ,
			hotkey: [ 'a' , 'ESCAPE' ]
		}
	]
} ) ;



function onSubmit( buttonValue ) {
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted: %s\n' , buttonValue ) ;
	term.restoreCursor() ;
}

function onItemFocus( buttonValue , focus ) {
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 24 , 'Item focus: %s %s\n' , buttonValue , focus ) ;
	term.restoreCursor() ;
}

inlineMenu.on( 'submit' , onSubmit ) ;
inlineMenu.on( 'itemFocus' , onItemFocus ) ;



document.giveFocusTo( inlineMenu ) ;

term.on( 'key' , key => {
	switch( key ) {
		case 'CTRL_C' :
			term.grabInput( false ) ;
			term.hideCursor( false ) ;
			term.styleReset() ;
			term.clear() ;
			process.exit() ;
			break ;
	}
} ) ;

