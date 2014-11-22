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
var async = require( 'async-kit' ) ;
var string = require( 'string-kit' ) ;



var screenBuffer = {} ;
module.exports = screenBuffer ;



screenBuffer.ScreenBufferTemplate = function ScreenBufferTemplate()
{
	throw new Error( '[terminal] Cannot create a ScreenBufferTemplate instance directly.' ) ;
} ;

screenBuffer.ScreenBufferTemplate.prototype = Object.create( async.EventEmitter.prototype ) ;
screenBuffer.ScreenBufferTemplate.prototype.constructor = screenBuffer.ScreenBufferTemplate ;



screenBuffer.ScreenBuffer = function ScreenBuffer()
{
	throw new Error( '[terminal] Cannot create a ScreenBuffer instance directly.' ) ;
} ;

screenBuffer.ScreenBuffer.prototype = Object.create( screenBuffer.ScreenBufferTemplate.prototype ) ;
screenBuffer.ScreenBuffer.prototype.constructor = screenBuffer.ScreenBuffer ;



var n = 0 ;
screenBuffer.ScreenBufferTemplate.prototype.createBuffer = function createBuffer( createOptions )
{
	// Manage createOptions
	if ( ! createOptions ) { createOptions = {} ; }
	
	var buffer = chainApply.bind( undefined , this.options ) ;
	
	// Yay, this is a nasty hack...
	buffer.__proto__ = this ;	// jshint ignore:line
	buffer.apply = Function.prototype.apply ;
	buffer.call = Function.prototype.call ;
	
	buffer.template = this ;
	
	buffer.width = createOptions.width || this.term.width ;
	buffer.height = createOptions.height || this.term.height ;
	buffer.wrap = createOptions.wrap !== undefined ? createOptions.wrap : true ;
	buffer.offsetX = createOptions.offsetX || 0 ;
	buffer.offsetY = createOptions.offsetY || 0 ;
	buffer.cursorX = createOptions.cursorX || 1 ;
	buffer.cursorY = createOptions.cursorY || 1 ;
	
	buffer.foo = 'buffer' + n ++ ;
	
	console.log( 'createBuffer:' , buffer.__proto__.constructor.name , buffer.foo ) ;
	buffer.createRealBuffers( buffer.width , buffer.height ) ;
	
	// Fix the root
	buffer.options = Object.create( this.options ) ;
	buffer.options.root = buffer ;
	buffer.root = buffer ;
	
	return buffer ;
} ;



screenBuffer.createTemplate = function createTemplate( term )
{
	var i ;
	
	var chainable = Object.create( notChainable ) ;
	var template = Object.create( chainable ) ;
	
	template.chainable = chainable ;
	template.styleReset = term.styleReset.str() ;
	template.options = { on: [], off: [], params: 0, echo: false, attr: template.styleReset } ;
	template.term = term ;
	
	template.foo = 'template' ;
	
	// Create methods for the 'chainable' prototype
	
	// terminal-specific chainable methods
	var tcm = tree.extend( { deep: true } , {} , chainableMethods ) ;
	
	// Copy styles for this terminal
	for ( i = 0 ; i < styleList.length ; i ++ )
	{
		tcm[ styleList[ i ] ] = {
			attr: term[ styleList[ i ] ].str()
		} ;
	} ;
	
	Object.keys( tcm ).forEach( function( key ) {
		
		// build-time resolution
		if ( typeof tcm[ key ].attr === 'function' ) { tcm[ key ].attr = tcm[ key ].attr.call( template ) ; }
		
		Object.defineProperty( chainable , key , {
			configurable: true ,
			get: function () {
				
				var fn , options = {
					on: this.options.on.slice() ,
					off: this.options.off.slice() ,
					params: this.options.params ,
					attr: this.options.attr ,
					echo: this.options.echo ,
					root: this.options.root
				} ;
				
				if ( typeof tcm[ key ].on === 'function' )
				{
					options.on.push( tcm[ key ].on ) ;
					options.params += tcm[ key ].on.length ;
				}
				
				if ( typeof tcm[ key ].off === 'function' ) { options.off.unshift( tcm[ key ].off ) ; }
				
				if ( tcm[ key ].echo ) { options.echo = true ; }
				
				if ( tcm[ key ].attr ) { options.attr += tcm[ key ].attr ; }
				
				fn = chainApply.bind( undefined , options ) ;
				
				// Yay, this is a nasty hack...
				fn.__proto__ = chainable ;	// jshint ignore:line
				fn.apply = Function.prototype.apply ;
				
				fn.root = this.root || this ;
				fn.options = options ;
				
				// Replace the getter by the newly created function, to speed up further call
				if ( this === this.root )
				{
					Object.defineProperty( this.template.chainable , key , { value: fn } ) ;
				}
				else
				{
					Object.defineProperty( this , key , { value: fn } ) ;
				}
				
				//console.log( 'Create function:' , key ) ;
				
				return fn ;
			}
		} ) ;
	} ) ;
	
	return template ;
} ;





			/* Apply */



