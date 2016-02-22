#!/usr/bin/env node

"use strict" ;

var term = require( 'terminal-kit' ).terminal ;

var progressBar , progress = 0 ;


function doProgress()
{
	// Add random progress
	progress += Math.random() / 10 ;
	progressBar.update( progress ) ;
	
	if ( progress >= 1 )
	{
		// Cleanup and exit
		setTimeout( function() { term( '\n' ) ; process.exit() ; } , 200 ) ;
	}
	else
	{
		setTimeout( doProgress , 100 + Math.random() * 400 ) ;
	}
}


progressBar = term.progressBar( {
	width: 80 ,
	title: 'Serious stuff in progress:' ,
	eta: true ,
	percent: true
} ) ;

doProgress() ;
                                