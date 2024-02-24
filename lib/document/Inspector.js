/*
	Terminal Kit

	Copyright (c) 2009 - 2022 Cédric Ronvel

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



const Element = require( './Element.js' ) ;
const ColumnMenu = require( './ColumnMenu.js' ) ;
const Button = require( './Button.js' ) ;
const Text = require( './Text.js' ) ;

const string = require( 'string-kit' ) ;



function Inspector( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	this.onColumnMenuPageInit = this.onColumnMenuPageInit.bind( this ) ;

	if ( ! options.outputWidth && ! options.width ) { options.outputWidth = 78 ; }

	Element.call( this , options ) ;

	//this.submitValue = null ;

	this.inspectedObject = options.inspectedObject ;

	// TMP?
	this.breadCrumbText = null ;
	this.columnMenu = null ;
	this.fieldTextList = [] ;
	this.inspectStack = [] ;
	
	this.buttonsDef = options.buttons || [] ;
	this.buttons = [] ;
	this.focusChild = null ;
	this.onButtonSubmit = this.onButtonSubmit.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;

	// Global default attributes
	this.textAttr = options.textAttr || null ;
	this.voidAttr = options.voidAttr || options.emptyAttr || null ;
	this.buttonFocusAttr = options.buttonFocusAttr || null ;
	this.buttonBlurAttr = options.buttonBlurAttr || null ;
	this.turnedOnBlurAttr = options.turnedOnBlurAttr || null ;
	this.turnedOnFocusAttr = options.turnedOnFocusAttr || null ;
	this.turnedOffBlurAttr = options.turnedOffBlurAttr || null ;
	this.turnedOffFocusAttr = options.turnedOffFocusAttr || null ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }
	if ( options.textInputKeyBindings ) { this.textInputKeyBindings = options.textInputKeyBindings ; }

	this.initChildren() ;

	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Inspector' && ! options.noDraw ) { this.draw() ; }

	// /!\ TMP /!\
	this.run() ;
}

module.exports = Inspector ;
Element.inherit( Inspector ) ;



Inspector.prototype.needInput = true ;



Inspector.prototype.keyBindings = {
	LEFT: 'previous' ,
	RIGHT: 'next' ,
	UP: 'previous' ,
	DOWN: 'next' ,
	ENTER: 'next' ,
	KP_ENTER: 'next' ,
	ALT_ENTER: 'next'
} ;



Inspector.prototype.textInputKeyBindings = {} ;
Inspector.prototype.selectInputKeyBindings = {} ;
Inspector.prototype.selectMultiInputKeyBindings = {} ;



// Create Button automatically
Inspector.prototype.initChildren = function() {
	var labelMaxWidth = 0 ,
		offsetX = 0 , offsetY = 0 ,
		buttonsTextWidth = 0 , buttonSpacing = 0 ;

	// Submit Button part
	if ( ! this.buttonsDef.length ) {
		this.buttonsDef.push( {
			content: 'Submit' ,
			value: 'submit'
		} ) ;
	}

	this.buttonsDef.forEach( def => {
		def.contentWidth = Element.computeContentWidth( def.content , def.contentHasMarkup ) ;
		buttonsTextWidth += def.contentWidth ;
	} ) ;

	buttonSpacing = Math.floor( ( this.outputWidth - buttonsTextWidth ) / ( this.buttonsDef.length + 1 ) ) ;

	offsetX = buttonSpacing ;
	offsetY ++ ;

	/*
	this.buttonsDef.forEach( ( def , index ) => {
		this.buttons[ index ] = new Button( {
			internal: true ,
			parent: this ,
			content: def.content ,
			value: def.value ,
			outputX: this.outputX + offsetX ,
			outputY: this.outputY + offsetY ,
			focusAttr: def.focusAttr || this.buttonFocusAttr ,
			blurAttr: def.blurAttr || this.buttonBlurAttr ,
			noDraw: true
		} ) ;

		this.buttons[ index ].on( 'submit' , this.onButtonSubmit ) ;

		offsetX += def.contentWidth + buttonSpacing ;
	} ) ;
	*/
} ;



