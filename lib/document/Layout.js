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
var Element = require( './Element.js' ) ;
var Container = require( './Container.js' ) ;
var boxesChars = require( '../spChars.js' ).box ;



function Layout() { throw new Error( 'Use Layout.create() instead' ) ; }
module.exports = Layout ;
Layout.prototype = Object.create( Element.prototype ) ;
Layout.prototype.constructor = Layout ;
Layout.prototype.elementType = 'Layout' ;



Layout.create = function createLayout( options )
{
	var layout = Object.create( Layout.prototype ) ;
	layout.create( options ) ;
	return layout ;
} ;



Layout.prototype.create = function create( options )
{
	var key ;
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	Element.prototype.create.call( this , options ) ;
	
	Object.defineProperties( this , {
		layoutDef: { value: options.layout , enumerable: true } ,
		computed: { value: {} , enumerable: true , writable: true } ,
		boxesContainer: { value: {} , enumerable: true , writable: true } ,
		boxChars: { value: boxesChars.light , enumerable: true , writable: true } ,
	} ) ;
	
	if ( options.boxChars )
	{
		if ( typeof options.boxChars === 'object' )
		{
			this.boxChars = options.boxChars ;
		}
		else if ( typeof options.boxChars === 'string' && boxesChars[ options.boxChars ] )
		{
			this.boxChars = boxesChars[ options.boxChars ] ;
		}
	}
	
	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Layout' ) { this.draw() ; }
} ;



