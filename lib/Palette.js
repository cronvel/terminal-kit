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



const termkit = require( './termkit.js' ) ;



/*
	Custom 256-colors palette for ScreenBuffer, each color is 24 bits.
	Enhance ScreenBuffer without relying on ScreenBufferHD.

	The original 6x6x6 colors cube shipped with terminal software is rather boring and miss the spot.
	Lot of useless colors, lot of over-saturated hideous colors, and useful colors cannot be shaded/hilighted easily.

	There are 4 parts :

	* The first 16 colors are reserved, it always map to ANSI colors and depends on the terminal settings entirely.
	* Then comes a 216-colors adaptive palette based upon 12 user-provided colors that represent 12 hue of the wheel,
	  with auto-generated variation of shades, tint and desaturation.
	  That is: 12 colors * 6 level of tint/shade * 3 level of desaturation = 216 colors.
	  For maximum reliance, there are computed using the HCL (Lab) colorspace.
	  This provide some good hilight and dim effect
	* Then comes 13 extra colors fully defined by the user, they must be precise and beautiful colors that are missing
	  in the 216-colors part, and that have great added values.
*/

const defaultAdaptivePaletteDef = [
	{ names: [ 'red' ] , code: '#e32322' } ,
	{ names: [ 'orange' ] , code: '#f18e1c' } ,
	{ names: [ 'gold' , 'yellow-orange' , 'amber' ] , code: '#fdc60b' } ,
	{ names: [ 'yellow' ] , code: '#f4e500' } ,
	{ names: [ 'chartreuse' , 'yellow-green' ] , code: '#8cbb26' } ,
	{ names: [ 'green' ] , code: '#25ad28' } ,
	{ names: [ 'turquoise' , 'turquoise-green' ] , code: '#1bc17d' } ,
	{ names: [ 'cyan' , 'turquoise-blue' ] , code: '#0dc0cd' } ,
	{ names: [ 'blue' ] , code: '#2a60b0' } ,
	{ names: [ 'indigo' ] , code: '#3b3ba2' } ,
	{ names: [ 'violet' , 'purple' ] , code: '#713795' } ,
	{ names: [ 'magenta' ] , code: '#bd0a7d' }
] ;



// 13 extra colors
const defaultExtraPaletteDef = [
	{ names: [ 'crimson' ] , code: '#dc143c' } ,
	{ names: [ 'vermilion' , 'cinnabar' ] , code: '#e34234' } ,
	{ names: [ 'brown' ] , code: '#a52a2a' } ,
	{ names: [ 'bronze' ] , code: '#cd7f32' } ,
	{ names: [ 'coquelicot' ] , code: '#ff3800' } ,
	//{ names: [ 'flame' ] , code: '#e25822' } ,
	//{ names: [ 'salmon' ] , code: '#ff8c69' } ,
	{ names: [ 'coral-pink' ] , code: '#f88379' } ,
	{ names: [ 'see-green' ] , code: '#2e8b57' } ,
	{ names: [ 'medium-spring-green' ] , code: '#00fa9a' } ,
	{ names: [ 'olivine' ] , code: '#9ab973' } ,
	{ names: [ 'royal-blue' ] , code: '#4169e1' } ,
	{ names: [ 'purple' ] , code: '#800080' } ,
	//{ names: [ 'tyrian-purple' ] , code: '#66023c' } ,
	//{ names: [ 'purple-heart' ] , code: '#69359c' } ,
	{ names: [ 'lavender-purple' ] , code: '#967bb6' } ,
	//{ names: [ 'classic-rose' , 'light-pink' ] , code: '#fbcce7' } ,
	{ names: [ 'pink' ] , code: '#ffc0cb' }
	//{ names: [ 'lime' , 'lemon-lime' ] , code: '#bfff00' } ,
] ;



const ansiColorIndex = {
	black: 0 ,
	red: 1 ,
	green: 2 ,
	yellow: 3 ,
	blue: 4 ,
	magenta: 5 ,
	violet: 5 ,
	cyan: 6 ,
	white: 7 ,
	grey: 8 ,
	gray: 8 ,
	'bright-black': 8 ,
	'bright-red': 9 ,
	'bright-green': 10 ,
	'bright-yellow': 11 ,
	'bright-blue': 12 ,
	'bright-magenta': 13 ,
	'bright-violet': 13 ,
	'bright-cyan': 14 ,
	'bright-white': 15
} ;


function Palette( options = {} ) {
	this.term = options.term || termkit.terminal ;
	this.system = !! options.system ;
	this.adaptivePaletteDef = this.system ? null : options.adaptivePaletteDef || defaultAdaptivePaletteDef ;
	this.extraPaletteDef = this.system ? null : options.extraPaletteDef || defaultExtraPaletteDef ;
	this.escape = [] ;
	this.bgEscape = [] ;
	this.chromaColors = [] ;
	this.colorIndex = {} ;

	// Because that function is often passed as argument... easier to bind it here once for all
	this.colorNameToIndex = this.colorNameToIndex.bind( this ) ;

	this.generate() ;
}

