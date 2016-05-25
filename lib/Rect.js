/*
	Terminal Kit
	
	Copyright (c) 2009 - 2016 Cédric Ronvel
	
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



// Load modules
//var tree = require( 'tree-kit' ) ;
//var async = require( 'async-kit' ) ;
var termkit = require( './termkit.js' ) ;





			/* Rect: rectangular region, clipping, etc */



function Rect() { throw new Error( '[terminal] Cannot create a termkit.Rect directly, use termkit.Rect.create() instead.' ) ; }
module.exports = Rect ;



/*
	new Rect( xmin , ymin , xmax , ymax )
	new Rect( object ) having properties: xmin , ymin , xmax , ymax
	new Rect( Terminal )
	new Rect( ScreenBuffer )
*/
Rect.create = function createRect( src )
{
	var rect = Object.create( Rect.prototype ) ;
	
	if ( src && ( typeof src === 'object' || typeof src === 'function' ) )
	{
		if ( src instanceof termkit.Terminal )
		{
			rect.set( {
				xmin: 1 ,
				ymin: 1 ,
				xmax: src.width ,
				ymax: src.height
			} ) ;
		}
		else if ( src instanceof termkit.ScreenBuffer )
		{
			rect.set( {
				xmin: 0 ,
				ymin: 0 ,
				xmax: src.width - 1 ,
				ymax: src.height - 1
			} ) ;
		}
		else if ( src instanceof termkit.TextBuffer )
		{
			rect.set( {
				xmin: 0 ,
				ymin: 0 ,
				xmax: src.width - 1 ,
				ymax: src.height - 1
			} ) ;
		}
		else if ( src instanceof Rect )
		{
			rect.set( src ) ;
		}
		else
		{
			if ( src.xmin || src.ymin || src.xmax || src.ymax )
			{
				rect.set( {
					xmin: src.xmin !== undefined ? src.xmin : 0 ,
					ymin: src.ymin !== undefined ? src.ymin : 0 ,
					xmax: src.xmax !== undefined ? src.xmax : 1 ,
					ymax: src.ymax !== undefined ? src.ymax : 1
				} ) ;
			}
			else if ( src.x || src.y || src.width || src.height )
			{
				rect.set( {
					xmin: src.x !== undefined ? src.x : 0 ,
					ymin: src.y !== undefined ? src.y : 0 ,
					xmax: src.width !== undefined ? src.x + src.width - 1 : 1 ,
					ymax: src.height !== undefined ? src.y + src.height - 1 : 1
				} ) ;
			}
		}
	}
	else
	{
		rect.set( {
			xmin: arguments[ 0 ] !== undefined ? arguments[ 0 ] : 0 ,
			ymin: arguments[ 1 ] !== undefined ? arguments[ 1 ] : 0 ,
			xmax: arguments[ 2 ] !== undefined ? arguments[ 2 ] : 1 ,
			ymax: arguments[ 3 ] !== undefined ? arguments[ 3 ] : 1
		} ) ;
	}
	
	return rect ;
} ;



Rect.prototype.set = function rectSet( object )
{
	var key ;
	
	for ( key in object )
	{
		switch ( key )
		{
			case 'xmin' :
			case 'xmax' :
			case 'ymin' :
			case 'ymax' :
				Object.defineProperty( this , key , { value: Math.floor( object[ key ] ) , enumerable: true , configurable: true } ) ;
				break ;
		}
	}
	
	Object.defineProperties( this , {
		width: { value: this.xmax - this.xmin + 1 , enumerable: true , configurable: true } ,
		height: { value: this.ymax - this.ymin + 1 , enumerable: true , configurable: true } ,
		isNull: { value: this.xmin > this.xmax || this.ymin > this.ymax , enumerable: true , configurable: true }
	} ) ;
} ;



