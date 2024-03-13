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



/*
	The Object-viewer should have its own Document Element later.
	For instance this is just a proof of concept.
*/



const fs = require( 'fs' ) ;
const path = require( 'path' ) ;

const string = require( 'string-kit' ) ;
const Promise = require( 'seventh' ) ;

const termkit = require( '../..' ) ;
const term = termkit.terminal ;



if ( process.argv.length <= 2 ) {
	term.magenta( "Usage is: ./%s <file-path>\n" , path.basename( process.argv[ 1 ] ) ) ;
	process.exit( 1 ) ;
}

const filepath = process.argv[ 2 ] ;



async function run() {
	term.clear() ;
	var content = await fs.promises.readFile( filepath , "utf8" ) ;
	var object = JSON.parse( content ) ;

	var document = term.createDocument( { palette: new termkit.Palette() } ) ;

	var inspector = new termkit.Inspector( {
		parent: document ,
		inspectedObject: object ,
		x: 0 ,
		y: 0 ,
		width: 80 ,
		//width: document.outputWidth - 1 ,
		height: document.outputHeight - 1 ,
		editable: true ,
		sealed: true ,
		mode: 'sealedEdit' ,
	} ) ;

	inspector.on( 'submit' , onSubmit ) ;

	function onSubmit( value ) {
		console.error( 'Submitted: ' , value ) ;
	}

	document.giveFocusTo( inspector ) ;
}



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

run() ;

