#!/usr/bin/env node

"use strict" ;

var term = require( 'terminal-kit' ).terminal ;

term( 'shell> ' ) ;

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
