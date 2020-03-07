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
const termkit = require( '../..' ) ;
const term = termkit.terminal ;

term.clear() ;

var document = term.createDocument( {
	palette: new termkit.Palette()
	//	backgroundAttr: { bgColor: 'magenta' , dim: true } ,
} ) ;

var textTable = new termkit.TextTable( {
	parent: document ,
	cellContents: [
		//*
		[ 'header #1' , 'header #2' , 'header #3' ] ,
		[ 'row #1' , 'a much bigger cell '.repeat( 10 ) , 'cell' ] ,
		[ 'row #2' , 'cell' , 'a medium cell' ] ,
		[ 'row #3' , 'cell' , 'cell' ] ,
		[ 'row #4' , 'cell\nwith\nnew\nlines' , 'cell' ]
		//*/
		/*
		[ '1-1' , '2-1' , '3-1' ] ,
		[ '1-2' , '2-2' , '3-2' ] ,
		[ '1-3' , '2-3' , '3-3' ]
		//*/
	] ,
	x: 0 ,
	y: 2 ,
	//hasBorder: false ,
	//borderChars: 'double' ,
	borderAttr: { color: 'blue' } ,
	textAttr: { bgColor: 'default' } ,
	//textAttr: { bgColor: 'black' } ,
	firstCellTextAttr: { bgColor: 'blue' } ,
	firstRowTextAttr: { bgColor: 'gray' } ,
	firstColumnTextAttr: { bgColor: 'red' } ,
	//checkerEvenCellTextAttr: { bgColor: 'gray' } ,
	//evenCellTextAttr: { bgColor: 'gray' } ,
	//evenRowTextAttr: { bgColor: 'gray' } ,
	//evenColumnTextAttr: { bgColor: 'gray' } ,
	width: 50 ,
	//width: term.width ,
	height: 15 ,
	fit: true ,	// Activate all expand/shrink + wordWrap
	//expandToWidth: true , shrinkToWidth: true , expandToHeight: true , shrinkToHeight: true , wordWrap: true ,
	//lineWrap: true ,
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
	}
} ) ;

