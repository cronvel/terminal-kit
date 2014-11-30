#!/usr/bin/env node
/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox test suite
	
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



var fs = require( 'fs' ) ;
var path = require( 'path' ) ;
var termkit = require( '../lib/terminal.js' ) ;
var term ;



var filepath ;
var viewport , statusBar , hintBar , canvas ;

var editingMode = {
	mode: 'chars' ,
	attr: {
		bgColor: 0 ,
		color: 7
	}
} ;



function init( callback )
{
	termkit.getDetectedTerminal( function( error , detectedTerm ) {
		
		if ( error ) { throw new Error( 'Cannot detect terminal.' ) ; }
		
		term = detectedTerm ;
		
		if ( process.argv.length < 3 )
		{
			term.blue( 'Usage is:\n' ).brightCyan( './' + path.basename( process.argv[ 1 ] ) ).cyan.italic( ' <file>' )( '\n\n' ) ;
			process.exit( 1 ) ;
		}
		
		filepath = process.argv[ 2 ] ;
		
		viewport = termkit.ScreenBuffer.create( {
			dst: term ,
			width: term.width ,
			height: term.height ,
			y: 1
		} ) ;
		
		statusBar = termkit.ScreenBuffer.create( {
			dst: viewport ,
			width: viewport.width ,
			height: 1 ,
			noClear: true
		} ) ;
		statusBar.clear( { attr: { bgColor: 'brightWhite' } , char: ' ' } ) ;
		
		hintBar = termkit.ScreenBuffer.create( {
			dst: viewport ,
			width: viewport.width ,
			height: 1 ,
			y: viewport.height - 1 ,
			noClear: true
		} ) ;
		hintBar.clear( { attr: { bgColor: 'brightWhite' } , char: ' ' } ) ;
		
		try {
			load( filepath ) ;
		}
		catch ( error ) {
			//console.error( error ) ;
			terminate( error.message ) ;
			return ;
		}
		
		term.fullscreen() ;
		//term.moveTo.eraseLine.bgWhite.green( 1 , 1 , 'Arrow keys: move - CTRL-C: Quit\n' ) ;
		
		refreshStatusBar() ;
		randomHint( 'Welcome to the ASCII Art sprite editor!' ) ;
		redrawCanvas() ;
		
		term.grabInput() ;
		term.on( 'key' , inputs ) ;
		
		callback() ;
	} ) ;
}



function terminate( reason )
{
	term.fullscreen( false ) ;
	term.hideCursor( false ) ;
	term.grabInput( false ) ;
	
	setTimeout( function() {
		term.moveTo( 1 , term.height , '\n\n' ) ;
		if ( reason ) { term.red( reason + '\n\n' ) ; }
		term.styleReset() ;
		process.exit() ;
	} , 100 ) ;
}



function load()
{
	if ( ! fs.existsSync( filepath ) )
	{
		canvas = termkit.ScreenBuffer.create( {
			dst: viewport ,
			width: viewport.width ,
			height: viewport.height - 2 ,
			y: 1
		} ) ;
		
		return ;
	}
	
	// If something is bad, let it crash, do not handle the exception here
	canvas = termkit.ScreenBuffer.loadSync( filepath ) ;
	
	canvas.dst = viewport ;
	canvas.y = 1 ;
	/*
	canvas = termkit.ScreenBuffer.create( {
		dst: viewport ,
		width: viewport.width ,
		height: viewport.height - 2 ,
		y: 1
	} ) ;
	//*/
	//console.error( canvas ) ;
}



function save()
{
	try {
		canvas.saveSync( filepath ) ;
	}
	catch ( error ) {
		terminate( error.message ) ;
		return ;
	}
}



function refreshCursorPosition()
{
	term.moveTo( viewport.x + canvas.x + canvas.cx , viewport.y + canvas.y + canvas.cy ) ;
}



function redrawCanvas()
{
	canvas.draw() ;
	viewport.draw( { diffOnly: true } ) ;
	refreshCursorPosition() ;
}



function redrawStatusBar()
{
	statusBar.draw() ;
	viewport.draw( { diffOnly: true } ) ;
	refreshCursorPosition() ;
}



