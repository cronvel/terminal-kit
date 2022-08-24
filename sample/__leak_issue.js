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
const term = require('..').terminal;
const Promise = require( 'seventh' ) ;

const rows = 3, cols = 100;
const labels = (new Array(cols)).fill(0).map((x, i) => i);
const data = [labels].concat((new Array(rows).fill(0)).map(x => (new Array(cols).fill(1))));

term.clear();

async function flood() {
	var i , round ;
	for ( round = 0 ;; round ++ ) {

		for ( i = 0 ; i < 500 ; i ++ ) {
			if ( i % 20 === 0 ) {
				term.moveTo( 1 , 1 )( "Starting round #%i    iteration: #%i   mem: %k    \n" , round , i , process.memoryUsage().heapUsed ) ;
			}

			term.moveTo( 1 , 2 ) ;
			term.table( data , {} ) ;
		}

		//term.moveTo( 1 , 1 )( "PAUSE                                                    \n" ) ;
		await Promise.resolveTimeout( 200 ) ;
	}
}

flood() ;

