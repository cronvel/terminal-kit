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
var ScreenBuffer = termkit.ScreenBuffer ;



var filepath ;
var viewport , statusBar , hintBar , canvas , background ;



var MODE_CHARS = 0 ;
//var MODE_TRANSPARENCY = 1 ;
var MODE_LENGTH = 1 ;

var editingMode = {
	mode: MODE_CHARS ,
	background : {
		char: ' ' ,
		attr: {
			bgColor: 13 ,
			color: 15
		}
	} ,
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
			term.blue( 'Usage is:\n' )
				.brightCyan( './' + path.basename( process.argv[ 1 ] ) )
				.cyan.italic( ' <screen-buffer file>' )( '\n\n' ) ;
			
			process.exit( 1 ) ;
		}
		
		filepath = process.argv[ 2 ] ;
		
		viewport = ScreenBuffer.create( {
			dst: term ,
			width: term.width ,
			height: term.height ,
			y: 1
		} ) ;
		
		background = ScreenBuffer.create( {
			dst: viewport ,
			width: term.width ,
			height: term.height - 2 ,
			y: 1 ,
			noClear: true
		} ) ;
		background.clear( editingMode.background.attr ) ;
		
		statusBar = ScreenBuffer.create( {
			dst: viewport ,
			width: viewport.width ,
			height: 1 ,
			noClear: true
		} ) ;
		statusBar.clear( { attr: { bgColor: 'brightWhite' } , char: ' ' } ) ;
		
		hintBar = ScreenBuffer.create( {
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
		canvas = ScreenBuffer.create( {
			dst: viewport ,
			width: viewport.width ,
			height: viewport.height - 2 ,
			y: 1
		} ) ;
		
		return ;
	}
	
	// If something is bad, let it crash, do not handle the exception here
	canvas = ScreenBuffer.loadSync( filepath ) ;
	
	canvas.dst = viewport ;
	canvas.y = 1 ;
	/*
	canvas = ScreenBuffer.create( {
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
		randomHint( "File '" + filepath + "' saved!" , 'red' , 'yellow' ) ;
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
	background.draw() ;
	canvas.draw( { transparency: true } ) ;
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



function refreshBackground()
{
	background.clear( editingMode.background ) ;
	redrawCanvas() ;
}



function refreshStatusBar()
{
	var mode = '' ;
	var styles = [] ;
	var keyOptions = { attr: { bgColor: 'brightWhite' , color: 'green' } } ;
	var valueOptions = { attr: { bgColor: 'brightWhite' , color: 'blue' } } ;
	
	statusBar.clear( { attr: keyOptions.attr , char: ' ' } ) ;
	statusBar.cx = statusBar.cy = 0 ;
	
	statusBar.put( keyOptions , 'Size: ' ) ;
	statusBar.put( valueOptions , '%dx%d' , canvas.width , canvas.height ) ;
	
	/*
	statusBar.put( keyOptions , 'Ed. Mode: ' ) ;
	switch ( editingMode.mode )
	{
		case MODE_CHARS :
			mode = 'characters' ;
			break ;
		case MODE_TRANSPARENCY :
			mode = 'transparency' ;
			break ;
	}
	statusBar.put( valueOptions , mode ) ;
	*/
	
	statusBar.put( keyOptions , '  fg: ' ) ;
	statusBar.put( valueOptions , editingMode.attr.color ) ;
	statusBar.put( { attr: { bgColor: editingMode.attr.color } } , ' ' ) ;
	
	statusBar.put( keyOptions , '  bg: ' ) ;
	statusBar.put( valueOptions , editingMode.attr.bgColor ) ;
	statusBar.put( { attr: { bgColor: editingMode.attr.bgColor } } , ' ' ) ;
	
	if ( editingMode.attr.fgTransparency ) { styles.push( 'f-trans' ) ; }
	if ( editingMode.attr.bgTransparency ) { styles.push( 'b-trans' ) ; }
	if ( editingMode.attr.styleTransparency ) { styles.push( 's-trans' ) ; }
	if ( editingMode.attr.charTransparency ) { styles.push( 'c-trans' ) ; }
	if ( editingMode.attr.bold ) { styles.push( 'bold' ) ; }
	if ( editingMode.attr.dim ) { styles.push( 'dim' ) ; }
	if ( editingMode.attr.italic ) { styles.push( 'ita' ) ; }
	if ( editingMode.attr.underline ) { styles.push( 'under' ) ; }
	if ( editingMode.attr.blink ) { styles.push( 'blink' ) ; }
	if ( editingMode.attr.inverse ) { styles.push( 'inv' ) ; }
	if ( editingMode.attr.hidden ) { styles.push( 'hidden' ) ; }
	if ( editingMode.attr.strike ) { styles.push( 'strike' ) ; }
	
	if ( styles.length ) { styles = styles.join( '|' ) ; }
	else { styles = 'none' ; }
	
	statusBar.put( keyOptions , '  styles: ' ) ;
	statusBar.put( valueOptions , styles ) ;
	
	statusBar.put( keyOptions , '  background: ' ) ;
	statusBar.put( valueOptions , editingMode.background.attr.color ) ;
	statusBar.put( { attr: { bgColor: editingMode.background.attr.color } } , ' ' ) ;
	statusBar.put( valueOptions , editingMode.background.attr.bgColor ) ;
	statusBar.put( { attr: { bgColor: editingMode.background.attr.bgColor } } , ' ' ) ;
	statusBar.put( valueOptions , editingMode.background.char ) ;
	
	redrawStatusBar() ;
}



