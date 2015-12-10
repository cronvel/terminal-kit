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
var ScreenBuffer = require( './ScreenBuffer.js' ) ;
var boxesChars = require( './spChars.js' ).box ;
var events = require( 'events' ) ;



function Layout() { throw new Error( 'Use Layout.create() instead' ) ; }
//module.exports = Layout ;
Layout.prototype = Object.create( events.prototype ) ;
Layout.prototype.constructor = Layout ;



Layout.create = function createLayout( def , options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var layout = Object.create( Layout.prototype , {
		term: { value: this } ,
		def: { value: def , enumerable: true } ,
		computed: { value: {} , enumerable: true , writable: true } ,
		boxesInfo: { value: {} , enumerable: true , writable: true } ,
		boxes: { value: {} , enumerable: true , writable: true } ,
		boxChars: { value: boxesChars.light , enumerable: true , writable: true } ,
		autoResize: { value: false , enumerable: true , writable: true } ,
	} ) ;
	
	Object.defineProperties( layout , {
		onResize: { value: onResize.bind( layout ) }
	} ) ;
	
	if ( options.boxChars )
	{
		if ( typeof options.boxChars === 'object' ) { layout.boxChars = options.boxChars ; }
		else if ( typeof options.boxChars === 'string' && boxesChars[ options.boxChars ] ) { layout.boxChars = boxesChars[ options.boxChars ] ; }
	}
	
	layout.compute() ;
	
	return layout ;
} ;

module.exports = Layout.create ;



Layout.prototype.compute = function compute( def , computed , parent , inProgress )
{
	var i , nextInProgress , hasChild = false ;
	
	if ( ! arguments.length )
	{
		computed = this.computed = {} ;
		
		def = this.def ;
		
		parent = {
			width: this.term.width ,
			height: this.term.height ,
			dx: this.term.width - 1 ,
			dy: this.term.height - 1 ,
			xmin: 1 ,
			ymin: 1
		} ;
		
		inProgress = {
			offsetX: 0 ,
			offsetY: 0 ,
			remainingDx: parent.dx ,
			remainingDy: parent.dy ,
		} ;
	}
	
	//console.error( "\n\ndef #" + def.id + ':\n' , computed ) ;
	
	this.computeDxDy( def , computed , parent , inProgress ) ;
	
	//console.error( "\n\ndef #" + def.id + ':\n' , computed ) ;
	
	computed.xmin = parent.xmin + inProgress.offsetX ;
	computed.xmax = computed.xmin + computed.dx ;
	computed.ymin = parent.ymin + inProgress.offsetY ;
	computed.ymax = computed.ymin + computed.dy ;
	
	//console.error( "\n\ndef #" + def.id + ':\n' , computed ) ;
	
	// Check if it goes out of its parent
	if ( computed.xmax > parent.xmax )
	{
		computed.xmax = parent.xmax ;
		computed.dx = computed.xmax - computed.xmin ;
	}
	
	if ( computed.ymax > parent.ymax )
	{
		computed.ymax = parent.ymax ;
		computed.dy = computed.ymax - computed.ymin ;
	}
	
	// Width and height are not used internally, but provided for userland
	computed.width = computed.dx + 1 ;
	computed.height = computed.dy + 1 ;
	
	computed.columns = [] ;
	computed.rows = [] ;
	
	//console.error( "\n\ndef #" + def.id + ':\n' , computed ) ;
	
	nextInProgress = {
		offsetX: 0 ,
		offsetY: 0 ,
		remainingDx: computed.dx ,
		remainingDy: computed.dy ,
		autoDxCount: 0 ,
		autoDyCount: 0 ,
	} ;
	
	if ( def.columns && def.columns.length )
	{
		// First pass
		for ( i = 0 ; i < def.columns.length ; i ++ )
		{
			computed.columns[ i ] = {} ;
			this.computeDxDy( def.columns[ i ] , computed.columns[ i ] , computed , nextInProgress , true ) ;
			
			if ( computed.columns[ i ].dx !== undefined ) { nextInProgress.remainingDx -= computed.columns[ i ].dx ; }
			else { nextInProgress.autoDxCount ++ ; }
		}
		
		for ( i = 0 ; i < def.columns.length ; i ++ )
		{
			this.compute( def.columns[ i ] , computed.columns[ i ] , computed , nextInProgress ) ;
			nextInProgress.offsetX = computed.columns[ i ].xmax - computed.xmin ;
		}
		
		hasChild = true ;
	}
	else if ( def.rows && def.rows.length )
	{
		// First pass
		for ( i = 0 ; i < def.rows.length ; i ++ )
		{
			computed.rows[ i ] = {} ;
			this.computeDxDy( def.rows[ i ] , computed.rows[ i ] , computed , nextInProgress , true ) ;
			
			if ( computed.rows[ i ].dy !== undefined ) { nextInProgress.remainingDy -= computed.rows[ i ].dy ; }
			else { nextInProgress.autoDyCount ++ ; }
		}
		
		for ( i = 0 ; i < def.rows.length ; i ++ )
		{
			this.compute( def.rows[ i ] , computed.rows[ i ] , computed , nextInProgress ) ;
			nextInProgress.offsetY = computed.rows[ i ].ymax - computed.ymin ;
		}
		
		hasChild = true ;
	}
	
	computed.width = computed.dx + 1 ;
	computed.height = computed.dy + 1 ;
	
	this.round( computed ) ;
	//console.error( "\n\nfinal #" + def.id + ':\n' , computed ) ;
	
	if ( def.id && typeof def.id === 'string' )
	{
		this.boxesInfo[ def.id ] = computed ;
		
		// ScreenBuffer surfaces are only created for "terminal" boxes, i.e. boxes that don't have child
		if ( ! hasChild )
		{
			if ( this.boxes[ def.id ] )
			{
				if ( this.boxes[ def.id ].width !== computed.width_ - 2 || this.boxes[ def.id ].height !== computed.height_ - 2 )
				{
					this.boxes[ def.id ].resize( {
						x: 0 ,
						y: 0 ,
						width: computed.width_ - 2 ,
						height: computed.height_ - 2
					} ) ;
				}
				
				this.boxes[ def.id ].x = computed.xmin_ + 1 ;
				this.boxes[ def.id ].y = computed.ymin_ + 1 ;
			}
			else
			{
				this.boxes[ def.id ] = ScreenBuffer.create( {
					dst: this.term ,
					width: computed.width_ - 2 ,
					height: computed.height_ - 2 ,
					x: computed.xmin_ + 1 ,
					y: computed.ymin_ + 1
				} ) ;
			}
		}
	}
} ;



