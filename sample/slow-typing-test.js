#!/usr/bin/env node

"use strict" ;

var term = require( 'terminal-kit' ).terminal ;

term.slowTyping(
	'What a wonderful world!\n' ,
	{ flashStyle: term.brightWhite.italic } ,
	function() { process.exit() ; }
) ;




