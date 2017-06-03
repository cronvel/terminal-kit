/*
	Terminal Kit
	
	Copyright (c) 2009 - 2017 Cédric Ronvel
	
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
var tree = require( 'tree-kit' ) ;
var async = require( 'async-kit' ) ;
var string = require( 'string-kit' ) ;
var punycode = require( 'punycode' ) ;
var NextGenEvents = require( 'nextgen-events' ) ;

var termkit = require( './termkit.js' ) ;
var hslConverter = require( './hslConverter.js' ) ;



// This is used for adjustement of floating point value, before applying Math.floor()
var adjustFloor = 0.0000001 ;



function Terminal() { throw new Error( '[terminal] Cannot create a Terminal instance directly, use termkit.createTerminal() instead.' ) ; }
Terminal.prototype = Object.create( NextGenEvents.prototype ) ;
Terminal.prototype.constructor = Terminal ;
module.exports = Terminal ;



Terminal.create = function createTerminal( createOptions )
{
	// Default options...
	if ( ! createOptions || typeof createOptions !== 'object' ) { createOptions = {} ; }
	if ( ! createOptions.stdin ) { createOptions.stdin = process.stdin ; }
	if ( ! createOptions.stdout ) { createOptions.stdout = process.stdout ; }
	if ( ! createOptions.stderr ) { createOptions.stderr = process.stderr ; }
	if ( typeof createOptions.generic !== 'string' ) { createOptions.generic = 'xterm' ; }
	
	var k ;
	
	var termconfig ;
	var chainable = Object.create( notChainable ) ;
	var options = { on: '', off: '', params: 0, out: createOptions.stdout } ;
	
	var term = applyEscape.bind( undefined , options ) ;
	
	// Yay, this is a nasty hack...
	//term.__proto__ = chainable ;	// jshint ignore:line
	Object.setPrototypeOf( term , chainable ) ;		// jshint ignore:line
	term.apply = Function.prototype.apply ;
	term.call = Function.prototype.call ;
	
	// Fix the root
	options.root = term ;
	term.root = term ;
	
	term.options = options ;
	term.stdin = createOptions.stdin ;
	term.stdout = createOptions.stdout ;
	term.stderr = createOptions.stderr ;
	term.generic = createOptions.generic ;
	term.appId = createOptions.appId ;
	term.appName = createOptions.appName ;
	term.pid = createOptions.pid ;
	term.grabbing = false ;
	term.mouseGrabbing = false ;
	term.focusGrabbing = false ;
	term.timeout = 200 ;	// 200ms timeout by default, so ssh can work without trouble
	term.shutdown = false ;
	
	// Bindings
	term.onStdin = onStdin.bind( term ) ;
	
	term.lock = {} ;
	
	// Screen size
	term.width = undefined ;
	term.height = undefined ;
	onResize.call( term ) ;
	if ( term.stdout.isTTY ) { term.stdout.on( 'resize' , onResize.bind( term ) ) ; }
	else if ( createOptions.processSigwinch ) { process.on( 'SIGWINCH' , onResize.bind( term ) ) ; }
	
	// States
	term.state = {
		fullscreen: false ,
		button: {
			left: false,
			middle: false,
			right: false,
			other: false
		}
	} ;
	
	//term.couldTTY = true ;
	
	if ( term.appId )
	{
		// We have got the real terminal app
		try {
			term.termconfigFile = term.appId + '.js' ;
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
	term.support = tree.extend( { deep: true } , {} , termconfig.support ) ;
	
	tree.extend(
		null ,		// Do not use deep:true here
		term.esc ,
		pseudoEsc ,
		{
			// Aliases
			gray: term.esc.brightBlack ,
			bgGray: term.esc.bgBrightBlack
		}
	) ;
	
	term.handler = tree.extend( null , {} , termconfig.handler ) ;
	term.keymap = tree.extend( { deep: true } , {} , termconfig.keymap ) ;
	term.colorRegister = tree.extend( { deep: true } , [] , defaultColorRegister , termconfig.colorRegister ) ;
	
	term.escHandler = { root: term } ;
	term.escOffHandler = { root: term } ;
	
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
			if ( typeof term.esc[ key ].handler === 'function' ) { term.escHandler[ key ] = term.esc[ key ].handler.bind( term ) ; }
			else { term.escHandler[ key ] = term.handler[ term.esc[ key ].handler ] ; }
		}
		
		// dynamic off handler
		if ( term.esc[ key ].offHandler )
		{
			if ( typeof term.esc[ key ].offHandler === 'function' ) { term.escOffHandler[ key ] = term.esc[ key ].offHandler.bind( term ) ; }
			else { term.escOffHandler[ key ] = term.handler[ term.esc[ key ].offHandler ] ; }
		}
		
		Object.defineProperty( chainable , key , {
			configurable: true ,
			get: function () {
				var fn , options = {} ;
				
				options = tree.extend( null , {} , this.options ) ;
				
				options.on += this.root.esc[ key ].on || '' ;
				options.off = ( this.root.esc[ key ].off || '' ) + options.off ;
				options.params += string.format.count( this.root.esc[ key ].on ) ;
				
				if ( ! options.onHasFormatting &&
					( options.params ||
						( typeof this.root.esc[ key ].on === 'string' &&
							string.format.hasFormatting( this.root.esc[ key ].on ) ) ) )
				{
					options.onHasFormatting = true ;
				}
				
				if ( ! options.offHasFormatting &&
					( typeof this.root.esc[ key ].off === 'string' &&
						string.format.hasFormatting( this.root.esc[ key ].off ) ) )
				{
					options.offHasFormatting = true ;
				}
				
				if ( this.root.esc[ key ].err ) { options.err = true ; options.out = this.root.stderr ; }
				if ( this.root.esc[ key ].str ) { options.str = true ; }
				if ( this.root.esc[ key ].noFormat ) { options.noFormat = true ; }
				if ( this.root.esc[ key ].markupOnly ) { options.markupOnly = true ; }
				
				fn = applyEscape.bind( undefined , options ) ;
				
				// Yay, this is a nasty hack...
				//fn.__proto__ = chainable ;	// jshint ignore:line
				Object.setPrototypeOf( fn , chainable ) ;	// jshint ignore:line
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
	
	// Format and markup config
	term.resetString = '' ;
	term.setResetString = function( str ) {
		term.resetString = string.markupMethod.call( term.formatConfig.rawMarkupConfig , str ) ;
	} ;
	
	var resetFn = ( extra ) => term.str.styleReset() + term.resetString + extra ;
	
	term.formatConfig = {
		fn: {} ,
		endingMarkupReset: true ,
		markupReset: resetFn.bind( undefined , '' ) ,
		//markupReset: term.str.styleReset() ,
		shiftMarkup: {
			'#': 'background'
		} ,
		markup: {
			":": resetFn.bind( undefined , '' ) ,
			" ": resetFn.bind( undefined , ' ' ) ,
			//":": term.str.styleReset() ,
			//" ": term.str.styleReset() + ' ' ,
			
			"-": term.str.dim() ,
			"+": term.str.bold() ,
			"_": term.str.underline() ,
			"/": term.str.italic() ,
			"!": term.str.inverse() ,
			
			"b": term.str.blue() ,
			"B": term.str.brightBlue() ,
			"c": term.str.cyan() ,
			"C": term.str.brightCyan() ,
			"g": term.str.green() ,
			"G": term.str.brightGreen() ,
			"k": term.str.black() ,
			"K": term.str.brightBlack() ,
			"m": term.str.magenta() ,
			"M": term.str.brightMagenta() ,
			"r": term.str.red() ,
			"R": term.str.brightRed() ,
			"w": term.str.white() ,
			"W": term.str.brightWhite() ,
			"y": term.str.yellow() ,
			"Y": term.str.brightYellow()
		} ,
		shiftedMarkup: {
			background: {
				":": resetFn.bind( undefined , '' ) ,
				" ": resetFn.bind( undefined , ' ' ) ,
				//":": term.str.styleReset() ,
				//" ": term.str.styleReset() + ' ' ,
				
				"b": term.str.bgBlue() ,
				"B": term.str.bgBrightBlue() ,
				"c": term.str.bgCyan() ,
				"C": term.str.bgBrightCyan() ,
				"g": term.str.bgGreen() ,
				"G": term.str.bgBrightGreen() ,
				"k": term.str.bgBlack() ,
				"K": term.str.bgBrightBlack() ,
				"m": term.str.bgMagenta() ,
				"M": term.str.bgBrightMagenta() ,
				"r": term.str.bgRed() ,
				"R": term.str.bgBrightRed() ,
				"w": term.str.bgWhite() ,
				"W": term.str.bgBrightWhite() ,
				"y": term.str.bgYellow() ,
				"Y": term.str.bgBrightYellow()
			}
		}
	} ;
	
	term.formatConfig.rawMarkupConfig = Object.create( term.formatConfig ) ;
	term.formatConfig.rawMarkupConfig.startingMarkupReset = false ;
	term.formatConfig.rawMarkupConfig.endingMarkupReset = false ;
	
	for ( k in term.escHandler ) { term.formatConfig.fn[ k ] = term.escHandler[ k ] ; }
	for ( k in term.escOffHandler ) { term.formatConfig.fn[ k + '_off' ] = term.escOffHandler[ k ] ; }
	
	term.format = string.formatMethod.bind( term.formatConfig ) ;
	term.markup = string.markupMethod.bind( term.formatConfig ) ;
	term.options = options ;
	
	// Should come after any escape sequence definitions
	createOptimized( term ) ;
	
	// Register various exit handler
	// Fix the issue #3, turn grabInput off on exit
	// Disable input grabbing at exit.
	// Note: the terminal can still send some garbage if it was about to do it when exit kickin.
	
	process.on( 'exit' , function() {
		//console.log( '>>> exit' ) ;
		// Cleanup was done from elsewhere, probably by .asyncCleanup()
		if ( term.shutdown ) { return ; }
		term.shutdown = true ;
		term.styleReset() ;
		term.grabInput( false ) ;
	} ) ;
	
	// async.exit() produce this:
	process.on( 'asyncExit' , function( code , timeout , done ) {
		//console.log( '>>> asyncExit' ) ;
		term.asyncCleanup( done ) ;
	} ) ;
	
	// The event loop is empty, we have more time to clean up things:
	// We keep the process running for a little bit of time, to prevent the terminal from displaying garbage.
	process.once( 'beforeExit' , function() {
		//console.log( '>>> beforeExit' ) ;
		term.asyncCleanup( function(){} ) ;
	} ) ;
	
	return term ;
} ;





			/* Optimized */



