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



//console.error( "\n\n\n\n\n\n\n\n" ) ;
var termkit = require( '../../lib/termkit.js' ) ;
var term = termkit.terminal ;



term.clear() ;

var document = term.createDocument( {
	palette: new termkit.Palette()
	//	backgroundAttr: { bgColor: 'magenta' , dim: true } ,
} ) ;

var textBox = new termkit.TextBox( {
	parent: document ,
	//content: '^#^MHe^:^bll^#^Ro!' ,
	content: '^[fg:*royal-blue]royal!' ,
	//content: 'royal!' ,
	contentHasMarkup: true ,
	//attr: { color: 'magenta' } ,
	//attr: { color: 241 } ,
	//attr: { color: '*royal-blue' } ,
	//hidden: true ,
	scrollable: true ,
	vScrollBar: true ,
	x: 10 ,
	y: 2 ,
	width: 30 ,
	height: 10
} ) ;


term.on( 'key' , function( key ) {
	
	switch( key ) {
		case 'CTRL_C' :
			term.grabInput( false ) ;
			term.hideCursor( false ) ;
			term.styleReset() ;
			term.clear() ;
			process.exit() ;
			break ;
		
		case 'ENTER' :
		case 'KP_ENTER' :
			textBox.setContent( textBox.getContent() + '\n' ) ;
			break ;
		
		case 'BACKSPACE' :
		case 'DELETE' :
			textBox.setContent( textBox.getContent().split( '\n' ).slice( 0 , -1 ).join( '\n' ) ) ;
			break ;
		
		case 'PAGE_DOWN' :
		case 'PAGE_UP' :
		case 'CTRL_O' :
			break ;

		default :
			textBox.setContent( textBox.getContent() + key ) ;
			break ;
	}
} ) ;

