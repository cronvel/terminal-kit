/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2014 Cédric Ronvel 
	
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
var tree = require( 'tree-kit' ) ;
//var async = require( 'async-kit' ) ;
var string = require( 'string-kit' ) ;
var punycode = require( 'punycode' ) ;
var termkit = require( './terminal.js' ) ;



function ScreenBuffer() { throw new Error( 'Cannot create ScreenBuffer object directly.' ) ; }
module.exports = ScreenBuffer ;



/*
	options:
		* width: mandatory
		* height: mandatory
		* dst: default dst
		* x: default position in dst
		* y: default position in dst
		* wrap: default behaviour of .put()
		* noClear: do not call .clear() at ScreenBuffer creation
*/
ScreenBuffer.create = function create( options )
{
	// Manage options
	if ( ! options ) { options = {} ; }
	
	var screenBuffer = Object.create( ScreenBuffer.prototype , {
		// a terminal or another screenBuffer
		dst: { value: options.dst , writeable: true , enumerable: true } ,
		width: { value: options.width || ( options.dst ? options.dst.width : 1 ) , enumerable: true } ,
		height: { value: options.height || ( options.dst ? options.dst.height : 1 ) , enumerable: true } ,
		wrap: { value: options.wrap !== undefined ? options.wrap : true , writable: true , enumerable: true } ,
		x: { writable: true , enumerable: true , value:
			options.x !== undefined ? options.x : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 )
		} ,
		y: { writable: true , enumerable: true , value:
			options.y !== undefined ? options.y : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 )
		} ,
		cx: { value: 0 , writable: true , enumerable: true } ,
		cy: { value: 0 , writable: true , enumerable: true }
	} ) ;
	
	Object.defineProperties( screenBuffer , {
		buffer: { value: new Buffer( screenBuffer.width * screenBuffer.height * ScreenBuffer.ITEM_SIZE ) , enumerable: true } ,
		lineBuffer: { value: new Array( screenBuffer.height ) , enumerable: true }
	} ) ;
	
	if ( ! options.noClear ) { screenBuffer.clear() ; }
	
	return screenBuffer ;
} ;



/*
	options:
		* attr: attributes passed to .put()
		* transparencyChar: a char that is transparent
*/
ScreenBuffer.createFromChars = function createFromChars( options , data )
{
	var x , y , len , attr , attrTrans , width , height , screenBuffer ;
	
	// Manage options
	if ( ! options ) { options = {} ; }
	
	
	if ( typeof data !== 'string' )
	{
		if ( ! data.toString ) { throw new Error( '[terminal] ScreenBuffer.createFromDataString(): argument #1 should be a string or provide a .toString() method.' ) ; }
		data = data.toString() ;
	}
	
	// Transform the data into an array of lines
	data = ScreenBuffer.stripControlChars( data , true ).split( '\n' ) ;
	
	// Compute the buffer size
	width = 0 ;
	height = data.length ;
	attr = ScreenBuffer.object2attr( options.attr ) ;
	attrTrans = attr | ScreenBuffer.TRANSPARENCY ;
	
	for ( y = 0 ; y < data.length ; y ++ )
	{
		if ( data[ y ].length > width ) { width = data[ y ].length ; }
	}
	
	// Create the buffer with the right width & height
	screenBuffer = ScreenBuffer.create( { width: width , height: height } ) ;
	
	// Fill the buffer with data
	for ( y = 0 ; y < data.length ; y ++ )
	{
		if ( ! options.transparencyChar )
		{
			screenBuffer.put( { x: 0 , y: y , attr: attr } , data[ y ] ) ;
		}
		else
		{
			len = data[ y ].length ;
			
			for ( x = 0 ; x < len ; x ++ )
			{
				if ( data[ y ][ x ] === options.transparencyChar )
				{
					screenBuffer.put( { x: x , y: y , attr: attrTrans } , data[ y ][ x ] ) ;
				}
				else
				{
					screenBuffer.put( { x: x , y: y , attr: attr } , data[ y ][ x ] ) ;
				}
			}
		}
	}
	
	return screenBuffer ;
} ;



