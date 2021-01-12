#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

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



const termkit = require( '..' ) ;
const term = termkit.terminal ;


var progress ;
var progressBar1 , progressBar2 ;

var bullshit1 = [
	'Serious stuff in progress:' ,
	'Big Data mining:' ,
	'Decrunching data:' ,
	'Building scalable business:' ,
] ;

var bullshit2 = [
	'Downloading metadata:' ,
	'Compiling code:' ,
	'Removing dead code:' ,
	'Optimizing VM:' ,
] ;

function doProgress() {
	var data = {} , bar , bs ;
	
	if ( Math.random() < 0.5 ) {
		bar = progressBar1 ;
		bs = bullshit1 ;
	}
	else {
		bar = progressBar2 ;
		bs = bullshit2 ;
	}
	
	if ( Math.random() < 0.3 ) {
		data.title = bs[ Math.floor( Math.random() * bs.length ) ] ;
	}
	
	if ( progress === undefined ) {
		if ( Math.random() < 0.1 ) {
			progress = 0 ;
		}
		
		data.progress = progress ;
		bar.update( data ) ;
		setTimeout( doProgress , 100 + Math.random() * 300 ) ;
	}
	else {
		progress += Math.random() / 10 ;
		data.progress = progress ;
		bar.update( data ) ;
		
		if ( progress >= 1 ) {
			setTimeout(
				() => { term( '\n' ) ; process.exit() ; } ,
				2000
			) ;
		}
		else {
			setTimeout( doProgress , 2000 + Math.random() * 500 ) ;
		}
	}
}

progressBar1 = term.progressBar( {
	width: 70 ,
	percent: true ,
	eta: true ,
	title: bullshit1[ Math.floor( Math.random() * bullshit1.length ) ] ,
	titleSize: 29 ,
	y: 10
} ) ;

progressBar2 = term.progressBar( {
	width: 70 ,
	percent: true ,
	eta: true ,
	title: bullshit2[ Math.floor( Math.random() * bullshit2.length ) ] ,
	titleSize: 29 ,
	y: 11
} ) ;

doProgress() ;

