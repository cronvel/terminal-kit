#!/usr/bin/env node
/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox test suite
	
	Copyright (c) 2009 - 2014 Cédric Ronvel 
	
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



require( '../lib/termkit.js' ).getDetectedTerminal( function( error , term ) {

	term.grabInput() ;
	
	function question()
	{
		var controler ;
		
		term( 'Do you like javascript? [y|n] ' ) ;
		
		//term.yesOrNo( { yes: [ 'y' , 'o' , 'ENTER' ] , no: [ 'n' ] , echoYes: 'yes' , echoNo: 'no' } , function( error , result ) {
		controler = term.yesOrNo( function( error , result ) {
			
			if ( error )
			{
				term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
				question() ;
			}
			else if ( result )
			{
				term.green( "\n'Yes' detected! Good bye!\n" ) ;
				terminate() ;
			}
			else
			{
				term.red( "\n'No' detected, are you sure?\n" ) ;
				question() ;
			}
		} ) ;
		
		term.on( 'key' , function( key ) {
			if ( key === 'ESCAPE' )
			{
				term( 'Escape.\n' ) ;
				controler.abort() ;
				setTimeout( terminate , 2000 ) ;
			}
		} ) ;
	}



	function terminate()
	{
		term.grabInput( false ) ;
		// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
		setTimeout( function() { process.exit() ; } , 100 ) ;
	}
	
	
	term.bold.cyan( 'Yes or no test, hit anything on the keyboard to see how it is detected...\n' ) ;
	question() ; 
} ) ;