ScreenBuffer.prototype.clear = function clear()
{
	//this.buffer.fill( 0 ) ; return this ;
	
	var i , length = this.width * this.height ;
	
	for ( i = 0 ; i < length ; i ++ )
	{
		ScreenBuffer.CLEAR_BUFFER.copy( this.buffer , i * ScreenBuffer.ITEM_SIZE ) ;
	}
	
	return this ;
} ;



/*
	options:
		* x: bypass this.cx
		* y: bypass this.cy
		* 
*/
ScreenBuffer.prototype.put = function put( options , str )
{
	var x , y , attr , i , offset ;
	var characters = punycode.ucs2.decode( str ) ;
	var len = characters.length ;
	
	
	// Manage options
	if ( ! options ) { options = {} ; }
	
	x = options.x !== undefined ? options.x : this.cx ;
	y = options.y !== undefined ? options.y : this.cy ;
	
	if ( typeof x !== 'number' || x < 0 ) { x = 0 ; }
	else if ( x >= this.width ) { x = this.width - 1 ; }
	else { x = Math.floor( x ) ; }
	
	if ( typeof y !== 'number' || y < 0 ) { y = 0 ; }
	else if ( y >= this.height ) { y = this.height - 1 ; }
	else { y = Math.floor( y ) ; }
	
	attr = options.attr !== undefined ? options.attr : ScreenBuffer.DEFAULT_ATTR ;
	
	if ( attr && typeof attr === 'object' ) { attr = ScreenBuffer.object2attr( attr ) ; }
	if ( typeof attr !== 'number' ) { attr = ScreenBuffer.DEFAULT_ATTR ; }
	
	// Process the input string
	if ( arguments.length > 2 ) { str = string.format.call( undefined , Array.prototype.slice.apply( arguments , 1 ) ) ; }
	str = ScreenBuffer.stripControlChars( str ) ;
	
	this.lineBuffer[ y ] = undefined ;	// this line should be invalidated in the lineBuffer
	
	for ( i = 0 ; i < len ; i ++ )
	{
		offset = ( y * this.width + x ) * ScreenBuffer.ITEM_SIZE ;
		
		// Write the attributes
		this.buffer.writeUInt32LE( attr , offset ) ;
		
		// Write the character
		this.buffer.write( punycode.ucs2.encode( [ characters[ i ] ] ) , offset + ScreenBuffer.ATTR_SIZE , ScreenBuffer.CHAR_SIZE ) ;
		
		x ++ ;
		
		if ( x >= this.width )
		{
			if ( ! this.wrap ) { break ; }
			
			x = 0 ;
			y ++ ;
			
			if ( y >= this.height ) { break ; }
			
			this.lineBuffer[ y ] = undefined ;	// this line should be invalidated in the lineBuffer
		}
	}
	
	this.cx = x ;
	this.cy = y ;
	
	return ;
} ;



ScreenBuffer.prototype.draw = function draw( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	// Transmitted options (do not edit the user provided options)
	var trOptions = {
		dst: options.dst || this.dst ,
		x: options.x !== undefined ? options.x : this.x ,
		y: options.y !== undefined ? options.y : this.y ,
		dstRect: options.dstRect ,
		srcRect: options.srcRect ,
		transparency: options.transparency ,
		wrapX: options.wrapX ,
		wrapY: options.wrapY
	} ;
	
	if ( trOptions.dst instanceof ScreenBuffer )
	{
		if ( trOptions.transparency ) { return this.draw2bufferSP( trOptions ) ; }
		else { return this.draw2buffer( trOptions ) ; }
	}
	else if ( trOptions.dst instanceof termkit.Terminal )
	{
		return this.draw2terminal( trOptions ) ;
	}
	else { return false ; }
} ;



