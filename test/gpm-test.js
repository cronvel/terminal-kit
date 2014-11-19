#!/usr/bin/env node




var term = require( '../lib/terminal.js' ) ;

term.getTTY( function( error , data ) { console.log( error.message , data ) ; } ) ;



/*
var net = require( 'net' ) ;
var s = new net.Socket() ;

s.connect( '/dev/gpmctl' , function() {
	console.log( 'Connected' ) ;
	s.write( 'blah' ) ;
} ) ;

s.on( 'end' , function() {
	console.log( 'end' ) ;
	process.exit() ;
} ) ;

s.on( 'data' , function() {
	console.log( 'data' , arguments ) ;
} ) ;

setTimeout( function(){process.exit();} , 5000 ) ;
//*/


