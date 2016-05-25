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



var tree = require( 'tree-kit' ) ;
var string = require( 'string-kit' ) ;
var xterm = require( './xterm.js' ) ;
var gpm = require( '../gpm.js' ) ;



// shortcuts
var bold = '\x1b[1m' ;
var noBold = '\x1b[22m' ;
var blink = '\x1b[5m' ;
var noBlink = '\x1b[25m' ;
var defaultColor = '\x1b[39m' + noBold ;		// back to the default color, most of time it is the same than .white
var bgDefaultColor = '\x1b[49m' + noBlink ;	// back to the default color, most of time it is the same than .bgBlack



var fgCursorTable = [
	0 , 3 , 5 , 1 , 6 , 2 , 4 , 7 ,
	8 , 11, 13, 9 , 14, 10, 12, 15
] ;

var bgCursorTable = [
	0 , 4 , 2 , 6 , 1 , 5 , 3 , 7 ,
	8 , 12, 10, 14, 9 , 13, 11, 15
] ;



var esc = tree.extend( null , Object.create( xterm.esc ) , {
	
	// Clear screen
	clear: { on: '\x1b[H\x1b[J' } ,
	
	// Linux console doesn't have bright color code, they are produced using 'bold' (which is not bold, by the way...)
	defaultColor: { on: defaultColor } ,
	brightBlack: { on: bold + '\x1b[30m' , off: defaultColor } ,
	brightRed: { on: bold + '\x1b[31m' , off: defaultColor } ,
	brightGreen: { on: bold + '\x1b[32m' , off: defaultColor } ,
	brightYellow: { on: bold + '\x1b[33m' , off: defaultColor } ,
	brightBlue: { on: bold + '\x1b[34m' , off: defaultColor } ,
	brightMagenta: { on: bold + '\x1b[35m' , off: defaultColor } ,
	brightCyan: { on: bold + '\x1b[36m' , off: defaultColor } ,
	brightWhite: { on: bold + '\x1b[37m' , off: defaultColor } ,
	brightColor: { on: bold + '\x1b[3%um' , off: defaultColor } ,	// should be called with a 0..7 integer
	
	// Linux console doesn't have bright bg color code, they are produced using 'blink' (which does not blink, by the way...)
	bgDefaultColor: { on: bgDefaultColor } ,
	bgBrightBlack: { on: blink + '\x1b[40m' , off: bgDefaultColor } ,
	bgBrightRed: { on: blink + '\x1b[41m' , off: bgDefaultColor } ,
	bgBrightGreen: { on: blink + '\x1b[42m' , off: bgDefaultColor } ,
	bgBrightYellow: { on: blink + '\x1b[43m' , off: bgDefaultColor } ,
	bgBrightBlue: { on: blink + '\x1b[44m' , off: bgDefaultColor } ,
	bgBrightMagenta: { on: blink + '\x1b[45m' , off: bgDefaultColor } ,
	bgBrightCyan: { on: blink + '\x1b[46m' , off: bgDefaultColor } ,
	bgBrightWhite: { on: blink + '\x1b[47m' , off: bgDefaultColor } ,
	bgBrightColor: { on: blink + '\x1b[4%um' , off: bgDefaultColor } ,	// should be called with a 0..7 integer
	
	// Those either does not produce anything or switch to some arbitrary color, so we will use our own settings instead
	dim: { on: bold + '\x1b[30m' , off: defaultColor } ,	// dim does not produce dim, so we use brightBlack instead
	underline: { on: blink + '\x1b[40m' , off: bgDefaultColor } ,	// underline does not produce underline, so we use bgBrightBlack instead
	italic: { on: '\x1b[1m' , off: '\x1b[22m' } ,	// italic does not produce italic, so we use bold instead (which is no bold but bright BTW)
	hidden: { on: '\x1b[40m\x1b[30m' , off: '\x1b[49m\x1b[39m' } ,	// hidden does not produce hidden, so we use black + bgBlack instead
	strike: { on: bold + '\x1b[30m' , off: defaultColor } ,	// strike does not produce strike, so we use brightBlack instead
	
	// Cursor styles
	hideCursor: { on: '\x1b[?1c' , off: '\x1b[?0c' } ,
	blockCursor: { on: '\x1b[?16;0;16c' } ,
	blinkingBlockCursor: { on: '\x1b[?6c' } ,
	underlineCursor: { on: '\x1b[?2c' } ,	// it's blinking anyway
	blinkingUnderlineCursor: { on: '\x1b[?2c' } ,
	beamCursor: { on: '' } ,	// do not exists
	blinkingBeamCursor: { on: '' } ,	// do not exists
	
			/* OSC */
	
	// Does not exist, silently drop it...
	windowTitle: { on: '%D' } ,
	
	setDefaultColorRgb: { on: '\x1b]P7%x%x%x' } ,
	setDefaultBgColorRgb: { on: '\x1b]P0%x%x%x' } ,
	setColorLL: { on: '\x1b]P%h%x%x%x' } ,
	setFont: { on: '%D' } ,	// not possible?
	requestColor: { on: '%D' , na: true } ,	// not capable
	
			/* Functions */
	
	color256: {
		on: '%[color256:%a]F' ,
		off: defaultColor ,
		fb: true ,
		handler: function color256( register ) {
			
			if ( typeof register !== 'number' ) { return '' ; }
			if ( register < 0 || register > 255 ) { return '' ; }
			
			// If the register is greater than 15, find the 0..15 register that is close to it
			if ( register > 15 )
			{
				register = this.root.registerForRgb( this.root.rgbForRegister( register ) , 0 , 15 ) ;
			}
			
			//return string.format.call( this.root.escHandler , this.root.esc.color.on , register ) ;
			return this.root.escHandler.color( register ) ;
		}
	} ,
	
	bgColor256: {
		on: '%[bgColor256:%a]F' ,
		off: bgDefaultColor ,
		fb: true ,
		handler: function bgColor256( register ) {
			
			if ( typeof register !== 'number' ) { return '' ; }
			if ( register < 0 || register > 255 ) { return '' ; }
			
			// If the register is greater than 15, find the 0..15 register that is close to it
			if ( register > 15 )
			{
				register = this.root.registerForRgb( this.root.rgbForRegister( register ) , 0 , 15 ) ;
			}
			
			//return string.format.call( this.root.escHandler , this.root.esc.bgColor.on , register ) ;
			return this.root.escHandler.bgColor( register ) ;
		}
	} ,
	
	setCursorColor: {
		on: '%[setCursorColor:%a%a]F' ,
		handler: function setCursorColor( bg , fg ) {
			
			if ( typeof fg !== 'number' || typeof bg !== 'number' ) { return '' ; }
			
			fg = Math.floor( fg ) ;
			bg = Math.floor( bg ) ;
			
			if ( fg < 0 || fg > 255 || bg < 0 || bg > 255 ) { return '' ; }
			
			// If the register is greater than 15, find the 0..15 register that is close to it
			if ( fg > 15 ) { fg = this.root.registerForRgb( this.root.rgbForRegister( fg ) , 0 , 15 ) ; }
			if ( bg > 15 ) { bg = this.root.registerForRgb( this.root.rgbForRegister( bg ) , 0 , 15 ) ; }
			
			//console.log( 'fg bg: ' , fg , bg ) ;
			
			fg = fgCursorTable[ fg ] ;
			bg = bgCursorTable[ bg ] ;
			
			return string.format( '\x1b[?16;%u;%uc' , fg , bg * 16 ) ;
		}
	} ,
	
	// It doesn't support RGB, but we can choose an ANSI color close to it
	setCursorColorRgb: {
		on: '%[setCursorColorRgb:%a%a%a]F' ,
		handler: function setCursorColorRgb( r , g , b ) {
			
			if ( typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' ) { return '' ; }
			
			r = Math.floor( r ) ;
			g = Math.floor( g ) ;
			b = Math.floor( b ) ;
			
			if ( r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 ) { return '' ; }
			
			var register = this.root.registerForRgb( r , g , b , 0 , 15 ) ;
			
			//console.log( 'Register:' , register ) ;
			
			return this.root.str.setCursorColor( register , 0 ) ;
		}
	} ,
	
	/*
		This part is a bit of a nasty hack: originally, escape sequence should produce... well... an escape sequence...
		Here an empty string is returned, but some underlying actions are performed.
		This is because the "Linux Console" terminal does not support the mouse, so nothing should be sent to it,
		however we will try to connect to the GPM daemon if it exists.
		It is not very clean, ideally this should be an advanced (not chainable) feature, but doing so would break
		compatibility with other terminal driver.
	*/
	
	// Mouse 'button' mode
	mouseButton: {
		on: '%[mouseButton]F' ,
		off: '%[mouseButton_off]F' ,
		handler: function mouseButton() { gpmMouse.call( this , 'button' ) ; return '' ; } ,
		offHandler: function mouseButton() { gpmMouse.call( this , false ) ; return '' ; }
	} ,
	
	// Mouse 'drag' mode
	mouseDrag: {
		on: '%[mouseDrag]F' ,
		off: '%[mouseDrag_off]F' ,
		handler: function mouseDrag() { gpmMouse.call( this , 'drag' ) ; return '' ; } ,
		offHandler: function mouseDrag() { gpmMouse.call( this , false ) ; return '' ; }
	} ,
	
	// Mouse 'motion' mode
	mouseMotion: {
		on: '%[mouseMotion]F' ,
		off: '%[mouseMotion_off]F' ,
		handler: function mouseMotion() { gpmMouse.call( this , 'motion' ) ; return '' ; } ,
		offHandler: function mouseMotion() { gpmMouse.call( this , false ) ; return '' ; }
	} ,
	
	mouseHilight: { on: '' , off: '' } ,
	mouseSGR: { on: '' , off: '' } ,
	focusEvent: { on: '' , off: '' }
} ) ;



// This is the code that handle GPM
function gpmMouse( mode )
{
	
	var self = this ;
	
	if ( this.root.gpmHandler )
	{
		this.root.gpmHandler.close() ;
		this.root.gpmHandler = undefined ;
	}
	
	if ( ! mode )
	{
		//console.log( '>>>>> off <<<<<' ) ;
		return ;
	}
	
	this.root.gpmHandler = gpm.createHandler( { stdin: this.root.stdin , raw: false , mode: mode } ) ;
	
	//console.log( '>>>>>' , mode , '<<<<<' ) ;
	
	// Simply re-emit event
	this.root.gpmHandler.on( 'mouse' , function( name , data ) {
		self.root.emit( 'mouse' , name , data ) ;
	} ) ;
	this.root.gpmHandler.on( 'error' , function( /* error */ ) {
		//console.log( 'mouseDrag error:' , error ) ;
	} ) ;
}




			/* Key Mapping */



var keymap = tree.extend( null , Object.create( xterm.keymap ) , {
	
	F1: '\x1b[[A' ,
	F2: '\x1b[[B' ,
	F3: '\x1b[[C' ,
	F4: '\x1b[[D' ,
	F5: '\x1b[[E' ,
	
	SHIFT_F1: '\x1b[25~' ,
	SHIFT_F2: '\x1b[26~' ,
	SHIFT_F3: '\x1b[28~' ,
	SHIFT_F4: '\x1b[29~' ,
	SHIFT_F5: '\x1b[31~' ,
	SHIFT_F6: '\x1b[32~' ,
	SHIFT_F7: '\x1b[33~' ,
	SHIFT_F8: '\x1b[34~' ,
	// SHIFT F9-F12 is not supported by the Linux console
	
	// Application Keypad
	KP_NUMLOCK: '\x1bOP' ,
	KP_DIVIDE: '\x1bOQ' ,
	KP_MULTIPLY: '\x1bOR' ,
	KP_MINUS: '\x1bOS' ,
	KP_0: '\x1bOp' ,
	KP_1: '\x1bOq' ,
	KP_2: '\x1bOr' ,
	KP_3: '\x1bOs' ,
	KP_4: '\x1bOt' ,
	KP_5: '\x1bOu' ,
	KP_6: '\x1bOv' ,
	KP_7: '\x1bOw' ,
	KP_8: '\x1bOx' ,
	KP_9: '\x1bOy' ,
	KP_PLUS: '\x1bOl' ,
	KP_DELETE: '\x1bOn' ,
	KP_ENTER: '\x1bOM'
	
} ) ;



module.exports = {
	esc: esc ,
	keymap: keymap ,
	handler: Object.create( xterm.handler ) ,
	support: {
		deltaEscapeSequence: false ,
		"256colors": false ,
		"24bitsColors": false
	} ,
	
	// This is the standard VGA palette, used by restorepalette
	// http://linux.die.net/man/1/restorepalette
	colorRegister: require( '../colorScheme/linux.json' )
} ;

