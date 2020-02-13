#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2020 Cédric Ronvel

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



var size = 100 , loop = 1000000 ;
var buf = new Buffer( size * 4 ) ;



function test( method )
{
	var i , j , t1 , t2 , values = [] ;
	
	// First prepare random values, we do not want that those operation pollute the benchmark
	for ( i = 0 ; i < loop ; i ++ )
	{
		values[ i ] = [] ;
		for ( j = 0 ; j < 10 ; j ++ )
		{
			values[ i ][ j ] = [ Math.floor( Math.random() * ( 1 << 30 ) ) , Math.floor( Math.random() * size ) ] ;
		}
	}
	
	
	// Now start the real benchmark
	t1 = new Date() ;
	
	for ( i = 0 ; i < loop ; i ++ )
	{
		// Partly unroll the loop, we dont want to benchmark the 'for' loop
		buf[ method ]( values[ i ][ 0 ][ 0 ] , values[ i ][ 0 ][ 1 ] ) ;
		buf[ method ]( values[ i ][ 1 ][ 0 ] , values[ i ][ 1 ][ 1 ] ) ;
		buf[ method ]( values[ i ][ 2 ][ 0 ] , values[ i ][ 2 ][ 1 ] ) ;
		buf[ method ]( values[ i ][ 3 ][ 0 ] , values[ i ][ 3 ][ 1 ] ) ;
		buf[ method ]( values[ i ][ 4 ][ 0 ] , values[ i ][ 4 ][ 1 ] ) ;
		buf[ method ]( values[ i ][ 5 ][ 0 ] , values[ i ][ 5 ][ 1 ] ) ;
		buf[ method ]( values[ i ][ 6 ][ 0 ] , values[ i ][ 6 ][ 1 ] ) ;
		buf[ method ]( values[ i ][ 7 ][ 0 ] , values[ i ][ 7 ][ 1 ] ) ;
		buf[ method ]( values[ i ][ 8 ][ 0 ] , values[ i ][ 8 ][ 1 ] ) ;
		buf[ method ]( values[ i ][ 9 ][ 0 ] , values[ i ][ 9 ][ 1 ] ) ;
	}
	
	t2 = new Date() ;
	
	// Display the result
	console.log( method , 'time:' , t2 - t1 , 'ms' ) ;
}



test( 'writeUInt32BE' ) ;
test( 'writeUInt32LE' ) ;
test( 'writeInt32BE' ) ;
test( 'writeInt32LE' ) ;

test( 'writeUInt32BE' ) ;
test( 'writeUInt32LE' ) ;
test( 'writeInt32BE' ) ;
test( 'writeInt32LE' ) ;


