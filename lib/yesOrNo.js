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



var Promise = require( 'seventh' ) ;



/*
	yesOrNo( [yes] , [no] , callback )
		* options `Object`
			* yes `string` or `Array` contains a key code or an array of key code that will trigger the yes
			* no `string` or `Array` contains a key code or an array of key code that will trigger the no
			* echoYes `string` if defined this will be what will be outputed in case of yes
			* echoNo `string` if defined this will be what will be outputed in case of no
		* callback( error , result )
			* result: true for 'yes' or false for 'no'
*/
module.exports = function yesOrNo( options , callback ) {
	if ( typeof options === 'function' ) { callback = options ; options = undefined ; }

	if ( ! options || typeof options !== 'object' ) {
		options = {
			yes: [ 'y' , 'Y' ] ,
			no: [ 'n' , 'N' ] ,
			echoYes: 'yes' ,
			echoNo: 'no'
		} ;
	}

	if ( typeof options.yes === 'string' ) { options.yes = [ options.yes ] ; }
	if ( ! Array.isArray( options.yes ) ) { options.yes = [ 'y' , 'Y' ] ; }

	if ( typeof options.no === 'string' ) { options.no = [ options.no ] ; }
	if ( ! Array.isArray( options.no ) ) { options.no = [ 'n' , 'N' ] ; }

	if ( ! this.grabbing ) { this.grabInput() ; }

	var onKey = key => {
		if ( options.yes.indexOf( key ) !== -1 ) {
			if ( options.echoYes ) { this( options.echoYes ) ; }
			this.removeListener( 'key' , onKey ) ;

			if ( callback ) { callback( undefined , true ) ; }
			else { controller.promise.resolve( true ) ; }
		}
		else if ( options.no.indexOf( key ) !== -1 ) {
			if ( options.echoNo ) { this( options.echoNo ) ; }
			this.removeListener( 'key' , onKey ) ;

			if ( callback ) { callback( undefined , false ) ; }
			else { controller.promise.resolve( false ) ; }
		}
	} ;

	this.on( 'key' , onKey ) ;

	var controller = {} ; //Object.create( NextGenEvents.prototype ) ;

	// Stop everything and do not even call the callback
	controller.abort = () => {
		this.removeListener( 'key' , onKey ) ;
	} ;

	controller.promise = new Promise() ;

	return controller ;
} ;

