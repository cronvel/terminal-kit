/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2014 Cédric Ronvel 
	
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



var exec = require( 'child_process' ).exec ;
var async = require( 'async-kit' ) ;



// Work localy, do not work over SSH
exports.getParentTerminalInfo = function getParentTerminalInfo( callback )
{
	var loop = 0 , name , terminfoName , pid = process.pid ;
	
	async.do( [
		function( asyncCallback ) {
			exec( 'ps -h -o ppid -p ' + pid , function( error , stdout ) {
				if ( error ) { asyncCallback( error ) ; return ; }
				pid = parseInt( stdout ) ;
				asyncCallback() ;
			} ) ;
		} ,
		function( asyncCallback ) {
			exec( 'ps -h -o comm -p ' + pid , function( error , stdout ) {
				if ( error ) { asyncCallback( error ) ; return ; }
				name = stdout.trim() ;
				asyncCallback() ;
			} ) ;
		}
	] )
	.while( function( error , results , asyncCallback ) {
		
		if ( error ) { asyncCallback( error ) ; return ; }
		
		//console.log( 'found:' , name , pid ) ;
		
		// Skip the first: it is the shell running node.js
		if ( ++ loop <= 1 ) { asyncCallback( undefined , true ) ; return ; }
		
		var t256color = process.env.TERM.match( /256color/ ) ? true : false ;
		
		switch ( name )
		{
			case 'linux' :
			case 'xterm' :
			case 'konsole' :
			case 'gnome-terminal':
			case 'Eterm':
			case 'eterm':
			case 'rxvt':
			case 'mrxvt':
			case 'aterm':
			case 'guake':
			case 'kuake':
			case 'tilda':
			case 'terminator':
			case 'terminology':
			case 'wterm':
			case 'xfce4-terminal' :
				terminfoName = t256color ? name + '-256color' : name ;
				break ;
			case 'login':
				name = 'linux' ;
				terminfoName = name ;
				break ;
			case 'gnome-terminal':
			case 'gnome-terminal-':
				name = 'gnome-terminal' ;
				terminfoName = t256color ? 'gnome-256color' : 'gnome' ;
				break ;
			default :
				if ( pid === 1 ) { asyncCallback( new Error( 'Terminal not found' ) ) ; }
				else { asyncCallback( undefined , true ) ; }
				return ;
		}
		
		asyncCallback( undefined , false ) ;
	} )
	.exec( function( error ) {
		if ( error ) { callback( error ) ; return ; }
		callback( undefined , terminfoName , name , pid ) ;
	} ) ;
} ;



// Work localy, do not work over SSH
exports.getDetectedTerminal = function getDetectedTerminal( callback )
{
	var self = this ;
	
	this.getParentTerminalInfo( function( error , codename , name , pid ) {
		if ( error )
		{
			// Do not issue error
			//callback( error , module.exports ) ;
			callback( undefined , module.exports ) ;
		}
		else
		{
			callback( undefined , self.createTerminal( {
				stdin: process.stdin ,
				stdout: process.stdout ,
				stderr: process.stderr ,
				generic: process.env.TERM ,
				app: codename ,
				appName: name ,
				pid: pid ,
				processSigwinch: true
			} ) ) ;
		}
	} ) ;
} ;