module.exports = Palette ;



Palette.prototype.colorNameToIndex = function( name ) {
	name = name.toLowerCase() ;
	return this.colorIndex[ name ] || termkit.colorNameToIndex( name ) ;
} ;



Palette.prototype.generate = function() {
	this.generateDefaultMapping() ;
	this.generateAnsiColorNames() ;
	this.generateAdaptive() ;
	this.generateExtra() ;
	this.generateGrayscale() ;
} ;



// It just generates default terminal mapping for 256 colors
Palette.prototype.generateDefaultMapping = function() {
	var register ;

	for ( register = 0 ; register < 256 ; register ++ ) {
		this.escape[ register ] = this.term.str.color256( register ) ;
		this.bgEscape[ register ] = this.term.str.bgColor256( register ) ;
	}
} ;



// It just generates default terminal mapping for 256 colors
Palette.prototype.generateAnsiColorNames = function() {
	var name , strippedName ;

	for ( name in ansiColorIndex ) {
		strippedName = name.replace( /-/g , '' ) ;
		this.colorIndex[ name ] = ansiColorIndex[ name ] ;

		if ( strippedName !== name ) {
			this.colorIndex[ strippedName ] = ansiColorIndex[ name ] ;
		}
	}
} ;



Palette.prototype.generateAdaptive = function() {
	if ( this.system ) { return ; }

	var i , j , z , register ,
		baseChromaColors , chromaColor ,
		saturationMark , lightnessMark , suffix ;

	baseChromaColors = this.adaptivePaletteDef.map( color => termkit.chroma( color.code ) ) ;

	register = 16 ;

	for ( z = 0 ; z >= -2 ; z -- ) {
		if ( z > 0 ) {
			saturationMark = '!'.repeat( z ) ;
		}
		else if ( z < 0 ) {
			saturationMark = '~'.repeat( -z ) ;
		}
		else {
			saturationMark = '' ;
		}

		for ( j = 2 ; j >= -3 ; j -- ) {

			if ( j > 0 ) {
				lightnessMark = '+'.repeat( j ) ;
			}
			else if ( j < 0 ) {
				lightnessMark = '-'.repeat( -j ) ;
			}
			else {
				lightnessMark = '' ;
			}

			suffix = saturationMark + lightnessMark ;

			for ( i = 0 ; i < 12 ; i ++ ) {
				chromaColor = this.clStep( baseChromaColors[ i ] , z , j ) ;
				this.addColor( register , chromaColor , this.adaptivePaletteDef[ i ].names , '@' , suffix ) ;
				register ++ ;
			}
		}

	}
} ;



Palette.prototype.generateExtra = function() {
	if ( this.system ) { return ; }

	var i , register ;

	register = 232 ;

	for ( i = 0 ; i < 13 && i < this.extraPaletteDef.length ; i ++ ) {
		this.addColor( register , termkit.chroma( this.extraPaletteDef[ i ].code ) , this.extraPaletteDef[ i ].names , '*' ) ;
		register ++ ;
	}
} ;



const grayscaleNames = [
	[ 'black' ] ,
	[ 'darkest-gray' ] ,
	[ 'darker-gray' ] ,
	[ 'dark-gray' ] ,
	[ 'dark-medium-gray' ] ,
	[ 'medium-gray' , 'gray' ] ,
	[ 'light-medium-gray' ] ,
	[ 'light-gray' ] ,
	[ 'lighter-gray' ] ,
	[ 'lightest-gray' ] ,
	[ 'white' ]
] ;

Palette.prototype.generateGrayscale = function() {
	if ( this.system ) { return ; }

	var i , register , chromaColor ;

	register = 245 ;

	for ( i = 0 ; i <= 10 ; i ++ ) {
		chromaColor = termkit.chroma( 0 , 0 , 10 * i , 'hcl' ) ;
		this.addColor( register , chromaColor , grayscaleNames[ i ] , '@' ) ;
		register ++ ;
	}
} ;



Palette.prototype.getRgb = function( register ) {
	var chromaColor = this.chromaColors[ register ] ;
	if ( ! chromaColor ) { return null ; }
	var [ r , g , b ] = chromaColor.rgb() ;
	return { r , g , b } ;
} ;



