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



/* jshint unused:false */
/* global describe, it, before, after */



var expect = require( 'expect.js' ) ;

var termkit = require( '../lib/termkit.js' ) ;
var term = termkit.terminal ;
var ScreenBuffer = termkit.ScreenBuffer ;
var Rect = termkit.Rect ;



describe( "ScreenBuffer.Rect" , function() {
	
	it( "Rect.create( Terminal )" , function() {
		
		expect( Rect.create( term ) ).to.eql( {
			xmin: 1 ,
			ymin: 1 ,
			xmax: term.width ,
			ymax: term.height ,
			width: term.width ,
			height: term.height ,
			isNull: false
		} ) ;
		
	} ) ;
	
	it( "Rect.create( xmin , ymin , xmax , ymax )" , function() {
		
		expect( Rect.create( 1 , 2 , 3 , 4 ) ).to.eql( {
			xmin: 1 ,
			ymin: 2 ,
			xmax: 3 ,
			ymax: 4 ,
			width: 3 ,
			height: 3 ,
			isNull: false
		} ) ;
		
	} ) ;
	
	it( ".clip() should adjust accordingly" , function() {
		
		var srcRect , dstRect ;
		
		dstRect = Rect.create( { xmin: 0 , ymin: 20 , xmax: 25 , ymax: 45 , isNull: false } ) ;
		srcRect = Rect.create( { xmin: 10 , ymin: 10 , xmax: 30 , ymax: 40 , isNull: false } ) ;
		srcRect.clip( dstRect , 0 , 0 , true ) ;
		
		expect( dstRect ).to.eql( { xmin: 10, ymin: 20, xmax: 25, ymax: 40 , width: 16 , height: 21 , isNull: false } ) ;
		expect( srcRect ).to.eql( { xmin: 10, ymin: 20, xmax: 25, ymax: 40 , width: 16 , height: 21 , isNull: false } ) ;
		
		
		dstRect = Rect.create( { xmin: 0 , ymin: 20 , xmax: 25 , ymax: 45 } ) ;
		srcRect = Rect.create( { xmin: 10 , ymin: 10 , xmax: 30 , ymax: 40 } ) ;
		srcRect.clip( dstRect , 5 , 0 , true ) ;
		
		expect( dstRect ).to.eql( { xmin: 15, ymin: 20, xmax: 25, ymax: 40 , width: 11 , height: 21 , isNull: false } ) ;
		expect( srcRect ).to.eql( { xmin: 10, ymin: 20, xmax: 20, ymax: 40 , width: 11 , height: 21 , isNull: false } ) ;
		
		
		dstRect = Rect.create( { xmin: 0 , ymin: 20 , xmax: 25 , ymax: 45 } ) ;
		srcRect = Rect.create( { xmin: 10 , ymin: 10 , xmax: 30 , ymax: 40 } ) ;
		srcRect.clip( dstRect , -8 , 0 , true ) ;
		
		expect( dstRect ).to.eql( { xmin: 2, ymin: 20, xmax: 22, ymax: 40 , width: 21 , height: 21 , isNull: false } ) ;
		expect( srcRect ).to.eql( { xmin: 10, ymin: 20, xmax: 30, ymax: 40 , width: 21 , height: 21 , isNull: false } ) ;
		
		
		dstRect = Rect.create( { xmin: 0 , ymin: 20 , xmax: 25 , ymax: 45 } ) ;
		srcRect = Rect.create( { xmin: 10 , ymin: 10 , xmax: 30 , ymax: 40 } ) ;
		srcRect.clip( dstRect , -31 , 0 , true ) ;
		
		expect( dstRect.isNull ).to.be( true ) ;
		expect( srcRect.isNull ).to.be( true ) ;
		
		
		dstRect = Rect.create( { xmin: 0 , ymin: 20 , xmax: 25 , ymax: 45 } ) ;
		srcRect = Rect.create( { xmin: 10 , ymin: 10 , xmax: 30 , ymax: 40 } ) ;
		srcRect.clip( dstRect , -8 , 5 , true ) ;
		
		expect( dstRect ).to.eql( { xmin: 2, ymin: 20, xmax: 22, ymax: 45 , width: 21 , height: 26 , isNull: false } ) ;
		expect( srcRect ).to.eql( { xmin: 10, ymin: 15, xmax: 30, ymax: 40 , width: 21 , height: 26 , isNull: false } ) ;
		
		
		dstRect = Rect.create( { xmin: 0 , ymin: 20 , xmax: 25 , ymax: 45 } ) ;
		srcRect = Rect.create( { xmin: 10 , ymin: 10 , xmax: 30 , ymax: 40 } ) ;
		srcRect.clip( dstRect , 0 , -21 , true ) ;
		
		expect( dstRect.isNull ).to.be( true ) ;
		expect( srcRect.isNull ).to.be( true ) ;
	} ) ;
} ) ;



