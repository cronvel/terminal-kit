#!/usr/bin/env node
/*
	Terminal Kit
	
	Copyright (c) 2009 - 2017 Cédric Ronvel
	
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



var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;
var path = require( 'path' ) ;



if ( process.argv.length <= 2 )
{
	term.magenta( "Usage is: ./%s <file-path>\n" , path.basename( process.argv[ 1 ] ) ) ;
	process.exit( 1 ) ;
}



var screen , image , filler = { attr: {
	r: 0 ,
	g: 0 ,
	b: 0 ,
	bgR: 0 ,
	bgG: 0 ,
	bgB: 0 ,
} } ;



termkit.ScreenBufferHD.loadImage( process.argv[ 2 ] , function( error , image_ ) {
	
	image = image_ ;
	
	if ( error )
	{
		term.red( "%E\n" , error ) ;
		process.exit( 1 ) ;
	}
	
	screen = termkit.ScreenBufferHD.create( { dst: term , height: term.height - 1 , noFill: true } ) ;
	screen.y = 2 ;
	
	image.dst = screen ;
	
	term.clear() ;
	term.grabInput() ;
	term.hideCursor() ;

	term.on( 'key' , function( key , matches , data ) {
		
		switch ( key )
		{
			case 'UP' :
				image.y ++ ;
				redraw() ;
				break ;
			case 'DOWN' :
				image.y -- ;
				redraw() ;
				break ;
			case 'LEFT' :
				image.x ++ ;
				redraw() ;
				break ;
			case 'RIGHT' :
				image.x -- ;
				redraw() ;
				break ;
			case 'CTRL_C' :
				terminate() ;
				break ;
		}
	} ) ;
	
	redraw() ;
	term.moveTo( 1 , 1 ).bgWhite.blue.eraseLineAfter( "Arrows keys: move   CTRL-C: quit" ) ;
} ) ;



function redraw()
{
	screen.fill( filler ) ;
	image.draw() ;
	screen.draw( { delta: true } ) ;
}



function terminate()
{
	term.hideCursor( false ) ;
	//term.applicationKeypad( false ) ;
	term( '\n' ) ;
	term.processExit() ;
} 

