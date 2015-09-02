/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2015 Cédric Ronvel 
	
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

// Load modules
//var tree = require( 'tree-kit' ) ;
//var async = require( 'async-kit' ) ;
/*
var fs = require( 'fs' ) ;
var punycode = require( 'punycode' ) ;
*/

var termkit = require( './termkit.js' ) ;
var string = require( 'string-kit' ) ;
var array = require( 'array-kit' ) ;

var ScreenBuffer = termkit.ScreenBuffer ;





// A buffer suitable for text editor



function TextBuffer() { throw new Error( 'Cannot create TextBuffer object directly.' ) ; }
module.exports = TextBuffer ;



TextBuffer.create = function create( options )
{
	// Manage options
	if ( ! options ) { options = {} ; }
	
	var textBuffer = Object.create( TextBuffer.prototype , {
		// a terminal or another screenBuffer
		dst: { value: options.dst , writable: true , enumerable: true } ,
		width: { enumerable: true , value: Infinity } ,		// virtually infinity
		height: { enumerable: true , value: Infinity } ,	// virtually infinity
		x: { writable: true , enumerable: true , value:
			options.x !== undefined ? options.x : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 )
		} ,
		y: { writable: true , enumerable: true , value:
			options.y !== undefined ? options.y : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 )
		} ,
		cx: { value: 0 , writable: true , enumerable: true } ,
		cy: { value: 0 , writable: true , enumerable: true } ,
		emptyCellAttr: { value: ScreenBuffer.DEFAULT_ATTR , writable: true , enumerable: true } ,
		
		wrap: { value: options.wrap !== undefined ? options.wrap : true , writable: true , enumerable: true }
	} ) ;
	
	Object.defineProperties( textBuffer , {
		textBuffer: { enumerable: true , configurable: true , value: [] } ,
		attrBuffer: { enumerable: true , configurable: true , value: [[]] }
	} ) ;
	
	return textBuffer ;
} ;



TextBuffer.prototype.getText = function getText()
{
	return this.textBuffer.join( '\n' ) ;
} ;



TextBuffer.prototype.setText = function setText( text )
{
	this.textBuffer = text.split( '\n' ) ;
} ;



TextBuffer.prototype.setEmptyCellAttr = function setText( attr )
{
	if ( attr && typeof attr === 'object' ) { attr = ScreenBuffer.object2attr( attr ) ; }
	if ( typeof attr !== 'number' ) { return ; }
	
	this.emptyCellAttr = attr ;
} ;



TextBuffer.prototype.moveTo = function moveTo( x , y )
{
	this.cx = x >= 0 ? x : 0 ;
	this.cy = y >= 0 ? y : 0 ;
} ;



TextBuffer.prototype.move = function move( x , y )
{
	this.moveTo( this.cx + x , this.cy + y ) ;
} ;



TextBuffer.prototype.insert = function insert( text , attr )
{
	var lines , index , length ;
	
	if ( ! text ) { return ; }
	
	lines = text.split( '\n' ) ;
	length = lines.length ;
	
	if ( attr && typeof attr === 'object' ) { attr = ScreenBuffer.object2attr( attr ) ; }
	if ( typeof attr !== 'number' ) { attr = this.emptyCellAttr ; }
	
	this.insertChars( lines[ 0 ] , attr ) ;
	
	for ( index = 1 ; index < length ; index ++ )
	{
		this.newLine() ;
		this.insertChars( lines[ index ] , attr ) ;
	}
} ;



// Internal API:
// Insert inline chars (no control chars)
TextBuffer.prototype.insertChars = function insertChars( text , attr )
{
	var currentLineLength , attrArray ;
	
	if ( this.textBuffer[ this.cy ] === undefined ) { this.textBuffer[ this.cy ] = '' ; }
	if ( this.attrBuffer[ this.cy ] === undefined ) { this.attrBuffer[ this.cy ] = [] ; }
	
	currentLineLength = this.textBuffer[ this.cy ].length ;
	
	
	// Check if attrBuffer is okey
	if ( currentLineLength !== this.attrBuffer[ this.cy ].length ) { this.fixAttrBuffer( this.cy ) ; }
	
	
	// Create the attribute array to insert
	attrArray = array.fill( Array( text.length ) , attr ) ;
	
	
	// Apply
	if ( this.cx === currentLineLength )
	{
		this.textBuffer[ this.cy ] += text ;
		
		this.attrBuffer[ this.cy ] = this.attrBuffer[ this.cy ].concat( attrArray ) ;
	}
	else if ( this.cx < currentLineLength )
	{
		this.textBuffer[ this.cy ] =
			this.textBuffer[ this.cy ].slice( 0 , this.cx ) +
			text +
			this.textBuffer[ this.cy ].slice( this.cx ) ;
		
		this.attrBuffer[ this.cy ] =
			this.attrBuffer[ this.cy ].slice( 0 , this.cx ).concat( 
				attrArray ,
				this.attrBuffer[ this.cy ].slice( this.cx )
			) ;
	}
	else // if ( this.cx > currentLineLength )
	{
		this.textBuffer[ this.cy ] += string.repeat( ' ' , this.cx - currentLineLength ) + text ;
		
		this.attrBuffer[ this.cy ] =
			this.attrBuffer[ this.cy ].concat(
				array.fill( Array( this.cx - currentLineLength ) , this.emptyCellAttr ) ,
				attrArray
			) ;
	}
	
	this.cx += text.length ;
	
	return ;
} ;



