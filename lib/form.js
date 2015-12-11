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
var events = require( 'events' ) ;

function noop() {}



function Form() { throw new Error( 'Use Form.create() instead' ) ; }
//module.exports = Form ;
Form.prototype = Object.create( events.prototype ) ;
Form.prototype.constructor = Form ;



Form.create = function createForm( def , callback )
{
	if ( ! def || typeof def !== 'object' ) { def = {} ; }
	
	var form = Object.create( Form.prototype , {
		term: { value: this } ,
		inputs: { value: def.inputs , enumerable: true } ,
		inputFields: { value: def.inputs , enumerable: true , writable: true } ,
		x: { value: def.x || 1 , enumerable: true , writable: true } ,
		y: { value: def.y || 1 , enumerable: true , writable: true } ,
		width: { value: def.width || 78 , enumerable: true , writable: true } ,
		activeFieldIndex: { value: def.activeField || 0 , enumerable: true , writable: true } ,
		callback: { value: typeof callback === 'function' ? callback : noop , enumerable: true , writable: true } ,
		calledBack: { value: false , enumerable: true , writable: true } ,
	} ) ;
	
	Object.defineProperties( form , {
		onKey: { value: onKey.bind( form ) }
	} ) ;
	
	form.run() ;
	
	return form ;
} ;

module.exports = Form.create ;



var inputFieldKeyBindings = {
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	UP: 'up' ,
	DOWN: 'down' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine'
} ;



Form.prototype.run = function run()
{
	var i , iMax , labelMaxLength = 0 ;
	
	iMax = this.inputs.length ;
	
	for ( i = 0 ; i < iMax ; i ++ )
	{
		if ( this.inputs[ i ].label.length > labelMaxLength ) { labelMaxLength = this.inputs[ i ].label.length ; }
	}
	
	for ( i = 0 ; i < iMax ; i ++ )
	{
		// Write the label
		this.term.styleReset.moveTo( this.x , this.y + i , this.inputs[ i ].label ).column( this.x + labelMaxLength + 1 , ': ' ) ;
		
		// Create the input field
		this.inputFields[ i ] = this.term.inputField( {
				keyBindings: inputFieldKeyBindings ,
				area: {
					x: this.x + labelMaxLength + 3 ,
					y: this.y + i ,
					width: this.width - labelMaxLength ,
					height: 1 ,
					textAttr: { color: 'brightYellow' , bgColor: 'blue' } ,
					emptyAttr: { bgColor: 'blue' } ,
				}
			} , function() {}
		) ;
		
		// Unfocus them all
		this.inputFields[ i ].focus( false ) ;
	}
	
	this.inputFields[ iMax ] = this.term.createButton( {
		label: ' Submit! ' ,
		x: this.x ,
		y: this.y + iMax + 1 ,
		focus: false ,
	} ) ;
	
	// Focus only the active one
	this.inputFields[ this.activeFieldIndex ].focus( true ) ;
	
	this.term.on( 'key' , this.onKey ) ;
} ;



function onKey( key , trash , data )
{
	var i , iMax , result ;
	
	switch ( key )
	{
		case 'KP_ENTER' :
		case 'ENTER' :
			if ( this.inputFields[ this.activeFieldIndex ].widgetType === 'button' )
			{
				result = {} ;
				iMax = this.inputs.length ;
				
				for ( i = 0 ; i < iMax ; i ++ )
				{
					console.log( this.inputs[ i ].label  ) ;
					result[ this.inputs[ i ].label ] = this.inputFields[ i ].value() ;
				}
				
				if ( ! this.calledBack ) { this.callback( undefined , result ) ; }
				break ;
			}			// jshint ignore:line
		case 'TAB' :	// jshint ignore:line
			this.inputFields[ this.activeFieldIndex ].focus( false ) ;
			this.activeFieldIndex ++ ;
			if ( this.activeFieldIndex >= this.inputFields.length ) { this.activeFieldIndex = 0 ; }
			this.inputFields[ this.activeFieldIndex ].focus( true ) ;
			this.inputFields[ this.activeFieldIndex ].redraw() ;
			break ;
		case 'SHIFT_TAB' :
			this.inputFields[ this.activeFieldIndex ].focus( false ) ;
			this.activeFieldIndex -- ;
			if ( this.activeFieldIndex < 0 ) { this.activeFieldIndex = this.inputFields.length - 1 ; }
			this.inputFields[ this.activeFieldIndex ].focus( true ) ;
			this.inputFields[ this.activeFieldIndex ].redraw() ;
			break ;
	}
}



