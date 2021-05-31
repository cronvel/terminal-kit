/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

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



const ScreenBuffer = require( '../ScreenBuffer.js' ) ;
const Rect = require( '../Rect.js' ) ;
const string = require( 'string-kit' ) ;
const toInputSequence = require( './toInputSequence.js' ) ;
const SequencesReader = require( './SequencesReader.js' ) ;

const NextGenEvents = require( 'nextgen-events' ) ;
const Promise = require( 'seventh' ) ;

const spawn = require( 'child_process' ).spawn ;

const logRed = ( ... args ) => console.error( '\x1b[31m' , ... args , '\x1b[m' ) ;
const log = ( ... args ) => console.error( ... args ) ;



/*
	options:
		* width: buffer width (default to dst.width)
		* height: buffer height (default to dst.height)
		* dst: writting destination
		* palette: Palette instance
		* eventInput: optional, an event emitter used as input source, can be a Terminal instance
		* + any ScreenBuffer options

	Properties:
		* childStdin: the stdin stream for the child, that will be used for its keyboard/mouse event
		* childStdout: the stdout stream for the child, that will be displayed on the terminal
*/
function Vte( options = {} ) {
	this.width = Math.floor( options.width ) || ( options.dst ? options.dst.width : 80 ) ;
	this.height = Math.floor( options.height ) || ( options.dst ? options.dst.height : 25 ) ;
	this.palette = options.palette || ( this.dst && this.dst.palette ) ;

	this.screenBuffer = new ScreenBuffer( Object.assign( {} , options , this , { wrap: true } ) ) ;
	this.screenBuffer.setClearAttr( { defaultColor: true , bgDefaultColor: true } ) ;

	// To avoid mistake, cx/cy are starting at 0, like the internal screenBuffer does
	this.cx = 0 ;
	this.cy = 0 ;
	this.savedCx = 0 ;
	this.savedCy = 0 ;

	this.attr = 0 ;
	this.resetAttr() ;

	this.scrollingRegion = null ;
	this.tabWidth = 8 ;
	this.mouseEvent = null ;
	this.focusEvent = false ;
	this.mouseIsDragging = false ;

	this.eventInput = options.eventInput ;
	this.childSequencesReader = new SequencesReader() ;
	this.childProcess = null ;

	this.onEventInputKey = this.onEventInputKey.bind( this ) ;
	this.onEventInputMouse = this.onEventInputMouse.bind( this ) ;
	this.onEventInputTerminal = this.onEventInputTerminal.bind( this ) ;

	this.onChildOutputReset = this.onChildOutputReset.bind( this ) ;
	this.onChildOutputChar = this.onChildOutputChar.bind( this ) ;
	this.onChildOutputCursor = this.onChildOutputCursor.bind( this ) ;
	this.onChildOutputEdit = this.onChildOutputEdit.bind( this ) ;
	this.onChildOutputAttr = this.onChildOutputAttr.bind( this ) ;
	this.onChildOutputPalette = this.onChildOutputPalette.bind( this ) ;
	this.onChildOutputCursorAttr = this.onChildOutputCursorAttr.bind( this ) ;
	this.onChildOutputBell = this.onChildOutputBell.bind( this ) ;
	this.onChildOutputDevice = this.onChildOutputDevice.bind( this ) ;
	this.onChildOutputSystem = this.onChildOutputSystem.bind( this ) ;

	this.onChildOutputControl = this.onChildOutputControl.bind( this ) ;
	this.onChildOutputESC = this.onChildOutputESC.bind( this ) ;
	this.onChildOutputCSI = this.onChildOutputCSI.bind( this ) ;
	this.onChildOutputOSC = this.onChildOutputOSC.bind( this ) ;

	// The real draw is sync, so there is no need for Promise.debounceUpdate(), Promise.debounce() avoid an extra draw with no delta
	//this.drawDebounce = Promise.debounceUpdate( this.drawDelay.bind( this ) ) ;
	this.drawDebounce = Promise.debounce( this.drawDelay.bind( this ) ) ;
}

module.exports = Vte ;

Vte.prototype = Object.create( NextGenEvents.prototype ) ;
Vte.prototype.constructor = Vte ;



