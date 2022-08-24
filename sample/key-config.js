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

// this is a little utility for getting the correct key mappings for new terminals

"use strict" ;

const terminal = require( '..' ) ;
const inspect = require( 'util' ).inspect ;

let done = false ;
// turn events into an async function
async function* eventGenerator( eventEmitter , ... events ) {
	var queue = [] ;

	// register event listener(s)
	for ( let event of events ) {
		eventEmitter.on( event , ( ... args ) => {
			queue.push( args ) ;
		} ) ;
	}

	// yeild events when they come in; delay 500ms between looking for events
	while( ! done ) {
		while( ! queue.length ) {
			await delay( 50 ) ;
		}
		yield queue.shift() ;
	}
}

let inputEvents = eventGenerator( process.stdin , "data" ) ;
// get a key stroke
async function getInput() {
	let event = await inputEvents.next() ;
	return event.value[0] ;
}

// wait `count` ms, similar to sleep()
async function delay( count ) {
	return new Promise( ( resolve ) => {
		setTimeout( () => {
			resolve() ;
		} , count ) ;
	} ) ;
}

var keyMap = new Map( [
	[ "ESCAPE" , null ] ,
	// [ "ENTER" , null ] ,
	[ "BACKSPACE" , null ] ,
	[ "NUL" , null ] ,
	[ "TAB" , null ] ,
	[ "SHIFT_TAB" , null ] ,
	[ "UP" , null ] ,
	[ "DOWN" , null ] ,
	[ "RIGHT" , null ] ,
	[ "LEFT" , null ] ,
	[ "INSERT" , null ] ,
	[ "DELETE" , null ] ,
	[ "HOME" , null ] ,
	[ "END" , null ] ,
	[ "PAGE_UP" , null ] ,
	[ "PAGE_DOWN" , null ] ,
	[ "KP_NUMLOCK" , null ] ,
	[ "KP_DIVIDE" , null ] ,
	[ "KP_MULTIPLY" , null ] ,
	[ "KP_MINUS" , null ] ,
	[ "KP_PLUS" , null ] ,
	[ "KP_DELETE" , null ] ,
	[ "KP_ENTER" , null ] ,
	[ "KP_0" , null ] ,
	[ "KP_1" , null ] ,
	[ "KP_2" , null ] ,
	[ "KP_3" , null ] ,
	[ "KP_4" , null ] ,
	[ "KP_5" , null ] ,
	[ "KP_6" , null ] ,
	[ "KP_7" , null ] ,
	[ "KP_8" , null ] ,
	[ "KP_9" , null ] ,
	[ "F1" , null ] ,
	[ "F2" , null ] ,
	[ "F3" , null ] ,
	[ "F4" , null ] ,
	[ "F5" , null ] ,
	[ "F6" , null ] ,
	[ "F7" , null ] ,
	[ "F8" , null ] ,
	[ "F9" , null ] ,
	[ "F10" , null ] ,
	[ "F11" , null ] ,
	[ "F12" , null ] ,
	[ "SHIFT_F1" , null ] ,
	[ "SHIFT_F2" , null ] ,
	[ "SHIFT_F3" , null ] ,
	[ "SHIFT_F4" , null ] ,
	[ "SHIFT_F5" , null ] ,
	[ "SHIFT_F6" , null ] ,
	[ "SHIFT_F7" , null ] ,
	[ "SHIFT_F8" , null ] ,
	[ "SHIFT_F9" , null ] ,
	[ "SHIFT_F10" , null ] ,
	[ "SHIFT_F11" , null ] ,
	[ "SHIFT_F12" , null ] ,
	[ "CTRL_F1" , null ] ,
	[ "CTRL_F2" , null ] ,
	[ "CTRL_F3" , null ] ,
	[ "CTRL_F4" , null ] ,
	[ "CTRL_F5" , null ] ,
	[ "CTRL_F6" , null ] ,
	[ "CTRL_F7" , null ] ,
	[ "CTRL_F8" , null ] ,
	[ "CTRL_F9" , null ] ,
	[ "CTRL_F10" , null ] ,
	[ "CTRL_F11" , null ] ,
	[ "CTRL_F12" , null ] ,
	[ "CTRL_SHIFT_F1" , null ] ,
	[ "CTRL_SHIFT_F2" , null ] ,
	[ "CTRL_SHIFT_F3" , null ] ,
	[ "CTRL_SHIFT_F4" , null ] ,
	[ "CTRL_SHIFT_F5" , null ] ,
	[ "CTRL_SHIFT_F6" , null ] ,
	[ "CTRL_SHIFT_F7" , null ] ,
	[ "CTRL_SHIFT_F8" , null ] ,
	[ "CTRL_SHIFT_F9" , null ] ,
	[ "CTRL_SHIFT_F10" , null ] ,
	[ "CTRL_SHIFT_F11" , null ] ,
	[ "CTRL_SHIFT_F12" , null ] ,
	[ "SHIFT_UP" , null ] ,
	[ "SHIFT_DOWN" , null ] ,
	[ "SHIFT_RIGHT" , null ] ,
	[ "SHIFT_LEFT" , null ] ,
	[ "ALT_UP" , null ] ,
	[ "ALT_DOWN" , null ] ,
	[ "ALT_RIGHT" , null ] ,
	[ "ALT_LEFT" , null ] ,
	[ "CTRL_UP" , null ] ,
	[ "CTRL_DOWN" , null ] ,
	[ "CTRL_RIGHT" , null ] ,
	[ "CTRL_LEFT" , null ] ,
	[ "SHIFT_INSERT" , null ] ,
	[ "SHIFT_DELETE" , null ] ,
	[ "SHIFT_HOME" , null ] ,
	[ "SHIFT_END" , null ] ,
	[ "SHIFT_PAGE_UP" , null ] ,
	[ "SHIFT_PAGE_DOWN" , null ] ,
	[ "CTRL_INSERT" , null ] ,
	[ "CTRL_DELETE" , null ] ,
	[ "CTRL_HOME" , null ] ,
	[ "CTRL_END" , null ] ,
	[ "CTRL_PAGE_UP" , null ] ,
	[ "CTRL_PAGE_DOWN" , null ] ,
	[ "ALT_BACKSPACE" , null ] ,
	[ "ALT_INSERT" , null ] ,
	[ "ALT_DELETE" , null ] ,
	[ "ALT_HOME" , null ] ,
	[ "ALT_END" , null ] ,
	[ "ALT_PAGE_UP" , null ] ,
	[ "ALT_PAGE_DOWN" , null ] ,
	[ "SHIFT_TAB" , null ] ,
	[ "ALT_TAB" , null ] ,
	[ "ALT_SPACE" , null ] ,
	[ "CTRL_ALT_SPACE" , null ] ,
	[ "CTRL_A" , null ] ,
	[ "ALT_A" , null ] ,
	[ "CTRL_ALT_A" , null ] ,
	[ "ALT_SHIFT_A" , null ] ,
	[ "CTRL_B" , null ] ,
	[ "ALT_B" , null ] ,
	[ "CTRL_ALT_B" , null ] ,
	[ "ALT_SHIFT_B" , null ] ,
	[ "CTRL_C" , null ] ,
	[ "ALT_C" , null ] ,
	[ "CTRL_ALT_C" , null ] ,
	[ "ALT_SHIFT_C" , null ] ,
	[ "CTRL_D" , null ] ,
	[ "ALT_D" , null ] ,
	[ "CTRL_ALT_D" , null ] ,
	[ "ALT_SHIFT_D" , null ] ,
	[ "CTRL_E" , null ] ,
	[ "ALT_E" , null ] ,
	[ "CTRL_ALT_E" , null ] ,
	[ "ALT_SHIFT_E" , null ] ,
	[ "CTRL_F" , null ] ,
	[ "ALT_F" , null ] ,
	[ "CTRL_ALT_F" , null ] ,
	[ "ALT_SHIFT_F" , null ] ,
	[ "CTRL_G" , null ] ,
	[ "ALT_G" , null ] ,
	[ "CTRL_ALT_G" , null ] ,
	[ "ALT_SHIFT_G" , null ] ,
	[ "CTRL_H" , null ] ,
	[ "ALT_H" , null ] ,
	[ "CTRL_ALT_H" , null ] ,
	[ "ALT_SHIFT_H" , null ] ,
	[ "CTRL_I" , null ] ,
	[ "ALT_I" , null ] ,
	[ "CTRL_ALT_I" , null ] ,
	[ "ALT_SHIFT_I" , null ] ,
	[ "CTRL_J" , null ] ,
	[ "ALT_J" , null ] ,
	[ "CTRL_ALT_J" , null ] ,
	[ "ALT_SHIFT_J" , null ] ,
	[ "CTRL_K" , null ] ,
	[ "ALT_K" , null ] ,
	[ "CTRL_ALT_K" , null ] ,
	[ "ALT_SHIFT_K" , null ] ,
	[ "CTRL_L" , null ] ,
	[ "ALT_L" , null ] ,
	[ "CTRL_ALT_L" , null ] ,
	[ "ALT_SHIFT_L" , null ] ,
	[ "CTRL_M" , null ] ,
	[ "ALT_M" , null ] ,
	[ "CTRL_ALT_M" , null ] ,
	[ "ALT_SHIFT_M" , null ] ,
	[ "CTRL_N" , null ] ,
	[ "ALT_N" , null ] ,
	[ "CTRL_ALT_N" , null ] ,
	[ "ALT_SHIFT_N" , null ] ,
	[ "CTRL_O" , null ] ,
	[ "ALT_O" , null ] ,
	[ "CTRL_ALT_O" , null ] ,
	[ "ALT_SHIFT_O" , null ] ,
	[ "CTRL_P" , null ] ,
	[ "ALT_P" , null ] ,
	[ "CTRL_ALT_P" , null ] ,
	[ "ALT_SHIFT_P" , null ] ,
	[ "CTRL_Q" , null ] ,
	[ "ALT_Q" , null ] ,
	[ "CTRL_ALT_Q" , null ] ,
	[ "ALT_SHIFT_Q" , null ] ,
	[ "CTRL_R" , null ] ,
	[ "ALT_R" , null ] ,
	[ "CTRL_ALT_R" , null ] ,
	[ "ALT_SHIFT_R" , null ] ,
	[ "CTRL_S" , null ] ,
	[ "ALT_S" , null ] ,
	[ "CTRL_ALT_S" , null ] ,
	[ "ALT_SHIFT_S" , null ] ,
	[ "CTRL_T" , null ] ,
	[ "ALT_T" , null ] ,
	[ "CTRL_ALT_T" , null ] ,
	[ "ALT_SHIFT_T" , null ] ,
	[ "CTRL_U" , null ] ,
	[ "ALT_U" , null ] ,
	[ "CTRL_ALT_U" , null ] ,
	[ "ALT_SHIFT_U" , null ] ,
	[ "CTRL_V" , null ] ,
	[ "ALT_V" , null ] ,
	[ "CTRL_ALT_V" , null ] ,
	[ "ALT_SHIFT_V" , null ] ,
	[ "CTRL_W" , null ] ,
	[ "ALT_W" , null ] ,
	[ "CTRL_ALT_W" , null ] ,
	[ "ALT_SHIFT_W" , null ] ,
	[ "CTRL_X" , null ] ,
	[ "ALT_X" , null ] ,
	[ "CTRL_ALT_X" , null ] ,
	[ "ALT_SHIFT_X" , null ] ,
	[ "CTRL_Y" , null ] ,
	[ "ALT_Y" , null ] ,
	[ "CTRL_ALT_Y" , null ] ,
	[ "ALT_SHIFT_Y" , null ] ,
	[ "CTRL_Z" , null ] ,
	[ "ALT_Z" , null ] ,
	[ "CTRL_ALT_Z" , null ] ,
	[ "ALT_SHIFT_Z" , null ]

	// [ "a" , null ] ,
	// [ "b" , null ] ,
	// [ "c" , null ] ,
	// [ "d" , null ] ,
	// [ "e" , null ] ,
	// [ "f" , null ] ,
	// [ "g" , null ] ,
	// [ "h" , null ] ,
	// [ "i" , null ] ,
	// [ "j" , null ] ,
	// [ "k" , null ] ,
	// [ "l" , null ] ,
	// [ "m" , null ] ,
	// [ "n" , null ] ,
	// [ "o" , null ] ,
	// [ "p" , null ] ,
	// [ "q" , null ] ,
	// [ "r" , null ] ,
	// [ "s" , null ] ,
	// [ "t" , null ] ,
	// [ "u" , null ] ,
	// [ "v" , null ] ,
	// [ "w" , null ] ,
	// [ "x" , null ] ,
	// [ "y" , null ] ,
	// [ "z" , null ] ,
	// [ "A" , null ] ,
	// [ "B" , null ] ,
	// [ "C" , null ] ,
	// [ "D" , null ] ,
	// [ "E" , null ] ,
	// [ "F" , null ] ,
	// [ "G" , null ] ,
	// [ "H" , null ] ,
	// [ "I" , null ] ,
	// [ "J" , null ] ,
	// [ "K" , null ] ,
	// [ "L" , null ] ,
	// [ "M" , null ] ,
	// [ "N" , null ] ,
	// [ "O" , null ] ,
	// [ "P" , null ] ,
	// [ "Q" , null ] ,
	// [ "R" , null ] ,
	// [ "S" , null ] ,
	// [ "T" , null ] ,
	// [ "U" , null ] ,
	// [ "V" , null ] ,
	// [ "W" , null ] ,
	// [ "X" , null ] ,
	// [ "Y" , null ] ,
	// [ "Z" , null ] ,
	// [ "1" , null ] ,
	// [ "2" , null ] ,
	// [ "3" , null ] ,
	// [ "4" , null ] ,
	// [ "5" , null ] ,
	// [ "6" , null ] ,
	// [ "7" , null ] ,
	// [ "8" , null ] ,
	// [ "9" , null ] ,
	// [ "0" , null ] ,
	// [ "`" , null ] ,
	// [ "~" , null ] ,
	// [ "!" , null ] ,
	// [ "@" , null ] ,
	// [ "#" , null ] ,
	// [ "$" , null ] ,
	// [ "%" , null ] ,
	// [ "^" , null ] ,
	// [ "&" , null ] ,
	// [ "*" , null ] ,
	// [ "(" , null ] ,
	// [ ")" , null ] ,
	// [ "_" , null ] ,
	// [ "-" , null ] ,
	// [ "+" , null ] ,
	// [ "=" , null ] ,
	// [ "[" , null ] ,
	// [ "]" , null ] ,
	// [ "{" , null ] ,
	// [ "}" , null ] ,
	// [ "|" , null ] ,
	// [ "\\" , null ] ,
	// [ ":" , null ] ,
	// [ ";" , null ] ,
	// [ "\"" , null ] ,
	// [ "'" , null ] ,
	// [ "," , null ] ,
	// [ "<" , null ] ,
	// [ "." , null ] ,
	// [ ">" , null ] ,
	// [ "/" , null ] ,
	// [ "?" , null ]
] ) ;