var hintTimeout ;
var hintIndex = 0 ;
var hints = [
	'CTRL-C: Quit' ,
	'CTRL-S: Save file' ,
	
	'Arrow: Move the cursor' ,
	//'CTRL-Arrow, SHIFT-Arrow: Move the cursor to the boundaries' ,
	//'TAB: switch editing mode' ,
	
	'F1: Next hint' ,
	
	'F5: Previous foreground color' ,
	'F6: Next foreground color' ,
	'F7: Previous background color' ,
	'F8: Next background color' ,
	'F9: Previous editor\'s transparency color' ,
	'F10: Next editor\'s transparency color' ,
	
	'ALT-T: Toggle all transparencies' ,
	'ALT-F: Toggle foreground transparency' ,
	'ALT-G: Toggle background transparency' ,
	'ALT-Y: Toggle style transparency' ,
	'ALT-C: Toggle character transparency' ,
	
	'ALT-B: Toggle bold' ,
	'ALT-D: Toggle dim' ,
	'ALT-I: Toggle italic' ,
	'ALT-U: Toggle underline' ,
	'ALT-K: Toggle blink' ,
	'ALT-N: Toggle inverse' ,
	'ALT-H: Toggle hidden' ,
	'ALT-S: Toggle strike'
] ;

function randomHint( forcedHint , color , bgColor )
{
	var hint ;
	
	if ( hintTimeout ) { clearTimeout( hintTimeout ) ; }
	
	if ( color === undefined ) { color = 'green' ; }
	if ( bgColor === undefined ) { bgColor = 'brightWhite' ; }
	
	hintBar.clear( { attr: { bgColor: bgColor } , char: ' ' } ) ;
	
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
	
	hintBar.put( { x: 0 , y: 0 , attr: { bgColor: bgColor , color: color } } , hint ) ;
	
	redrawHintBar() ;
	hintTimeout = setTimeout( randomHint , 5000 ) ;
}



