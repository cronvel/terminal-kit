#!/usr/bin/env node
/*
	Terminal Kit
	
	Copyright (c) 2009 - 2018 Cédric Ronvel
	
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



require( '../lib/termkit.js' ).getDetectedTerminal( function( error , term ) {

	var menu_ ;
	
	term.grabInput( { mouse: 'motion' } ) ;
	
	term.on( 'key' , ( name ) => {
		
		if ( name === 'CTRL_C' )
		{
			if ( menu_ ) { menu_.stop() ; }
			term.green( 'CTRL-C received...\n' ) ;
			term.processExit() ;
		}
	} ) ;
	


	var items = [
		'File' , 'Edit' , 'View' , 'History' , 'Bookmarks' , 'Tools' , 'Help'
	] ;
	
	items.push( 'a very looooooooooooooong menu entry! '.repeat( 8 ) ) ;
	items.push( term.str( '^ra ^cvery ^glo^boo^yooo^moooooo^/ooong^ ^cmenu ^Yentry ^_with escape sequences! ' ).repeat( 8 ) ) ;
	


	function menu() {
		var options = {
			//ellipsis: true ,
			selectedLeftPadding: '*' ,
			extraLines: 2 ,
			//continueOnSubmit: true ,
			//keyBindings: { ENTER: 'submit' , UP: 'previous' , p: 'previous' , DOWN: 'next' , n: 'next' } ,
			//y: 1 ,
			//style: term.inverse ,
			//selectedStyle: term.dim.blue.bgGreen
		} ;
		
		menu_ = term.singleColumnMenu( items , options , function( error , response ) {
			
			if ( error )
			{
				term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
				term.processExit() ;
				return ;
			}
			
			term.green( "\n#%s %s: %s (%s,%s)\n" ,
				response.selectedIndex ,
				response.submitted ? 'submitted' : 'selected' ,
				response.selectedText ,
				response.x ,
				response.y
			) ;
			
			term.processExit() ;
		} ) ;
		
		setTimeout( menu_.pause.bind( menu_ ) , 1500 ) ;
		setTimeout( menu_.resume.bind( menu_ ) , 3000 ) ;
	}
	

	
	async function asyncMenu() {
		var options = {
			//ellipsis: true ,
			selectedLeftPadding: '*' ,
			extraLines: 2 ,
			unsubmittableIndexes: [ false , true ] ,
			//continueOnSubmit: true ,
			//keyBindings: { ENTER: 'submit' , UP: 'previous' , p: 'previous' , DOWN: 'next' , n: 'next' } ,
			//y: 1 ,
			//style: term.inverse ,
			//selectedStyle: term.dim.blue.bgGreen
		} ;
		
		var response = await term.singleColumnMenu( items , options ).promise ;
		
		term.green( "\n#%s %s: %s (%s,%s)\n" ,
			response.selectedIndex ,
			response.submitted ? 'submitted' : 'selected' ,
			response.selectedText ,
			response.x ,
			response.y
		) ;
		
		term.processExit() ;
	}
	
	
	
	//term.clear() ;
	term.bold.cyan( '\n\nSelect one item from the menu!' ) ;

	//menu() ; 
	asyncMenu() ; 
} ) ;