// Run a child process
Vte.prototype.run = function( command , args ) {
	var childPty , child ,
		promise = new Promise() ;

	if ( this.childProcess ) { return ; }

	this.start() ;

	try {
		// If child_pty is present, then use it instead of spawn
		// So programs launched would think they truly run inside a TTY
		childPty = require( 'child_pty' ) ;
		child = childPty.spawn( command , args , {
			columns: this.width ,
			rows: this.height
			//stdio: [ 'pty' , 'pty' , 'pty' ]
		} ) ;
	}
	catch ( error ) {
		logRed( "'child_pty' optional dependency not found, using regular child_process.spawn()" ) ;
		child = spawn( command , args ) ;
	}

	this.childProcess = child ;

	//this.on( 'input' , data => { log( 'stdin:' , data ) ; child.stdin.write( data ) ; } ) ;
	this.on( 'input' , data => child.stdin.write( data ) ) ;
	this.childSequencesReader.streamToEvent( child.stdout ) ;

	//child.stdout.on( 'data' , this.onChildOutput ) ;
	//child.stderr.on( 'data' , this.onChildOutput ) ;

	// Tmp, to close the app during alpha phase
	child.on( 'close' , code => {
		this.childProcess = null ;
		promise.resolve() ;
	} ) ;

	return promise ;
} ;



Vte.prototype.start = function() {
	if ( this.eventInput ) {
		this.eventInput.on( 'key' , this.onEventInputKey ) ;
		this.eventInput.on( 'mouse' , this.onEventInputMouse ) ;
		this.eventInput.on( 'terminal' , this.onEventInputTerminal ) ;
	}

	this.childSequencesReader.on( 'reset' , this.onChildOutputReset ) ;
	this.childSequencesReader.on( 'char' , this.onChildOutputChar ) ;
	this.childSequencesReader.on( 'cursor' , this.onChildOutputCursor ) ;
	this.childSequencesReader.on( 'edit' , this.onChildOutputEdit ) ;
	this.childSequencesReader.on( 'attr' , this.onChildOutputAttr ) ;
	this.childSequencesReader.on( 'palette' , this.onChildOutputPalette ) ;
	this.childSequencesReader.on( 'cursorAttr' , this.onChildOutputCursorAttr ) ;
	this.childSequencesReader.on( 'bell' , this.onChildOutputBell ) ;
	this.childSequencesReader.on( 'device' , this.onChildOutputDevice ) ;
	this.childSequencesReader.on( 'system' , this.onChildOutputSystem ) ;

	this.childSequencesReader.on( 'control' , this.onChildOutputControl ) ;
	this.childSequencesReader.on( 'ESC' , this.onChildOutputESC ) ;
	this.childSequencesReader.on( 'CSI' , this.onChildOutputCSI ) ;
	this.childSequencesReader.on( 'OSC' , this.onChildOutputOSC ) ;
} ;



Vte.prototype.draw = function() {
	var stats = this.screenBuffer.draw( { delta: true } ) ;
	this.screenBuffer.drawCursor() ;
	log( 'draw stats:' , stats ) ;
} ;



// Full redraw, no delta
Vte.prototype.redraw = function() {
	var stats = this.screenBuffer.draw( { delta: false } ) ;
	this.screenBuffer.drawCursor() ;
	log( 'redraw stats:' , stats ) ;
} ;



Vte.prototype.drawDelay = async function() {
	//await Promise.resolveTimeout( 10 ) ;
	await Promise.resolveNextTick() ;
	this.draw() ;
} ;



Vte.prototype.putChar = function( char ) {
	var charCode = char.charCodeAt( 0 ) ; log( 'putChar:' , charCode <= 0x1f || charCode === 0x7f ? '(ctrl)' : char , charCode >= 0x10 ? '\\x' + charCode.toString( 16 ) : '\\x0' + charCode.toString( 16 ) , 'at:' , this.cx , this.cy ) ;
	this.screenBuffer.put( { x: this.cx , y: this.cy , attr: this.attr } , char ) ;
	this.cx ++ ;

	if ( this.cx >= this.width ) {
		this.newLine() ;
	}
	else {
		this.drawDebounce() ;
	}
} ;



// internal = don't adjust
Vte.prototype.moveCursorTo = function( x , y , internal = false ) {
	if ( internal ) {
		if ( x !== undefined ) { this.cx = x ; }
		if ( y !== undefined ) { this.cy = y ; }
	}
	else {
		if ( x !== undefined ) { this.cx = x - 1 ; }
		if ( y !== undefined ) { this.cy = y - 1 ; }
	}

	if ( this.cx < 0 ) { this.cx = 0 ; }
	else if ( this.cx >= this.width - 1 ) { this.cx = this.width - 1 ; }

	if ( this.cy < 0 ) { this.cy = 0 ; }
	else if ( this.cy >= this.height - 1 ) { this.cy = this.height - 1 ; }

	this.screenBuffer.cx = this.cx ;
	this.screenBuffer.cy = this.cy ;
	this.screenBuffer.drawCursor() ;
} ;



