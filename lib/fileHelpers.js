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



const fs = require( 'fs' ) ;

const string = require( 'string-kit' ) ;
const Promise = require( 'seventh' ) ;



// Like fs.readdir(), but performs fs.stat() for each file in order to add a '/' to directories
exports.readdir = async ( dir ) => {
	if ( dir[ dir.length - 1 ] !== '/' ) { dir += '/' ; }

	var files = await fs.promises.readdir( dir ) ;

	var fixedFiles = await Promise.map( files , async ( file ) => {
		var stats = await fs.promises.lstat( dir + file ) ;
		if ( stats.isDirectory() ) { file += '/' ; }
		return file ;
	} ) ;

	return fixedFiles ;
} ;

