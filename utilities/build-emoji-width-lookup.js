#!/usr/bin/env node

"use strict" ;

/*
	Create lookup files for emoji width, by writing each emoji and check the cursor location.
*/



const fs = require( 'fs' ) ;

const termkit = require( '..' ) ;
const term = termkit.terminal ;



async function checkOne( lookup , codePoint ) {
	var char = String.fromCodePoint( codePoint ) ;
	term( '\n' + char ) ;
	var pos = await term.getCursorLocation() ;
	term( '\t    ' ) ;
	var width = pos.x - 1 ;
	term( 'width: %i' , width ) ;
	lookup.map.set( codePoint , width ) ;
	return width ;
}



async function checkRange( lookup , codePointStart , codePointEnd ) {
	var width , lastWidth , entry ;

	for ( let codePoint = codePointStart ; codePoint <= codePointEnd ; codePoint ++ ) {
		width = await checkOne( lookup , codePoint ) ;

		if ( width === lastWidth && entry ) {
			entry.e = codePoint ;
		}
		else {
			entry = {
				s: codePoint ,
				e: codePoint ,
				w: width
			} ;

			lookup.ranges.push( entry ) ;
		}

		lastWidth = width ;
	}
}



async function writeLookupMap( lookup ) {
	var filePath = './emoji-width.map.json' ;
	await fs.promises.writeFile( filePath , JSON.stringify( [ ... lookup.map ] ) + '\n' ) ;
	term( 'Wrote %s\n' , filePath ) ;
}



async function writeLookupRanges( lookup ) {
	var filePath = './emoji-width.ranges.json' ;
	
	await fs.promises.writeFile( filePath , JSON.stringify( lookup.ranges ) + '\n' ) ;
	term( 'Wrote %s\n' , filePath ) ;
}



async function run() {
	var lookup = {
		map: new Map() ,
		ranges: []
	}

	await checkRange( lookup , 0x2600 , 0x26ff ) ;
	await checkRange( lookup , 0x2700 , 0x27bf ) ;
	
	//*
	await checkRange( lookup , 0x1f000 , 0x1f1ff ) ;
	await checkRange( lookup , 0x1f300 , 0x1f3fa ) ;
	await checkRange( lookup , 0x1f400 , 0x1faff ) ;
	//*/
	
	//console.log( '\n\nlookup: ' , lookup ) ;
	
	term( '\n\n' ) ;
	await writeLookupMap( lookup ) ;
	await writeLookupRanges( lookup ) ;
	term( '\n\n' ) ;
}



run() ;

