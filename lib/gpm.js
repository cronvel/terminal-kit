/*
	Terminal Kit

	Copyright (c) 2009 - 2020 Cédric Ronvel

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



/*
	This module try to stay close to the original GPM lib written in C.
*/



var net = require( 'net' ) ;
var NextGenEvents = require( 'nextgen-events' ) ;
var termkit = require( './termkit.js' ) ;

var gpm = {} ;
module.exports = gpm ;





/* GPM structures & constants */
/* as found in the GPM source code: src/headers/gpm.h */



// Can't figure out the usage of the GPM_MAGIC constant ATM
var gpmMagic = Buffer.allocUnsafe( 4 ) ;
gpmMagic.writeUInt32LE( 0x47706D4C , 0 ) ;



// Return a Buffer containing a Gpm_Connect structure, using a pid and a ttyIndex
gpm.connectStructureBuffer = function connectStructureBuffer( gpmConnect ) {
	var buffer = Buffer.allocUnsafe( 16 ) ;

	if ( gpmConnect.eventMask === undefined ) { gpmConnect.eventMask = 65535 ; }
	if ( gpmConnect.defaultMask === undefined ) { gpmConnect.defaultMask = 0 ; }
	if ( gpmConnect.minMod === undefined ) { gpmConnect.minMod = 0 ; }
	if ( gpmConnect.maxMod === undefined ) { gpmConnect.maxMod = 65535 ; }

	//Looks like it want Little Endian
	buffer.writeUInt16LE( gpmConnect.eventMask , 0 ) ;	// eventMask: wanted events
	buffer.writeUInt16LE( gpmConnect.defaultMask , 2 ) ;	// defaultMask: things handled by default
	buffer.writeUInt16LE( gpmConnect.minMod , 4 ) ;	// minMod: want everything (modifier keys)
	buffer.writeUInt16LE( gpmConnect.maxMod , 6 ) ;	// maxMod: all modifiers keys included
	buffer.writeUInt32LE( gpmConnect.pid , 8 ) ;	// pid
	buffer.writeUInt32LE( gpmConnect.vc , 12 ) ;	// vc: the TTY index

	//console.log( buffer ) ;

	return buffer ;
} ;



// Extract a Gpm_Event from a Buffer
gpm.eventStructure = function eventStructure( buffer ) {
	var event = {} ;

	//Looks like it is in Little Endian
	event.buttons = buffer.readUInt8( 0 ) ;
	event.modifiers = buffer.readUInt8( 1 ) ;

	event.vc = buffer.readUInt16LE( 2 ) ;

	event.dx = buffer.readInt16LE( 4 ) ;
	event.dy = buffer.readInt16LE( 6 ) ;
	event.x = buffer.readInt16LE( 8 ) ;
	event.y = buffer.readInt16LE( 10 ) ;

	event.eType = buffer.readUInt32LE( 12 ) ;

	event.clicks = buffer.readUInt32LE( 16 ) ;

	event.margin = buffer.readUInt32LE( 20 ) ;

	event.wdx = buffer.readInt16LE( 24 ) ;
	event.wdy = buffer.readInt16LE( 26 ) ;

	//console.log( event ) ;

	return event ;
} ;



//enum Gpm_Etype (comments are copy-paste of gpm.h)

gpm.MOVE = 1 ;
gpm.DRAG = 2 ;	// exactly one of the bare ones is active at a time
gpm.DOWN = 4 ;
gpm.UP = 8 ;

gpm.SINGLE = 16 ;	// at most one in three is set
gpm.DOUBLE = 32 ;
gpm.TRIPLE = 64 ;	// WARNING: I depend on the values

gpm.MFLAG = 128 ;	// motion during click?
gpm.HARD = 256 ;	// if set in the defaultMask, force an already used event to pass over to another handler

gpm.ENTER = 512 ;	// enter event, user in Roi's (Region Of Interest)
gpm.LEAVE = 1024 ;	// leave event, used in Roi's



//enum Gpm_Margin

gpm.TOP = 1 ;
gpm.BOT = 2 ;
gpm.LFT = 4 ;
gpm.RGT = 8 ;





/* GPM event handler */