Inspector.prototype.run = async function() {
	this.inspectStack = [ { object: this.inspectedObject , key: '' } ] ;

	for ( ;; ) {
		await this.inspectSubObject() ;
	}
} ;

const Promise = require( 'seventh' ) ;

Inspector.prototype.inspectSubObject = function() {
	var promise = new Promise() ,
		current = this.inspectStack[ this.inspectStack.length - 1 ] ,
		subObject = current.object ,
		menuItems = [] ,
		path = this.inspectStack.map( e => e.key ).join( '.' ) ;

	this.breadCrumbText = new Text( {
		internal: true ,
		parent: this ,
		x: this.outputX ,
		y: this.outputY ,
		attr: { bgColor: 'cyan' , color: 'white' , bold: true } ,
		content: 'Path> ' + path
	} ) ;

	if ( this.inspectStack.length > 1 ) {
		menuItems.push( {
			content: '..' ,
			internalRole: 'parent' ,
			hotkey: [ 'BACKSPACE' ]
		} ) ;
	}

	menuItems.push( ... Object.keys( subObject ).map( key => {
		var value = subObject[ key ] ;

		var item = {
			content: key ,
			value: key
		} ;
		
		if ( value && typeof value === 'object' ) {
		}
		else {
			item.disabled = true ;
		}

		return item ;
	} ) ) ;

	this.columnMenu = new ColumnMenu( {
		internal: this ,
		parent: this ,
		x: this.outputX ,
		y: this.outputY + 2 ,
		width: Math.round( this.outputWidth / 2.5 ) ,
		pageMaxHeight: this.outputHeight - 4 ,
		blurLeftPadding: '^;  ' ,
		focusLeftPadding: '^;^R> ' ,
		disabledLeftPadding: '^;  ' ,
		paddingHasMarkup: true ,
		//multiLineItems: true ,
		buttonBlurAttr: { bgColor: '@dark-gray' , color: 'white' , bold: true } ,
		/*
		buttonKeyBindings: {
			ENTER: 'submit' ,
			CTRL_UP: 'submit' ,
			CTRL_DOWN: 'submit'
		} ,
		buttonActionKeyBindings: {
			CTRL_UP: 'up' ,
			CTRL_DOWN: 'down'
		} ,
		*/
		items: menuItems
	} ) ;






	var onSubmit = ( buttonValue , action , menu , button ) => {
		if ( button.internalRole === 'parent' ) {
			this.inspectStack.pop() ;
			close() ;
			return ;
		}
		
		if ( subObject[ buttonValue ] && typeof subObject[ buttonValue ] === 'object' ) {
			current.fromKey = buttonValue ;
			this.inspectStack.push( { object: subObject[ buttonValue ] , key: buttonValue } ) ;
			close() ;
			return ;
		}
	}



	var close = () => {
		for ( let fieldText of this.fieldTextList ) { fieldText.destroyNoRedraw() ; }
		this.fieldTextList.length = 0 ;
		this.columnMenu.destroyNoRedraw() ;
		this.breadCrumbText.destroyNoRedraw() ;
		this.redraw() ;
		promise.resolve() ;
	}



	this.columnMenu.on( 'submit' , onSubmit ) ;
	this.columnMenu.on( 'previousPage' , this.onColumnMenuPageInit ) ;
	this.columnMenu.on( 'nextPage' , this.onColumnMenuPageInit ) ;
	this.onColumnMenuPageInit( this.columnMenu.page ) ;

	if ( current.fromKey !== undefined ) {
		this.columnMenu.focusValue( current.fromKey ) ;
	}
	else {
		this.document.giveFocusTo( this.columnMenu ) ;
	}
	
	return promise ;
} ;



Inspector.prototype.onColumnMenuPageInit = function() {
	this.createFields() ;
} ;



