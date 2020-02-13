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



var fs = require( 'fs' ) ;
var termkit = require( '../lib/termkit.js' ) ;


termkit.getDetectedTerminal( function( error , term ) {

	var autoCompleter = function autoCompleter( inputString , callback )
	{
		fs.readdir( __dirname , function( error , files ) {
			//console.log( files ) ;
			callback( undefined , termkit.autoComplete( files , inputString , true ) ) ;
		} ) ;
	} ;
	
	function question()
	{
		term( 'Choose a file: ' ) ;
		
		term.inputField( { autoComplete: autoCompleter , autoCompleteMenu: true } , function( error , input ) {
			
			if ( error )
			{
				term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
				question() ;
			}
			else
			{
				term.green( "\nYour file is '%s'\n" , input ) ;
				terminate() ;
			}
		} ) ;
	}
	
	
	
	function terminate()
	{
		term.grabInput( false ) ;
		// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
		setTimeout( function() { process.exit() ; } , 100 ) ;
	}
	
	
	term.bold.cyan( 'Async auto-completer, type something and hit the ENTER key...\n' ) ;
	question() ; 
} ) ;




