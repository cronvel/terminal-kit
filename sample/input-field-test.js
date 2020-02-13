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



require( '../lib/termkit.js' ).getDetectedTerminal( function( error , term ) {

	term.grabInput() ;
	
	var history = [
		"OMG my name was supa long, so much long I can't remember what it is, can you believe that?" ,
		'John' , 'Jack' , 'Joey' , 'Billy' , 'Bob'
	] ;
	
	var autoComplete = [
		'Barack Obama' , 'George W. Bush' , 'Bill Clinton' , 'George Bush' ,
		'Ronald W. Reagan' , 'Jimmy Carter' , 'Gerald Ford' , 'Richard Nixon' ,
		'Lyndon Johnson' , 'John F. Kennedy' , 'Dwight Eisenhower' , 'Harry Truman' , 'Franklin Roosevelt'
	] ;
	
	term.on( 'key' , function( key ) {
		if ( key === 'CTRL_C' )
		{
			term.green( 'CTRL-C detected...\n' ) ;
			terminate() ;
		}
	} ) ;
	
	function question() {
		term.green( 'Please enter your name: ' ) ;
		
		var field = term.inputField( {
				//y: term.height , x: 1 ,
				echoChar: '*' ,
				//*
				//default: 'mkdir ""' ,
				//cursorPosition: -2 ,
				history: history ,
				autoComplete: autoComplete ,
				autoCompleteMenu: true ,
				autoCompleteHint: true ,
				hintStyle: term.brightBlack.italic ,
				//*/
				//maxLength: 3
			} , function( error , input ) {
			
			if ( error )
			{
				term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
				terminate() ;
			}
			else
			{
				term.green( "\nYour name is '%s'\n" , input ) ;
				terminate() ;
			}
		} ) ;
		
		//setTimeout( () => field.setCursorPosition( 3 ) , 1000 ) ;
		//setTimeout( () => console.log( '\npos:' , field.getCursorPosition() ) , 1000 ) ;
	}
	
	async function asyncQuestion() {
		term.green( 'Please enter your name: ' ) ;
		
		var input = await term.inputField( {
			//y: term.height , x: 1 ,
			//echoChar: '*' ,
			//*
			//default: 'mkdir ""' ,
			//cursorPosition: -2 ,
			history: history ,
			autoComplete: autoComplete ,
			autoCompleteMenu: true ,
			autoCompleteHint: true ,
			hintStyle: term.brightBlack.italic ,
			//*/
			//maxLength: 3
		} ).promise ;

		term.green( "\nYour name is '%s'\n" , input ) ;
		terminate() ;
	}
	
	
	
	function funkyCursor() {
		//*
		term.setCursorColorRgb(
			Math.floor( 30 + Math.random() * 200 ) ,
			Math.floor( 30 + Math.random() * 200 ) ,
			Math.floor( 30 + Math.random() * 200 )
		) ;
		//*/
		
		/*
		term.setCursorColor(
			Math.floor( Math.random() * 8 ) ,
			Math.floor( Math.random() * 8 )
		) ;
		//*/
		
		setTimeout( funkyCursor , 200 ) ;
	}
	
	
	
	function funkyBackground() {
		term.setDefaultBgColorRgb(
			Math.floor( 0 + Math.random() * 100 ) ,
			Math.floor( 0 + Math.random() * 100 ) ,
			Math.floor( 0 + Math.random() * 100 )
		) ;
		term.setDefaultColorRgb(
			Math.floor( 150 + Math.random() * 100 ) ,
			Math.floor( 150 + Math.random() * 100 ) ,
			Math.floor( 150 + Math.random() * 100 )
		) ;
		setTimeout( funkyBackground , 2000 ) ;
	}
	
	
	
	function terminate() {
		term.processExit() ;
	}
	
	
	term.bold.cyan( 'Input field test, type something and hit the ENTER key...\n' ) ;
	//question() ; 
	asyncQuestion() ; 
	//funkyCursor() ;
	//funkyBackground() ;
} ) ;