ScreenBuffer.prototype.draw2terminal = function draw2terminal( options )
{
	var x , y , xmin , xmax , ymin , ymax , offset , line , attr , lastAttr ;
	var nfterm = options.dst.noFormat ;	// no format term (faster)
	
	// min & max in the buffer coordinate
	xmin = Math.max( 0 , 1 - options.x ) ;
	xmax = Math.min( this.width - 1 , options.dst.width - options.x ) ;
	ymin = Math.max( 0 , 1 - options.y ) ;
	ymax = Math.min( this.height - 1 , options.dst.height - options.y ) ;
	
	if ( xmax < xmin || ymax < ymin ) { return ; }
	
	for ( y = ymin ; y <= ymax ; y ++ )
	{
		line = '' ;
		
		for ( x = xmin ; x <= xmax ; x ++ )
		{
			offset = ( y * this.width + x ) * ScreenBuffer.ITEM_SIZE ;
			attr = this.buffer.readUInt32LE( offset ) ;
			
			if ( attr !== lastAttr )
			{
				line += ScreenBuffer.generateEscapeSequence( options.dst , attr ) ;
				lastAttr = attr ;
			}
			
			line += ScreenBuffer.readChar( this.buffer , offset + ScreenBuffer.ATTR_SIZE ) ;
		}
		
		nfterm.moveTo( xmin + options.x , y + options.y , line ) ;
	}
} ;



ScreenBuffer.Rect = function Rect() { throw new Error( '[terminal] Cannot create a ScreenBuffer.Rect directly, use ScreenBuffer.Rect.create() instead.' ) ; } ;


/*
	new Rect( xmin , ymin , xmax , ymax )
	new Rect( object ) having properties: xmin , ymin , xmax , ymax
	new Rect( Terminal )
	new Rect( ScreenBuffer )
*/
ScreenBuffer.Rect.create = function createRect( src )
{
	var rect = Object.create( ScreenBuffer.Rect.prototype ) ;
	
	if ( src && ( typeof src === 'object' || typeof src === 'function' ) )
	{
		if ( src instanceof termkit.Terminal )
		{
			rect.xmin = 1 ;
			rect.ymin = 1 ;
			rect.xmax = src.width ;
			rect.ymax = src.height ;
		}
		else if ( src instanceof ScreenBuffer )
		{
			rect.xmin = 0 ;
			rect.ymin = 0 ;
			rect.xmax = src.width - 1 ;
			rect.ymax = src.height - 1 ;
		}
		else
		{
			rect.xmin = src.xmin || 0 ;
			rect.ymin = src.ymin || 0 ;
			rect.xmax = src.xmax || 1 ;
			rect.ymax = src.ymax || 1 ;
		}
	}
	else
	{
		rect.xmin = arguments[ 0 ] || 0 ;
		rect.ymin = arguments[ 1 ] || 0 ;
		rect.xmax = arguments[ 2 ] || 1 ;
		rect.ymax = arguments[ 3 ] || 1 ;
	}
	
	rect.isNull = rect.xmin > rect.xmax || rect.ymin > rect.ymax ;
	
	return rect ;
}



// It makes dst & src rectangle match themselves,
// offset* are offset of the srcRect into the dst coordinate system
ScreenBuffer.Rect.prototype.adjustToSrc = function adjustToSrc( srcRect , offsetX , offsetY , modifySrc )
{
	var dstRect = this ;
	
	offsetX = offsetX || 0 ;
	offsetY = offsetY || 0 ;
	
	dstRect.xmin = Math.max( dstRect.xmin , srcRect.xmin + offsetX ) ;
	dstRect.ymin = Math.max( dstRect.ymin , srcRect.ymin + offsetY ) ;
	dstRect.xmax = Math.min( dstRect.xmax , srcRect.xmax + offsetX ) ;
	dstRect.ymax = Math.min( dstRect.ymax , srcRect.ymax + offsetY ) ;
	dstRect.isNull = dstRect.xmin > dstRect.xmax || dstRect.ymin > dstRect.ymax ;
	
	if ( ! modifySrc ) { return this ; }
	
	srcRect.xmin = Math.max( srcRect.xmin , dstRect.xmin - offsetX ) ;
	srcRect.ymin = Math.max( srcRect.ymin , dstRect.ymin - offsetY ) ;
	srcRect.xmax = Math.min( srcRect.xmax , dstRect.xmax - offsetX ) ;
	srcRect.ymax = Math.min( srcRect.ymax , dstRect.ymax - offsetY ) ;
	srcRect.isNull = srcRect.xmin > srcRect.xmax || srcRect.ymin > srcRect.ymax ;
	
	return this ;
} ;



