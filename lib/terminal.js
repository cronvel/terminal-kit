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

/*
	TODO:
	- Try to detect the real terminal ($TERM report xterm most of time)
		- this command 
			basename $(ps -f -p $(cat /proc/$(echo $$)/stat | cut -d \  -f 4) | tail -1 | sed 's/^.* //')
			may help locally, but is useless remotely
		- $COLORTERM is rarely used, and is not transmitted to node.js
		- 'CSI c' and 'CSI > c' are almost useless
	- Then use infocmp to get terminfo string
	
	- documentation on term.state (term.state.button.left, etc)
*/

// Load modules
var tree = require( 'tree-kit' ) ;
var async = require( 'async-kit' ) ;
var string = require( 'string-kit' ) ;
var punycode = require( 'punycode' ) ;
var exec = require( 'child_process' ).exec ;

//var tty = require( 'tty' ) ;



/* From 'ttys' module: (not used ATM)
var fs = require('fs')
var assert = require('assert')

if (tty.isatty(0)) {
  exports.stdin = process.stdin
} else {
  var ttyFd = fs.openSync('/dev/tty', 'r')
  assert(tty.isatty(ttyFd))
  exports.stdin = new tty.ReadStream(ttyFd)
  exports.stdin._type = 'tty'
}

if (tty.isatty(1)) {
  exports.stdout = process.stdout
} else {
  var ttyFd = fs.openSync('/dev/tty', 'w')
  assert(tty.isatty(ttyFd))
  exports.stdout = new tty.WriteStream(ttyFd)
  exports.stdout._type = 'tty'

  // Hack to have the stdout stream not keep the event loop alive.
  // See: https://github.com/joyent/node/issues/1726
  // XXX: remove/fix this once src/node.js does something different as well.
  if (exports.stdout._handle && exports.stdout._handle.unref) {
    exports.stdout._handle.unref();
  }
}
*/


