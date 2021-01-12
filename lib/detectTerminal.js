/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

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



const Promise = require( 'seventh' ) ;
const exec = require( 'child_process' ).exec ;
const path = require( 'path' ) ;
const os = require( 'os' ) ;

const termkit = require( './termkit.js' ) ;



// Try to guess the terminal without any async system call, using TERM and COLORTERM.
// Argument 'unpipe' is used when we will get a TTY even if we haven't one ATM.
exports.guessTerminal = function( unpipe ) {
	var envVar , version ;

	var isSSH = !! process.env.SSH_CONNECTION ;
	var isTTY = !! process.stdout.isTTY ;

	if ( ! isTTY && ! unpipe ) {
		return {
			isTTY: isTTY ,
			isSSH: isSSH ,
			appId: 'none' ,
			safe: true ,
			generic: 'none'
		} ;
	}

	var platform = os.platform() ;
	var t256color = ( process.env.TERM && process.env.TERM.match( /256/ ) ) ||
		( process.env.COLORTERM && process.env.COLORTERM.match( /256/ ) ) ;
	var tTrueColor = process.env.COLORTERM && process.env.COLORTERM.match( /^(truecolor|24bits?)$/ ) ;

	var appId =
		process.env.COLORTERM && ! tTrueColor ? process.env.COLORTERM :
		process.env.TERM_PROGRAM ? process.env.TERM_PROGRAM :
		process.env.TERM ;

	if ( platform === 'darwin' ) { appId = path.parse( appId ).name ; }

	// safe is true if we are sure about our guess
	var safe =
		appId !== process.env.TERM
		|| ( process.env.TERM && process.env.TERM !== 'xterm' && process.env.TERM !== 'xterm-256color' ) ;

	var generic = appId ;

	switch ( appId ) {
		case 'xterm' :
		case 'xterm-256color' :
			if ( safe ) { break ; }

			if ( tTrueColor ) {
				appId = generic = 'xterm-truecolor' ;
			}

			// Many terminal advertise them as xterm, we will try to guess some of them here,
			// using environment variable
			if ( process.env.VTE_VERSION ) {
				version = parseInt( process.env.VTE_VERSION , 10 ) ;

				if ( version >= 3803 ) {
					appId = t256color || tTrueColor ? 'gnome-256color' : 'gnome' ;
					safe = true ;
					break ;
				}
			}

			// BTW OSX terminals advertise them as xterm, while having their own key mapping...
			if ( platform === 'darwin' ) {
				appId = 'osx-256color' ;
				break ;
			}

			for ( envVar in process.env ) {
				if ( envVar.match( /KONSOLE/ ) ) {
					appId = t256color || tTrueColor ? 'konsole-256color' : 'konsole' ;
					safe = true ;
					break ;
				}
			}

			break ;

		case 'linux' :
		case 'aterm' :
		case 'kuake' :
		case 'tilda' :
		case 'terminology' :
		case 'wterm' :
		case 'mrxvt' :
			break ;

		case 'gnome' :
		case 'gnome-256color' :
		case 'gnome-terminal' :
		case 'gnome-terminal-256color' :
		case 'terminator' :	// it uses gnome terminal lib
		case 'guake' :	// same here
			appId = t256color || tTrueColor ? 'gnome-256color' : 'gnome' ;
			break ;
		case 'konsole' :
			appId = t256color || tTrueColor ? 'konsole-256color' : 'konsole' ;
			break ;
		case 'rxvt' :
		case 'rxvt-xpm' :
		case 'rxvt-unicode-256color' :
		case 'urxvt256c' :
		case 'urxvt256c-ml' :
		case 'rxvt-unicode' :
		case 'urxvt' :
		case 'urxvt-ml' :
			if ( process.env.TERM === 'rxvt' ) { appId = 'rxvt-256color' ; }
			else { appId = t256color || tTrueColor ? 'rxvt-256color' : 'rxvt' ; }
			break ;
		case 'xfce' :
		case 'xfce-terminal' :
		case 'xfce4-terminal' :
			appId = 'xfce' ;
			break ;
		case 'eterm' :
		case 'Eterm' :
			appId = t256color || tTrueColor ? 'eterm-256color' : 'eterm' ;
			break ;
		case 'atomic-terminal' :
			appId = 'atomic-terminal' ;
			break ;
		case 'xterm-kitty' :
		case 'kitty' :
			appId = 'kitty' ;
			break ;

			// OSX Terminals

		case 'iTerm' :
		case 'iterm' :
		case 'iTerm2' :
		case 'iterm2' :
		case 'Terminal' :
		case 'terminal' :
		case 'Apple_Terminal' :
			appId = 'osx-256color' ;
			break ;

		default :
			if ( ! appId ) { generic = 'unknown' ; }
			else { generic = appId = generic.toLowerCase() ; }
			break ;
	}

	return {
		isTTY , isSSH , appId , safe , generic: safe ? appId : generic
	} ;
} ;