ScreenBuffer.prototype.draw2buffer = function draw2buffer( options )
{
	// All coordinates are now expressed in the dst coordinate system
	var dst = options.dst , dstRect = ScreenBuffer.Rect.create( dst ) ;
	if ( options.dstRect instanceof ScreenBuffer.Rect ) { dstRect.adjustToSrc( options.dstRect ) ; }
	
	var src = this , srcRect = ScreenBuffer.Rect.create( src ) ;
	if ( options.srcRect instanceof ScreenBuffer.Rect ) { srcRect.adjustToSrc( options.srcRect ) ; }
	
	// Mutual adjustement
	dstRect.adjustToSrc( srcRect , options.x , options.y , true ) ;
	
	process.exit() ;
	
	
	var y , xmin , xmax , ymin , ymax , start , end , dstStart ;
	
	// Disable wrapping if the current object is bigger than the dst: this wouldn't make any sense
	if ( options.wrapX && this.width > options.dst.width ) { options.wrapX = false ; }
	if ( options.wrapY && this.height > options.dst.height ) { options.wrapY = false ; }
	
	// If out of bounds, return now
	if ( options.x >= dst.width || - options.x >= this.width ) { return ; }
	if ( options.y >= dst.height || - options.y >= this.height ) { return ; }
	
	dstXmin = Math.max( options.x , 0 ) ;
	dstXmax = Math.min( options.x + this.width - 1 , options.dst.width - 1 ) ;
	xlen = dstXmax - dstXmin ;
	dstYmin = Math.max( options.y , 0 ) ;
	dstYmax = Math.min( options.y + this.height - 1 , options.dst.height - 1 ) ;
	ylen = ymax - ymin ;
	
	// min & max in the current buffer coordinate
	/*
	xmin = Math.max( 0 , - options.x ) ;
	xmax = Math.min( this.width - 1 , options.dst.width - 1 - options.x ) ;
	ymin = Math.max( 0 , - options.y ) ;
	ymax = Math.min( this.height - 1 , options.dst.height - 1 - options.y ) ;
	
	if ( xmax < xmin || ymax < ymin ) { return ; }
	//console.error( 'draw2buffer region' , xmin , xmax , ymin , ymax ) ;
	*/
	
	
	for ( y = ymin ; y <= ymax ; y ++ )
	{
		start = ( y * this.width + xmin ) * ScreenBuffer.ITEM_SIZE ;
		end = ( y * this.width + xmax + 1 ) * ScreenBuffer.ITEM_SIZE ;
		dstStart = ( ( y + options.y ) * options.dst.width + xmin + options.x ) * ScreenBuffer.ITEM_SIZE ;
		
		//console.error( 'draw2buffer copy' , dstStart , start , end ) ;
		
		this.buffer.copy( options.dst.buffer , dstStart , start , end ) ;
	}
} ;



