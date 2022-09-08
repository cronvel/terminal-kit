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

"use strict" ;



const autoComplete = require( './autoComplete.js' ) ;

const fs = require( 'fs' ) ;
const path = require( 'path' ) ;

//const string = require( 'string-kit' ) ;
const Promise = require( 'seventh' ) ;



// Like fs.readdir(), but performs fs.stat() for each file in order to add a '/' to directories
exports.readdir = async ( dir , accept = null ) => {
	if ( dir[ dir.length - 1 ] !== '/' ) { dir += '/' ; }

	var files = await fs.promises.readdir( dir ) ;

	var fixedFiles = await Promise.map( files , async ( file ) => {
		var stats = await fs.promises.lstat( dir + file ) ;
		if ( accept && ! exports.statsFilter( stats , accept ) ) { return null ; }
		if ( stats.isDirectory() ) { file += '/' ; }
		return file ;
	} ) ;

	fixedFiles = fixedFiles.filter( file => file !== null ) ;

	return fixedFiles ;
} ;



exports.statsFilter = ( stats , accept ) => {
	if (
		( stats.isFile() && ! accept.file )
        || ( stats.isDirectory() && ! accept.directory )
	) {
		return false ;
	}

	return true ;
} ;



// Resolve base directory, returning a full path with a trailing slash
exports.resolveBaseDir = async ( baseDir ) => {
	if ( ! baseDir ) {
		baseDir = process.cwd() ;
	}
	else {
		baseDir = path.resolve( baseDir ) ;

		if ( ! path.isAbsolute( baseDir ) ) {
			baseDir = await fs.promises.realpath( baseDir ) ;
		}
	}

	if ( baseDir[ baseDir.length - 1 ] !== '/' ) {
		baseDir += '/' ;
	}

	return baseDir ;
} ;



/*
	params:
		* baseDir (mandatory) the base-directory, from where to start searching for files
		* accept `object` (optional)
			* file: accept files
			* directory: accept directory
*/
exports.autoCompleteFile = async ( inputString , params ) => {
	var inputDir , inputFile , currentDir , files , completion ,
		baseDir = params.baseDir ;

	// First, we have to manage input, splitting user inputDir/inputFile and setting the actual directory
	if ( inputString[ inputString.length - 1 ] === '/' ) {
		currentDir = inputDir = inputString ;
		inputFile = '' ;
	}
	else if ( inputString === '.' ) {
		inputDir = '' ;
		currentDir = '' ;
		inputFile = '.' ;
	}
	else {
		inputDir = path.dirname( inputString ) ;

		if ( inputDir === '.' ) {
			if ( inputString.startsWith( './' ) ) {
				inputDir = './' ;
				currentDir = '' ;
			}
			else {
				inputDir = currentDir = '' ;
			}
		}
		else {
			currentDir = inputDir = inputDir + '/' ;
		}

		inputFile = path.basename( inputString ) ;
	}

	// If the input doesn't start with a '/', prepend the baseDir
	if ( ! path.isAbsolute( currentDir ) ) { currentDir = baseDir + currentDir ; }

	try {
		files = await exports.readdir( currentDir , params.accept ) ;
	}
	catch ( error ) {
		return inputString ;
	}

	if ( ! Array.isArray( files ) || ! files.length ) { return inputString ; }

	completion = autoComplete( files , inputFile , true , inputDir ) ;
	//console.error( 'fileHelpers.js completion:' , completion , inputDir ) ;

	return completion ;
} ;

