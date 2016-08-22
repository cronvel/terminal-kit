
[![★](https://img.shields.io/github/stars/cronvel/terminal-kit.svg?label=❤)](https://github.com/cronvel/terminal-kit/stargazers)
[![License](https://img.shields.io/github/license/cronvel/terminal-kit.svg)](https://github.com/cronvel/terminal-kit)
[![Downloads](https://img.shields.io/npm/dm/terminal-kit.svg)](https://www.npmjs.com/package/terminal-kit)
[![Version](https://img.shields.io/npm/v/terminal-kit.svg)](https://www.npmjs.com/package/terminal-kit)
[![Codewake](https://www.codewake.com/badges/ask_question.svg)](https://www.codewake.com/p/terminal-kit)

[![Stats](https://nodei.co/npm/terminal-kit.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/terminal-kit)



# Terminal Kit

A full-blown terminal lib featuring: 256 colors, styles, keys & mouse handling, input field, interactive 'yes or no', 
screen buffer, and many more...

Whether you just need colors & styles, build a simple interactive command line tool or a complexe terminal application:
this is the absolute terminal lib for Node.js!

It does **NOT** depend on ncurses.

* License: MIT
* Current status: **really close to release!**
* Platform: linux and any xterm-compatible terminal, it has been tested successfully with:
	* xterm
	* gnome-terminal
	* Konsole
	* Terminator
	* xfce4-terminal
	* Linux Console
	* rxvt/urxvt
	* Eterm
	* Terminology
	* **Your terminal?** Help tracking terminal compatibilities [on github!](https://github.com/cronvel/terminal-kit/issues)

Some tutorials are available at [blog.soulserv.net/tag/terminal](http://blog.soulserv.net/tag/terminal/).



## Key features

* colors, 256 colors or even 24 bits colors, if the terminal supports it
* styles (bold, underline, italic, and many more)
* style mixing
* string formatting
* short style markup
* cursor positioning
* keyboard input
* mouse support (GPM is supported for the Linux Console)
* terminal window title
* input field
* interactive 'yes or no'
* screen & off-screen buffers (a concept similar to SDL's *Surface*)
* event-driven



## Quick examples

```js
// Require the lib, get a working terminal
var term = require( 'terminal-kit' ).terminal ;

// The term() function simply output a string to stdout, using current style
// output "Hello world!" in default terminal's colors
term( 'Hello world!\n' ) ;

// This output 'red' in red
term.red( 'red' ) ;

// This output 'bold' in bold
term.bold( 'bold' ) ;

// output 'mixed' using bold, underlined & red, exposing the style-mixing syntax
term.bold.underline.red( 'mixed' ) ;

// printf() style formatting everywhere:
// this will output 'My name is Jack, I'm 32.' in green
term.green( "My name is %s, I'm %d.\n" , 'Jack' , 32 ) ;

// Since v0.16.x, style markup are supported as a shorthand.
// Those two lines produce the same result.
term( "My name is " ).red( "Jack" )( " and I'm " ).green( "32\n" ) ;
term( "My name is ^rJack^ and I'm ^g32\n" ) ;

// Width and height of the terminal
term( 'The terminal size is %dx%d' , term.width , term.height ) ;

// Move the cursor at the upper-left corner
term.moveTo( 1 , 1 ) ;

// We can always pass additional arguments that will be displayed...
term.moveTo( 1 , 1 , 'Upper-left corner' ) ;

// ... and formated
term.moveTo( 1 , 1 , "My name is %s, I'm %d.\n" , 'Jack' , 32 ) ;

// ... or even combined with other styles
term.moveTo.cyan( 1 , 1 , "My name is %s, I'm %d.\n" , 'Jack' , 32  ) ;
```



## Install

Use Node Package Manager:

    npm install terminal-kit



## Some conventions used in this document

In all examples, `termkit` is assumed to be `var termkit = require( 'terminal-kit' ) ;` while `term` is assumed
to be `var term = require( 'terminal-kit' ).terminal ;` or `var term = termkit.terminal ;`.

So `term` is an instanceof of `termkit.Terminal`, that should in almost all cases match correctly the terminal you
are currently using. This is the *default* terminal.

You can also define your own terminal interface, see [.createTerminal()](#ref.createTerminal).



## Table of Contents

* Basic *chainable* methods
	* [Colors](#ref.colors)
	* [Styles](#ref.styles)
	* [Moving the cursor](#ref.movingCursor)
	* [Editing the screen](#ref.editingScreen)
	* [Input/Output](#ref.io)
	* [Misc](#ref.misc)
* Advanced usages and methods
	* [Real terminal access (e.g. escaping from pipes)](#ref.realTerminal)
	* [.fullscreen()](#ref.fullscreen)
	* [.grabInput()](#ref.grabInput)
	* [.getCursorLocation()](#ref.getCursorLocation)
	* [.getColor()](#ref.getColor)
	* [.setColor()](#ref.setColor)
	* [.getPalette()](#ref.getPalette)
	* [.setPalette()](#ref.setPalette)
	* [.yesOrNo()](#ref.yesOrNo)
	* [.inputField()](#ref.inputField)
	* [.singleLineMenu()](#ref.singleLineMenu)
	* [.progressBar()](#ref.progressBar)
	* [.slowTyping()](#ref.slowTyping)
* Events
	* ['resize'](#ref.event.resize)
	* ['key'](#ref.event.key)
	* ['terminal'](#ref.event.terminal)
	* ['mouse'](#ref.event.mouse)
* Static methods
	* [.createTerminal()](#ref.createTerminal)
	* [.getParentTerminalInfo()](#ref.getParentTerminalInfo)
	* [.getDetectedTerminal()](#ref.getDetectedTerminal)
	* [.autoComplete()](#ref.autoComplete)
	


## Standard methods of a **Terminal** instance 

Standard methods map low-level terminal capabilities.

For all the functions below, additional arguments can be provided.

If a boolean is provided, it will turn the feature *on* or *off*.
For example `term.red( true )` turn all subsequent output in red, while `term.red( false )` disable red and go back to default color.

Without arguments, it is always the same as *true*, e.g. `term.red()` do the same thing than `term.red()`.

Some function cannot be turned off, they just perform an action.
For example `term.reset()` reset the terminal, usually to its default.
This is not reversible, thus `term.reset( false )` does nothing.

If the additional argument is a string, then it will be sent to the output directly after turning *on* the feature... then the
feature is turn *off*.
That's it:  
`term.red( 'Hello world!' )`  
... is the same as:  
`term.red( true ) ; term( 'Hello world!' ) ; term.red( false ) ;`.

Also those string support a printf()-like formatting syntax.  
So we can do `term.red( "My name is %s, I'm %d." , 'Jack' , 32 )` to output *"My name is Jack, I'm 32."* in red.

**New:** since *v0.16.x*, style markup are supported as a shorthand. Style markup are introduced by a caret `^` followed by another
character.
Colors are produced by the first letter of its name, e.g. red is produced with a `^r`, except black which is produced by `^k`.
Other styles are produced with a symbol. For example `^_` switch to underline.
To remove all styles, `^:` or `^ ` can be used.
A style reset is always produced at the end of the string as soon as one style markup was used.

Those two lines produce the same result:
```js
term( "My name is " ).red( "Jack" )( " and I'm " ).green( "32\n" ) ;
term( "My name is ^rJack^ and I'm ^g32\n" ) ;
```

See [the full style markup reference](https://github.com/cronvel/string-kit#ref.format.markup) for details.



All those functions are chainable, and their arguments can be combined.
We can do:  
`term.moveTo.red( 1 , 1 , "My name is %s, I'm %d.\n" , 'Jack' , 32  )` which will move the cursor to (1,1), then output *"My name is Jack, I'm 32."* in red.



### Common/Misc

* .reset(): full reset of the terminal
* .error(): it just set error to true so it will write to STDERR instead of STDOUT
* .str(): do not output anything, instead return a string containing the sequences
* .bell(): emit an audible bell



<a name="ref.colors"></a>
### Foreground colors

* .defaultColor(): back to the default foreground color
* .black(): ...
* .red(): ...
* .green(): ...
* .yellow(): dark yellow, most of time brown or orange
* .blue(): ...
* .magenta(): ...
* .cyan(): ...
* .white(): ...
* .brightBlack(): ...
* .brightRed(): ...
* .brightGreen(): ...
* .brightYellow(): true yellow
* .brightBlue(): ...
* .brightMagenta(): ...
* .brightCyan(): ...
* .brightWhite(): ...
* .color(register): choose between 16 colors using an 0..15 integer
* .darkColor(register): choose between 8 regular (dark) colors using an 0..7 integer
* .brightColor(register): choose between 8 bright colors using an 0..7 integer
* .color256(register): if the terminal support 256 colors, it chooses between them using an 0..255 integer
* .colorRgb(r,g,b): pick the closest match for an RGB value (from a 16 or 256 colors palette or even the 
	exact color if the terminal support 24 bits colors), *r,g,b* are in the 0..255 range
* .colorGrayscale(l): pick the closest match for a grayscale value (from a 16 or 256 colors palette or
	even the exact color if the terminal support 24 bits colors), *l* is in the 0..255 range



### Background colors

* .bgDefaultColor(): back to the default background color
* .bgBlack(): ...
* .bgRed(): ...
* .bgGreen(): ...
* .bgYellow(): dark yellow, most of time brown or orange
* .bgBlue(): ...
* .bgMagenta(): ...
* .bgCyan(): ...
* .bgWhite(): ...
* .bgDarkColor(): ...
* .bgBrightBlack(): ...
* .bgBrightRed(): ...
* .bgBrightGreen(): ...
* .bgBrightYellow(): true yellow
* .bgBrightBlue(): ...
* .bgBrightMagenta(): ...
* .bgBrightCyan(): ...
* .bgColor(register): choose between 16 colors using an 0..15 integer
* .bgBrightWhite(): choose between 8 regular (dark) colors using an 0..7 integer
* .bgBrightColor(): choose between 8 bright colors using an 0..7 integer
* .bgColor256(register): if the terminal support 256 colors, it choose between them using an 0..255 integer
* .bgColorRgb(r,g,b): pick the closest match for an RGB value (from a 16 or 256 colors palette or even the
	exact color if the terminal support 24 bits colors) as the background color, *r,g,b* are in the 0..255 range
* .bgColorGrayscale(l): pick the closest match for a grayscale value (from a 16 or 256 colors palette or even
	the exact color if the terminal support 24 bits colors) as the background color, *l* is in the 0..255 range



<a name="ref.styles"></a>
### Styles

* .styleReset(): reset all styles and go back to default colors
* .bold(): bold text
* .dim(): faint color
* .italic(): italic
* .underline(): underline
* .blink(): blink text, not widely supported
* .inverse(): foreground and background color
* .hidden(): invisible, but can be copy/paste'd
* .strike(): strike through



<a name="ref.movingCursor"></a>
### Moving the Cursor

* .saveCursor(): save cursor position
* .restoreCursor(): restore a previously saved cursor position
* .up(n): move the cursor 'n' chars up
* .down(n): move the cursor 'n' chars down
* .right(n): move the cursor 'n' chars right
* .left(n): move the cursor 'n' chars left
* .nextLine(n): move the cursor to beginning of the line, 'n' lines down
* .previousLine(n): move the cursor to beginning of the line, 'n' lines up
* .column(x): move the cursor to column x
* .scrollUp(n): scroll whole page up by 'n' lines, new lines are added at the bottom, the absolute cursor position do not change (Linux Console don't support it)
* .scrollDown(n): scroll whole page down by 'n' lines, new lines are added at the top, the absolute cursor position do not change (Linux Console don't support it)
* .moveTo(x,y): move the cursor to the (x,y) coordinate (1,1 is the upper-left corner)
* .move(x,y): relative move of the cursor
* .hideCursor(): hide/show the cursor



<a name="ref.editingScreen"></a>
### Editing the Screen

* .clear(): clear the screen and move the cursor to the upper-left corner
* .eraseDisplayBelow(): erase everything below the cursor
* .eraseDisplayAbove(): erase everything above the cursor
* .eraseDisplay(): erase everything
* .eraseLineAfter(): erase current line after the cursor
* .eraseLineBefore(): erase current line before the cursor
* .eraseLine(): erase current line
* .insertLine(n): insert n lines
* .deleteLine(n): delete n lines
* .insert(n): insert n char after (like the INSERT key)
* .delete(n): delete n char after (like the DELETE key)
* .backDelete(): delete one char backward (like the BACKSPACE key), shorthand composed by a .left(1)
  followed by a .delete(1)
* .alternateScreenBuffer(): this set/unset the alternate screen buffer, many terminal do not support it or inhibit it



<a name="ref.io"></a>
### Input/Output

* .requestCursorLocation(): request the cursor location, a 'terminal' event will be fired when available
* .requestScreenSize(): **DEPRECATED** request for screen size, a 'terminal' event will be fired when available,
	**DO NOT USE**: use .width and .height instead, those properties are updated whenever a resize event is received
* .requestColor(n): **rarely useful** request for color *n*, **DO NOT USE**: use high-level .getColor() instead
* .applicationKeypad(): should allow keypad to send different code than 0..9 keys, not widely supported



### Internal input/output (do not use directly, use grabInput() instead)

* .mouseButton(): ask the terminal to send event when a mouse button is pressed, with the mouse cursor position
* .mouseDrag(): ask the terminal to send event when a mouse button is pressed and when draging, with the mouse cursor position
* .mouseMotion(): ask the terminal to send all mouse event, even mouse motion that occurs without buttons
* .mouseSGR(): another mouse protocol that extend coordinate mapping (without it, it supports only 223 rows and columns)
* .focusEvent(): ask the terminal to send event when it gains and loses focus, not widely supported



<a name="ref.misc"></a>
### Misc

* .noFormat(str): disable string formatting - useful when your string may contain `%` (e.g. user input) and you
	don't want to escape them
* .windowTitle(str): set the title of an xterm-compatible window to *str*
* .setCursorColor(register): set the cursor color to one of the 256 *register*
* .setCursorColorRgb(r,g,b): set the cursor color to a custom RGB value
* .setDefaultColorRgb(r,g,b): set the value of the default foreground color
* .setDefaultBgColorRgb(): set the value of the default background color, this is the terminal window background



## Advanced methods of a **Terminal** instance

Advanced methods are high-level library functions.



<a name="ref.realTerminal"></a>
### Getting the **REAL** terminal access (e.g. escaping from pipes)

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



<a name="ref.fullscreen"></a>
### .fullscreen( options )

* options: true/false/object: if truthy it activate fullscreen mode, falsy return to normal mode,
  if it is an object it supports those properties:
	* noAlternate `boolean` true if the alternate screen buffer should not be used

Basically, this method try to achieve the same goal than the native terminal capability *alternate screen buffer*.
If *alternate screen buffer* is disabled on your terminal, it will provide a clean fallback, clearing the screen and positionning
the cursor at the upper-left corner.



<a name="ref.processExit"></a>
### .processExit( code )

* code `number` the exit code

This method should be used instead of calling `process.exit()` directly. The *code* argument will be transmitted to
`process.exit()` as it is.

It helps quitting cleanly your application without leaving the terminal in a bad state, so the user get a working shell back.



<a name="ref.grabInput"></a>
### .grabInput( options )

* options: false/true/Object, *false* disable input grabbing, *true* or an Object turn it on,
  if it is an Object then those properties are supported:
	* mouse: if defined, it activate mouse event, those values are supported for 'mouse':
		* 'button': report only button-event
		* 'drag': report button-event and report motion-event only when a button is pressed (i.e. a mouse drag)
		* 'motion': report button-event and all motion-event, use it only when needed, many escape sequences are sent from
		  the terminal (e.g. you may consider it for script running over SSH)
	* focus: true/false: if defined and true, focus event will be reported (if your terminal support it - *xterm* does)

This function turns input grabbing on, keyboard entries will not be echoed, and every input will generate an event
on the `term` object.


Quick example:

```js
var term = require( 'terminal-kit' ).terminal ;

function terminate()
{
	term.grabInput( false ) ;
	setTimeout( function() { process.exit() } , 100 ) ;
}

term.bold.cyan( 'Type anything on the keyboard...\n' ) ;
term.green( 'Hit CTRL-C to quit.\n\n' ) ;

term.grabInput( { mouse: 'button' } ) ;

term.on( 'key' , function( name , matches , data ) {
	console.log( "'key' event:" , name ) ;
	if ( key === 'CTRL_C' ) { terminate() ; }
} ) ;

term.on( 'terminal' , function( name , data ) {
	console.log( "'terminal' event:" , name , data ) ;
} ) ;

term.on( 'mouse' , function( name , data ) {
	console.log( "'mouse' event:" , name , data ) ;
} ) ;
```



<a name="ref.getCursorLocation"></a>
### .getCursorLocation( callback )

* callback( error , x , y )
	* error `mixed` truthy if an underlying error occurs
	* x `integer` the x coordinate of the cursor
	* y `integer` the y coordinate of the cursor

Get the cursor location.



<a name="ref.getColor"></a>
### .getColor( register , callback )

* register `number` the register number in the 0..255 range
* callback( error , rgb )
	* error `mixed` truthy if an underlying error occurs
	* rgb `Object` where:
		* r `number` in the 0..255 range, the red value
		* g `number` in the 0..255 range, the green value
		* b `number` in the 0..255 range, the blue value

Get the RGB values of a color register.



<a name="ref.setColor"></a>
### .setColor( register , r , g , b , [names] ) *or* .setColor( register , rgb , [names] )

* register `number` the register number in the 0..255 range
* r `number` in the 0..255 range, the red value
* g `number` in the 0..255 range, the green value
* b `number` in the 0..255 range, the blue value
* rgb `Object` where:
	* r `number` in the 0..255 range, the red value
	* g `number` in the 0..255 range, the green value
	* b `number` in the 0..255 range, the blue value
* names `Array` of `string`: names for that color, it default to an empty array

Set the RGB values for a color indexed by the integer *register*.



<a name="ref.getPalette"></a>
### .getPalette( register , callback )

* callback( error , palette )
	* error `mixed` truthy if an underlying error occurs
	* palette `Array` of 16 `Object` where:
		* r `number` in the 0..255 range, the red value
		* g `number` in the 0..255 range, the green value
		* b `number` in the 0..255 range, the blue value
		* names `Array` of `string`, names for this color

Request from the terminal the 16-colors palette in use.

If the terminal does not support the feature, then the default palette for this terminal is provided,
and each color that was modified by the lib replace it.



<a name="ref.setPalette"></a>
### .setPalette( palette )

* palette either:
	* `Array` of 16 `Object` where:
		* r `number` in the 0..255 range, the red value
		* g `number` in the 0..255 range, the green value
		* b `number` in the 0..255 range, the blue value
		* names `Array` of `string`, names for this color
	* *OR* `string` one of the built-in palette (default, gnome, konsole, linux, solarized, vga, xterm)

If the terminal support it, it will reset the 16-colors palette to the provided one.



<a name="ref.yesOrNo"></a>
### .yesOrNo( [options] , callback )

* options `Object` where:
	* yes `string` or `Array` contains a key code or an array of key code that will trigger the yes
	* no `string` or `Array` contains a key code or an array of key code that will trigger the 
	* echoYes `String` contains what to write on yes, default 'yes'
	* echoNo `String` contains what to write on no, default 'no'
* callback( error , result )
	* error `mixed` truthy if an underlying error occurs
	* result `boolean` true for 'yes' or false for 'no'

Wait for user input, call the completion callback when the user hit the 'y' key or the 'n' key,
*result* will be true if the user hit any *yes* keys or false if the user hit any *no* keys.
Other keys do not do anything.

Turn input grabbing on if necessary.

We can specify the keys for *yes* and *no* by providing a string or an array of string.

It returns an object featuring some functions to control things during the input process:

* abort(): abort the input process and do not even call the inputField()'s callback



Quick example:

```js
var term = require( 'terminal-kit' ).terminal ;

function question()
{
	term( 'Do you like javascript? [Y|n]\n' ) ;
	
	// Exit on y and ENTER key
	// Ask again on n
	term.yesOrNo( { yes: [ 'y' , 'ENTER' ] , no: [ 'n' ] } , function( error , result ) {
	
		if ( result )
		{
			term.green( "'Yes' detected! Good bye!\n" ) ;
			process.exit() ;
		}
		else
		{
			term.red( "'No' detected, are you sure?\n" ) ;
			question() ;
		}
	} ) ;
}

question() ;
```

It produces:

![Yes or no output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/yes-no-doc1.gif)



<a name="ref.inputField"></a>
### .inputField( [options] , callback )

* options `Object` where:
	* echo `boolean` if true (the default), input are displayed on the terminal
	* history `Array` (optional) an history array, so UP and DOWN keys move up and down in the history
	* maxLength `number` (optional) the maximum length (in characters) of the user input
	* autoComplete `Array` or `Function( inputString , [callback] )` (optional) an array of possible completion,
	  so the TAB key will auto-complete the input field. If it is a function, it should accept an input `string`
	  and return the completed `string` (if no completion can be done, it should return the input string,
	  if multiple candidate are possible, it should return an array of string), if **the function accepts 2 arguments**
	  (checked using *function*.length), then **the auto-completer will be asynchronous**!
	  Also note that if it is an array or the result of the function is an array, and if that array has a
	  special property `prefix` (a string), then this prefix will be prepended to the output of the auto complete menu.
	* autoCompleteMenu `boolean` or `Object` of options, used in conjunction with the 'autoComplete' options, if *truthy*
	  any auto-complete attempt having many completion candidates will display a menu to let the user choose between each
	  possibilities. If an object is given, it should contain options for the [.singleLineMenu()](#ref.singleLineMenu)
	  that is used for the completion (notice: some options are overwritten: 'y' and 'exitOnUnexpectedKey')
* callback( error , input )
	* error `mixed` truthy if an underlying error occurs
	* input `string` the user input

Wait for user input, call the completion callback when the user hit the *ENTER* key and pass the user input
to the callback.

It turns input grabbing on if necessary.

Special keys supported by the input field:

* ENTER, KP_ENTER: end the input process and return the current user input
* DELETE: delete
* BACKSPACE: backward delete
* LEFT, RIGHT: move the cursor one character left or right
* HOME: move the cursor at the beginning of the input field
* END: move the cursor at the end of the input field
* DOWN, UP: use the history feature (if `options.history` is set)
* TAB: use the auto-completion feature (if `options.autoComplete` is set)

Additional keys are used when the auto-completion displays its menu (see [.singleLineMenu()](#ref.singleLineMenu) for details).

It returns an EventEmitter object featuring some functions to control things during the input process:

* abort(): abort the input process and do not even call the inputField()'s callback
* stop(): stop the input process now, call the inputField()'s callback (same behavior than a regular 'ENTER' key pressed)
* getInput(): get the current input string
* getPosition(): return an object containing 'x' and 'y' properties, the coordinates where the input field starts
* redraw(): redraw the input field, useful if you had echo'ed something that can mess it
* hide(): hide the input field, it still records keystrokes
* show(): show the input field again
* rebase(): rebase the input field to the current cursor position. Please note: it does NOT erase the previously entered
  text, you have to use hide() before. It works this way because you may want to modify the screen in between, and
  it needs some I/O with the terminal to works accordingly.

It emits:

* *ready*: when the input field is ready (rarely useful)



Quick example, featuring *history* and *auto-completion*:

```js
var term = require( 'terminal-kit' ).terminal ;

var history = [ 'John' , 'Jack' , 'Joey' , 'Billy' , 'Bob' ] ;

var autoComplete = [
	'Barack Obama' , 'George W. Bush' , 'Bill Clinton' , 'George Bush' ,
	'Ronald W. Reagan' , 'Jimmy Carter' , 'Gerald Ford' , 'Richard Nixon' ,
	'Lyndon Johnson' , 'John F. Kennedy' , 'Dwight Eisenhower' ,
	'Harry Truman' , 'Franklin Roosevelt'
] ;

term( 'Please enter your name: ' ) ;

term.inputField(
	{ history: history , autoComplete: autoComplete , autoCompleteMenu: true } ,
	function( error , input ) {

		term.green( "\nYour name is '%s'\n" , input ) ;
		process.exit() ;
	}
) ;
```

It produces:

![Input field output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/input-field-doc1.gif)

If we need our own auto-completer, we might take advantage of the built-in static method [termkit.autoComplete()](#ref.autoComplete).

Custom auto-completer can be asynchronous, if the function's *length* is **exactly 2**.

<a name="ref.example.autoComplete"></a>
This is an example of a file selector that exposes the async behavior of auto-completer and the usage of
the static `termkit.autoComplete()` method:

```js
var fs = require( 'fs' ) ;
var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;

var autoCompleter = function autoCompleter( inputString , callback )
{  
    fs.readdir( __dirname , function( error , files ) {
        callback( undefined , termkit.autoComplete( files , inputString , true ) ) ;
    } ) ;
} ;
    
term( 'Choose a file: ' ) ;

term.inputField(
	{ autoComplete: autoCompleter , autoCompleteMenu: true } ,
	function( error , input ) {
		if ( error )
		{
			term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
		}
		else
		{
			term.green( "\nYour file is '%s'\n" , input ) ;
		}
		
		process.exit() ;
	}
) ;
```

It produces:

![Input field output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/input-field-doc2.gif)

Also note that if the `autoComplete` options is an array or if it is a function whose output is an array, 
a special property `prefix` (a string) can be set on it: this prefix will be prepended to the output of the auto complete menu.



<a name="ref.singleLineMenu"></a>
### .singleLineMenu( menuItems , [options] , callback )

* menuItems `array` of menu item text
* options `object` of options, where:
	* y `number` the line where the menu will be displayed, default to the next line
	* separator `string` (default: '  ') the string separating each menu item
	* nextPageHint `string` (default: ' » ') string indicator for a next page
	* previousPageHint `string` (default: ' « ') string indicator for a previous page
	* style `function` the style of unselected items, default to the current `term`
	* selectedStyle `function` the style of the selected item, default to `term.dim.blue.bgGreen`
	* exitOnUnexpectedKey `boolean` if an unexpected key is pressed, it exits, calling the callback with undefined values
* callback( error , response ), where:
	* error `mixed` truthy if an underlying error occurs
	* response `Object` where
		* selectedIndex `number` the user-selected menu item index
		* selectedText `string` the user-selected menu item text
		* x `number` the x coordinate of the selected menu item (the first character)
		* y `number` the y coordinate of the selected menu item (same coordinate for all items since it's a single line menu)
		* unexpectedKey `string` when 'exitOnUnexpectedKey' option is set and an unexpected key is pressed, this contains
		  the key that produced the exit

It creates an interactive menu that uses only a single line.

It features **paging** if items oversize the line length, and supports the following keys:

* ENTER, KP_ENTER: end the process and return the currently selected menu item
* LEFT, RIGHT: move and select the previous or the next item in the menu
* UP, DOWN: go the previous or the next page of items (if paging is used)
* HOME, END: move and select the first or the last item of the menu

If the 'exitOnUnexpectedKey' option is set, any other keys will exit the menu, the callback's *response* argument
does not contain any property except 'unexpectedKey', that will contain the key having triggered the exit.

Example:

```js
var term = require( 'terminal-kit' ).terminal ;

var items = [ 'File' , 'Edit' , 'View' , 'History' , 'Bookmarks' , 'Tools' , 'Help' ] ;

var options = {
	y: 1 ,	// the menu will be on the top of the terminal
	style: term.inverse ,
	selectedStyle: term.dim.blue.bgGreen
} ;

term.clear() ;

term.singleLineMenu( items , options , function( error , response ) {
	term( '\n' ).eraseLineAfter.green(
		"#%s selected: %s (%s,%s)\n" ,
		response.selectedIndex ,
		response.selectedText ,
		response.x ,
		response.y
	) ;
	process.exit() ;
} ) ;
```

It produces:

![Progress bar output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/single-line-menu-doc1.gif)

It creates a menu on the top of the terminal, with unselected items using inverted foreground/background colors,
and the selected item using blue on green.
When the user press RETURN/ENTER, it displays the index, text and coordinates of the selected menu item.



<a name="ref.progressBar"></a>
### .progressBar( [options] )

* options `object` of options, all of them are **OPTIONAL**, where:
	* width: `number` the total width of the progress bar, default to the max available width
	* percent: `boolean` if true, it shows the progress in percent alongside with the progress bar
	* eta: `boolean` if true, it shows the Estimated Time of Arrival alongside with the progress bar
	* items `number` the number of items that should be completed, turns the *item mode* on
	* title `string` the title of the current progress bar, turns the *title mode* on
	* barStyle `function` the style of the progress bar items, default to `term.cyan`
	* barBracketStyle `function` the style of the progress bar bracket character, default to options.barStyle if given
	  or `term.blue`
	* percentStyle `function` the style of percent value string, default to `term.yellow`
	* etaStyle `function` the style of the ETA display, default to `term.bold`
	* itemStyle `function` the style of the item display, default to `term.dim`
	* titleStyle `function` the style of the title display, default to `term.bold`
	* itemSize `number` the size of the item status, default to 33% of width
	* titleSize `number` the size of the title, default to 33% of width or title.length depending on context
	* barChar `string` the char used for the bar, default to '='
	* barHeadChar `string` the char used for the bar, default to '>'
	* maxRefreshTime `number` the maximum time between two refresh in ms, default to 500ms
	* minRefreshTime `number` the minimum time between two refresh in ms, default to 100ms

It creates a nice progress bar and return a controller object to interact with it.

The controller provides those functions:

* update( updateObject ): update the progress bar, having the arguments:
	* updateObject `object` or `number` or `null`. If *updateObject* is not an object, it's a shorthand for `{ progress: value }`.
	  It supports those properties:
		* progress `number` or `null` the progress value:
			* if it's a float between 0 and 1, it's the actual progress value to be displayed
			* if `null` then it will display a spinning wheel: something is in progress, but cannot be quantified
		* items `number` change the number of items that should be completed, turns the *item mode* on
		* title `string` change the title of the current progress bar, turns the *title mode* on

* startItem( name ): in *item mode*, it informs the progress bar that a new item is processing, having arguments:
	* name `string` the name of the item that will be displayed in the item status part of the progress bar

* itemDone( name ): in *item mode*, it informs the progress bar that an item is now done, if that item was started using
  `.startItem()`, it will be removed from the running item list. When the number of finished item reaches the `items` parameter
  (see the `.progressBar()`'s 'items' option or `.update()` method's 'items' option), the progressBar reaches 100% and stop.
  It has the arguments:
	* name `string` the name of the item that just finished.

* stop(): stop the progress bar, no redraw will occurs

* resume(): resume a previously stopped progress bar, it will be redrawn again



Example of a progress bar using fake progress values:

```js
var term = require( 'terminal-kit' ).terminal ;

var progressBar , progress = 0 ;


function doProgress()
{
	// Add random progress
	progress += Math.random() / 10 ;
	progressBar.update( progress ) ;
	
	if ( progress >= 1 )
	{
		// Cleanup and exit
		setTimeout( function() { term( '\n' ) ; process.exit() ; } , 200 ) ;
	}
	else
	{
		setTimeout( doProgress , 100 + Math.random() * 400 ) ;
	}
}


progressBar = term.progressBar( {
	width: 80 ,
	title: 'Serious stuff in progress:' ,
	eta: true ,
	percent: true
} ) ;

doProgress() ;
```

It produces:

![Progress bar output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/progress-bar-doc1.gif)

It creates a progress bar and feeds it with a random progress value, then quit when it reaches 100%.


Example of a progress bar in *item mode*:

```js
var term = require( 'terminal-kit' ).terminal ;

var progressBar ;

var thingsToDo = [
	'update my lib' ,
	'data analyzing' ,
	'serious business' ,
	'decrunching data' ,
	'do my laundry' ,
	'optimizing'
] ;

var countDown = thingsToDo.length ;


function start()
{
	if ( ! thingsToDo.length ) { return ; }
	
	var task = thingsToDo.shift() ;
	
	progressBar.startItem( task ) ;
	
	// Finish the task in...
	setTimeout( done.bind( null , task ) , 500 + Math.random() * 1200 ) ;
	
	// Start another parallel task in...
	setTimeout( start , 400 + Math.random() * 400 ) ;
}


function done( task )
{
	progressBar.itemDone( task ) ;
	countDown -- ;
	
	// Cleanup and exit
	if ( ! countDown )
	{
		setTimeout( function() { term( '\n' ) ; process.exit() ; } , 200 ) ;
	}
}


progressBar = term.progressBar( {
	width: 80 ,
	title: 'Daily tasks:' ,
	eta: true ,
	percent: true ,
	items: thingsToDo.length
} ) ;

start() ;
```

It produces:

![Progress bar output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/progress-bar-doc2.gif)

It creates a progress bar and start and finish task with a random time, then quit when everything is done.



<a name="ref.slowTyping"></a>
### .slowTyping( str , [options] , callback )

* str `string` the text to display
* options `object` of options, where:
	* style `function` the style of text, default to `term.green`
	* flashStyle `function` or `falsy` if a `function` is given, then this is the style of the text for the flash effect,
		if `falsy` then the flash effect is turn off, default to `term.bold.brightGreen`
	* delay `number` average delay before printing the next char, default to 150 ms
	* flashDelay `number` fixed delay before the `flashStyle` of the last printed char is replaced by the regular `style`,
		default to 100 ms
* callback `function` that will be called on completion

It outputs some text with an old-fashioned slow-typing effect.

Example:

```js
var term = require( 'terminal-kit' ).terminal ;

term.slowTyping(
	'What a wonderful world!\n' ,
	{ flashStyle: term.brightWhite } ,
	function() { process.exit() ; }
) ;
```

It produces:

![Slow typing output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/slow-typing-doc1.gif)



## Events

Event are fired on your `term` object.



<a name="ref.event.resize"></a>
### 'resize' event ( width , height )

* width `number` the new width in character
* height `number` the new height in character

The 'resize' event is emitted when the terminal get resized, and it contains the new width and height.
Also `term.width` and `term.height` are updated too.



<a name="ref.event.key"></a>
### 'key' event ( name , matches , data )

* name `string` the key name
* matches `Array` of matched key name
* data `Object` contains more informations, mostly useful for debugging purpose, where:
	* isCharacter `boolean` is true if this is a *regular* character, i.e. *not* a control character
	* codepoint `number` (optional) the utf-8 code point of the character, if relevant
	* code `number` or `Buffer`, for multibyte character it is the raw `Buffer` input, for single byte character it is a `number`
	  between 0 and 255

The 'key' event is emitted whenever the user type something on the keyboard.

If `name` is a single char, this is a regular UTF8 character, entered by the user.
If the user type a word, each UTF8 character will produce its own 'key' event.

If `name` is a multiple chars string, then it is a SPECIAL key.

<a name="ref.event.key.specialKeyCodes"></a>
List of SPECIAL keys:

    ESCAPE ENTER BACKSPACE NUL TAB SHIFT_TAB 
    UP DOWN RIGHT LEFT
    INSERT DELETE HOME END PAGE_UP PAGE_DOWN
    KP_NUMLOCK KP_DIVIDE KP_MULTIPLY KP_MINUS KP_PLUS KP_DELETE KP_ENTER
    KP_0 KP_1 KP_2 KP_3 KP_4 KP_5 KP_6 KP_7 KP_8 KP_9
    F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12
    SHIFT_F1 SHIFT_F2 SHIFT_F3 SHIFT_F4 SHIFT_F5 SHIFT_F6
	SHIFT_F7 SHIFT_F8 SHIFT_F9 SHIFT_F10 SHIFT_F11 SHIFT_F12
    CTRL_F1 CTRL_F2 CTRL_F3 CTRL_F4 CTRL_F5 CTRL_F6
	CTRL_F7 CTRL_F8 CTRL_F9 CTRL_F10 CTRL_F11 CTRL_F12
    CTRL_SHIFT_F1 CTRL_SHIFT_F2 CTRL_SHIFT_F3 CTRL_SHIFT_F4
	CTRL_SHIFT_F5 CTRL_SHIFT_F6 CTRL_SHIFT_F7 CTRL_SHIFT_F8
	CTRL_SHIFT_F9 CTRL_SHIFT_F10 CTRL_SHIFT_F11 CTRL_SHIFT_F12
    SHIFT_UP SHIFT_DOWN SHIFT_RIGHT SHIFT_LEFT
    ALT_UP ALT_DOWN ALT_RIGHT ALT_LEFT
    CTRL_UP CTRL_DOWN CTRL_RIGHT CTRL_LEFT
    SHIFT_INSERT SHIFT_DELETE SHIFT_HOME SHIFT_END SHIFT_PAGE_UP SHIFT_PAGE_DOWN
    CTRL_INSERT CTRL_DELETE CTRL_HOME CTRL_END CTRL_PAGE_UP CTRL_PAGE_DOWN
    ALT_INSERT ALT_DELETE ALT_HOME ALT_END ALT_PAGE_UP ALT_PAGE_DOWN
	SHIFT_TAB ALT_TAB
	ALT_SPACE CTRL_ALT_SPACE

And modifier on regular A-Z key:

    CTRL_A ALT_A CTRL_ALT_A ALT_SHIFT_A
    CTRL_B ALT_B CTRL_ALT_B ALT_SHIFT_B
    CTRL_C ALT_C CTRL_ALT_C ALT_SHIFT_C
    ...

Sometime, a key matches multiple combination. For example CTRL-M on linux boxes is always the same as ENTER.
So the event will provide as the 'name' argument the most useful/common, here *ENTER*.
However the 'matches' argument will contain `[ ENTER , CTRL_M ]`.

Also notice that some terminal will support less keys. For example, the Linux Console does not support SHIFT/CTRL/ALT + Arrows keys,
it will produce a normal arrow key.
There is no workaround here, the underlying keyboard driver simply does not support this.

KP_* keys needs `applicationKeypad()`, e.g. without it KP_1 will report '1' or END.

Some terminal does not support `applicationKeypad()` at all, sometime turning numlock off can works, sometime not,
so it is nearly impossible to differentiate (for example) a KP_1 from an END, or a KP_7 from a HOME.



<a name="ref.event.terminal"></a>
### 'terminal' event ( name , data )

* name `string` the name of the subtype of event
* data `Object` provide some data depending on the event's subtype

The 'terminal' event is emitted for terminal generic information.

The argument 'name' can be:

* CURSOR_LOCATION: it is emitted in response of a requestCursorLocation(), data contains 'x' & 'y', the coordinate of the cursor.

* SCREEN_RESIZE: **DEPRECATED! Will be removed in the next non-patch version! Use the 'resize' event instead!**
  Currently it is emitted when a terminal resizing is detected, most of time node.js will be notified of
  screen resizing, and so this event will be emitted, data contains 'width' & 'height', the size of the screen in characters

* SCREEN_SIZE: **rarely useful** it is emitted in response of a requestScreenSize(), data contains 'width' & 'height', the size of
  the screen in characters, and 'resized' (true/false) if the size has changed without node.js being notified

* FOCUS_IN: it is emitted if the terminal gains focus (if supported by your terminal)

* FOCUS_OUT: it is emitted if the terminal loses focus (if supported by your terminal)



<a name="ref.event.mouse"></a>
### 'mouse' event ( name , data )

* name `string` the name of the subtype of event
* data `Object` provide the mouse coordinates and keyboard modifiers status, where:
	* x `number` the row number where the mouse is
	* y `number` the column number where the mouse is
	* ctrl `boolean` true if the CTRL key is down or not
	* alt `boolean` true if the ALT key is down or not
	* shift `boolean` true if the SHIFT key is down or not

Activated when grabInput() is used with the 'mouse' options, e.g. `{ mouse: 'button' }`, `{ mouse: 'drag' }` or `{ mouse: 'motion' }`.

The argument 'name' can be:

* MOUSE_LEFT_BUTTON_PRESSED: well... it is emitted when the left mouse button is pressed
* MOUSE_LEFT_BUTTON_RELEASED: when this button is released
* MOUSE_RIGHT_BUTTON_PRESSED, MOUSE_RIGHT_BUTTON_RELEASED, MOUSE_MIDDLE_BUTTON_PRESSED, MOUSE_MIDDEL_BUTTON_RELEASED: self explanatory
* MOUSE_WHEEL_UP, MOUSE_WHEEL_DOWN: self explanatory
* MOUSE_OTHER_BUTTON_PRESSED, MOUSE_OTHER_BUTTON_RELEASED: a fourth mouse button is sometime supported
* MOUSE_BUTTON_RELEASED: a button were released, however the terminal does not tell us which one
* MOUSE_MOTION: if the options `{ mouse: 'motion' }` is passed to grabInput(), every moves of the mouse will fire this event,
  if `{ mouse: 'drag' }` is given, it will be fired if the mouse move while a button is pressed





## Static methods of `termkit`, the module's root



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
	* processSigwinch `boolean` (default: false) true if the terminal can use the SIGWINCH signal to detect resizing

This method creates a new terminal interface.

Most of time, one may just use the default terminal interface, using `var term = require( 'terminal-kit' ).terminal ;`.
That should cover 98% of use cases.

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
and even major terminal like *gnome-terminal* or *Konsole* are sometimes terrible.

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
### .autoComplete( array , startString , [returnAlternatives] , [prefix] )

* array `Array` of string, it is the list of completion candidates
* startString `string` this is the input string to be completed
* returnAlternatives `boolean` (default: false) when many candidates match the input, if *returnAlternatives* is set then
  the method is allowed to return an array containing all matching candidates, else the input string (*startString*) is
  returned unchanged
* prefix `string` (optional) prepend that string to the response string, or add a `prefix` property to the response array:
  when used in an `inputField()`, this cause this string to be prepended to the output of the auto-complete menu.

This static method is used behind the scene by [.inputField()](#ref.inputField) when auto-completion mechanisms kick in.

This method is exposed in the API because [.inputField()](#ref.inputField) supports user-defined auto-completers, such
auto-completers might take advantage of this method for its final pass, after collecting relevant informations to feed it.

[This is an example](#ref.example.autoComplete) of its usage.


