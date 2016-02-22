#!/usr/bin/env node

"use strict" ;

var term = require( 'terminal-kit' ).terminal ;

var items = [ 'File' , 'Edit' , 'View' , 'History' , 'Bookmarks' , 'Tools' , 'Help' ] ;

var options = {
	y: 1 ,	// the menu will be on the top of the terminal
	style: term.inverse ,
	selectedStyle: term.dim.blue.bgGreen
} ;

term.clear() ;

term.singleLineMenu( items , options , function( error , response ) {
	term( '\n' ).eraseLineAfter.green(
		"#%s selected: %s (%s,%s)\n" ,
		response.selectedIndex ,
		response.selectedText ,
		response.x ,
		response.y
	) ;
	process.exit() ;
} ) ;
