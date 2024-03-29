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



/* Base class for menus (ColumnMenu, RowMenu, etc) */



const tree = require( 'tree-kit' ) ;

const Element = require( './Element.js' ) ;
const Button = require( './Button.js' ) ;



function BaseMenu( options = {} ) {
	Element.call( this , options ) ;

	this.backgroundAttr = options.backgroundAttr || { bgColor: 'white' , color: 'black' } ;
	this.contentEllipsis = options.contentEllipsis === true ? '…' : options.contentEllipsis || '…' ;
	this.previousPageContent = options.previousPageContent || '«' ;
	this.previousPageContentHasMarkup = !! options.previousPageContentHasMarkup ;
	this.nextPageContent = options.nextPageContent || '»' ;
	this.nextPageContentHasMarkup = !! options.nextPageContentHasMarkup ;
	this.itemsDef = options.items || [] ;
	this.previousPageDef = options.previousPage ;
	this.nextPageDef = options.nextPage ;
	this.masterDef = options.master ;
	this.separatorDef = options.separator ;
	this.buttons = [] ;
	this.hotkeyToButtonIndex = new Map() ;
	this.focusChild = null ;

	// Pagination
	this.page = 0 ;
	this.maxPage = 0 ;

	// Submenu
	this.hasSubmenu = !! options.submenu ;
	this.isSubmenu = !! options.isSubmenu ;
	this.submenu = null ;	// A child (column) menu
	this.submenuParentButton = null ;	// The button that opened the submenu
	this.submenuOptions = null ;

	if ( this.hasSubmenu ) {
		// Use tree-kit because 'options' comes from an Object.create() and has almost no owned properties
		this.submenuOptions = tree.extend( null , {} , options , {
			// Things to clear or to force
			internal: true ,
			parent: null ,
			items: null
			//x: undefined , outputX: undefined ,
			//y: undefined , outputY: undefined ,
			//width: undefined , outputWidth: undefined ,
			//height: undefined , outputHeight: undefined ,
			//submenu: false
		} ) ;

		if ( options.submenu && typeof options.submenu === 'object' ) {
			Object.assign( this.submenuOptions , options.submenu ) ;
		}
	}

	this.onButtonSubmit = this.onButtonSubmit.bind( this ) ;
	this.onButtonToggle = this.onButtonToggle.bind( this ) ;
	this.onButtonFocus = this.onButtonFocus.bind( this ) ;
	this.onButtonBlinked = this.onButtonBlinked.bind( this ) ;
	this.onSubmenuSubmit = this.onSubmenuSubmit.bind( this ) ;
	this.onWheel = this.onWheel.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;

	// Global default attributes
	this.buttonBlurAttr = options.buttonBlurAttr || this.defaultOptions.buttonBlurAttr || { bgColor: 'black' , color: 'white' , bold: true } ;
	this.buttonEvenBlurAttr = options.buttonEvenBlurAttr || null ;
	this.buttonFocusAttr = options.buttonFocusAttr || this.defaultOptions.buttonFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } ;
	this.buttonDisabledAttr = options.buttonDisabledAttr || this.defaultOptions.buttonDisabledAttr || { bgColor: 'black' , color: 'gray' , bold: true } ;
	this.buttonSubmittedAttr = options.buttonSubmittedAttr || this.defaultOptions.buttonSubmittedAttr || { bgColor: 'gray' , color: 'brightWhite' , bold: true } ;
	this.buttonTurnedOnBlurAttr = options.buttonTurnedOnBlurAttr || this.defaultOptions.buttonTurnedOnBlurAttr || { bgColor: 'cyan' } ;
	this.buttonTurnedOnFocusAttr = options.buttonTurnedOnFocusAttr || this.defaultOptions.buttonTurnedOnFocusAttr || { bgColor: 'brightCyan' , color: 'gray' , bold: true } ;
	this.buttonTurnedOffBlurAttr = options.buttonTurnedOffBlurAttr || this.defaultOptions.buttonTurnedOffBlurAttr || { bgColor: 'gray' , dim: true } ;
	this.buttonTurnedOffFocusAttr = options.buttonTurnedOffFocusAttr || this.defaultOptions.buttonTurnedOffFocusAttr || { bgColor: 'white' , color: 'black' , bold: true } ;

	// Padding
	this.blurLeftPadding = options.blurLeftPadding ?? options.leftPadding ?? '' ;
	this.blurRightPadding = options.blurRightPadding ?? options.rightPadding ?? '' ;
	this.focusLeftPadding = options.focusLeftPadding ?? options.leftPadding ?? '' ;
	this.focusRightPadding = options.focusRightPadding ?? options.rightPadding ?? '' ;
	this.disabledLeftPadding = options.disabledLeftPadding ?? options.leftPadding ?? '' ;
	this.disabledRightPadding = options.disabledRightPadding ?? options.rightPadding ?? '' ;
	this.submittedLeftPadding = options.submittedLeftPadding ?? options.leftPadding ?? '' ;
	this.submittedRightPadding = options.submittedRightPadding ?? options.rightPadding ?? '' ;
	this.turnedOnBlurLeftPadding = options.turnedOnBlurLeftPadding ?? options.turnedOnLeftPadding ?? this.blurLeftPadding ;
	this.turnedOnBlurRightPadding = options.turnedOnBlurRightPadding ?? options.turnedOnRightPadding ?? this.blurRightPadding ;
	this.turnedOffBlurLeftPadding = options.turnedOffBlurLeftPadding ?? options.turnedOffLeftPadding ?? this.blurLeftPadding ;
	this.turnedOffBlurRightPadding = options.turnedOffBlurRightPadding ?? options.turnedOffRightPadding ?? this.blurRightPadding ;
	this.turnedOnFocusLeftPadding = options.turnedOnFocusLeftPadding ?? options.turnedOnLeftPadding ?? this.focusLeftPadding ;
	this.turnedOnFocusRightPadding = options.turnedOnFocusRightPadding ?? options.turnedOnRightPadding ?? this.focusRightPadding ;
	this.turnedOffFocusLeftPadding = options.turnedOffFocusLeftPadding ?? options.turnedOffLeftPadding ?? this.focusLeftPadding ;
	this.turnedOffFocusRightPadding = options.turnedOffFocusRightPadding ?? options.turnedOffRightPadding ?? this.focusRightPadding ;
	this.paddingHasMarkup = !! options.paddingHasMarkup ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }
	if ( options.buttonKeyBindings ) { this.buttonKeyBindings = options.buttonKeyBindings ; }
	if ( options.buttonActionKeyBindings ) { this.buttonActionKeyBindings = options.buttonActionKeyBindings ; }
	if ( options.toggleButtonKeyBindings ) { this.toggleButtonKeyBindings = options.toggleButtonKeyBindings ; }
	if ( options.toggleButtonActionKeyBindings ) { this.toggleButtonActionKeyBindings = options.toggleButtonActionKeyBindings ; }

	this.on( 'key' , this.onKey ) ;
	this.on( 'wheel' , this.onWheel ) ;
	this.on( 'focus' , this.onFocus ) ;
}

