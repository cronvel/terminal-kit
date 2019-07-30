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
	turquoise: '#1bc17d' ,
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

const FIX_STEP = 1.1 ;

function clStep( color , cAdjust , lAdjust , fixRgb = true ) {
	var c , l , rgb , avg , sortedChannels , preserveLOverC ;
	
	if ( ! cAdjust && ! lAdjust ) { return color ; }
	
	c = color.get( 'hcl.c' ) ;
	l = color.get( 'hcl.l' ) ;
	
	/*
	c += c * cAdjust / 3 ;
	l += l * lAdjust / 4 ;
	//*/
	
	c *= ( cAdjust > 0 ? 1.6 : 1.5 ) ** cAdjust ;
	l *= ( lAdjust > 0 ? 1.2 : 1.35 ) ** lAdjust ;
	
	color = color.set( 'hcl.c' , c ).set( 'hcl.l' , l ) ;
	
	if ( ! fixRgb || ! color.clipped ) { return color ; }
	
	// RGB is clipped and should be fixed
	// The most critical part is when the hue get changed, since it's arguably the most important information
	// Lightness is somewhat important too, but less than hue a bit more than the Chroma
	// Chroma will be preserved if the adjustement is greater on it than on lightness

	//preserveLOverC = Math.abs( lAdjust ) >= Math.abs( cAdjust ) ;
	preserveLOverC = Math.abs( lAdjust ) >= cAdjust ;
	
	for ( ;; ) {
		// color.clipped is not reliable since integer rounding counts as clipping...
		rgb = color._rgb._unclipped ;
		rgb.length = 3 ;
		
		if ( rgb.every( channel => channel > -5 && channel < 260 ) ) { return color ; }
		
		sortedChannels = [ ... rgb ].sort() ;
		
		//console.log( "Clipped!" , rgb , color.rgb() ) ;
		
		if ( sortedChannels[ 2 ] >= 256 ) {
			// Clipping will affect hue!
			avg = ( sortedChannels[ 0 ] + sortedChannels[ 1 ] + sortedChannels[ 2 ] ) / 3 ;
			
			if ( preserveLOverC ) {
				// Desaturate a bit and retry
				c = color.get( 'hcl.c' ) ;
				c /= FIX_STEP ;
				color = color.set( 'hcl.c' , c ) ;
			}
			else {
				// Darken a bit and retry
				l = color.get( 'hcl.l' ) ;
				l /= FIX_STEP ;
				color = color.set( 'hcl.l' , l ) ;
			}
			
			// It was too bright anyway, let it be clipped
			if ( avg > 255 ) { return color ; }
		}
		else if ( sortedChannels[ 1 ] < 0 ) {
			// Clipping will affect hue!
			avg = ( sortedChannels[ 0 ] + sortedChannels[ 1 ] + sortedChannels[ 2 ] ) / 3 ;

			if ( preserveLOverC ) {
				// Desaturate a bit and retry
				c = color.get( 'hcl.c' ) ;
				c /= FIX_STEP ;
				color = color.set( 'hcl.c' , c ) ;
			}
			else {
				// Lighten a bit and retry
				l = color.get( 'hcl.l' ) ;
				l *= FIX_STEP ;
				color = color.set( 'hcl.l' , l ) ;
			}

			// It was too dark anyway, let it be clipped
			if ( avg < 0 ) { return color ; }
		}
		else {
			// This clipping (lowest channel below 0) will not affect hue, only lightness, let it be clipped
			return color ;
		}
	}
}



term.bold( '\n\n=== Itten/mine 12 colors palette ===\n\n' ) ;

//scale = Object.keys( itten ).map( color => termkit.chroma( itten[ color ] ) ) ;
scale = Object.keys( mine ).map( color => termkit.chroma( mine[ color ] ) ) ;

for ( z = 3 ; z >= -2 ; z -- ) {
	term( "Saturation: %i\n" , z ) ;

	for ( j = 2 ; j >= -3 ; j -- ) {
		term( j >= 0 ? " %i " : "%i " , j ) ;
		for ( i = 0 ; i < 12 ; i ++ ) {
			//[r,g,b] = saturationStep( lightnessStep( scale[ i ] , j ) , z ).rgb() ;
			//[r,g,b] = lightnessStep( saturationStep( scale[ i ] , z ) , j ).rgb() ;
			[r,g,b] = clStep( scale[ i ] , z , j ).rgb() ;
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



term.bold( '\n\n=== Auto grayscale colors palette (Lab) ===\n\n' ) ;

for ( i = 0 ; i <= 10 ; i ++ ) {
	[r,g,b] = termkit.chroma.hcl( 0 , 0 , 10 * i ).rgb() ;
	term.bgColorRgb( r , g , b , '  ' ) ;
	//console.log( [r,g,b] ) ;
}

term( '\n' ) ;



term.bold( '\n\n=== Palette Class tests  ===\n\n' ) ;

const Palette = require( '../lib/Palette.js' ) ;

var palette = new Palette() ;
palette.generate() ;

for ( i = 0 ; i < 16 ; i ++ ) {
	if ( i % 8 === 0 ) { term.styleReset( '\n' ) ; }
	term.raw( palette.bgEscape[ i ] + '  ' ) ;
}

term.styleReset( '\n' ) ;
for ( i = 16 ; i < 232 ; i ++ ) {
	if ( ( i - 16 ) % 12 === 0 ) { term.styleReset( '\n' ) ; }
	if ( ( i - 16 ) % 72 === 0 ) { term.styleReset( '\n' ) ; }
	term.raw( palette.bgEscape[ i ] + '  ' ) ;
}

term.styleReset( '\n\n' ) ;
for ( i = 232 ; i < 245 ; i ++ ) {
	term.raw( palette.bgEscape[ i ] + '  ' ) ;
}

term.styleReset( '\n\n' ) ;
for ( i = 245 ; i < 256 ; i ++ ) {
	term.raw( palette.bgEscape[ i ] + '  ' ) ;
}

term.styleReset( '\n' ) ;

//term.raw( palette.bgEscape[ register ] + '  ' ) ;

var buffer = termkit.ScreenBuffer.create( { dst: term , width: 8 , height: 8 , x: term.width - 10 , y: 10 , palette: palette } ) ;

buffer.fill( { attr: { bgColor: '@yellow~--' } } ) ;
buffer.put( { x:1 , y:1 , markup: true } , '^[fg:*crimson,bg:*light-pink]BOB' ) ;
term.saveCursor() ;
buffer.draw() ;
term.restoreCursor() ;

//console.log( palette.colorIndex ) ;

// Reset before exiting...

term.styleReset( '\n' ) ;
term( 'Reset...\n' ) ;