// Clip the src according to the dst, offset* are offsets of the srcRect relative to the dst coordinate system
Rect.prototype.clip = function clip( dstRect , offsetX , offsetY , dstClipping )
{
	var srcRect = this ;
	
	offsetX = offsetX || 0 ;
	offsetY = offsetY || 0 ;
	
	srcRect.set( {
		xmin: Math.max( srcRect.xmin , dstRect.xmin - offsetX ) ,
		ymin: Math.max( srcRect.ymin , dstRect.ymin - offsetY ) ,
		xmax: Math.min( srcRect.xmax , dstRect.xmax - offsetX ) ,
		ymax: Math.min( srcRect.ymax , dstRect.ymax - offsetY )
	} ) ;
	
	if ( dstClipping )
	{
		dstRect.set( {
			xmin: Math.max( dstRect.xmin , srcRect.xmin + offsetX ) ,
			ymin: Math.max( dstRect.ymin , srcRect.ymin + offsetY ) ,
			xmax: Math.min( dstRect.xmax , srcRect.xmax + offsetX ) ,
			ymax: Math.min( dstRect.ymax , srcRect.ymax + offsetY )
		} ) ;
	}
	
	return this ;
} ;



/*
	Given a srcRect, a dstRect, offsetX and offsetY, return an array of up to 4 objects consisting of the same properties
	found in entry, wrapping the src into the dst, i.e. the src is always fully visible in the dst, it is just as if
	the dst where circular
	
	Mandatory params:
		* dstRect
		* srcRect
		* offsetX
		* offsetY
	Optionnal params:
		* wrapOnly: 'x' , 'y' (only wrap along that axis)
*/
Rect.wrappingRect = function wrappingRect( p )
{
	var regions = [] , nw , ne , sw , se ;
	
	
	// Originate, North-West region
	nw = {
		srcRect: Rect.create( p.srcRect ) ,
		dstRect: Rect.create( p.dstRect ) ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY
	} ;
	
	// Modulate offsets so they are in-range
	if ( p.wrapOnly !== 'y' )
	{
		nw.offsetX = nw.offsetX % p.dstRect.width ;
		if ( nw.offsetX < 0 ) { nw.offsetX += p.dstRect.width ; }
	}
	
	if ( p.wrapOnly !== 'x' )
	{
		nw.offsetY = nw.offsetY % p.dstRect.height ;
		if ( nw.offsetY < 0 ) { nw.offsetY += p.dstRect.height ; }
	}
	
	// Mutual clipping
	nw.srcRect.clip( nw.dstRect , nw.offsetX , nw.offsetY , true ) ;
	if ( ! nw.srcRect.isNull ) { regions.push( nw ) ; }
	
	// Wrap-x North-Est region
	if ( nw.srcRect.width < p.srcRect.width && p.wrapOnly !== 'y' )
	{
		ne = {
			srcRect: Rect.create( p.srcRect ) ,
			dstRect: Rect.create( p.dstRect ) ,
			offsetX: nw.offsetX - p.dstRect.width ,
			offsetY: nw.offsetY
		} ;
		
		// Mutual clipping
		ne.srcRect.clip( ne.dstRect , ne.offsetX , ne.offsetY , true ) ;
		if ( ! ne.srcRect.isNull ) { regions.push( ne ) ; }
	}
	
	
	// Wrap-y South-West region
	if ( nw.srcRect.height < p.srcRect.height && p.wrapOnly !== 'x' )
	{
		sw = {
			srcRect: Rect.create( p.srcRect ) ,
			dstRect: Rect.create( p.dstRect ) ,
			offsetX: nw.offsetX ,
			offsetY: nw.offsetY - p.dstRect.height
		} ;
		
		// Mutual clipping
		sw.srcRect.clip( sw.dstRect , sw.offsetX , sw.offsetY , true ) ;
		if ( ! sw.srcRect.isNull ) { regions.push( sw ) ; }
	}
	
	
	// Wrap-x + wrap-y South-Est region, do it only if it has wrapped already
	if ( ne && sw )
	{
		se = {
			srcRect: Rect.create( p.srcRect ) ,
			dstRect: Rect.create( p.dstRect ) ,
			offsetX: nw.offsetX - p.dstRect.width ,
			offsetY: nw.offsetY - p.dstRect.height
		} ;
		
		// Mutual clipping
		se.srcRect.clip( se.dstRect , se.offsetX , se.offsetY , true ) ;
		if ( ! se.srcRect.isNull ) { regions.push( se ) ; }
	}
	
	return regions ;
} ;



