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
const Text = require( './Text.js' ) ;
const Button = require( './Button.js' ) ;
const RowMenu = require( './RowMenu.js' ) ;
const ColumnMenu = require( './ColumnMenu.js' ) ;

const string = require( 'string-kit' ) ;



function Inspector( options ) {
	// Clone options if necessary
	options = ! options ? {} : options.internal ? options : Object.create( options ) ;
	options.internal = true ;

	this.onPropertiesColumnMenuPageInit = this.onPropertiesColumnMenuPageInit.bind( this ) ;
	this.onPropertiesColumnMenuSubmit = this.onPropertiesColumnMenuSubmit.bind( this ) ;
	this.onBreadCrumbRowMenuSubmit = this.onBreadCrumbRowMenuSubmit.bind( this ) ;

	if ( ! options.outputWidth && ! options.width ) { options.outputWidth = 78 ; }

	Element.call( this , options ) ;

	//this.submitValue = null ;

	this.inspectedObject = options.inspectedObject ;

	// TMP?
	this.breadCrumbText = null ;
	this.breadCrumbRowMenu = null ;
	this.propertiesColumnMenu = null ;
	this.valueFieldTextList = [] ;
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

	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;

	this.initChildren() ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Inspector' && ! options.noDraw ) { this.draw() ; }
}

module.exports = Inspector ;
Element.inherit( Inspector ) ;



Inspector.prototype.needInput = true ;



Inspector.prototype.keyBindings = {
	LEFT: 'levelUp' ,
	BACKSPACE: 'levelUp'
} ;



Inspector.prototype.textInputKeyBindings = {} ;
Inspector.prototype.selectInputKeyBindings = {} ;
Inspector.prototype.selectMultiInputKeyBindings = {} ;



// Create Button automatically
Inspector.prototype.initChildren = function( noInitLevel = false ) {
	var offsetX = 0 , offsetY = 0 ,
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

	this.inspectStack = [ { object: this.inspectedObject , key: '' } ] ;

	// Only initLevel if we are not a superclass of the object
	if ( this.elementType === 'Inspector' && ! noInitLevel ) { this.initLevel() ; }
} ;



// Init the UI for the current depth level, depending on the stack
Inspector.prototype.initLevel = function() {
	this.resetChildren() ;

	var current = this.inspectStack[ this.inspectStack.length - 1 ] ,
		subObject = current.object ,
		breadCrumbMenuItems = [] ,
		propertiesMenuItems = [] ,
		path = this.inspectStack.map( e => e.key ).join( '.' ) ;

	this.breadCrumbText = new Text( {
		internal: true ,
		parent: this ,
		x: this.outputX ,
		y: this.outputY ,
		attr: { bgColor: 'cyan' , color: 'white' , bold: true } ,
		content: 'Path> '
	} ) ;

	breadCrumbMenuItems =  this.inspectStack.map( ( stackItem , index ) => {
		var key = stackItem.key ;

		return {
			content: index ? key : '<root>' ,
			value: index
		} ;
	} ) ;

	this.breadCrumbRowMenu = new RowMenu( {
		internal: this ,
		parent: this ,
		x: this.breadCrumbText.outputX + this.breadCrumbText.outputWidth ,
		y: this.outputY ,
		width: this.outputWidth - this.breadCrumbText.outputWidth ,
		separator: '.' ,
		items: breadCrumbMenuItems
	} ) ;

	propertiesMenuItems = Object.keys( subObject ).map( key => {
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
	} ) ;

	this.propertiesColumnMenu = new ColumnMenu( {
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
		buttonBlurAttr: { bgColor: '@dark-gray' , color: 'white' , bold: true } ,
		/*
		buttonKeyBindings: {
			ENTER: 'submit' ,
			BACKSPACE: 'submit' ,
			LEFT: 'submit'
		} ,
		buttonActionKeyBindings: {
			BACKSPACE: 'levelUp' ,
			LEFT: 'levelUp'
		} ,
		*/
		items: propertiesMenuItems
	} ) ;

	this.propertiesColumnMenu.on( 'submit' , this.onPropertiesColumnMenuSubmit ) ;
	this.propertiesColumnMenu.on( 'previousPage' , this.onPropertiesColumnMenuPageInit ) ;
	this.propertiesColumnMenu.on( 'nextPage' , this.onPropertiesColumnMenuPageInit ) ;
	this.onPropertiesColumnMenuPageInit( this.propertiesColumnMenu.page ) ;

	this.breadCrumbRowMenu.on( 'submit' , this.onBreadCrumbRowMenuSubmit ) ;

	if ( current.fromKey !== undefined ) {
		this.propertiesColumnMenu.focusValue( current.fromKey ) ;
	}
	else {
		this.document.giveFocusTo( this.propertiesColumnMenu ) ;
	}
} ;



