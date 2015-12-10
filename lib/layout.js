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
			width_: this.term.width ,
			height_: this.term.height ,
			dx_: this.term.width - 1 ,
			dy_: this.term.height - 1 ,
			xmin_: 1 ,
			ymin_: 1
		} ;
		
		inProgress = {
			offsetX: 0 ,
			offsetY: 0 ,
			remainingDx: parent.dx_ ,
			remainingDy: parent.dy_ ,
		} ;
	}
	
	//console.error( "\n\ndef #" + def.id + ':\n' , computed ) ;
	
	this.computeDxDy( def , computed , parent , inProgress ) ;
	
	//console.error( "\n\ndef #" + def.id + ':\n' , computed ) ;
	
	computed.xmin_ = parent.xmin_ + inProgress.offsetX ;
	computed.xmax_ = computed.xmin_ + computed.dx_ ;
	computed.ymin_ = parent.ymin_ + inProgress.offsetY ;
	computed.ymax_ = computed.ymin_ + computed.dy_ ;
	
	//console.error( "\n\ndef #" + def.id + ':\n' , computed ) ;
	
	// Check if it goes out of its parent
	if ( computed.xmax_ > parent.xmax_ )
	{
		computed.xmax_ = parent.xmax_ ;
		computed.dx_ = computed.xmax_ - computed.xmin_ ;
	}
	
	if ( computed.ymax_ > parent.ymax_ )
	{
		computed.ymax_ = parent.ymax_ ;
		computed.dy_ = computed.ymax_ - computed.ymin_ ;
	}
	
	// Width and height are not used internally, but provided for userland
	computed.width_ = computed.dx_ + 1 ;
	computed.height_ = computed.dy_ + 1 ;
	
	computed.columns = [] ;
	computed.rows = [] ;
	
	//console.error( "\n\ndef #" + def.id + ':\n' , computed ) ;
	
	nextInProgress = {
		offsetX: 0 ,
		offsetY: 0 ,
		remainingDx: computed.dx_ ,
		remainingDy: computed.dy_ ,
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
			
			if ( computed.columns[ i ].dx_ !== undefined ) { nextInProgress.remainingDx -= computed.columns[ i ].dx_ ; }
			else { nextInProgress.autoDxCount ++ ; }
		}
		
		for ( i = 0 ; i < def.columns.length ; i ++ )
		{
			this.compute( def.columns[ i ] , computed.columns[ i ] , computed , nextInProgress ) ;
			nextInProgress.offsetX = computed.columns[ i ].xmax_ - computed.xmin_ ;
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
			
			if ( computed.rows[ i ].dy_ !== undefined ) { nextInProgress.remainingDy -= computed.rows[ i ].dy_ ; }
			else { nextInProgress.autoDyCount ++ ; }
		}
		
		for ( i = 0 ; i < def.rows.length ; i ++ )
		{
			this.compute( def.rows[ i ] , computed.rows[ i ] , computed , nextInProgress ) ;
			nextInProgress.offsetY = computed.rows[ i ].ymax_ - computed.ymin_ ;
		}
		
		hasChild = true ;
	}
	
	computed.width_ = computed.dx_ + 1 ;
	computed.height_ = computed.dy_ + 1 ;
	
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
				if ( this.boxes[ def.id ].width !== computed.width - 2 || this.boxes[ def.id ].height !== computed.height - 2 )
				{
					this.boxes[ def.id ].resize( {
						x: 0 ,
						y: 0 ,
						width: computed.width - 2 ,
						height: computed.height - 2
					} ) ;
				}
				
				this.boxes[ def.id ].x = computed.xmin + 1 ;
				this.boxes[ def.id ].y = computed.ymin + 1 ;
			}
			else
			{
				this.boxes[ def.id ] = ScreenBuffer.create( {
					dst: this.term ,
					width: computed.width - 2 ,
					height: computed.height - 2 ,
					x: computed.xmin + 1 ,
					y: computed.ymin + 1
				} ) ;
			}
		}
	}
} ;



