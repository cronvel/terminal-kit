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



const termkit = require( '..' ) ;
const term = termkit.terminal ;
//const termios = require( 'termios' ) ;



async function test() {
	term.clear() ;
	term.green( "Your virtual terminal is below:" ) ;
	
	term.grabInput( { mouse: 'motion' , focus: true } ) ;
	
	var vte = new termkit.Vte( { width: 80 , height: 24 , dst: term , x: 5 , y: 3 , eventInput: term } ) ;
	vte.run( process.argv[ 2 ] || 'ls' , process.argv.slice( 3 ) ) ;

	term.on( 'key' , key => {
		if ( key === 'CTRL_C' ) {
			term.clear() ;
			process.exit() ;
		}
		else if ( key === 'CTRL_R' ) {
			// Force a redraw now!
			vte.redraw() ;
		}
	} ) ;
	
	/*
	setInterval( () => {
		console.error( 'TERMIOS stdin attr:' , termios.getattr( vte.childProcess.stdin.fd ) ) ;
		//console.error( 'TERMIOS stdout attr:' , termios.getattr( vte.childProcess.stdout.fd ) ) ;
	} , 2000 ) ;
	*/
}

test() ;