// Relative move
Vte.prototype.moveCursor = function( x , y ) {
	this.moveCursorTo( this.cx + x , this.cy + y , true ) ;
} ;



// Next horizontal tab
Vte.prototype.nextTab = function() {
	this.moveCursorTo( Math.ceil( ( this.cx + 1 ) / this.tabWidth ) * this.tabWidth , undefined , true ) ;
} ;



Vte.prototype.vScroll = function( lineOffset , noDraw ) {
	var ymin = 0 ,
		ymax = this.height - 1 ;

	if ( this.scrollingRegion && this.cy >= this.scrollingRegion.ymin && this.cy <= this.scrollingRegion.ymax ) {
		( { ymin , ymax } = this.scrollingRegion ) ;
	}

	log( '################### vScroll:' , lineOffset , ymin , ymax  ) ;
	this.screenBuffer.vScroll( lineOffset , this.attr , ymin , ymax , true ) ;

	if ( ! noDraw ) { this.drawDebounce() ; }
} ;



Vte.prototype.lineFeed = function( carriageReturn , noDraw ) {
	var ymin = 0 ,
		ymax = this.height - 1 ;

	if ( this.scrollingRegion && this.cy >= this.scrollingRegion.ymin && this.cy <= this.scrollingRegion.ymax ) {
		( { ymin , ymax } = this.scrollingRegion ) ;
	}

	this.screenBuffer.cy = ++ this.cy ;

	if ( carriageReturn ) {
		this.screenBuffer.cx = this.cx = 0 ;
	}

	if ( this.cy > ymax ) {
		// Scroll up!
		// This will immediately scroll the underlying terminal using the scrolling region capability
		this.screenBuffer.cy = this.cy = ymax ;
		this.vScroll( -1 , noDraw ) ;
		if ( ! noDraw ) { this.screenBuffer.drawCursor() ; }
	}
	else if ( ! noDraw ) {
		this.drawDebounce() ;
	}
} ;

Vte.prototype.newLine = function( noDraw ) { return this.lineFeed( true , noDraw ) ; } ;



Vte.prototype.reverseLineFeed = function( carriageReturn , noDraw ) {
	var ymin = 0 ,
		ymax = this.height - 1 ;

	if ( this.scrollingRegion && this.cy >= this.scrollingRegion.ymin && this.cy <= this.scrollingRegion.ymax ) {
		( { ymin , ymax } = this.scrollingRegion ) ;
	}

	this.screenBuffer.cy = -- this.cy ;

	if ( carriageReturn ) {
		this.screenBuffer.cx = this.cx = 0 ;
	}

	if ( this.cy < ymin ) {
		// Scroll down!
		// This will immediately scroll the underlying terminal using the scrolling region capability
		this.screenBuffer.cy = this.cy = ymin ;
		this.vScroll( 1 , noDraw ) ;
		if ( ! noDraw ) { this.screenBuffer.drawCursor() ; }
	}
	else if ( ! noDraw ) {
		this.drawDebounce() ;
	}
} ;



Vte.prototype.eraseLine = function( mode , noDraw ) {
	if ( mode === 'after' ) {
		this.screenBuffer.fill( {
			region: {
				xmin: this.cx , xmax: this.width - 1 , ymin: this.cy , ymax: this.cy
			} ,
			attr: this.attr
		} ) ;
	}
	else if ( mode === 'before' ) {
		this.screenBuffer.fill( {
			region: {
				xmin: 0 , xmax: this.cx , ymin: this.cy , ymax: this.cy
			} ,
			attr: this.attr
		} ) ;
	}
	else {
		this.screenBuffer.fill( {
			region: {
				xmin: 0 , xmax: this.width - 1 , ymin: this.cy , ymax: this.cy
			} ,
			attr: this.attr
		} ) ;
	}

	if ( ! noDraw ) { this.drawDebounce() ; }
} ;



