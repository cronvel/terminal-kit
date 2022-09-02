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



const termkit = require( '../..' ) ;
const term = termkit.terminal ;



term.clear() ;

var document = term.createDocument() ;



var columnMenuMixed = new termkit.ColumnMenuMixed( {
	parent: document ,
	x: 0 ,
	y: 5 ,
	width: 20 ,
	pageMaxHeight: 5 ,
	leftPadding: '  ' ,
	turnedOnLeftPadding: '^G✓ ' ,
	turnedOffLeftPadding: '^R✗ ' ,
	disabledLeftPadding: '  ' ,
	paddingHasMarkup: true ,
	multiLineItems: true ,

	value: {
		light: true
	} ,
	items: [
		{
			content: 'normal #1' ,
			key: 'normal #1'
		} ,
		{
			content: 'light' ,
			type: 'toggle' ,
			key: 'light'
		} ,
		{
			content: 'switcher' ,
			type: 'toggle' ,
			key: 'switcher'
		} ,
		{
			content: 'normal #2' ,
			value: 'normal #2'
		} ,
		{
			content: 'Disabled button' ,
			disabled: true ,
			key: 'disabled'
		} ,
		{
			content: 'more #1' ,
			value: 'more #1'
		} ,
		{
			content: 'more #2' ,
			value: 'more #2'
		} ,
	]
} ) ;



var submitCount = 0 , toggleCount = 0 ;

function onSubmit( buttonValue , action ) {
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted #%i: %J %J\n' , submitCount ++ , buttonValue , action ) ;
	term.restoreCursor() ;
}

function onItemToggle( key , toggle ) {
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 24 , 'Toggled #%i: %s %s\n' , toggleCount ++ , key , toggle ) ;
	term.restoreCursor() ;
}

columnMenuMixed.on( 'submit' , onSubmit ) ;
columnMenuMixed.on( 'itemToggle' , onItemToggle ) ;



document.giveFocusTo( columnMenuMixed ) ;

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