gpm.Handler = function Handler() { throw new Error( '[terminal] Cannot create a gpm.Handler object directly, use gpm.createHandler() instead' ) ; } ;
gpm.Handler.prototype = Object.create( NextGenEvents.prototype ) ;
gpm.Handler.prototype.constructor = gpm.Handler ;



// Create a new GPM Handler
gpm.createHandler = function createHandler( options ) {
	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	if ( options.raw === undefined ) { options.raw = true ; }
	if ( options.stdin === undefined ) { options.stdin = 0 ; /*process.stdin ;*/ }
	if ( options.mode === undefined ) { options.mode = 'motion' ; }

	var connectMode = { pid: process.pid } ;

	connectMode.defaultMask =
		gpm.MOVE | gpm.DRAG | gpm.DOWN | gpm.UP | gpm.SINGLE | gpm.DOUBLE | gpm.TRIPLE | gpm.MFLAG | gpm.HARD ;

	switch ( options.mode ) {
		case 'button' :
			connectMode.eventMask = gpm.DOWN | gpm.UP ;
			break ;
		case 'drag' :
			connectMode.eventMask = gpm.DRAG | gpm.DOWN | gpm.UP ;
			break ;
		case 'motion' :
		default :
			connectMode.eventMask = gpm.MOVE | gpm.DRAG | gpm.DOWN | gpm.UP ;
			break ;
	}

	var handler = Object.create( gpm.Handler.prototype ) ;


	var tty = termkit.tty.getPath( options.stdin ) ;

	//if ( ! tty.index ) { handler.emit( 'error' , new Error( 'Not a TTY' ) ) ; return ; }

	//console.log( 'TTY:' , tty.index ) ;
	connectMode.vc = tty.index || 0 ;

	handler.socket = new net.Socket() ;
	var gpmConnect = gpm.connectStructureBuffer( connectMode ) ;

	handler.socket.connect( '/dev/gpmctl' , () => {
		//console.log( 'Connected' ) ;
		handler.socket.write( gpmConnect ) ;
	} ) ;

	// Re-emit event
	handler.socket.on( 'error' , ( error ) => { handler.emit( 'error' , error ) ; handler.close() ; } ) ;
	handler.socket.on( 'end' , () => { handler.emit( 'end' ) ; } ) ;
	handler.socket.on( 'close' , () => { handler.emit( 'close' ) ; handler.close() ; } ) ;

	handler.socket.on( 'data' , ( buffer ) => {

		//console.log( 'data' , buffer.length , buffer , '\n' , eventStructure( buffer ) ) ;
		var rawEvent = gpm.eventStructure( buffer ) ;

		if ( options.raw ) { handler.emit( 'mouse' , rawEvent ) ; return ; }

		var terminalKitEvent = gpm.raw2terminalKitEvent( rawEvent ) ;
		handler.emit( 'mouse' , terminalKitEvent[ 0 ] , terminalKitEvent[ 1 ] ) ;
	} ) ;

	return handler ;
} ;



// End/Close the underlying connection
gpm.Handler.prototype.close = function handlerClose() {
	if ( this.socket ) {
		this.socket.destroy() ;
		this.socket = undefined ;
	}
} ;



// Transform raw GPM event to terminal-kit event
gpm.raw2terminalKitEvent = function raw2terminalKitEvent( event ) {
	var name ;

	var terminalKitEvent = {
		shift: !! ( event.modifiers & 1 ) ,
		//altGr: event.modifiers & 2 ? true : false ,	// terminal-kit do not use altGr
		ctrl: !! ( event.modifiers & 4 ) ,
		alt: !! ( event.modifiers & 8 ) ,
		x: event.x ,
		y: event.y
	} ;

	if ( event.eType & gpm.DOWN ) {
		name = 'MOUSE_LEFT_BUTTON_PRESSED' ;
	}
	else if ( event.eType & gpm.UP ) {
		name = 'MOUSE_LEFT_BUTTON_RELEASED' ;
	}
	else if ( event.eType & gpm.MOVE || event.eType & gpm.DRAG ) {
		name = 'MOUSE_MOTION' ;
	}
	else {
		name = 'MOUSE_UNKNOWN' ;
	}

	return [ name , terminalKitEvent ] ;
} ;


