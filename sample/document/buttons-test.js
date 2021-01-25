#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

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



const termkit = require( '../..' ) ;
const term = termkit.terminal ;



term.clear() ;

var document = term.createDocument( {
	palette: new termkit.Palette()
	//	backgroundAttr: { bgColor: 'magenta' , dim: true } ,
} ) ;

var button1 = new termkit.Button( {
	parent: document ,
	//content: '> button#1' ,
	content: '> ^[fg:*royal-blue]button#1' ,
	//content: '> ^[fg:*coquelicot]button#1' ,
	focusAttr: { bgColor: '@light-gray' } ,
	contentHasMarkup: true ,
	value: 'b1' ,
	x: 10 ,
	y: 10 ,
} ) ;

var button2 = new termkit.Button( {
	parent: document ,
	content: '> button#2' ,
	blurContent: '> button#2' ,
	focusContent: '> BUTTON#2' ,
	value: 'b2' ,
	x: 13 ,
	y: 12 ,
	keyBindings: {
		ENTER: 'submit' ,
		CTRL_UP: 'submit' ,
		CTRL_DOWN: 'submit'
	} ,
	actionKeyBindings: {
		CTRL_UP: 'up' ,
		CTRL_DOWN: 'down'
	}
} ) ;

var toggleButton1 = new termkit.ToggleButton( {
	parent: document ,
	content: 'toggle#1' ,
	//turnedOnLeftPadding: '☑ ' , turnedOffLeftPadding: '☐ ' ,
	turnedOnLeftPadding: '✓ ' , turnedOffLeftPadding: '✗ ' ,
	//value: true ,
	x: 2 ,
	y: 2 ,
} ) ;

var toggleButton2 = new termkit.ToggleButton( {
	parent: document ,
	content: 'toggle#2' ,
	key: 'myKey' ,
	//turnedOnLeftPadding: '☑ ' , turnedOffLeftPadding: '☐ ' ,
	turnedOnLeftPadding: '✓ ' , turnedOffLeftPadding: '✗ ' ,
	//value: true ,
	x: 5 ,
	y: 5 ,
} ) ;

//container1.draw() ;

button1.on( 'submit' , onSubmit ) ;
button2.on( 'submit' , onSubmit ) ;
toggleButton1.on( 'toggle' , onToggle ) ;
toggleButton1.on( 'submit' , onSubmit ) ;
toggleButton2.on( 'toggle' , onToggle ) ;
toggleButton2.on( 'submit' , onSubmit ) ;

var counter = 0 ;

function onSubmit( value , action ) {
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted #%i: %J , action: %J\n' , counter ++ , value , action ) ;
	term.restoreCursor() ;
}

function onToggle( value ) {
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Toggled #%i: %J\n' , counter ++ , value ) ;
	term.restoreCursor() ;
}



document.focusNext() ;



term.on( 'key' , function( key ) {
	switch( key )
	{
		case 'CTRL_C' :
			term.grabInput( false ) ;
			term.hideCursor( false ) ;
			term.styleReset() ;
			term.clear() ;
			process.exit() ;
			break ;
	}
} ) ;



