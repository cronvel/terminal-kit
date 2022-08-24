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



const termkit = require( '../..' ) ;
const term = termkit.terminal ;
const Promise = require( 'seventh' ) ;



term.clear() ;

var document = term.createDocument( {
	palette: new termkit.Palette()
	//	backgroundAttr: { bgColor: 'magenta' , dim: true } ,
} ) ;

var textBox = new termkit.TextBox( {
	parent: document ,
	//content: text ,
	//contentHasMarkup: true ,
	scrollable: true ,
	vScrollBar: true ,
	lineWrap: true ,
	//wordWrap: true ,
	x: 0 ,
	y: 2 ,
	width: 40 ,
	height: 8
} ) ;



async function randomLogs() {
	var index = 0 ,
		randomStr = [
			"[INFO] Initilizing..." ,
			"[INFO] Exiting..." ,
			"[INFO] Reloading..." ,
			"[WARN] No config found" ,
			"[VERB] Client disconnected" ,
			"[INFO] Loading data" ,
			"[VERB] Awesome computing in progress" ,
			"[VERB] Lorem ipsum"
		] ;

	while ( true ) {
		await Promise.resolveTimeout( 50 + Math.random() * 1000 ) ;
		textBox.appendLog( "Log #" + ( index ++ ) + ' ' + randomStr[ Math.floor( Math.random() * randomStr.length ) ] ) ;
	}
}

randomLogs() ;



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