Vte.prototype.eraseDisplay = function( mode , noDraw ) {
	if ( mode === 'after' ) {
		// First, erase the current line from the cursor
		this.screenBuffer.fill( {
			region: {
				xmin: this.cx , xmax: this.width - 1 , ymin: this.cy , ymax: this.cy
			} ,
			attr: this.attr
		} ) ;
		// Then, erase all lines below the current line
		this.screenBuffer.fill( {
			region: {
				xmin: 0 , xmax: this.width - 1 , ymin: this.cy + 1 , ymax: this.height - 1
			} ,
			attr: this.attr
		} ) ;
	}
	else if ( mode === 'before' ) {
		// First, erase all lines above the current line
		this.screenBuffer.fill( {
			region: {
				xmin: 0 , xmax: this.width - 1 , ymin: 0 , ymax: this.cy - 1
			} ,
			attr: this.attr
		} ) ;
		// Then, erase the current line up to the cursor
		this.screenBuffer.fill( {
			region: {
				xmin: 0 , xmax: this.cx , ymin: this.cy , ymax: this.cy
			} ,
			attr: this.attr
		} ) ;
	}
	else {
		this.screenBuffer.fill( { attr: this.attr } ) ;
	}

	if ( ! noDraw ) { this.drawDebounce() ; }
} ;



Vte.prototype.backDelete = function( count = 1 ) {
	if ( count > this.cx ) { count = this.cx ; }
	if ( count <= 0 ) { return ; }

	// Shift the end of the line
	this.screenBuffer.copyRegion( {
		xmin: this.cx , ymin: this.cy , xmax: this.width - 1 , ymax: this.cy
	} , { x: this.cx - count , y: this.cy } ) ;
	this.cx -= count ;

	// Fill the end of the line with blank
	this.screenBuffer.fill( { region: {
		xmin: this.width - count , ymin: this.cy , xmax: this.width - 1 , ymax: this.cy
	} ,
	attr: this.attr } , ' ' ) ;

	this.screenBuffer.cx = this.cx ;

	this.drawDebounce() ;
} ;



Vte.prototype.delete = function( count = 1 ) {
	if ( count > this.width - this.cx ) { count = this.width - this.cx ; }
	if ( count <= 0 ) { return ; }

	// Shift the end of the line
	if ( this.cx + count < this.width ) {
		this.screenBuffer.copyRegion( {
			xmin: this.cx + count , ymin: this.cy , xmax: this.width - 1 , ymax: this.cy
		} , { x: this.cx , y: this.cy } ) ;
		log( "delete:" , count , "copy region:" , {
			xmin: this.cx + count , ymin: this.cy , xmax: this.width - 1 , ymax: this.cy
		} , { x: this.cx , y: this.cy } ) ;
	}

	// Fill the end of the line with blank
	this.screenBuffer.fill( { region: {
		xmin: this.width - count , ymin: this.cy , xmax: this.width - 1 , ymax: this.cy
	} ,
	attr: this.attr } , ' ' ) ;
	log( "delete:" , count , "fill region:" , {
		xmin: this.width - count , ymin: this.cy , xmax: this.width - 1 , ymax: this.cy
	} ) ;

	this.drawDebounce() ;
} ;



Vte.prototype.erase = function( count = 1 ) {
	if ( count > this.width - this.cx ) { count = this.width - this.cx ; }
	if ( count <= 0 ) { return ; }

	// Fill with blank
	this.screenBuffer.fill( { region: {
		xmin: this.cx , ymin: this.cy , xmax: this.cx + count - 1 , ymax: this.cy
	} ,
	attr: this.attr } , ' ' ) ;
	log( "erase:" , count , "fill region:" , {
		xmin: this.cx , ymin: this.cy , xmax: this.cx + count - 1 , ymax: this.cy
	} ) ;

	this.drawDebounce() ;
} ;



Vte.prototype.deleteLine = function( count = 1 ) {
	if ( count > this.height - this.cy ) { count = this.height - this.cy ; }
	if ( count <= 0 ) { return ; }

	// Shift from the end of the screen
	if ( this.cy + count < this.height ) {
		this.screenBuffer.copyRegion( {
			xmin: 0 , ymin: this.cy + count , xmax: this.width - 1 , ymax: this.height - 1
		} , { x: 0 , y: this.cy } ) ;
		log( "deleteLine:" , count , "copy region:" , {
			xmin: 0 , ymin: this.cy + count , xmax: this.width - 1 , ymax: this.height - 1
		} , { x: 0 , y: this.cy } ) ;
	}

	// Fill the end of the screen with blank
	this.screenBuffer.fill( { region: {
		xmin: 0 , ymin: this.height - count , xmax: this.width - 1 , ymax: this.height - 1
	} ,
	attr: this.attr } , ' ' ) ;
	log( "deleteLine:" , count , "fill region:" , {
		xmin: 0 , ymin: this.height - count , xmax: this.width - 1 , ymax: this.height - 1
	} ) ;

	// This move x to the left
	this.cx = this.screenBuffer.cx = 0 ;

	this.drawDebounce() ;
} ;