Palette.prototype.addColor = function( register , chromaColor , names , prefix = '' , suffix = '' ) {
	var targetRegister ,
		[ r , g , b ] = chromaColor.rgb() ;

	this.chromaColors[ register ] = chromaColor ;

	if ( this.term.support.trueColor ) {
		this.escape[ register ] = this.term.str.colorRgb( r , g , b ) ;
		this.bgEscape[ register ] = this.term.str.bgColorRgb( r , g , b ) ;
	}
	else if ( this.term.support['256colors'] ) {
		targetRegister = this.term.registerForRgb(
			{ r , g , b } ,
			r === g && g === b ? 232 : 0 ,	// minRegister is the start of the grayscale if r=g=b
			255
		) ;

		this.escape[ register ] = this.term.str.color256( targetRegister ) ;
		this.bgEscape[ register ] = this.term.str.bgColor256( targetRegister ) ;
	}
	else {
		targetRegister = this.term.registerForRgb( { r , g , b } , 0 , 15 ) ;
		this.escape[ register ] = this.term.str.color256( targetRegister ) ;
		this.bgEscape[ register ] = this.term.str.bgColor256( targetRegister ) ;
	}

	names.forEach( name => {
		var strippedName = prefix + name.replace( /-/g , '' ) + suffix ;
		name = prefix + name + suffix ;
		this.colorIndex[ name ] = register ;

		if ( strippedName !== name ) {
			this.colorIndex[ strippedName ] = register ;
		}
	} ) ;
} ;



const FIX_STEP = 1.1 ;

Palette.prototype.clStep = function( chromaColor , cAdjust , lAdjust , fixRgb = true ) {
	var c , l , rgb , avg , sortedChannels , preserveLOverC ;

	if ( ! cAdjust && ! lAdjust ) { return chromaColor ; }

	c = chromaColor.get( 'hcl.c' ) ;
	l = chromaColor.get( 'hcl.l' ) ;

	/*
	c += c * cAdjust / 3 ;
	l += l * lAdjust / 4 ;
	//*/

	c *= ( cAdjust > 0 ? 1.6 : 1.7 ) ** cAdjust ;
	l *= ( lAdjust > 0 ? 1.2 : 1.35 ) ** lAdjust ;

	chromaColor = chromaColor.set( 'hcl.c' , c ).set( 'hcl.l' , l ) ;

	if ( ! fixRgb || ! chromaColor.clipped ) { return chromaColor ; }

	// RGB is clipped and should be fixed
	// The most critical part is when the hue get changed, since it's arguably the most important information
	// Lightness is somewhat important too, but less than hue a bit more than the Chroma
	// Chroma will be preserved if the adjustement is greater on it than on lightness

	//preserveLOverC = Math.abs( lAdjust ) >= Math.abs( cAdjust ) ;
	preserveLOverC = Math.abs( lAdjust ) >= cAdjust ;

	for ( ;; ) {
		// chromaColor.clipped is not reliable since integer rounding counts as clipping...
		rgb = chromaColor._rgb._unclipped ;
		rgb.length = 3 ;

		if ( rgb.every( channel => channel > -5 && channel < 260 ) ) { return chromaColor ; }

		sortedChannels = [ ... rgb ].sort() ;

		//console.log( "Clipped!" , rgb , chromaColor.rgb() ) ;

		if ( sortedChannels[ 2 ] >= 256 ) {
			// Clipping will affect hue!
			avg = ( sortedChannels[ 0 ] + sortedChannels[ 1 ] + sortedChannels[ 2 ] ) / 3 ;

			if ( preserveLOverC ) {
				// Desaturate a bit and retry
				c = chromaColor.get( 'hcl.c' ) ;
				c /= FIX_STEP ;
				chromaColor = chromaColor.set( 'hcl.c' , c ) ;
			}
			else {
				// Darken a bit and retry
				l = chromaColor.get( 'hcl.l' ) ;
				l /= FIX_STEP ;
				chromaColor = chromaColor.set( 'hcl.l' , l ) ;
			}

			// It was too bright anyway, let it be clipped
			if ( avg > 255 ) { return chromaColor ; }
		}
		else if ( sortedChannels[ 1 ] < 0 ) {
			// Clipping will affect hue!
			avg = ( sortedChannels[ 0 ] + sortedChannels[ 1 ] + sortedChannels[ 2 ] ) / 3 ;

			if ( preserveLOverC ) {
				// Desaturate a bit and retry
				c = chromaColor.get( 'hcl.c' ) ;
				c /= FIX_STEP ;
				chromaColor = chromaColor.set( 'hcl.c' , c ) ;
			}
			else {
				// Lighten a bit and retry
				l = chromaColor.get( 'hcl.l' ) ;
				l *= FIX_STEP ;
				chromaColor = chromaColor.set( 'hcl.l' , l ) ;
			}

			// It was too dark anyway, let it be clipped
			if ( avg < 0 ) { return chromaColor ; }
		}
		else {
			// This clipping (lowest channel below 0) will not affect hue, only lightness, let it be clipped
			return chromaColor ;
		}
	}
} ;

