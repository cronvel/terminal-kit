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

/*
	This code is derivated from https://github.com/qix-/terminfo
	By Qix-
	Licensed under the MIT license.
*/

"use strict" ;



const fs = require( 'fs' ) ;
const tree = require( 'tree-kit' ) ;

const boolOptions = require( './boolean-opts.json' ) ;
const numberOptions = require( './number-opts.json' ) ;
const stringOptions = require( './string-opts.json' ) ;



exports.getTerminfo = termName => {
	if ( ( ! termName && process.platform === 'win32' ) || termName === 'win32' ) {
		return require( './windows-profile.json' ) ;
	}

	var infoBuffer = getTerminfoBuffer( termName ) ;
	return parseTermBuffer( infoBuffer , termName ) ;
} ;



// Merge a config with terminfo
exports.mergeWithTerminfo = ( config , info ) => {
	var newConfig = {
		esc: Object.create( config.esc ) ,
		keymap: Object.create( config.keymap ) ,
		handler: Object.create( config.handler ) ,
		support: {
			deltaEscapeSequence: true ,
			"256colors": true ,
			"24bitsColors": true ,	// DEPRECATED
			"trueColor": true
		} ,
		colorRegister: config.colorRegister
	} ;

	if ( info.keyUp ) {
		newConfig.keymap.UP = info.keyUp ;
	}

	return newConfig ;
} ;



function getTerminfoBuffer( termName ) {
	var path ;

	try {
		path = '/usr/share/terminfo/' + termName.charCodeAt( 0 ).toString( 16 )
			.toUpperCase() + '/' + termName ;
		return { path: path , buf: fs.readFileSync( path ) } ;
	}
	catch ( error ) {
		try {
			path = '/usr/share/terminfo/' + termName[ 0 ] + '/' + termName ;
			return { path: path , buf: fs.readFileSync( path ) } ;
		}
		catch ( error_ ) {
			throw new Error( 'unknown TERM name: ' + termName ) ;
		}
	}
}



function parseTermBuffer( bufPair , termName ) {
	var i , j , getInt , intSize ,
		buf = bufPair.buf ,
		offset = 0 ;

	// magic number
	var magic = buf.readInt16LE( offset ) ;
	offset += 2 ;

	console.log( "Magic number: 0x" + magic.toString( 16 ) ) ;

	if ( magic === 0x11a ) {
		// Legacy format
		console.log( "Legacy format" ) ;
		intSize = 2 ;
		getInt = buf.readInt16LE.bind( buf ) ;
	}
	else if ( magic === 0x21e ) {
		// New format using 32bit integers
		console.log( "New 32bit integer format" ) ;
		intSize = 4 ;
		getInt = buf.readInt32LE.bind( buf ) ;
	}
	else {
		throw new Error( 'terminfo for ' + termName + ' has invalid magic number: 0x' + magic.toString( 16 ) ) ;
	}

	var result = {
		path: bufPair.path ,
		namesSize: buf.readInt16LE( offset ) ,
		boolSize: buf.readInt16LE( offset + 2 ) ,
		numCount: buf.readInt16LE( offset + 4 ) ,
		offCount: buf.readInt16LE( offset + 6 ) ,
		strSize: buf.readInt16LE( offset + 8 )
	} ;

	offset += 10 ;

	// names (usually a descriptive name along with the $TERM name)
	result.names = buf.toString( 'ascii' , offset , offset + result.namesSize - 1 ).split( '|' ) ;
	offset += result.namesSize ;

	// bools
	/*
	if ( result.boolSize < boolOptions.length ) {
		throw new Error( 'terminfo for ' + termName + ' has invalid boolean section size (' + result.boolSize + ' < ' + boolOptions.length + ')' ) ;
	}
	*/

	boolOptions.forEach( ( opt , j ) => {
		result[ opt ] = Boolean( buf.readInt8( offset + j ) ) ;
	} ) ;

	offset += result.boolSize ;

	// shorts are aligned to short boundary in file
	// /!\ Should it be aligned for 32bit on the new format???
	offset += offset % 2 ;

	// numbers
	for ( i = 0 ; i < result.numCount && i < numberOptions.length ; i ++ ) {
		var num = getInt( offset + ( i * intSize ) ) ;
		if ( num !== -1 ) {
			result[numberOptions[i]] = num ;
		}
	}

	offset += intSize * result.numCount ;

	// strings
	var offsetTable = offset + ( result.offCount * 2 ) ;

	for ( i = 0 ; i < result.offCount && i < stringOptions.length ; i ++ ) {
		var off = buf.readInt16LE( offset + ( 2 * i ) ) ;
		if ( off !== -1 ) {
			result[stringOptions[i]] = toCString( buf , offsetTable + off ) ;
		}
	}

	return result ;
}



function toCString( buf , offset ) {
	var end = offset ;
	while ( buf[end ++] !== 0 ) { /* :) */ }
	return buf.toString( 'ascii' , offset , end - 1 ) ;
}