function inputs( key )
{
	var rect ;
	
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
		
		// Switch mode
		case 'TAB':
			editingMode.mode = ( editingMode.mode + 1 ) % MODE_LENGTH ;
			refreshStatusBar() ;
			break ;
		
		// Move keys
		case 'UP' :
			canvas.cy -- ;
			if ( canvas.cy < 0 ) { canvas.cy = 0 ; }
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
		case 'LEFT' :
			canvas.cx -- ;
			if ( canvas.cx < 0 ) { canvas.cx = 0 ; }
			refreshCursorPosition() ;
			break ;
		case 'RIGHT' :
			canvas.cx ++ ;
			if ( canvas.cx >= canvas.width ) { canvas.cx = canvas.width - 1 ; }
			refreshCursorPosition() ;
			break ;
		
		// Resize keys
		case 'SHIFT_UP' :
			canvas.cy = 0 ;
			refreshCursorPosition() ;
			break ;
		case 'SHIFT_DOWN' :
			canvas.cy = canvas.height - 1 ;
			refreshCursorPosition() ;
			break ;
		case 'SHIFT_LEFT' :
			canvas.cx = 0 ;
			refreshCursorPosition() ;
			break ;
		case 'SHIFT_RIGHT' :
			canvas.cx = canvas.width - 1 ;
			refreshCursorPosition() ;
			break ;
		
		case 'CTRL_UP' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.ymax -- ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
			break ;
		case 'CTRL_DOWN' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.ymax ++ ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
			break ;
		case 'CTRL_LEFT' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.xmax -- ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
			break ;
		case 'CTRL_RIGHT' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.xmax ++ ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
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
		case 'F9':
			editingMode.transparencyBgColor -- ;
			if ( editingMode.transparencyBgColor < 0 ) { editingMode.transparencyBgColor = 255 ; }
			refreshStatusBar() ;
			refreshBackground() ;
			break ;
		case 'F10':
			editingMode.transparencyBgColor ++ ;
			if ( editingMode.transparencyBgColor > 255 ) { editingMode.transparencyBgColor = 0 ; }
			refreshStatusBar() ;
			refreshBackground() ;
			break ;
		
		// Blending keys
		case 'ALT_T':
			editingMode.transparency = ! editingMode.transparency ;
			editingMode.attr.fgTransparency = editingMode.attr.bgTransparency =
				editingMode.attr.styleTransparency = editingMode.attr.charTransparency = 
				editingMode.transparency ;
			refreshStatusBar() ;
			break ;
		case 'ALT_F':
			editingMode.attr.fgTransparency = ! editingMode.attr.fgTransparency ;
			refreshStatusBar() ;
			break ;
		case 'ALT_G':
			editingMode.attr.bgTransparency = ! editingMode.attr.bgTransparency ;
			refreshStatusBar() ;
			break ;
		case 'ALT_Y':
			editingMode.attr.styleTransparency = ! editingMode.attr.styleTransparency ;
			refreshStatusBar() ;
			break ;
		case 'ALT_C':
			editingMode.attr.charTransparency = ! editingMode.attr.charTransparency ;
			refreshStatusBar() ;
			break ;
		
		// Styles keys
		case 'ALT_B':
			editingMode.attr.bold = ! editingMode.attr.bold ;
			refreshStatusBar() ;
			break ;
		case 'ALT_D':
			editingMode.attr.dim = ! editingMode.attr.dim ;
			refreshStatusBar() ;
			break ;
		case 'ALT_I':
			editingMode.attr.italic = ! editingMode.attr.italic ;
			refreshStatusBar() ;
			break ;
		case 'ALT_U':
			editingMode.attr.underline = ! editingMode.attr.underline ;
			refreshStatusBar() ;
			break ;
		case 'ALT_K':
			editingMode.attr.blink = ! editingMode.attr.blink ;
			refreshStatusBar() ;
			break ;
		case 'ALT_N':
			editingMode.attr.inverse = ! editingMode.attr.inverse ;
			refreshStatusBar() ;
			break ;
		case 'ALT_H':
			editingMode.attr.hidden = ! editingMode.attr.hidden ;
			refreshStatusBar() ;
			break ;
		case 'ALT_S':
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


