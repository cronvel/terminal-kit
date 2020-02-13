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



/* jshint unused:false */
/* global describe, it, before, after */


var termkit = require( '../lib/termkit.js' ) ;
var term = termkit.terminal ;

async function detect() {
	term.green( '\n== Environment variable ==\n\n' ) ;
	term( '$TERM: %s\n' , process.env.TERM ) ;
	term( '$COLORTERM: %s\n' , process.env.COLORTERM ) ;
	term( '$VTE_VERSION: %s\n' , process.env.VTE_VERSION ) ;
	term( '\n' ) ;



	term.green( '\n== Using simple terminal guessing ==\n\n' ) ;
	term( '.guessTerminal(): %J\n' , termkit.guessTerminal() ) ;
	term( 'Terminal name: %s\n' , term.appName ) ;
	term( 'Terminal app ID: %s\n' , term.appId ) ;
	term( 'Generic terminal: %s\n' , term.generic ) ;
	term( 'Config file: %s\n' , term.termconfigFile ) ;
	term( '\n' ) ;



	term.green( '\n== Using advanced terminal detection ==\n\n' ) ;
	var info = await termkit.getParentTerminalInfo( info ) ;
	
	term( '.getParentTerminalInfo(): %J\n' , info ) ;
	
	var newTerm = await termkit.getDetectedTerminal() ;
	
	term( 'Terminal name: %s\n' , newTerm.appName ) ;
	term( 'Terminal app ID: %s\n' , newTerm.appId ) ;
	term( 'Generic terminal: %s\n' , newTerm.generic ) ;
	term( 'Config file: %s\n' , newTerm.termconfigFile ) ;
	term( '\n' ) ;
}

detect() ;
