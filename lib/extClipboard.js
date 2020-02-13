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



const Promise = require( 'seventh' ) ;
const string = require( 'string-kit' ) ;

require( './patches.js' ) ;
const execAsync = require( 'child_process' ).execAsync ;
const execFileAsync = require( 'child_process' ).execFileAsync ;
const spawn = require( 'child_process' ).spawn ;



const XCLIP_SELECTION_ARG = {
	c: 'clipboard' ,
	p: 'primary' ,
	s: 'secondary'
} ;



if ( process.platform === 'linux' ) {
	exports.getClipboard = async ( source ) => {
		var arg = XCLIP_SELECTION_ARG[ source[ 0 ] ] || 'clipboard' ;
		return await execFileAsync( 'xclip' , [ '-o' , '-selection' , arg ] ) ;
	} ;

	exports.setClipboard = async ( str , source ) => {
		var promise = new Promise() ;
		var arg = XCLIP_SELECTION_ARG[ source[ 0 ] ] || 'clipboard' ;
		var xclip = spawn( 'xclip' , [ '-i' , '-selection' , arg ] ) ;

		xclip.on( 'error' , error => {
			//console.error( 'xclip error:' , error ) ;
			promise.reject( error ) ;
		} ) ;

		xclip.on( 'exit' , code => {
			//console.log( 'xclip exited with code:' , code ) ;
			if ( code !== 0 ) { promise.reject( code ) ; }
			else { promise.resolve() ; }
		} ) ;

		// Send the string to push to the clipboard
		xclip.stdin.end( str ) ;

		return promise ;
	} ;
}
else {
	exports.getClipboard = () => Promise.reject( new Error( 'No clipboard manipulation program found' ) ) ;
	exports.setClipboard = () => Promise.reject( new Error( 'No clipboard manipulation program found' ) ) ;
}