module.exports = BaseMenu ;
Element.inherit( BaseMenu ) ;



BaseMenu.prototype.needInput = true ;



BaseMenu.prototype.destroy = function( isSubDestroy , noDraw = false ) {
	if ( this.destroyed ) { return ; }
	if ( this.submenu ) { this.submenu.destroy( true ) ; }

	Element.prototype.destroy.call( this , isSubDestroy , noDraw ) ;
} ;



BaseMenu.prototype.focusFirstPageItem = function( focusType ) {
	this.focusChild = this.children[ this.page ? 1 : 0 ] ;
	var focusAware = this.document.giveFocusTo_( this.focusChild , focusType ) ;
	if ( ! focusAware ) { this.document.focusNext() ; }
} ;



BaseMenu.prototype.focusLastPageItem = function( focusType ) {
	this.focusChild = this.children[  this.page === this.maxPage  ?  this.children.length - 1  :  this.children.length - 2  ] ;
	var focusAware = this.document.giveFocusTo_( this.focusChild , focusType ) ;
	if ( ! focusAware ) { this.document.focusNext() ; }
} ;



BaseMenu.prototype.previousPage = function( focusType ) {
	if ( this.maxPage && this.page > 0 ) {
		this.page -- ;
		this.initPage() ;
		this.focusChild = this.children[ this.children.length - 2 ] ;
		let focusAware = this.document.giveFocusTo_( this.focusChild , focusType ) ;
		if ( ! focusAware ) { this.document.focusPrevious() ; }
		this.updateDraw() ;
		this.emit( 'previousPage' , this.page , this ) ;
	}
} ;



