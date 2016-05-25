/*
	Terminal Kit
	
	Copyright (c) 2009 - 2016 Cédric Ronvel
	
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



// Load modules
var autoComplete = require( './autoComplete.js' ) ;
var async = require( 'async-kit' ) ;
var tree = require( 'tree-kit' ) ;
var fs = require( 'fs' ) ;
var path = require( 'path' ) ;



/*
	/!\ Document that!!! /!\
*/
module.exports = function fileInput( options , callback )
{
	if ( arguments.length <= 0 ) { throw new Error( '[terminal] .fileInput(): should at least provide one callback as argument' ) ; }
	if ( arguments.length === 1 ) { callback = options ; options = {} ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var self = this , baseDir ;
	
	if ( options.baseDir )
	{
		baseDir = path.resolve( options.baseDir ) ;
		
		if ( ! path.isAbsolute( baseDir ) )
		{
			fs.realpath( options.baseDir , function( error , resolvedPath ) {
				if ( error ) { callback( error ) ; return ; }
				options.baseDir = resolvedPath ;
				fileInput.call( self , options , callback ) ;
			} ) ;
			
			return ;
		}
	}
	else
	{
		baseDir = process.cwd() ;
	}
	
	if ( baseDir[ baseDir.length - 1 ] !== '/' ) { baseDir += '/' ; }
	
	var autoCompleter = function autoCompleter( inputString , callback )
	{  
		var inputDir , inputFile , currentDir ;
		
		if ( inputString[ inputString.length - 1 ] === '/' )
		{
			inputDir = inputString ;
			inputFile = '' ;
		}
		else
		{
			inputDir = path.dirname( inputString ) ;
			inputDir = inputDir === '.' ? '' : inputDir + '/' ;
			inputFile = path.basename( inputString ) ;
		}
		
		
		// If the input start with a '/', then forget about the baseDir
		if ( path.isAbsolute( inputString ) ) { currentDir = inputDir ; }
		else { currentDir = baseDir + inputDir ; }
		
		
		//console.error( "### '" + inputDir +"' '"+ inputFile +"' '"+ currentDir + "'" ) ;
		
		readdir( currentDir , function( error , files ) {
			if ( error || ! Array.isArray( files ) || ! files.length ) { callback( undefined , inputString ) ; return ; }
			
			var completion = autoComplete( files , inputFile , true ) ;
			
			// force inputField() to prefix that *AFTER* singleLineMenu()
			if ( Array.isArray( completion ) ) { completion.prefix = inputDir ;	}
			else { completion = path.normalize( inputDir + completion ) ; }
			
			callback( undefined , completion ) ;
		} ) ;
	} ;
	
	// Transmit options to inputField()
	tree.extend( null , options , { autoComplete: autoCompleter , autoCompleteMenu: true , minLength: 1 } ) ;
	
	this.inputField(
		options ,
		function( error , input ) {
			if ( error ) { callback( error ) ; return ; }
			else if ( ! input && typeof input !== 'string' ) { callback() ; return ; }
			
			callback( undefined ,
				path.resolve( path.isAbsolute( input ) ? input : baseDir + input )
			) ;
		}
	) ;
} ;



// Like fs.readdir(), but performs fs.stat() for each file in order to add a '/' to directories
function readdir( dir , callback )
{
	if ( dir[ dir.length - 1 ] !== '/' ) { dir += '/' ; }
	
	fs.readdir( dir , function( error , files ) {
		
		if ( error ) { callback( error ) ; return ; }
		
		async.map( files , function( file , foreachCallback ) {
			
			fs.lstat( dir + file , function( error , stats ) {
				
				if ( error ) { foreachCallback( error , file ) ; return ; }
				if ( stats.isDirectory() ) { file += '/' ; }
				foreachCallback( undefined , file ) ;
			} ) ;
		} )
		.exec( function( error , fixedFiles ) {
			if ( error ) { callback( error ) ; return ; }
			callback( undefined , fixedFiles ) ;
		} ) ;
		
	} ) ;
}