function createOptimized( term )
{
	// This is a subset of the terminal capability, mainly used to speed up ScreenBuffer and ScreenBufferHD
	var i ;
	
	term.optimized = {} ;
	
	// reset
	term.optimized.styleReset = term.str.styleReset() ;
	
	// Styles
	term.optimized.bold = term.str.bold() ;
	term.optimized.dim = term.str.dim() ;
	term.optimized.italic = term.str.italic() ;
	term.optimized.underline = term.str.underline() ;
	term.optimized.blink = term.str.blink() ;
	term.optimized.inverse = term.str.inverse() ;
	term.optimized.hidden = term.str.hidden() ;
	term.optimized.strike = term.str.strike() ;
	
	term.optimized.noBold = term.str.bold( false ) ;
	term.optimized.noDim = term.str.dim( false ) ;
	term.optimized.noItalic = term.str.italic( false ) ;
	term.optimized.noUnderline = term.str.underline( false ) ;
	term.optimized.noBlink = term.str.blink( false ) ;
	term.optimized.noInverse = term.str.inverse( false ) ;
	term.optimized.noHidden = term.str.hidden( false ) ;
	term.optimized.noStrike = term.str.strike( false ) ;
	
	// Colors
	term.optimized.color256 = [] ;
	term.optimized.bgColor256 = [] ;
	term.optimized.defaultColor = term.str.defaultColor()
	term.optimized.bgDefaultColor = term.str.bgDefaultColor()
	
	for ( i = 0 ; i <= 255 ; i ++ )
	{
		term.optimized.color256[ i ] = term.str.color256( i ) ;
		term.optimized.bgColor256[ i ] = term.str.bgColor256( i ) ;
	}
	
	// Move To
	term.optimized.moveTo = term.esc.moveTo.optimized || term.str.moveTo ;
	
	// 24 bits colors
	term.optimized.color24bits = term.esc.color24bits.optimized || term.str.color24bits ;
	term.optimized.bgColor24bits = term.esc.bgColor24bits.optimized || term.str.bgColor24bits ;
}





			/* Apply */