BaseMenu.prototype.nextPage = function( focusType ) {
	if ( this.maxPage && this.page < this.maxPage ) {
		this.page ++ ;
		this.initPage() ;
		this.focusChild = this.children[ 1 ] ;
		let focusAware = this.document.giveFocusTo_( this.focusChild , focusType ) ;
		if ( ! focusAware ) { this.document.focusNext() ; }
		this.updateDraw() ;
		this.emit( 'nextPage' , this.page , this ) ;
	}
} ;



BaseMenu.prototype.toPage = function( page , focusType ) {
	if ( this.maxPage && page !== this.page ) {
		this.page = page ;
		this.initPage() ;
		this.focusChild = this.children[ this.page ? 1 : 0 ] ;
		let focusAware = this.document.giveFocusTo_( this.focusChild , focusType ) ;
		if ( ! focusAware ) { this.document.focusNext() ; }
		this.updateDraw() ;
	}
} ;



BaseMenu.prototype.focusValue = function( itemValue , focusType , forceInitPage = false ) {
	var focusAware , itemDef , item ;

	itemDef = this.itemsDef.find( it => ! it.disabled && it.value === itemValue ) ;
	if ( ! itemDef ) { return ; }

	if ( this.page !== itemDef.page || forceInitPage ) {
		this.page = itemDef.page ;
		this.initPage() ;
	}

	item = this.buttons.find( it => it.def === itemDef ) ;
	if ( ! item ) { return ; }	// Not possible, but well...

	this.focusChild = item ;

	focusAware = this.document.giveFocusTo_( this.focusChild , focusType ) ;
	if ( ! focusAware ) { this.document.focusNext() ; }

	this.draw() ;
} ;



BaseMenu.prototype.setItem = function( itemValue , itemOptions ) {
	var itemDef , focusValue ;

	itemDef = this.itemsDef.find( it => it.value === itemValue ) ;
	if ( ! itemDef ) { return false ; }

	Object.assign( itemDef , itemOptions ) ;

	focusValue = this.focusChild && this.focusChild.value ;

	this.initChildren( true ) ;

	if ( focusValue !== undefined ) {
		// Note: .focusValue() call .draw() behind the scene, and last argument force a .initPage() call
		this.focusValue( focusValue , 'refocus' , true ) ;
	}
	else {
		this.initPage() ;
		this.draw() ;
	}

	return true ;
} ;



BaseMenu.prototype.onWheel = function( data ) {
	if ( data.yDirection < 0 ) { this.previousPage( 'backCycle' ) ; }
	else if ( data.yDirection > 0 ) { this.nextPage( 'cycle' ) ; }
} ;



BaseMenu.prototype.onFocus = function( focus , type ) {
	if ( type === 'cycle' || type === 'backCycle' ) { return ; }
	//if ( type === 'backCycle' ) { return ; }

	if ( focus ) {
		// Defer to the next tick to avoid recursive events producing wrong listener order
		process.nextTick( () => {
			let forceType = type === 'clear' ? type : undefined ;

			if ( this.focusChild && ! this.focusChild.destroyed ) {
				this.document.giveFocusTo( this.focusChild , forceType || 'delegate' ) ;
			}
			else {
				this.focusChild = this.focusNextChild( undefined , forceType ) ;
			}
		} ) ;
	}
} ;



