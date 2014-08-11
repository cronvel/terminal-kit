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
var tty = require( 'tty' ) ;
var tree = require( 'tree-kit' ) ;
var format = require( './format' ) ;


/*
function Terminal() { throw new Error( 'Cannot create a Terminal object directly, use createTerminal() instead' ) ; }

Terminal.prototype.constructor = Terminal ;
*/

function createTerminal( stdin , stdout , stderr )
{
	var chainable = {} ;
	var options = { on: '', off: '', params: 0, err: false, out: stdout } ;
	
	var term = applyEscape.bind( undefined , options ) ;
	term.__proto__ = chainable ;
	
	// Fix the root
	options.root = term ;
	term.root = term ;
	
	term.createTerminal = createTerminal ;
	term.options = options ;
	term.stdin = stdin ;
	term.stdout = stdout ;
	term.stderr = stderr ;
	//term.couldTTY = true ;
	
	// if needed, this should be replaced by some tput commands
	term.esc = tree.extend( null , {} , esc ) ;
	
	
	// Create methods for the 'chainable' prototype
	
	Object.keys( term.esc ).forEach( function( key ) {
		
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
				fn.__proto__ = chainable ;
				
				fn.root = this.root || this ;
				fn.options = options ;
				
				// Replace the getter by the newly created function, to speed up further call
				Object.defineProperty( this , key , { value: fn } ) ;
				
				//console.log( ' Getter called:' , key ) ;
				
				return fn ;
			}
		} ) ;
	} ) ;
	
	
	return term ;
}





			/* Apply */



function applyEscape( options )
{
	var formatParams ;
	
	// If not enough arguments, return right now
	if ( arguments.length < 1 + options.params ) { return options.root ; }
	
	var action = arguments[ 1 + options.params ] ;
	
	if ( options.params )
	{
		formatParams = Array.prototype.slice.call( arguments , 1 , 1 + options.params ) ;
		formatParams.unshift( options.on ) ;
		//console.log( '\napplyEscape arguments' , arguments ) ;
		//console.log( '\napplyEscape formatParams:' , formatParams ) ;
		options.on = format.apply( undefined , formatParams ) ;
	}
	
	//console.log( 'Attributes:' , attributes ) ;
	if ( action === undefined || action === true )
	{
		options.out.write( options.on ) ;
		return options.root ;
	}
	
	if ( action === null || action === false )
	{
		options.out.write( options.off ) ;
		return options.root ;
	}
	
	if ( typeof action !== 'string' )
	{
		if ( typeof action === 'object' && typeof action.toString === 'function' )
		{
			action = action.toString() ;
		}
		else
		{
			// Cannot be stringified? so return now!
			return options.root ;
		}
	}
	
	// So we have got a string
	
	if ( arguments.length > 2 )
	{
		formatParams = Array.prototype.slice.call( arguments , 1 + options.params ) ;
		options.out.write( options.on + format.apply( undefined , formatParams ) + options.off ) ;
	}
	else
	{
		options.out.write( options.on + action + options.off ) ;
	}
	
	return options.root ;
}








			/* Escape sequences */



// Mini-doc:

// ESC = \x1b
// CSI = ESC + [
// OSC = ESC + ]
// DSC = ESC + P
// ST = ESC + \	(end some sequences)

// CSI: ESC + [ + <command> + <type>
// It is possible to separate many command with a ';' before the final 'type'.

// See: http://en.wikipedia.org/wiki/ANSI_escape_code
// and: http://invisible-island.net/xterm/ctlseqs/ctlseqs.html
// man tput
// man 5 terminfo



			/* Common sequences */

var commonEsc = {

	// Remove colors
	noColor: '\x1b[39m' ,	// back to the default color, most of time it is the same than .white
	noBgColor: '\x1b[49m'	// back to the default color, most of time it is the same than .bgBlack
} ;