// CAUTION: 'options' MUST NOT BE OVERWRITTEN!
// It is binded at the function creation and contains function specificities!
function applyEscape( options )
{
	// Cause trouble because the shutting down process itself needs to send escape sequences asynchrnonously
	//if ( options.root.shutdown && ! options.str ) { return options.root ; }
	
	var onFormat = [ options.on ] , output , on , off ;
	
	var action = arguments[ 1 + options.params ] ;
	
	// If not enough arguments, return right now
	// Well... what about term.up(), term.previousLine(), and so on?
	//if ( arguments.length < 1 + options.params && ( action === null || action === false ) ) { return options.root ; }
	
	if ( options.params )
	{
		onFormat = onFormat.concat( Array.prototype.slice.call( arguments , 1 , 1 + options.params ) ) ;
	}
	
	//console.log( '\n>>> Action:' , action , '<<<\n' ) ;
	//console.log( 'Attributes:' , attributes ) ;
	if ( action === undefined || action === true )
	{
		on = options.onHasFormatting ? options.root.format.apply( undefined , onFormat ) : options.on ;
		if ( options.str ) { return on ; }
		options.out.write( on ) ;
		return options.root ;
	}
	
	if ( action === null || action === false )
	{
		off = options.offHasFormatting ? options.root.format( options.off ) : options.off ;
		if ( options.str ) { return off ; }
		options.out.write( off ) ;
		return options.root ;
	}
	
	if ( typeof action !== 'string' )
	{
		if ( typeof action.toString === 'function' ) { action = action.toString() ; }
		else { action = '' ; }
	}
	
	// So we have got a string
	
	on = options.onHasFormatting ? options.root.format.apply( undefined , onFormat ) : options.on ;
	
	if ( options.markupOnly )
	{
		action = options.root.markup.apply( undefined , Array.prototype.slice.call( arguments , 1 + options.params ) ) ;
	}
	else if ( ! options.noFormat )
	{
		action = options.root.format.apply( undefined , Array.prototype.slice.call( arguments , 1 + options.params ) ) ;
	}
	
	off = options.offHasFormatting ? options.root.format( options.off ) : options.off ;
	
	if ( options.root.resetString )
	{
		output = options.root.resetString + on + action + off + options.root.resetString ;
	}
	else
	{
		output = on + action + off ;
	}
	
	// tmp hack?
	if ( options.crlf ) { output = output.replace( /\n/g , '\r\n' ) ; }
	
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
	
	// It just set attr:true so it will not write anything, but return an attribute object
	attr: { attr: true } ,
	
	// It just set noFormat:true so it will not call string.format() on user input,
	// only useful for ScreenBuffer, so blit-like redraw() can perform slightly faster
	noFormat: { noFormat: true } ,
	markupOnly: { markupOnly: true } ,
	
	move: {
		on: '%[move:%a%a]F' ,
		handler: function move( x , y ) {
			
			var sequence = '' ;
			
			if ( x )
			{
				if ( x > 0 ) { sequence += this.root.format( this.root.esc.right.on , x ) ; }
				else { sequence += this.root.format( this.root.esc.left.on , -x ) ; }
			}
			
			if ( y )
			{
				if ( y > 0 ) { sequence += this.root.format( this.root.esc.down.on , y ) ; }
				else { sequence += this.root.format( this.root.esc.up.on , -y ) ; }
			}
			
			return sequence ;
		}
	} ,
	
	color: {
		on: '%[color:%a]F' ,
		off: function() { return this.root.esc.defaultColor.on ; } ,
		handler: function color( c )
		{
			if ( typeof c !== 'number' ) { return '' ; }
			
			c = Math.floor( c ) ;
			
			if ( c < 0 || c > 15 ) { return '' ; }
			
			if ( c <= 7 ) { return this.root.format( this.root.esc.darkColor.on , c ) ; }
			else { return this.root.format( this.root.esc.brightColor.on , c - 8 ) ; }
		}
	} ,
	
	bgColor: {
		on: '%[bgColor:%a]F' ,
		off: function() { return this.root.esc.bgDefaultColor.on ; } ,
		handler: function bgColor( c )
		{
			if ( typeof c !== 'number' ) { return '' ; }
			
			c = Math.floor( c ) ;
			
			if ( c < 0 || c > 15 ) { return '' ; }
			
			if ( c <= 7 ) { return this.root.format( this.root.esc.bgDarkColor.on , c ) ; }
			else { return this.root.format( this.root.esc.bgBrightColor.on , c - 8 ) ; }
		}
	} ,
	
	colorRgb: {
		on: '%[colorRgb:%a%a%a]F' ,
		off: function() { return this.root.esc.defaultColor.on ; } ,
		handler: colorRgbHandler
		
	} ,
	
	bgColorRgb: {
		on: '%[bgColorRgb:%a%a%a]F' ,
		off: function() { return this.root.esc.bgDefaultColor.on ; } ,
		handler: bgColorRgbHandler
	} ,
	
	colorRgbHex: {
		on: '%[colorRgbHex:%a]F' ,
		off: function() { return this.root.esc.defaultColor.on ; } ,
		handler: colorRgbHandler
		
	} ,
	
	bgColorRgbHex: {
		on: '%[bgColorRgbHex:%a]F' ,
		off: function() { return this.root.esc.bgDefaultColor.on ; } ,
		handler: bgColorRgbHandler
	} ,
	
	colorGrayscale: {
		on: '%[colorGrayscale:%a]F' ,
		off: function() { return this.root.esc.defaultColor.on ; } ,
		handler: function colorGrayscale( g )
		{
			var c ;
			
			if ( typeof g !== 'number' ) { return '' ; }
			if ( g < 0 || g > 255 ) { return '' ; }
			
			if ( ! this.root.esc.color24bits.na && ! this.root.esc.color24bits.fb )
			{
				// The terminal supports 24bits! Yeah!
				return this.root.format( this.root.esc.color24bits.on , g , g , g ) ;
			}
			
			if ( ! this.root.esc.color256.na && ! this.root.esc.color256.fb )
			{
				// The terminal supports 256 colors
				
				// Convert to 0..25 range
				g = Math.floor( g * 26 / 256 + adjustFloor ) ;
				
				if ( g < 0 || g > 25 ) { return '' ; }
				
				if ( g === 0 ) { c = 16 ; }
				else if ( g === 25 ) { c = 231 ; }
				else { c = g + 231 ; }
				
				return this.root.format( this.root.esc.color256.on , c ) ;
			}
			
			// The terminal does not support 256 colors, fallback
			c = this.root.registerForRgb( g , g , g , 0 , 15 ) ;
			return this.root.format( this.root.esc.color.on , c ) ;
		}
	} ,
	
	bgColorGrayscale: {
		on: '%[bgColorGrayscale:%a]F' ,
		off: function() { return this.root.esc.bgDefaultColor.on ; } ,
		handler: function bgColorGrayscale( g )
		{
			var c ;
			
			if ( typeof g !== 'number' ) { return '' ; }
			if ( g < 0 || g > 255 ) { return '' ; }
			
			if ( ! this.root.esc.bgColor24bits.na && ! this.root.esc.bgColor24bits.fb )
			{
				// The terminal supports 24bits! Yeah!
				return this.root.format( this.root.esc.bgColor24bits.on , g , g , g ) ;
			}
			
			if ( ! this.root.esc.bgColor256.na && ! this.root.esc.bgColor256.fb )
			{
				// Convert to 0..25 range
				//console.log( '-- ' , g , g * 26 / 256 , Math.floor( g * 26 / 256 ) , Math.floor( g * 26 / 256 + adjustFloor ) ) ;
				g = Math.floor( g * 26 / 256 + adjustFloor ) ;
				
				if ( g < 0 || g > 25 ) { return '' ; }
				
				if ( g === 0 ) { c = 16 ; }
				else if ( g === 25 ) { c = 231 ; }
				else { c = g + 231 ; }
				
				return this.root.format( this.root.esc.bgColor256.on , c ) ;
			}
			
			// The terminal does not support 256 colors, fallback
			c = this.root.registerForRgb( g , g , g , 0 , 15 ) ;
			return this.root.format( this.root.esc.bgColor.on , c ) ;
		}
	}
	
} ;





			/* Internal/private functions */