BaseMenu.prototype.onButtonSubmit = function( buttonValue , action , button ) {
	switch ( button.internalRole ) {
		case 'previousPage' :
			this.previousPage() ;
			break ;
		case 'nextPage' :
			this.nextPage() ;
			break ;
		default :
			if ( this.hasSubmenu && button.def.items ) {
				if ( this.submenuOptions.openOn === 'parentSubmit' ) {
					this.openSubmenu( button.value , button ) ;
				}

				if ( this.submenu ) {
					this.document.giveFocusTo( this.submenu ) ;
				}
			}
			else {
				this.emit( 'submit' , buttonValue , action , this , button ) ;
			}
	}
} ;



BaseMenu.prototype.onButtonBlinked = function( buttonValue , action , button ) {
	switch ( button.internalRole ) {
		case 'previousPage' :
		case 'nextPage' :
			break ;
		default :
			if ( this.hasSubmenu && button.def.items ) {
				if ( this.submenuOptions.openOn === 'parentBlinked' ) {
					this.openSubmenu( button.value , button ) ;
				}
			}
			else {
				this.emit( 'blinked' , buttonValue , action , this , button ) ;
			}
	}
} ;



BaseMenu.prototype.onButtonFocus = function( focus , type , button ) {
	switch ( button.internalRole ) {
		case 'previousPage' :
		case 'nextPage' :
			break ;
		default :
			if ( focus && this.hasSubmenu && button.def.items && this.submenuOptions.openOn === 'parentFocus' ) {
				this.openSubmenu( button.value , button ) ;
			}

			this.emit( 'itemFocus' , button.value , focus , button ) ;
	}
} ;



BaseMenu.prototype.onSubmenuSubmit = function( buttonValue , action , submenu , button ) {
	submenu.once( 'blinked' , ( buttonValue_ , reserved , submenu_ , button_ ) => {
		if ( this.submenuOptions.closeOn === 'childSubmit' ) {
			this.closeSubmenu() ;
			this.document.giveFocusTo( this.submenuParentButton || this ) ;
		}
		this.emit( 'blinked' , buttonValue_ , reserved , this , button ) ;
	} ) ;

	this.emit( 'submit' , buttonValue , action , this , button ) ;
} ;



// Userland: .submenu( itemValue )
// Internal: .submenu( itemValue , button )
BaseMenu.prototype.openSubmenu = function( itemValue , button = null ) {
	var x , y , width , height ,
		itemDef = button ? this.itemsDef.find( it => it === button.def ) :
		this.itemsDef.find( it => it.value === itemValue ) ;

	if ( ! itemDef || ! itemDef.items || ! itemDef.items.length ) { return ; }

	if ( this.submenu ) {
		if ( this.submenu.def === itemDef ) { return ; }
		this.closeSubmenu() ;
	}

	this.submenuParentButton = button ;

	switch ( this.submenuOptions.disposition ) {
		case 'overwrite' :
			x = this.outputX ;
			y = this.outputY ;
			//width = this.outputWidth ;
			width = this.submenuOptions.width ;
			//height = this.outputHeight ;
			height = this.submenuOptions.height ;
			break ;
		case 'right' :
		default :
			x = this.outputX + this.outputWidth ;
			y = this.outputY ;
			width = this.submenuOptions.width || this.outputWidth ;
			break ;
	}

	if ( this.submenuOptions.hideParent ) {
		this.children.forEach( e => e.hidden = true ) ;
	}

	this.submenu = new this.constructor( Object.assign( {} , this.submenuOptions , {
		internal: true ,
		parent: this ,
		isSubmenu: true ,
		def: itemDef ,
		outputX: x ,
		outputY: y ,
		outputWidth: width ,
		outputHeight: height ,
		items: itemDef.items ,
		noDraw: true
	} ) ) ;

	// Draw instead of outerDraw?
	//this.draw() ;
	this.outerDraw() ;

	if ( this.submenuOptions.focusOnOpen ) {
		this.document.giveFocusTo( this.submenu ) ;
	}

	this.submenu.on( 'submit' , this.onSubmenuSubmit ) ;

	// Re-emit itemFocus from child
	this.submenu.on( 'itemFocus' , ( ... args ) => this.emit( 'itemFocus' , ... args ) ) ;
} ;