function redrawHintBar()
{
	hintBar.draw() ;
	viewport.draw( { diffOnly: true } ) ;
	refreshCursorPosition() ;
}



function refreshStatusBar()
{
	var styles = [] ;
	var options = { attr: { bgColor: 'brightWhite' , color: 'green' } } ;
	
	statusBar.clear( { attr: options.attr , char: ' ' } ) ;
	statusBar.cx = statusBar.cy = 0 ;
	
	statusBar.put( options , '  fg: %d' , editingMode.attr.color ) ;
	statusBar.put( { attr: { bgColor: editingMode.attr.color } } , ' ' ) ;
	
	statusBar.put( options , '  bg: %d' , editingMode.attr.bgColor ) ;
	statusBar.put( { attr: { bgColor: editingMode.attr.bgColor } } , ' ' ) ;
	
	if ( editingMode.attr.bold ) { styles.push( 'bold' ) ; }
	if ( editingMode.attr.dim ) { styles.push( 'dim' ) ; }
	if ( editingMode.attr.italic ) { styles.push( 'italic' ) ; }
	if ( editingMode.attr.underline ) { styles.push( 'underline' ) ; }
	if ( editingMode.attr.blink ) { styles.push( 'blink' ) ; }
	if ( editingMode.attr.inverse ) { styles.push( 'inverse' ) ; }
	if ( editingMode.attr.hidden ) { styles.push( 'hidden' ) ; }
	if ( editingMode.attr.strike ) { styles.push( 'strike' ) ; }
	
	if ( styles.length ) { styles = styles.join( '+' ) ; }
	else { styles = 'none' ; }
	
	statusBar.put( options , '  styles: ' ) ;
	statusBar.put( { attr: { bgColor: 'brightWhite' , color: 'blue' } } , styles ) ;
	
	redrawStatusBar() ;
}



var hintTimeout ;
var hintIndex = 0 ;
var hints = [
	'CTRL-C: Quit' ,
	
	'Arrow keys: Move the cursor' ,
	'CTRL + Arrow keys or SHIFT + Arrow keys: Move the cursor to the boundaries' ,
	
	'F1: Next hint' ,
	
	'F5: Previous foreground color' ,
	'F6: Next foreground color' ,
	'F7: Previous background color' ,
	'F8: Next background color' ,
	
	'CTRL-B: Turn bold on/off' ,
	'CTRL-D: Turn dim on/off' ,
	'CTRL-T: Turn italic on/off' ,
	'CTRL-U: Turn underline on/off' ,
	'CTRL-K: Turn blink on/off' ,
	'CTRL-N: Turn inverse on/off' ,
	'CTRL-P: Turn hidden on/off' ,
	'CTRL-Y: Turn strike on/off'
] ;

function randomHint( forcedHint )
{
	var hint ;
	
	if ( hintTimeout ) { clearTimeout( hintTimeout ) ; }
	
	hintBar.clear( { attr: { bgColor: 'brightWhite' } , char: ' ' } ) ;
	
	if ( typeof forcedHint === 'string' )
	{
		hintIndex = 0 ;
		hint = forcedHint ;
	}
	else if ( typeof forcedHint === 'number' )
	{
		hintIndex = forcedHint ;
		
		if ( hintIndex < 0 ) { hintIndex = hints.length - 1 ; }
		else if ( hintIndex >= hints.length ) { hintIndex = 0 ; }
		
		hint = hints[ hintIndex ] ;
	}
	else
	{
		hintIndex = Math.floor( Math.random() * hints.length ) ;
		hint = hints[ hintIndex ] ;
	}
	
	hintBar.put( { x: 0 , y: 0 , attr: { bgColor: 'brightWhite' , color: 'green' } } , hint ) ;
	
	redrawHintBar() ;
	hintTimeout = setTimeout( randomHint , 5000 ) ;
}