Layout.prototype.computeDxDy = function computeDxDy( def , computed , parent , inProgress , firstPass )
{
	//console.error( ">>>>>>>>>> #" + def.id + ' firstPass: ' , !! firstPass ) ;
	
	// Dx
	if ( firstPass || computed.dx_ === undefined )
	{
		if ( def.width !== undefined )
		{
			computed.dx_ = Math.max( 0 , Math.min( parent.dx_ , def.width - 1 ) ) ;
		}
		else if ( def.widthPercent !== undefined )
		{
			computed.dx_ = Math.max( 0 , Math.min( parent.dx_ , parent.dx_ * def.widthPercent / 100 ) ) ;
		}
		else if ( ! firstPass )
		{
			//console.error( ">>>>>>>>>> #" + def.id + ' remaining dx: ' , inProgress.remainingDx , '/' , inProgress.autoDxCount , ' --- ' , inProgress ) ;
			computed.dx_ = Math.max( 0 , inProgress.remainingDx / ( inProgress.autoDxCount || 1 ) ) ;
			//console.error( ">>>>>>>>>> #" + def.id + ' computed dx: ' , computed.dx_ ) ;
		}
	}
	
	// Dy
	if ( firstPass || computed.dy_ === undefined )
	{
		if ( def.height !== undefined )
		{
			computed.dy_ = Math.max( 0 , Math.min( parent.dy_ , def.height - 1 ) ) ;
		}
		else if ( def.heightPercent !== undefined )
		{
			computed.dy_ = Math.max( 0 , Math.min( parent.dy_ , parent.dy_ * def.heightPercent / 100 ) ) ;
		}
		else if ( ! firstPass )
		{
			computed.dy_ = Math.max( 0 , inProgress.remainingDy / ( inProgress.autoDyCount || 1 ) ) ;
		}
	}
} ;
	


Layout.prototype.round = function round( computed )
{
	computed.xmin = Math.round( computed.xmin_ ) ;
	computed.xmax = Math.round( computed.xmax_ ) ;
	computed.ymin = Math.round( computed.ymin_ ) ;
	computed.ymax = Math.round( computed.ymax_ ) ;
	
	computed.dx = computed.xmax - computed.xmin ;
	computed.dy = computed.ymax - computed.ymin ;
	computed.width = computed.dx + 1 ;
	computed.height = computed.dy + 1 ;
} ;



Layout.prototype.redraw = function redraw()
{
	var key ;
	
	this.term.clear() ;
	this.draw() ;
	
	for ( key in this.boxes ) { this.boxes[ key ].draw() ; }
} ;



Layout.prototype.draw = function draw()
{
	var y , tees = {} ;
	
	// Draw the top border
	this.term.moveTo(
		this.computed.xmin ,
		this.computed.ymin ,
		this.boxChars.topLeft + this.boxChars.horizontal.repeat( this.computed.dx - 1 ) + this.boxChars.topRight
	) ;
	
	// Draw the bottom border
	this.term.moveTo(
		this.computed.xmin ,
		this.computed.ymax ,
		this.boxChars.bottomLeft + this.boxChars.horizontal.repeat( this.computed.dx - 1 ) + this.boxChars.bottomRight
	) ;
	
	// Draw the left and right border
	for ( y = this.computed.ymin + 1 ; y < this.computed.ymax ; y ++ )
	{
		this.term.moveTo( this.computed.xmin , y , this.boxChars.vertical ).moveTo( this.computed.xmax , y , this.boxChars.vertical ) ;
	}
	
	this.drawRecursive( this.computed , tees ) ;
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
		this.drawTee( computed.xmax , computed.ymin , 'top' , tees ) ;
		this.drawTee( computed.xmax , computed.ymax , 'bottom' , tees ) ;
		
		// Draw the right border
		for ( y = computed.ymin + 1 ; y < computed.ymax ; y ++ ) { this.term.moveTo( computed.xmax , y , this.boxChars.vertical ) ; }
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
		this.drawTee( computed.xmin , computed.ymax , 'left' , tees ) ;
		this.drawTee( computed.xmax , computed.ymax , 'right' , tees ) ;
		
		// Draw the bottom border
		this.term.moveTo(
			computed.xmin + 1 ,
			computed.ymax ,
			this.boxChars.horizontal.repeat( computed.dx - 1 )
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


