/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2015 Cédric Ronvel 
	
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





var fs = require( 'fs' ) ;



module.exports = function fileInput( options , callback )
{
	if ( arguments.length <= 0 ) { throw new Error( '[terminal] .fileInput(): should at least provide one callback as argument' ) ; }
	if ( arguments.length === 1 ) { callback = options ; options = undefined ; }
	
	var self = this , directory ;
	
	directory = options.directory || process.getcwd() ;
	
	var autoCompleter = function autoCompleter( inputString , callback )
	{  
		fs.readdir( directory , function( error , files ) {
			callback( undefined , termkit.autoComplete( files , inputString , true ) ) ;
		} ) ;
	} ;
	
	this.inputField(
		{ autoComplete: autoCompleter , autoCompleteMenu: true } ,
		function( error , input ) {
			if ( error ) { callback( error ) ; return ; }
			
			callback( undefined , input ) ;
		}
	) ;
} ;


