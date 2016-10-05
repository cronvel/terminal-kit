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

//var events = require( 'events' ) ;
var NextGenEvents = require( 'nextgen-events' ) ;
var fs = require( 'fs' ) ;
var string = require( 'string-kit' ) ;
var punycode = require( 'punycode' ) ;
var termkit = require( './termkit.js' ) ;



function ScreenBuffer() { throw new Error( 'Cannot create ScreenBuffer object directly.' ) ; }
module.exports = ScreenBuffer ;
ScreenBuffer.prototype = Object.create( NextGenEvents.prototype ) ;
ScreenBuffer.prototype.constructor = ScreenBuffer ;



/*
	options:
		* width: mandatory
		* height: mandatory
		* dst: default dst
		* x: default position in dst
		* y: default position in dst
		* wrap: default behaviour of .put()
		* noFill: do not call .fill() with default values at ScreenBuffer creation
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
		}
	} ) ;
	
	if ( ! options.noFill ) { screenBuffer.fill() ; }
	
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
	data = termkit.stripControlChars( data , true ).split( '\n' ) ;
	
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



ScreenBuffer.prototype.fill = function fill( options )
{
	//this.buffer.fill( 0 ) ; return this ;
	
	var i , attr , char , length ,
		clearBuffer = ScreenBuffer.CLEAR_BUFFER ,
		buffer = this.buffer ;
	
	if ( options && typeof options === 'object' ) 
	{
		clearBuffer = new Buffer( ScreenBuffer.ITEM_SIZE ) ;
		
		// Write the attributes
		attr = options.attr !== undefined ? options.attr : ScreenBuffer.DEFAULT_ATTR ;
		if ( attr && typeof attr === 'object' ) { attr = ScreenBuffer.object2attr( attr ) ; }
		if ( typeof attr !== 'number' ) { attr = ScreenBuffer.DEFAULT_ATTR ; }
		clearBuffer.writeInt32BE( attr , 0 ) ;
		
		// Write the character
		char = options.char && typeof options.char === 'string' ? options.char : ' ' ;
		char = punycode.ucs2.encode( [ punycode.ucs2.decode( termkit.stripControlChars( char ) )[ 0 ] ] ) ;
		clearBuffer.write( char , ScreenBuffer.ATTR_SIZE , ScreenBuffer.CHAR_SIZE ) ;
		
		// This option is used when we want to clear a Buffer instance, not a ScreenBuffer instance
		if ( options.buffer ) { buffer = options.buffer ; }
	}
	
	// It is always an integer
	length = buffer.length / ScreenBuffer.ITEM_SIZE ;
	
	for ( i = 0 ; i < length ; i ++ )
	{
		clearBuffer.copy( buffer , i * ScreenBuffer.ITEM_SIZE ) ;
	}
} ;



/*
	put( options , str )
	put( options , format , [arg1] , [arg2] , ... )
	
	options:
		* x: bypass this.cx
		* y: bypass this.cy
		* attr: standard attributes
		* wrap: text wrapping, when the cursor move beyond the last column, it is moved to the begining of the next line
		* direction: 'right' (default), 'left', 'up', 'down' or 'none'/null (do not move after puting a char)
		* dx: x increment after each character (default: 1)
		* dy: y increment after each character (default: 0)
*/
ScreenBuffer.prototype.put = function put( options , str )
{
	var i , x , y , dx , dy , attr , wrap , characters , len , offset ;
	
	// Manage options
	if ( ! options ) { options = {} ; }
	
	if ( options.wrap !== undefined ) { wrap = options.wrap ; }
	else { wrap = this.wrap ; }
	
	x = Math.floor( options.x !== undefined ? options.x : this.cx ) ;
	y = Math.floor( options.y !== undefined ? options.y : this.cy ) ;
	
	
	
	// Process directions/increments
	dx = 1 ;
	dy = 0 ;
	
	switch ( options.direction )
	{
		//case 'right' : // not needed, use the default dx & dy
		case 'left' :
			dx = -1 ;
			break ;
		case 'up' :
			dx = 0 ;
			dy = -1 ;
			break ;
		case 'down' :
			dx = 0 ;
			dy = 1 ;
			break ;
		case null :
		case 'none' :
			dx = 0 ;
			dy = 0 ;
			break ;
	}
	
	if ( typeof options.dx === 'number' ) { dx = options.dx ; }
	if ( typeof options.dy === 'number' ) { dy = options.dy ; }
	
	
	// Process attributes
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
	str = termkit.stripControlChars( str ) ;
	
	// /!\ Fix that punycode thing, and don't forget to fix Terminal#put() too... /!\
	characters = punycode.ucs2.decode( str ) ;
	len = characters.length ;
	
	for ( i = 0 ; i < len ; i ++ )
	{
		offset = ( y * this.width + x ) * ScreenBuffer.ITEM_SIZE ;
		
		//if ( offset >= 0 && offset < this.buffer.length )
		if ( x >= 0 && x < this.width && y >= 0 && y < this.height )
		{
			// Write the attributes
			this.buffer.writeInt32BE( attr , offset ) ;
			
			// Write the character
			this.buffer.write( punycode.ucs2.encode( [ characters[ i ] ] ) , offset + ScreenBuffer.ATTR_SIZE , ScreenBuffer.CHAR_SIZE ) ;
		}
		
		x += dx ;
		y += dy ;
		
		if ( x < 0 )
		{
			if ( ! wrap ) { x = 0 ; break ; }
			x = this.width - 1 ;
			y -- ;
		}
		else if ( x >= this.width )
		{
			if ( ! wrap ) { x = this.width - 1 ; break ; }
			x = 0 ;
			y ++ ;
		}
		
		if ( y < 0 ) { y = 0 ; break ; }
		else if ( y >= this.height ) { y = this.height - 1 ; break ; }
	}
	
	this.cx = x ;
	this.cy = y ;
} ;



