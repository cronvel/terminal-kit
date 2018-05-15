

<a name="top"></a>
## Global Terminal-Kit API: Methods of Module's Root

This section is about the main-module methods.

**NOTE:** In the following code sample, `termkit` is always equal to `require( 'terminal-kit')`, the main module.



## Table of Contents

* [termkit.terminal: The Default Instance](#ref.terminal)
* [termkit.realTerminal: Real Terminal Access (e.g. escaping from pipes)](#ref.realTerminal)
* [termkit.createTerminal()](#ref.createTerminal)
* [termkit.getParentTerminalInfo()](#ref.getParentTerminalInfo)
* [termkit.getDetectedTerminal()](#ref.getDetectedTerminal)
* [termkit.autoComplete()](#ref.autoComplete)
* [termkit.stripEscapeSequences()](#ref.stripEscapeSequences)
* [termkit.stringWidth()](#ref.stringWidth)
* [termkit.truncateString()](#ref.truncateString)



<a name="ref.terminal"></a>
### termkit.terminal: The Default Terminal Instance

99.99% of times, you will never instanciate a `Terminal`, you will just use the default instance:

```js
var term = require( 'terminal-kit' ).terminal ;
```

It instanciates a default terminal interface using the process's STDIN and STDOUT, and guess the underlying terminal
capabilities using environment variables.



<a name="ref.realTerminal"></a>
### termkit.realTerminal: Getting the **REAL** terminal access (e.g. escaping from pipes)

When a program is piped, its standard input (STDIN) or its standard output (STDOUT) is no longer connected to the actual terminal,
but to an upstream or downstream program.

Sometime this is the behavior you want, sometime not.

The default terminal instance (`require( 'terminal-kit' ).terminal`) use STDIN and STDOUT as its input and output, so if the program
is piped, it get its input from the upstream program and/or send its output to the downstream program.

However, one may want a direct access to the terminal even when piped.

For that purpose, `termkit.tty.getInput()` and `termkit.tty.getOutput()` can be used instead of `process.stdin` and `process.stdout`,
and passed to [`termkit.createTerminal()`](#ref.createTerminal).

To ease this process even more, there is another built-in terminal instance for that: `require( 'terminal-kit' ).realTerminal`.

Let's write this file (my-script.js):

```js
realTerm = require( "terminal-kit" ).realTerminal ;
realTerm.blue( "Enter your name: " ) ;
realTerm.inputField( function( error , name ) {
	realTerm.green( "\nHello %s!\n" , name ) ;
	process.exit() ;
} ) ;
```

And then execute it from the command line using pipes: `someprogram | node my-script.js | someotherprogram`.

The script will totally escape the pipes and will be able to run the same way it would without pipes.

**Furthermore:** you can still receive and send things from STDIN and to STDOUT, so you can handle interactive stuff using
the `realTerm` instance and receive from the first program, and write to the last program.



<a name="ref.createTerminal"></a>
### .createTerminal( options )

* options `Object` an object of options, where:
	* stdin `stream.Readable` (default: `process.stdin`) a readable input stream for the terminal interface's input
	* stdout `stream.Writable` (default: `process.stdout`) a writable output stream for the terminal interface's output
	* stderr `stream.Writable` (default: `process.stderr`) a writable output stream for the terminal interface's error output
	* generic `string` (default: 'xterm') generic terminal application's identifier
	* appId `string` specific terminal application's identifier (available ID's are files basename found in the
	  lib/termconfig/ directory of the lib)
	* appName `string` just an informative field
	* isTTY `boolean` true (the default) if the terminal is a TTY
	* isSSH `boolean` (default: false) true if the terminal is a SSH terminal (the app and the terminal are not on the same computer)
	* processSigwinch `boolean` (default: false) true if the terminal can use the SIGWINCH signal to detect resizing
	* preferProcessSigwinch `boolean` (default: false) true if the terminal MUST use the SIGWINCH signal to detect resizing
		(by the way, it turns processSigwinch on). It is useful on some Windows system.

This method creates a new terminal interface.

Most of time, one may just use the default terminal interface, using `var term = require( 'terminal-kit' ).terminal ;`.
That should cover 99.99% of use cases.

However, it is sometime useful if we have some communication channel to a terminal other than STDIN/STDOUT,
or if we know for sure the targeted terminal's ID and don't want to use the autodetect feature of the lib.



<a name="ref.getParentTerminalInfo"></a>
### .getParentTerminalInfo( callback )

* callback `Function( error , codename , name , pid )` where:
	* error: truthy if it has failed for some reason
	* codename: the code name of the terminal, as used by terminfo
	* name: the real binary name of the terminal
	* pid: the PID of the terminal

This method detects on which terminal your application run.
It does **\*NOT\*** use the $TERM or $COLORTERM environment variable, except as a fallback.
It iterates through parent process until a known terminal is found, or process of PID 1 is reached (the *init* process).

Obviously, it does not works over SSH.

Also, it only works on UNIX family OS.



<a name="ref.getDetectedTerminal"></a>
### .getDetectedTerminal( callback )

* callback `Function( error , term )` where:
	* error: truthy if it has failed for some reason
	* term: the terminal object created specifically for your terminal

This is a shortcut that call `.getParentTerminalInfo()` then use `.createTerminal()` with the correct arguments.
This will give you a terminal object with the best support that this lib is able to give to you.

It does not works over SSH, but fallback to standard terminal guessing.

Example **\*NOT\***  using `.getDetectedTerminal()`:
```js
var term = require( 'terminal-kit' ).terminal ;
term.cyan( 'Hello world!' ) ;
```
This will give you a terminal object based on the $TERM and $COLORTERM environment variable, that works fine in
almost all cases.

Some troubles may arise if the $COLORTERM environment variable is not found.

Most of modern terminal report them as an *xterm* or an *xterm-256color* terminal in the $TERM environment variable.
They claim being xterm-compatible, but most of them support only 33% to 50% of xterm features,
and even major terminal like *gnome-terminal* or *Konsole* are sometime terrible.

Example using `.getDetectedTerminal()`:
```js
require( 'terminal-kit' ).getDetectedTerminal( function( error , term ) {
	term.cyan( 'Terminal name: %s\n' , term.appName ) ;
	term.cyan( 'Terminal app: %s\n' , term.app ) ;
	term.cyan( 'Terminal generic: %s\n' , term.generic ) ;
	term.cyan( 'Config file: %s\n' , term.termconfigFile ) ;
} ) ;
```
This will give you the best compatibility possible, at the cost of a callback.



<a name="ref.autoComplete"></a>
### .autoComplete( array , startString , [returnAlternatives] , [prefix] , [postfix] )

* array `Array` of string, it is the list of completion candidates
* startString `string` this is the input string to be completed
* returnAlternatives `boolean` (default: false) when many candidates match the input, if *returnAlternatives* is set then
  the method is allowed to return an array containing all matching candidates, else the input string (*startString*) is
  returned unchanged
* prefix `string` (optional) prepend that string to the response string, or add a `prefix` property to the response array:
  when used in an `inputField()`, this cause this string to be prepended to the output of the auto-complete menu.
* postfix `string` (optional) append that string to the response string, or add a `postfix` property to the response array:
  when used in an `inputField()`, this cause this string to be appended to the output of the auto-complete menu.

This static method is used behind the scene by [.inputField()](high-level.md#ref.inputField) when auto-completion mechanisms kick in.

This method is exposed in the API because [.inputField()](high-level.md#ref.inputField) supports user-defined auto-completers, such
auto-completers might take advantage of this method for its final pass, after collecting relevant informations to feed it.

[This is an example](high-level.md#ref.example.autoComplete) of its usage.



<a name="ref.stripEscapeSequences"></a>
### .stripEscapeSequences( str )

* str `string` the input string

This method takes an input string and returns it without any terminal escape sequences.



<a name="ref.stringWidth"></a>
### .stringWidth( str )

* str `string` the input string

This method returns the **terminal-aware width** of a string, i.e. the width of the string as displayed on the terminal.
It takes care of:
* escape sequences: they do not generate any width
* full-width characters: unicode characters that are displayed using two *cells* on the terminal (e.g.: asian characters)



<a name="ref.truncateString"></a>
### .truncateString( str , maxWidth )

* str `string` the input string
* maxWidth `number` the max width of the output string

This method takes a string and returns it eventually truncated if its width was greater than *maxWidth*.
This method is **terminal-aware**: it does not truncate the string in the middle of an escape sequence,
and the *width* is computed the same way than [.stringWidth()](#ref.stringWidth) does.

