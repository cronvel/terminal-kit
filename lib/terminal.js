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
		- $COLORTERM is not rarely used, and is not transmitted to node.js
		- 'CSI c' and 'CSI > c' are almost useless
	- Then use infocmp to get terminfo string
*/

// Load modules
var format = require( './format' ) ;
var tree = require( 'tree-kit' ) ;
var async = require( 'async-kit' ) ;
var tty = require( 'tty' ) ;
var punycode = require( 'punycode' ) ;
var exec = require( 'child_process' ).exec ;



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
			type: 'xterm'
			// couldTTY: true
		} ;
	}
	
	if ( typeof createOptions.type !== 'string' ) { createOptions.type = 'xterm' ; }
	
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
	term.grabbing = false ;
	
	// Screen size
	term.width = undefined ;
	term.height = undefined ;
	term.updateScreenSize() ;
	if ( term.stdout.isTTY ) { term.stdout.on( 'resize' , term.updateScreenSize.bind( term ) ) ; }
	else if ( createOptions.processSigwinch ) { process.on( 'SIGWINCH' , term.updateScreenSize.bind( term ) ) ; }
	
	//term.couldTTY = true ;
	
	try {
		termconfig = require( './termconfig/' + createOptions.type + '.js' ) ;
	}
	catch ( error ) {
		termconfig = require( './termconfig/xterm.js' ) ;
	}
	
	// if needed, this should be replaced by some tput commands?
	term.esc = tree.extend( null , {} , termconfig.esc , pseudoEsc ) ;
	term.escHandler = { root: term } ;
	term.keymap = tree.extend( null , {} , termconfig.keymap ) ;
	
	// reverse keymap
	term.rKeymap = [] ;
	term.rKeymapMaxSize = -1 ;
	term.rKeymapStarter = [] ;
	term.rKeymapStarterMaxSize = -1 ;
	
	Object.keys( term.keymap ).forEach( function( key ) {
		
		var i , j , keymapObject , code , codeList = term.keymap[ key ] ;
		
		if ( ! Array.isArray( codeList ) ) { codeList = [ codeList ] ; }
		
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
		if ( term.esc[ key ].handler ) { term.escHandler[ key ] = term.esc[ key ].handler ; }
		
		Object.defineProperty( chainable , key , {
			configurable: true ,
			get: function () {
				var fn , options = {} ;
				
				options = tree.extend( null , {} , this.options ) ;
				
				options.on += this.root.esc[ key ].on ;
				options.off = ( this.root.esc[ key ].off || '' ) + options.off ;
				options.params += format.count( this.root.esc[ key ].on ) ;
				
				if ( this.root.esc[ key ].err ) { options.out = this.root.stderr ; }
				
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
	var formatParams , on = options.on ;
	
	//If not enough arguments, return right now
	// Well... what about term.up(), term.previousLine(), and so on?
	//if ( arguments.length < 1 + options.params ) { return options.root ; }
	
	var action = arguments[ 1 + options.params ] ;
	
	if ( options.params )
	{
		formatParams = Array.prototype.slice.call( arguments , 1 , 1 + options.params ) ;
		formatParams.unshift( options.on ) ;
		//console.log( '\napplyEscape arguments' , arguments ) ;
		//console.log( '\napplyEscape formatParams:' , formatParams ) ;
		on = format.apply( options.root.escHandler , formatParams ) ;
	}
	
	//console.log( 'Attributes:' , attributes ) ;
	if ( action === undefined || action === true )
	{
		options.out.write( on ) ;
		return options.root ;
	}
	
	if ( action === null || action === false )
	{
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
		options.out.write( on + format.apply( options.root.escHandler , formatParams ) + options.off ) ;
	}
	else
	{
		options.out.write( on + action + options.off ) ;
	}
	
	return options.root ;
}





			/* Pseudo esc */



var pseudoEsc = {
	move: { on: '%[move:%a%a]' ,
		handler: function move( x , y ) {
			
			var sequence = '' ;
			
			if ( x )
			{
				if ( x > 0 ) { sequence += format( this.root.esc.right.on , x ) ; }
				else { sequence += format( this.root.esc.left.on , -x ) ; }
			}
			
			if ( y )
			{
				if ( y > 0 ) { sequence += format( this.root.esc.down.on , y ) ; }
				else { sequence += format( this.root.esc.up.on , -y ) ; }
			}
			
			return sequence ;
		}
	} ,
	
	color: { on: '%[color:%a]' ,
		off: function() { return this.root.esc.defaultColor.on ; } ,
		handler: function color( c )
		{
			if ( typeof c !== 'number' ) { return '' ; }
			
			c = Math.floor( c ) ;
			
			if ( c < 0 || c > 15 ) { return '' ; }
			
			if ( c <= 7 ) { return format( this.root.esc.darkColor.on , c ) ; }
			else { return format( this.root.esc.brightColor.on , c - 8 ) ; }
		}
	} ,
	
	bgColor: { on: '%[bgColor:%a]' ,
		off: function() { return this.root.esc.bgDefaultColor.on ; } ,
		handler: function bgColor( c )
		{
			if ( typeof c !== 'number' ) { return '' ; }
			
			c = Math.floor( c ) ;
			
			if ( c < 0 || c > 15 ) { return '' ; }
			
			if ( c <= 7 ) { return format( this.root.esc.bgDarkColor.on , c ) ; }
			else { return format( this.root.esc.bgBrightColor.on , c - 8 ) ; }
		}
	}
} ;





			/* Advanced methods */



// Complexes functions that cannot be chained.
// It is the ancestors of the terminal object, so it should inherit from async.EventEmitter.
var notChainable = Object.create( async.EventEmitter.prototype ) ;

notChainable.fullscreen = function fullscreen( options )
{
	if ( options === false )
	{
		// Disable fullscrenn mode
		this.alternateScreenBuffer( false ) ;
		return this ;
	}
	
	if ( ! options ) { options = {} ; }
	
	if ( ! options.noAlternate ) { this.alternateScreenBuffer( true ) ; }
	
	this.clear() ;
} ;



notChainable.updateScreenSize = function updateScreenSize()
{
	if ( this.stdout.getWindowSize )
	{
		var windowSize = this.stdout.getWindowSize() ;
		this.width = windowSize[ 0 ] ;
		this.height = windowSize[ 1 ] ;
	}
	
	this.emit( 'terminal' , 'SCREEN_RESIZE' , { resized: true , width: this.width , height: this.height } ) ;
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
						this.emit( keymap.event , handlerResult.name , handlerResult.data ) ;
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
							format.escapeRegExp( keymap.starter ) +
							'([0-9;]*)' +
							format.escapeRegExp( keymap.ender ) ;
						
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
		return this ;
	}
	
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



// Work localy, do not work over SSH
notChainable.getParentTerminal = function getParentTerminal( callback )
{
	var loop = 0 , name , terminfo , pid = process.pid ;
	
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
				terminfo = t256color ? name + '-256color' : name ;
				break ;
			case 'login':
				name = 'linux' ;
				terminfo = name ;
				break ;
			case 'gnome-terminal':
			case 'gnome-terminal-':
				name = 'gnome-terminal' ;
				terminfo = t256color ? 'gnome-256color' : 'gnome' ;
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
		callback( undefined , name , pid , terminfo ) ;
	} ) ;
} ;





module.exports = createTerminal( {
	stdin: process.stdin ,
	stdout: process.stdout ,
	stderr: process.stderr ,
	type: process.env.TERM ,
	processSigwinch: true
	// couldTTY: true
} ) ;








/*
// Code from 'cli-color'
Object.defineProperties( term , {
	width: { get: function() {
		if ( this.stdout.getWindowSize ) { return this.stdout.getWindowSize()[ 0 ] ; }
		else if ( this.couldTTY && tty.getWindowSize ) { return tty.getWindowSize()[ 1 ] ; }
		else { return 0 ; }
	} } ,
	height: { get: function() {
		if ( this.stdout.getWindowSize ) { return this.stdout.getWindowSize()[ 1 ] ; }
		else if ( this.couldTTY && tty.getWindowSize ) { return tty.getWindowSize()[ 0 ] ; }
		else { return 0 ; }
	} }
} ) ;

*/




// The following is PHP code from the CSK PHP lib.
// This is not backported ATM.

/*

// Les fonction statiques less permettent d'envoyer des commandes au terminal sans instancier d'objet,
// et donc sans utiliser ncurses.

// Fixe la couleur par un index de 256 couleurs
static function set_color_index( $c ) { echo "\x1b[38;5;{$c}m" ; }
static function set_bg_color_index( $c ) { echo "\x1b[48;5;{$c}m" ; }

// Fixe la couleur en rgb 216 couleurs (6x6x6), chaque valeur doit être entre 0 et 5
static function set_color_rgb( $r , $g , $b )
{
	intrange( $r , 0 , 5 ) ; intrange( $g , 0 , 5 ) ; intrange( $b , 0 , 5 ) ;
	$c = 16 + $r * 36 + $g * 6 + $b ;
	echo "\x1b[38;5;{$c}m" ;
}

static function set_bg_color_rgb( $r , $g , $b )
{
	intrange( $r , 0 , 5 ) ; intrange( $g , 0 , 5 ) ; intrange( $b , 0 , 5 ) ;
	$c = 16 + $r * 36 + $g * 6 + $b ;
	echo "\x1b[48;5;{$c}m" ;
}

// Fixe la couleur en grayscale de 24 nuances, la valeur doit être entre 0 et 23
static function set_color_grayscale( $gray )
{
	$gray = intrange( $gray , 0 , 23 ) ;
	$c = 232 + $gray ;
	echo "\x1b[38;5;{$c}m" ;
}

static function set_bg_color_grayscale( $gray )
{
	$gray = intrange( $gray , 0 , 23 ) ;
	$c = 232 + $gray ;
	echo "\x1b[48;5;{$c}m" ;
}

static function clear( $home = false ) { if ( $home ) echo "\x1b[2J\x1b[0;0f" ; else echo "\x1b[2J" ; }

static function set_cursor_yx( $y , $x )  { $y = intval( $y ) ; $x = intval( $x ) ; echo "\x1b[{$y};{$x}f" ; }

// bugs:
// il faudrait ré-injecter dans le flux les caractères hors contrôle
// l'appli freeze tant que l'utilisateur n'appuie pas sur entrée
static function get_cursor_yx( &$y , &$x )
{
	// tmp, annule l'affichage issue de STDIN (les réponses du terminal se font par STDIN)
	system( 'stty -echo' ) ;
	
	// Demande au terminal les coordonnées du curseur
	echo "\x1b[?6n" ;
	
	$code = '' ;
	while ( 1 )
	{
		$input = self::check_input() ;
		if ( $input )  $code .= $input ;
		
		//if ( $code )  echo "\n\nDebug , Hex: " , StringTB::str2hex( $code ) , "\n\n" ;
		
		if ( preg_match( '(\x1b\[\?([0-9]+);([0-9]+)R)' , $code , $matches ) )
		{
			$y = $matches[ 1 ] ;
			$x = $matches[ 2 ] ;
			break ;
		}
		
		usleep( 1000 ) ;
	}
}

// Les modes du terminal
// Pour le moment, on dirait qu'on est obligé d'utiliser un appel système, je ne trouve pas de séquence d'échappement
static function cooked()  { system( 'stty cooked icanon' ) ; }
static function cbreak()  { system( 'stty cbreak' ) ; }
static function raw()  { system( 'stty raw' ) ; }	// ATTENTION: Ctrl-C ne pourra pas quitter le programme
static function echo_on()  { self::$echo = true ; system( 'stty echo' ) ; }
static function echo_off()  { self::$echo = false ; system( 'stty -echo' ) ; }

// input non bloquant
static function check_input()
{
	stream_set_blocking( STDIN , 0 ) ;
	$input = stream_get_contents( STDIN ) ;
	stream_set_blocking( STDIN , 1 ) ;
	return $input ;
}



// attend que l'utilisateur tape un des deux caractères (par défaut 'y' pour 'yes' et 'n' pour 'no') et retourne true pour yes, et false pour no
static function yes_no( $yes = 'y' , $no = 'n' )
{
	// Warning: cbreak mode necessary
	
	// First, check echo mode, it should be turned off temporarly, then set stream to non-blocking
	$echo = self::$echo ;
	if ( $echo )  self::echo_off() ;
	stream_set_blocking( STDIN , 0 ) ;
	
	// get only the first char
	$yes = mb_substr( $yes , 0 , 1 ) ;
	$no = mb_substr( $no , 0 , 1 ) ;
	
	while ( true )
	{
		$input = stream_get_contents( STDIN ) ;
		$input = trim( $input ) ;
		//if ( $input )  echo "'$input'\n" ;
		
		if ( is_string( $input ) && strlen( $input ) > 0 )
		{
			if ( $input === $yes )  { $result = true ; break ; }
			else if ( $input === $no )  { $result = false ; break ; }
		}
		
		usleep( 10000 ) ;
	}
	
	// Last, return everything to normal state
	if ( $echo )  self::echo_on() ;
	stream_set_blocking( STDIN , 1 ) ;
	
	return $result ;
}





static function init( $force_tty = false )
{
	if ( self::$is_init )  return true ;
	
	if ( ! $force_tty && ! System::is_unix() )  return false ;
	
	if ( ! posix_isatty( STDOUT ) )
	{
		if ( ! $force_tty )  return false ;
		self::$tty = posix_ttyname( STDOUT ) ;
		self::$termid = posix_ctermid() ;
		self::$init_termstate = trim( `stty -g` ) ;	// il faut retirer le \n final
	}
	else
	{
		self::$tty = posix_ttyname( STDOUT ) ;
		self::$termid = posix_ctermid() ;
		self::$init_termstate = trim( `stty -g` ) ;	// il faut retirer le \n final
	}
	
	// Si le module est initialisé, l'utilisateur a peut-être changé les couleurs... 
	// On lui reset son terminal
	register_shutdown_function( 'Wtermless::close' ) ;
	
	self::$is_init = true ;
	return true ;
}

static function close()
{
	if ( ! self::$is_init )  return ;
	self::reset() ;
	system( 'stty "' . self::$init_termstate . '"' ) ;
	self::$is_init = false ;
}

static function get_tty()  { return self::$tty ; }
static function get_termid()  { return self::$termid ; }


static private $is_init = false ;
static private $tty = false ;
static private $termid = '' ;
static private $init_termstate = '' ;

static private $echo = true ;

*/