Inspector.prototype.createFields = function() {
	var current = this.inspectStack[ this.inspectStack.length - 1 ] ,
		subObject = current.object ;

	for ( let fieldText of this.fieldTextList ) { fieldText.destroyNoRedraw() ; }
	this.fieldTextList.length = 0 ;

	for ( let button of this.columnMenu.buttons ) {
		if ( button.def.internalRole ) { continue ; }

		let fieldTextContent , fieldTextAttr ;
		let value = subObject[ button.def.value ] ;

		if ( value && typeof value === 'object' ) {
			let proto = Object.getPrototypeOf( value ) ;

			if ( Array.isArray( value ) ) {
				fieldTextContent = proto?.constructor?.name ?? '<Array>' ;
				fieldTextContent =
					proto?.constructor?.name ? '<' + proto.constructor.name + '>' :
					fieldTextContent = '<unknown array> ' ;

				if ( value.length <= 10 ) {
					fieldTextContent += ' ' + string.format( "%[1]n" , value ) ;
				}
				else {
					fieldTextContent += ' [...]' ;
				}
			}
			else {
				fieldTextContent =
					! proto ? '<null>' :
					proto.constructor?.name ? '<' + proto.constructor.name + '>' :
					fieldTextContent = '<unknown object> ' ;

				if ( Object.keys( value ).length <= 10 ) {
					fieldTextContent += ' ' + string.format( "%[1]n" , value ) ;
				}
				else {
					fieldTextContent += ' {...}' ;
				}
			}

			fieldTextAttr = { bgColor: '@orange--' , color: '@lighter-gray' } ;
		}
		else if ( typeof value === 'boolean' || value === null || value === undefined ) {
			fieldTextContent = '' + value ;
			fieldTextAttr = { bgColor: 'blue' , color: 'brightMagenta' , bold: true } ;
		}
		else if ( typeof value === 'number' ) {
			fieldTextContent = '' + value ;
			fieldTextAttr = { bgColor: 'blue' , color: 'brightCyan' } ;
		}
		else if ( typeof value === 'string' ) {
			fieldTextContent = '' + value ;
			fieldTextAttr = { bgColor: 'blue' , color: 'white' } ;
		}
		else {
			fieldTextContent = '' + value ;
			fieldTextAttr = { bgColor: 'blue' , color: 'gray' } ;
		}

		let fieldText = new Text( {
			internal: true ,
			parent: this ,
			x: button.outputX + button.outputWidth + 2 ,
			y: button.outputY ,
			attr: fieldTextAttr ,
			content: fieldTextContent ,
			noDraw: true
		} ) ;

		this.fieldTextList.push( fieldText ) ;
	}

	this.redraw() ;
} ;


Inspector.prototype.resetChildren = function() {
	for ( let fieldText of this.fieldTextList ) { fieldText.destroyNoRedraw() ; }
	this.fieldTextList.length = 0 ;
	this.columnMenu.destroyNoRedraw() ;
	this.breadCrumbText.destroyNoRedraw() ;
	this.redraw() ;
	promise.resolve() ;
} ;










Inspector.prototype.getValue = function() {
	var fields = {} ;

	this.labeledInputs.forEach( labeledInput => {
		fields[ labeledInput.key ] = labeledInput.getValue() ;
	} ) ;

	return { submit: this.submitValue , fields } ;
} ;



Inspector.prototype.onFocus = function( focus , type ) {
	if ( type === 'cycle' || type === 'backCycle' ) { return ; }

	if ( focus ) {
		// Defer to the next tick to avoid recursive events producing wrong listener order
		process.nextTick( () => {
			if ( this.focusChild ) { this.document.giveFocusTo( this.focusChild , 'delegate' ) ; }
			else { this.focusChild = this.focusNextChild() ; }
		} ) ;
	}
} ;



Inspector.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	this.submitValue = buttonValue ;
	this.emit( 'submit' , this.getValue() , action , this , button ) ;
} ;



const userActions = Inspector.prototype.userActions ;

userActions.previous = function() {
	this.focusChild = this.focusPreviousChild() ;
} ;

userActions.next = function() {
	this.focusChild = this.focusNextChild() ;
} ;