Layout.prototype.destroy = function destroy( isSubDestroy )
{
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



Layout.prototype.preDrawSelf = function preDrawSelf()
{
	var y , tees = {} ;
	
	this.computeBoundingBoxes() ;
		
	// Draw the top border
	this.outputDst.put(
		{ x: this.computed.xmin , y: this.computed.ymin } ,
		this.boxChars.topLeft + this.boxChars.horizontal.repeat( this.computed.dx - 1 ) + this.boxChars.topRight
	) ;
	
	// Draw the bottom border
	this.outputDst.put(
		{ x: this.computed.xmin , y: this.computed.ymax } ,
		this.boxChars.bottomLeft + this.boxChars.horizontal.repeat( this.computed.dx - 1 ) + this.boxChars.bottomRight
	) ;
	
	// Draw the left and right border
	for ( y = this.computed.ymin + 1 ; y < this.computed.ymax ; y ++ )
	{
		this.outputDst.put( { x: this.computed.xmin , y: y } , this.boxChars.vertical ) ;
		this.outputDst.put( { x: this.computed.xmax , y: y } , this.boxChars.vertical ) ;
	}
	
	this.drawRecursive( this.computed , tees ) ;
} ;



Layout.prototype.computeBoundingBoxes = function computeBoundingBoxes()
{
	var computed = this.computed = {} ;
	
	var layoutDef = this.layoutDef ;
	
	var parent = {
		width_: this.outputDst.width ,
		height_: this.outputDst.height ,
		dx_: this.outputDst.width - 1 ,
		dy_: this.outputDst.height - 1 ,
		xmin_: 0 ,
		ymin_: 0
	} ;
	
	var inProgress = {
		offsetX: ( this.layoutDef.x ) || 0 ,
		offsetY: ( this.layoutDef.y ) || 0 ,
		remainingDx: parent.dx_ ,
		remainingDy: parent.dy_ ,
	} ;
	
	this.computeBoundingBoxes_( layoutDef , computed , parent , inProgress ) ;
} ;



Layout.prototype.computeBoundingBoxes_ = function computeBoundingBoxes_( layoutDef , computed , parent , inProgress )
{
	var i , nextInProgress , hasChild = false ;
	
	//console.error( "\n\nlayoutDef #" + layoutDef.id + ':\n' , computed ) ;
	
	this.computeDxDy( layoutDef , computed , parent , inProgress ) ;
	
	//console.error( "\n\nlayoutDef #" + layoutDef.id + ':\n' , computed ) ;
	
	computed.xmin_ = parent.xmin_ + inProgress.offsetX ;
	computed.xmax_ = computed.xmin_ + computed.dx_ ;
	computed.ymin_ = parent.ymin_ + inProgress.offsetY ;
	computed.ymax_ = computed.ymin_ + computed.dy_ ;
	
	//console.error( "\n\nlayoutDef #" + layoutDef.id + ':\n' , computed ) ;
	
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
	
	//console.error( "\n\nlayoutDef #" + layoutDef.id + ':\n' , computed ) ;
	
	nextInProgress = {
		offsetX: 0 ,
		offsetY: 0 ,
		remainingDx: computed.dx_ ,
		remainingDy: computed.dy_ ,
		autoDxCount: 0 ,
		autoDyCount: 0 ,
	} ;
	
	if ( layoutDef.columns && layoutDef.columns.length )
	{
		// First pass
		for ( i = 0 ; i < layoutDef.columns.length ; i ++ )
		{
			computed.columns[ i ] = {} ;
			this.computeDxDy( layoutDef.columns[ i ] , computed.columns[ i ] , computed , nextInProgress , true ) ;
			
			if ( computed.columns[ i ].dx_ !== undefined ) { nextInProgress.remainingDx -= computed.columns[ i ].dx_ ; }
			else { nextInProgress.autoDxCount ++ ; }
		}
		
		for ( i = 0 ; i < layoutDef.columns.length ; i ++ )
		{
			this.computeBoundingBoxes_( layoutDef.columns[ i ] , computed.columns[ i ] , computed , nextInProgress ) ;
			nextInProgress.offsetX = computed.columns[ i ].xmax_ - computed.xmin_ ;
		}
		
		hasChild = true ;
	}
	else if ( layoutDef.rows && layoutDef.rows.length )
	{
		// First pass
		for ( i = 0 ; i < layoutDef.rows.length ; i ++ )
		{
			computed.rows[ i ] = {} ;
			this.computeDxDy( layoutDef.rows[ i ] , computed.rows[ i ] , computed , nextInProgress , true ) ;
			
			if ( computed.rows[ i ].dy_ !== undefined ) { nextInProgress.remainingDy -= computed.rows[ i ].dy_ ; }
			else { nextInProgress.autoDyCount ++ ; }
		}
		
		for ( i = 0 ; i < layoutDef.rows.length ; i ++ )
		{
			this.computeBoundingBoxes_( layoutDef.rows[ i ] , computed.rows[ i ] , computed , nextInProgress ) ;
			nextInProgress.offsetY = computed.rows[ i ].ymax_ - computed.ymin_ ;
		}
		
		hasChild = true ;
	}
	
	computed.width_ = computed.dx_ + 1 ;
	computed.height_ = computed.dy_ + 1 ;
	
	this.round( computed ) ;
	//console.error( "\n\nfinal #" + layoutDef.id + ':\n' , computed ) ;
	
	// Container surfaces are only created for "leaf" boxes, i.e. boxes that don't have child
	if ( ! hasChild )
	{
		if ( this.boxesContainer[ layoutDef.id ] )
		{
			if ( this.boxesContainer[ layoutDef.id ].width !== computed.width - 2 || this.boxesContainer[ layoutDef.id ].height !== computed.height - 2 )
			{
				this.boxesContainer[ layoutDef.id ].resize( {
					x: 0 ,
					y: 0 ,
					width: computed.width - 2 ,
					height: computed.height - 2
				} ) ;
			}
			
			this.boxesContainer[ layoutDef.id ].outputX = computed.xmin + 1 ;
			this.boxesContainer[ layoutDef.id ].outputY = computed.ymin + 1 ;
			
			this.boxesContainer[ layoutDef.id ].moveTo(
				this.boxesContainer[ layoutDef.id ].outputX ,
				this.boxesContainer[ layoutDef.id ].outputY
			) ;
		}
		else
		{
			var container = Container.create( {
				id: layoutDef.id ,
				parent: this ,
				outputDst: this.outputDst ,
				outputX: computed.xmin + 1 ,
				outputY: computed.ymin + 1 ,
				outputWidth: computed.width - 2 ,
				outputHeight: computed.height - 2
			} ) ;
			
			layoutDef.id = container.id ;
			this.boxesContainer[ layoutDef.id ] = container ;
		}
	}
} ;



Layout.prototype.computeDxDy = function computeDxDy( layoutDef , computed , parent , inProgress , firstPass )
{
	//console.error( ">>>>>>>>>> #" + layoutDef.id + ' firstPass: ' , !! firstPass ) ;
	
	// Dx
	if ( firstPass || computed.dx_ === undefined )
	{
		if ( layoutDef.width !== undefined )
		{
			computed.dx_ = Math.max( 0 , Math.min( parent.dx_ , layoutDef.width - 1 ) ) ;
		}
		else if ( layoutDef.widthPercent !== undefined )
		{
			computed.dx_ = Math.max( 0 , Math.min( parent.dx_ , parent.dx_ * layoutDef.widthPercent / 100 ) ) ;
		}
		else if ( ! firstPass )
		{
			//console.error( ">>>>>>>>>> #" + layoutDef.id + ' remaining dx: ' , inProgress.remainingDx , '/' , inProgress.autoDxCount , ' --- ' , inProgress ) ;
			computed.dx_ = Math.max( 0 , inProgress.remainingDx / ( inProgress.autoDxCount || 1 ) ) ;
			//console.error( ">>>>>>>>>> #" + layoutDef.id + ' computed dx: ' , computed.dx_ ) ;
		}
	}
	
	// Dy
	if ( firstPass || computed.dy_ === undefined )
	{
		if ( layoutDef.height !== undefined )
		{
			computed.dy_ = Math.max( 0 , Math.min( parent.dy_ , layoutDef.height - 1 ) ) ;
		}
		else if ( layoutDef.heightPercent !== undefined )
		{
			computed.dy_ = Math.max( 0 , Math.min( parent.dy_ , parent.dy_ * layoutDef.heightPercent / 100 ) ) ;
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
		for ( y = computed.ymin + 1 ; y < computed.ymax ; y ++ )
		{
			this.outputDst.put( { x: computed.xmax , y: y } , this.boxChars.vertical ) ;
		}
	}
	
	this.drawRecursive( computed , tees ) ;
} ;



Layout.prototype.drawTee = function drawTee( x , y , type , tees )
{
	var key = x + ':' + y ;
	
	if ( ! tees[ key ] )
	{
		this.outputDst.put( { x: x , y: y } , this.boxChars[ type + 'Tee' ] ) ;
		tees[ key ] = type ;
	}
	else if ( tees[ key ] !== type )
	{
		this.outputDst.put( { x: x , y: y } , this.boxChars.cross ) ;
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
		this.outputDst.put( { x: computed.xmin + 1 , y: computed.ymax } , this.boxChars.horizontal.repeat( computed.dx - 1 ) ) ;
	}
	
	this.drawRecursive( computed , tees ) ;
} ;