/*
	options:
		* x: bypass this.cx
		* y: bypass this.cy
*/
ScreenBuffer.prototype.get = function get( options )
{
	var x , y , offset ;
	
	// Manage options
	if ( ! options ) { options = {} ; }
	
	x = options.x !== undefined ? options.x : this.cx ;
	y = options.y !== undefined ? options.y : this.cy ;
	
	if ( typeof x !== 'number' || x < 0 || x >= this.width ) { return null ; }
	else { x = Math.floor( x ) ; }
	
	if ( typeof y !== 'number' || y < 0 || y >= this.height ) { return null ; }
	else { y = Math.floor( y ) ; }
	
	offset = ( y * this.width + x ) * ScreenBuffer.ITEM_SIZE ;
	
	return {
		attr: ScreenBuffer.attr2object( this.buffer.readUInt32BE( offset ) ) ,
		char: ScreenBuffer.readChar( this.buffer , offset + ScreenBuffer.ATTR_SIZE )
	} ;
} ;



// Resize a screenBuffer, using a termkit.Rect
ScreenBuffer.prototype.resize = function resize( fromRect )
{
	// Do not reference directly the userland variable, clone it
	fromRect = termkit.Rect.create( fromRect ) ;
	
	var offsetX = - fromRect.xmin ,
		offsetY = - fromRect.ymin ;
	
	// Create the toRect region
	var toRect = termkit.Rect.create( {
		xmin: 0 ,
		ymin: 0 ,
		xmax: fromRect.width - 1 ,
		ymax: fromRect.height - 1
	} ) ;
	
	fromRect.clip( termkit.Rect.create( this ) ) ;
	
	if ( toRect.isNull ) { return false ; }
	
	// Generate a new buffer
	var resizedBuffer = new Buffer( toRect.width * toRect.height * ScreenBuffer.ITEM_SIZE ) ;
	this.fill( { buffer: resizedBuffer } ) ;
	
	// We use the blit to reconstruct the buffer geometry
	termkit.Rect.regionIterator( {
		type: 'line' ,
		context: { srcBuffer: this.buffer , dstBuffer: resizedBuffer } ,
		dstRect: toRect ,
		dstClipRect: termkit.Rect.create( toRect ) ,
		srcRect: termkit.Rect.create( this ) ,
		srcClipRect: fromRect ,
		offsetX: offsetX ,
		offsetY: offsetY ,
		multiply: ScreenBuffer.ITEM_SIZE
	} , blitterLineIterator ) ;
	
	// Now, we have to replace the old buffer with the new, and set the width & height
	Object.defineProperties( this , {
		width: { value: toRect.width , enumerable: true , configurable: true } ,
		height: { value: toRect.height , enumerable: true , configurable: true } ,
		buffer: { value: resizedBuffer , enumerable: true , configurable: true }
	} ) ;
	
	// Disable the lastBuffer, so `draw( { delta: true } )` will not be bugged
	this.lastBuffer = null ;
	
	// This exists to improve compatibilities with the Terminal object
	this.emit( 'resize' , this.width , this.height ) ;
	
	return true ;
} ;