function getParentProcess( pid ) {
	var parentPid , appName ;

	return new Promise( ( resolve , reject ) => {
		exec( 'ps -h -o ppid -p ' + pid , ( error , stdout ) => {
			if ( error ) { reject( error ) ; return ; }

			parentPid = parseInt( stdout.match(  /[0-9]+/gm )[ 0 ] , 10 ) ;
			//console.error( "--- Parent PID: " , parentPid , stdout.match(  /[0-9]+/gm ) ) ;
			if( ! parentPid ) { reject( new Error( "Couldn't get parent PID" ) ) ; return ; }

			exec( 'ps -h -o comm -p ' + parentPid , ( error_ , stdout_ ) => {
				if ( error_ ) { reject( error_ ) ; return ; }

				appName = stdout_.trim() ;
				//console.error( "+++ appName: " , appName ) ;
				resolve( { pid: parentPid , appName } ) ;
			} ) ;
		} ) ;
	} ) ;
}



// Work localy, do not work over SSH
exports.getParentTerminalInfo = async function( callback ) {
	var loopAgain , error , appName , appNames = [] , appId , pid = process.pid ;

	if ( process.env.SSH_CONNECTION ) {
		error = new Error( 'SSH connection detected, .getParentTerminalInfo() is useless in this context.' ) ;
		if ( callback ) { callback( error ) ; return ; }
		throw error ;
	}

	var platform = os.platform() ;
	var t256color = ( process.env.TERM && process.env.TERM.match( /256/ ) ) ||
		( process.env.COLORTERM && process.env.COLORTERM.match( /256/ ) ) ;
	var tTrueColor = process.env.COLORTERM && process.env.COLORTERM.match( /^(truecolor|24bits?)$/ ) ;

	try {
		loopAgain = true ;

		while ( loopAgain ) {
			( { appName , pid } = await getParentProcess( pid ) ) ;

			//console.log( 'found:' , appName , pid ) ;

			if ( platform === 'darwin' ) { appName = path.parse( appName ).name ; }
			appNames.push( appName ) ;

			// Do NOT skip the first, there are case where the terminal may run directly node.js without any shell in between
			//if ( ++ loop <= 1 ) { asyncCallback( undefined , true ) ; return ; }

			loopAgain = false ;

			switch ( appName ) {
				case 'linux' :
				case 'xterm' :
				case 'konsole' :
				case 'gnome-terminal' :
				case 'aterm' :
				case 'guake' :
				case 'kuake' :
				case 'tilda' :
				case 'terminology' :
				case 'wterm' :
				case 'mrxvt' :
					appId = t256color || tTrueColor ? appName + '-256color' : appName ;
					break ;
				case 'atomic-terminal' :
					appId = appName ;
					break ;
				case 'login' :
					appName = 'linux' ;
					appId = appName ;
					break ;
				// Use terminator as gnome-terminal, since it uses the gnome-terminal renderer
				case 'terminator' :
					appId = t256color || tTrueColor ? 'gnome-256color' : 'gnome' ;
					break ;
				// Use rxvt as xterm-256color
				case 'rxvt' :
				case 'urxvt256c' :
				case 'urxvt256c-ml' :
					appId = 'rxvt-256color' ;
					break ;
				// Use rxvt as xterm
				case 'urxvt' :
				case 'urxvt-ml' :
					appId = 'rxvt' ;
					break ;
				// xfce4-terminal
				case 'xfce4-terminal' :
					appId = 'xfce' ;
					break ;
				case 'gnome-terminal-' :
					appName = 'gnome-terminal' ;
					appId = t256color || tTrueColor ? 'gnome-256color' : 'gnome' ;
					break ;
				case 'Eterm' :
				case 'eterm' :
					appName = 'Eterm' ;
					appId = t256color || tTrueColor ? 'eterm-256color' : 'eterm' ;
					break ;
				case 'kitty' :
					appName = appId = 'kitty' ;
					break ;

					// OSX Terminals

				case 'iTerm' :
				case 'iTerm2' :
				case 'Terminal' :
					appId = 'osx-256color' ;
					break ;

				default :
					if ( appName.match( /gnome-terminal/ ) ) {
						appName = 'gnome-terminal' ;
						appId = t256color || tTrueColor ? 'gnome-256color' : 'gnome' ;
						break ;
					}

					if ( ! pid || pid === 1 ) {
						throw new Error( 'Terminal not found, app names: ' + appNames.join( ', ' ) ) ;
					}

					loopAgain = true ;
			}
		}
	}
	catch ( error_ ) {
		if ( callback ) { callback( error_ ) ; return ; }
		throw error_ ;
	}

	var result = {
		appId: appId ,
		appName: appName ,
		pid: pid ,
		safe: true
	} ;

	if ( callback ) { callback( undefined , result ) ; return ; }

	return result ;
} ;