Vte.prototype.insertLine = function( count = 1 ) {
	if ( count > this.height - this.cy ) { count = this.height - this.cy ; }
	if ( count <= 0 ) { return ; }

	// Shift to the end of the screen
	if ( this.cy + count < this.height ) {
		//this.screenBuffer.copyRegion( { xmin: 0 , ymin: this.cy + count , xmax: this.width - 1 , ymax: this.height - 1 } , { x: 0 , y: this.cy } ) ;
		this.screenBuffer.copyRegion( {
			xmin: 0 , ymin: this.cy , xmax: this.width - 1 , ymax: this.height - count
		} , { x: 0 , y: this.cy + count } ) ;
		log( "insertLine:" , count , "copy region:" , {
			xmin: 0 , ymin: this.cy + count , xmax: this.width - 1 , ymax: this.height - 1
		} , { x: 0 , y: this.cy } ) ;
	}

	// Fill the inserted lines with blank
	//this.screenBuffer.fill( { region: { xmin: 0 , ymin: this.height - count , xmax: this.width - 1 , ymax: this.height - 1 } , attr: this.attr } , ' ' ) ;
	this.screenBuffer.fill( { region: {
		xmin: 0 , ymin: this.cy , xmax: this.width - 1 , ymax: this.cy + count
	} ,
	attr: this.attr } , ' ' ) ;
	log( "insertLine:" , count , "fill region:" , {
		xmin: 0 , ymin: this.height - count , xmax: this.width - 1 , ymax: this.height - 1
	} ) ;

	// This move x to the left
	this.cx = this.screenBuffer.cx = 0 ;

	this.drawDebounce() ;
} ;



Vte.prototype.resetAttr = function() { this.attr = this.screenBuffer.DEFAULT_ATTR ; } ;
Vte.prototype.setAttr = function( attrObject ) { this.attr = this.screenBuffer.object2attr( attrObject ) ; } ;
Vte.prototype.addAttr = function( attrObject ) { this.attr = this.screenBuffer.attrAndObject( this.attr , attrObject ) ; } ;



Vte.prototype.setVScrollingRegion = function( ymin = null , ymax = null , internal = false ) {
	log( "########################### setVScrollingRegion:" , ymin , ymax , internal ) ;
	if ( ymin === null || ymax === null ) {
		this.scrollingRegion = null ;
	}
	else if ( internal ) {
		this.scrollingRegion = new Rect( 0 , Math.max( 0 , ymin ) , this.width - 1 , Math.min( this.height - 1 , ymax ) ) ;
	}
	else {
		this.scrollingRegion = new Rect( 0 , Math.max( 0 , ymin - 1 ) , this.width - 1 , Math.min( this.height - 1 , ymax - 1 ) ) ;
	}
	log( "########################### setVScrollingRegion region:" , this.scrollingRegion ) ;
} ;



// Emit cursor location escape sequence
Vte.prototype.emitCursorLocation = function( decVariant ) {
	//this.emit( 'input' , '\x1b[' + ( decVariant ? '?' : '' ) + this.cy + ';' + this.cx + 'R' ) ;
	this.emit( 'input' , string.format( toInputSequence.reports[ decVariant ? 'cursorLocationDecVariant' : 'cursorLocation' ] , this.cx , this.cy ) ) ;
} ;



// Emit the screen size
Vte.prototype.emitScreenSize = function( decVariant ) {
	this.emit( 'input' , string.format( toInputSequence.reports.screenSize , this.width , this.height ) ) ;
} ;



// Emit the focus
Vte.prototype.emitFocus = function( isIn ) {
	this.emit( 'input' , toInputSequence.reports[ isIn ? 'focusIn' : 'focusOut' ] ) ;
} ;



// Emit the focus
Vte.prototype.emitRegisterColor = function( register ) {
	logRed( "emitRegisterColor" , register ) ;
	var rgb = this.screenBuffer.palette.getRgb( register ) ;
	logRed( "emitRegisterColor >>> " , rgb ) ;
	if ( ! rgb ) { return ; }
	this.emit( 'input' , string.format( toInputSequence.reports.registerColor , register , rgb.r , rgb.g , rgb.b ) ) ;
} ;



