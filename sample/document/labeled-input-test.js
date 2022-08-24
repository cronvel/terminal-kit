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



const termkit = require( '../../lib/termkit.js' ) ;
const term = termkit.terminal ;



term.clear() ;

var document = term.createDocument() ;

var labeledInput ;

/*
labeledInput = new termkit.LabeledInput( {
	parent: document ,
	label: 'name: ' ,
	x: 5 ,
	y: 10 ,
	width: 30 ,
} ) ;
//*/

//*
labeledInput = new termkit.LabeledInput( {
	parent: document ,
	label: 'name: ' ,
	x: 5 ,
	y: 10 ,
	width: 30 ,
	type: 'select' ,
	value: 'done' ,
	items: [
		{ content: 'Todo' , value: 'todo' } ,
		{ content: 'In progress' , value: 'in-progress' } ,
		{ content: 'Done' , value: 'done' }
	]
} ) ;
//*/

labeledInput.on( 'submit' , onSubmit ) ;

function onSubmit( value ) {
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted: %s\n' , value ) ;
	term.restoreCursor() ;
}

document.focusNext() ;



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