/*
	This iterator generate synchronous line or cell for dst & src Rect.
	It is totally buffer agnostic.
	Buffer specificities should be added in p.context by the callee.
	
	Iterator.
	Mandatory params:
		* dstRect
		* srcRect
		* type: 'line' or 'cell'
	Optionnal params:
		* context: an object that will be transmitted as is to the iterator
		* dstClipRect
		* srcClipRect
		* offsetX
		* offsetY
		* multiply
*/
Rect.regionIterator = function regionIterator( p , iterator )
{
	var i , j , srcX , srcY , dstX , dstY , srcStart , dstStart ;
	
	if ( ! p.multiply ) { p.multiply = 1 ; }
	if ( ! p.offsetX ) { p.offsetX = 0 ; }
	if ( ! p.offsetY ) { p.offsetY = 0 ; }
	
	if ( p.dstClipRect ) { p.dstClipRect.clip( p.dstRect ) ; }
	else { p.dstClipRect = Rect.create( p.dstRect ) ; }
	
	if ( p.srcClipRect ) { p.srcClipRect.clip( p.srcRect ) ; }
	else { p.srcClipRect = Rect.create( p.srcRect ) ; }
	
	// Mutual clipping
	p.srcClipRect.clip( p.dstClipRect , p.offsetX , p.offsetY , true ) ;
	
	// If out of bounds, or if everything is clipped away, return now
	if ( p.dstRect.isNull || p.srcClipRect.isNull || p.dstClipRect.isNull ) { return ; }
	
	switch ( p.type )
	{
		case 'line' :
			for ( j = 0 ; j < p.srcClipRect.height ; j ++ )
			{
				srcY = p.srcClipRect.ymin + j ;
				dstY = p.dstClipRect.ymin + j ;
				
				iterator( {
					context: p.context ,
					srcXmin: p.srcClipRect.xmin ,
					srcXmax: p.srcClipRect.xmax ,
					srcY: srcY ,
					srcStart: ( srcY * p.srcRect.width + p.srcClipRect.xmin ) * p.multiply ,
					srcEnd: ( srcY * p.srcRect.width + p.srcClipRect.xmax + 1 ) * p.multiply ,
					dstXmin: p.dstClipRect.xmin ,
					dstXmax: p.dstClipRect.xmax ,
					dstY: dstY ,
					dstStart: ( dstY * p.dstRect.width + p.dstClipRect.xmin ) * p.multiply ,
					dstEnd: ( dstY * p.dstRect.width + p.dstClipRect.xmax + 1 ) * p.multiply
				} ) ;
			}
			break ;
			
		case 'cell' :
			for ( j = 0 ; j < p.srcClipRect.height ; j ++ )
			{
				for ( i = 0 ; i < p.srcClipRect.width ; i ++ )
				{
					srcX = p.srcClipRect.xmin + i ;
					srcY = p.srcClipRect.ymin + j ;
					
					dstX = p.dstClipRect.xmin + i ;
					dstY = p.dstClipRect.ymin + j ;
					
					srcStart = ( srcY * p.srcRect.width + srcX ) * p.multiply ;
					dstStart = ( dstY * p.dstRect.width + dstX ) * p.multiply ;
					
					iterator( {
						context: p.context ,
						srcX: srcX ,
						srcY: srcY ,
						srcStart: srcStart ,
						srcEnd: srcStart + p.multiply ,
						dstX: dstX ,
						dstY: dstY ,
						dstStart: dstStart ,
						dstEnd: dstStart + p.multiply
					} ) ;
				}
			}
			break ;
	}
} ;



