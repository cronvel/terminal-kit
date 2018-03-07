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
/*
	RGB <-> HSL convertor, adaptated from Garry Tan code, found here:
	http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
*/

"use strict" ;



/*
	Converts an RGB color value to HSL.
	Conversion formula adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	Assumes r, g, and b are contained in the set [0, 255] and returns h, s, and l in the set [0, 1].

	rgb2hsl( r , g , b )
	rgb2hsl( rgb )
*/
exports.rgb2hsl = function rgb2hsl( r , g , b ) {
	if ( typeof r === 'object' ) {
		b = r.b ;
		g = r.g ;
		r = r.r ;
	}

	r /= 255 ;
	g /= 255 ;
	b /= 255 ;

	var max = Math.max( r , g , b ) ;
	var min = Math.min( r , g , b ) ;
	var hsl = {} ;

	hsl.l = ( max + min ) / 2 ;

	if ( max === min ) {
		hsl.h = hsl.s = 0 ; // achromatic
	}
	else {
		var diff = max - min ;
		hsl.s = hsl.l > 0.5 ? diff / ( 2 - max - min ) : diff / ( max + min ) ;

		switch( max ) {
			case r :
				hsl.h = ( g - b ) / diff + ( g < b ? 6 : 0 ) ;
				break ;
			case g :
				hsl.h = ( b - r ) / diff + 2 ;
				break ;
			case b :
				hsl.h = ( r - g ) / diff + 4 ;
				break ;
		}

		hsl.h /= 6 ;
	}

	return hsl ;
} ;



/*
	Converts an RGB color value to HSL.
	Conversion formula adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	Assumes r, g, and b are contained in the set [0, 255] and returns h, s, and l in the set [0, 1].

	hsl2rgb( h , s , l)
	hsl2rgb( hsl )
*/
exports.hsl2rgb = function hsl2rgb( h , s , l ) {
	if ( typeof h === 'object' ) {
		l = h.l ;
		s = h.s ;
		h = h.h ;
	}

	var r , g , b ;

	if( s === 0 ) {
		r = g = b = l ; // achromatic
	}
	else {

		var q = l < 0.5 ? l * ( 1 + s ) : l + s - l * s ;
		var p = 2 * l - q ;
		r = hue2rgb( p , q , h + 1 / 3 ) ;
		g = hue2rgb( p , q , h ) ;
		b = hue2rgb( p , q , h - 1 / 3 ) ;
	}

	return {
		r: r * 255 ,
		g: g * 255 ,
		b: b * 255
	} ;
} ;



function hue2rgb( p , q , t ) {
	if ( t < 0 ) { t += 1 ; }
	if ( t > 1 ) { t -= 1 ; }
	if ( t < 1 / 6 ) { return p + ( q - p ) * 6 * t ; }
	if ( t < 1 / 2 ) { return q ; }
	if ( t < 2 / 3 ) { return p + ( q - p ) * ( 2 / 3 - t ) * 6 ; }

	return p ;
}


