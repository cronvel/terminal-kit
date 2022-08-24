#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2022 Cédric Ronvel

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



/* jshint unused:false */



require( '../lib/termkit.js' ).getDetectedTerminal( function( error , term ) {

	term.grabInput( { mouse: 'motion' } ) ;
	
	var items = [
		'a menu entry' ,
		'another menu entry' ,
		'still a menu entry' ,
		'yet another menu entry' ,
		'know what? a menu entry!' ,
		'surprise! a menu entry!' ,
		'dang! a menu entry!' ,
		'^Ydouble dang! a menu entry!' ,
		'OMG! too much menu entries!' ,
		'seriously: this is a menu entry!' ,
	] ;
	
	
	
	function menu() {
		var options = {
			selectedLeftPadding: '*' ,
			//keyBindings: { ENTER: 'submit' , UP: 'previous' , p: 'previous' , DOWN: 'next' , n: 'next' } ,
			//x: 4 ,
			//itemMaxWidth: 20 ,
			//y: 1 ,
			//style: term.inverse ,
			//selectedStyle: term.dim.blue.bgGreen
		} ;
		
		term.gridMenu( items , options , function( error , response ) {
			
			if ( error )
			{
				term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
				terminate() ;
				return ;
			}
			
			term.green( "\n#%s selected: %s (%s,%s)\n" , response.selectedIndex , response.selectedText , response.x , response.y ) ;
			terminate() ;
		} ) ;
	}
	
	
	
	async function asyncMenu() {
		var options = {
			selectedLeftPadding: '*' ,
			//keyBindings: { ENTER: 'submit' , UP: 'previous' , p: 'previous' , DOWN: 'next' , n: 'next' } ,
			//x: 4 ,
			//itemMaxWidth: 20 ,
			//y: 1 ,
			//style: term.inverse ,
			//selectedStyle: term.dim.blue.bgGreen
		} ;
		
		var response = await term.gridMenu( items , options ).promise ;
		term.green( "\n#%s selected: %s (%s,%s)\n" , response.selectedIndex , response.selectedText , response.x , response.y ) ;
		terminate() ;
	}
	
	
	
	function terminate() {
		term.grabInput( false ) ;
		// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
		setTimeout( function() { process.exit() ; } , 100 ) ;
	}
	
	//term.clear() ;
	term.bold.cyan( '\n\nSelect one item from the menu!' ) ;

	//menu() ; 
	asyncMenu() ; 
} ) ;


