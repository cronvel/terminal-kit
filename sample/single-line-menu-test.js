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



var term = require( '..' ).terminal ;

term.grabInput( { mouse: 'motion' } ) ;

var items = [
	'汉字汉字汉字汉字汉字汉字汉字汉字' , '汉字汉字汉字汉字汉字汉字汉字汉字' ,
	'File' , 'Edit' , 'View' , 'History' , 'Bookmarks' , 'Tools' , 'Help' ,
	term.str( '^RR^Ya^Gi^Cn^Bb^Mow^ Warrior' ) ,
	'汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字' ,
	'汉字汉字汉字汉字汉字汉字汉字汉字' , '汉字汉字汉字汉字汉字汉字汉字汉字' , '汉字汉字汉字汉字汉字汉字汉字汉字' , '汉字汉字汉字汉字汉字汉字汉字汉字' , '汉字汉字汉字汉字汉字汉字汉字汉字'
] ;

function menu() {
	var options = {
		y: 1 ,
		style: term.inverse ,
		selectedStyle: term.dim.blue.bgGreen
	} ;

	term.singleLineMenu( items , options , ( error2 , response ) => {
		if ( error2 ) {
			term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
			terminate() ;
			return ;
		}

		term.green( "\n#%s selected: %s (%s,%s)\n" , response.selectedIndex , response.selectedText , response.x , response.y ) ;
		terminate() ;
	} ) ;

	//menu_.on( 'highlight' , eventData => console.error( '\neventData:' , eventData ) ) ;
}

function menuAlign( align ) {
	var options = {
		y: 1 ,
		align ,
		fillIn: true ,
		style: term.inverse ,
		selectedStyle: term.dim.blue.bgGreen
	} ;

	term.singleLineMenu( items , options , ( error2 , response ) => {
		if ( error2 ) {
			term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
			terminate() ;
			return ;
		}

		term.green( "\n#%s selected: %s (%s,%s)\n" , response.selectedIndex , response.selectedText , response.x , response.y ) ;
		terminate() ;
	} ) ;

	//menu_.on( 'highlight' , eventData => console.error( '\neventData:' , eventData ) ) ;
}

function menuSelected( selectedIndex ) {
	var options = {
		y: 1 ,
		selectedIndex ,
		style: term.inverse ,
		selectedStyle: term.dim.blue.bgGreen
	} ;

	term.singleLineMenu( items , options , ( error2 , response ) => {
		if ( error2 ) {
			term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
			terminate() ;
			return ;
		}

		term.green( "\n#%s selected: %s (%s,%s)\n" , response.selectedIndex , response.selectedText , response.x , response.y ) ;
		terminate() ;
	} ) ;
}

async function menuAsync() {
	var options = {
		y: 1 ,
		style: term.inverse ,
		selectedStyle: term.dim.blue.bgGreen
	} ;

	var response = await term.singleLineMenu( items , options ).promise ;
	term.green( "\n#%s selected: %s (%s,%s)\n" , response.selectedIndex , response.selectedText , response.x , response.y ) ;
	terminate() ;
}

function terminate() {
	term.grabInput( false ) ;
	// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
	setTimeout( () => { process.exit() ; } , 100 ) ;
}

term.clear() ;
term.bold.cyan( '\n\nSelect one item from the menu!' ) ;

switch ( process.argv[ 2 ] ) {
	case 'center' :
		menuAlign( 'center' ) ;
		break ;
	case 'right' :
		menuAlign( 'right' ) ;
		break ;
	case 'left' :
		menuAlign( 'left' ) ;
		break ;
	case 'selected' :
		menuSelected( parseInt( process.argv[ 3 ] , 10 ) || 0 ) ;
		break ;
	case 'menuAsync' :
		menuAsync() ;
		break ;
	default :
		menu() ;
		break ;
}