// CAUTION: 'options' MUST NOT BE OVERWRITTEN!
// It is binded at the function creation and contains function specificities!
function chainApply( options )
{
	var i , offset , applyArguments = [] ;
	
	var action = arguments[ 1 + options.params ] ;
	
	// If not enough arguments, return right now
	if ( arguments.length < 1 + options.params && ( ! action || action === true ) )
	{
		throw new Error( '[terminal] screenBuffer chainable: arguments mismatch!' ) ;
		//return options.root ;
	}
	
	if ( options.params )
	{
		applyArguments = Array.prototype.slice.call( arguments , 1 , 1 + options.params ) ;
	}
	
	//console.log( '\n>>> Action:' , action , '<<<\n' ) ;
	//console.log( 'Attributes:' , attributes ) ;
	if ( action === undefined || action === true )
	{
		for ( i = 0 , offset = 0 ; i < options.on.length ; i ++ )
		{
			options.on[ i ].apply( options.root , applyArguments.slice( offset , offset + options.on[ i ].length ) ) ;
			offset += options.on[ i ].length ;
		}
		
		return options.root ;
	}
	
	if ( action === null || action === false )
	{
		for ( i = 0 ; i < options.off.length ; i ++ )
		{
			options.off[ i ].call( options.root ) ;
		}
		
		return options.root ;
	}
	
	
	// 'action' contains a string
	
	
	if ( typeof action !== 'string' )
	{
		if ( typeof action.toString === 'function' ) { action = action.toString() ; }
		else { action = '' ; }
	}
	
	// So we have got a formated string
	if ( arguments.length > 2 )
	{
		action = string.format( Array.prototype.slice.call( arguments , 1 + options.params ) ) ;
	}
	
	// process 'on' methods
	for ( i = 0 , offset = 0 ; i < options.on.length ; i ++ )
	{
		options.on[ i ].apply( options.root , applyArguments.slice( offset , options.on[ i ].length ) ) ;
		offset += options.on[ i ].length ;
	}
	
	if ( action ) { write.call( options.root , action , options.attr ) ; }
	
	// process 'off' methods
	for ( i = 0 ; i < options.off.length ; i ++ )
	{
		options.off[ i ].call( options.root ) ;
	}
	
	return options.root ;
}



function write( str , attr , echo )
{
	var i , len = str.length ;
	
	if ( typeof attr !== 'string' ) { attr = '' ; }
	
	for ( i = 0 ; i < len ; i ++ )
	{
		this.charBuffer[ this.cursorY - 1 ][ this.cursorX - 1 ] = str[ i ] ;
		this.attrBuffer[ this.cursorY - 1 ][ this.cursorX - 1 ] = attr ;
		
		this.cursorX ++ ;
		
		if ( this.cursorX > this.width )
		{
			if ( ! this.wrap ) { this.cursorX = this.width ; break ; }
			
			this.cursorX = 1 ;
			this.cursorY ++ ;
			
			if ( this.cursorY > this.height )
			{
				this.cursorY = this.height ;
				break ;
			}
		}
	}
}





			/* Pseudo esc */



var chainableMethods = {
	// It just set echo:true so it will echo characters back to the terminal too
	echo: { echo: true } ,
	
	moveTo: {
		on: function moveTo( x , y ) {
			
			if ( typeof x !== 'number' || this.cursorX < 1 ) { this.cursorX = 1 ; }
			else if ( this.cursorX > this.width ) { this.cursorX = this.width ; }
			else { this.cursorX = Math.floor( x ) ; }
			
			if ( typeof y !== 'number' || this.cursorY < 1 ) { this.cursorY = 1 ; }
			else if ( this.cursorY > this.height ) { this.cursorY = this.height ; }
			else { this.cursorY = Math.floor( y ) ; }
		}
	}
} ;



// List all available styles, they will be replaced at template creation with the available terminal one
var styleList = [
	'styleReset' ,
	'bold' , 'dim' , 'italic' , 'underline' , 'blink' , 'inverse' , 'hidden' , 'strike' ,
	
	// Foreground color
	'defaultColor' ,
	'black' , 'red' , 'green' , 'yellow' , 'blue' , 'magenta' , 'cyan' , 'white' ,
	'brightBlack' , 'brightRed' , 'brightGreen' , 'brightYellow' , 'brightBlue' , 'brightMagenta' , 'brightCyan' , 'brightWhite' ,
	//'darkColor' , 'brightColor' ,
    
	// Background color
	'bgDefaultColor' ,
	'bgBlack' , 'bgRed' , 'bgGreen' , 'bgYellow' , 'bgBlue' , 'bgMagenta' , 'bgCyan' , 'bgWhite' ,
	'bgBrightBlack' , 'bgBrightRed' , 'bgBrightGreen' , 'bgBrightYellow' , 'bgBrightBlue' , 'bgBrightMagenta' , 'bgBrightCyan' , 'bgBrightWhite' ,
	// 'bgDarkColor' , 'bgBrightColor' ,
	
	// 'color256' , 'bgColor256' ,
	// 'color24bits' , 'bgColor24bits' ,
] ;





			/* Advanced methods */



