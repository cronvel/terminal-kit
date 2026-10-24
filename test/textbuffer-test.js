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



var termkit = require( '..' ) ;
var term = termkit.terminal ;
var TextBuffer = termkit.TextBuffer ;



describe( "TextBuffer" , () => {
	
	it( "TextBuffer should preserve newline" , () => {
		var textBuffer = new TextBuffer() ;
		expect( textBuffer.getText( textBuffer.setText( 'one\ntwo\nthree' ) ) ).to.be( 'one\ntwo\nthree' ) ;
	} ) ;
} ) ;




describe( "TextBuffer with ScreenBufferHD" , () => {

	const attrObject = {
		color: {
			r: 13 ,
			g: 27 ,
			b: 53 ,
			a: 127
		} ,
		bgColor: {
			r: 61 ,
			g: 7 ,
			b: 9 ,
			a: 203
		} ,
		bold: true ,
		underline: true ,
		styleTransparency: true ,
		charTransparency: true
	} ;
	const attr = termkit.ScreenBufferHD.object2attr( attrObject ) ;

	it( "setText() should preserve encoded attributes and newlines" , () => {
		var textBuffer = new TextBuffer( { ScreenBuffer: termkit.ScreenBufferHD } ) ;
		textBuffer.setText( 'one\ntwo' , false , attr ) ;
		expect( textBuffer.getText() ).to.be( 'one\ntwo' ) ;
		textBuffer.buffer.forEach( line => line.forEach( cell => {
			expect( cell.attr ).to.equal( attr ) ;
		} ) ) ;
	} ) ;

	it( "default and void attributes should preserve encoded attributes" , () => {
		var textBuffer = new TextBuffer( { ScreenBuffer: termkit.ScreenBufferHD } ) ;
		textBuffer.setDefaultAttr( attr ) ;
		textBuffer.setVoidAttr( attr ) ;
		textBuffer.setText( 'a' ) ;
		expect( textBuffer.defaultAttr ).to.equal( attr ) ;
		expect( textBuffer.voidAttr ).to.equal( attr ) ;
		expect( textBuffer.buffer[ 0 ][ 0 ].attr ).to.equal( attr ) ;
		textBuffer.setVoidAttr( null ) ;
		expect( textBuffer.voidAttr ).to.be( null ) ;
	} ) ;

	it( "cell and region setters should preserve encoded attributes" , () => {
		var textBuffer = new TextBuffer( { ScreenBuffer: termkit.ScreenBufferHD } ) ;
		textBuffer.setText( 'abc' ) ;
		textBuffer.setAttrAt( attr , 0 , 0 ) ;
		textBuffer.setAttrRegion( attr , {
			xmin: 1 ,
			xmax: 2 ,
			ymin: 0 ,
			ymax: 0
		} ) ;
		textBuffer.buffer[ 0 ].forEach( cell => {
			expect( cell.attr ).to.equal( attr ) ;
		} ) ;
	} ) ;

	it( "insert(), prepend() and append() should preserve encoded attributes" , () => {
		var textBuffer = new TextBuffer( { ScreenBuffer: termkit.ScreenBufferHD } ) ;
		textBuffer.insert( 'b' , false , attr ) ;
		textBuffer.prepend( 'a' , false , attr ) ;
		textBuffer.append( 'c' , false , attr ) ;
		expect( textBuffer.getText() ).to.be( 'abc' ) ;
		textBuffer.buffer[ 0 ].forEach( cell => {
			expect( cell.attr ).to.equal( attr ) ;
		} ) ;
	} ) ;

	it( "attribute objects should still be converted" , () => {
		var textBuffer = new TextBuffer( { ScreenBuffer: termkit.ScreenBufferHD } ) ;
		textBuffer.setText( 'a' , false , attrObject ) ;
		expect( textBuffer.buffer[ 0 ][ 0 ].attr ).to.equal( attr ) ;
	} ) ;

	it( "drawing should preserve text and void attributes without sharing the input buffer" , () => {
		var screen = new termkit.ScreenBufferHD( { width: 2 , height: 1 } ) ;
		var textBuffer = new TextBuffer( { dst: screen } ) ;
		var original = Buffer.from( attr ) ;
		textBuffer.setText( 'x' , false , attr ) ;
		textBuffer.setVoidAttr( attr ) ;
		textBuffer.draw() ;
		expect( screen.buffer.subarray( 0 , screen.ATTR_SIZE ) ).to.equal( attr ) ;
		expect( screen.buffer.subarray( screen.ITEM_SIZE , screen.ITEM_SIZE + screen.ATTR_SIZE ) ).to.equal( attr ) ;
		expect( textBuffer.buffer[ 0 ][ 0 ].attr === attr ).to.be( false ) ;
		textBuffer.setSelectionRegion( {
			xmin: 0 ,
			xmax: 0 ,
			ymin: 0 ,
			ymax: 0
		} ) ;
		textBuffer.draw() ;
		expect( screen.get( { x: 0 , y: 0 } ).attr.inverse ).to.be( true ) ;
		expect( attr ).to.equal( original ) ;
	} ) ;

	it( "style markup should preserve the encoded base colors and alpha" , () => {
		var textBuffer = new TextBuffer( { ScreenBuffer: termkit.ScreenBufferHD } ) ;
		textBuffer.setText( '^/x' , true , attr ) ;
		expect( textBuffer.getText() ).to.be( 'x' ) ;
		var expected = termkit.ScreenBufferHD.object2attr( Object.assign( {} , attrObject , { italic: true } ) ) ;
		expect( textBuffer.buffer[ 0 ][ 0 ].attr ).to.equal( expected ) ;
	} ) ;

	it( "other layouts and malformed buffers should still use object conversion" , () => {
		[ termkit.ScreenBuffer , termkit.ScreenBufferHD ].forEach( ScreenBuffer => {
			[ 0 , 9 , 11 , 64 ].forEach( length => {
				var textBuffer = new TextBuffer( { ScreenBuffer } ) ;
				var buffer = Buffer.alloc( length , 65 ) ;
				textBuffer.setText( 'x' , false , buffer ) ;
				expect( textBuffer.buffer[ 0 ][ 0 ].attr ).to.equal( ScreenBuffer.object2attr( buffer ) ) ;
			} ) ;
		} ) ;
		var textBuffer = new TextBuffer() ;
		textBuffer.setText( 'x' , false , Buffer.from( attr ) ) ;
		expect( textBuffer.buffer[ 0 ][ 0 ].attr ).to.be( termkit.ScreenBuffer.object2attr( Buffer.from( attr ) ) ) ;
	} ) ;

	it( "attributes read from wide cells should not carry layout flags into text" , () => {
		var source = new termkit.ScreenBufferHD( { width: 2 , height: 1 } ) ;
		source.put( { attr: attrObject } , '漢' ) ;
		[ 0 , 1 ].forEach( x => {
			var input = source.readAttr( source.buffer , x * source.ITEM_SIZE ) ;
			var flags = source.LEADING_FULLWIDTH | source.TRAILING_FULLWIDTH ;
			expect( !! ( input[ source.ATTR_SIZE - 1 ] & flags ) ).to.be( true ) ;
			var screen = new termkit.ScreenBufferHD( { width: 1 , height: 1 } ) ;
			var textBuffer = new TextBuffer( { dst: screen } ) ;
			textBuffer.setText( 'x' , false , input ) ;
			textBuffer.draw() ;
			expect( screen.get( { x: 0 , y: 0 } ).char ).to.be( 'x' ) ;
			expect( screen.buffer.subarray( 0 , screen.ATTR_SIZE ) ).to.equal( attr ) ;
			expect( !! ( input[ source.ATTR_SIZE - 1 ] & flags ) ).to.be( true ) ;
		} ) ;
	} ) ;
} ) ;
