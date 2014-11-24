#!/usr/bin/env node
/*
	The Cedric's Swiss Knife (CSK) - CSK terminal demo
	
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



var term = require( '../lib/terminal.js' ) ;



// Buffers
var viewport , sprites = {} ;



function init( callback )
{
	term.getDetectedTerminal( function( error , detectedTerm ) {
		
		if ( error ) { throw new Error( 'Cannot detect terminal.' ) ; }
		
		term = detectedTerm ;
		
		viewport = term.ScreenBuffer.create( term , {
			width: Math.min( term.width - 2 , 100 ) ,
			height: Math.min( term.height - 2 , 30 )
		} ).clear() ;
		
		createBackground() ;
		
		//term.fullscreen() ;
		term.hideCursor() ;
		term.grabInput() ;
		callback() ;
	} ) ;
}



function terminate()
{
	//term.fullscreen( false ) ;
	term.hideCursor( false ) ;
	term.grabInput( false ) ;
	term( '\n\n' ) ;
	
	setTimeout( function() {
		process.exit() ;
	} , 100 ) ;
}



function createBackground()
{
	sprites.background = term.ScreenBuffer.create( viewport , { width: 200 , height: 30 } ).clear() ;
	createBackgroundTrails( 70 ) ;
}



function createBackgroundTrails( nTrails )
{
	var i , j , x , y , length ;
	
	for ( i = 0 ; i < nTrails ; i ++ )
	{
		x = Math.floor( Math.random() * sprites.background.width ) ;
		y = Math.floor( Math.random() * sprites.background.height ) ;
		length = 3 + Math.floor( Math.random() * 8 ) ;
		
		for ( j = 0 ; j < length ; j ++ )
		{
			sprites.background.put( ( x + j ) % sprites.background.width , y , { color: 8 } , '-' ) ;
		}
	}
}



function nextPosition()
{
	sprites.background.offsetX = sprites.background.offsetX - 1 ;
}



function draw()
{
	sprites.background.draw() ;
	viewport.draw() ;
	//sprites.background.dumpChars() ;
}



var frame = 0 ;
function animate( nAnim , callback )
{
	frame ++ ;
	draw() ;
	nextPosition() ;
	if ( frame < nAnim ) { setTimeout( function() { animate( nAnim , callback ) ; } , 50 ) ; }
	else { callback() ; }
}



init( function() {
	animate( 50 , function() {
		terminate() ;
	} ) ;
} ) ;