TextBuffer.prototype.newLine = function newLine()
{
	var currentLineLength , nextTextLine = '' , nextAttrLine = [] ;
	
	if ( this.textBuffer[ this.cy ] === undefined ) { this.textBuffer[ this.cy ] = '' ; }
	if ( this.attrBuffer[ this.cy ] === undefined ) { this.attrBuffer[ this.cy ] = [] ; }
	
	currentLineLength = this.textBuffer[ this.cy ].length ;
	
	
	// Check if attrBuffer is okey
	if ( currentLineLength !== this.attrBuffer[ this.cy ].length ) { this.fixAttrBuffer( this.cy ) ; }
	
	
	// Apply
	if ( this.cx < currentLineLength )
	{
		nextTextLine = this.textBuffer[ this.cy ].slice( this.cx ) ;
		this.textBuffer[ this.cy ] = this.textBuffer[ this.cy ].slice( 0 , this.cx ) ;
		
		nextAttrLine = this.attrBuffer[ this.cy ].slice( this.cx ) ;
		this.attrBuffer[ this.cy ] = this.attrBuffer[ this.cy ].slice( 0 , this.cx ) ;
	}
	
	this.textBuffer.splice( this.cy + 1 , 0 , nextTextLine ) ;
	this.attrBuffer.splice( this.cy + 1 , 0 , nextAttrLine ) ;
	
	this.cx = 0 ;
	this.cy ++ ;
} ;



TextBuffer.prototype.fixAttrBuffer = function fixAttrBuffer( y )
{
	// Something was wrong, try to fix that now
	console.log( "attrBuffer is fucked up, fixing it now..." ) ;
	
	var currentLineTextLength = this.textBuffer[ y ].length ;
	var currentLineAttrLength = this.attrBuffer[ y ].length ;
	
	if ( currentLineTextLength > currentLineAttrLength )
	{
		this.attrBuffer[ y ] = this.attrBuffer[ y ].concat(
			array.fill( Array( currentLineTextLength - currentLineAttrLength ) , this.emptyCellAttr )
		) ;
	}
	else
	{
		this.attrBuffer[ y ] = this.attrBuffer[ y ].slice( 0 , currentLineTextLength ) ;
	}
} ;






/*
	A TextBuffer can only draw to a ScreenBuffer.
	To display it, you need to:
		- draw the TextBuffer to a ScreenBuffer
		- then draw that ScreenBuffer to the terminal
*/
TextBuffer.prototype.draw = function draw( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	// Transmitted options (do not edit the user provided options, clone them)
	var tr = {
		dst: options.dst || this.dst ,
		offsetX: options.x !== undefined ? Math.floor( options.x ) : Math.floor( this.x ) ,
		offsetY: options.y !== undefined ? Math.floor( options.y ) : Math.floor( this.y ) ,
		dstClipRect: options.dstClipRect ? termkit.Rect.create( options.dstClipRect ) : undefined ,
		srcClipRect: options.srcClipRect ? termkit.Rect.create( options.srcClipRect ) : undefined ,
		blending: options.blending ,
		diffOnly: options.diffOnly ,
		wrap: options.wrap ,
		tile: options.tile
	} ;
	
	if ( tr.dst instanceof ScreenBuffer )
	{
		this.blitter( tr ) ;
		
		if ( options.cursor )
		{
			tr.dst.cx = this.cx + tr.offsetX ;
			tr.dst.cy = this.cy + tr.offsetY ;
		}
	}
} ;



TextBuffer.prototype.drawCursor = function drawCursor( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var dst = options.dst || this.dst ;
	
	if ( dst instanceof ScreenBuffer )
	{
		dst.cx = this.cx + this.x ;
		dst.cy = this.cy + this.y ;
	}
} ;