function colorRgbHandler( r , g , b )
{
	var c , rgb ;
	
	if ( typeof r === 'string' )
	{
		rgb = termkit.hexToColor( r ) ;
		r = rgb.r ; g = rgb.g ; b = rgb.b ;
	}
	
	if ( 
		typeof r !== 'number' || isNaN( r ) ||
		typeof g !== 'number' || isNaN( g ) ||
		typeof b !== 'number' || isNaN( b ) ||
		r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255
	)
	{
		return '' ;
	}
	
	if ( ! this.root.esc.color24bits.na && ! this.root.esc.color24bits.fb )
	{
		// The terminal supports 24bits! Yeah!
		return this.root.format( this.root.esc.color24bits.on , r , g , b ) ;
	}
	
	if ( ! this.root.esc.color256.na && ! this.root.esc.color256.fb )
	{
		// The terminal supports 256 colors
		
		// Convert to 0..5 range
		r = Math.floor( r * 6 / 256 + adjustFloor ) ;
		g = Math.floor( g * 6 / 256 + adjustFloor ) ;
		b = Math.floor( b * 6 / 256 + adjustFloor ) ;
		
		c = Math.floor( 16 + r * 36 + g * 6 + b ) ;
		
		// min:16 max:231
		//if ( c < 16 || c > 231 ) { return '' ; }
		
		return this.root.format( this.root.esc.color256.on , c ) ;
	}
	
	// The terminal does not support 256 colors, fallback
	c = this.root.registerForRgb( r , g , b , 0 , 15 ) ;
	return this.root.format( this.root.esc.color.on , c ) ;
}



function bgColorRgbHandler( r , g , b )
{
	var c , rgb ;
	
	if ( typeof r === 'string' )
	{
		rgb = termkit.hexToColor( r ) ;
		r = rgb.r ; g = rgb.g ; b = rgb.b ;
	}
	
	if ( 
		typeof r !== 'number' || isNaN( r ) ||
		typeof g !== 'number' || isNaN( g ) ||
		typeof b !== 'number' || isNaN( b ) ||
		r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255
	)
	{
		return '' ;
	}
	
	if ( ! this.root.esc.bgColor24bits.na && ! this.root.esc.bgColor24bits.fb )
	{
		// The terminal supports 24bits! Yeah!
		return this.root.format( this.root.esc.bgColor24bits.on , r , g , b ) ;
	}
	
	if ( ! this.root.esc.bgColor256.na && ! this.root.esc.bgColor256.fb )
	{
		// The terminal supports 256 colors
		
		// Convert to 0..5 range
		r = Math.floor( r * 6 / 256 + adjustFloor ) ;
		g = Math.floor( g * 6 / 256 + adjustFloor ) ;
		b = Math.floor( b * 6 / 256 + adjustFloor ) ;
		
		c = Math.floor( 16 + r * 36 + g * 6 + b ) ;
		
		// min:16 max:231
		//if ( c < 16 || c > 231 ) { return '' ; }
		
		return this.root.format( this.root.esc.bgColor256.on , c ) ;
	}
	
	// The terminal does not support 256 colors, fallback
	c = this.root.registerForRgb( r , g , b , 0 , 15 ) ;
	return this.root.format( this.root.esc.bgColor.on , c ) ;
}



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
	
	this.emit( 'resize' , this.width , this.height ) ;
}





			/* Advanced methods */



// Complexes functions that cannot be chained.
// It is the ancestors of the terminal object, so it should inherit from async.EventEmitter.
var notChainable = Object.create( Terminal.prototype ) ;



// Complexes high-level features have their own file
notChainable.yesOrNo = require( './yesOrNo.js' ) ;
notChainable.inputField = require( './inputField.js' ) ;
notChainable.fileInput = require( './fileInput.js' ) ;
notChainable.singleRowMenu = notChainable.singleLineMenu = require( './singleLineMenu.js' ) ;
notChainable.singleColumnMenu = require( './singleColumnMenu.js' ) ;
notChainable.gridMenu = require( './gridMenu.js' ) ;
notChainable.progressBar = require( './progressBar.js' ) ;
notChainable.slowTyping = require( './slowTyping.js' ) ;



