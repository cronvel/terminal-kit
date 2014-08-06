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



var chainable = {} ;
var term = Object.create( chainable ) ;
module.exports = term ;





			/* Escape sequences */



// ESC = \x1b
// CSI = ESC + [
// OSC = ESC + ]
// DSC = ESC + P
// ST = ESC + \	(end some sequences)

// CSI: ESC + [ + <command> + <type>
// It is possible to separate many command with a ';' before the final 'type'.

// See: http://en.wikipedia.org/wiki/ANSI_escape_code
// and: http://invisible-island.net/xterm/ctlseqs/ctlseqs.html



			/* Control sequence */


term.ctrl = {} ;

// Init/Reset
term.ctrl.reset = "\x1b[0m" ;
term.ctrl.fullReset = "\x1bc" ;

// Remove colors
term.ctrl.noColor = "\x1b[39m" ;	// back to the default color, most of time it is the same than .white
term.ctrl.noBgColor = "\x1b[49m" ;	// back to the default color, most of time it is the same than .bgBlack

// Cursors
term.ctrl.moveToLowerLeft = "\x1bF" ;
term.ctrl.saveCursor = "\x1b7" ;
term.ctrl.restoreCursor = "\x1b8" ;

// Emit a beep
term.ctrl.beep = "\x07" ;





			/* Attributes sequence */



term.attr = {} ;

term.attr.bold = { open: "\x1b[1m" , close: "\x1b[21m" } ;
term.attr.dim = { open: "\x1b[2m" , close: "\x1b[22m" } ;		// dim: darker, 'close' remove removes also bold/bright
term.attr.italic = { open: "\x1b[3m" , close: "\x1b[23m" } ;
term.attr.underline = { open: "\x1b[4m" , close: "\x1b[24m" } ;
term.attr.blink = { open: "\x1b[5m" , close: "\x1b[25m" } ;
term.attr.inverse = { open: "\x1b[7m" , close: "\x1b[27m" } ;
term.attr.hidden = { open: "\x1b[8m" , close: "\x1b[28m" } ;	// invisible, but can be copy/paste'd
term.attr.strike = { open: "\x1b[9m" , close: "\x1b[29m" } ;

// Foreground color
term.attr.black = { open: "\x1b[30m" , close: term.ctrl.noColor } ;
term.attr.red = { open: "\x1b[31m" , close: term.ctrl.noColor } ;
term.attr.green = { open: "\x1b[32m" , close: term.ctrl.noColor } ;
term.attr.yellow = { open: "\x1b[33m" , close: term.ctrl.noColor } ;
term.attr.blue = { open: "\x1b[34m" , close: term.ctrl.noColor } ;
term.attr.magenta = { open: "\x1b[35m" , close: term.ctrl.noColor } ;
term.attr.cyan = { open: "\x1b[36m" , close: term.ctrl.noColor } ;
term.attr.white = { open: "\x1b[37m" , close: term.ctrl.noColor } ;
term.attr.brightBlack = { open: "\x1b[90m" , close: term.ctrl.noColor } ;
term.attr.brightRed = { open: "\x1b[91m" , close: term.ctrl.noColor } ;
term.attr.brightGreen = { open: "\x1b[92m" , close: term.ctrl.noColor } ;
term.attr.brightYellow = { open: "\x1b[93m" , close: term.ctrl.noColor } ;
term.attr.brightBlue = { open: "\x1b[94m" , close: term.ctrl.noColor } ;
term.attr.brightMagenta = { open: "\x1b[95m" , close: term.ctrl.noColor } ;
term.attr.brightCyan = { open: "\x1b[96m" , close: term.ctrl.noColor } ;
term.attr.brightWhite = { open: "\x1b[97m" , close: term.ctrl.noColor } ;

// Background color
term.attr.bgBlack = { open: "\x1b[40m" , close: term.ctrl.noBgColor } ;
term.attr.bgRed = { open: "\x1b[41m" , close: term.ctrl.noBgColor } ;
term.attr.bgGreen = { open: "\x1b[42m" , close: term.ctrl.noBgColor } ;
term.attr.bgYellow = { open: "\x1b[43m" , close: term.ctrl.noBgColor } ;
term.attr.bgBlue = { open: "\x1b[44m" , close: term.ctrl.noBgColor } ;
term.attr.bgMagenta = { open: "\x1b[45m" , close: term.ctrl.noBgColor } ;
term.attr.bgCyan = { open: "\x1b[46m" , close: term.ctrl.noBgColor } ;
term.attr.bgWhite = { open: "\x1b[47m" , close: term.ctrl.noBgColor } ;
term.attr.bgBrightBlack = { open: "\x1b[100m" , close: term.ctrl.noBgColor } ;
term.attr.bgBrightRed = { open: "\x1b[101m" , close: term.ctrl.noBgColor } ;
term.attr.bgBrightGreen = { open: "\x1b[102m" , close: term.ctrl.noBgColor } ;
term.attr.bgBrightYellow = { open: "\x1b[103m" , close: term.ctrl.noBgColor } ;
term.attr.bgBrightBlue = { open: "\x1b[104m" , close: term.ctrl.noBgColor } ;
term.attr.bgBrightMagenta = { open: "\x1b[105m" , close: term.ctrl.noBgColor } ;
term.attr.bgBrightCyan = { open: "\x1b[106m" , close: term.ctrl.noBgColor } ;
term.attr.bgBrightWhite = { open: "\x1b[107m" , close: term.ctrl.noBgColor } ;





			/* Input / Output */