Inspector.prototype.createValueFieldTexts = function() {
	var current = this.inspectStack[ this.inspectStack.length - 1 ] ,
		subObject = current.object ;

	for ( let valueFieldText of this.valueFieldTextList ) { valueFieldText.destroyNoRedraw() ; }
	this.valueFieldTextList.length = 0 ;

	for ( let button of this.propertiesColumnMenu.buttons ) {
		if ( button.def.internalRole ) { continue ; }

		let valueFieldTextContent , valueFieldTextAttr ;
		let value = subObject[ button.def.value ] ;

		if ( value && typeof value === 'object' ) {
			let proto = Object.getPrototypeOf( value ) ;

			if ( Array.isArray( value ) ) {
				valueFieldTextContent = proto?.constructor?.name ?? '<Array>' ;
				valueFieldTextContent =
					proto?.constructor?.name ? '<' + proto.constructor.name + '>' :
					valueFieldTextContent = '<unknown array> ' ;

				if ( value.length <= 10 ) {
					valueFieldTextContent += ' ' + string.format( "%[1]n" , value ) ;
				}
				else {
					valueFieldTextContent += ' [...]' ;
				}
			}
			else {
				valueFieldTextContent =
					! proto ? '<null>' :
					proto.constructor?.name ? '<' + proto.constructor.name + '>' :
					valueFieldTextContent = '<unknown object> ' ;

				if ( Object.keys( value ).length <= 10 ) {
					valueFieldTextContent += ' ' + string.format( "%[1]n" , value ) ;
				}
				else {
					valueFieldTextContent += ' {...}' ;
				}
			}

			valueFieldTextAttr = { bgColor: '@orange--' , color: '@lighter-gray' } ;
		}
		else if ( typeof value === 'boolean' || value === null || value === undefined ) {
			valueFieldTextContent = '' + value ;
			valueFieldTextAttr = { bgColor: 'blue' , color: 'brightMagenta' , bold: true } ;
		}
		else if ( typeof value === 'number' ) {
			valueFieldTextContent = '' + value ;
			valueFieldTextAttr = { bgColor: 'blue' , color: 'brightCyan' } ;
		}
		else if ( typeof value === 'string' ) {
			valueFieldTextContent = '' + value ;
			valueFieldTextAttr = { bgColor: 'blue' , color: 'white' } ;
		}
		else {
			valueFieldTextContent = '' + value ;
			valueFieldTextAttr = { bgColor: 'blue' , color: 'gray' } ;
		}

		let valueFieldText = new Text( {
			internal: true ,
			parent: this ,
			x: button.outputX + button.outputWidth + 2 ,
			y: button.outputY ,
			width: this.outputWidth - button.outputWidth - 2 ,
			attr: valueFieldTextAttr ,
			content: valueFieldTextContent ,
			contentEllipsis: '…' ,
			noDraw: true
		} ) ;

		this.valueFieldTextList.push( valueFieldText ) ;
	}

	this.redraw() ;
} ;



// Delete all children element
Inspector.prototype.resetChildren = function() {
	if ( ! this.valueFieldTextList.length && ! this.propertiesColumnMenu && ! this.breadCrumbText ) { return ; }

	for ( let valueFieldText of this.valueFieldTextList ) { valueFieldText.destroyNoRedraw() ; }
	this.valueFieldTextList.length = 0 ;

	if ( this.propertiesColumnMenu ) {
		this.propertiesColumnMenu.destroyNoRedraw() ;
		this.propertiesColumnMenu = null ;
	}

	if ( this.breadCrumbRowMenu ) {
		this.breadCrumbRowMenu.destroyNoRedraw() ;
		this.breadCrumbRowMenu = null ;
	}

	if ( this.breadCrumbText ) {
		this.breadCrumbText.destroyNoRedraw() ;
		this.breadCrumbText = null ;
	}

	this.redraw() ;
} ;



// Not very useful, but could be later
Inspector.prototype.getValue = function() { return this.inspectedObject ; } ;



Inspector.prototype.levelUp = function() {
	if ( this.inspectStack.length <= 1 ) { return ; }
	this.inspectStack.pop() ;
	this.initLevel() ;
}



Inspector.prototype.onPropertiesColumnMenuPageInit = function() {
	this.createValueFieldTexts() ;
} ;



Inspector.prototype.onPropertiesColumnMenuSubmit = function( buttonValue , action , menu , button ) {
	if ( action ) {
		if ( action === 'levelUp' ) {
			if ( this.inspectStack.length <= 1 ) { return ; }
			this.inspectStack.pop() ;
		}
	}
	else if ( button.internalRole === 'parent' ) {
		if ( this.inspectStack.length <= 1 ) { return ; }
		this.inspectStack.pop() ;
	}
	else {
		let current = this.inspectStack[ this.inspectStack.length - 1 ] ,
			subObject = current.object ;

		if ( subObject[ buttonValue ] && typeof subObject[ buttonValue ] === 'object' ) {
			current.fromKey = buttonValue ;
			this.inspectStack.push( { object: subObject[ buttonValue ] , key: buttonValue } ) ;
		}
	}

	this.initLevel() ;
} ;



Inspector.prototype.onBreadCrumbRowMenuSubmit = function( buttonValue , action , menu , button ) {
	if ( buttonValue === this.inspectStack.length - 1 ) { return ; }
	this.inspectStack.length = buttonValue + 1 ;
	this.initLevel() ;
} ;



Inspector.prototype.onFocus = function( focus , type ) {
	if ( type === 'cycle' || type === 'backCycle' ) { return ; }

	if ( focus ) {
		// Defer to the next tick to avoid recursive events producing wrong listener order
		process.nextTick( () => {
			if ( this.propertiesColumnMenu ) {
				this.document.giveFocusTo( this.propertiesColumnMenu , 'delegate' ) ;
			}
			else {
				this.focusChild = this.focusNextChild() ;
			}
		} ) ;
	}
} ;



Inspector.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	// There is no submit button for instance, it will be used once we can edit values
	/*
		this.submitValue = buttonValue ;
		this.emit( 'submit' , this.getValue() , action , this , button ) ;
	*/
} ;



const userActions = Inspector.prototype.userActions ;

userActions.levelUp = function() {
	this.levelUp() ;
} ;