TextBuffer.prototype.blitter = function blitter( p )
{
	var tr , iterator , iteratorCallback ;
	
	// Default options & iterator
	tr = {
		type: 'line' ,
		context: {
			srcTextBuffer: this.textBuffer ,
			srcAttrBuffer: this.attrBuffer ,
			dstBuffer: p.dst.buffer ,
			emptyCellAttr: this.emptyCellAttr
		} ,
		dstRect: termkit.Rect.create( p.dst ) ,
		srcRect: termkit.Rect.create( this ) ,
		dstClipRect: p.dstClipRect || termkit.Rect.create( p.dst ) ,
		srcClipRect: p.srcClipRect || termkit.Rect.create( this ) ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY ,
		wrap: p.wrap ,
		tile: p.tile ,
		multiply: ScreenBuffer.ITEM_SIZE
	} ;
	
	iterator = 'regionIterator' ;
	iteratorCallback = blitterLineIterator ;
	
	/*
	// If blending is on, switch to the cell iterator
	if ( p.blending )
	{
		tr.type = 'cell' ;
		iteratorCallback = blitterCellBlendingIterator ;
	}
	//*/
	
	if ( p.wrap ) { iterator = 'wrapIterator' ; }
	else if ( p.tile ) { iterator = 'tileIterator' ; }
	else { iterator = 'regionIterator' ; }
	
	termkit.Rect[ iterator ]( tr , iteratorCallback ) ;
} ;



function blitterLineIterator( p )
{
	var length , srcX , srcExistingXmax , dstOffset , attrs , attr , str ;
	
	//if ( ! global.deb ) { global.deb = [] ; }
	//global.deb.push( p ) ;
	
	str = p.context.srcTextBuffer[ p.srcY ] || '' ;
	attrs = p.context.srcAttrBuffer[ p.srcY ] || [] ;
	length = str.length ;
	
	srcExistingXmax = p.srcXmax ;
	
	if ( srcExistingXmax > length ) { srcExistingXmax = length ; }
	
	srcX = p.srcXmin ;
	dstOffset = p.dstStart ;
	
	// Write existing chars
	for ( ; srcX < srcExistingXmax ; srcX ++ , dstOffset += ScreenBuffer.ITEM_SIZE )
	{
		attr = attrs[ srcX ] ;
		
		// Write the attributes
		p.context.dstBuffer.writeUInt32BE( attr , dstOffset ) ;
		
		// Write the character
		p.context.dstBuffer.write( str[ srcX ] , dstOffset + ScreenBuffer.ATTR_SIZE , ScreenBuffer.CHAR_SIZE ) ;
	}
	
	// Write blank
	// Temp?
	attr = p.context.emptyCellAttr ;
	for ( ; srcX < p.srcXmax ; srcX ++ , dstOffset += ScreenBuffer.ITEM_SIZE )
	{
		// Write the attributes
		p.context.dstBuffer.writeUInt32BE( attr , dstOffset ) ;
		
		// Write the character
		p.context.dstBuffer.write( ' ' , dstOffset + ScreenBuffer.ATTR_SIZE , ScreenBuffer.CHAR_SIZE ) ;
	}
}









// Not sure if blending is actually useful for a TextBuffer
/* Copy of the ScreenBuffer blitter:
function blitterCellBlendingIterator( p )
{
	var blending = p.context.srcBuffer.readUInt32BE( p.srcStart ) & ScreenBuffer.TRANSPARENCY ;
	
	if ( blending === ScreenBuffer.NONE )
	{
		// Fully visible, copy it
		p.context.srcBuffer.copy( p.context.dstBuffer , p.dstStart , p.srcStart , p.srcEnd ) ;
		return ;
	}
	
	if ( blending === ScreenBuffer.TRANSPARENCY )
	{
		// Fully transparent, do nothing
		return ;
	}
	
	
	// Blending part...
	
	if ( ! ( blending & ScreenBuffer.FG_TRANSPARENCY ) )
	{
		// Copy source foreground color
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + 3 ,
			p.srcStart + 3 ,
			p.srcStart + 4
		) ;
	}
	
	if ( ! ( blending & ScreenBuffer.BG_TRANSPARENCY ) )
	{
		// Copy source background color
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + 2 ,
			p.srcStart + 2 ,
			p.srcStart + 3
		) ;
	}
	
	if ( ! ( blending & ScreenBuffer.STYLE_TRANSPARENCY ) )
	{
		// Copy source style
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + 1 ,
			p.srcStart + 1 ,
			p.srcStart + 2
		) ;
	}
	
	if ( ! ( blending & ScreenBuffer.CHAR_TRANSPARENCY ) )
	{
		// Copy source character
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + ScreenBuffer.ATTR_SIZE ,
			p.srcStart + ScreenBuffer.ATTR_SIZE ,
			p.srcEnd
		) ;
	}
}
//*/



