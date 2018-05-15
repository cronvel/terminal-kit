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



/* jshint unused:false */
/* global describe, it, before, after */



var term = require( '../lib/termkit.js' ).terminal ;
//var term = require( '../lib/termkit.js' ).realTerminal ;

/*
term( 'Terminal name: %s\n' , term.appName ) ;
term( 'Terminal app: %s\n' , term.app ) ;
term( 'Terminal generic: %s\n' , term.generic ) ;
term( 'Config file: %s\n' , term.termconfigFile ) ;
term.down( 3 , "123" ).previousLine()( "456" ).nextLine( 2 , "789" ).column( 20 , '20th col' ).down( 3 , '\n' ).hideCursor( false ) ;
process.exit() ;
*/

term( 'term.isTTY: %I\n' , term.isTTY ) ;
term( 'a\n' )( 'true\n' )( 'warrior\n' ) ;
term( term.esc.blue.on + 'Blue' + term.esc.blue.off ) ;
term( 'normal' ) ;
term.red( 'Red' ) ;
term( ' normal' ) ;
term.red( 'Red' ) ;
term( ' normal' ) ;
term.bold.underline.red( 'Bold-underline-red' ) ;
term.green.strike( 'Green-strike' ) ;
term.magenta.italic( 'Magenta-italic' ) ;
term.blink( 'Blink' ) ;
term( term.esc.blue.on + 'Blue' ) ;
term.styleReset() ; term( 'normal\n' ) ;
term( 'The terminal size is %dx%d' , term.width , term.height ) ;
term.saveCursor() ;

term.windowTitle( 'wonderful title' ) ;

term.up( 4 ).red( 'up ' ).cyan( 4 ) ;

term.moveTo( 1 , 1 ).blue( 'origin' ) ;
term.move( 0 , 0 ).bold.cyan( '(0;0)' ) ;
term.move( 5 , 5 ).bold.brightYellow( '(+5;+5)' ) ;
term.move( -2 , -5 ) ; term.bold.brightGreen( '(-2;-5)' ) ;
term.moveTo.cyan( 1 , 2 , "My name is %s, I'm %d.\n" , 'Jack' , 32  ) ;
term.restoreCursor() ;

var toto = term.str.red( 'toto' ) ;
console.log( '\nconsole.log(toto):' , toto ) ;

term( '\n' ) ;