var esc = {
	
			/* Control sequences */

	// Reset the terminal
	reset: { on: '\x1bc' } ,
	
	// Cursors
	moveToLowerLeft: { on: '\x1bF' } ,
	saveCursor: { on: '\x1b7' } ,
	restoreCursor: { on: '\x1b8' } ,
	
	up: { on: '\x1b[%uA' } ,
	down: { on: '\x1b[%uB' } ,
	right: { on: '\x1b[%uC' } ,
	left: { on: '\x1b[%uD' } ,
	moveTo: { on: '\x1b[%+1U;%-1UH' } ,
	
	// Emit a beep
	beep: { on: '\x07' } ,

			/* Style sequences */

	styleReset: { on: '\x1b[0m' } ,
	
	bold: { on: '\x1b[1m' , off: '\x1b[21m' } ,
	dim: { on: '\x1b[2m' , off: '\x1b[22m' } ,		// dim: darker, 'off' remove removes also bold/bright
	italic: { on: '\x1b[3m' , off: '\x1b[23m' } ,
	underline: { on: '\x1b[4m' , off: '\x1b[24m' } ,
	blink: { on: '\x1b[5m' , off: '\x1b[25m' } ,
	inverse: { on: '\x1b[7m' , off: '\x1b[27m' } ,
	hidden: { on: '\x1b[8m' , off: '\x1b[28m' } ,	// invisible, but can be copy/paste'd
	strike: { on: '\x1b[9m' , off: '\x1b[29m' } ,
	
	// Foreground color
	black: { on: '\x1b[30m' , off: commonEsc.noColor } ,
	red: { on: '\x1b[31m' , off: commonEsc.noColor } ,
	green: { on: '\x1b[32m' , off: commonEsc.noColor } ,
	yellow: { on: '\x1b[33m' , off: commonEsc.noColor } ,
	blue: { on: '\x1b[34m' , off: commonEsc.noColor } ,
	magenta: { on: '\x1b[35m' , off: commonEsc.noColor } ,
	cyan: { on: '\x1b[36m' , off: commonEsc.noColor } ,
	white: { on: '\x1b[37m' , off: commonEsc.noColor } ,
	brightBlack: { on: '\x1b[90m' , off: commonEsc.noColor } ,
	brightRed: { on: '\x1b[91m' , off: commonEsc.noColor } ,
	brightGreen: { on: '\x1b[92m' , off: commonEsc.noColor } ,
	brightYellow: { on: '\x1b[93m' , off: commonEsc.noColor } ,
	brightBlue: { on: '\x1b[94m' , off: commonEsc.noColor } ,
	brightMagenta: { on: '\x1b[95m' , off: commonEsc.noColor } ,
	brightCyan: { on: '\x1b[96m' , off: commonEsc.noColor } ,
	brightWhite: { on: '\x1b[97m' , off: commonEsc.noColor } ,

	// Background color
	bgBlack: { on: '\x1b[40m' , off: commonEsc.noBgColor } ,
	bgRed: { on: '\x1b[41m' , off: commonEsc.noBgColor } ,
	bgGreen: { on: '\x1b[42m' , off: commonEsc.noBgColor } ,
	bgYellow: { on: '\x1b[43m' , off: commonEsc.noBgColor } ,
	bgBlue: { on: '\x1b[44m' , off: commonEsc.noBgColor } ,
	bgMagenta: { on: '\x1b[45m' , off: commonEsc.noBgColor } ,
	bgCyan: { on: '\x1b[46m' , off: commonEsc.noBgColor } ,
	bgWhite: { on: '\x1b[47m' , off: commonEsc.noBgColor } ,
	bgBrightBlack: { on: '\x1b[100m' , off: commonEsc.noBgColor } ,
	bgBrightRed: { on: '\x1b[101m' , off: commonEsc.noBgColor } ,
	bgBrightGreen: { on: '\x1b[102m' , off: commonEsc.noBgColor } ,
	bgBrightYellow: { on: '\x1b[103m' , off: commonEsc.noBgColor } ,
	bgBrightBlue: { on: '\x1b[104m' , off: commonEsc.noBgColor } ,
	bgBrightMagenta: { on: '\x1b[105m' , off: commonEsc.noBgColor } ,
	bgBrightCyan: { on: '\x1b[106m' , off: commonEsc.noBgColor } ,
	bgBrightWhite: { on: '\x1b[107m' , off: commonEsc.noBgColor } ,
	
			/* Input / Output sequences */
	
	// Terminal will send the cursor coordinate
	cursor: { on: '\x1b[?6n' , off: '' } ,
	
	// Terminal will send button event and mouse position
	mouseClick: { on: '\x1b[?1000h' , off: '\x1b[?1000l' } ,
	
	// Terminal will send position of the column hilighted
	mouseHilight: { on: '\x1b[?1001h' , off: '\x1b[?1001l' } ,
	
	// ?
	mouseCell: { on: '\x1b[?1002h' , off: '\x1b[?1002l' } ,
	
	// Terminal will send all motion
	mouseMotion: { on: '\x1b[?1003h' , off: '\x1b[?1003l' } ,
	
	// Do not work...
	noecho: { on: '\x1b[12h' } ,
	
			/* OSC - OS Control sequences: may be unavailable on some context */
	
	// Set the title of an xterm-compatible window
	windowTitle: { on: '\x1b]0;%s\x1b\\' } ,
	
			/* Misc */
	
	// It just set error:true so it will write to STDERR instead of STDOUT
	error: { err: true } ,
	
	// Dev tests for new escape sequences discoveries
	test: { on: '\x1b[12h' }
} ;



// Complexes functions that cannot be chained
var fn = {
	move: function move( x , y ) {
		x >= 0 ? this.right( x ) : this.left( -x ) ;
		y >= 0 ? this.down( y ) : this.up( -y ) ;
		return this ;
	}
} ;










module.exports = createTerminal( process.stdin , process.stdout , process.stderr ) ;	// term.couldTTY = true ;









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
