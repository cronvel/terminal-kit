#!/usr/bin/env node
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



const term = require( '..' ).terminal ;

term( "Custom ^_underline\n" ) ;
term( "Custom ^[underline]underline\n" ) ;
term( "This is ^Rred^:.\n" ) ;
term( "Custom ^[red]red\n" ) ;
term( "Custom ^[fg:red]red\n" ) ;
term( "Custom ^[bg:red]red" )( "\n" ) ;
term( "Custom ^[#f8a]color\n" ) ;
term( "Custom ^[fg:#a8f]color\n" ) ;
term( "Custom ^[bg:#a8f]bg color" )( "\n" ) ;
term( "Custom ^[#af8]^[bg:#f8a]fg+bg color" )( "\n" ) ;
term( "Custom ^[c:#af8]^[bgColor:#f8a]fg+bg color" )( "\n" ) ;
term( '\n' ) ;

term( "Custom ^[wtf]wtf\n" ) ;
term( "Custom ^[fg:wtf]wtf\n" ) ;
term( '\n' ) ;