ScreenBuffer.prototype.draw2buffer_ = function draw2buffer( options )
{
	var y , xmin , xmax , ymin , ymax , start , end , dstStart ;
	
	// min & max in the current buffer coordinate
	xmin = Math.max( 0 , - options.x ) ;
	xmax = Math.min( this.width - 1 , options.dst.width - 1 - options.x ) ;
	ymin = Math.max( 0 , - options.y ) ;
	ymax = Math.min( this.height - 1 , options.dst.height - 1 - options.y ) ;
	
	if ( xmax < xmin || ymax < ymin ) { return ; }
	//console.error( 'draw2buffer region' , xmin , xmax , ymin , ymax ) ;
	
	for ( y = ymin ; y <= ymax ; y ++ )
	{
		start = ( y * this.width + xmin ) * ScreenBuffer.ITEM_SIZE ;
		end = ( y * this.width + xmax + 1 ) * ScreenBuffer.ITEM_SIZE ;
		dstStart = ( ( y + options.y ) * options.dst.width + xmin + options.x ) * ScreenBuffer.ITEM_SIZE ;
		
		//console.error( 'draw2buffer copy' , dstStart , start , end ) ;
		
		this.buffer.copy( options.dst.buffer , dstStart , start , end ) ;
	}
} ;



ScreenBuffer.prototype.draw2bufferSP = function draw2bufferSP( options )
{
	var x , y , xmin , xmax , ymin , ymax , start , end , dstStart ;
	
	// min & max in the buffer coordinate
	xmin = Math.max( 0 , - options.x ) ;
	xmax = Math.min( this.width - 1 , options.dst.width - 1 - options.x ) ;
	ymin = Math.max( 0 , - options.y ) ;
	ymax = Math.min( this.height - 1 , options.dst.height - 1 - options.y ) ;
	
	if ( xmax < xmin || ymax < ymin ) { return ; }
	//console.error( 'draw2bufferSP region' , xmin , xmax , ymin , ymax ) ;
	
	for ( y = ymin ; y <= ymax ; y ++ )
	{
		for ( x = xmin ; x <= xmax ; x ++ )
		{
			start = ( y * this.width + x ) * ScreenBuffer.ITEM_SIZE ;
			end = start + ScreenBuffer.ITEM_SIZE ;
			dstStart = ( ( y + options.y ) * options.dst.width + x + options.x ) * ScreenBuffer.ITEM_SIZE ;
			
			//console.error( 'draw2bufferSP copy' , dstStart , start , end ) ;
			
			if ( ! ( this.buffer.readUInt32LE( start ) & ScreenBuffer.TRANSPARENCY ) )
			{
				this.buffer.copy( options.dst.buffer , dstStart , start , end ) ;
			}
		}
	}
} ;



ScreenBuffer.prototype.dumpChars = function dumpChars()
{
	var y , x , offset ;
	
	process.stdout.write( '\nDumping the buffer (characters only):\n' ) ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		process.stdout.write( y + ' > ' ) ;
		
		for ( x = 0 ; x < this.width ; x ++ )
		{
			offset = ( y * this.width + x ) * ScreenBuffer.ITEM_SIZE ;
			//process.stdout.write( this.buffer.toString( 'utf8' , offset + ScreenBuffer.ATTR_SIZE , offset + ScreenBuffer.ITEM_SIZE )[ 0 ] ) ;
			process.stdout.write( ScreenBuffer.readChar( this.buffer , offset + ScreenBuffer.ATTR_SIZE ) ) ;
		}
		
		process.stdout.write( '\n' ) ;
	}
	
} ;



ScreenBuffer.prototype.dump = function dump()
{
	var y , x , offset ;
	
	process.stdout.write( '\nDumping the buffer (attributes + characters):\n' ) ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		process.stdout.write( y + ' > ' ) ;
		
		for ( x = 0 ; x < this.width ; x ++ )
		{
			offset = ( y * this.width + x ) * ScreenBuffer.ITEM_SIZE ;
			process.stdout.write( string.format( '%x%x%x%x ' ,
				this.buffer.readUInt8( offset + 3 ) ,
				this.buffer.readUInt8( offset + 2 ) ,
				this.buffer.readUInt8( offset + 1 ) ,
				this.buffer.readUInt8( offset )
			) ) ;
			
			// Issue with character bigger than 16bits, javascript is more like UCS-2 than UTF-16
			//process.stdout.write( this.buffer.toString( 'utf8' , offset + ScreenBuffer.ATTR_SIZE , offset + ScreenBuffer.ITEM_SIZE )[ 0 ] + ' ' ) ;
			process.stdout.write( ScreenBuffer.readChar( this.buffer , offset + ScreenBuffer.ATTR_SIZE ) + ' ' ) ;
		}
		
		process.stdout.write( '\n' ) ;
	}
	
} ;





			/* "static" functions */



