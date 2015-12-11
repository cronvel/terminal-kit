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



// Load modules
var events = require( 'events' ) ;



function Form() { throw new Error( 'Use Form.create() instead' ) ; }
//module.exports = Form ;
Form.prototype = Object.create( events.prototype ) ;
Form.prototype.constructor = Form ;



Form.create = function createForm( def , options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var form = Object.create( Form.prototype , {
		term: { value: this } ,
		inputs: { value: def.inputs , enumerable: true } ,
	} ) ;
	
	//Object.defineProperties( form , { onResize: { value: onResize.bind( form ) } } ) ;
	
	return form ;
} ;

module.exports = Form.create ;



Form.prototype.run = function run()
{
	var i , iMax , labelMaxLength = 0 ;
	
	iMax = this.inputs.length ;
	
	for ( i = 0 ; i < iMax ; i ++ )
	{
		if ( this.inputs[ i ].label.length > labelMaxLength ) { labelMaxLength = this.inputs[ i ].label.length ; }
	}
	console.error( "labelMaxLength:" , labelMaxLength ) ; 
	
	for ( i = 0 ; i < iMax ; i ++ )
	{
		term.moveTo( 1 , i + 1 , this.inputs[ i ].label ).column( labelMaxLength + 2 , ': ' ) ;
	}
	
	term( '\n' ) ;
} ;



