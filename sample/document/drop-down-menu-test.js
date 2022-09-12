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



//console.error( "\n\n\n\n\n\n\n\n" ) ;
const termkit = require( '../../lib/termkit.js' ) ;
const term = termkit.terminal ;



term.clear() ;

var document = term.createDocument() ;



var dropDownMenu = new termkit.DropDownMenu( {
	parent: document ,
	x: 0 ,
	y: 0 ,
	clearColumnMenuOnSubmit: true ,
	//width: 50 ,
	value: {
		autoIndent: true ,
		autoSave: true
	} ,
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
				{ content: 'Auto-indent' , key: 'autoIndent' , type: 'toggle' } ,
				{ content: 'Auto-clean' , key: 'autoClean' , type: 'toggle' } ,
				{ content: 'Auto-save' , key: 'autoSave' , type: 'toggle' } ,
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
			content: 'topSubmit' ,
			value: 'topSubmit' ,
			topSubmit: true
		} ,
		{
			content: 'escapeSubmit' ,
			value: 'escapeSubmit' ,
			topSubmit: true ,
			shortcuts: 'ESCAPE'
		} ,
		{
			content: 'Help' ,
			value: 'help' ,
			items: [
				{ content: 'Reference' , value: 'reference' } ,
				{ content: 'About' , value: 'about' } ,
			]
		}
	]
} ) ;

//dropDownMenu.on( 'submit' , onSubmit ) ;
dropDownMenu.on( 'blinked' , onSubmit ) ;

function onSubmit( buttonValue , action ) {
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted: %s %s\n' , buttonValue , action ) ;
	term.restoreCursor() ;
	
	if ( buttonValue === 'decrunch' ) {
		dropDownMenu.setDropDownItem( 'tools' , 'decrunch' , { content: 'Crunch' , value: 'crunch' } ) ;
	}
	else if ( buttonValue === 'crunch' ) {
		dropDownMenu.setDropDownItem( 'tools' , 'crunch' , { content: 'Decrunch' , value: 'decrunch' } ) ;
	}
}



/*
setInterval( () => {
	var value = Math.random() < 0.5 ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 24 , 'Set autoClean to: %s\n' , value ) ;
	term.restoreCursor() ;
	dropDownMenu.setKeyValue( 'autoClean' , value ) ;
} , 1000 ) ;
//*/



// Test menu when losing focus (but it fails ATM)
/*
var button = new termkit.Button( {
	parent: document ,
	//content: '> button#1' ,
	content: '> button' ,
	contentHasMarkup: true ,
	value: 'b1' ,
	x: 10 ,
	y: 10 ,
} ) ;
//*/



document.giveFocusTo( dropDownMenu ) ;

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