function createTerminal( createOptions )
{
	// Manage createOptions
	if ( ! createOptions )
	{
		createOptions = {
			stdin: process.stdin ,
			stdout: process.stdout ,
			stderr: process.stderr ,
			generic: 'xterm' ,
			app: null ,
			appName: null
			// couldTTY: true
		} ;
	}
	
	if ( typeof createOptions.generic !== 'string' ) { createOptions.generic = 'xterm' ; }
	
	var termconfig ;
	var chainable = Object.create( notChainable ) ;
	var options = { on: '', off: '', params: 0, err: false, out: createOptions.stdout } ;
	
	var term = applyEscape.bind( undefined , options ) ;
	
	// Yay, this is a nasty hack...
	term.__proto__ = chainable ;	// jshint ignore:line
	term.apply = Function.prototype.apply ;
	
	// Fix the root
	options.root = term ;
	term.root = term ;
	
	term.createTerminal = createTerminal ;
	term.options = options ;
	term.stdin = createOptions.stdin ;
	term.stdout = createOptions.stdout ;
	term.stderr = createOptions.stderr ;
	term.generic = createOptions.generic ;
	term.app = createOptions.app ;
	term.appName = createOptions.appName ;
	term.pid = createOptions.pid ;
	term.grabbing = false ;
	term.timeout = 200 ;	// 200ms timeout by default, so ssh can work without trouble
	
	// Screen size
	term.width = undefined ;
	term.height = undefined ;
	onResize.call( term ) ;
	if ( term.stdout.isTTY ) { term.stdout.on( 'resize' , onResize.bind( term ) ) ; }
	else if ( createOptions.processSigwinch ) { process.on( 'SIGWINCH' , onResize.bind( term ) ) ; }
	
	// States
	term.state = {
		button: {
			left: false,
			middle: false,
			right: false,
			other: false
		}
	} ;
	
	//term.couldTTY = true ;
	
	if ( term.app )
	{
		// We have got the real terminal app
		try {
			term.termconfigFile = term.app + '.js' ;
			termconfig = require( './termconfig/' + term.termconfigFile ) ;
		}
		catch ( error ) {} // Do nothing, let the next if block handle the case
	}
	
	if ( ! termconfig )
	{
		// The real terminal app is not known, or we fail to load it...
		// Fallback to the terminal generic (most of time, got from the $TERM env variable).
		try {
			// If a .generic.js file exists, this is a widely used terminal generic, 'xterm' for example.
			// We should use this generic files because despite advertising them as 'xterm',
			// most terminal sucks at being truly 'xterm' compatible (only 33% to 50% of xterm capabilities
			// are supported, even gnome-terminal and Konsole are bad).
			// So we will try to maintain a fail-safe xterm generic config.
			term.termconfigFile = term.generic + '.generic.js' ;
			termconfig = require( './termconfig/' + term.termconfigFile ) ;
		}
		catch ( error ) {
			try {
				// No generic config exists, try a specific config
				term.termconfigFile = term.generic + '.js' ;
				termconfig = require( './termconfig/' + term.termconfigFile ) ;
			}
			catch ( error ) {
				// Nothing found, fallback to the most common terminal generic
				term.termconfigFile = 'xterm.generic.js' ;
				termconfig = require( './termconfig/' + term.termconfigFile ) ;
			}
		}
	}
	
	//console.log( term.termconfigFile ) ;
	
	// if needed, this should be replaced by some tput commands?
	
	term.esc = tree.extend( { deep: true } , {} , termconfig.esc ) ;
	tree.extend( null , term.esc , pseudoEsc ) ;	// Do not use deep:true here
	term.handler = tree.extend( null , {} , termconfig.handler ) ;
	term.keymap = tree.extend( { deep: true } , {} , termconfig.keymap ) ;
	
	term.escHandler = { root: term } ;
	
	// reverse keymap
	term.rKeymap = [] ;
	term.rKeymapMaxSize = -1 ;
	term.rKeymapStarter = [] ;
	term.rKeymapStarterMaxSize = -1 ;
	
	Object.keys( term.keymap ).forEach( function( key ) {
		
		var i , j , keymapObject , code , codeList = term.keymap[ key ] ;
		
		if ( ! Array.isArray( codeList ) ) { codeList = [ codeList ] ; term.keymap[ key ] = codeList ; }
		
		for ( j = 0 ; j < codeList.length ; j ++ )
		{
			code = codeList[ j ] ;
			
			if ( typeof code === 'object' )
			{
				keymapObject = code ;
				keymapObject.name = key ;
				code = keymapObject.code ;
			}
			else
			{
				keymapObject = {
					code: code ,
					name: key ,
					matches: [ key ]
				} ;
				
				term.keymap[ key ][ j ] = { code: code } ;
			}
			
			// keymap handler
			if ( keymapObject.handler && typeof keymapObject.handler !== 'function' )
			{
				term.keymap[ key ][ j ].handler = term.handler[ keymapObject.handler ] ;
			}
			
			if ( code )
			{
				if ( code.length > term.rKeymapMaxSize )
				{
					for ( i = term.rKeymapMaxSize + 1 ; i <= code.length ; i ++ ) { term.rKeymap[ i ] = {} ; }
					term.rKeymapMaxSize = code.length ;
				}
				
				if ( term.rKeymap[ code.length ][ code ] )
				{
					term.rKeymap[ code.length ][ code ].matches.push( key ) ;
				}
				else
				{
					term.rKeymap[ code.length ][ code ] = keymapObject ;
					term.rKeymap[ code.length ][ code ].matches = [ key ] ;
				}
			}
			else
			{
				if ( ! keymapObject.starter || ! keymapObject.ender || ! keymapObject.handler ) { continue ; }
				
				if ( keymapObject.starter.length > term.rKeymapStarterMaxSize )
				{
					for ( i = term.rKeymapStarterMaxSize + 1 ; i <= keymapObject.starter.length ; i ++ ) { term.rKeymapStarter[ i ] = {} ; }
					term.rKeymapStarterMaxSize = keymapObject.starter.length ;
				}
				
				if ( term.rKeymapStarter[ keymapObject.starter.length ][ keymapObject.starter ] )
				{
					term.rKeymapStarter[ keymapObject.starter.length ][ keymapObject.starter ].push( key ) ;
				}
				else
				{
					term.rKeymapStarter[ keymapObject.starter.length ][ keymapObject.starter ] = [ keymapObject ] ;
				}
			}
		}
	} ) ;
	
	
	// Create methods for the 'chainable' prototype
	
	Object.keys( term.esc ).forEach( function( key ) {
		
		// build-time resolution
		if ( typeof term.esc[ key ].on === 'function' ) { term.esc[ key ].on = term.esc[ key ].on.call( term ) ; }
		if ( typeof term.esc[ key ].off === 'function' ) { term.esc[ key ].off = term.esc[ key ].off.call( term ) ; }
		
		// dynamic handler
		if ( term.esc[ key ].handler )
		{
			if ( typeof term.esc[ key ].handler === 'function' ) { term.escHandler[ key ] = term.esc[ key ].handler ; }
			else { term.escHandler[ key ] = term.handler[ term.esc[ key ].handler ] ; }
		}
		
		Object.defineProperty( chainable , key , {
			configurable: true ,
			get: function () {
				var fn , options = {} ;
				
				options = tree.extend( null , {} , this.options ) ;
				
				options.on += this.root.esc[ key ].on || '' ;
				options.off = ( this.root.esc[ key ].off || '' ) + options.off ;
				options.params += string.format.count( this.root.esc[ key ].on ) ;
				
				if ( this.root.esc[ key ].err ) { options.out = this.root.stderr ; }
				if ( this.root.esc[ key ].str ) { options.str = true ; }
				
				fn = applyEscape.bind( undefined , options ) ;
				
				// Yay, this is a nasty hack...
				fn.__proto__ = chainable ;	// jshint ignore:line
				fn.apply = Function.prototype.apply ;
				
				fn.root = this.root || this ;
				fn.options = options ;
				
				// Replace the getter by the newly created function, to speed up further call
				Object.defineProperty( this , key , { value: fn } ) ;
				
				//console.log( 'Create function:' , key ) ;
				
				return fn ;
			}
		} ) ;
	} ) ;
	
	
	return term ;
}





			/* Apply */



