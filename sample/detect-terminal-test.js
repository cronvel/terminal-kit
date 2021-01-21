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



const os = require( 'os' ) ;
const termkit = require( '../lib/termkit.js' ) ;
const term = termkit.terminal ;



async function testTerminal( t ) {
	var r ;

	term( 'Terminal name: %s\n' , t.appName ) ;
	term( 'Terminal app ID: %s\n' , t.appId ) ;
	term( 'Generic terminal: %s\n' , t.generic ) ;
	term( 'Config file: %s\n' , t.termconfigFile ) ;
	term( '\n' ) ;
	
	term( "Support for delta escape sequence: " + ( t.support.deltaEscapeSequence ? "^GOK^:\n" : "^RNO^:\n" ) ) ;
	term( "Support for 256 colors: " + ( t.support['256colors'] ? "^GOK^:\n" : "^RNO^:\n" ) ) ;
	term( "Support for true colors: " + ( t.support.trueColor ? "^GOK^:\n" : "^RNO^:\n" ) ) ;

	try {
		term( "Support for cursor location request: " ) ;
		r = await t.getCursorLocation() ;
		term( "^GOK^ ^K(%N)^:\n" , r ) ;
	}
	catch ( error ) {
		term( "^RFAILED^ (%s)^:\n" , error ) ;
	}

	try {
		term( "Support for palette request: " ) ;
		await t.getPalette() ;
		term( "^GOK^:\n" ) ;
	}
	catch ( error ) {
		term( "^RFAILED^ (%s)^:\n" , error ) ;
	}

	term( "Issue #116 CURSOR_LOCATION keymap: " + ( t.keymap.CURSOR_LOCATION && typeof t.keymap.CURSOR_LOCATION === 'object' ? "^GOK^:\n" : "^RNO^:\n" ) ) ;
	term( "Issue #116 cursorLocation handler: " + ( typeof t.handler.cursorLocation === 'function' ? "^GOK^:\n" : "^RNO^:\n" ) ) ;

	term( '\n' ) ;
}



async function detect() {
	var info , newTerm ;

	term.green( '\n== OS and Environment Variables ==\n\n' ) ;
	term( 'Node version: %s\n' , process.version ) ;
	term( 'OS platform: %s\n' , os.platform() ) ;
	term( 'OS type: %s\n' , os.type() ) ;
	term( 'OS release: %s\n' , os.release() ) ;
	term( 'OS version: %s\n' , os.version && os.version() ) ;
	term( '$TERM: %s\n' , process.env.TERM ) ;
	term( '$COLORTERM: %s\n' , process.env.COLORTERM ) ;
	term( '$VTE_VERSION: %s\n' , process.env.VTE_VERSION ) ;
	term( '$TERM_PROGRAM: %s\n' , process.env.TERM_PROGRAM ) ;
	term( '\n' ) ;



	term.green( '\n== Using simple terminal guessing ==\n\n' ) ;
	term( '.guessTerminal(): %J\n' , termkit.guessTerminal() ) ;
	await testTerminal( term ) ;



	term.green( '\n== Using advanced terminal detection ==\n\n' ) ;
	try {
		info = await termkit.getParentTerminalInfo( info ) ;
		term( '.getParentTerminalInfo(): %J\n' , info ) ;
	}
	catch ( error ) {
		term.red( "Can't get parent terminal info: %E" , error ) ;
	}
	
	try {
		newTerm = await termkit.getDetectedTerminal() ;
		await testTerminal( newTerm ) ;
	}
	catch ( error ) {
		term.red( "Can't get detect real terminal: %E" , error ) ;
	}
	
	process.exit() ;
}

detect() ;

