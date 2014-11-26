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



var fs = require( 'fs' ) ;
var termkit = require( '../lib/terminal.js' ) ;
var term ;



// Buffers
var viewport , sprites = {} ;



function init( callback )
{
	termkit.getDetectedTerminal( function( error , detectedTerm ) {
		
		if ( error ) { throw new Error( 'Cannot detect terminal.' ) ; }
		
		term = detectedTerm ;
		
		viewport = termkit.ScreenBuffer.create( {
			target: term ,
			width: Math.min( term.width ) ,
			height: Math.min( term.height - 1 ) ,
			y: 2
		} ) ;
		
		createBackground() ;
		createSpaceship() ;
		
		//term.fullscreen() ;
		term.moveTo.eraseLine.bgWhite.green( 1 , 1 , 'Arrow keys: move the ship - CTRL-C: Quit\n' ) ;
		term.hideCursor() ;
		term.grabInput() ;
		term.on( 'key' , inputs ) ;
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
	sprites.background = termkit.ScreenBuffer.create( { width: viewport.width * 5 , height: viewport.height } ) ;
	createBackgroundTrails( sprites.background.width * sprites.background.height * 0.01 ) ;
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
			sprites.background.put( {
				x: ( x + j ) % sprites.background.width ,
				y: y ,
				attr: { color: 8 }
			} , '-' ) ;
		}
	}
}



function createSpaceship()
{
	sprites.spaceship = termkit.ScreenBuffer.createFromDataString(
		{ attr: { color: 'cyan' } , transparencyChar: '#' } ,
		fs.readFileSync( './spaceship1.txt' )
	) ;
	sprites.spaceship.x = 3 ;
	sprites.spaceship.y = Math.floor( viewport.height / 2 - sprites.spaceship.height / 2 ) ;
}



function inputs( key )
{
	switch ( key )
	{
		case 'UP' :
			sprites.spaceship.y -- ;
			break ;
		case 'DOWN' :
			sprites.spaceship.y ++ ;
			break ;
		case 'LEFT' :
			sprites.spaceship.x -- ;
			break ;
		case 'RIGHT' :
			sprites.spaceship.x ++ ;
			break ;
		case 'CTRL_C':
			terminate() ;
			break ;
	}
}



function nextPosition()
{
	sprites.background.x -- ;
	if ( sprites.background.x <= - sprites.background.width ) { sprites.background.x = 0 ; }
}



function draw()
{
	sprites.background.draw( { target: viewport } ) ;
	sprites.spaceship.draw( { target: viewport , transparency: true } ) ;
	viewport.draw() ;
	//sprites.background.dumpChars() ;
}



function animate()
{
	draw() ;
	nextPosition() ;
	setTimeout( animate , 50 ) ;
}



init( function() {
	animate() ;
} ) ;