// CAUTION: 'options' MUST NOT BE OVERWRITTEN!
// It is binded at the function creation and contains function specificities!
function applyEscape( options )
{
	var formatParams , output , on = options.on ;
	
	// If not enough arguments, return right now
	// Well... what about term.up(), term.previousLine(), and so on?
	//if ( arguments.length < 1 + options.params ) { return options.root ; }
	
	var action = arguments[ 1 + options.params ] ;
	
	if ( options.params )
	{
		formatParams = Array.prototype.slice.call( arguments , 1 , 1 + options.params ) ;
		formatParams.unshift( options.on ) ;
		//console.log( '\napplyEscape arguments' , arguments ) ;
		//console.log( '\napplyEscape formatParams:' , formatParams ) ;
		on = string.format.apply( options.root.escHandler , formatParams ) ;
	}
	
	//console.log( 'Attributes:' , attributes ) ;
	if ( action === undefined || action === true )
	{
		if ( options.str ) { return on ; }
		options.out.write( on ) ;
		return options.root ;
	}
	
	if ( action === null || action === false )
	{
		if ( options.str ) { return options.off ; }
		options.out.write( options.off ) ;
		return options.root ;
	}
	
	if ( typeof action !== 'string' )
	{
		if ( typeof action.toString === 'function' ) { action = action.toString() ; }
		else { action = '' ; }
	}
	
	// So we have got a string
	
	if ( arguments.length > 2 )
	{
		formatParams = Array.prototype.slice.call( arguments , 1 + options.params ) ;
		output = on + string.format.apply( options.root.escHandler , formatParams ) + options.off ;
	}
	else
	{
		output = on + action + options.off ;
	}
	
	if ( options.str ) { return output ; }
	options.out.write( output ) ;
	return options.root ;
}





			/* Pseudo esc */



