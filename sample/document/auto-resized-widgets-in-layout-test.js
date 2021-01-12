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



//term.clear() ;
//term.moveTo.brightMagenta.bold.italic( 1 , 1 , "Responsive terminal layout! Try resizing your terminal! ;)" ) ;

var document = term.createDocument() ;

var text = new termkit.Text( {
	parent: document ,
	content: "Responsive terminal layout! Try resizing your terminal! ;)" ,
	attr: {
		color: 'brightMagenta' ,
		bold: true ,
		italic: true
	}
} ) ;

var layout = new termkit.Layout( {
	parent: document ,
	boxChars: 'double' ,
	layout: {
		id: 'main' ,
		y: 3 ,
		//widthPercent: 60 ,
		widthPercent: 100 ,
		//heightPercent: 60 ,
		heightPercent: 80 ,
		rows: [
			{
				id: '1st row' ,
				heightPercent: 75 ,
				columns: [
					{ id: 'percent' , widthPercent: 100/3 } ,
					{ id: 'auto' } ,
					{ id: 'fixed' , width: 30 } ,
				]
			} ,
			{
				id: '2nd row' ,
				columns: [
					{ id: 'fixed2' , width: 20 } ,
					{ id: 'auto2' } ,
				]
			}
		]
	}
} ) ;


term.hideCursor() ;
//layout.draw() ;
//layout.setAutoResize( true ) ;

var text ;
//text = 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.' ;
text = 'Permission is hereby ^Y^+granted^:, ^C^+free^ of charge, to any person obtaining a copy of this ^/software^ and associated documentation files (the ^/"Software"^:), to deal in the ^/Software^ without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the ^/Software^:, and to permit persons to whom the ^/Software^ is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice ^R^_shall^ be included in all copies or substantial portions of the ^/Software^:.\n\n^+THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.' ;

new termkit.TextBox( {
	parent: document.elements.percent ,
	content: text ,
	contentHasMarkup: true ,
	scrollable: true ,
	vScrollBar: true ,
	//hScrollBar: true ,
	//lineWrap: true ,
	wordWrap: true ,
	autoWidth: true ,
	autoHeight: true
} ) ;

new termkit.ColumnMenu( {
	parent: document.elements.auto ,
	autoWidth: true ,
	autoHeight: true ,
	blurLeftPadding: '  ' ,
	focusLeftPadding: '^R> ' ,
	disabledLeftPadding: '  ' ,
	paddingHasMarkup: true ,
	multiLineItems: true ,
	buttonEvenBlurAttr: { bgColor: '@dark-gray' , color: 'white' , bold: true } ,
	buttonKeyBindings: {
		ENTER: 'submit' ,
		CTRL_UP: 'submit' ,
		CTRL_DOWN: 'submit'
	} ,
	buttonActionKeyBindings: {
		CTRL_UP: 'up' ,
		CTRL_DOWN: 'down'
	} ,
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
			content: '^[fg:*royal-blue]Bookmarks' ,
			markup: true ,
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
		//*
		{
			//content: 'Very long, very long, very long, very long, very long, very long, very long, very long, very long, very long' ,
			content: 'Very long, very long, very ^rlong, very long, very long, very long, very ^blong, very long, very long, very long' , markup: true ,
			value: 'very long'
		} ,
		//*/
		{
			content: 'Not long' ,
			value: 'not long'
		} ,
	]
} ) ;

new termkit.Text( {
	parent: document.elements.auto2 ,
	content: 'Auto sized box' ,
	attr: { color: 'yellow' , italic: true }
} ) ;

new termkit.Text( {
	parent: document.elements.fixed ,
	content: 'Fixed size box' ,
	attr: { color: 'cyan' , bold: true }
} ) ;

new termkit.Text( {
	parent: document.elements.fixed2 ,
	content: 'Fixed size box' ,
	attr: { color: 'magenta' , bold: true }
} ) ;


term.on( 'key' , function( key ) {
	if ( key === 'CTRL_C' ) {
		term.grabInput( false ) ;
		term.hideCursor( false ) ;
		term.moveTo( 1 , term.height )( '\n' ) ;
		//term.clear() ;
		process.exit() ;
	}
} ) ;


//term.moveTo( 1 , term.height ) ;

