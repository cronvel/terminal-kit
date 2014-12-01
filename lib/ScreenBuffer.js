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
//var tree = require( 'tree-kit' ) ;
//var async = require( 'async-kit' ) ;
var fs = require( 'fs' ) ;
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
		dst: { value: options.dst , writable: true , enumerable: true } ,
		width: { enumerable: true , configurable: true ,
			value: Math.floor( options.width ) || ( options.dst ? options.dst.width : 1 )
		} ,
		height: { enumerable: true , configurable: true ,
			value: Math.floor( options.height ) || ( options.dst ? options.dst.height : 1 )
		} ,
		x: { writable: true , enumerable: true , value:
			options.x !== undefined ? options.x : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 )
		} ,
		y: { writable: true , enumerable: true , value:
			options.y !== undefined ? options.y : ( options.dst && options.dst instanceof termkit.Terminal ? 1 : 0 )
		} ,
		cx: { value: 0 , writable: true , enumerable: true } ,
		cy: { value: 0 , writable: true , enumerable: true } ,
		
		// Remove?
		wrap: { value: options.wrap !== undefined ? options.wrap : true , writable: true , enumerable: true }
	} ) ;
	
	Object.defineProperties( screenBuffer , {
		buffer: { enumerable: true , configurable: true ,
			value: new Buffer( screenBuffer.width * screenBuffer.height * ScreenBuffer.ITEM_SIZE ) 
		} ,
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
	
	attrTrans = attr ;
	if ( options.transparencyChar )
	{
		if ( ! options.transparencyType ) { attrTrans |= ScreenBuffer.TRANSPARENCY ; }
		else { attrTrans |= options.transparencyType & ScreenBuffer.TRANSPARENCY ; }
	}
	
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



ScreenBuffer.prototype.clear = function clear( options )
{
	//this.buffer.fill( 0 ) ; return this ;
	
	var i , clearBuffer , attr , char , length = this.width * this.height ;
	
	if ( ! options || typeof options !== 'object' ) 
	{
		clearBuffer = ScreenBuffer.CLEAR_BUFFER ;
	}
	else
	{
		clearBuffer = new Buffer( ScreenBuffer.ITEM_SIZE ) ;
		
		// Write the attributes
		attr = options.attr !== undefined ? options.attr : ScreenBuffer.DEFAULT_ATTR ;
		if ( attr && typeof attr === 'object' ) { attr = ScreenBuffer.object2attr( attr ) ; }
		if ( typeof attr !== 'number' ) { attr = ScreenBuffer.DEFAULT_ATTR ; }
		clearBuffer.writeUInt32LE( attr , 0 ) ;
		
		// Write the character
		char = options.char && typeof options.char === 'string' ? options.char : ' ' ;
		char = punycode.ucs2.encode( [ punycode.ucs2.decode( ScreenBuffer.stripControlChars( char ) )[ 0 ] ] ) ;
		clearBuffer.write( char , ScreenBuffer.ATTR_SIZE , ScreenBuffer.CHAR_SIZE ) ;
	}
	
	for ( i = 0 ; i < length ; i ++ )
	{
		clearBuffer.copy( this.buffer , i * ScreenBuffer.ITEM_SIZE ) ;
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
	var i , x , y , attr , characters , len , offset ;
	
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
	
	
	// Process arguments
	attr = options.attr !== undefined ? options.attr : ScreenBuffer.DEFAULT_ATTR ;
	
	if ( attr && typeof attr === 'object' ) { attr = ScreenBuffer.object2attr( attr ) ; }
	if ( typeof attr !== 'number' ) { attr = ScreenBuffer.DEFAULT_ATTR ; }
	
	
	// Process the input string
	if ( typeof str !== 'string' )
	{
		if ( str.toString ) { str = str.toString() ; }
		else { return ; }
	}
	
	if ( arguments.length > 2 ) { str = string.format.apply( undefined , Array.prototype.slice.call( arguments , 1 ) ) ; }
	str = ScreenBuffer.stripControlChars( str ) ;
	
	characters = punycode.ucs2.decode( str ) ;
	len = characters.length ;
	
	
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
	
	// Transmitted options (do not edit the user provided options, clone them)
	var tr = {
		dst: options.dst || this.dst ,
		offsetX: options.x !== undefined ? Math.floor( options.x ) : Math.floor( this.x ) ,
		offsetY: options.y !== undefined ? Math.floor( options.y ) : Math.floor( this.y ) ,
		dstClipRect: options.dstClipRect ? Rect.create( options.dstClipRect ) : undefined ,
		srcClipRect: options.srcClipRect ? Rect.create( options.srcClipRect ) : undefined ,
		blending: options.blending ,
		diffOnly: options.diffOnly ,
		wrap: options.wrap ,
		tile: options.tile
	} ;
	
	if ( tr.dst instanceof ScreenBuffer )
	{
		return this.blitter( tr ) ;
	}
	else if ( tr.dst instanceof termkit.Terminal )
	{
		return this.terminalBlitter( tr ) ;
	}
	else { return false ; }
} ;



ScreenBuffer.prototype.blitter = function blitter( p )
{
	var tr , iterator , iteratorCallback ;
	
	// Default options & iterator
	tr = {
		type: 'line' ,
		context: { srcBuffer: this.buffer , dstBuffer: p.dst.buffer } ,
		dstRect: Rect.create( p.dst ) ,
		srcRect: Rect.create( this ) ,
		dstClipRect: p.dstClipRect || Rect.create( p.dst ) ,
		srcClipRect: p.srcClipRect || Rect.create( this ) ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY ,
		wrap: p.wrap ,
		tile: p.tile ,
		multiply: ScreenBuffer.ITEM_SIZE
	} ;
	
	iterator = 'regionIterator' ;
	iteratorCallback = blitterLineIterator ;
	
	
	// If blending is on, turn to the cell iterator
	if ( p.blending )
	{
		tr.type = 'cell' ;
		iteratorCallback = blitterCellBlendingIterator ;
	}
	
	if ( p.wrap ) { iterator = 'wrapIterator' ; }
	else if ( p.tile ) { iterator = 'tileIterator' ; }
	else { iterator = 'regionIterator' ; }
	
	Rect[ iterator ]( tr , iteratorCallback ) ;
} ;



ScreenBuffer.prototype.resize = function resize( fromRect )
{
	// Do not reference directly the userland variable, clone it
	fromRect = Rect.create( fromRect ) ;
	
	// Create the toRect region
	toRect = Rect.create( {
		xmin: 0 ,
		ymin: 0 ,
		xmax: fromRect.xmax - fromRect.xmin ,
		ymax: fromRect.ymax - fromRect.ymin
	} ) ;
	
	fromRect.clip( Rect.create( this ) ) ;
	
	// Generate a new buffer
	resizedBuffer = new Buffer( toRect.width * toRect.height * ScreenBuffer.ITEM_SIZE ) ;
	
	// We use the blit to reconstruct the buffer geometry
	Rect.regionIterator( {
		type: 'line' ,
		context: { srcBuffer: this.buffer , dstBuffer: resizedBuffer } ,
		dstRect: toRect ,
		dstClipRect: toRect ,
		srcRect: Rect.create( this ) ,
		srcClipRect: fromRect ,
		offsetX: 0 ,
		offsetY: 0 ,
		multiply: ScreenBuffer.ITEM_SIZE
	} , blitterLineIterator ) ;
	
	// Now, we have to replace the old buffer with the new, and set the width & height
	Object.defineProperties( this , {
		width: { value: toRect.width , enumerable: true , configurable: true } ,
		height: { value: toRect.height , enumerable: true , configurable: true } ,
		buffer: { value: resizedBuffer , enumerable: true , configurable: true }
	} ) ;
} ;



// Please V8, lend me your force, may the function inlining be with me!
function blitterLineIterator( p )
{
	p.context.srcBuffer.copy( p.context.dstBuffer , p.dstStart , p.srcStart , p.srcEnd ) ;
}



// Please V8, lend me your force, may the function inlining be with me!
function blitterCellBlendingIterator( p )
{
	var blending = p.context.srcBuffer.readUInt32LE( p.srcStart ) & ScreenBuffer.TRANSPARENCY ;
	
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
		// Warning: Little endian is in use!
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart ,
			p.srcStart ,
			p.srcStart + 1
		) ;
	}
	
	if ( ! ( blending & ScreenBuffer.BG_TRANSPARENCY ) )
	{
		// Copy source background color
		// Warning: Little endian is in use!
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + 1 ,
			p.srcStart + 1 ,
			p.srcStart + 2
		) ;
	}
	
	if ( ! ( blending & ScreenBuffer.STYLE_TRANSPARENCY ) )
	{
		// Copy source style
		// Warning: Little endian is in use!
		p.context.srcBuffer.copy(
			p.context.dstBuffer ,
			p.dstStart + 2 ,
			p.srcStart + 2 ,
			p.srcStart + 3
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



ScreenBuffer.prototype.terminalBlitter = function terminalBlitter( p )
{
	var tr , iterator , iteratorCallback , context ;
	
	iteratorCallback = terminalBlitterLineIterator ;
	
	context = {
		srcBuffer: this.buffer ,
		term: p.dst ,
		nfterm: p.dst.noFormat ,
		lastAttr: undefined ,
		sequence: '' ,
		cells: 0 ,
		moves: 0 ,
		attrs: 0 ,
		writes: 0
	} ;
	
	// Default options & iterator
	tr = {
		type: 'line' ,
		context: context ,
		dstRect: Rect.create( p.dst ) ,
		srcRect: Rect.create( this ) ,
		dstClipRect: p.dstClipRect ,
		srcClipRect: p.srcClipRect ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY ,
		multiply: ScreenBuffer.ITEM_SIZE
	} ;
	
	if ( p.diffOnly )
	{
		iteratorCallback = terminalBlitterCellIterator ;
		tr.type = 'cell' ;
		
		if ( ! this.lastBuffer || this.lastBuffer.length !== this.buffer.length )
		{
			this.lastBuffer = new Buffer( this.buffer.length ) ;
		}
		
		context.srcLastBuffer = this.lastBuffer ;
	}
	
	if ( p.wrap ) { iterator = 'wrapIterator' ; }
	else if ( p.tile ) { iterator = 'tileIterator' ; }
	else { iterator = 'regionIterator' ; }
	
	Rect[ iterator ]( tr , iteratorCallback ) ;
	
	// Write remaining sequence
	if ( context.sequence.length ) { context.nfterm( context.sequence ) ; context.writes ++ ; }
	
	// Copy buffer to lastBuffer
	if ( p.diffOnly ) { this.buffer.copy( this.lastBuffer ) ; }
	
	// Return some stats back to the callee
	return {
		cells: context.cells ,
		moves: context.moves ,
		attrs: context.attrs ,
		writes: context.writes
	} ;
} ;



// Please V8, lend me your force, may the function inlining be with me!
function terminalBlitterLineIterator( p )
{
	var offset , attr ;
	
	p.context.sequence += p.context.nfterm.str.moveTo( p.dstXmin , p.dstY ) ;
	p.context.moves ++ ;
	
	for ( offset = p.srcStart ; offset < p.srcEnd ; offset += ScreenBuffer.ITEM_SIZE )
	{
		attr = p.context.srcBuffer.readUInt32LE( offset ) ;
		
		if ( attr !== p.context.lastAttr )
		{
			p.context.sequence += ScreenBuffer.generateEscapeSequence( p.context.term , attr ) ;
			p.context.lastAttr = attr ;
			p.context.attrs ++ ;
		}
		
		p.context.sequence += ScreenBuffer.readChar( p.context.srcBuffer , offset + ScreenBuffer.ATTR_SIZE ) ;
		p.context.cells ++ ;
	}
	
	// Output buffering saves a good amount of CPU usage both for the node's processus and the terminal processus
	if ( p.context.sequence.length > ScreenBuffer.OUTPUT_THRESHOLD )
	{
		p.context.nfterm( p.context.sequence ) ;
		p.context.sequence = '' ;
		p.context.writes ++ ;
	}
}



// Please V8, lend me your force, may the function inlining be with me!
function terminalBlitterCellIterator( p )
{
	var attr = p.context.srcBuffer.readUInt32LE( p.srcStart ) ;
	
	// If last buffer's cell === current buffer's cell, no need to refresh... skip that now
	if (
		attr ===
			p.context.srcLastBuffer.readUInt32LE( p.srcStart ) &&
		p.context.srcBuffer.readUInt32LE( p.srcStart + ScreenBuffer.ATTR_SIZE ) ===
			p.context.srcLastBuffer.readUInt32LE( p.srcStart + ScreenBuffer.ATTR_SIZE ) )
	{
		return ;
	}
	
	p.context.srcBuffer.copy( p.context.srcLastBuffer , p.srcStart , p.srcStart , p.srcEnd ) ;
	
	p.context.cells ++ ;
	
	if ( p.dstX !== p.context.cx || p.dstY !== p.context.cy )
	{
		p.context.sequence += p.context.nfterm.str.moveTo( p.dstX , p.dstY ) ;
		p.context.moves ++ ;
	}
	
	if ( attr !== p.context.lastAttr )
	{
		p.context.sequence += ScreenBuffer.generateEscapeSequence( p.context.term , attr ) ;
		p.context.lastAttr = attr ;
		p.context.attrs ++ ;
	}
	
	p.context.sequence += ScreenBuffer.readChar( p.context.srcBuffer , p.srcStart + ScreenBuffer.ATTR_SIZE ) ;
	
	// Output buffering saves a good amount of CPU usage both for the node's processus and the terminal processus
	if ( p.context.sequence.length > ScreenBuffer.OUTPUT_THRESHOLD )
	{
		p.context.nfterm( p.context.sequence ) ;
		p.context.sequence = '' ;
		p.context.writes ++ ;
	}
	
	// Next expected cursor position
	p.context.cx = p.dstX + 1 ;
	p.context.cy = p.dstY ;
}



ScreenBuffer.loadSync = function loadSync( filepath )
{
	var content , width , height , size , screenBuffer ;
	
	// Let it crash if nothing found
	content = fs.readFileSync( filepath ) ;
	
	// No header found?
	if ( content.length < ScreenBuffer.HEADER_SIZE ) { throw new Error( 'No header found: this is not a ScreenBuffer file' ) ; }
	
	// See if we have got a 'SB' at the begining of the file
	if ( content[ 0 ] !== 83 || content[ 1 ] !== 66 ) { throw new Error( 'Magic number mismatch: this is not a ScreenBuffer file' ) ; }
	
	// Get the geometry
	width = content.readUInt16LE( 4 ) ;
	height = content.readUInt16LE( 6 ) ;
	
	// Guess the file size
	size = ScreenBuffer.HEADER_SIZE + width * height * ScreenBuffer.ITEM_SIZE ;
	
	// Bad size?
	if ( content.length !== size ) { throw new Error( 'Bad file size: this is not a ScreenBuffer file' ) ; }
	
	// So the file exists, create a canvas based upon it
	screenBuffer = ScreenBuffer.create( {
		width: width ,
		height: height
	} ) ;
	
	content.copy( screenBuffer.buffer , 0 , ScreenBuffer.HEADER_SIZE ) ;
	
	return screenBuffer ;
} ;



ScreenBuffer.prototype.saveSync = function saveSync( filepath )
{
	var content ;
	
	content = new Buffer( ScreenBuffer.HEADER_SIZE + this.buffer.length ) ;
	
	// Clear the header area
	content.fill( 0 , 0 , ScreenBuffer.HEADER_SIZE ) ;
	
	// Write the 'SB' magic number
	content[ 0 ] = 83 ;
	content[ 1 ] = 66 ;
	
	// Set the geometry
	content.writeUInt16LE( this.width , 4 ) ;
	content.writeUInt16LE( this.height , 6 ) ;
	
	this.buffer.copy( content , ScreenBuffer.HEADER_SIZE ) ;
	
	// Let it crash if something bad happens
	fs.writeFileSync( filepath , content ) ;
} ;



ScreenBuffer.prototype.dumpChars = function dumpChars()
{
	var y , x , offset , str = '' ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		for ( x = 0 ; x < this.width ; x ++ )
		{
			offset = ( y * this.width + x ) * ScreenBuffer.ITEM_SIZE ;
			str += ScreenBuffer.readChar( this.buffer , offset + ScreenBuffer.ATTR_SIZE ) ;
		}
		
		str += '\n' ;
	}
	
	return str ;
} ;



ScreenBuffer.prototype.dump = function dump()
{
	var y , x , offset , str = '' ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		for ( x = 0 ; x < this.width ; x ++ )
		{
			offset = ( y * this.width + x ) * ScreenBuffer.ITEM_SIZE ;
			
			str += string.format( '%x%x%x%x ' ,
				this.buffer.readUInt8( offset + 3 ) ,
				this.buffer.readUInt8( offset + 2 ) ,
				this.buffer.readUInt8( offset + 1 ) ,
				this.buffer.readUInt8( offset )
			) ;
			
			str += ScreenBuffer.readChar( this.buffer , offset + ScreenBuffer.ATTR_SIZE ) + ' ' ;
		}
		
		str += '\n' ;
	}
	
	return str ;
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
	
	// Style part
	if ( attr & ScreenBuffer.BOLD ) { object.bold = true ; }
	if ( attr & ScreenBuffer.DIM ) { object.dim = true ; }
	if ( attr & ScreenBuffer.ITALIC ) { object.italic = true ; }
	if ( attr & ScreenBuffer.UNDERLINE ) { object.underline = true ; }
	if ( attr & ScreenBuffer.BLINK ) { object.blink = true ; }
	if ( attr & ScreenBuffer.INVERSE ) { object.inverse = true ; }
	if ( attr & ScreenBuffer.HIDDEN ) { object.hidden = true ; }
	if ( attr & ScreenBuffer.STRIKE ) { object.strike = true ; }
	
	// Blending part
	if ( attr & ScreenBuffer.FG_TRANSPARENCY ) { object.fgTransparency = true ; }
	if ( attr & ScreenBuffer.BG_TRANSPARENCY ) { object.bgTransparency = true ; }
	if ( attr & ScreenBuffer.STYLE_TRANSPARENCY ) { object.styleTransparency = true ; }
	if ( attr & ScreenBuffer.CHAR_TRANSPARENCY ) { object.charTransparency = true ; }
	if ( ( attr & ScreenBuffer.TRANSPARENCY ) === ScreenBuffer.TRANSPARENCY ) { object.transparency = true ; }
	
	return object ;
} ;



ScreenBuffer.object2attr = function object2attr( object )
{
	var attr = 0 ;
	
	if ( ! object || typeof object !== 'object' ) { object = {} ; }
	
	// Color part
	if ( typeof object.color === 'string' ) { object.color = ScreenBuffer.color2index( object.color ) ; }
	if ( typeof object.color !== 'number' || object.color < 0 || object.color > 255 ) { object.color = 7 ; }
	else { object.color = Math.floor( object.color ) ; }
	
	attr += object.color ;
	
	// Background color part
	if ( typeof object.bgColor === 'string' ) { object.bgColor = ScreenBuffer.color2index( object.bgColor ) ; }
	if ( typeof object.bgColor !== 'number' || object.bgColor < 0 || object.bgColor > 255 ) { object.bgColor = 0 ; }
	else { object.bgColor = Math.floor( object.bgColor ) ; }
	
	attr += object.bgColor << 8 ;
	
	// Style part
	if ( object.bold ) { attr |= ScreenBuffer.BOLD ; }
	if ( object.dim ) { attr |= ScreenBuffer.DIM ; }
	if ( object.italic ) { attr |= ScreenBuffer.ITALIC ; }
	if ( object.underline ) { attr |= ScreenBuffer.UNDERLINE ; }
	if ( object.blink ) { attr |= ScreenBuffer.BLINK ; }
	if ( object.inverse ) { attr |= ScreenBuffer.INVERSE ; }
	if ( object.hidden ) { attr |= ScreenBuffer.HIDDEN ; }
	if ( object.strike ) { attr |= ScreenBuffer.STRIKE ; }
	
	// Blending part
	if ( object.transparency ) { attr |= ScreenBuffer.TRANSPARENCY ; }
	if ( object.fgTransparency ) { attr |= ScreenBuffer.FG_TRANSPARENCY ; }
	if ( object.bgTransparency ) { attr |= ScreenBuffer.BG_TRANSPARENCY ; }
	if ( object.styleTransparency ) { attr |= ScreenBuffer.STYLE_TRANSPARENCY ; }
	if ( object.charTransparency ) { attr |= ScreenBuffer.CHAR_TRANSPARENCY ; }
	
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
	
	var esc = term.str.styleReset.color256.bgColor256( color , bgColor ) ;
	//var esc = term.str.bold.dim.italic.underline.blink.inverse.hidden.strike( false ) + term.str.color.bgColor( color , bgColor ) ;
	
	// Style part
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





			/* Rect: rectangular region, clipping, etc */



function Rect() { throw new Error( '[terminal] Cannot create a ScreenBuffer.Rect directly, use ScreenBuffer.Rect.create() instead.' ) ; }
ScreenBuffer.Rect = Rect ;



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
		else if ( src instanceof Rect )
		{
			rect.xmin = src.xmin ;
			rect.ymin = src.ymin ;
			rect.xmax = src.xmax ;
			rect.ymax = src.ymax ;
			
			// Do not updateMeta()
			rect.width = src.width ;
			rect.height = src.height ;
			rect.isNull = src.isNull ;
			return rect ;
		}
		else
		{
			rect.xmin = Math.floor( src.xmin || 0 ) ;
			rect.ymin = Math.floor( src.ymin || 0 ) ;
			rect.xmax = Math.floor( src.xmax || 1 ) ;
			rect.ymax = Math.floor( src.ymax || 1 ) ;
		}
	}
	else
	{
		rect.xmin = Math.floor( arguments[ 0 ] || 0 ) ;
		rect.ymin = Math.floor( arguments[ 1 ] || 0 ) ;
		rect.xmax = Math.floor( arguments[ 2 ] || 1 ) ;
		rect.ymax = Math.floor( arguments[ 3 ] || 1 ) ;
	}
	
	rect.updateMeta() ;
	
	return rect ;
} ;