notChainable.createDocument = function createDocument( options ) {
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	options.outputDst = this ;
	options.eventSource = this ;
	return termkit.Document.create( options ) ;
} ;



// Fail-safe alternate screen buffer
notChainable.fullscreen = function fullscreen( options )
{
	if ( options === false )
	{
		if ( ! this.state.fullscreen ) { return this ; }
		
		// Disable fullscreen mode
		this.state.fullscreen = false ;
		this.moveTo( 1 , this.height , '\n' ) ;
		this.alternateScreenBuffer( false ) ;
		return this ;
	}
	
	if ( ! options ) { options = {} ; }
	
	this.state.fullscreen = true ;
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
	
	if ( this.shutdown ) { return ; }
	
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
						this.emit( 'key' , keymap.name , keymap.matches , { isCharacter: false , code: startBuffer } ) ;
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
			
			buffer = chunk.slice( index , index + bytes ) ;
			char = buffer.toString( 'utf8' ) ;
			
			if ( bytes > 2 ) { codepoint = punycode.ucs2.decode( char )[ 0 ] ; }
			else { codepoint = char.charCodeAt( 0 ) ; }
			
			this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: codepoint , code: buffer } ) ;
		}
		else
		{
			// Standard ASCII
			char = String.fromCharCode( chunk[ index ] ) ;
			this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: chunk[ index ] , code: chunk[ index ] } ) ;
		}
		
		index += bytes ;
	}
}



/*
	* options `false` or `Object` where:
		* mouse `string` one of:
			* 'button'
			* 'drag'
			* 'motion'
		* focus `boolean`
	* safeCallback `Function` (optional), when set and when *options* is set to `false`, it turns *.grabInput()*
	  into an async function, the *safeCallback* is called when input grabbing is safely turned off, avoiding extra junks to
	  be echoed when the terminal left the raw mode. It is mostly useful after grabbing mouse motion.
*/
notChainable.grabInput = function grabInput( options , safeCallback )
{
	// RESET
	this.mouseButton( false ) ;
	this.mouseDrag( false ) ;
	this.mouseMotion( false ) ;
	//this.mouseSGR( false ) ;
	this.focusEvent( false ) ;
	this.stdin.removeListener( 'data' , this.onStdin ) ;
	
	// Start disabling everything
	this.grabbing = false ;
	this.mouseGrabbing = false ;
	this.focusGrabbing = false ;
	
	// Disable grabInput mode
	var disable = () => {
		// Very important: removing all listeners don't switch back to pause mode.
		// This is some nasty Node.js quirks (the documentation pleads for backward compatibility).
		this.stdin.pause() ;
		
		try {
			this.stdin.setRawMode( false ) ;
		}
		catch ( error ) {
			// That's not critical in any way and thus can be ignored: we are probably reading from a non-TTY
		}
		
		return this ;
	} ;
	
	if ( options === false )
	{
		if ( safeCallback )
		{
			async.setSafeTimeout( () => {
					disable() ;
					safeCallback() ;
				} ,
				this.timeout / 2
			) ;
		}
		else
		{
			return disable() ;
		}
	}
	
	// Should not be moved before, because shutdown typically needs .grabInput( false )
	if ( this.shutdown ) { return ; }
	
	this.grabbing = true ;
	
	if ( ! options ) { options = {} ; }
	
	// SET
	try {
		this.stdin.setRawMode( true ) ;
	}
	catch ( error ) {
		// Same here, that's not critical in any way and thus can be ignored: we are probably reading from a non-TTY
	}
	
	this.stdin.on( 'data' , this.onStdin ) ;
	
	// Very important: after the first this.stdin.pause(), listening for data seems to not switch back to flowing mode.
	// Again, a nasty Node.js quirk.
	this.stdin.resume() ;
	
	if ( options.mouse )
	{
		this.mouseGrabbing = true ;
		
		switch ( options.mouse )
		{
			case 'button' : this.mouseButton.mouseSGR() ; break ;
			case 'drag' : this.mouseDrag.mouseSGR() ; break ;
			case 'motion' : this.mouseMotion.mouseSGR() ; break ;
		}
	}
	
	if ( options.focus )
	{
		this.focusEvent() ;
		this.focusGrabbing = true ;
	}
	
	return this ;
} ;



// Like process.exit(), but perform cleanup of the terminal first.
// It is asynchronous, so it should be followed by a 'return' if needed.
// A better way to handle that is to use async.exit(), that is detected by the Terminal instance.
notChainable.processExit = function processExit( code )
{
	this( '\n' ) ;
	this.asyncCleanup( () => process.exit( code ) ) ;
} ;



notChainable.asyncCleanup = function asyncCleanup( callback )
{
	if ( this.shutdown ) { return ; }
	
	this.shutdown = true ;
	this.styleReset() ;
	
	var wasGrabbing = this.grabbing ;
	
	this.waitStreamDone( this.stdout , () => {
		
		if ( ! wasGrabbing ) { callback() ; return ; }
		
		async.setSafeTimeout( () => {
			this.grabInput( false , callback ) ;
			//this.grabInput( false ) ;
			//async.setSafeTimeout( callback , this.timeout / 4 ) ;
		} , this.timeout / 4 ) ;
	} ) ;
} ;



notChainable.waitStreamDone = function waitStreamDone( stream , callback )
{
	if ( ! stream._writableState.needDrain ) { callback() ; return ; }
	stream.once( 'drain' , callback ) ;
} ;



notChainable.object2attr = function object2attr( object )
{
	var attr = this.esc.styleReset.on ;
	
	if ( ! object || typeof object !== 'object' ) { object = {} ; }
	
	// Color part
	if ( typeof object.color === 'string' ) { object.color = termkit.color2index( object.color ) ; }
	if ( typeof object.color !== 'number' || object.color < 0 || object.color > 255 ) { object.color = 7 ; }
	else { object.color = Math.floor( object.color ) ; }
	
	attr += this.str.color( object.color ) ;
	
	// Background color part
	if ( typeof object.bgColor === 'string' ) { object.bgColor = termkit.color2index( object.bgColor ) ; }
	if ( typeof object.bgColor !== 'number' || object.bgColor < 0 || object.bgColor > 255 ) { object.bgColor = 0 ; }
	else { object.bgColor = Math.floor( object.bgColor ) ; }
	
	attr += this.str.bgColor( object.bgColor ) ;
	
	// Style part
	if ( object.bold ) { attr += this.esc.bold.on ; }
	if ( object.dim ) { attr += this.esc.dim.on ; }
	if ( object.italic ) { attr += this.esc.italic.on ; }
	if ( object.underline ) { attr += this.esc.underline.on ; }
	if ( object.blink ) { attr += this.esc.blink.on ; }
	if ( object.inverse ) { attr += this.esc.inverse.on ; }
	if ( object.hidden ) { attr += this.esc.hidden.on ; }
	if ( object.strike ) { attr += this.esc.strike.on ; }
	
	return attr ;
} ;



