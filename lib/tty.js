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



//var exec = require( 'child_process' ).exec ;
var spawn = require( 'child_process' ).spawn ;
//var fs = require( 'fs' ) ;
//var tty = require( 'tty' ) ;

//var async = require( 'async-kit' ) ;




/* From 'ttys' module: (not used ATM)
var fs = require('fs')
var assert = require('assert')

if (tty.isatty(0)) {
  exports.stdin = process.stdin
} else {
  var ttyFd = fs.openSync('/dev/tty', 'r')
  assert(tty.isatty(ttyFd))
  exports.stdin = new tty.ReadStream(ttyFd)
  exports.stdin._type = 'tty'
}

if (tty.isatty(1)) {
  exports.stdout = process.stdout
} else {
  var ttyFd = fs.openSync('/dev/tty', 'w')
  assert(tty.isatty(ttyFd))
  exports.stdout = new tty.WriteStream(ttyFd)
  exports.stdout._type = 'tty'

  // Hack to have the stdout stream not keep the event loop alive.
  // See: https://github.com/joyent/node/issues/1726
  // XXX: remove/fix this once src/node.js does something different as well.
  if (exports.stdout._handle && exports.stdout._handle.unref) {
    exports.stdout._handle.unref();
  }
}
*/



/*
	getTTY( [stdin] , callback )
		* stdin: a stream that is the current STDIN of the terminal
		* callback( error , ttyPath , ttyIndex ) a node.js style callback, where:
			* error: error or not error, that is the question...
			* ttyPath: the path of the tty
			* ttyIndex: the index number of the tty, only if it is a /dev/tty*, /dev/pts/* return null
*/
exports.getTTY = function getTTY( stdin , callback )
{
	// Manage arguments
	if ( arguments.length === 1 )
	{
		callback = stdin ;
		stdin = process.stdin ;
	}
	
	
	// exec() does not work since the 'tty' command need a stdin that is a tty
	var ttyCommand = spawn( 'tty' , [] , {
		// use the current process.stdin, if not, the command will report 'not a TTY'
		stdio: [ stdin , null , null ]
	} ) ;
	
	var ttyIndex , ttyPath = '' ;
	
	ttyCommand.stdout.on( 'data' , function( data ) { ttyPath += data ; } ) ;
	
	ttyCommand.on( 'close' , function( code ) {
		// Trim the final \n
		ttyPath = ttyPath.slice( 0 , -1 ) ;
		var matches = ttyPath.match( /\/dev\/tty([0-9]*)/ ) ;
		ttyIndex = matches ? matches[ 1 ] || null : null ;
		callback( code , ttyPath , ttyIndex ) ;
	} ) ;
} ;