Layout.prototype.computeDxDy = function computeDxDy( def , computed , parent , inProgress , firstPass )
{
	//console.error( ">>>>>>>>>> #" + def.id + ' firstPass: ' , !! firstPass ) ;
	
	// Dx
	if ( firstPass || computed.dx === undefined )
	{
		if ( def.width !== undefined )
		{
			computed.dx = Math.max( 0 , Math.min( parent.dx , def.width - 1 ) ) ;
		}
		else if ( def.widthPercent !== undefined )
		{
			computed.dx = Math.max( 0 , Math.min( parent.dx , parent.dx * def.widthPercent / 100 ) ) ;
		}
		else if ( ! firstPass )
		{
			//console.error( ">>>>>>>>>> #" + def.id + ' remaining dx: ' , inProgress.remainingDx , '/' , inProgress.autoDxCount , ' --- ' , inProgress ) ;
			computed.dx = Math.max( 0 , inProgress.remainingDx / ( inProgress.autoDxCount || 1 ) ) ;
			//console.error( ">>>>>>>>>> #" + def.id + ' computed dx: ' , computed.dx ) ;
		}
	}
	
	// Dy
	if ( firstPass || computed.dy === undefined )
	{
		if ( def.height !== undefined )
		{
			computed.dy = Math.max( 0 , Math.min( parent.dy , def.height - 1 ) ) ;
		}
		else if ( def.heightPercent !== undefined )
		{
			computed.dy = Math.max( 0 , Math.min( parent.dy , parent.dy * def.heightPercent / 100 ) ) ;
		}
		else if ( ! firstPass )
		{
			computed.dy = Math.max( 0 , inProgress.remainingDy / ( inProgress.autoDyCount || 1 ) ) ;
		}
	}
} ;
	