// Emit mouse event escape sequence using the SGR protocol
Vte.prototype.emitMouseSGR = function( type , data ) {
	var code = 0 , released = false ;

	if ( data.shift ) { code |= 4 ; }
	if ( data.alt ) { code |= 8 ; }
	if ( data.ctrl ) { code |= 16 ; }

	switch ( type ) {
		case 'MOUSE_LEFT_BUTTON_PRESSED' :
			break ;
		case 'MOUSE_MIDDLE_BUTTON_PRESSED' :
			code |= 1 ;
			break ;
		case 'MOUSE_RIGHT_BUTTON_PRESSED' :
			code |= 2 ;
			break ;
		case 'MOUSE_OTHER_BUTTON_PRESSED' :
			code |= 3 ;
			break ;
		case 'MOUSE_LEFT_BUTTON_RELEASED' :
			released = true ;
			break ;
		case 'MOUSE_MIDDLE_BUTTON_RELEASED' :
			code |= 1 ;
			released = true ;
			break ;
		case 'MOUSE_RIGHT_BUTTON_RELEASED' :
			code |= 2 ;
			released = true ;
			break ;
		case 'MOUSE_OTHER_BUTTON_RELEASED' :
			code |= 3 ;
			released = true ;
			break ;
		case 'MOUSE_WHEEL_UP' :
			code |= 64 ;
			break ;
		case 'MOUSE_WHEEL_DOWN' :
			code |= 65 ;
			break ;
		case 'MOUSE_MOTION' :
			code |= 32 ;
			break ;
	}

	this.emit( 'input' , '\x1b[<' + code + ';' + data.x + ';' + data.y + ( released ? 'm' : 'M' ) ) ;
} ;



// Event handlers



Vte.prototype.onEventInputKey = function( key , altKeys , data ) {
	log( 'onEventInputKey:' , key ) ;
	if ( data.isCharacter ) {
		this.emit( 'input' , key ) ;
	}
	else if ( toInputSequence.specialKeys[ key ] ) {
		this.emit( 'input' , toInputSequence.specialKeys[ key ] ) ;
	}
} ;



Vte.prototype.onEventInputMouse = function( type , data ) {
	if ( ! this.mouseEvent ) { return ; }
	//log( 'onEventInputMouse:' , type , data ) ;

	// /!\ Not sure if it's the most reliable way to do that
	if ( this.eventInput === this.screenBuffer.dst ) {
		// We MUST add an offset to the coordinate
		data.x -= this.screenBuffer.x - 1 ;
		data.y -= this.screenBuffer.y - 1 ;
	}

	switch ( type ) {
		case 'MOUSE_LEFT_BUTTON_PRESSED' :
		case 'MOUSE_MIDDLE_BUTTON_PRESSED' :
		case 'MOUSE_RIGHT_BUTTON_PRESSED' :
		case 'MOUSE_OTHER_BUTTON_PRESSED' :
			this.mouseIsDragging = true ;
			this.emitMouseSGR( type , data ) ;
			break ;
		case 'MOUSE_LEFT_BUTTON_RELEASED' :
		case 'MOUSE_MIDDLE_BUTTON_RELEASED' :
		case 'MOUSE_RIGHT_BUTTON_RELEASED' :
		case 'MOUSE_OTHER_BUTTON_RELEASED' :
			this.mouseIsDragging = false ;
			this.emitMouseSGR( type , data ) ;
			break ;
		case 'MOUSE_WHEEL_UP' :
		case 'MOUSE_WHEEL_DOWN' :
			this.emitMouseSGR( type , data ) ;
			break ;
		case 'MOUSE_MOTION' :
			if ( this.mouseEvent === 'motion' || ( this.mouseEvent === 'drag' && this.mouseIsDragging ) ) {
				this.emitMouseSGR( type , data ) ;
			}
			break ;
	}
} ;



Vte.prototype.onEventInputTerminal = function( type , data ) {
	switch ( type ) {
		case 'FOCUS_IN' :
			if ( this.focusEvent ) { this.emitFocus( true ) ; }
			break ;
		case 'FOCUS_OUT' :
			if ( this.focusEvent ) { this.emitFocus( false ) ; }
			break ;
	}
} ;



Vte.prototype.onChildOutputReset = function() {
	logRed( 'full reset' ) ;
} ;



Vte.prototype.onChildOutputChar = function( char , charCode ) {
	//log( '>>> put char charCode:' , charCode ) ;
	//log( 'put char:' , charCode <= 0x1f || charCode === 0x7f ? '(ctrl)' : char , charCode >= 0x10 ? '\\x' + charCode.toString( 16 ) : '\\x0' + charCode.toString( 16 ) ) ;
	this.putChar( char ) ;
} ;



