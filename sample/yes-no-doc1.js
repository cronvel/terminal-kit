#!/usr/bin/env node

"use strict" ;

var term = require( 'terminal-kit' ).terminal ;

function question()
{
	term( 'Do you like javascript? [Y|n]\n' ) ;
	
	// Exit on y and ENTER key
	// Ask again on n
	term.yesOrNo( { yes: [ 'y' , 'ENTER' ] , no: [ 'n' ] } , function( error , result ) {
	
		if ( result )
		{
			term.green( "'Yes' detected! Good bye!\n" ) ;
			process.exit() ;
		}
		else
		{
			term.red( "'No' detected, are you sure?\n" ) ;
			question() ;
		}
	} ) ;
}

question() ;