Layout.prototype.round = function round( computed )
{
	computed.xmin_ = Math.round( computed.xmin ) ;
	computed.xmax_ = Math.round( computed.xmax ) ;
	computed.ymin_ = Math.round( computed.ymin ) ;
	computed.ymax_ = Math.round( computed.ymax ) ;
	
	computed.dx_ = computed.xmax_ - computed.xmin_ ;
	computed.dy_ = computed.ymax_ - computed.ymin_ ;
	computed.width_ = computed.dx_ + 1 ;
	computed.height_ = computed.dy_ + 1 ;
} ;



Layout.prototype.redraw = function redraw()
{
	this.term.clear() ;
	this.draw() ;
	
	for ( key in this.boxes ) { this.boxes[ key ].draw() ; }
} ;



Layout.prototype.draw = function draw()
{
	var y , tees = {} ;
	
	computed = this.computed ;
	
	// Draw the top border
	this.term.moveTo(
		computed.xmin_ ,
		computed.ymin_ ,
		this.boxChars.topLeft + this.boxChars.horizontal.repeat( computed.dx_ - 1 ) + this.boxChars.topRight
	) ;
	
	// Draw the bottom border
	this.term.moveTo(
		computed.xmin_ ,
		computed.ymax_ ,
		this.boxChars.bottomLeft + this.boxChars.horizontal.repeat( computed.dx_ - 1 ) + this.boxChars.bottomRight
	) ;
	
	// Draw the left and right border
	for ( y = computed.ymin_ + 1 ; y < computed.ymax_ ; y ++ )
	{
		this.term.moveTo( computed.xmin_ , y , this.boxChars.vertical ).moveTo( computed.xmax_ , y , this.boxChars.vertical ) ;
	}
	
	this.drawRecursive( computed , tees ) ;
} ;



Layout.prototype.drawRecursive = function drawRecursive( computed , tees )
{
	var i ;
	
	if ( computed.columns.length )
	{
		for ( i = 0 ; i < computed.columns.length ; i ++ )
		{
			this.drawColumn( computed.columns[ i ] , tees , i === computed.columns.length - 1 ) ;
		}
	}
	else if ( computed.rows.length )
	{
		for ( i = 0 ; i < computed.rows.length ; i ++ )
		{
			this.drawRow( computed.rows[ i ] , tees , i === computed.rows.length - 1 ) ;
		}
	}
} ;



Layout.prototype.drawColumn = function drawColumn( computed , tees , last )
{
	var y ;
	
	if ( ! last )
	{
		// Draw Tee-junction
		this.drawTee( computed.xmax_ , computed.ymin_ , 'top' , tees ) ;
		this.drawTee( computed.xmax_ , computed.ymax_ , 'bottom' , tees ) ;
		
		// Draw the right border
		for ( y = computed.ymin_ + 1 ; y < computed.ymax_ ; y ++ ) { this.term.moveTo( computed.xmax_ , y , this.boxChars.vertical ) ; }
	}
	
	this.drawRecursive( computed , tees ) ;
} ;



Layout.prototype.drawTee = function drawTee( x , y , type , tees )
{
	var key = x + ':' + y ;
	
	if ( ! tees[ key ] )
	{
		this.term.moveTo( x , y , this.boxChars[ type + 'Tee' ] ) ;
		tees[ key ] = type ;
	}
	else if ( tees[ key ] !== type )
	{
		this.term.moveTo( x , y , this.boxChars.cross ) ;
	}
} ;



Layout.prototype.drawRow = function drawRow( computed , tees , last )
{
	if ( ! last )
	{
		// Draw Tee-junction
		this.drawTee( computed.xmin_ , computed.ymax_ , 'left' , tees ) ;
		this.drawTee( computed.xmax_ , computed.ymax_ , 'right' , tees ) ;
		
		// Draw the bottom border
		this.term.moveTo(
			computed.xmin_ + 1 ,
			computed.ymax_ ,
			this.boxChars.horizontal.repeat( computed.dx_ - 1 )
		) ;
	}
	
	this.drawRecursive( computed , tees ) ;
} ;



Layout.prototype.setAutoResize = function setAutoResize( value )
{
	if ( value === undefined ) { value = true ; }
	else { value = !! value ; }
	
	if ( this.autoResize === value ) { return ; }
	
	this.autoResize = value ;
	
	if ( this.autoResize ) { this.term.on( 'resize' , this.onResize ) ; }
	else { this.term.removeListener( 'resize' , this.onResize ) ; }
} ;



function onResize()
{
	this.compute() ;
	this.redraw() ;
}


