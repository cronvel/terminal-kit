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



/*
	Ideally, this should be done using a graph algorithm, but we will just brute-force it for instance...
*/

module.exports = function autoComplete( array , startString , returnAlternatives , prefix , postfix ) {
	var i , j , exitLoop , candidates = [] , completed = startString , hasCompleted = false ;

	if ( ! prefix ) { prefix = '' ; }
	if ( ! postfix ) { postfix = '' ; }

	for ( i = 0 ; i < array.length ; i ++ ) {
		if ( array[ i ].slice( 0 , startString.length ) === startString ) { candidates.push( array[ i ] ) ; }
	}

	if ( ! candidates.length ) { return prefix + completed + postfix ; }

	if ( candidates.length === 1 ) { return prefix + candidates[ 0 ] + postfix ; }


	// Multiple candidates, complete only the part they have in common

	j = startString.length ;

	exitLoop = false ;

	for ( j = startString.length ; j < candidates[ 0 ].length ; j ++ ) {
		for ( i = 1 ; i < candidates.length ; i ++ ) {
			if ( candidates[ i ][ j ] !== candidates[ 0 ][ j ] ) { exitLoop = true ; break ; }
		}

		if ( exitLoop ) { break ; }

		completed += candidates[ 0 ][ j ] ;
		hasCompleted = true ;
	}

	if ( returnAlternatives && ! hasCompleted ) {
		candidates.prefix = prefix ;
		candidates.postfix = postfix ;
		return candidates ;
	}

	return prefix + completed + postfix ;
} ;

