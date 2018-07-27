#!/usr/bin/env node
/*
	Terminal Kit
	
	Copyright (c) 2009 - 2018 Cédric Ronvel
	
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



/* jshint unused:false */



//console.error( "\n\n\n\n\n\n\n\n" ) ;
var termkit = require( '../../lib/termkit.js' ) ;
var term = termkit.terminal ;



term.clear() ;

var document = term.createDocument( {
//	backgroundAttr: { bgColor: 'magenta' , dim: true } ,
} ) ;

var A = new termkit.Button( {
	parent: document ,
	content: '<A>' ,
	value: 'A' ,
	x: 0 ,
	y: 0 ,
} ) ;

new termkit.Button( {
	parent: A ,
	content: '<1>' ,
	value: '1' ,
	x: 10 ,
	y: 0 ,
} ) ;

new termkit.Button( {
	parent: A ,
	content: '<2>' ,
	value: '2' ,
	x: 10 ,
	y: 2 ,
} ) ;

new termkit.Button( {
	parent: A ,
	content: '<3>' ,
	value: '3' ,
	x: 10 ,
	y: 4 ,
} ) ;

var B = new termkit.Button( {
	parent: document ,
	content: '<B>' ,
	value: 'B' ,
	x: 0 ,
	y: 6 ,
} ) ;

var sub = new termkit.Button( {
	parent: B ,
	content: '<1>' ,
	value: '1' ,
	x: 10 ,
	y: 6 ,
} ) ;

	new termkit.Button( {
		parent: sub ,
		content: '<...>' ,
		value: '...' ,
		x: 20 ,
		y: 6 ,
	} ) ;
	
	new termkit.Button( {
		parent: sub ,
		content: '<...>' ,
		value: '...' ,
		x: 30 ,
		y: 6 ,
	} ) ;
	
	new termkit.Button( {
		parent: sub ,
		content: '<...>' ,
		value: '...' ,
		x: 40 ,
		y: 6 ,
	} ) ;

new termkit.Button( {
	parent: B ,
	content: '<2>' ,
	value: '2' ,
	x: 10 ,
	y: 8 ,
} ) ;

var sub2 = new termkit.Button( {
	parent: B ,
	content: '<3>' ,
	value: '3' ,
	x: 10 ,
	y: 10 ,
} ) ;

	new termkit.Button( {
		parent: sub2 ,
		content: '<...>' ,
		value: '...' ,
		x: 20 ,
		y: 10 ,
	} ) ;
	
	new termkit.Button( {
		parent: sub2 ,
		content: '<...>' ,
		value: '...' ,
		x: 30 ,
		y: 10 ,
	} ) ;
	
	new termkit.Button( {
		parent: sub2 ,
		content: '<...>' ,
		value: '...' ,
		x: 40 ,
		y: 10 ,
	} ) ;

var C = new termkit.Button( {
	parent: document ,
	content: '<A>' ,
	value: 'A' ,
	x: 0 ,
	y: 12 ,
} ) ;

new termkit.Button( {
	parent: C ,
	content: '<1>' ,
	value: '1' ,
	x: 10 ,
	y: 12 ,
} ) ;

new termkit.Button( {
	parent: C ,
	content: '<2>' ,
	value: '2' ,
	x: 10 ,
	y: 14 ,
} ) ;

var sub3 = new termkit.Button( {
	parent: C ,
	content: '<3>' ,
	value: '3' ,
	x: 10 ,
	y: 16 ,
} ) ;

	new termkit.Button( {
		parent: sub3 ,
		content: '<...>' ,
		value: '...' ,
		x: 20 ,
		y: 16 ,
	} ) ;
	
	new termkit.Button( {
		parent: sub3 ,
		content: '<...>' ,
		value: '...' ,
		x: 30 ,
		y: 16 ,
	} ) ;
	
	new termkit.Button( {
		parent: sub3 ,
		content: '<...>' ,
		value: '...' ,
		x: 40 ,
		y: 16 ,
	} ) ;


term.on( 'key' , function( key ) {
	switch( key )
	{
		case 'CTRL_C' :
			term.grabInput( false ) ;
			term.hideCursor( false ) ;
			term.styleReset() ;
			term.clear() ;
			process.exit() ;
			break ;
	}
} ) ;



