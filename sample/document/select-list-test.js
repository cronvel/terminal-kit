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



const termkit = require( '../../lib/termkit.js' ) ;
const term = termkit.terminal ;



term.clear() ;

var document = term.createDocument() ;



var selectList = new termkit.SelectList( {
	parent: document ,
	x: 10 ,
	y: 10 ,
	//buttonSpacing: 3 ,
	//justify: true ,
	//width: 50 ,
	//content: 'list' ,
	value: 'list value' ,
	//value: 'done' ,
	master: { content: 'Select' } ,
	items: [
		{
			content: 'Todo' ,
			value: 'todo'
		} ,
		{
			content: 'In Progress' ,
			value: 'in-progress'
		} ,
		{
			content: 'Done' ,
			value: 'done'
		}
	]
} ) ;




function onSubmit( buttonValue ) {
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted: %s\n' , buttonValue ) ;
	term.moveTo.styleReset.eraseLine( 1 , 23 , 'Select value: %s\n' , selectList.value ) ;
	term.moveTo.styleReset.eraseLine( 1 , 24 , 'Select .getValue(): %s\n' , selectList.getValue() ) ;
	term.restoreCursor() ;
}

selectList.on( 'submit' , onSubmit ) ;



document.giveFocusTo( selectList ) ;

term.on( 'key' , key => {
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

