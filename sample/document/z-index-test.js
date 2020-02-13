#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2020 Cédric Ronvel

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

var document = term.createDocument() ;



var dropDownMenuDef = {
	parent: document ,
	x: 0 ,
	y: 0 ,
	z: 1 ,
	//width: 50 ,
	items: [
		{
			content: 'File' ,
			value: 'file' ,
			items: [
				{ content: 'Load' , value: 'load' } ,
				{ content: 'Save' , value: 'save' } ,
				{ content: 'Save as' , value: 'saveAs' } ,
				{ content: 'Export' , value: 'export' } ,
			]
		} ,
		{
			content: 'Edit' ,
			value: 'edit' ,
			items: [
				{ content: 'Copy' , value: 'copy' } ,
				{ content: 'Paste' , value: 'paste' } ,
				{ content: 'Undo' , value: 'undo' } ,
				{ content: 'Redo' , value: 'redo' } ,
			]
		} ,
		{
			content: 'Tools' ,
			value: 'tools' ,
			items: [
				{ content: 'Script fu' , value: 'scriptFu' } ,
				{ content: 'Decrunch' , value: 'decrunch' } ,
			]
		} ,
		{
			content: 'Help' ,
			value: 'help' ,
			items: [
				{ content: 'Reference' , value: 'reference' } ,
				{ content: 'About' , value: 'about' } ,
			]
		} ,
		{
			content: 'topSubmit' ,
			value: 'topSubmit' ,
			topSubmit: true
		} ,
		{
			content: 'escapeSubmit' ,
			value: 'escapeSubmit' ,
			topSubmit: true ,
			shortcuts: 'ESCAPE'
		}
	]
} ;



var columnMenuDef = {
	parent: document ,
	x: 5 ,
	y: 2 ,
	width: 20 ,
	pageMaxHeight: 5 ,
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
			content: 'Bookmarks' ,
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
			content: 'Disabled button' ,
			disabled: true ,
			value: 'disabled'
		} ,
		{
			//content: 'Very long, very long, very long, very long, very long, very long, very long, very long, very long, very long' ,
			content: 'Very long, very long, very ^rlong, very long, very long, very long, very ^blong, very long, very long, very long' , markup: true ,
			value: 'very long'
		} ,
		{
			content: 'Not long' ,
			value: 'not long'
		} ,
	]
} ;



function onDropDownSubmit( buttonValue ) {
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted: %s\n' , buttonValue ) ;
	term.restoreCursor() ;
}



function onColumnMenuSubmit( buttonValue ) {
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted: %s\n' , buttonValue ) ;
	term.restoreCursor() ;
}



var dropDownMenu = new termkit.DropDownMenu( dropDownMenuDef ) ;
dropDownMenu.on( 'submit' , onDropDownSubmit ) ;

var columnMenu = new termkit.ColumnMenu( columnMenuDef ) ;
columnMenu.on( 'submit' , onColumnMenuSubmit ) ;

document.giveFocusTo( columnMenu ) ;

