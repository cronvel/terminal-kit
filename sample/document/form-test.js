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



/* jshint unused:false */



//console.error( "\n\n\n\n\n\n\n\n" ) ;
var termkit = require( '../../lib/termkit.js' ) ;
var term = termkit.terminal ;



term.clear() ;

var document = term.createDocument() ;


var form = new termkit.Form( {
	parent: document ,
	x: 10 ,
	y: 3 ,
	width: 40 ,
	inputs: [
		{
			key: 'login' ,
			label: 'Login: ' ,
			content: 'login@bob.net' ,
			
			// Validators are not yet implemented
			validator: { type: 'string' }
		} ,
		{
			key: 'password' ,
			label: 'Password: ' ,
			hiddenContent: true ,
			//textAttr: { bgColor: 'blue' , hiddenContent: true } ,
			validator: { type: 'string' }
		} ,
		{
			key: 'firstName' ,
			label: 'first name: ' ,
			validator: { type: 'string' }
		} ,
		{
			key: 'lastName' ,
			label: 'last name: ' ,
			validator: { type: 'string' }
		} ,
		{
			key: 'age' ,
			label: 'age: ' ,
			validator: { type: 'string' }
		} ,
		{
			key: 'v1' ,
			label: 'v1: ' ,
			type: 'select' ,
			value: 2 ,
			items: [
				{ content: 'one' , value: 1 } ,
				{ content: 'two' , value: 2 } ,
				{ content: 'three' , value: 3 } ,
				{ content: 'four' , value: 4 }
			]
		} ,
		{
			key: 'v2' ,
			label: 'v2: ' ,
			type: 'selectMulti' ,
			//value: 2 ,
			items: [
				{ content: 'un' , key: 'un' } ,
				{ content: 'deux' , key: 'deux' } ,
				{ content: 'trois' , key: 'trois' }
			]
		} ,
		{
			key: 'comment' ,
			label: 'comment: ' ,
			content: 'multi\nline\ncontent' ,
			height: 5 ,
			scrollable: true ,
			vScrollBar: true ,
			validator: { type: 'string' }
		} ,
	] ,
	buttons: [
		{
			content: '<Ok>' ,
			value: 'ok'
		} ,
		{
			content: '<Cancel>' ,
			value: 'cancel'
		}
	]
} ) ;



form.on( 'submit' , onSubmit ) ;

function onSubmit( value )
{
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 24 , 'Submitted: %J\n' , value ) ;
	term.restoreCursor() ;
}



document.giveFocusTo( form ) ;

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