// Update meta-data: width, height & isNull
Rect.prototype.updateMeta = function updateMeta()
{
	this.width = this.xmax - this.xmin + 1 ;
	this.height = this.ymax - this.ymin + 1 ;
	this.isNull = this.width <= 0 || this.height <= 0 ;
} ;



// Clip the src according to the dst, offset* are offsets of the srcRect relative to the dst coordinate system
Rect.prototype.clip = function clip( dstRect , offsetX , offsetY , dstClipping )
{
	var srcRect = this ;
	
	offsetX = offsetX || 0 ;
	offsetY = offsetY || 0 ;
	
	srcRect.xmin = Math.max( srcRect.xmin , dstRect.xmin - offsetX ) ;
	srcRect.ymin = Math.max( srcRect.ymin , dstRect.ymin - offsetY ) ;
	srcRect.xmax = Math.min( srcRect.xmax , dstRect.xmax - offsetX ) ;
	srcRect.ymax = Math.min( srcRect.ymax , dstRect.ymax - offsetY ) ;
	srcRect.updateMeta() ;
	
	if ( dstClipping )
	{
		dstRect.xmin = Math.max( dstRect.xmin , srcRect.xmin + offsetX ) ;
		dstRect.ymin = Math.max( dstRect.ymin , srcRect.ymin + offsetY ) ;
		dstRect.xmax = Math.min( dstRect.xmax , srcRect.xmax + offsetX ) ;
		dstRect.ymax = Math.min( dstRect.ymax , srcRect.ymax + offsetY ) ;
		dstRect.updateMeta() ;
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
	var i , j , srcStart , dstStart ;
	
	if ( ! p.multiply ) { p.multiply = 1 ; }
	if ( ! p.offsetX ) { p.offsetX = 0 ; }
	if ( ! p.offsetY ) { p.offsetY = 0 ; }
	
	if ( p.dstClipRect ) { p.dstClipRect.clip( p.dstRect ) ; }
	else { p.dstClipRect = Rect.create( p.dstRect ) ; }
	
	if ( p.srcClipRect ) { p.srcClipRect.clip( p.srcRect ) ; }
	else { p.srcClipRect = Rect.create( p.srcRect ) ; }
	
	// Mutual clipping
	p.srcClipRect.clip( p.dstClipRect , p.offsetX , p.offsetY , true ) ;
	
	// If out of bounds, return now
	if ( p.dstRect.isNull ) { return ; }
	
	switch ( p.type )
	{
		case 'line' :
			for ( j = 0 ; j < p.srcClipRect.height ; j ++ )
			{
				iterator( {
					context: p.context ,
					srcStart: ( ( p.srcClipRect.ymin + j ) * p.srcRect.width + p.srcClipRect.xmin ) * p.multiply ,
					srcEnd: ( ( p.srcClipRect.ymin + j ) * p.srcRect.width + p.srcClipRect.xmax + 1 ) * p.multiply ,
					dstStart: ( ( p.dstClipRect.ymin + j ) * p.dstRect.width + p.dstClipRect.xmin ) * p.multiply ,
					dstEnd: ( ( p.dstClipRect.ymin + j ) * p.dstRect.width + p.dstClipRect.xmax + 1 ) * p.multiply ,
					dstY: p.dstClipRect.ymin + j ,
					dstXmin: p.dstClipRect.xmin ,
					dstXmax: p.dstClipRect.xmax
				} ) ;
			}
			break ;
			
		case 'cell' :
			for ( j = 0 ; j < p.srcClipRect.height ; j ++ )
			{
				for ( i = 0 ; i < p.srcClipRect.width ; i ++ )
				{
					srcStart = ( ( p.srcClipRect.ymin + j ) * p.srcRect.width + p.srcClipRect.xmin + i ) * p.multiply ;
					dstStart = ( ( p.dstClipRect.ymin + j ) * p.dstRect.width + p.dstClipRect.xmin + i ) * p.multiply ;
					
					iterator( {
						context: p.context ,
						srcStart: srcStart ,
						srcEnd: srcStart + p.multiply ,
						dstStart: dstStart ,
						dstEnd: dstStart + p.multiply ,
						dstX: p.dstClipRect.xmin + i ,
						dstY: p.dstClipRect.ymin + j
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
	var srcI , srcJ , dstI , dstJ , streak , srcStart , dstStart ;
	
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
					
					dstStart = ( ( p.dstClipRect.ymin + dstJ ) * p.dstRect.width + p.dstClipRect.xmin + dstI ) * p.multiply ;
					srcStart = ( ( p.srcClipRect.ymin + srcJ ) * p.srcRect.width + p.srcClipRect.xmin + srcI ) * p.multiply ;
					
					iterator( {
						context: p.context ,
						srcStart: srcStart ,
						srcEnd: srcStart + p.multiply ,
						dstStart: dstStart ,
						dstEnd: dstStart + p.multiply ,
						dstX: p.dstClipRect.xmin + dstI ,
						dstY: p.dstClipRect.ymin + dstJ
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
					
					dstStart = ( ( p.dstClipRect.ymin + dstJ ) * p.dstRect.width + p.dstClipRect.xmin + dstI ) * p.multiply ;
					srcStart = ( ( p.srcClipRect.ymin + srcJ ) * p.srcRect.width + p.srcClipRect.xmin + srcI ) * p.multiply ;
					
					iterator( {
						context: p.context ,
						srcStart: srcStart ,
						srcEnd: srcStart + streak * p.multiply ,
						dstStart: dstStart ,
						dstEnd: dstStart + streak * p.multiply ,
						dstY: p.dstClipRect.ymin + dstJ ,
						dstXmin: p.dstClipRect.xmin + dstI ,
						dstXmax: p.dstClipRect.xmin + dstI + streak - 1
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





			/* Constants */



// Data structure
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



// Blending mask
ScreenBuffer.FG_TRANSPARENCY = 1 << 24 ;
ScreenBuffer.BG_TRANSPARENCY = 2 << 24 ;
ScreenBuffer.STYLE_TRANSPARENCY = 3 << 24 ;
ScreenBuffer.CHAR_TRANSPARENCY = 4 << 24 ;
ScreenBuffer.TRANSPARENCY =
	ScreenBuffer.FG_TRANSPARENCY |
	ScreenBuffer.BG_TRANSPARENCY |
	ScreenBuffer.STYLE_TRANSPARENCY |
	ScreenBuffer.CHAR_TRANSPARENCY ;



// Tuning
ScreenBuffer.OUTPUT_THRESHOLD = 10000 ;	// minimum amount of data to retain before sending them to the terminal



// ScreenBuffer files
ScreenBuffer.HEADER_SIZE = 40 ;	// Header consists of 40 bytes



// General purpose flags
ScreenBuffer.NONE = 0 ;	// Nothing