// convert type Buffer to a escaped string
function bufToEscStr( buf ) {
	let retStr = "" ;
	for ( let b of buf ) {
		if ( b < 0x20 || b > 0x7E ) {
			retStr += `\\x${b.toString( 16 )}` ;
		}
		else {
			retStr += String.fromCharCode( b ) ;
		}
	}
	return retStr ;
}

var term ;
// check if the user entered key matches the detected terminal key
function sameKey( key ) {
	let termKey = term.keymap[key][0].code ;
	termKey = bufToEscStr( Buffer.from( termKey.split( "" ).map( ( ch ) => ch.charCodeAt( 0 ) ) ) ) ;
	let newKey = keyMap.get( key ) ;
	// console.log ( `termKey: '${termKey}' ... newKey: '${newKey}' ... same: ${termKey === newKey}` ) ;
	return termKey === newKey ;
}

/* main IIFE */
( async function() {
	term = await terminal.getDetectedTerminal() ;
	process.stdin.setRawMode( true ) ;
	process.stdin.resume() ;
	let enter ;

	// get the ENTER key
	process.stdout.write( `Please press the ENTER key: ` ) ;
	enter = await getInput() ;
	console.log( enter ) ;
	keyMap.set( "ENTER" , bufToEscStr ( enter ) ) ;

	// prompt the user for each key
	for ( let key of [ ... keyMap.keys() ] ) {
		if ( key === "ENTER" ) continue ;
		process.stdout.write( `Please press the '${key}' key (or press ENTER to skip): ` ) ;
		let val = await getInput() ;
		if ( ! Buffer.compare( val , enter ) ) {
			keyMap.delete( key ) ;
			console.log( "<< skipped >>" ) ;
			continue ;
		}
		console.log( val ) ;
		keyMap.set( key , bufToEscStr ( val ) ) ;
		if( sameKey( key ) ) keyMap.delete( key ) ;
	}

	// we were using ENTER to skip before, but now we need to delete if if we don't need it
	if( sameKey( "ENTER" ) ) keyMap.delete( "ENTER" ) ;

	// print JavaScript keymap object for termconfig file
	console.log( "" ) ;
	console.log( "const keymap = {" ) ;
	for ( let key of [ ... keyMap.keys() ] ) {
		console.log( `	${key}: '${keyMap.get( key )}' ,` ) ;
	}
	console.log( "} ) ;" ) ;

	process.exit( 0 ) ;
}() ) ;