var pseudoEsc = {
	// It just set error:true so it will write to STDERR instead of STDOUT
	error: { err: true } ,
	
	// It just set str:true so it will not write anything, but return the value in a string
	str: { str: true } ,
	
	move: {
		on: '%[move:%a%a]' ,
		handler: function move( x , y ) {
			
			var sequence = '' ;
			
			if ( x )
			{
				if ( x > 0 ) { sequence += string.format( this.root.esc.right.on , x ) ; }
				else { sequence += string.format( this.root.esc.left.on , -x ) ; }
			}
			
			if ( y )
			{
				if ( y > 0 ) { sequence += string.format( this.root.esc.down.on , y ) ; }
				else { sequence += string.format( this.root.esc.up.on , -y ) ; }
			}
			
			return sequence ;
		}
	} ,
	
	color: {
		on: '%[color:%a]' ,
		off: function() { return this.root.esc.defaultColor.on ; } ,
		handler: function color( c )
		{
			if ( typeof c !== 'number' ) { return '' ; }
			
			c = Math.floor( c ) ;
			
			if ( c < 0 || c > 15 ) { return '' ; }
			
			if ( c <= 7 ) { return string.format( this.root.esc.darkColor.on , c ) ; }
			else { return string.format( this.root.esc.brightColor.on , c - 8 ) ; }
		}
	} ,
	
	bgColor: {
		on: '%[bgColor:%a]' ,
		off: function() { return this.root.esc.bgDefaultColor.on ; } ,
		handler: function bgColor( c )
		{
			if ( typeof c !== 'number' ) { return '' ; }
			
			c = Math.floor( c ) ;
			
			if ( c < 0 || c > 15 ) { return '' ; }
			
			if ( c <= 7 ) { return string.format( this.root.esc.bgDarkColor.on , c ) ; }
			else { return string.format( this.root.esc.bgBrightColor.on , c - 8 ) ; }
		}
	} ,
	
	// RGB: 0-5,0-5,0-5
	color256rgb: {
		on: '%[color256rgb:%a%a%a]' ,
		off: function() { return this.root.esc.defaultColor.on ; } ,
		handler: function color256rgb( r , g , b )
		{
			if ( typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' ) { return '' ; }
			
			var c = Math.floor( 16 + r * 36 + g * 6 + b ) ;
			
			// min:16 max:231
			if ( c < 16 || c > 231 ) { return '' ; }
			
			return string.format( this.root.esc.color256.on , c ) ;
		}
	} ,
	
	// RGB: 0-5,0-5,0-5
	bgColor256rgb: {
		on: '%[bgColor256rgb:%a%a%a]' ,
		off: function() { return this.root.esc.bgDefaultColor.on ; } ,
		handler: function bgColor256rgb( r , g , b )
		{
			if ( typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' ) { return '' ; }
			
			var c = Math.floor( 16 + r * 36 + g * 6 + b ) ;
			
			// min:16 max:231
			if ( c < 16 || c > 231 ) { return '' ; }
			
			return string.format( this.root.esc.bgColor256.on , c ) ;
		}
	} ,
	
	// 26 shades of gray: 0-25
	color256gray: {
		on: '%[color256gray:%a]' ,
		off: function() { return this.root.esc.defaultColor.on ; } ,
		handler: function color256gray( g )
		{
			var c ;
			
			if ( typeof g !== 'number' ) { return '' ; }
			
			g = Math.floor( g ) ;
			
			if ( g < 0 || g > 25 ) { return '' ; }
			
			if ( g === 0 ) { c = 16 ; }
			else if ( g === 25 ) { c = 231 ; }
			else { c = g + 232 ; }
			
			return string.format( this.root.esc.color256.on , c ) ;
		}
	} ,
	
	// 26 shades of gray: 0-25
	bgColor256gray: {
		on: '%[bgColor256gray:%a]' ,
		off: function() { return this.root.esc.bgDefaultColor.on ; } ,
		handler: function bgColor256gray( g )
		{
			var c ;
			
			if ( typeof g !== 'number' ) { return '' ; }
			
			g = Math.floor( g ) ;
			
			if ( g < 0 || g > 25 ) { return '' ; }
			
			if ( g === 0 ) { c = 16 ; }
			else if ( g === 25 ) { c = 231 ; }
			else { c = g + 231 ; }
			
			return string.format( this.root.esc.bgColor256.on , c ) ;
		}
	}
	
} ;





			/* Internal/private functions */



// Called by either SIGWINCH signal or stdout's 'resize' event.
// It is not meant to be used by end-user.
function onResize()
{
	if ( this.stdout.getWindowSize )
	{
		var windowSize = this.stdout.getWindowSize() ;
		this.width = windowSize[ 0 ] ;
		this.height = windowSize[ 1 ] ;
	}
	
	this.emit( 'terminal' , 'SCREEN_RESIZE' , { resized: true , width: this.width , height: this.height } ) ;
}





			/* Advanced methods */



// Complexes functions that cannot be chained.
// It is the ancestors of the terminal object, so it should inherit from async.EventEmitter.
var notChainable = Object.create( async.EventEmitter.prototype ) ;



// Fail-safe alternate screen buffer
notChainable.fullscreen = function fullscreen( options )
{
	if ( options === false )
	{
		// Disable fullscreen mode
		this.moveTo( 1 , this.height , '\n' ) ;
		this.alternateScreenBuffer( false ) ;
		return this ;
	}
	
	if ( ! options ) { options = {} ; }
	
	if ( ! options.noAlternate ) { this.alternateScreenBuffer( true ) ; }
	
	this.clear() ;
} ;





			/* Input management */



function onStdin( chunk )
{
	var i , j , buffer , startBuffer , char , codepoint ,
		keymapCode , keymapStartCode , keymap , keymapList ,
		regexp , matches , bytes , found , handlerResult ,
		index = 0 , length = chunk.length ;
	
	while ( index < length )
	{
		found = false ;
		bytes = 1 ;
		
		if ( chunk[ index ] <= 0x1f || chunk[ index ] === 0x7f )
		{
			// Those are ASCII control character and DEL key
			
			for ( i = Math.min( length , Math.max( this.rKeymapMaxSize , this.rKeymapStarterMaxSize ) ) ; i > 0 ; i -- )
			{
				buffer = chunk.slice( index ) ;
				keymapCode = buffer.toString() ;
				startBuffer = chunk.slice( index , index + i ) ;
				keymapStartCode = startBuffer.toString() ;
				
				
				if ( this.rKeymap[ i ] && this.rKeymap[ i ][ keymapStartCode ] )
				{
					// First test fixed sequences
					
					keymap = this.rKeymap[ i ][ keymapStartCode ] ;
					found = true ;
					
					if ( keymap.handler )
					{
						handlerResult = keymap.handler.call( this , keymap.name , chunk.slice( index + i ) ) ;
						bytes = i + handlerResult.eaten ;
						
						if ( ! handlerResult.disable )
						{
							this.emit( keymap.event , handlerResult.name , handlerResult.data ) ;
						}
					}
					else if ( keymap.event )
					{
						bytes = i ;
						this.emit( keymap.event , keymap.name , keymap.data , { code: startBuffer } ) ;
					}
					else
					{
						bytes = i ;
						this.emit( 'key' , keymap.name , keymap.matches , { code: startBuffer } ) ;
					}
					
					break ;
				}
				else if ( this.rKeymapStarter[ i ] && this.rKeymapStarter[ i ][ keymapStartCode ] )
				{
					// Then test pattern sequences
					
					keymapList = this.rKeymapStarter[ i ][ keymapStartCode ] ;
					
					//console.log( 'for i:' , keymapList ) ;
					
					for ( j = 0 ; j < keymapList.length ; j ++ )
					{
						keymap = keymapList[ j ] ;
						
						regexp = '^' +
							string.escape.regExp( keymap.starter ) +
							'([ -~]*)' +	// [ -~] match only all ASCII non-control character
							string.escape.regExp( keymap.ender ) ;
						
						matches = keymapCode.match( new RegExp( regexp ) , 'g' ) ;
						
						//console.log( 'for j:' , keymap , regexp , matches ) ;
						
						if ( matches )
						{
							found = true ;
							
							handlerResult = keymap.handler.call( this , keymap.name , matches[ 1 ] ) ;
							bytes = matches[ 0 ].length ;
							this.emit( keymap.event , handlerResult.name , handlerResult.data ) ;
							
							break ;
						}
					}
					
					if ( found ) { break ; }
				}
			}
			
			// Nothing was found, so to not emit trash, we just abort the current buffer processing
			if ( ! found ) { this.emit( 'unknown' , chunk ) ; return ; }
		}
		else if ( chunk[ index ] >= 0x80 )
		{
			// Unicode bytes per char guessing
			if ( chunk[ index ] < 0xc0 ) { continue ; }	// We are in a middle of an unicode multibyte sequence... Something fails somewhere, we will just continue for now...
			else if ( chunk[ index ] < 0xe0 ) { bytes = 2 ; }
			else if ( chunk[ index ] < 0xf0 ) { bytes = 3 ; }
			else if ( chunk[ index ] < 0xf8 ) { bytes = 4 ; }
			else if ( chunk[ index ] < 0xfc ) { bytes = 5 ; }
			else { bytes = 6 ; }
			
			buffer = chunk.slice( index , index.bytes ) ;
			char = buffer.toString( 'utf8' ) ;
			
			if ( bytes > 2 ) { codepoint = punycode.ucs2.decode( char )[ 0 ] ; }
			else { codepoint = char.charCodeAt( 0 ) ; }
			
			this.emit( 'key' , char , [ char ] , { codepoint: codepoint , code: buffer } ) ;
		}
		else
		{
			// Standard ASCII
			char = String.fromCharCode( chunk[ index ] ) ;
			this.emit( 'key' , char , [ char ] , { codepoint: chunk[ index ] , code: chunk[ index ] } ) ;
		}
		
		index += bytes ;
	}
}



notChainable.grabInput = function grabInput( options )
{
	if ( ! this.onStdin ) { this.onStdin = onStdin.bind( this ) ; }
	
	// RESET
	this.stdout.write(
		this.esc.mouseButton.off +
		this.esc.mouseDrag.off +
		this.esc.mouseMotion.off +
		this.esc.mouseSGR.off +
		this.esc.focusEvent.off
	) ;
	
	if ( options === false )
	{
		// Disable grabInput mode
		this.stdin.removeListener( 'data' , this.onStdin ) ;
		this.stdin.setRawMode( false ) ;
		this.grabbing = false ;
		return this ;
	}
	
	this.grabbing = true ;
	
	if ( ! options ) { options = {} ; }
	
	// SET
	this.stdin.setRawMode( true ) ;
	this.stdin.on( 'data' , this.onStdin ) ;
	
	if ( options.mouse )
	{
		switch ( options.mouse )
		{
			case 'button' : this.stdout.write( this.esc.mouseButton.on + this.esc.mouseSGR.on ) ; break ;
			case 'drag' : this.stdout.write( this.esc.mouseDrag.on + this.esc.mouseSGR.on ) ; break ;
			case 'motion' : this.stdout.write( this.esc.mouseMotion.on + this.esc.mouseSGR.on ) ; break ;
		}
	}
	
	if ( options.focus ) { this.stdout.write( this.esc.focusEvent.on ) ; }
	
	return this ;
} ;



/*
	yesOrNo( [yes] , [no] , callback )
		* options `Object`
			* yes `string` or `Array` contains a key code or an array of key code that will trigger the yes
			* no `string` or `Array` contains a key code or an array of key code that will trigger the no
			* echoYes `string` if defined this will be what will be outputed in case of yes
			* echoNo `string` if defined this will be what will be outputed in case of no
		* callback( error , result )
			* result: true for 'yes' or false for 'no'
*/
notChainable.yesOrNo = function yesOrNo( options , callback )
{
	if ( arguments.length <= 0 ) { throw new Error( '[terminal] yesOrNo(): should at least provide one callback as argument' ) ; }
	if ( arguments.length === 1 ) { callback = options ; options = undefined ; }
	
	if ( ! options || typeof options !== 'object' )
	{
		options = {
			yes: [ 'y' , 'Y' ] ,
			no: [ 'n' , 'N' ] ,
			echoYes: 'yes' ,
			echoNo: 'no'
		} ;
	}
	
	if ( typeof options.yes === 'string' ) { options.yes = [ options.yes ] ; }
	if ( ! Array.isArray( options.yes ) ) { options.yes = [ 'y' , 'Y' ] ; }
	
	if ( typeof options.no === 'string' ) { options.no = [ options.no ] ; }
	if ( ! Array.isArray( options.no ) ) { options.no = [ 'n' , 'N' ] ; }
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	var self = this ;
	
	var onKey = function( key ) {
		
		if ( options.yes.indexOf( key ) !== -1 )
		{
			if ( options.echoYes ) { self( options.echoYes ) ; }
			this.removeListener( 'key' , onKey ) ;
			callback( undefined , true ) ;
		}
		else if ( options.no.indexOf( key ) !== -1 )
		{
			if ( options.echoNo ) { self( options.echoNo ) ; }
			this.removeListener( 'key' , onKey ) ;
			callback( undefined , false ) ;
		}
	} ;
	
	this.on( 'key' , onKey ) ;
} ;



notChainable.inputField = function inputField( options , callback )
{
	if ( arguments.length <= 0 ) { throw new Error( '[terminal] inputField(): should at least provide one callback as argument' ) ; }
	if ( arguments.length === 1 ) { callback = options ; options = undefined ; }
	
	if ( ! options || typeof options !== 'object' )
	{
		options = {
			echo: true
		} ;
	}
	
	if ( ! this.grabbing ) { this.grabInput() ; }
	
	var self = this , input = '' , offset = 0 , start = {} , end = {} , cursor = {} ;
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var computeAllCoordinate = function computeAllCoordinate()
	{
		end = offsetCoordinate( input.length ) ;
		
		if ( end.y > self.height )
		{
			start.y -= end.y - self.height ;
			end.y = self.height ;
		}
		
		cursor = offsetCoordinate( offset ) ;
	} ;
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var offsetCoordinate = function offsetCoordinate( offset )
	{
		return {
			x: 1 + ( start.x + offset - 1 ) % self.width ,
			y: start.y + Math.floor( ( start.x + offset - 1 ) / self.width )
		} ;
	} ;
	
	// Compute the coordinate of the end of a string, given a start coordinate
	var redraw = function redraw()
	{
		self.moveTo( start.x , start.y , input ) ;
		self.moveTo.eraseLineAfter( end.x , end.y ) ;
		self.moveTo( cursor.x , cursor.y ) ;
	} ;
	
	var onKey = function onKey( key ) {
		
		if ( key.length === 1 )
		{
			// if length = 1, this is a regular UTF8 character, not a special key
			
			// Insert version
			input = input.slice( 0 , offset ) + key + input.slice( offset ) ;
			
			// Overwrite version
			//input = input.slice( 0 , offset ) + key + input.slice( offset + 1 ) ;
			
			offset ++ ;
			
			if ( options.echo )
			{
				computeAllCoordinate() ;
				if ( offset === input.length ) { self( key ) ; }
				else { redraw() ; }		// necessary in insert mode
			}
		}
		else
		{
			// Here we have a special key
			
			switch ( key )
			{
				case 'ENTER' :
				case 'KP_ENTER' :
					this.removeListener( 'key' , onKey ) ;
					callback( undefined , input ) ;
					break ;
				
				case 'BACKSPACE' :
					if ( input.length && offset > 0 )
					{
						input = input.slice( 0 , offset - 1 ) + input.slice( offset ) ;
						offset -- ;
						
						if ( options.echo )
						{
							computeAllCoordinate() ;
							if ( cursor.y < end.y || end.x === 1 ) { redraw() ; }
							else { self.backDelete() ; }
						}
					}
					break ;
				
				case 'DELETE' :
					if ( input.length && offset < input.length )
					{
						input = input.slice( 0 , offset ) + input.slice( offset + 1 ) ;
						
						if ( options.echo )
						{
							computeAllCoordinate() ;
							if ( cursor.y < end.y || end.x === 1 ) { redraw() ; }
							else { self.delete( 1 ) ; }
						}
					}
					break ;
				
				case 'LEFT' :
					if ( input.length && offset > 0 )
					{
						offset -- ;
						
						if ( options.echo )
						{
							computeAllCoordinate() ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;
				
				case 'RIGHT' :
					if ( input.length && offset < input.length )
					{
						offset ++ ;
						
						if ( options.echo )
						{
							computeAllCoordinate() ;
							self.moveTo( cursor.x , cursor.y ) ;
						}
					}
					break ;
				
				case 'HOME' :
					offset = 0 ;
					if ( options.echo )
					{
						computeAllCoordinate() ;
						self.moveTo( cursor.x , cursor.y ) ;
					}
					break ;
				
				case 'END' :
					offset = input.length ;
					if ( options.echo )
					{
						computeAllCoordinate() ;
						self.moveTo( cursor.x , cursor.y ) ;
					}
					break ;
			}
		}
	} ;
	
	if ( options.echo )
	{
		this.getCursorLocation( function( error , x , y ) {
			start.x = end.x = cursor.x = x ;
			start.y = end.y = cursor.y = y ;
			self.on( 'key' , onKey ) ;
		} ) ;
	}
	else
	{
		this.on( 'key' , onKey ) ;
	}
} ;



// A facility for those who don't want to deal with requestCursorLocation() and events...
notChainable.getCursorLocation = function getCursorLocation( callback )
{
	var self = this , wasGrabbing = this.grabbing ;
	
	if ( ! wasGrabbing ) { this.grabInput() ; }
	
	var onTerminal = function onTerminal( name , data ) {
		
		if ( name !== 'CURSOR_LOCATION' ) { return ; }
		self.removeListener( 'terminal' , onTerminal ) ;
		if ( ! wasGrabbing ) { this.grabInput( false ) ; }
		callback( undefined , data.x , data.y ) ;
	} ;
	
	this.requestCursorLocation() ;
	this.on( 'terminal' , onTerminal ) ;
} ;



// Get the RGB value for a color register
notChainable.getColorRegister = function getColorRegister( register , callback )
{
	// First, check capabilities:
	if ( this.esc.requestColorRegister.na ) { callback( new Error( 'Terminal is not capable' ) ) ; }
	
	var self = this , wasGrabbing = this.grabbing ;
	
	var cleanup = function( error , data ) {
		self.removeListener( 'terminal' , onTerminal ) ;
		if ( ! wasGrabbing ) { self.grabInput( false ) ; }
		
		if ( error ) { callback( error ) ; }
		else { callback( undefined , data ) ; }	//data.r , data.g , data.b ) ;
	} ;
	
	var onTerminal = function onTerminal( timeoutCallback , name , data ) {
		
		if ( name !== 'COLOR_REGISTER' ) { return ; }
		
		// We have got a color definition, but this is not for our register, so this is not our response
		if ( data.register !== register ) { return ; }
		
		// Everything is fine...
		timeoutCallback( undefined , data ) ;
	} ;
	
	async.callTimeout( this.timeout , cleanup , function( timeoutCallback ) {
		
		if ( ! wasGrabbing ) { self.grabInput() ; }
		
		self.requestColorRegister( register ) ;
		self.on( 'terminal' , onTerminal.bind( undefined , timeoutCallback ) ) ;
	} ) ;
} ;





			/* Utilities */



// Default colors, used for guessing
var defaultColorRegister = [
	{ r: 0, g: 0, b: 0 } ,
	{ r: 200, g: 0, b: 0 } ,
	{ r: 0, g: 200, b: 0 } ,
	{ r: 200, g: 200, b: 0 } ,
	{ r: 0, g: 0, b: 200 } ,
	{ r: 200, g: 0, b: 200 } ,
	{ r: 0, g: 200, b: 200 } ,
	{ r: 220, g: 220, b: 220 } ,
	{ r: 55, g: 55, b: 55 } ,
	{ r: 255, g: 0, b: 0 } ,
	{ r: 0, g: 255, b: 0 } ,
	{ r: 255, g: 255, b: 0 } ,
	{ r: 0, g: 0, b: 255 } ,
	{ r: 255, g: 0, b: 255 } ,
	{ r: 0, g: 255, b: 255 } ,
	{ r: 255, g: 255, b: 255 }
] ;

( function buildDefaultColorRegister()
{
	var register , offset , l ;
	
	for ( register = 16 ; register < 232 ; register ++ )
	{
		// RGB 6x6x6
		offset = register - 16 ;
		factor = 255 / 5 ;
		defaultColorRegister[ register ] = {
			r: Math.floor( ( Math.floor( offset / 36 ) % 6 ) * factor ) ,
			g: Math.floor( ( Math.floor( offset / 6 ) % 6 ) * factor ) ,
			b: Math.floor( ( offset % 6 ) * factor )
		} ;
	}
	
	for ( register = 232 ; register < 255 ; register ++ )
	{
		// Grayscale 0..23
		offset = register - 231 ;	// not 232, because the first of them is not a #000000 black
		factor = 255 / 25 ;	// not 23, because the last is not a #ffffff white
		l = Math.floor( offset * factor ) ;
		defaultColorRegister[ register ] = { r: l , g: l , b: l } ;
	}
} )()



// If register hasn't changed, this is used to get the RGB value for them
notChainable.defaultRgbForRegister = function defaultRgbForRegister( register )
{
	if ( register < 0 || register > 255 ) { throw new Error( 'Bad register value' ) ; }
	
	// Simply clone it
	return {
		r: defaultColorRegister[ register ].r ,
		g: defaultColorRegister[ register ].g ,
		b: defaultColorRegister[ register ].b
	} ;
} ;



// If register hasn't changed, this is used to get it for an RGB
// .defaultRegisterForRgb( r , g , b , [minRegister] , [maxRegister] )
// .defaultRegisterForRgb( rgbObject , [minRegister] , [maxRegister] )
notChainable.defaultRegisterForRgb = function defaultRegisterForRgb( r , g , b , minRegister , maxRegister )
{
	// Manage function arguments
	
	if ( typeof r === 'object' )
	{
		// Manage the .defaultRegisterForRgb( rgbObject , [minRegister] , [maxRegister] ) variante
		maxRegister = b ;
		minRegister = g ;
		b = r.b ;
		g = r.g ;
		r = r.r ;
	}
	
	if ( r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 ) { throw new Error( 'Bad rgb value' ) ; }
	if ( maxRegister !== 'number' || maxRegister < 0 || maxRegister > 255 ) { maxRegister = 15 ; }
	if ( minRegister !== 'number' || minRegister < 0 || minRegister > 255 ) { minRegister = 0 ; }
	if ( minRegister > maxRegister )
	{
		var tmp ;
		tmp = maxRegister ;
		maxRegister = minRegister ;
		minRegister = tmp ;
	}
	
	
	// Search for the best match
	
	var dr , dg , db , register , offset = 0 , factor = 1 , minDiff = 1000000 ;
	
	if ( maxRegister <= 15 ) { offset = 127 ; factor = 0.45 ; }
	
	for ( register = minRegister ; register <= maxRegister ; register ++ )
	{
		dr = Math.abs( offset + r * factor - defaultColorRegister[ register ].r ) ;
		dg = Math.abs( offset + g * factor - defaultColorRegister[ register ].g ) ;
		db = Math.abs( offset + b * factor - defaultColorRegister[ register ].b ) ;
		
		diff = dr + dg + db ;
		//diff = dr * dr + dg * dg + db * db ;
		
		if ( diff < minDiff )
		{
			minDiff = diff ;
			minRegister = register ;
		}
	}
	
	return minRegister ;
} ;





			/* Terminal detection */



// Work localy, do not work over SSH
notChainable.getParentTerminalInfo = function getParentTerminalInfo( callback )
{
	var loop = 0 , name , terminfoName , pid = process.pid ;
	
	async.do( [
		function( asyncCallback ) {
			exec( 'ps -h -o ppid -p ' + pid , function( error , stdout ) {
				if ( error ) { asyncCallback( error ) ; return ; }
				pid = parseInt( stdout ) ;
				asyncCallback() ;
			} ) ;
		} ,
		function( asyncCallback ) {
			exec( 'ps -h -o comm -p ' + pid , function( error , stdout ) {
				if ( error ) { asyncCallback( error ) ; return ; }
				name = stdout.trim() ;
				asyncCallback() ;
			} ) ;
		}
	] )
	.while( function( error , results , asyncCallback ) {
		
		if ( error ) { asyncCallback( error ) ; return ; }
		
		//console.log( 'found:' , name , pid ) ;
		
		// Skip the first: it is the shell running node.js
		if ( ++ loop <= 1 ) { asyncCallback( undefined , true ) ; return ; }
		
		var t256color = process.env.TERM.match( /256color/ ) ? true : false ;
		
		switch ( name )
		{
			case 'linux' :
			case 'xterm' :
			case 'konsole' :
			case 'gnome-terminal':
			case 'Eterm':
			case 'eterm':
			case 'rxvt':
			case 'mrxvt':
			case 'aterm':
			case 'guake':
			case 'kuake':
			case 'tilda':
			case 'terminator':
			case 'terminology':
			case 'wterm':
			case 'xfce4-terminal' :
				terminfoName = t256color ? name + '-256color' : name ;
				break ;
			case 'login':
				name = 'linux' ;
				terminfoName = name ;
				break ;
			case 'gnome-terminal':
			case 'gnome-terminal-':
				name = 'gnome-terminal' ;
				terminfoName = t256color ? 'gnome-256color' : 'gnome' ;
				break ;
			default :
				if ( pid === 1 ) { asyncCallback( new Error( 'Terminal not found' ) ) ; }
				else { asyncCallback( undefined , true ) ; }
				return ;
		}
		
		asyncCallback( undefined , false ) ;
	} )
	.exec( function( error ) {
		if ( error ) { callback( error ) ; }
		callback( undefined , terminfoName , name , pid ) ;
	} ) ;
} ;



// Work localy, do not work over SSH
notChainable.getDetectedTerminal = function getDetectedTerminal( callback )
{
	//var self = this ;
	
	this.getParentTerminalInfo( function( error , codename , name , pid ) {
		if ( error ) { callback( error ) ; }
		callback( undefined , createTerminal( {
			stdin: process.stdin ,
			stdout: process.stdout ,
			stderr: process.stderr ,
			generic: process.env.TERM ,
			app: codename ,
			appName: name ,
			pid: pid ,
			processSigwinch: true
		} ) ) ;
	} ) ;
} ;



module.exports = createTerminal( {
	stdin: process.stdin ,
	stdout: process.stdout ,
	stderr: process.stderr ,
	generic: process.env.TERM ,
	processSigwinch: true
	// couldTTY: true
} ) ;


