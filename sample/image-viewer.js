#!/usr/bin/env node
/*
	Terminal Kit
	
	Copyright (c) 2009 - 2018 Cédric Ronvel
	
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
	term.magenta( "Usage is: ./%s <file-path> [-m] [<max-scale>]\n" , path.basename( process.argv[ 1 ] ) ) ;
	term.gray( "-m: load inside a ScreenBuffer and interactively move the image\n" ) ;
	process.exit( 1 ) ;
}



var screen , image , filler = { attr: {
	// 8-bit
	color: 'black' ,
	bgColor: 'black' ,
	// 32-bit
	r: 0 ,
	g: 0 ,
	b: 0 ,
	bgR: 0 ,
	bgG: 0 ,
	bgB: 0 ,
} } ;



var SB = term.support['24bitsColors'] ? termkit.ScreenBufferHD : termkit.ScreenBuffer ;
var url = process.argv[ 2 ] ;
var move ;
var maxScale ;



// Can't depend on minimist just for a sample code, so we had to parse the command line by ourself
if ( process.argv[ 3 ] === '-m' )
{
	move = true ;
	maxScale = process.argv[ 4 ] || 2 ;
}
else
{
	if ( process.argv[ 4 ] === '-m' )
	{
		move = true ;
		maxScale = process.argv[ 3 ] || 2 ;
	}
	else
	{
		move = false ;
		maxScale = process.argv[ 3 ] || 1 ;
	}
}



if ( ! move )
{
	term.drawImage( url , {
		shrink: {
			width: term.width * maxScale ,
			height: ( term.height - 1 ) * 2 * maxScale
		}
	} ) ;
	
	return ;
}



async function loadImage() {
	image = await SB.loadImage(
		url ,
		{
			terminal: term ,
			shrink: { width: term.width * maxScale , height: ( term.height - 1 ) * 2 * maxScale } 
		}
	) ;
	
	screen = SB.create( { dst: term , height: term.height - 1 , noFill: true } ) ;
	screen.y = 2 ;
	
	image.dst = screen ;
	
	term.clear() ;
	term.grabInput() ;
	term.hideCursor() ;

	term.on( 'key' , ( key , matches , data ) => {
		
		var offset , stats ;
		
		switch ( key )
		{
			case 'UP' :
				offset = Math.round( term.height / 20 ) ;
				screen.vScroll( offset , true ) ;	// Perform term.scrollDown()
				image.y += offset ;
				image.draw() ;
				stats = screen.draw( { delta: true } ) ;	// This only redraws new lines on the top
				//console.error( stats ) ;
				break ;
			case 'DOWN' :
				offset = Math.round( term.height / 20 ) ;
				screen.vScroll( - offset , true ) ;	// Perform term.scrollUp()
				image.y += - offset ;
				image.draw() ;
				stats = screen.draw( { delta: true } ) ;	// This only redraws new lines on the bottom
				//console.error( stats ) ;
				break ;
			case 'LEFT' :
				offset = Math.round( term.width / 20 ) ;
				image.x += offset ;
				redraw() ;
				break ;
			case 'RIGHT' :
				offset = Math.round( term.width / 20 ) ;
				image.x -= offset ;
				redraw() ;
				break ;
			case 'q' :
			case 'CTRL_C' :
				terminate() ;
				break ;
		}
	} ) ;
	
	redraw() ;
	term.moveTo( 1 , 1 ).bgWhite.blue.eraseLineAfter( "Arrows keys: move   Q/CTRL-C: quit" ) ;
}


function redraw()
{
	var stats ;
	
	screen.fill( filler ) ;
	image.draw() ;
	stats = screen.draw( { delta: true } ) ;
	//console.error( stats ) ;
}



function terminate()
{
	term.hideCursor( false ) ;
	//term.applicationKeypad( false ) ;
	term.styleReset() ;
	term.resetScrollingRegion() ;
	term.moveTo( term.width , term.height ) ;
	term( '\n' ) ;
	term.processExit() ;
} 



loadImage() ;