// A facility for those who don't want to deal with requestCursorLocation() and events...
notChainable.getCursorLocation = function getCursorLocation( callback )
{
	var wasGrabbing = this.grabbing , alreadyCleanedUp = false ;
	
	if ( this.shutdown ) { return ; }
	
	// Now .getCursorLocation() cannot run in concurrency anymore
	if ( this.lock.getCursorLocation )
	{
		this.once( 'unlock_getCursorLocation' , getCursorLocation.bind( this , callback ) ) ;
		return ;
	}
	
	this.lock.getCursorLocation = true ;
	
	var cleanup = ( error , x , y ) => {
		
		if ( alreadyCleanedUp ) { return ; }
		alreadyCleanedUp = true ;
		
		this.removeListener( 'terminal' , onTerminal ) ;
		if ( ! wasGrabbing ) { this.grabInput( false ) ; }
		
		if ( error )
		{
			if ( this.shutdown ) { error.code = 'shutdown' ; }
			callback( error ) ;
		}
		else
		{
			callback( undefined , x , y ) ;
		}
	} ;
	
	var onTerminal = ( name , data ) => {
		
		if ( name !== 'CURSOR_LOCATION' ) { return ; }
		this.lock.getCursorLocation = false ;
		this.emit( 'unlock_getCursorLocation' ) ;
		cleanup( undefined , data.x , data.y ) ;
	} ;
	
	if ( ! wasGrabbing ) { this.grabInput() ; }
	
	this.requestCursorLocation() ;
	this.on( 'terminal' , onTerminal ) ;
	
	async.setSafeTimeout( () => {
			if ( alreadyCleanedUp ) { return ; }
			var error = new Error( '.getCursorLocation() timed out' ) ;
			error.code = 'timeout' ;
			cleanup( error ) ;
		} ,
		this.timeout
	) ;
} ;



// Get the RGB value for a color register
notChainable.getColor = function getColor( register , callback )
{
	var wasGrabbing = this.grabbing , alreadyCleanedUp = false ;
	
	if ( this.shutdown ) { return ; }
	
	// First, check capabilities:
	if ( this.esc.requestColor.na ) { callback( new Error( 'Terminal is not capable' ) ) ; return ; }
	
	var cleanup = ( error , data ) => {
		
		if ( alreadyCleanedUp ) { return ; }
		alreadyCleanedUp = true ;
		
		this.removeListener( 'terminal' , onTerminal ) ;
		if ( ! wasGrabbing ) { this.grabInput( false ) ; }
		
		if ( error )
		{
			if ( this.shutdown ) { error.code = 'shutdown' ; }
			callback( error ) ;
		}
		else
		{
			callback( undefined , data ) ;	//data.r , data.g , data.b ) ;
		}
	} ;
	
	var onTerminal = ( name , data ) => {
		
		if ( name !== 'COLOR_REGISTER' ) { return ; }
		
		// We have got a color definition, but this is not for our register, so this is not our response
		if ( data.register !== register ) { return ; }
		
		// This is a good opportunity to update the color register
		if ( register < 16 ) { this.colorRegister[ register ] = { r: data.r , g: data.g , b: data.b } ; }
		
		// Everything is fine...
		cleanup( undefined , data ) ;
	} ;
	
	if ( ! wasGrabbing ) { this.grabInput() ; }
	
	this.requestColor( register ) ;
	this.on( 'terminal' , onTerminal ) ;
	
	async.setSafeTimeout( () => {
			if ( alreadyCleanedUp ) { return ; }
			var error = new Error( '.getColor() timed out' ) ;
			error.code = 'timeout' ;
			cleanup( error ) ;
		} ,
		this.timeout
	) ;
} ;



// Get the current 16 colors palette of the terminal, if possible
notChainable.getPalette = function getPalette( callback )
{
	var wasGrabbing = this.grabbing ;
	
	if ( this.shutdown ) { return ; }
	
	if ( ! wasGrabbing ) { this.grabInput() ; }
	
	// First, check capabilities, if not capable, return the default palette
	if ( this.esc.requestColor.na ) { callback( undefined , this.colorRegister.slice( 0 , 16 ) ) ; return ; }
	
	async.map(
		[ 0 , 1 , 2 , 3 , 4 , 5 , 6 , 7 , 8 , 9 , 10 , 11 , 12 , 13 , 14 , 15 ] ,
		this.getColor.bind( this )
	)
	.exec( ( error , palette ) => {
		if ( ! wasGrabbing ) { this.grabInput( false ) ; }
		if ( error ) { callback( error ) ; return ; }
		callback( undefined , palette ) ;
	} ) ;
} ;



// Set the color for a register
notChainable.setColor = function setColor( register , r , g , b , names )
{
	if ( r && typeof r === 'object' )
	{
		b = r.b ;
		g = r.g ;
		r = r.r ;
		names = g ;
	}
	
	// Allow modification of register > 15 ?
	if ( typeof register !== 'number' || register < 0 || register > 15 ) { throw new Error( 'Bad register value' ) ; }
	
	if ( ! Array.isArray( names ) ) { names = [] ; }
	
	if (
		typeof r !== 'number' || r < 0 || r > 255 ||
		typeof g !== 'number' || g < 0 || g > 255 ||
		typeof b !== 'number' || b < 0 || b > 255
	)
	{
		throw new Error( 'Bad RGB value' ) ;
	}
	
	// Issue an error, or not?
	if ( this.setColorLL.na ) { return ; }
	
	// This is a good opportunity to update the color register
	this.colorRegister[ register ] = { r: r , g: g , b: b , names: names } ;
	
	// Call the Low Level set color
	this.setColorLL( register , r , g , b ) ;
} ;