Vte.prototype.onChildOutputCursor = function( subType , arg , extraArgs ) {
	log( 'cursor:' , subType , arg , extraArgs ) ;

	var arg1 = extraArgs && extraArgs[ 0 ] ? + extraArgs[ 0 ] : undefined ;
	var arg2 = extraArgs && extraArgs[ 1 ] ? + extraArgs[ 1 ] : undefined ;

	switch ( subType ) {
		//case 'newLine' : return this.newLine() ;
		case 'lineFeed' :
			return this.lineFeed() ;
		case 'carriageReturn' :
			return this.moveCursorTo( 0 , undefined , true ) ;
		case 'tab' :
			return this.nextTab() ;
		case 'move' :
			// unused
			this.moveCursor( arg1 , arg2 ) ;
			break ;
		case 'up' :
			this.moveCursor( 0 , -arg1 ) ;
			break ;
		case 'down' :
			this.moveCursor( 0 , arg1 ) ;
			break ;
		case 'right' :
			this.moveCursor( arg1 , 0 ) ;
			break ;
		case 'left' :
			this.moveCursor( -arg1 , 0 ) ;
			break ;
		case 'moveToYX' :
			// Swap the args
			this.moveCursorTo( arg2 , arg1 ) ;
			break ;
		case 'column' :
			this.moveCursorTo( arg1 ) ;
			break ;
		case 'row' :
			this.moveCursorTo( undefined , arg1 ) ;
			break ;
		case 'previousLine' :
			this.moveCursor( -this.cx , -arg1 ) ;
			break ;
		case 'nextLine' :
			this.moveCursor( -this.cx , arg1 ) ;
			break ;
		case 'save' :
			this.savedCx = this.cx ;
			this.savedCy = this.cy ;
			break ;
		case 'restore' :
			this.moveCursorTo( this.savedCx , this.savedCy , true ) ;
			break ;
		default :
			logRed( 'Unknown/unsupported cursor action' , subType , arg , extraArgs ) ;
	}
} ;



Vte.prototype.onChildOutputEdit = function( subType , arg , extraArgs ) {
	var arg1 = extraArgs && extraArgs[ 0 ] ? + extraArgs[ 0 ] : undefined ;
	var arg2 = extraArgs && extraArgs[ 1 ] ? + extraArgs[ 1 ] : undefined ;

	switch ( subType ) {
		case 'backDelete' :
			log( 'backDelete' , arg1 ) ;
			return this.backDelete( arg1 ) ;
		case 'delete' :
			log( 'delete' , arg1 ) ;
			return this.delete( arg1 ) ;
		case 'erase' :
			log( 'erase' , arg ) ;
			this.erase( arg ) ;
			break ;
		case 'deleteLine' :
			log( 'deleteLine' , arg1 ) ;
			this.deleteLine( arg1 ) ;
			break ;
		case 'insertLine' :
			log( 'insertLine' , arg1 ) ;
			this.insertLine( arg1 ) ;
			break ;
		case 'eraseLine' :
			log( 'eraseLine' , arg ) ;
			this.eraseLine( arg ) ;
			break ;
		case 'eraseDisplay' :
			log( 'eraseDisplay' , arg ) ;
			this.eraseDisplay( arg ) ;
			break ;
		case 'reverseLineFeed' :
			log( 'reverseLineFeed' ) ;
			this.reverseLineFeed( arg ) ;
			break ;
		case 'vScrollingRegion' :
			log( 'vScrollingRegion' , arg1 , arg2 ) ;
			this.setVScrollingRegion( arg1 , arg2 ) ;
			//this.setVScrollingRegion( arg1 , arg2 , true ) ;
			break ;
		case 'vScrollUp' :
			log( 'vScrollUp' , arg1 ) ;
			this.vScroll( -arg1 ) ;
			break ;
		case 'vScrollDown' :
			log( 'vScrollDown' , arg1 ) ;
			this.vScroll( arg1 ) ;
			break ;
		default :
			logRed( 'Unknown/unsupported edit action' , subType , arg , extraArgs ) ;
	}
} ;



