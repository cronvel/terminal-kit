#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2019 Cédric Ronvel

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



// https://fr.wikipedia.org/wiki/Cercle_chromatique#Hering

// Cool lib to manipulate colors: https://github.com/gka/chroma.js

const termkit = require( '..' ) ;
const term = termkit.terminal ;

var i , j , z ,
	scale ,
	h , c , l ,
	r , g , b ;


const itten = {
	red: '#e32322' ,
	redOrange: '#ea621f' ,
	orange: '#f18e1c' ,
	orangeYellow: '#fdc60b' ,
	yellow: '#f4e500' ,
	yellowGreen: '#8cbb26' ,
	green: '#008e5b' ,
	greenBlue: '#0696bb' ,
	blue: '#2a71b0' ,
	blueViolet: '#444e99' ,
	violet: '#6d398b' ,
	violetRed: '#c4037d'
}


const mine = {
	red: '#e32322' ,
	orange: '#f18e1c' ,
	yellowOrange: '#fdc60b' ,
	yellow: '#f4e500' ,
	chartreuse: '#8cbb26' ,
	green: '#25ad28' ,
	turquoise: '#1bc190' ,
	cyan: '#0dc0cd' ,
	blue: '#2a60b0' ,
	indigo: '#3b3ba2' ,
	violet: '#713795' ,
	magenta: '#bd0a7d'
}


function lightnessStep( color , adjustment ) {
	if ( ! adjustment ) { return color ; }
	
	var l = color.get( 'hcl.l' ) ;
	
	l += l * adjustment / 4 ;
	
	return color.set( 'hcl.l' , l ) ;
}

function saturationStep( color , adjustment ) {
	if ( ! adjustment ) { return color ; }
	
	var s = color.get( 'hcl.c' ) ;
	
	s += s * adjustment / 3 ;
	
	return color.set( 'hcl.c' , s ) ;
}



term.bold( '\n\n=== Itten/mine 12 colors palette ===\n\n' ) ;

//scale = Object.keys( itten ).map( color => termkit.chroma( itten[ color ] ) ) ;
scale = Object.keys( mine ).map( color => termkit.chroma( mine[ color ] ) ) ;

for ( z = 0 ; z >= -2 ; z -- ) {
	term( "Saturation: %i\n" , z ) ;

	for ( j = 2 ; j >= -3 ; j -- ) {
		term( j >= 0 ? " %i " : "%i " , j ) ;
		for ( i = 0 ; i < 12 ; i ++ ) {
			//[r,g,b] = saturationStep( lightnessStep( scale[ i ] , j ) , z ).rgb() ;
			[r,g,b] = lightnessStep( saturationStep( scale[ i ] , z ) , j ).rgb() ;
			term.bgColorRgb( r , g , b , '  ' ) ;
		}

		term( '\n' ) ;
	}

}


term.bold( '\n\n=== Auto 12 colors palette ===\n\n' ) ;

for ( i = 0 ; i < 12 ; i ++ ) {
	h = i * 30 ;
	[r,g,b] = termkit.chroma.hcl( h , 120 , 80 ).rgb() ;
	term.bgColorRgb( r , g , b , '  ' ) ;
}




// Reset before exiting...

term.styleReset( '\n' ) ;
term( 'Reset...\n' ) ;