// Set the current 16 colors palette of the terminal, if possible
notChainable.setPalette = function setPalette( palette )
{
	var i ;
	
	if ( typeof palette === 'string' )
	{
		try {
			palette = require( './colorScheme/' + palette + '.json' ) ;
		}
		catch( error ) {
			throw new Error( '[terminal] .setPalette(): color scheme not found: ' + palette ) ;
		}
	}
	
	if ( ! Array.isArray( palette ) ) { throw new Error( '[terminal] .setPalette(): argument #0 should be an Array of RGB Object or a built-in color scheme' ) ; }
	
	// Issue an error, or not?
	if ( this.setColorLL.na ) { return ; }
	
	for ( i = 0 ; i <= 15 ; i ++ )
	{
		if ( ! palette[ i ] || typeof palette[ i ] !== 'object' ) { continue ; }
		this.setColor( i , palette[ i ] ) ;
	}
} ;





			/* Utilities */



// Default colors, used for guessing
var defaultColorRegister = require( './colorScheme/default.json' ) ;

( function buildDefaultColorRegister()
{
	var register , offset , factor , l ;
	
	for ( register = 16 ; register < 232 ; register ++ )
	{
		// RGB 6x6x6
		offset = register - 16 ;
		factor = 255 / 5 ;
		defaultColorRegister[ register ] = {
			r: Math.floor( ( Math.floor( offset / 36 + adjustFloor ) % 6 ) * factor + adjustFloor ) ,
			g: Math.floor( ( Math.floor( offset / 6 + adjustFloor ) % 6 ) * factor + adjustFloor ) ,
			b: Math.floor( ( offset % 6 ) * factor + adjustFloor ) ,
			names: []
		} ;
	}
	
	for ( register = 232 ; register <= 255 ; register ++ )
	{
		// Grayscale 0..23
		offset = register - 231 ;	// not 232, because the first of them is not a #000000 black
		factor = 255 / 25 ;	// not 23, because the last is not a #ffffff white
		l = Math.floor( offset * factor + adjustFloor ) ;
		defaultColorRegister[ register ] = { r: l , g: l , b: l , names: [] } ;
	}
} )() ;



// If register hasn't changed, this is used to get the RGB value for them
notChainable.rgbForRegister = function rgbForRegister( register )
{
	if ( register < 0 || register > 255 ) { throw new Error( 'Bad register value' ) ; }
	
	// Simply clone it
	return {
		r: this.colorRegister[ register ].r ,
		g: this.colorRegister[ register ].g ,
		b: this.colorRegister[ register ].b
	} ;
} ;



// If register hasn't changed, this is used to get it for an RGB
// .registerForRgb( r , g , b , [minRegister] , [maxRegister] )
// .registerForRgb( rgbObject , [minRegister] , [maxRegister] )

// HSL cylinder coordinate distance
notChainable.registerForRgb = function registerForRgb( r , g , b , minRegister , maxRegister , lFactor )
{
	// Manage function arguments
	if ( r && typeof r === 'object' )
	{
		// Manage the .registerForRgb( rgbObject , [minRegister] , [maxRegister] ) variante
		lFactor = minRegister ;
		maxRegister = b ;
		minRegister = g ;
		b = r.b ;
		g = r.g ;
		r = r.r ;
	}
	
	if (
		typeof r !== 'number' || r < 0 || r > 255 ||
		typeof g !== 'number' || g < 0 || g > 255 ||
		typeof b !== 'number' || b < 0 || b > 255
	)
	{
		throw new Error( 'Bad RGB value' ) ;
	}
	
	if ( typeof maxRegister !== 'number' || maxRegister < 0 || maxRegister > 255 ) { maxRegister = 15 ; }
	if ( typeof minRegister !== 'number' || minRegister < 0 || minRegister > 255 ) { minRegister = 0 ; }
	if ( typeof lFactor !== 'number' ) { lFactor = 1 ; }
	
	if ( minRegister > maxRegister )
	{
		var tmp ;
		tmp = maxRegister ;
		maxRegister = minRegister ;
		minRegister = tmp ;
	}
	
	return this._registerForRgb( r , g , b , minRegister , maxRegister , lFactor ) ;
} ;



notChainable.registerForRgbCache = function registerForRgbCache( cache , r , g , b , minRegister , maxRegister , lFactor )	// jshint ignore:line
{
	var key = r + '-' + g + '-' + b ;
	if ( cache[ key ] ) { return cache[ key ] ; }
	return ( cache[ key ] = this._registerForRgb( r , g , b , minRegister , maxRegister , lFactor ) ) ;
} ;



notChainable._registerForRgb = function _registerForRgb( r , g , b , minRegister , maxRegister , lFactor )
{
	// Search for the best match
	
	// Transform HSL to cylinder
	
	var x , y , z , xR , yR , zR , dx , dy , dz ,
		registerHsl , register , diff ,
		minDiff = Infinity , hsl = hslConverter.rgb2hsl( r , g , b ) ;
	
	x = hsl.s * Math.cos( hsl.h * 2 * Math.PI ) ;
	y = hsl.s * Math.sin( hsl.h * 2 * Math.PI ) ;
	z = hsl.l * lFactor ;
	
	//console.log( 'HSL:' , hsl ) ;
	
	for ( register = minRegister ; register <= maxRegister ; register ++ )
	{
		registerHsl = hslConverter.rgb2hsl( this.colorRegister[ register ] ) ;
		
		xR = registerHsl.s * Math.cos( registerHsl.h * 2 * Math.PI ) ;
		yR = registerHsl.s * Math.sin( registerHsl.h * 2 * Math.PI ) ;
		zR = registerHsl.l ;
		
		//console.log( 'Register HSL:' , registerHsl ) ;
		
		dx = Math.abs( x - xR ) ;
		dy = Math.abs( y - yR ) ;
		dz = Math.abs( z - zR ) ;
		
		diff = dx * dx + dy * dy + dz * dz ;
		
		//console.log( 'delta:' , dh , ds , dl , diff ) ;
		
		if ( diff < minDiff )
		{
			minDiff = diff ;
			minRegister = register ;
		}
	}
	
	return minRegister ;
} ;





			/* ScreenBuffer compatible methods */



