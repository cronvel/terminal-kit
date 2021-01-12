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



var termkit = require( '../lib/termkit.js' ) ;
var term = termkit.terminal ;



describe( "Find" , () => {
	it( "how to test a terminal lib with Tea-Time..." ) ;
} ) ;



describe( "String width" , () => {

	it( ".markupWidth()" , () => {
		expect( termkit.markupWidth( '^CBook^Ymark^Rs' ) ).to.be( 9 ) ;
	} ) ;
	
	it( ".truncateString()" , () => {
		expect( termkit.truncateString( '$za' , 2 ) ).to.be( '$z' ) ;
		expect( termkit.truncateString( '$za' , 3 ) ).to.be( '$za' ) ;
		expect( termkit.truncateString( '$za' , 4 ) ).to.be( '$za' ) ;
		expect( termkit.truncateString( 'aé＠à' , 2 ) ).to.be( 'aé' ) ;
		expect( termkit.truncateString( 'aé＠à' , 3 ) ).to.be( 'aé' ) ;
		expect( termkit.truncateString( 'aé＠à' , 4 ) ).to.be( 'aé＠' ) ;
		expect( termkit.truncateString( 'aé＠à' , 5 ) ).to.be( 'aé＠à' ) ;
		expect( termkit.truncateString( 'aé＠à' , 6 ) ).to.be( 'aé＠à' ) ;
		expect( termkit.truncateString( 'aé汉字à' , 2 ) ).to.be( 'aé' ) ;
		expect( termkit.truncateString( 'aé汉字à' , 3 ) ).to.be( 'aé' ) ;
		expect( termkit.truncateString( 'aé汉字à' , 4 ) ).to.be( 'aé汉' ) ;
		expect( termkit.truncateString( 'aé汉字à' , 5 ) ).to.be( 'aé汉' ) ;
		expect( termkit.truncateString( 'aé汉字à' , 6 ) ).to.be( 'aé汉字' ) ;
		expect( termkit.truncateString( 'aé汉字à' , 7 ) ).to.be( 'aé汉字à' ) ;
		expect( termkit.truncateString( 'aé汉字à' , 8 ) ).to.be( 'aé汉字à' ) ;
		
		expect( termkit.truncateString( 'aé汉\x1b[1m\x1b[1m字à' , 3 ) ).to.be( 'aé' ) ;
		expect( termkit.truncateString( 'aé汉\x1b[1m\x1b[1m字à' , 4 ) ).to.be( 'aé汉' ) ;
		expect( termkit.truncateString( 'aé汉\x1b[1m\x1b[1m字à' , 5 ) ).to.be( 'aé汉\x1b[1m\x1b[1m' ) ;
		expect( termkit.truncateString( 'aé汉\x1b[1m\x1b[1m字à' , 6 ) ).to.be( 'aé汉\x1b[1m\x1b[1m字' ) ;
	} ) ;
} ) ;



describe( "Misc" , () => {
	it( "Auto-instance" , () => {
		expect( term ).to.be.an( termkit.Terminal ) ;
	} ) ;
} ) ;

