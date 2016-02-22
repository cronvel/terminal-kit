#!/usr/bin/env node

"use strict" ;

var fs = require( 'fs' ) ;
var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;

var autoCompleter = function autoCompleter( inputString , callback )
{  
    fs.readdir( __dirname , function( error , files ) {
        callback( undefined , termkit.autoComplete( files , inputString , true ) ) ;
    } ) ;
} ;
    
term( 'Choose a file: ' ) ;

term.inputField(
	{ autoComplete: autoCompleter , autoCompleteMenu: true } ,
	function( error , input ) {
		if ( error )
		{
			term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
		}
		else
		{
			term.green( "\nYour file is '%s'\n" , input ) ;
		}
		
		process.exit() ;
	}
) ;
