/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2015 Cédric Ronvel 
	
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



// Load modules
//var string = require( 'string-kit' ) ;



/*
	progressBar( options )
		* options `object` of options, all of them are OPTIONAL, where:
			* width: `number` the total width of the progress bar, default to the max available width
			* percent: `boolean` if true, it shows the progress in percent alongside with the progress bar
			* eta: `boolean` if true, it shows the Estimated Time of Arrival alongside with the progress bar
			* barStyle `function` the style of the progress bar items, default to `term.cyan`
			* barBracketStyle `function` the style of the progress bar bracket character, default to options.barStyle if given
			  or `term.blue`
			* percentStyle `function` the style of percent value string, default to `term.yellow`
			* etaStyle `function` the style of the ETA display, default to `term.bold`
			* barChar `string` the char used for the bar, default to '='
			* barHeadChar `string` the char used for the bar, default to '>'
			* maxRefreshTime `number` the maximum time between two refresh in ms, default to 500ms
*/
module.exports = function progressBar( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var self = this , controler = {} , progress , ready = false ,
		width , y , startX , endX ,
		wheel , wheelCounter = 0 ,
		updateCount = 0 , progressUpdateCount = 0 , lastUpdateTime ,
		startingTime , redrawTimer ,
		etaStartingTime , lastEta ;
	
	etaStartingTime = startingTime = ( new Date() ).getTime() ;
	
	wheel = [ '|' , '/' , '-' , '\\' ] ;
	
	width = options.width || this.width ;
	
	if ( ! options.barBracketStyle )
	{
		if ( options.barStyle ) { options.barBracketStyle = options.barStyle ; }
		else { options.barBracketStyle = this.blue ; }
	}
	
	if ( ! options.barStyle ) { options.barStyle = this.cyan ; }
	if ( ! options.percentStyle ) { options.percentStyle = this.yellow ; }
	if ( ! options.etaStyle ) { options.etaStyle = this.bold ; }
	
	if ( ! options.barChar ) { options.barChar = '=' ; }
	else { options.barChar = options.barChar[ 0 ] ; }
	
	if ( ! options.barHeadChar ) { options.barHeadChar = '>' ; }
	else { options.barHeadChar = options.barHeadChar[ 0 ] ; }
	
	if ( typeof options.maxRefreshTime !== 'number' ) { options.maxRefreshTime = 500 ; }
	
	
	var etaFiller = '           ' ;	// 11 chars
	
	// This is a naive ETA for instance...
	var etaString = function etaString( updated )
	{
		var eta = '' , elapsedTime , elapsedEtaTime , remainingTime ,
			averageUpdateDelay , averageUpdateProgress , lastUpdateElapsedTime , fakeProgress ;
		
		if ( progress > 0 )
		{
			elapsedTime = ( new Date() ).getTime() - startingTime ;
			elapsedEtaTime = ( new Date() ).getTime() - etaStartingTime ;
			
			if ( ! updated && progressUpdateCount > 1 )
			{
				lastUpdateElapsedTime = ( new Date() ).getTime() - lastUpdateTime ;
				averageUpdateDelay = elapsedEtaTime / progressUpdateCount ;
				averageUpdateProgress = progress / progressUpdateCount ;
				
				//console.log( '\n' , elapsedEtaTime , lastUpdateElapsedTime , averageUpdateDelay , averageUpdateProgress , '\n' ) ;
				
				// Do not update ETA if it's not an update, except if update time is too long
				if ( lastUpdateElapsedTime < averageUpdateDelay )
				{
					fakeProgress = progress + averageUpdateProgress * lastUpdateElapsedTime / averageUpdateDelay ;
				}
				else
				{
					fakeProgress = progress + averageUpdateProgress ;
				}
				
				if ( fakeProgress > 0.99 ) { fakeProgress = 0.99 ; }
			}
			else
			{
				fakeProgress = progress ;
			}
			
			remainingTime = elapsedEtaTime * ( ( 1 - fakeProgress ) / fakeProgress ) / 1000 ;
			
			eta = ' in ' ;
			
			if ( remainingTime < 10 ) { eta += Math.round( remainingTime * 10 ) / 10 + 's' ; }
			else if ( remainingTime < 120 ) { eta += Math.round( remainingTime ) + 's' ; }
			else if ( remainingTime < 7200 ) { eta += Math.round( remainingTime / 60 ) + 'min' ; }
			else if ( remainingTime < 172800 ) { eta += Math.round( remainingTime / 3600 ) + 'hours' ; }
			else if ( remainingTime < 31536000 ) { eta += Math.round( remainingTime / 86400 ) + 'days' ; }
			else { eta = 'few years' ; }
		}
		else
		{
			etaStartingTime = ( new Date() ).getTime() ;
		}
		
		eta = ( eta + etaFiller ).slice( 0 , etaFiller.length ) ;
		lastEta = eta ;
		
		return eta ;
	} ;
	
	
	
	var redraw = function redraw( updated ) {
		
		var i ,
			innerBarSize , progressSize , voidSize ,
			progressBar = '' , voidBar = '' , percent = '' , eta ;
		
		if ( ! ready ) { return ; }
		
		self.saveCursor() ;
		self.moveTo( startX , y ) ;
		
		//self.noFormat( Math.floor( progress * 100 ) + '%' ) ;
		
		innerBarSize = width - 2 ;
		
		if ( options.percent )
		{
			innerBarSize -= 4 ;
			percent = ( '   ' + Math.round( ( progress || 0 ) * 100 ) + '%' ).slice( -4 ) ;
		}
		
		if ( options.eta )
		{
			// This is a naive ETA for instance...
			eta = etaString( updated ) ;
			innerBarSize -= eta.length ;
		}
		
		progressSize = progress === undefined ? 1 : Math.round( innerBarSize * progress ) ;
		voidSize = innerBarSize - progressSize ;
		
		if ( progressSize )
		{
			if ( progress === undefined )
			{
				progressBar = wheel[ ++ wheelCounter % wheel.length ] ;
			}
			else
			{
				i = progressSize - 1 ;
				while ( i -- ) { progressBar += options.barChar ; }
				progressBar += options.barHeadChar ;
			}
		}
		
		i = voidSize ;
		while ( i -- ) { voidBar += ' ' ; }
		
		if ( percent ) { options.percentStyle( percent ) ; }
		
		if ( progress === undefined ) { self( ' ' ) ; }
		else { options.barBracketStyle( '[' ) ; }
		
		options.barStyle( progressBar ) ;
		self( voidBar ) ;
		
		if ( progress === undefined ) { self( ' ' ) ; }
		else { options.barBracketStyle( ']' ) ; }
		
		options.etaStyle( eta ) ;
		
		self.restoreCursor() ;
		
		if ( redrawTimer ) { clearTimeout( redrawTimer ) ; }
		redrawTimer = setTimeout( redraw , options.maxRefreshTime ) ;
	} ;
	
	
	// Get the cursor location before getting started
	
	this.getCursorLocation( function( error , x_ , y_ ) {
		startX = x_ ;
		endX = Math.min( x_ + width , self.width ) ;
		y = y_ ;
		width = endX - startX ;
		ready = true ;
		redraw() ;
	} ) ;
	
	
	controler.update = function update( value ) {
		
		if ( typeof value !== 'number' )
		{
			value = undefined ;
		}
		else
		{
			if ( value > 1 ) { value = 1 ; }
			else if ( value < 0 ) { value = 0 ; }
			
			if ( value > 0 ) { progressUpdateCount ++ ; }
		}
		
		// Not sure if it is a good thing to let the user set it to a value that is lesser than the current one
		
		progress = value ;
		lastUpdateTime = ( new Date() ).getTime() ;
		updateCount ++ ;
		
		redraw( true ) ;
	} ;
	
	
	return controler ;
} ;



