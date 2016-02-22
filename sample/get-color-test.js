#!/usr/bin/env node
/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox test suite
	
	Copyright (c) 2009 - 2014 Cédric Ronvel 
	
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

	var terminating = false ;
	
	function terminate()
	{
		terminating = true ;
		term.brightBlack( 'About to exit...\n' ) ;
		term.grabInput( false ) ;
		
		// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
		setTimeout( function() { process.exit() ; } , 250 ) ;
	}
	
	var i = 0 ;
	
	function getColors() {
		
		if ( terminating ) { return ; }
		
		term.getColor( i , function get( error , reg ) {
			
			if ( error ) { term.red( error.toString() + '\n' ) ; }
			else { term( '#%u -- R:%u G:%u B:%u\n' , reg.register , reg.r , reg.g , reg.b ) ; }
			
			if ( terminating ) { return ; }
			
			if ( i < 15 ) { i ++ ; getColors() ; }
			else { terminate() ; }
		} ) ;
	}
	
	term.on( 'key' , function( name , matches , data ) {
		
		console.log(
			"'key' event:" ,
			name ,
			matches ,
			Buffer.isBuffer( data.code ) ? data.code : data.code.toString( 16 ) ,
			data.codepoint ? data.codepoint.toString( 16 ) : ''
		) ;
		
		if ( matches.indexOf( 'CTRL_C' ) >= 0 )
		{
			term.green( 'CTRL-C received...\n' ) ;
			terminate() ;
		}
		
		if ( matches.indexOf( 'CTRL_R' ) >= 0 )
		{
			term.green( 'CTRL-R received... asking terminal some information...\n' ) ;
			term.requestCursorLocation() ;
			term.requestScreenSize() ;
		}
	} ) ;
	
	//*
	term.on( 'terminal' , function( name , data ) {
		console.log( "'terminal' event:" , name , data ) ;
	} ) ;

	term.on( 'mouse' , function( name , data ) {
		console.log( "'mouse' event:" , name , data ) ;
	} ) ;

	term.on( 'unknown' , function( buffer ) {
		console.log( "'unknown' event, buffer:" , buffer ) ;
	} ) ;
	//*/
	
	getColors() ;
	setTimeout( terminate , 2000 ) ;
} ) ;