/*
	This is the tile-variant of the regionIterator.
	
	Iterator.
	Mandatory params:
		* dstRect
		* srcRect
		* type: 'line' or 'cell'
	Optionnal params:
		* context: an object that will be transmitted as is to the iterator
		* dstClipRect
		* srcClipRect
		* offsetX
		* offsetY
		* multiply
*/
Rect.tileIterator = function tileIterator( p , iterator )
{
	var srcI , srcJ , srcX , srcY , dstI , dstJ , dstX , dstY , streak , srcStart , dstStart ;
	
	if ( ! p.multiply ) { p.multiply = 1 ; }
	if ( ! p.offsetX ) { p.offsetX = 0 ; }
	if ( ! p.offsetY ) { p.offsetY = 0 ; }
	
	if ( p.dstClipRect ) { p.dstClipRect.clip( p.dstRect ) ; }
	else { p.dstClipRect = Rect.create( p.dstRect ) ; }
	
	if ( p.srcClipRect ) { p.srcClipRect.clip( p.srcRect ) ; }
	else { p.srcClipRect = Rect.create( p.srcRect ) ; }
	
	
	switch ( p.type )
	{
		case 'cell' :
			for ( dstJ = 0 ; dstJ < p.dstClipRect.height ; dstJ ++ )
			{
				srcJ = ( dstJ - p.offsetY ) % p.srcClipRect.height ;
				if ( srcJ < 0 ) { srcJ += p.srcClipRect.height ; }
				
				for ( dstI = 0 ; dstI < p.dstClipRect.width ; dstI ++ )
				{
					srcI = ( dstI - p.offsetX ) % p.srcClipRect.width ;
					if ( srcI < 0 ) { srcI += p.srcClipRect.width ; }
					
					srcX = p.srcClipRect.xmin + srcI ;
					srcY = p.srcClipRect.ymin + srcJ ;
					
					dstX = p.dstClipRect.xmin + dstI ;
					dstY = p.dstClipRect.ymin + dstJ ;
					
					srcStart = ( srcY * p.srcRect.width + srcX ) * p.multiply ;
					dstStart = ( dstY * p.dstRect.width + dstX ) * p.multiply ;
					
					iterator( {
						context: p.context ,
						srcX: srcX ,
						srcY: srcY ,
						srcStart: srcStart ,
						srcEnd: srcStart + p.multiply ,
						dstX: dstX ,
						dstY: dstY ,
						dstStart: dstStart ,
						dstEnd: dstStart + p.multiply
					} ) ;
				}
			}
			break ;
			
		case 'line' :
			for ( dstJ = 0 ; dstJ < p.dstClipRect.height ; dstJ ++ )
			{
				srcJ = ( dstJ - p.offsetY ) % p.srcClipRect.height ;
				if ( srcJ < 0 ) { srcJ += p.srcClipRect.height ; }
				
				dstI = 0 ;
				while ( dstI < p.dstClipRect.width )
				{
					srcI = ( dstI - p.offsetX ) % p.srcClipRect.width ;
					if ( srcI < 0 ) { srcI += p.srcClipRect.width ; }
					
					streak = Math.min( p.srcClipRect.width - srcI , p.dstClipRect.width - dstI ) ;
					
					srcX = p.srcClipRect.xmin + srcI ;
					srcY = p.srcClipRect.ymin + srcJ ;
					
					dstX = p.dstClipRect.xmin + dstI ;
					dstY = p.dstClipRect.ymin + dstJ ;
					
					srcStart = ( srcY * p.srcRect.width + srcX ) * p.multiply ;
					dstStart = ( dstY * p.dstRect.width + dstX ) * p.multiply ;
					
					iterator( {
						context: p.context ,
						srcXmin: srcX ,
						srcXmax: srcX + streak - 1 ,
						srcY: srcY ,
						srcStart: srcStart ,
						srcEnd: srcStart + streak * p.multiply ,
						dstXmin: dstX ,
						dstXmax: dstX + streak - 1 ,
						dstY: dstY ,
						dstStart: dstStart ,
						dstEnd: dstStart + streak * p.multiply
					} ) ;
					
					dstI += streak ;
				}
			}
			break ;
	}
} ;



/*
	This is the wrap-variant of the regionIterator.
	
	Iterator.
	Mandatory params:
		* dstRect
		* srcRect
		* type: 'line' or 'cell'
	Optionnal params:
		* context: an object that will be transmitted as is to the iterator
		* dstClipRect
		* srcClipRect
		* offsetX
		* offsetY
		* multiply
		* wrapOnly: 'x' , 'y' (only wrap along that axis)
*/
Rect.wrapIterator = function wrapIterator( p , iterator )
{
	var i , regions ;
	
	regions = Rect.wrappingRect( {
		dstRect: p.dstClipRect ,
		srcRect: p.srcClipRect ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY ,
		wrapOnly: p.wrap
	} ) ;
	
	for ( i = 0 ; i < regions.length ; i ++ )
	{
		p.dstClipRect = regions[ i ].dstRect ;
		p.srcClipRect = regions[ i ].srcRect ;
		p.offsetX = regions[ i ].offsetX ;
		p.offsetY = regions[ i ].offsetY ;
		Rect.regionIterator( p , iterator ) ;
	}
} ;