ScreenBuffer.readChar = function readChar( buffer , at )
{
	var bytes ;
	
	if ( buffer[ at ] < 0x80 ) { bytes = 1 ; }
	else if ( buffer[ at ] < 0xc0 ) { return '\x00' ; } // We are in a middle of an unicode multibyte sequence... something was wrong...
	else if ( buffer[ at ] < 0xe0 ) { bytes = 2 ; }
	else if ( buffer[ at ] < 0xf0 ) { bytes = 3 ; }
	else if ( buffer[ at ] < 0xf8 ) { bytes = 4 ; }
	else if ( buffer[ at ] < 0xfc ) { bytes = 5 ; }
	else { bytes = 6 ; }
	
	if ( bytes > ScreenBuffer.CHAR_SIZE ) { return '\x00' ; }
	
	return buffer.toString( 'utf8' , at , at + bytes ) ;
} ;



ScreenBuffer.attr2object = function attr2object( attr )
{
	var object = {} ;
	
	object.color = attr & 255 ;
	object.bgColor = ( attr >> 8 ) & 255 ;
	
	// style part
	if ( attr & ScreenBuffer.BOLD ) { object.bold = true ; }
	if ( attr & ScreenBuffer.DIM ) { object.dim = true ; }
	if ( attr & ScreenBuffer.ITALIC ) { object.italic = true ; }
	if ( attr & ScreenBuffer.UNDERLINE ) { object.underline = true ; }
	if ( attr & ScreenBuffer.BLINK ) { object.blink = true ; }
	if ( attr & ScreenBuffer.INVERSE ) { object.inverse = true ; }
	if ( attr & ScreenBuffer.HIDDEN ) { object.hidden = true ; }
	if ( attr & ScreenBuffer.STRIKE ) { object.strike = true ; }
	
	// special part
	if ( attr & ScreenBuffer.TRANSPARENCY ) { object.transparency = true ; }
	
	return object ;
} ;



ScreenBuffer.object2attr = function object2attr( object )
{
	var attr = 0 ;
	
	if ( ! object || typeof object !== 'object' ) { object = {} ; }
	
	// color part
	if ( typeof object.color === 'string' ) { object.color = ScreenBuffer.color2index( object.color ) ; }
	if ( typeof object.color !== 'number' || object.color < 0 || object.color > 255 ) { object.color = 7 ; }
	else { object.color = Math.floor( object.color ) ; }
	
	attr += object.color ;
	
	// bgColor part
	if ( typeof object.bgColor === 'string' ) { object.bgColor = ScreenBuffer.color2index( object.bgColor ) ; }
	if ( typeof object.bgColor !== 'number' || object.bgColor < 0 || object.bgColor > 255 ) { object.bgColor = 0 ; }
	else { object.bgColor = Math.floor( object.bgColor ) ; }
	
	attr += object.bgColor << 8 ;
	
	// style part
	if ( object.bold ) { attr |= ScreenBuffer.BOLD ; }
	if ( object.dim ) { attr |= ScreenBuffer.DIM ; }
	if ( object.italic ) { attr |= ScreenBuffer.ITALIC ; }
	if ( object.underline ) { attr |= ScreenBuffer.UNDERLINE ; }
	if ( object.blink ) { attr |= ScreenBuffer.BLINK ; }
	if ( object.inverse ) { attr |= ScreenBuffer.INVERSE ; }
	if ( object.hidden ) { attr |= ScreenBuffer.HIDDEN ; }
	if ( object.strike ) { attr |= ScreenBuffer.STRIKE ; }
	
	// special part
	if ( object.transparency ) { attr |= ScreenBuffer.TRANSPARENCY ; }
	
	return attr ;
} ;