term.io = {} ;

// The terminal will send input into process.STDIN

// Terminal will send the cursor coordinate
term.io.cursor = { open: "\x1b[?6n" , close: '' } ;

// Terminal will send button event and mouse position
term.io.mouseClick = { open: "\x1b[?1000h" , close: "\x1b[?1000l" } ;

// Terminal will send position of the column hilighted
term.io.mouseHilight = { open: "\x1b[?1001h" , close: "\x1b[?1001l" } ;

// ?
term.io.mouseCell = { open: "\x1b[?1002h" , close: "\x1b[?1002l" } ;

// Terminal will send all motion
term.io.mouseMotion = { open: "\x1b[?1003h" , close: "\x1b[?1003l" } ;

// Dev tests for new escape sequences discoveries
term.ctrl.test = "\x1b[0 q" ;







			/* Apply */



function applyCtrl( ctrl , string ) { return term.ctrl[ ctrl ] + ( string || '' ) ; }

function applyAttributes( attributes , string )
{
	var index , open = '' , close = '' ;
	
	console.log( 'Attributes:' , attributes ) ;
	
	for ( index in attributes )
	{
		console.log( 'key:' , attributes[ index ] ) ;
		open = open + term.attr[ attributes[ index ] ].open ;
		close = term.attr[ attributes[ index ] ].close + close ;
	}
	
	return open + ( string || '' ) + close ;
}



// Create methods for the 'chainable' prototype

Object.keys( term.attr ).forEach( function( key ) {
	
	Object.defineProperty( chainable , key , {
		configurable: true ,
		get: function () {
			var chain ;
			
			if ( this.chain ) { chain = this.chain.slice() ; chain.push( key ) ; }
			else { chain = [ key ] ; }
			
			var fn = applyAttributes.bind( this , chain ) ;
			fn.__proto__ = chainable ;
			fn.chain = chain ;
			
			// Replace the getter by the newly created function, to speed up further call
			Object.defineProperty( this , key , { value: fn } ) ;
			//console.log( ' Getter called:' , key ) ;
			
			return fn ;
		}
	} ) ;
} ) ;



Object.keys( term.ctrl ).forEach( function( key ) {
	term[ key ] = applyCtrl.bind( term , key ) ;
} ) ;



// Code from 'cli-color'
Object.defineProperties( term , {
	width: { get: process.stdout.getWindowSize ?
		function () { return process.stdout.getWindowSize()[ 0 ] ; } :
		function () { return tty.getWindowSize ? tty.getWindowSize()[ 1 ] : 0 ; }
	} ,
	height: { get: process.stdout.getWindowSize ?
		function () { return process.stdout.getWindowSize()[ 1 ] ; } :
		function () { return tty.getWindowSize ? tty.getWindowSize()[ 0 ] : 0 ; }
	}
} ) ;

function positiveOrZero( n ) { return isNaN( n ) ? 0 : Math.max( Math.floor( n ) , 0 ) ; }
function positive( n ) { return isNaN( n ) ? 1 : Math.max( Math.floor( n ) , 1 ) ; }
function floor( n ) { return isNaN( n ) ? 0 : Math.floor( n ) ; }

term.up = function up( n ) { return '\x1b[' + positiveOrZero( n ) + 'A' ; } ;
term.down = function down( n ) { return '\x1b[' + positiveOrZero( n ) + 'B' ; } ;
term.right = function right( n ) { return '\x1b[' + positiveOrZero( n ) + 'C' ; } ;
term.left = function left( n ) { return '\x1b[' + positiveOrZero( n ) + 'D' ; } ;

term.move = function move( x , y )
{
	x = floor( x ) ;
	y = floor( y ) ;
	return ( ( x >= 0 ) ? term.right( x ) : term.left( -x ) ) +
		( ( y >= 0 ) ? term.down( y ) : term.up( -y ) ) ;
}

term.moveTo = function moveTo( x , y )
{
	x = positive( x ) ;
	y = positive( y ) ;
	return '\x1b[' + y + ';' + x + 'H';
}

// Set the title of the window
term.windowTitle = function windowTitle( title ) { return '\x1b]0;' + title + '\x1b\\' ; }



// The following is PHP code from CSK PHP lib, not backported ATM.

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