BaseMenu.prototype.closeSubmenu = function() {
	if ( ! this.submenu ) { return false ; }
	if ( this.submenuOptions.hideParent ) { this.children.forEach( e => e.hidden = false ) ; }
	this.submenu.destroy() ;
	this.submenu = null ;
	return true ;
} ;



// Should be redefined in the derivative class
BaseMenu.prototype.defaultOptions = {} ;
BaseMenu.prototype.buttonKeyBindings = {} ;
BaseMenu.prototype.buttonActionKeyBindings = {} ;
BaseMenu.prototype.toggleButtonKeyBindings = {} ;
BaseMenu.prototype.toggleButtonActionKeyBindings = {} ;
BaseMenu.prototype.initPage = function() {} ;
BaseMenu.prototype.onButtonToggle = function() {} ;
BaseMenu.prototype.childUseParentKeyValue = false ;



const userActions = BaseMenu.prototype.userActions ;

userActions.character =
userActions.specialKey = function( key ) {
	var index = this.hotkeyToButtonIndex.get( key ) ;
	if ( index !== undefined && this.buttons[ index ] ) {
		if ( this.document ) {
			this.document.giveFocusTo( this.buttons[ index ] ) ;
		}
		this.buttons[ index ].submit() ;
	}
	else {
		// Force bubble
		return false ;
	}
} ;

userActions.previous = function() {
	this.focusChild = this.focusPreviousChild( ! this.maxPage ) ;
	if ( this.focusChild === this.children[ 0 ] && this.maxPage && this.page > 0 ) {
		this.previousPage( 'backCycle' ) ;
	}
} ;

userActions.next = function() {
	this.focusChild = this.focusNextChild( ! this.maxPage ) ;
	if ( this.focusChild === this.children[ this.children.length - 1 ] && this.maxPage && this.page < this.maxPage ) {
		this.nextPage( 'cycle' ) ;
	}
} ;

userActions.previousPage = function() {
	if ( this.maxPage && this.page > 0 ) {
		this.previousPage( 'backCycle' ) ;
	}
	else {
		this.focusFirstPageItem( 'backCycle' ) ;
	}
} ;

userActions.nextPage = function() {
	if ( this.maxPage && this.page < this.maxPage ) {
		this.nextPage( 'cycle' ) ;
	}
	else {
		this.focusLastPageItem( 'cycle' ) ;
	}
} ;

userActions.firstPage = function() {
	if ( this.maxPage && this.page !== 0 ) {
		this.toPage( 0 , 'backCycle' ) ;
	}
	else {
		this.focusFirstPageItem( 'backCycle' ) ;
	}
} ;

userActions.lastPage = function() {
	if ( this.maxPage && this.page !== this.maxPage ) {
		this.toPage( this.maxPage , 'cycle' ) ;
	}
	else {
		this.focusLastPageItem( 'cycle' ) ;
	}
} ;

userActions.firstPageItem = function() {
	this.focusFirstPageItem( 'backCycle' ) ;
} ;

userActions.lastPageItem = function() {
	this.focusLastPageItem( 'cycle' ) ;
} ;

userActions.parentMenu = function() {
	if ( this.isSubmenu ) {
		// Back up the parent, because current instance can be destroyed by parent.closeSubmenu()
		let parent = this.parent ;
		if ( this.parent.submenuOptions.hideParent ) { this.parent.closeSubmenu() ; }
		parent.document.giveFocusTo( parent ) ;
	}
	else {
		return false ;
	}
} ;

userActions.submenu = function() {
	if ( this.hasSubmenu && this.focusChild?.def?.items ) {
		this.openSubmenu( this.focusChild.value , this.focusChild ) ;
		if ( this.submenu ) { this.document.giveFocusTo( this.submenu ) ; }
	}
	else {
		return false ;
	}
} ;

