#!/usr/bin/env node

"use strict" ;

var term = require( 'terminal-kit' ).terminal ;

var history = [ 'John' , 'Jack' , 'Joey' , 'Billy' , 'Bob' ] ;

var autoComplete = [
	'Barack Obama' , 'George W. Bush' , 'Bill Clinton' , 'George Bush' ,
	'Ronald W. Reagan' , 'Jimmy Carter' , 'Gerald Ford' , 'Richard Nixon' ,
	'Lyndon Johnson' , 'John F. Kennedy' , 'Dwight Eisenhower' ,
	'Harry Truman' , 'Franklin Roosevelt'
] ;

term( 'Please enter your name: ' ) ;

term.inputField(
	{ history: history , autoComplete: autoComplete , autoCompleteMenu: true } ,
	function( error , input ) {

		term.green( "\nYour name is '%s'\n" , input ) ;
		process.exit() ;
	}
) ;
