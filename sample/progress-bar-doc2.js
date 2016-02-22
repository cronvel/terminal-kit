#!/usr/bin/env node

"use strict" ;

var term = require( 'terminal-kit' ).terminal ;

var progressBar ;

var thingsToDo = [
	'update my lib' ,
	'data analysing' ,
	'serious business' ,
	'decrunching data' ,
	'do my laundry' ,
	'optimizing'
] ;

var countDown = thingsToDo.length ;


function start()
{
	if ( ! thingsToDo.length ) { return ; }
	
	var task = thingsToDo.shift() ;
	
	progressBar.startItem( task ) ;
	
	// Finish the task in...
	setTimeout( done.bind( null , task ) , 500 + Math.random() * 1200 ) ;
	
	// Start another parallel task in...
	setTimeout( start , 400 + Math.random() * 400 ) ;
}


function done( task )
{
	progressBar.itemDone( task ) ;
	countDown -- ;
	
	// Cleanup and exit
	if ( ! countDown )
	{
		setTimeout( function() { term( '\n' ) ; process.exit() ; } , 200 ) ;
	}
}


progressBar = term.progressBar( {
	width: 80 ,
	title: 'Daily tasks:' ,
	eta: true ,
	percent: true ,
	items: thingsToDo.length
} ) ;

start() ;
                                