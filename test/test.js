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

/* jshint unused:false */
/* global describe, it, before, after */


var term = require( '../lib/terminal.js' ) ;


/*
var format = require( '../lib/format' ) ;
//console.log( format.count( '%i' ) ) ;
//console.log( format( 'format %2s %1s' , 'one' , 2.1 ) ) ;
//console.log( format( 'format %+1s > ' , 'one' , 2.1 ) ) ;
//console.log( '>>> ' , Math.floor( -5 ) ) ;
console.log( 'start...' ) ;
term.right( 8 ) ;
term.right( 5 ) ;
term.right( 3 ) ;
done() ;
return ;
//*/

term( 'a\n' )( 'true\n' )( 'warrior\n' ) ;
term( term.esc.blue.on + 'Blue' ) ;
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
term.styleReset() ; term( 'normal' ) ;
term.saveCursor() ;

term.windowTitle( 'wonderful title' ) ;

term.up( 4 ).red( 'up ' ).cyan( 4 ) ;

term.moveTo( 1 , 1 ).blue( 'origin' ) ;
term.move( 0 , 0 ).bold.cyan( '(0;0)' ) ;
term.move( 5 , 5 ).bold.brightYellow( '(+5;+5)' ) ;
term.move( -2 , -5 ) ; term.bold.brightGreen( '(-2;-5)' ) ;
term.restoreCursor() ;

//term.moveToLowerLeft() ; term( 'lowerleft!' ) ;

//term( term.esc.mouseMotion.on ) ;

term.grabInput() ;

term.on( 'key' , function( code , codepoint , char , buffer , string ) {
	console.log( 'Key event:' , new Buffer( code ) , codepoint && codepoint.toString( 16 ) , char , buffer , string ) ;
} ) ;

term.on( 'special' , function( buffer ) {
	console.log( 'Special event:' , buffer ) ;
} ) ;

setTimeout( function() {
	term( term.esc.mouseMotion.off ) ;
	term.beep() ;
	process.exit() ;
} , 20000 ) ;


