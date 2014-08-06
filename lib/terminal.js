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



var term = {} ;
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

var escapeAttr = {} ;
var escapeCtrl = {} ;

// Init/Reset
escapeCtrl.RESET = "\x1b[0m" ;
escapeCtrl.FULL_RESET = "\x1bc" ;

// Attributes
escapeAttr.BOLD = "\x1b[1m" ;
escapeAttr.NO_BOLD = "\x1b[21m" ;
escapeAttr.DIM = "\x1b[2m" ;		// dim: darker
escapeAttr.NO_DIM = "\x1b[22m" ;	// it remove bold/bright too
escapeAttr.UNDERLINE = "\x1b[4m" ;
escapeAttr.NO_UNDERLINE = "\x1b[24m" ;
escapeAttr.INVERSE = "\x1b[7m" ;	// inverse background and foreground
escapeAttr.NO_INVERSE = "\x1b[27m" ;
escapeAttr.HIDDEN = "\x1b[8m" ;	// invisible, but can be copy/paste'd
escapeAttr.NO_HIDDEN = "\x1b[28m" ;
escapeAttr.STROKE = "\x1b[9m" ;
escapeAttr.NO_STROKE = "\x1b[29m" ;
escapeAttr.NO_INTENSITY = "\x1b[22m" ;	// remove bold, bright & dim

// Foreground color
escapeAttr.BLACK = "\x1b[30m" ;
escapeAttr.RED = "\x1b[31m" ;
escapeAttr.GREEN = "\x1b[32m" ;
escapeAttr.YELLOW = "\x1b[33m" ;
escapeAttr.BLUE = "\x1b[34m" ;
escapeAttr.MAGENTA = "\x1b[35m" ;
escapeAttr.CYAN = "\x1b[36m" ;
escapeAttr.WHITE = "\x1b[37m" ;
escapeAttr.BRIGHT_BLACK = "\x1b[90m" ;
escapeAttr.BRIGHT_RED = "\x1b[91m" ;
escapeAttr.BRIGHT_GREEN = "\x1b[92m" ;
escapeAttr.BRIGHT_YELLOW = "\x1b[93m" ;
escapeAttr.BRIGHT_BLUE = "\x1b[94m" ;
escapeAttr.BRIGHT_MAGENTA = "\x1b[95m" ;
escapeAttr.BRIGHT_CYAN = "\x1b[96m" ;
escapeAttr.BRIGHT_WHITE = "\x1b[97m" ;
escapeAttr.NO_COLOR = "\x1b[39m" ;	// back to the default color, most of time it is the same than WHITE

// Background color
escapeAttr.BG_BLACK = "\x1b[40m" ;
escapeAttr.BG_RED = "\x1b[41m" ;
escapeAttr.BG_GREEN = "\x1b[42m" ;
escapeAttr.BG_YELLOW = "\x1b[43m" ;
escapeAttr.BG_BLUE = "\x1b[44m" ;
escapeAttr.BG_MAGENTA = "\x1b[45m" ;
escapeAttr.BG_CYAN = "\x1b[46m" ;
escapeAttr.BG_WHITE = "\x1b[47m" ;
escapeAttr.BG_BRIGHT_BLACK = "\x1b[100m" ;
escapeAttr.BG_BRIGHT_RED = "\x1b[101m" ;
escapeAttr.BG_BRIGHT_GREEN = "\x1b[102m" ;
escapeAttr.BG_BRIGHT_YELLOW = "\x1b[103m" ;
escapeAttr.BG_BRIGHT_BLUE = "\x1b[104m" ;
escapeAttr.BG_BRIGHT_MAGENTA = "\x1b[105m" ;
escapeAttr.BG_BRIGHT_CYAN = "\x1b[106m" ;
escapeAttr.BG_BRIGHT_WHITE = "\x1b[107m" ;
escapeAttr.NO_BG_COLOR = "\x1b[49m" ;	// back to the default color, most of time it is the same than BG_BLACK

// Shortcuts
escapeAttr.BOLD_BLACK = "\x1b[1;30m" ;
escapeAttr.BOLD_RED = "\x1b[1;31m" ;
escapeAttr.BOLD_GREEN = "\x1b[1;32m" ;
escapeAttr.BOLD_YELLOW = "\x1b[1;33m" ;
escapeAttr.BOLD_BLUE = "\x1b[1;34m" ;
escapeAttr.BOLD_MAGENTA = "\x1b[1;35m" ;
escapeAttr.BOLD_CYAN = "\x1b[1;36m" ;
escapeAttr.BOLD_WHITE = "\x1b[1;37m" ;

// Dev tests for new escape sequences discoveries
escapeCtrl.TEST = "\x1b[1;37m" ;





			/* Build utilities */



// Turn ALLCAPS to camelCase
function allCapsToCamelCase( str )
{
	return str.replace( /(_([A-Z]))?([A-Z]+)/g , function( match , $1 , $2 , $3 ) {
		return ( $2 || '' ) + $3.toLowerCase() ;
	} ) ;
}

function applyEscapeAndReset( seq , string ) { return seq + ( string || '' ) + escapeCtrl.RESET ; }
function applyEscape( seq , string ) { return seq + ( string || '' ) ; }



// Create a function for each constant

var key , fn ;

for ( key in escapeAttr )
{
	term[ key ] = escapeAttr[ key ] ;
	fn = allCapsToCamelCase( key ) ;
	term[ fn ] = applyEscapeAndReset.bind( term , escapeAttr[ key ] ) ;
}

for ( key in escapeCtrl )
{
	term[ key ] = escapeCtrl[ key ] ;
	fn = allCapsToCamelCase( key ) ;
	term[ fn ] = applyEscape.bind( term , escapeCtrl[ key ] ) ;
}






// The following is PHP code from CSK PHP lib, not backported ATM.

/*

// Les fonction statiques less permettent d'envoyer des commandes au terminal sans instancier d'objet,
// et donc sans utiliser ncurses.

// Reset
static function reset() { echo self::RESET ; }
static function full_reset() { echo self::FULL_RESET ; }

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
static function save_cursor()  { echo "\x1b7" ; }
static function restore_cursor()  { echo "\x1b8" ; }

// Change le titre du terminal
static function set_window_title( $title )  { echo "\x1b]0;{$title}\x1b\\" ; }

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