Vte.prototype.onChildOutputAttr = function( subType , arg , extraArgs ) {
	switch ( subType ) {
		case 'reset' :
			log( 'ATTR reset' ) ;
			this.resetAttr() ;
			break ;
		case 'bold' :
			log( 'ATTR bold:' , arg ) ;
			this.addAttr( { bold: arg } ) ;
			break ;
		case 'dim' :
			log( 'ATTR dim:' , arg ) ;
			this.addAttr( { dim: arg } ) ;
			break ;
		case 'italic' :
			log( 'ATTR italic:' , arg ) ;
			this.addAttr( { italic: arg } ) ;
			break ;
		case 'underline' :
			log( 'ATTR underline:' , arg ) ;
			this.addAttr( { underline: arg } ) ;
			break ;
		case 'blink' :
			log( 'ATTR blink:' , arg ) ;
			this.addAttr( { blink: arg } ) ;
			break ;
		case 'inverse' :
			log( 'ATTR inverse:' , arg ) ;
			this.addAttr( { inverse: arg } ) ;
			break ;
		case 'hidden' :
			log( 'ATTR hidden:' , arg ) ;
			this.addAttr( { hidden: arg } ) ;
			break ;
		case 'strike' :
			log( 'ATTR strike:' , arg ) ;
			this.addAttr( { strike: arg } ) ;
			break ;
		case 'noDimNoBold' :
			log( 'ATTR noDimNoBold' ) ;
			this.addAttr( { bold: false , dim: false } ) ;
			break ;
		case 'color' :
			log( 'ATTR color:' , arg ) ;
			this.addAttr( { color: arg } ) ;
			break ;
		case 'color256' :
			log( 'ATTR color256:' , extraArgs ) ;
			this.addAttr( { color: + extraArgs[ 0 ] } ) ;
			break ;
		case 'colorRgb' :
			log( 'ATTR colorRgb:' , extraArgs , 'not supported ATM' ) ;
			break ;
		case 'bgColor' :
			log( 'ATTR bgColor:' , arg ) ;
			this.addAttr( { bgColor: arg } ) ;
			break ;
		case 'bgColor256' :
			log( 'ATTR bgColor256:' , extraArgs ) ;
			this.addAttr( { bgColor: + extraArgs[ 0 ] } ) ;
			break ;
		case 'bgColorRgb' :
			log( 'ATTR bgColorRgb:' , extraArgs , 'not supported ATM' ) ;
			break ;
		default :
			logRed( 'Unknown/unsupported ATTR' , subType , arg , extraArgs ) ;
	}
} ;



Vte.prototype.onChildOutputPalette = function( subType , extraArgs ) {
	logRed( 'Palette command:' , subType , extraArgs ) ;

	var arg1 = extraArgs && extraArgs[ 0 ] ? + extraArgs[ 0 ] : undefined ;

	switch ( subType ) {
		case 'getColor' :
			if ( ! isNaN( arg1 ) ) { this.emitRegisterColor( arg1 ) ; }
			break ;
	}
} ;



Vte.prototype.onChildOutputCursorAttr = function( subType , args ) {
	logRed( 'Cursor ATTR command:' , subType , args ) ;
} ;



Vte.prototype.onChildOutputBell = function() {
	logRed( 'bell' ) ;
} ;



Vte.prototype.onChildOutputDevice = function( subType , arg , extraArgs ) {
	logRed( 'Device command:' , subType , arg , extraArgs ) ;
	switch ( subType ) {
		case 'mouseButton' :
			this.mouseEvent = arg ? 'button' : null ;
			break ;
		case 'mouseDrag' :
			this.mouseEvent = arg ? 'drag' : null ;
			break ;
		case 'mouseMotion' :
			this.mouseEvent = arg ? 'motion' : null ;
			break ;
		case 'focusEvent' :
			this.focusEvent = !! arg ;
			break ;
		case 'cursorLocation' :
			// Arg is true for DEC mode (add a '?' to the sequence)
			this.emitCursorLocation( arg ) ;
			break ;
		case 'screenSize' :
			this.emitScreenSize( arg ) ;
			break ;
		default :
			logRed( 'Unknown/unsupported device command' , subType , arg , extraArgs ) ;
	}
} ;



Vte.prototype.onChildOutputSystem = function( subType , args ) {
	logRed( 'System command:' , subType , args ) ;
} ;



// Triggered when unknown/unsupported sequences are produced

Vte.prototype.onChildOutputControl = function( charCodeStr ) {
	logRed( 'control' , charCodeStr ) ;
} ;



Vte.prototype.onChildOutputESC = function( type , args ) {
	logRed( 'ESC -- type:' , type , args ) ;
} ;



Vte.prototype.onChildOutputCSI = function( type , args ) {
	logRed( 'CSI -- type:' , type , ', args:' , args ) ;
} ;



Vte.prototype.onChildOutputOSC = function( type , args ) {
	logRed( 'OSC -- type:' , type , ', args:' , args ) ;
} ;