function inputs( key )
{
	if ( key.length === 1 )
	{
		// This is a normal printable char
		canvas.put( { attr: editingMode.attr } , key ) ;
		redrawCanvas() ;
		return ;
	}
	
	
	// This is a special key
	switch ( key )
	{
		// Interupt keys
		case 'CTRL_C':
			terminate() ;
			break ;
		
		// Save the file
		case 'CTRL_S':
			save() ;
			break ;
		
		// Move keys
		case 'UP' :
			canvas.cy -- ;
			if ( canvas.cy < 0 ) { canvas.cy = 0 ; }
			refreshCursorPosition() ;
			break ;
		case 'CTRL_UP' :
		case 'SHIFT_UP' :
			canvas.cy = 0 ;
			refreshCursorPosition() ;
			break ;
		case 'DOWN' :
			canvas.cy ++ ;
			if ( canvas.cy >= canvas.height ) { canvas.cy = canvas.height - 1 ; }
			refreshCursorPosition() ;
			break ;
		case 'ENTER' :
			canvas.cx = 0 ;
			canvas.cy ++ ;
			if ( canvas.cy >= canvas.height ) { canvas.cy = canvas.height - 1 ; }
			refreshCursorPosition() ;
			break ;
		case 'CTRL_DOWN' :
		case 'SHIFT_DOWN' :
			canvas.cy = canvas.height - 1 ;
			refreshCursorPosition() ;
			break ;
		case 'LEFT' :
			canvas.cx -- ;
			if ( canvas.cx < 0 ) { canvas.cx = 0 ; }
			refreshCursorPosition() ;
			break ;
		case 'CTRL_LEFT' :
		case 'SHIFT_LEFT' :
			canvas.cx = 0 ;
			refreshCursorPosition() ;
			break ;
		case 'RIGHT' :
			canvas.cx ++ ;
			if ( canvas.cx >= canvas.width ) { canvas.cx = canvas.width - 1 ; }
			refreshCursorPosition() ;
			break ;
		case 'CTRL_RIGHT' :
		case 'SHIFT_RIGHT' :
			canvas.cx = canvas.width - 1 ;
			refreshCursorPosition() ;
			break ;
		
		// Color keys
		case 'F5':
			editingMode.attr.color -- ;
			if ( editingMode.attr.color < 0 ) { editingMode.attr.color = 255 ; }
			refreshStatusBar() ;
			break ;
		case 'F6':
			editingMode.attr.color ++ ;
			if ( editingMode.attr.color > 255 ) { editingMode.attr.color = 0 ; }
			refreshStatusBar() ;
			break ;
		case 'F7':
			editingMode.attr.bgColor -- ;
			if ( editingMode.attr.bgColor < 0 ) { editingMode.attr.bgColor = 255 ; }
			refreshStatusBar() ;
			break ;
		case 'F8':
			editingMode.attr.bgColor ++ ;
			if ( editingMode.attr.bgColor > 255 ) { editingMode.attr.bgColor = 0 ; }
			refreshStatusBar() ;
			break ;
		
		// Styles keys
		case 'CTRL_B':
			editingMode.attr.bold = ! editingMode.attr.bold ;
			refreshStatusBar() ;
			break ;
		case 'CTRL_D':
			editingMode.attr.dim = ! editingMode.attr.dim ;
			refreshStatusBar() ;
			break ;
		case 'CTRL_T':
			editingMode.attr.italic = ! editingMode.attr.italic ;
			refreshStatusBar() ;
			break ;
		case 'CTRL_U':
			editingMode.attr.underline = ! editingMode.attr.underline ;
			refreshStatusBar() ;
			break ;
		case 'CTRL_K':
			editingMode.attr.blink = ! editingMode.attr.blink ;
			refreshStatusBar() ;
			break ;
		case 'CTRL_N':
			editingMode.attr.inverse = ! editingMode.attr.inverse ;
			refreshStatusBar() ;
			break ;
		case 'CTRL_P':
			editingMode.attr.hidden = ! editingMode.attr.hidden ;
			refreshStatusBar() ;
			break ;
		case 'CTRL_Y':
			editingMode.attr.strike = ! editingMode.attr.strike ;
			refreshStatusBar() ;
			break ;
		
		// Misc
		case 'F1':
		case 'CTRL_F1':
		case 'SHIFT_F1':
			// Next hint
			randomHint( hintIndex + 1 ) ;
			break ;
	}
}



init( function() {
} ) ;
