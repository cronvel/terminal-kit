#!/usr/bin/env node
/*
	Terminal Kit
	
	Copyright (c) 2009 - 2018 Cédric Ronvel
	
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


//term.clear() ;

term.on( 'key' , function( key ) {
	switch( key )
	{
		case 'CTRL_C' :
			term.grabInput( false ) ;
			term.hideCursor( false ) ;
			term.styleReset() ;
			term( '\n' ) ;
			process.exit() ;
			break ;
	}
} ) ;



async function test() {
	var button = await term.createInlineElement( termkit.Button , {
		outputDst: term ,
		content: '> bob' ,
		value: 'bob' ,
		x: 10 , y: 10 ,
	} ) ;
}

async function test2() {
	//term( "Menu\n" ) ;
	
	var columnMenu = await term.createInlineElement( termkit.ColumnMenu , {
		//x: 0 , y: 5 ,
		//width: 50 ,
		items: [
			{
				content: 'File' ,
				value: 'file'
			} ,
			{
				content: 'Edit' ,
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
		]
	} ) ;

	columnMenu.on( 'submit' , onSubmit ) ;

	function onSubmit( buttonValue ) {
		//console.error( 'Submitted: ' , value ) ;
		term.saveCursor() ;
		term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted: %s\n' , buttonValue ) ;
		term.restoreCursor() ;
	}

	columnMenu.document.giveFocusTo( columnMenu ) ;
}



test2() ;

