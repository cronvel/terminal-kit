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
var tree = require( 'tree-kit' ) ;
var termkit = require( '../lib/terminal.js' ) ;
var term ;
var ScreenBuffer = termkit.ScreenBuffer ;



var filepath ;
var viewport , statusBar , hintBar , canvas , background ;



var editingMode = {
	background : {
		char: ' ' ,
		attr: {
			bgColor: 8 ,
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
			width: viewport.width ,
			height: viewport.height - 2 ,
			y: 1 ,
			noClear: true
		} ) ;
		background.clear( editingMode.background ) ;
		
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



function fill( options )
{
	var fillBuffer = ScreenBuffer.create( {
		dst: canvas ,
		width: canvas.width ,
		height: canvas.height ,
		noClear: true
	} ) ;
	
	//console.error( options ) ;
	
	fillBuffer.clear( options ) ;
	fillBuffer.draw( { blending: true } ) ;
	//fillBuffer.draw() ;
}



function refreshCursorPosition()
{
	term.moveTo( viewport.x + canvas.x + canvas.cx , viewport.y + canvas.y + canvas.cy ) ;
}



function redrawCanvas()
{
	background.draw() ;
	canvas.draw( { blending: true } ) ;
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



function stylesString( attr )
{
	var styles = [] ;
	
	if ( attr.bold ) { styles.push( 'bold' ) ; }
	if ( attr.dim ) { styles.push( 'dim' ) ; }
	if ( attr.italic ) { styles.push( 'ita' ) ; }
	if ( attr.underline ) { styles.push( 'under' ) ; }
	if ( attr.blink ) { styles.push( 'blink' ) ; }
	if ( attr.inverse ) { styles.push( 'inv' ) ; }
	if ( attr.hidden ) { styles.push( 'hidden' ) ; }
	if ( attr.strike ) { styles.push( 'strike' ) ; }
	
	if ( attr.fgTransparency ) { styles.push( 'f-trans' ) ; }
	if ( attr.bgTransparency ) { styles.push( 'b-trans' ) ; }
	if ( attr.styleTransparency ) { styles.push( 's-trans' ) ; }
	if ( attr.charTransparency ) { styles.push( 'c-trans' ) ; }
	
	if ( styles.length ) { styles = styles.join( '|' ) ; }
	else { styles = 'none' ; }
	
	return styles ;
}



function refreshStatusBar()
{
	var styles = '' ;
	var keyOptions = { attr: { bgColor: 'brightWhite' , color: 'green' } } ;
	var valueOptions = { attr: { bgColor: 'brightWhite' , color: 'blue' } } ;
	var cursorCell = canvas.get() ;
	
	statusBar.clear( { attr: keyOptions.attr , char: ' ' } ) ;
	statusBar.cx = statusBar.cy = 0 ;
	
	statusBar.put( keyOptions , 'Size: ' ) ;
	statusBar.put( valueOptions , '%dx%d' , canvas.width , canvas.height ) ;
	
	
	statusBar.put( keyOptions , '  Edit: ' ) ;
	statusBar.put( valueOptions , editingMode.attr.color ) ;
	statusBar.put( { attr: { bgColor: editingMode.attr.color } } , ' ' ) ;
	statusBar.put( valueOptions , editingMode.attr.bgColor ) ;
	statusBar.put( { attr: { bgColor: editingMode.attr.bgColor } } , ' ' ) ;
	statusBar.put( valueOptions , stylesString( editingMode.attr ) ) ;
	
	
	statusBar.put( keyOptions , '  background: ' ) ;
	statusBar.put( valueOptions , editingMode.background.attr.color ) ;
	statusBar.put( { attr: { bgColor: editingMode.background.attr.color } } , ' ' ) ;
	statusBar.put( valueOptions , editingMode.background.attr.bgColor ) ;
	statusBar.put( { attr: { bgColor: editingMode.background.attr.bgColor } } , ' ' ) ;
	statusBar.put( valueOptions , editingMode.background.char ) ;
	
	
	statusBar.put( keyOptions , '  cursor: ' ) ;
	statusBar.put( valueOptions , cursorCell.attr.color ) ;
	statusBar.put( { attr: { bgColor: cursorCell.attr.color } } , ' ' ) ;
	statusBar.put( valueOptions , cursorCell.attr.bgColor ) ;
	statusBar.put( { attr: { bgColor: cursorCell.attr.bgColor } } , ' ' ) ;
	statusBar.put( valueOptions , cursorCell.char ) ;
	statusBar.put( valueOptions , stylesString( cursorCell.attr ) ) ;
	
	redrawStatusBar() ;
}



var hintTimeout ;
var hintIndex = 0 ;
var hints = [
	'CTRL-C: Quit' ,
	'CTRL-S: Save file' ,
	
	'Arrow: Move the cursor' ,
	'CTRL-Arrow: resize the sprite by moving the lower-right corner' ,
	'SHIFT-Arrow: resize the sprite by moving the upper-left corner' ,
	
	'F1: Next hint' ,
	
	'F5: Previous foreground color' ,
	'F6: Next foreground color' ,
	'F7: Previous background color' ,
	'F8: Next background color' ,
	
	'F9: Previous editor\'s background\'s background color' ,
	'F10: Next editor\'s background\'s background color' ,
	'ALT-Q: Previous editor\'s background\'s foreground color' ,
	'ALT-W: Next editor\'s background\'s foreground color' ,
	'ALT-E: Change the editor\'s background\'s character to the next typed character' ,
	
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



var comboKey = false ;

function inputs( key )
{
	var rect ;
	
	if ( key.length === 1 )
	{
		switch ( comboKey )
		{
			case 'backgroundChar' :
				editingMode.background.char = key ;
				randomHint() ;
				refreshStatusBar() ;
				refreshBackground() ;
				comboKey = false ;
				break ;
			
			default :
				// This is a normal printable char
				canvas.put( { attr: editingMode.attr } , key ) ;
				redrawCanvas() ;
				break ;
		}
		
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
			refreshStatusBar() ;
			break ;
		case 'DOWN' :
			canvas.cy ++ ;
			if ( canvas.cy >= canvas.height ) { canvas.cy = canvas.height - 1 ; }
			refreshStatusBar() ;
			break ;
		case 'ENTER' :
			canvas.cx = 0 ;
			canvas.cy ++ ;
			if ( canvas.cy >= canvas.height ) { canvas.cy = canvas.height - 1 ; }
			refreshStatusBar() ;
			break ;
		case 'LEFT' :
			canvas.cx -- ;
			if ( canvas.cx < 0 ) { canvas.cx = 0 ; }
			refreshStatusBar() ;
			break ;
		case 'RIGHT' :
			canvas.cx ++ ;
			if ( canvas.cx >= canvas.width ) { canvas.cx = canvas.width - 1 ; }
			refreshStatusBar() ;
			break ;
		
		// Resize keys
		case 'CTRL_UP' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.set( { ymax: rect.ymax - 1 } ) ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
			break ;
		case 'CTRL_DOWN' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.set( { ymax: rect.ymax + 1 } ) ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
			break ;
		case 'CTRL_LEFT' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.set( { xmax: rect.xmax - 1 } ) ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
			break ;
		case 'CTRL_RIGHT' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.set( { xmax: rect.xmax + 1 } ) ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
			break ;
		case 'SHIFT_UP' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.set( { ymin: rect.ymin - 1 } ) ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
			break ;
		case 'SHIFT_DOWN' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.set( { ymin: rect.ymin + 1 } ) ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
			break ;
		case 'SHIFT_LEFT' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.set( { xmin: rect.xmin - 1 } ) ;
			canvas.resize( rect ) ;
			refreshStatusBar() ;
			redrawCanvas() ;
			break ;
		case 'SHIFT_RIGHT' :
			rect = ScreenBuffer.Rect.create( canvas ) ;
			rect.set( { xmin: rect.xmin + 1 } ) ;
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
		
		// Background colors & chars keys
		case 'F9':
			editingMode.background.attr.bgColor -- ;
			if ( editingMode.background.attr.bgColor < 0 ) { editingMode.background.attr.bgColor = 255 ; }
			refreshStatusBar() ;
			refreshBackground() ;
			break ;
		case 'F10':
			editingMode.background.attr.bgColor ++ ;
			if ( editingMode.background.attr.bgColor > 255 ) { editingMode.background.attr.bgColor = 0 ; }
			refreshStatusBar() ;
			refreshBackground() ;
			break ;
		case 'ALT_Q':
			editingMode.background.attr.color -- ;
			if ( editingMode.background.attr.color < 0 ) { editingMode.background.attr.color = 255 ; }
			refreshStatusBar() ;
			refreshBackground() ;
			break ;
		case 'ALT_W':
			editingMode.background.attr.color ++ ;
			if ( editingMode.background.attr.color > 255 ) { editingMode.background.attr.color = 0 ; }
			refreshStatusBar() ;
			refreshBackground() ;
			break ;
		case 'ALT_E':
			comboKey = 'backgroundChar' ;
			randomHint( "Press a key for the background character to use..." , 'red' , 'yellow' ) ;
			break ;
		
		// Fill key
		case 'ALT_SHIFT_F':
			fill( tree.extend( { deep: true } , { char: ' ' } , { attr: editingMode.attr } , { attr: {
				fgTransparency: false ,
				bgTransparency: true ,
				styleTransparency: true ,
				charTransparency: true
			} } ) ) ;
			redrawCanvas() ;
			break ;
		case 'ALT_SHIFT_G':
			fill( tree.extend( { deep: true } , editingMode , { char: ' ' , attr: {
				fgTransparency: true ,
				bgTransparency: false ,
				styleTransparency: true ,
				charTransparency: true
			} } ) ) ;
			redrawCanvas() ;
			break ;
		case 'ALT_SHIFT_Y':
			fill( tree.extend( { deep: true } , editingMode , { char: ' ' , attr: {
				fgTransparency: true ,
				bgTransparency: true ,
				styleTransparency: false ,
				charTransparency: true
			} } ) ) ;
			redrawCanvas() ;
			break ;
			
		/* Usefull? also it needs a combo of key
		case 'ALT_SHIFT_C':
			break ;
		*/
		
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


