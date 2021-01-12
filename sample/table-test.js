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



const termkit = require( '..' ) ;
const term = termkit.terminal ;


term.table( [
		[ 'header #1' , 'header #2' , 'header #3' ] ,
		[ 'row #1' , 'a much bigger cell '.repeat( 10 ) , 'cell' ] ,
		[ 'row #2' , 'cell' , 'a medium cell' ] ,
		[ 'row #3' , 'cell' , 'cell' ] ,
		[ 'row #4' , 'cell\nwith\nnew\nlines' , '^YThis ^Mis ^Ca ^Rcell ^Gwith ^Bmarkup^R^+!' ]
		//, ... new Array( 20 ).fill( [ 'filler row' , 'filler cell' , 'filler cell' ] )
		, ... new Array( 20 ).fill( null ).map( (e,i) => [ 'filler row #' + i , 'filler cell' , 'filler cell' ] )
	] , {
		//hasBorder: false ,
		contentHasMarkup: true ,
		borderChars: 'lightRounded' ,
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
		width: 60 ,
		//height: 20 ,
		fit: true , // Activate all expand/shrink + wordWrap
		//expandToWidth: true , shrinkToWidth: true , expandToHeight: true , shrinkToHeight: true , wordWrap: true ,
	}
) ;

