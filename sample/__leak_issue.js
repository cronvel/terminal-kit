#!/usr/bin/env node
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

