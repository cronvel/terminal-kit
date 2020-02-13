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
                                