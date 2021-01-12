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



var termkit = require( '../..' ) ;
var term = termkit.terminal ;



term.clear() ;

var document = term.createDocument() ;



var columnMenu = new termkit.ColumnMenu( {
	parent: document ,
	x: 0 ,
	y: 5 ,
	//width: 20 ,
	//pageMaxHeight: 5 ,
	blurLeftPadding: '  ' ,
	focusLeftPadding: '^R> ' ,
	disabledLeftPadding: '  ' ,
	paddingHasMarkup: true ,
	multiLineItems: true ,
	items: [
		{
			content: 'File' ,
			value: 'file'
		} ,
		{
			//content: 'Edit' ,
			content: '^REdit' , markup: true ,
			value: 'edit'
		} ,
		{
			content: 'View' ,
			value: 'view'
		} ,
		{
			content: 'History' ,
			value: 'history'
		} ,
		{
			//content: 'Bookmarks' ,
			content: '^CBook^Ymark^Rs' , markup: true ,
			value: 'bookmarks'
		} ,
		{
			content: 'Tools' ,
			value: 'tools'
		} ,
		{
			content: 'Help' ,
			value: 'help'
		} ,
		{
			content: 'Not long' ,
			value: 'not long'
		} ,
	]
} ) ;



columnMenu.on( 'submit' , onSubmit ) ;

function onSubmit( buttonValue ) {
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted: %s\n' , buttonValue ) ;
	term.restoreCursor() ;
}



document.giveFocusTo( columnMenu ) ;

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

