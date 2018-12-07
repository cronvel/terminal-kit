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



var fs = require( 'fs' ) ;
var term = require( '..' ).terminal ;


var timeFactor = 10 ;
var progress ;
var progressBar ;
var queuedFiles = [] , inProgressFiles = [] ;



function doProgress() {
	var file ;

	if ( progress === undefined ) {
		if ( Math.random() < 0.1 ) {
			progress = 0 ;
		}

		progressBar.update( progress ) ;
		setTimeout( doProgress , 2 * timeFactor + Math.random() * 6 * timeFactor ) ;
	}
	else {
		if ( queuedFiles.length && ( ! inProgressFiles.length || Math.random() < 0.5 ) ) {
			//console.log( '\nstartItem\n' ) ;
			file = queuedFiles.shift() ;
			progressBar.startItem( file ) ;
			inProgressFiles.push( file ) ;
		}
		else {
			//console.log( '\nitemDone\n' ) ;
			progressBar.itemDone( inProgressFiles.shift() ) ;

			if ( ! inProgressFiles.length && queuedFiles.length ) {
				//console.log( '\nstartItem\n' ) ;
				file = queuedFiles.shift() ;
				progressBar.startItem( file ) ;
				inProgressFiles.push( file ) ;
			}
		}

		if ( queuedFiles.length + inProgressFiles.length === 0 ) {
			setTimeout(
				() => { term( '\n' ) ; process.exit() ; } ,
				20 * timeFactor
			) ;
		}
		else {
			setTimeout( doProgress , 20 * timeFactor + Math.random() * 20 * timeFactor ) ;
		}
	}
}

//term.bold( 'Analysing files: ' ) ;

progressBar = term.progressBar( {
	width: 80 ,
	percent: true ,
	eta: true ,
	title: 'Analysing files:'
	//inline: true ,
	/*
	barStyle: term.brightGreen.bold ,
	barBracketStyle: term.brightWhite ,
	percentStyle: term.brightMagenta.inverse ,
	barChar: '~' ,
	barHeadChar: '*' ,

	//barChar: ' ' ,
	//barHeadChar: ' ' ,
	//barStyle: term.bgCyan
	//*/
} ) ;

//setTimeout( () => progressBar.reset() , 5000 ) ;

term.column( 1 ) ;

fs.readdir( __dirname , ( error , files ) => {
	if ( error ) { process.exit( 1 ) ; }
	queuedFiles = files ;
	progressBar.update( { items: files.length } ) ;
	doProgress() ;
} ) ;

