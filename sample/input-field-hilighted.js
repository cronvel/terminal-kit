#!/usr/bin/env node

"use strict" ;

var term = require( 'terminal-kit' ).terminal ;

term( '> ' ) ;

term.inputField(
	{
		style: term.brightCyan ,
		tokenStyleHook: function( token , previousTokens , style ) {
			if ( token === 'sudo' ) { return style.red ; }
		} ,
		tokenFinishHook: function( tokens , style ) {
			if ( tokens.join( ' ' ) === "dnf install" )
			{
				style.brightBlack( " node" ) ;
			}
		}
	} ,
	function( error , input ) {

		term.green( "\nYour command is: '%s'\n" , input ) ;
		process.exit() ;
	}
) ;