// Complexes functions that cannot be chained.
// It is the ancestors of the terminal object, so it should inherit from async.EventEmitter.
var notChainable = Object.create( screenBuffer.ScreenBufferTemplate.prototype ) ;



// Complexes high-level features have their own file
//notChainable.inputField = require( './inputField.js' ) ;
//notChainable.yesOrNo = require( './yesOrNo.js' ) ;



notChainable.createRealBuffers = function createRealBuffers( width , height )
{
	console.log( 'createRealBuffers:' , this.__proto__.constructor.name , this.foo ) ;
	
	var y , x ;
	
	this.charBuffer = new Array( height ) ;
	this.attrBuffer = new Array( height ) ;
	
	this.charBuffer.foo = n ++ ;
	
	for ( y = 0 ; y < height ; y ++ )
	{
		this.charBuffer[ y ] = new Array( width ) ;
		this.attrBuffer[ y ] = new Array( width ) ;
		
		for ( x = 0 ; x < width ; x ++ )
		{
			this.charBuffer[ y ][ x ] = ' ' ;	// One utf-8 character
			this.attrBuffer[ y ][ x ] = this.styleReset ;
		}
	}
} ;



notChainable.redrawChars = function redrawChars()
{
	var x , y , xmin , xmax , ymin , ymax ;
	var nfterm = this.term.noFormat ;	// no format term (faster)
	
	// min & max in the buffer coordinate
	xmin = Math.max( 1 , 1 - this.offsetX ) ;
	xmax = Math.min( this.width , this.term.width - this.offsetX ) ;
	ymin = Math.max( 1 , 1 - this.offsetY ) ;
	ymax = Math.min( this.height , this.term.height - this.offsetY ) ;
	
	for ( y = ymin ; y <= ymax ; y ++ )
	{
		/* Probably not the fastest way to do it, but the simpler
		nfterm.moveTo( xmin + this.offsetX , y + this.offsetY ) ;
		for ( x = xmin ; x <= xmax ; x ++ )
		{
			nfterm( this.charBuffer[ y - 1 ][ x - 1 ] ) ;
		}
		//*/
		
		//* Probably faster
		nfterm.moveTo(
			xmin + this.offsetX ,
			y + this.offsetY ,
			this.charBuffer[ y - 1 ].slice( xmin - 1 , xmax ).join( '' )
		) ;
		//*/
	}
	
} ;



notChainable.redraw = function redraw()
{
	var x , y , xmin , xmax , ymin , ymax , line ;
	var nfterm = this.term.noFormat ;	// no format term (faster)
	
	// min & max in the buffer coordinate
	xmin = Math.max( 1 , 1 - this.offsetX ) ;
	xmax = Math.min( this.width , this.term.width - this.offsetX ) ;
	ymin = Math.max( 1 , 1 - this.offsetY ) ;
	ymax = Math.min( this.height , this.term.height - this.offsetY ) ;
	
	for ( y = ymin ; y <= ymax ; y ++ )
	{
		/* Probably not the fastest way to do it, but the simpler
		nfterm.moveTo( xmin + this.offsetX , y + this.offsetY ) ;
		for ( x = xmin ; x <= xmax ; x ++ )
		{
			nfterm( this.attrBuffer[ y - 1 ][ x - 1 ] + this.charBuffer[ y - 1 ][ x - 1 ] ) ;
		}
		//*/
		
		//* Probably faster
		line = '' ;
		
		for ( x = xmin ; x <= xmax ; x ++ )
		{
			line += this.attrBuffer[ y - 1 ][ x - 1 ] + this.charBuffer[ y - 1 ][ x - 1 ] ;
		}
		
		nfterm.moveTo( xmin + this.offsetX , y + this.offsetY , line ) ;
		//*/
	}
	
} ;



notChainable.dumpChars = function dumpChars()
{
	var y , x ;
	
	this.term( '\nDumping the character buffer:\n' ) ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		this.term( y + 1 ).column( 4 , '> ' ) ;
		
		for ( x = 0 ; x < this.width ; x ++ )
		{
			this.term( this.charBuffer[ y ][ x ] ) ;
		}
		
		this.term( '\n' ) ;
	}
	
} ;



notChainable.dump = function dump()
{
	var y , x ;
	
	this.term( '\nDumping the buffer (attributes + characters):\n' ) ;
	
	for ( y = 0 ; y < this.height ; y ++ )
	{
		this.term( y + 1 ).column( 4 , '> ' ) ;
		
		for ( x = 0 ; x < this.width ; x ++ )
		{
			this.term.magenta( string.escape.control( this.attrBuffer[ y ][ x ] ) ) ;
			this.term( this.charBuffer[ y ][ x ] ) ;
		}
		
		this.term( '\n' ) ;
	}
	
} ;