ScreenBuffer.color2index = function color2index( color )
{
	switch ( color.toLowerCase() )
	{
		case 'black' : return 0 ;
		case 'red' : return 1 ;
		case 'green' : return 2 ;
		case 'yellow' : return 3 ;
		case 'blue' : return 4 ;
		case 'magenta' : return 5 ;
		case 'cyan' : return 6 ;
		case 'white' : return 7 ;
		case 'brightblack' : return 8 ;
		case 'brightred' : return 9 ;
		case 'brightgreen' : return 10 ;
		case 'brightyellow' : return 11 ;
		case 'brightblue' : return 12 ;
		case 'brightmagenta' : return 13 ;
		case 'brightcyan' : return 14 ;
		case 'brightwhite' : return 15 ;
		default : return undefined ;
	}
} ;



ScreenBuffer.generateEscapeSequence = function generateEscapeSequence( term , attr )
{
	var color = attr & 255 ;
	var bgColor = ( attr >> 8 ) & 255 ;
	
	var esc = term.str.styleReset.color.bgColor( color , bgColor ) ;
	
	// style part
	if ( attr & ScreenBuffer.BOLD ) { esc += term.str.bold() ; }
	if ( attr & ScreenBuffer.DIM ) { esc += term.str.dim() ; }
	if ( attr & ScreenBuffer.ITALIC ) { esc += term.str.italic() ; }
	if ( attr & ScreenBuffer.UNDERLINE ) { esc += term.str.underline() ; }
	if ( attr & ScreenBuffer.BLINK ) { esc += term.str.blink() ; }
	if ( attr & ScreenBuffer.INVERSE ) { esc += term.str.inverse() ; }
	if ( attr & ScreenBuffer.HIDDEN ) { esc += term.str.hidden() ; }
	if ( attr & ScreenBuffer.STRIKE ) { esc += term.str.strike() ; }
	
	return esc ;
} ;



// Strip all control chars, if newline is true, only newline control chars are preserved
ScreenBuffer.stripControlChars = function stripControlChars( str , newline ) {
	if ( newline ) { return str.replace( /[\x00-\x09\x0b-\x1f\x7f]/g , '' ) ; }
	else { return str.replace( /[\x00-\x1f\x7f]/g , '' ) ; }
} ;





			/* Constants */



ScreenBuffer.ATTR_SIZE = 4 ;	// do not edit, everything use Buffer.writeUInt32LE()
ScreenBuffer.CHAR_SIZE = 4 ;
ScreenBuffer.ITEM_SIZE = ScreenBuffer.ATTR_SIZE + ScreenBuffer.CHAR_SIZE ;

ScreenBuffer.DEFAULT_ATTR = ScreenBuffer.object2attr( { color: 'white' , bgColor: 'black' } ) ;
ScreenBuffer.CLEAR_ATTR = ScreenBuffer.object2attr( { color: 'white' , bgColor: 'black' , transparency: true } ) ;
ScreenBuffer.CLEAR_BUFFER = new Buffer( ScreenBuffer.ITEM_SIZE ) ;
ScreenBuffer.CLEAR_BUFFER.writeUInt32LE( ScreenBuffer.DEFAULT_ATTR , 0 ) ;
ScreenBuffer.CLEAR_BUFFER.write( ' \x00\x00\x00' , ScreenBuffer.ATTR_SIZE ) ;	// space



// Style mask
ScreenBuffer.BOLD = 1 << 16 ;
ScreenBuffer.DIM = 2 << 16 ;
ScreenBuffer.ITALIC = 4 << 16 ;
ScreenBuffer.UNDERLINE = 8 << 16 ;
ScreenBuffer.BLINK = 16 << 16 ;
ScreenBuffer.INVERSE = 32 << 16 ;
ScreenBuffer.HIDDEN = 64 << 16 ;
ScreenBuffer.STRIKE = 128 << 16 ;



// Special mask
ScreenBuffer.UPDATED = 1 << 24 ;
ScreenBuffer.TRANSPARENCY = 2 << 24 ;






