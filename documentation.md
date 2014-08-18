

# Terminal Kit

Terminal utilities for node.js, it supports 'xterm' compatible terminal and the Linux Console.

* License: MIT
* Current status: alpha/unstable
* Platform: linux, tested with gnome-terminal, xterm and Linux Console so far

Work in progress, only a rough documentation ATM.



# Feature

* colors
* styles (bold, underline, italic, and many more)
* string formating
* style mixing
* cursor positionning
* keyboard input
* mouse support
* terminal window title
* event-driven



# Quick example

```js
var term = require( 'terminal-kit' ) ;
term( 'Hello world!\n' ) ; // output "Hello world!" normally
term.red( 'red' ) ; // output 'red' in red
term.bold( 'bold' ) ; // output 'bold' in bold
term.bold.underline.red( 'mixed' ) ; // output 'mixed' using bold, underlined red, exposing style-mixing syntax
term.green( "My name is %s, I'm %d.\n" , 'Jack' , 32 ) ; // printf() style formating everywhere: this will output 'My name is Jack, I'm 32.' in green
```



# Short function description


## Common/Misc

* reset(): full reset the terminal.
* error(): it just set error to true so it will write to STDERR instead of STDOUT
* beep(): emit a beep


## Foreground colors

* defaultColor(): back to the default foreground color
* black(): ...
* red(): ...
* green(): ...
* yellow(): dark yellow, most of time brown or orange
* blue(): ...
* magenta(): ...
* cyan(): ...
* white(): ...
* brightBlack(): ...
* brightRed(): ...
* brightGreen(): ...
* brightYellow(): true yellow
* brightBlue(): ...
* brightMagenta(): ...
* brightCyan(): ...
* brightWhite(): ...
* color(register): choose between 16 colors using an 0..15 integer
* darkColor(register): choose between 8 regular (dark) colors using an 0..7 integer
* brightColor(register): choose between 8 bright colors using an 0..7 integer


## Background colors

* bgDefaultColor(): back to the default background color
* bgBlack(): ...
* bgRed(): ...
* bgGreen(): ...
* bgYellow(): dark yellow, most of time brown or orange
* bgBlue(): ...
* bgMagenta(): ...
* bgCyan(): ...
* bgWhite(): ...
* bgDarkColor(): ...
* bgBrightBlack(): ...
* bgBrightRed(): ...
* bgBrightGreen(): ...
* bgBrightYellow(): true yellow
* bgBrightBlue(): ...
* bgBrightMagenta(): ...
* bgBrightCyan(): ...
* bgColor(register): choose between 16 colors using an 0..15 integer
* bgBrightWhite(): choose between 8 regular (dark) colors using an 0..7 integer
* bgBrightColor(): choose between 8 bright colors using an 0..7 integer


## Styles

* styleReset(): reset all styles and go back to default colors without
* bold(): bold text
* dim(): faint color
* italic(): italic
* underline(): underline
* blink(): blink text, not widely supported
* inverse(): foreground and background color
* hidden(): invisible, but can be copy/paste'd
* strike(): strike throught


## Cursors

* saveCursor(): save cursor position
* restoreCursor(): restore a previously saved cursor position
* up(n): move the cursor 'n' chars up
* down(n): move the cursor 'n' chars down
* right(n): move the cursor 'n' chars right
* left(n): move the cursor 'n' chars left
* moveTo(x,y): move the cursor to the (x,y) coordinate (1,1 is the upper-left corner)
* move(x,y): relative move of the cursor


## Editing

* clear(): clear the screen and move the cursor to the upper-left corner
* eraseDisplayBelow(): erase everything below the cursor
* eraseDisplayAbove(): erase everything above the cursor
* eraseDisplay(): erase everything
* eraseLineAfter(): erase current line after the cursor
* eraseLineBefore(): erase current line before the cursor
* eraseLine(): erase current line
* alternateScreenBuffer(boolean): this set/unset the alternate screen buffer, many terminal do not support it or inhibit it


## Input/Output

* requestCursorLocation(): request the cursor location, a 'terminal' event will be fired when available
* requestScreenSize(): request for screen size, a 'terminal' event will be fired when available (rarely useful, most of time this event is fired on resize)
* applicationKeypad(): should allow keypad to send different code than 0..9 keys, not widely supported
* grabInput(options): turn input grabbing on, keyboard entry will not be echoed, every input will generate an event


## Internal input/output (do not use directly, use grabInput() instead)

* mouseButton(): ask the terminal to send event when a mouse button is pressed, with the mouse cursor position
* mouseDrag(): ask the terminal to send event when a mouse button is pressed and when draging, with the mouse cursor position
* mouseMotion(): ask the terminal to send all mouse event, even mouse motion that occurs without buttons
* mouseSGR(): another mouse protocol that extend coordinate mapping (without it, it supports only 223 rows and columns)
* focusEvent(): ask the terminal to send event when it gains and loses focus, not widely supported


## OS functions (not widely supported)

* windowTitle(): set the title of an xterm-compatible window


# Input management with `grabInput()`

Quick example:

```js
var term = require( '../lib/terminal.js' ) ;

function terminate()
{
	term.grabInput( false ) ;
	setTimeout( function() { process.exit() } , 100 ) ;
}

term.bold.cyan( 'Key test, hit anything on the keyboard to see how it is detected...\n' ) ;
term.green( 'Hit CTRL-C to quit.\n\n' ) ;

term.grabInput( { mouse: 'button' } ) ;

term.on( 'key' , function( name , matches , data ) {
	console.log( "'key' event:" , name ) ;
	if ( matches.indexOf( 'CTRL_C' ) >= 0 ) { terminate() ; }
} ) ;

term.on( 'terminal' , function( name , data ) {
	console.log( "'terminal' event:" , name , data ) ;
} ) ;

term.on( 'mouse' , function( name , data ) {
	console.log( "'mouse' event:" , name , data ) ;
} ) ;
```
