#!/usr/bin/env node
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



/*
	The Object-viewer should have its own Document Element later.
	For instance this is just a proof of concept.
*/



const fs = require( 'fs' ) ;

const string = require( 'string-kit' ) ;
const Promise = require( 'seventh' ) ;

const termkit = require( '../..' ) ;
const term = termkit.terminal ;



if ( process.argv.length <= 2 ) {
	term.magenta( "Usage is: ./%s <file-path>\n" , path.basename( process.argv[ 1 ] ) ) ;
	process.exit( 1 ) ;
}

const filepath = process.argv[ 2 ] ;

var document ;



async function run() {
	term.clear() ;
	var content = await fs.promises.readFile( filepath , "utf8" ) ;
	var object = JSON.parse( content ) ;

	var stack = [ { object , key: '' } ] ;
	
	var document = term.createDocument( { palette: new termkit.Palette() } ) ;

	for ( ;; ) {
		await exploreSubObject( document , stack ) ;
	}
}



function exploreSubObject( document , stack ) {
	var promise = new Promise() ,
		current = stack[ stack.length - 1 ] ,
		subObject = current.object ,
		menuItems = [] ,
		textFields = [] ,
		path = stack.map( e => e.key ).join( '.' ) ;

	var breadCrumbText = new termkit.Text( {
		parent: document ,
		x: 0 ,
		y: 0 ,
		attr: { bgColor: 'cyan' , color: 'white' , bold: true } ,
		content: 'Path> ' + path
	} ) ;

	if ( stack.length > 1 ) {
		menuItems.push( {
			content: '..' ,
			internalRole: 'parent'
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

	var columnMenu = new termkit.ColumnMenu( {
		parent: document ,
		x: 0 ,
		y: 2 ,
		width: Math.round( document.outputWidth / 2.5 ) ,
		pageMaxHeight: document.outputHeight - 4 ,
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



	function onPageInit( page ) {
		for ( let text of textFields ) { text.destroy() ; }
		textFields.length = 0 ;

		for ( let button of columnMenu.buttons ) {
			if ( button.def.internalRole ) { continue ; }

			let textContent , textAttr ;
			let value = subObject[ button.def.value ] ;

			if ( value && typeof value === 'object' ) {
				let proto = Object.getPrototypeOf( value ) ;

				if ( Array.isArray( value ) ) {
					textContent = proto?.constructor?.name ?? '<Array>' ;
					textContent =
						proto?.constructor?.name ? '<' + proto.constructor.name + '>' :
						textContent = '<unknown array> ' ;

					if ( value.length <= 10 ) {
						textContent += ' ' + string.format( "%[1]n" , value ) ;
					}
					else {
						textContent += ' [...]' ;
					}
				}
				else {
					textContent =
						! proto ? '<null>' :
						proto.constructor?.name ? '<' + proto.constructor.name + '>' :
						textContent = '<unknown object> ' ;

					if ( Object.keys( value ).length <= 10 ) {
						textContent += ' ' + string.format( "%[1]n" , value ) ;
					}
					else {
						textContent += ' {...}' ;
					}
				}

				textAttr = { bgColor: '@orange--' , color: '@lighter-gray' } ;
			}
			else if ( typeof value === 'boolean' || value === null || value === undefined ) {
				textContent = '' + value ;
				textAttr = { bgColor: 'blue' , color: 'brightMagenta' , bold: true } ;
			}
			else if ( typeof value === 'number' ) {
				textContent = '' + value ;
				textAttr = { bgColor: 'blue' , color: 'brightCyan' } ;
			}
			else if ( typeof value === 'string' ) {
				textContent = '' + value ;
				textAttr = { bgColor: 'blue' , color: 'white' } ;
			}
			else {
				textContent = '' + value ;
				textAttr = { bgColor: 'blue' , color: 'gray' } ;
			}

			let text = new termkit.Text( {
				parent: document ,
				x: button.outputX + button.outputWidth + 2 ,
				y: button.outputY ,
				attr: textAttr ,
				content: textContent
			} ) ;

			textFields.push( text ) ;
		}
	}



	function onSubmit( buttonValue , action , menu , button ) {
		if ( button.internalRole === 'parent' ) {
			stack.pop() ;
			close() ;
			return ;
		}
		
		if ( subObject[ buttonValue ] && typeof subObject[ buttonValue ] === 'object' ) {
			current.fromKey = buttonValue ;
			stack.push( { object: subObject[ buttonValue ] , key: buttonValue } ) ;
			close() ;
			return ;
		}
	}



	function close() {
		for ( let text of textFields ) { text.destroy() ; }
		textFields.length = 0 ;
		columnMenu.destroy() ;
		breadCrumbText.destroy() ;
		promise.resolve() ;
	}



	columnMenu.on( 'submit' , onSubmit ) ;
	columnMenu.on( 'previousPage' , onPageInit ) ;
	columnMenu.on( 'nextPage' , onPageInit ) ;
	onPageInit( columnMenu.page ) ;

	if ( current.fromKey !== undefined ) {
		columnMenu.focusValue( current.fromKey ) ;
	}
	else {
		document.giveFocusTo( columnMenu ) ;
	}
	
	return promise ;
}



term.on( 'key' , function( key ) {
	switch( key ) {
		case 'CTRL_C' :
			term.grabInput( false ) ;
			term.hideCursor( false ) ;
			term.styleReset() ;
			term.clear() ;
			process.exit() ;
			break ;
	}
} ) ;

run() ;

