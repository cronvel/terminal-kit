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

var term = require( 'terminal-kit' ).terminal ;

term( '> ' ) ;

var autoComplete = [
	'dnf install' ,
	'dnf install nodejs' ,
	'dnf search' ,
	'sudo' ,
	'sudo dnf install' ,
	'sudo dnf install nodejs' ,
	'sudo dnf search' ,
] ;

term.inputField(
	{
		autoComplete: autoComplete ,
		autoCompleteHint: true ,
		autoCompleteMenu: true ,
		tokenHook: function( token , isEndOfInput , previousTokens , term , config ) {
			var previousText = previousTokens.join( ' ' ) ;
			
			switch ( token )
			{
				case 'sudo' :
					config.style = term.red ;
					return previousTokens.length ? null : term.bold.red ;
				case 'dnf' :
					return previousText === '' || previousText === 'sudo' ? term.brightMagenta : null ;
				case 'install' :
					config.style = term.brightBlue ;
					config.hintStyle = term.brightBlack.italic ;
					return previousText === 'dnf' || previousText === 'sudo dnf' ? term.brightYellow : null ;
				case 'search' :
					config.style = term.brightBlue ;
					return previousText === 'dnf' || previousText === 'sudo dnf' ? term.brightCyan : null ;
			}
		}
	} ,
	function( error , input ) {

		term.green( "\nYour command is: '%s'\n" , input ) ;
		process.exit() ;
	}
) ;



term.on( 'key' , function( key ) {
	if ( key === 'CTRL_C' )
	{
		term.green( 'CTRL-C detected...\n' ) ;
		terminate() ;
	}
} ) ;



function terminate()
{
	term.grabInput( false ) ;
	// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
	setTimeout( function() { process.exit() ; } , 100 ) ;
}