// Cursor is always drawn so there is nothing to do here
notChainable.drawCursor = function drawCursor() {} ;

notChainable.put = function put( options , str )
{
	var i , x , y , dx , dy , attr , wrap , characters , len , moveToNeeded , inline ;
	
	// Manage options
	if ( ! options ) { options = {} ; }
	
	wrap = options.wrap === undefined ? true : options.wrap ;
	
	x = options.x || 0 ;
	y = options.y || 0 ;
	
	if ( typeof x !== 'number' || x < 1 ) { x = 1 ; }
	else if ( x > this.width ) { x = this.width ; }
	else { x = Math.floor( x ) ; }
	
	if ( typeof y !== 'number' || y < 1 ) { y = 1 ; }
	else if ( y > this.height ) { y = this.height ; }
	else { y = Math.floor( y ) ; }
	
	
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
	
	inline = ( dx === 1 && dy === 0 ) ;
	
	
	// Process attributes
	attr = options.attr || this.esc.styleReset.on ;
	
	if ( attr && typeof attr === 'object' ) { attr = this.object2attr( attr ) ; }
	if ( typeof attr !== 'string' ) { attr = this.esc.styleReset.on ; }
	
	
	// Process the input string
	if ( typeof str !== 'string' )
	{
		if ( str.toString ) { str = str.toString() ; }
		else { return ; }
	}
	
	if ( arguments.length > 2 ) { str = string.format.apply( undefined , Array.prototype.slice.call( arguments , 1 ) ) ; }
	str = termkit.stripControlChars( str ) ;
	
	// /!\ Fix that punycode thing, and don't forget to fix ScreenBuffer#put() too... /!\
	characters = punycode.ucs2.decode( str ) ;
	len = characters.length ;
	
	moveToNeeded = true ;
	this.stdout.write( attr ) ;
	
	for ( i = 0 ; i < len ; i ++ )
	{
		if ( moveToNeeded ) { this.moveTo( x , y ) ; }
		this( punycode.ucs2.encode( [ characters[ i ] ] ) ) ;
		
		x += dx ;
		y += dy ;
		
		moveToNeeded = ! inline ;
		
		if ( x < 0 )
		{
			if ( ! wrap ) { break ; }
			x = this.width - 1 ;
			y -- ;
			moveToNeeded = true ;
		}
		else if ( x >= this.width )
		{
			if ( ! wrap ) { break ; }
			x = 0 ;
			y ++ ;
			moveToNeeded = true ;
		}
		
		if ( y < 0 ) { break ; }
		else if ( y >= this.height ) { break ; }
	}
} ;



notChainable.drawNdarrayImage = function drawNdarrayImage( pixels , options )
{
	var x , xMax = Math.min( pixels.shape[ 0 ] , this.width ) ,
		y , yMax = Math.ceil( pixels.shape[ 1 ] / 2 ) ,
		hasAlpha = pixels.shape[ 2 ] === 4 ,
		maxRegister = this.support['256colors'] ? 255 : 15 ,
		fgColor , bgColor , fgAlpha , bgAlpha , cache = {} ;
	
	
	for ( y = 0 ; y < yMax ; y ++ )
	{
		for ( x = 0 ; x < xMax ; x ++ )
		{
			if ( this.support['24bitsColors'] )
			{
				fgAlpha = hasAlpha ? pixels.get( x , y * 2 , 3 ) / 255 : 1 ;
				
				if ( y * 2 + 1 < pixels.shape[ 1 ] )
				{
					bgAlpha = hasAlpha ? pixels.get( x , y * 2 + 1 , 3 ) / 255 : 1 ;
					
					this.noFormat(
						this.optimized.color24bits(
							Math.round( fgAlpha * pixels.get( x , y * 2 , 0 ) ) ,
							Math.round( fgAlpha * pixels.get( x , y * 2 , 1 ) ) ,
							Math.round( fgAlpha * pixels.get( x , y * 2 , 2 ) )
						) +
						this.optimized.bgColor24bits(
							Math.round( bgAlpha * pixels.get( x , y * 2 + 1 , 0 ) ) ,
							Math.round( bgAlpha * pixels.get( x , y * 2 + 1 , 1 ) ) ,
							Math.round( bgAlpha * pixels.get( x , y * 2 + 1 , 2 ) )
						) +
						'▀'
					) ;
				}
				else
				{
					this.noFormat(
						this.optimized.color24bits(
							Math.round( fgAlpha * pixels.get( x , y * 2 , 0 ) ) ,
							Math.round( fgAlpha * pixels.get( x , y * 2 , 1 ) ) ,
							Math.round( fgAlpha * pixels.get( x , y * 2 , 2 ) )
						) +
						this.optimized.bgColor24bits( 0 , 0 , 0 ) +
						'▀'
					) ;
				}
			}
			else
			{
				fgColor = hasAlpha && pixels.get( x , y * 2 , 3 ) < 127 ?
					0 :
					this.registerForRgbCache(
						cache ,
						pixels.get( x , y * 2 , 0 ) ,
						pixels.get( x , y * 2 , 1 ) ,
						pixels.get( x , y * 2 , 2 ) ,
						0 , maxRegister , 1
					) ;
				
				if ( y * 2 + 1 < pixels.shape[ 1 ] )
				{
					bgColor = hasAlpha && pixels.get( x , y * 2 + 1 , 3 ) < 127 ?
						0 :
						this.registerForRgbCache(
							cache ,
							pixels.get( x , y * 2 + 1 , 0 ) ,
							pixels.get( x , y * 2 + 1 , 1 ) ,
							pixels.get( x , y * 2 + 1 , 2 ) ,
							0 , maxRegister , 1
						) ;
					
					this.noFormat( this.optimized.color256[ fgColor ] + this.optimized.bgColor256[ bgColor ] + '▀' ) ;
				}
				else
				{
					this.noFormat( this.optimized.color256[ fgColor ] + this.optimized.bgColor256[ 0 ] + '▀' ) ;
				}
			}
		}
		
		this.styleReset()( '\n' ) ;
	}
} ;



notChainable.drawImage = function drawImage( filepath , options , callback )
{
	return termkit.image.load.call( this , notChainable.drawNdarrayImage.bind( this ) , filepath , options , callback ) ;
} ;