ScreenBuffer.prototype.draw = function draw( options )
{
	var stats ;
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	// Transmitted options (do not edit the user provided options, clone them)
	var tr = {
		dst: options.dst || this.dst ,
		offsetX: options.x !== undefined ? Math.floor( options.x ) : Math.floor( this.x ) ,
		offsetY: options.y !== undefined ? Math.floor( options.y ) : Math.floor( this.y ) ,
		dstClipRect: options.dstClipRect ? termkit.Rect.create( options.dstClipRect ) : undefined ,
		srcClipRect: options.srcClipRect ? termkit.Rect.create( options.srcClipRect ) : undefined ,
		blending: options.blending ,
		delta: options.delta ,
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
} ;



ScreenBuffer.prototype.moveTo = function moveTo( x , y )
{
	this.cx = Math.max( 0 , Math.min( x , this.width - 1 ) ) ;
	this.cy = Math.max( 0 , Math.min( y , this.height - 1 ) ) ;
} ;



ScreenBuffer.prototype.drawCursor = function drawCursor( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var dst = options.dst || this.dst ;
	
	if ( dst instanceof ScreenBuffer )
	{
		dst.moveTo( this.cx + this.x , this.cy + this.y ) ;
	}
	else if ( dst instanceof termkit.Terminal )
	{
		dst.moveTo(
			Math.max( 1 , Math.min( this.cx + this.x , dst.width ) ) ,
			Math.max( 1 , Math.min( this.cy + this.y , dst.height ) )
		) ;
	}
} ;



ScreenBuffer.prototype.blitter = function blitter( p )
{
	var tr , iterator , iteratorCallback ;
	
	// Default options & iterator
	tr = {
		type: 'line' ,
		context: { srcBuffer: this.buffer , dstBuffer: p.dst.buffer } ,
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
	
	
	// If blending is on, switch to the cell iterator
	if ( p.blending )
	{
		tr.type = 'cell' ;
		iteratorCallback = blitterCellBlendingIterator ;
	}
	
	if ( p.wrap ) { iterator = 'wrapIterator' ; }
	else if ( p.tile ) { iterator = 'tileIterator' ; }
	else { iterator = 'regionIterator' ; }
	
	termkit.Rect[ iterator ]( tr , iteratorCallback ) ;
} ;



function blitterLineIterator( p )
{
	p.context.srcBuffer.copy( p.context.dstBuffer , p.dstStart , p.srcStart , p.srcEnd ) ;
}



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



ScreenBuffer.prototype.terminalBlitter = function terminalBlitter( p )
{
	var tr , iterator , iteratorCallback , context ;
	
	iteratorCallback = terminalBlitterLineIterator ;
	
	context = {
		srcBuffer: this.buffer ,
		term: p.dst ,
		deltaEscapeSequence: p.dst.support.deltaEscapeSequence ,
		nfterm: p.dst.noFormat ,
		lastAttr: null ,
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
		dstRect: termkit.Rect.create( p.dst ) ,
		srcRect: termkit.Rect.create( this ) ,
		dstClipRect: p.dstClipRect ,
		srcClipRect: p.srcClipRect ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY ,
		multiply: ScreenBuffer.ITEM_SIZE
	} ;
	
	if ( p.delta )
	{
		if ( ! this.lastBuffer || this.lastBuffer.length !== this.buffer.length )
		{
			this.lastBuffer = new Buffer( this.buffer ) ;
		}
		else if ( this.lastBufferUpToDate )
		{
			context.srcLastBuffer = this.lastBuffer ;
			
			iteratorCallback = terminalBlitterCellIterator ;
			tr.type = 'cell' ;
		}
		
		this.lastBufferUpToDate = true ;
	}
	else
	{
		this.lastBufferUpToDate = false ;
	}
	
	
	if ( p.wrap ) { iterator = 'wrapIterator' ; }
	else if ( p.tile ) { iterator = 'tileIterator' ; }
	else { iterator = 'regionIterator' ; }
	
	termkit.Rect[ iterator ]( tr , iteratorCallback ) ;
	
	// Write remaining sequence
	if ( context.sequence.length ) { context.nfterm( context.sequence ) ; context.writes ++ ; }
	
	// Copy buffer to lastBuffer
	// Already done by terminalBlitterCellIterator()
	// if ( p.delta ) { this.buffer.copy( this.lastBuffer ) ; }
	
	// Return some stats back to the callee
	return {
		cells: context.cells ,
		moves: context.moves ,
		attrs: context.attrs ,
		writes: context.writes
	} ;
} ;



function terminalBlitterLineIterator( p )
{
	var offset , attr ;
	
	p.context.sequence += p.context.term.optimized.moveTo( p.dstXmin , p.dstY ) ;
	p.context.moves ++ ;
	
	for ( offset = p.srcStart ; offset < p.srcEnd ; offset += ScreenBuffer.ITEM_SIZE )
	{
		attr = p.context.srcBuffer.readUInt32BE( offset ) ;
		
		if ( attr !== p.context.lastAttr )
		{
			p.context.sequence += p.context.lastAttr === null || ! p.context.deltaEscapeSequence ?
				ScreenBuffer.generateEscapeSequence( p.context.term , attr ) :
				ScreenBuffer.generateDeltaEscapeSequence( p.context.term , attr , p.context.lastAttr ) ;
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



function terminalBlitterCellIterator( p )
{
	var attr = p.context.srcBuffer.readUInt32BE( p.srcStart ) ;
	
	// If last buffer's cell === current buffer's cell, no need to refresh... skip that now
	if ( p.context.srcLastBuffer )
	{
		if (
			attr ===
				p.context.srcLastBuffer.readUInt32BE( p.srcStart ) &&
			p.context.srcBuffer.readUInt32BE( p.srcStart + ScreenBuffer.ATTR_SIZE ) ===
				p.context.srcLastBuffer.readUInt32BE( p.srcStart + ScreenBuffer.ATTR_SIZE ) )
		{
			return ;
		}
		
		p.context.srcBuffer.copy( p.context.srcLastBuffer , p.srcStart , p.srcStart , p.srcEnd ) ;
	}
	
	p.context.cells ++ ;
	
	if ( p.dstX !== p.context.cx || p.dstY !== p.context.cy )
	{
		p.context.sequence += p.context.term.optimized.moveTo( p.dstX , p.dstY ) ;
		p.context.moves ++ ;
	}
	
	if ( attr !== p.context.lastAttr )
	{
		p.context.sequence += p.context.lastAttr === null || ! p.context.deltaEscapeSequence ?
			ScreenBuffer.generateEscapeSequence( p.context.term , attr ) :
			ScreenBuffer.generateDeltaEscapeSequence( p.context.term , attr , p.context.lastAttr ) ;
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



ScreenBuffer.loadSyncV1 = function loadSync( filepath )
{
	var content , width , height , size , screenBuffer ;
	
	// Let it crash if nothing found
	content = fs.readFileSync( filepath ) ;
	
	// No header found?
	if ( content.length < ScreenBuffer.HEADER_SIZE ) { throw new Error( 'No header found: this is not a ScreenBuffer file' ) ; }
	
	// See if we have got a 'SB' at the begining of the file
	if ( content[ 0 ] !== 83 || content[ 1 ] !== 66 ) { throw new Error( 'Magic number mismatch: this is not a ScreenBuffer file' ) ; }
	
	// Get the geometry
	width = content.readUInt16BE( 4 ) ;
	height = content.readUInt16BE( 6 ) ;
	
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



ScreenBuffer.prototype.saveSyncV1 = function saveSync( filepath )
{
	var content ;
	
	content = new Buffer( ScreenBuffer.HEADER_SIZE + this.buffer.length ) ;
	
	// Clear the header area
	content.fill( 0 , 0 , ScreenBuffer.HEADER_SIZE ) ;
	
	// Write the 'SB' magic number
	content[ 0 ] = 83 ;
	content[ 1 ] = 66 ;
	
	// Set the geometry
	content.writeUInt16BE( this.width , 4 ) ;
	content.writeUInt16BE( this.height , 6 ) ;
	
	this.buffer.copy( content , ScreenBuffer.HEADER_SIZE ) ;
	
	// Let it crash if something bad happens
	fs.writeFileSync( filepath , content ) ;
} ;



ScreenBuffer.loadSyncV2 = function loadSync( filepath )
{
	var i , content , header , screenBuffer ;
	
	// Let it crash if nothing found
	content = fs.readFileSync( filepath ) ;
	
	// See if we have got a 'SB' at the begining of the file
	if ( content.length < 3 || content.toString( 'ascii' , 0 , 3 ) !== 'SB\n' )
	{
		throw new Error( 'Magic number mismatch: this is not a ScreenBuffer file' ) ;
	}
	
	// search for the second \n
	for ( i = 3 ; i < content.length ; i ++ )
	{
		if ( content[ i ] === 0x0a ) { break ; }
	}
	
	if ( i === content.length )
	{
		throw new Error( 'No header found: this is not a ScreenBuffer file' ) ;
	}
	
	// Try to parse a JSON header
	try {
		header = JSON.parse( content.toString( 'utf8' , 3 , i ) ) ;
	}
	catch( error ) {
		throw new Error( 'No correct one-lined JSON header found: this is not a ScreenBuffer file' ) ;
	}
	
	// Mandatory header field
	if ( header.version === undefined || header.width === undefined || header.height === undefined )
	{
		throw new Error( 'Missing mandatory header data, this is a corrupted or obsolete ScreenBuffer file' ) ;
	}
	
	// Bad size?
	if ( content.length !== i + 1 + header.width * header.height * ScreenBuffer.ITEM_SIZE )
	{
		throw new Error( 'Bad file size: this is a corrupted ScreenBuffer file' ) ;
	}
	
	// So the file exists, create a canvas based upon it
	screenBuffer = ScreenBuffer.create( {
		width: header.width ,
		height: header.height
	} ) ;
	
	content.copy( screenBuffer.buffer , 0 , i + 1 ) ;
	
	return screenBuffer ;
} ;



// This new format use JSON header for a maximal flexibility rather than a fixed binary header.
// The header start with a magic number SB\n then a compact single-line JSON that end with an \n.
// So the data part start after the second \n, providing a variable header size.
// This will allow adding meta data without actually changing the file format.
ScreenBuffer.prototype.saveSyncV2 = function saveSync( filepath )
{
	var content , header ;
	
	header = {
		version: 2 ,
		width: this.width ,
		height: this.height
	} ;
	
	header = 'SB\n' + JSON.stringify( header ) + '\n' ;
	
	content = new Buffer( header.length + this.buffer.length ) ;
	content.write( header ) ;
	
	this.buffer.copy( content , header.length ) ;
	
	// Let it crash if something bad happens
	fs.writeFileSync( filepath , content ) ;
} ;



ScreenBuffer.loadSync = ScreenBuffer.loadSyncV2 ;
ScreenBuffer.prototype.saveSync = ScreenBuffer.prototype.saveSyncV2 ;



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
				this.buffer.readUInt8( offset ) ,
				this.buffer.readUInt8( offset + 1 ) ,
				this.buffer.readUInt8( offset + 2 ) ,
				this.buffer.readUInt8( offset + 3 )
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
	object.bgColor = ( attr >>> 8 ) & 255 ;
	
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
	if ( typeof object.color === 'string' ) { object.color = termkit.color2index( object.color ) ; }
	if ( typeof object.color !== 'number' || object.color < 0 || object.color > 255 ) { object.color = 7 ; }
	else { object.color = Math.floor( object.color ) ; }
	
	attr += object.color ;
	
	// Background color part
	if ( typeof object.bgColor === 'string' ) { object.bgColor = termkit.color2index( object.bgColor ) ; }
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



ScreenBuffer.generateEscapeSequence = function generateEscapeSequence( term , attr )
{
	var color = attr & 255 ;
	var bgColor = ( attr >>> 8 ) & 255 ;
	
	var esc = term.optimized.styleReset +
		term.optimized.color256[ color ] +
		term.optimized.bgColor256[ bgColor ] ;
	
	// Style part
	if ( attr & ScreenBuffer.BOLD ) { esc += term.optimized.bold ; }
	if ( attr & ScreenBuffer.DIM ) { esc += term.optimized.dim ; }
	if ( attr & ScreenBuffer.ITALIC ) { esc += term.optimized.italic ; }
	if ( attr & ScreenBuffer.UNDERLINE ) { esc += term.optimized.underline ; }
	if ( attr & ScreenBuffer.BLINK ) { esc += term.optimized.blink ; }
	if ( attr & ScreenBuffer.INVERSE ) { esc += term.optimized.inverse ; }
	if ( attr & ScreenBuffer.HIDDEN ) { esc += term.optimized.hidden ; }
	if ( attr & ScreenBuffer.STRIKE ) { esc += term.optimized.strike ; }
	
	return esc ;
} ;



// Generate only the delta between the last and new attributes, may speed up things for the terminal process
// as well as consume less bandwidth, at the cost of small CPU increase in the application process
ScreenBuffer.generateDeltaEscapeSequence = function generateDeltaEscapeSequence( term , attr , lastAttr )
{
	//console.log( 'generateDeltaEscapeSequence' ) ;
	
	var esc = '' ,
		color = attr & 255 ,
		lastColor = lastAttr & 255 ,
		bgColor = ( attr >>> 8 ) & 255 ,
		lastBgColor = ( lastAttr >>> 8 ) & 255 ;
	
	// Bold and dim style are particular: all terminal has noBold = noDim
	
	if ( color !== lastColor ) { esc += term.optimized.color256[ color ] ; }
	if ( bgColor !== lastBgColor ) { esc += term.optimized.bgColor256[ bgColor ] ; }
	
	if ( ( attr & ScreenBuffer.BOLD_DIM ) !== ( lastAttr & ScreenBuffer.BOLD_DIM ) )
	{
		if ( ( ( lastAttr & ScreenBuffer.BOLD ) && ! ( attr & ScreenBuffer.BOLD ) ) ||
			( ( lastAttr & ScreenBuffer.DIM ) && ! ( attr & ScreenBuffer.DIM ) ) )
		{
			esc += term.optimized.noBold ;
			if ( attr & ScreenBuffer.BOLD ) { esc += term.optimized.bold ; }
			if ( attr & ScreenBuffer.DIM ) { esc += term.optimized.dim ; }
		}
		else
		{
			if ( ( attr & ScreenBuffer.BOLD ) && ! ( lastAttr & ScreenBuffer.BOLD ) ) { esc += term.optimized.bold ; }
			if ( ( attr & ScreenBuffer.DIM ) && ! ( lastAttr & ScreenBuffer.DIM ) ) { esc += term.optimized.dim ; }
		}
	}
	
	if ( ( attr & ScreenBuffer.ITALIC ) !== ( lastAttr & ScreenBuffer.ITALIC ) )
	{
		esc += attr & ScreenBuffer.ITALIC ? term.optimized.italic : term.optimized.noItalic ;
	}
	
	if ( ( attr & ScreenBuffer.UNDERLINE ) !== ( lastAttr & ScreenBuffer.UNDERLINE ) )
	{
		esc += attr & ScreenBuffer.UNDERLINE ? term.optimized.underline : term.optimized.noUnderline ;
	}
	
	if ( ( attr & ScreenBuffer.BLINK ) !== ( lastAttr & ScreenBuffer.BLINK ) )
	{
		esc += attr & ScreenBuffer.BLINK ? term.optimized.blink : term.optimized.noBlink ;
	}
	
	if ( ( attr & ScreenBuffer.INVERSE ) !== ( lastAttr & ScreenBuffer.INVERSE ) )
	{
		esc += attr & ScreenBuffer.INVERSE ? term.optimized.inverse : term.optimized.noInverse ;
	}
	
	if ( ( attr & ScreenBuffer.HIDDEN ) !== ( lastAttr & ScreenBuffer.HIDDEN ) )
	{
		esc += attr & ScreenBuffer.HIDDEN ? term.optimized.hidden : term.optimized.noHidden ;
	}
	
	if ( ( attr & ScreenBuffer.STRIKE ) !== ( lastAttr & ScreenBuffer.STRIKE ) )
	{
		esc += attr & ScreenBuffer.STRIKE ? term.optimized.strike : term.optimized.noStrike ;
	}
	
	return esc ;
} ;

//ScreenBuffer.generateDeltaEscapeSequence = ScreenBuffer.generateEscapeSequence ;





			/* Terminal instance compatibility */



// Clear the buffer: fill it with blank
ScreenBuffer.prototype.clear = ScreenBuffer.prototype.fill ;





			/* Constants */



// Data structure
ScreenBuffer.ATTR_SIZE = 4 ;	// do not edit, everything use Buffer.writeInt32BE()
ScreenBuffer.CHAR_SIZE = 4 ;
ScreenBuffer.ITEM_SIZE = ScreenBuffer.ATTR_SIZE + ScreenBuffer.CHAR_SIZE ;

ScreenBuffer.DEFAULT_ATTR = ScreenBuffer.object2attr( { color: 'white' , bgColor: 'black' } ) ;
ScreenBuffer.CLEAR_ATTR = ScreenBuffer.object2attr( { color: 'white' , bgColor: 'black' , transparency: true } ) ;
ScreenBuffer.CLEAR_BUFFER = new Buffer( ScreenBuffer.ITEM_SIZE ) ;
ScreenBuffer.CLEAR_BUFFER.writeInt32BE( ScreenBuffer.DEFAULT_ATTR , 0 ) ;
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

ScreenBuffer.BOLD_DIM = ScreenBuffer.BOLD | ScreenBuffer.DIM ;



// Blending mask
ScreenBuffer.FG_TRANSPARENCY = 1 << 24 ;
ScreenBuffer.BG_TRANSPARENCY = 2 << 24 ;
ScreenBuffer.STYLE_TRANSPARENCY = 4 << 24 ;
ScreenBuffer.CHAR_TRANSPARENCY = 8 << 24 ;
ScreenBuffer.TRANSPARENCY =
	ScreenBuffer.FG_TRANSPARENCY |
	ScreenBuffer.BG_TRANSPARENCY |
	ScreenBuffer.STYLE_TRANSPARENCY |
	ScreenBuffer.CHAR_TRANSPARENCY ;

ScreenBuffer.FG_BLENDING = 16 << 24 ;
ScreenBuffer.BG_BLENDING = 32 << 24 ;

ScreenBuffer.LEADING_FULLWIDTH = 64 << 24 ;
ScreenBuffer.TRAILING_FULLWIDTH = 128 << 24 ;



// Tuning
ScreenBuffer.OUTPUT_THRESHOLD = 10000 ;	// minimum amount of data to retain before sending them to the terminal



// ScreenBuffer files
ScreenBuffer.HEADER_SIZE = 40 ;	// Header consists of 40 bytes



// General purpose flags
ScreenBuffer.NONE = 0 ;	// Nothing


