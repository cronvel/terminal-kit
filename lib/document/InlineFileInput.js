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



const Element = require( './Element.js' ) ;
const InlineInput = require( './InlineInput.js' ) ;
const fileHelpers = require( '../fileHelpers.js' ) ;

const fs = require( 'fs' ) ;
const path = require( 'path' ) ;



/*
	An InlineInput that auto-complete filepath.
*/

function InlineFileInput( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	this.baseDir = options.baseDir ?? null ;
	this.resolvedBaseDir = null ;
	this.autoCompleteFileOptions = null ;

	this.accept =
		options.accept && typeof options.accept === 'object' ? options.accept :
		{ unexistant: true , file: true , directory: true } ;

	InlineInput.call( this , options ) ;

	this.autoComplete = this.fileAutoComplete.bind( this ) ;
	this.useAutoCompleteHint = options.useAutoCompleteHint ?? true ;
	this.useAutoCompleteMenu = options.useAutoCompleteMenu ?? true ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'InlineFileInput' && ! options.noDraw ) { this.draw() ; }

	this.initPromise = this.init() ;
}

module.exports = InlineFileInput ;
Element.inherit( InlineFileInput , InlineInput ) ;



InlineFileInput.prototype.init = async function() {
	if ( this.initPromise ) { return this.initPromise ; }

	this.resolvedBaseDir = await fileHelpers.resolveBaseDir( this.baseDir ) ;

	// Force directory, because we need them to navigate to files
	var accept = Object.assign( {} , this.accept ) ;
	accept.directory = true ;

	this.autoCompleteFileOptions = {
		accept ,
		baseDir: this.resolvedBaseDir
	} ;
} ;



InlineFileInput.prototype.fileAutoComplete = async function( inputString ) {
	await this.initPromise ;
	return fileHelpers.autoCompleteFile( inputString , this.autoCompleteFileOptions ) ;
} ;



InlineFileInput.prototype.submit = async function() {
	var filePath , stats ;

	if ( this.disabled || this.submitted || this.canceled ) { return ; }
	//this.submitted = true ;

	filePath = this.getValue() ;

	if ( ! filePath || typeof filePath !== 'string' ) {
		if ( ! this.noEmpty ) { this.emit( 'submit' , null , undefined , this ) ; }
		return ;
	}

	await this.initPromise ;

	filePath = path.resolve( path.isAbsolute( filePath ) ? filePath : this.resolvedBaseDir + filePath ) ;

	try {
		stats = await fs.promises.stat( filePath ) ;
	}
	catch ( error ) {
		if ( error.code === 'ENOENT' && this.accept.unexistant ) {
			this.emit( 'submit' , filePath , undefined , this ) ;
			return ;
		}

		if ( ! this.noEmpty ) { this.emit( 'submit' , null , undefined , this ) ; }
		return ;
	}

	if ( ! fileHelpers.statsFilter( stats , this.accept ) ) {
		if ( ! this.noEmpty ) { this.emit( 'submit' , null , undefined , this ) ; }
		return ;
	}

	this.emit( 'submit' , filePath , undefined , this ) ;
} ;

