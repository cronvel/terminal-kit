/*
	Terminal Kit
	
	Copyright (c) 2009 - 2016 Cédric Ronvel
	
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



// Load modules
//var string = require( 'string-kit' ) ;



/*
	progressBar( options )
		* options `object` of options, all of them are OPTIONAL, where:
			* width: `number` the total width of the progress bar, default to the max available width
			* percent: `boolean` if true, it shows the progress in percent alongside with the progress bar
			* eta: `boolean` if true, it shows the Estimated Time of Arrival alongside with the progress bar
			* items `number` the number of items, turns the 'item mode' on
			* title `string` the title of the current progress bar, turns the 'title mode' on
			* barStyle `function` the style of the progress bar items, default to `term.cyan`
			* barBracketStyle `function` the style of the progress bar bracket character, default to options.barStyle if given
			  or `term.blue`
			* percentStyle `function` the style of percent value string, default to `term.yellow`
			* etaStyle `function` the style of the ETA display, default to `term.bold`
			* itemStyle `function` the style of the item display, default to `term.dim`
			* titleStyle `function` the style of the title display, default to `term.bold`
			* itemSize `number` the size of the item status, default to 33% of width
			* titleSize `number` the size of the title, default to 33% of width or title.length depending on context
			* barChar `string` the char used for the bar, default to '='
			* barHeadChar `string` the char used for the bar, default to '>'
			* maxRefreshTime `number` the maximum time between two refresh in ms, default to 500ms
			* minRefreshTime `number` the minimum time between two refresh in ms, default to 100ms
*/
module.exports = function progressBar( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var self = this , controler = {} , progress , ready = false , pause = false ,
		maxItems , itemsDone = 0 , itemsStarted = [] , itemFiller ,
		title , titleFiller ,
		width , y , startX , endX ,
		wheel , wheelCounter = 0 , itemRollCounter = 0 ,
		updateCount = 0 , progressUpdateCount = 0 ,
		lastUpdateTime , lastRedrawTime ,
		startingTime , redrawTimer ,
		etaStartingTime , lastEta , etaFiller ;
	
	etaStartingTime = startingTime = ( new Date() ).getTime() ;
	
	wheel = [ '|' , '/' , '-' , '\\' ] ;
	
	width = options.width || this.width - 1 ;
	
	if ( ! options.barBracketStyle )
	{
		if ( options.barStyle ) { options.barBracketStyle = options.barStyle ; }
		else { options.barBracketStyle = this.blue ; }
	}
	
	if ( ! options.barStyle ) { options.barStyle = this.cyan ; }
	if ( ! options.percentStyle ) { options.percentStyle = this.yellow ; }
	if ( ! options.etaStyle ) { options.etaStyle = this.bold ; }
	if ( ! options.itemStyle ) { options.itemStyle = this.dim ; }
	if ( ! options.titleStyle ) { options.titleStyle = this.bold ; }
	
	if ( ! options.barChar ) { options.barChar = '=' ; }
	else { options.barChar = options.barChar[ 0 ] ; }
	
	if ( ! options.barHeadChar ) { options.barHeadChar = '>' ; }
	else { options.barHeadChar = options.barHeadChar[ 0 ] ; }
	
	if ( typeof options.maxRefreshTime !== 'number' ) { options.maxRefreshTime = 500 ; }
	if ( typeof options.minRefreshTime !== 'number' ) { options.minRefreshTime = 100 ; }
	
	
	if ( typeof options.items === 'number' ) { maxItems = options.items ; }
	if ( maxItems && typeof options.itemSize !== 'number' ) { options.itemSize = Math.round( width / 3 ) ; }
	
	itemFiller = ' '.repeat( options.itemSize ) ;
	
	
	if ( options.title && typeof options.title === 'string' )
	{
		title = options.title ;
		
		if ( typeof options.titleSize !== 'number' )
		{
			options.titleSize = Math.round( Math.min( options.title.length + 1 , width / 3 ) ) ;
		}
	}
	
	titleFiller = ' '.repeat( options.titleSize ) ;
	
	
	etaFiller = '           ' ;	// 11 chars
	
	// This is a naive ETA for instance...
	var etaString = function etaString( updated )
	{
		var eta = '' , elapsedTime , elapsedEtaTime , remainingTime ,
			averageUpdateDelay , averageUpdateProgress , lastUpdateElapsedTime , fakeProgress ;
		
		if ( progress >= 1 )
		{
			eta = ' done' ;
		}
		else if ( progress > 0 )
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
		
		var time , itemIndex , itemName = itemFiller , titleName = titleFiller ,
			innerBarSize , progressSize , voidSize ,
			progressBar = '' , voidBar = '' , percent = '' , eta = '' ;
		
		if ( ! ready || pause ) { return ; }
		
		time = ( new Date() ).getTime() ;
		
		// If progress is >= 1, then it's finished, so we should redraw NOW (before the program eventually quit)
		if ( ( ! progress || progress < 1 ) && lastRedrawTime && time < lastRedrawTime + options.minRefreshTime )
		{
			if ( redrawTimer ) { clearTimeout( redrawTimer ) ; }
			redrawTimer = setTimeout( redraw.bind( this , updated ) , lastRedrawTime + options.minRefreshTime - time ) ;
			return ;
		}
		
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
			eta = etaString( updated ) ;
			innerBarSize -= eta.length ;
		}
		
		innerBarSize -= options.itemSize || 0 ;
		if ( maxItems )
		{
			if ( ! itemsStarted.length )
			{
				itemName = '' ;
			}
			else if ( itemsStarted.length === 1 )
			{
				itemName = ' ' + itemsStarted[ 0 ] ;
			}
			else
			{
				itemIndex = ( itemRollCounter ++ ) % itemsStarted.length ;
				itemName = ' [' + ( itemIndex + 1 ) + '/' + itemsStarted.length + '] ' + itemsStarted[ itemIndex ] ;
			}
			
			if ( itemName.length > itemFiller.length ) { itemName = itemName.slice( 0 , itemFiller.length - 1 ) + '…' ; }
			else if ( itemName.length < itemFiller.length ) { itemName = ( itemName + itemFiller ).slice( 0 , itemFiller.length ) ; }
		}
		
		innerBarSize -= options.titleSize || 0 ;
		if ( title )
		{
			titleName = title ;
			
			if ( titleName.length >= titleFiller.length ) { titleName = titleName.slice( 0 , titleFiller.length - 2 ) + '… ' ; }
			else { titleName = ( titleName + titleFiller ).slice( 0 , titleFiller.length ) ; }
		}
		
		progressSize = progress === undefined ? 1 : Math.round( innerBarSize * Math.max( Math.min( progress , 1 ) , 0 ) ) ;
		voidSize = innerBarSize - progressSize ;
		
		/*
		console.log( "Size:" , width ,
			voidSize , innerBarSize , progressSize , eta.length , title.length , itemName.length ,
			voidSize + progressSize + eta.length + title.length + itemName.length
		) ;
		//*/
		
		if ( progressSize )
		{
			if ( progress === undefined )
			{
				progressBar = wheel[ ++ wheelCounter % wheel.length ] ;
			}
			else
			{
				progressBar += options.barChar.repeat( progressSize - 1 ) ;
				progressBar += options.barHeadChar ;
			}
		}
		
		voidBar += ' '.repeat( voidSize ) ;
		
		options.titleStyle( titleName ) ;
		
		if ( percent ) { options.percentStyle( percent ) ; }
		
		if ( progress === undefined ) { self( ' ' ) ; }
		else { options.barBracketStyle( '[' ) ; }
		
		options.barStyle( progressBar ) ;
		self( voidBar ) ;
		
		if ( progress === undefined ) { self( ' ' ) ; /*self( '+' ) ;*/ }
		else { options.barBracketStyle( ']' ) ; }
		
		options.etaStyle( eta ) ;
		//self( '*' ) ;
		options.itemStyle( itemName ) ;
		//self( '&' ) ;
		
		self.restoreCursor() ;
		
		if ( redrawTimer ) { clearTimeout( redrawTimer ) ; }
		if ( ! progress || progress < 1 ) { redrawTimer = setTimeout( redraw , options.maxRefreshTime ) ; }
		lastRedrawTime = time ;
	} ;
	
	
	// Get the cursor location before getting started
	
	this.getCursorLocation( function( error , x_ , y_ ) {
		
		var oldWidth = width ;
		
		startX = x_ ;
		endX = Math.min( x_ + width , self.width ) ;
		y = y_ ;
		width = endX - startX ;
		
		if ( width !== oldWidth )
		{
			// Should resize all part here
			if ( options.titleSize ) { options.titleSize = Math.floor( options.titleSize * width / oldWidth ) ; }
			if ( options.itemSize ) { options.itemSize = Math.floor( options.itemSize * width / oldWidth ) ; }
		}
		
		ready = true ;
		redraw() ;
	} ) ;
	
	
	controler.startItem = function item( name ) {
		
		itemsStarted.push( name ) ;
		
		// No need to redraw NOW if there are other items running.
		// Let the timer do the job.
		if ( itemsStarted.length === 1 )
		{
			// If progress is >= 1, then it's finished, so we should redraw NOW (before the program eventually quit)
			if ( progress >= 1 ) { redraw() ; return ; }
			
			// Using a setTimeout with a 0ms time and redrawTimer clearing has a nice effect:
			// if multiple synchronous update are performed, redraw will be called once
			if ( redrawTimer ) { clearTimeout( redrawTimer ) ; }
			redrawTimer = setTimeout( redraw , 0 ) ;
		}
	} ;
	
	controler.itemDone = function itemDone( name ) {
		
		var index ;
		
		itemsDone ++ ;
		
		if ( maxItems ) { progress = itemsDone / maxItems ; }
		else { progress = undefined ; }
		
		lastUpdateTime = ( new Date() ).getTime() ;
		updateCount ++ ;
		progressUpdateCount ++ ;
		
		index = itemsStarted.indexOf( name ) ;
		if ( index >= 0 ) { itemsStarted.splice( index , 1 ) ; }
		
		// If progress is >= 1, then it's finished, so we should redraw NOW (before the program eventually quit)
		if ( progress >= 1 ) { redraw( true ) ; return ; }
		
		// Using a setTimeout with a 0ms time and redrawTimer clearing has a nice effect:
		// if multiple synchronous update are performed, redraw will be called once
		if ( redrawTimer ) { clearTimeout( redrawTimer ) ; }
		redrawTimer = setTimeout( redraw.bind( self , true ) , 0 ) ;
	} ;
	
	controler.update = function update( toUpdate ) {
		
		if ( ! toUpdate ) { toUpdate = {} ; }
		else if ( typeof toUpdate === 'number' ) { toUpdate = { progress: toUpdate } ; }
		
		if ( 'progress' in toUpdate )
		{
			if ( typeof toUpdate.progress !== 'number' )
			{
				progress = undefined ;
			}
			else
			{
				// Not sure if it is a good thing to let the user set progress to a value that is lesser than the current one
				progress = toUpdate.progress ;
				
				if ( progress > 1 ) { progress = 1 ; }
				else if ( progress < 0 ) { progress = 0 ; }
				
				if ( progress > 0 ) { progressUpdateCount ++ ; }
				
				lastUpdateTime = ( new Date() ).getTime() ;
				updateCount ++ ;
			}
		}
		
		if ( typeof toUpdate.items === 'number' )
		{
			maxItems = toUpdate.items ;
			if ( maxItems ) { progress = itemsDone / maxItems ; }
			
			if ( typeof options.itemSize !== 'number' )
			{
				options.itemSize = Math.round( width / 3 ) ;
				itemFiller = ' '.repeat( options.itemSize ) ;
			}
		}
		
		if ( typeof toUpdate.title === 'string' )
		{
			title = toUpdate.title ;
			
			if ( typeof options.titleSize !== 'number' )
			{
				options.titleSize = Math.round( width / 3 ) ;
				titleFiller = ' '.repeat( options.titleSize ) ;
			}
		}
		
		// If progress is >= 1, then it's finished, so we should redraw NOW (before the program eventually quit)
		if ( progress >= 1 ) { redraw( true ) ; return ; }
		
		// Using a setTimeout with a 0ms time and redrawTimer clearing has a nice effect:
		// if multiple synchronous update are performed, redraw will be called once
		if ( redrawTimer ) { clearTimeout( redrawTimer ) ; }
		redrawTimer = setTimeout( redraw.bind( self , true ) , 0 ) ;
	} ;
	
	controler.pause = controler.stop = function stop() {
		pause = true ;
	} ;
	
	controler.resume = function resume() {
		if ( pause )
		{
			pause = false ;
			redraw() ;
		}
	} ;
	
	return controler ;
} ;