// Work locally, do not work over SSH
exports.getDetectedTerminal = async function( callback ) {
	var terminal , info ,
		guessed = termkit.guessTerminal() ;

	if ( guessed.safe || guessed.isSSH ) {
		// If we have a good guess, use it now
		terminal = termkit.createTerminal( {
			stdin: process.stdin ,
			stdout: process.stdout ,
			stderr: process.stderr ,
			generic: ( process.env.TERM && process.env.TERM.toLowerCase() ) || 'unknown' ,
			appId: guessed.safe ? guessed.appId : undefined ,
			//  appName: guessed.safe ? guessed.appName : undefined ,
			isTTY: guessed.isTTY ,
			isSSH: guessed.isSSH ,
			processSigwinch: true ,
			preferProcessSigwinch: !! termkit.globalConfig.preferProcessSigwinch
		} ) ;

		if ( callback ) { callback( undefined , terminal ) ; }
		return terminal ;
	}

	try {
		info = await termkit.getParentTerminalInfo() ;

		terminal = termkit.createTerminal( {
			stdin: process.stdin ,
			stdout: process.stdout ,
			stderr: process.stderr ,
			generic: ( process.env.TERM && process.env.TERM.toLowerCase() ) || 'unknown' ,
			appId: info.appId ,
			appName: info.appName ,
			isTTY: guessed.isTTY ,
			isSSH: guessed.isSSH ,
			pid: info.pid ,
			processSigwinch: true ,
			preferProcessSigwinch: !! termkit.globalConfig.preferProcessSigwinch
		} ) ;
	}
	catch ( error ) {
		// Do not issue error
		terminal = termkit.createTerminal( {
			stdin: process.stdin ,
			stdout: process.stdout ,
			stderr: process.stderr ,
			generic: ( process.env.TERM && process.env.TERM.toLowerCase() ) || 'unknown' ,
			appId: guessed.safe ? guessed.appId : undefined ,
			//  appName: guessed.safe ? guessed.appName : undefined ,
			isTTY: guessed.isTTY ,
			isSSH: guessed.isSSH ,
			processSigwinch: true ,
			preferProcessSigwinch: !! termkit.globalConfig.preferProcessSigwinch
		} ) ;
	}

	if ( callback ) { callback( undefined , terminal ) ; }
	return terminal ;
} ;

