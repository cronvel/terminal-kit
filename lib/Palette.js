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



const termkit = require( './termkit.js' ) ;



/*
	Custom 216-colors palette for ScreenBuffer, each color is 24 bits.
	Enhance ScreenBuffer without relying on ScreenBufferHD.
	
	The palette is based upon 12 colors and multiple shades, tint and desaturation.
	That is: 12 colors * 6 level of light * 3 level of desaturation = 216 colors.
*/

const defaultPalette = [
	{ names: [ 'red' ] , code: '#e32322' } ,
	{ names: [ 'orange' ] , code: '#f18e1c' } } ,
	{ names: [ 'gold' , 'yellow-orange' ] , code: '#fdc60b' } ,
	{ names: [ 'yellow' ] , code: '#f4e500' } ,
	{ names: [ 'chartreuse' , 'yellow-green' ] , code: '#8cbb26' } ,
	{ names: [ 'green' ] , code: '#25ad28' } ,
	{ names: [ 'turquoise' , 'turquoise-green' ] , code: '#1bc190' } ,
	{ names: [ 'cyan' ] , code: '#0dc0cd' } ,
	{ names: [ 'blue' ] , code: '#2a60b0' } ,
	{ names: [ 'indigo' ] , code: '#3b3ba2' } ,
	{ names: [ 'violet' ] , code: '#713795' } ,
	{ names: [ 'magenta' ] , code: '#bd0a7d' }
] ;



function Palette( options = {} ) {
	this.palette = options.palette || defaultPalette ;
	this.escape = [] ;
	this.bgEscape = [] ;
	this.colorIndex = {} ;
}

module.exports = Palette ;



Palette.prototype.generate = function() {
	var i , j , k , r , g , b , register ,
		chromaColors ,
		tilda , plus ;
	
	chromaColors = this.palette.map( color => termkit.chroma( color ) ) ;
	
	register = 16 ;
	
	for ( z = 0 ; z >= -2 ; z -- ) {
		tilda = '~'.repeat( -z ) ;
		
		for ( j = 2 ; j >= -3 ; j -- ) {
			
			if ( j > 0 ) {
				plus = '+'.repeat( j ) ;
			}
			else if ( j < 0 ) {
				plus = '-'.repeat( -j ) ;
			}
			else {
				plus = '' ;
			}
			
			for ( i = 0 ; i < 12 ; i ++ ) {
				[r,g,b] = lightnessStep( saturationStep( chromaColors[ i ] , z ) , j ).rgb() ;
				this.escape[ register ] = this.term.str.colorRgb( r , g , b ) ;
				this.bgEscape[ register ] = this.term.str.bgColorRgb( r , g , b ) ;
				
				this.palette[ i ].names.forEach( name => {
					name = '@' + name + tilda + plus ;
					this.colorIndex[ name ] = register ;
				} ) ;
				
				register ++ ;
			}
		}

	}
} ;



Palette.lightnessStep = ( chromaColor , adjustment ) => {
    if ( ! adjustment ) { return chromaColor ; }

    var l = chromaColor.get( 'hcl.l' ) ;

    l += l * adjustment / 4 ;

    return chromaColor.set( 'hcl.l' , l ) ;
} ;



Palette.saturationStep = ( chromaColor , adjustment ) => {
    if ( ! adjustment ) { return chromaColor ; }

    var s = chromaColor.get( 'hcl.c' ) ;

    s += s * adjustment / 3 ;

    return chromaColor.set( 'hcl.c' , s ) ;
} ;

