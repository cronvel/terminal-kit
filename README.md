

# Terminal Kit

Terminal utilities for node.js, it supports 'xterm' compatible terminal and the Linux Console.
It does not depend on ncurses.

* License: MIT
* Current status: alpha/unstable
* Platform: linux, tested with gnome-terminal, xterm and Linux Console so far

Work in progress, only a rough documentation ATM.



# Features

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

// output 'mixed' using bold, underlined red, exposing style-mixing syntax
term.bold.underline.red( 'mixed' ) ; 

// printf() style formating everywhere: this will output 'My name is Jack, I'm 32.' in green
term.green( "My name is %s, I'm %d.\n" , 'Jack' , 32 ) ;

// Width and height of the terminal
term( 'The terminal size is %dx%d' , term.width , term.height ) ;

// Move the cursor at the upper-left corner
term.moveTo( 1 , 1 ) ;

// We can always pass additionnal arguments that will be displayed...
term.moveTo( 1 , 1 , 'Upper-left corner' ) ;

// ... and formated
term.moveTo( 1 , 1 , "My name is %s, I'm %d.\n" , 'Jack' , 32 ) ;

// ... or even combined with other styles
term.moveTo.cyan( 1 , 1 , "My name is %s, I'm %d.\n" , 'Jack' , 32  ) ;
```



# Short function description

All those functions are chainable, and their arguments can be combined.


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
* strike(): strike through


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


## Internal input/output (do not use directly, use grabInput() instead)

* mouseButton(): ask the terminal to send event when a mouse button is pressed, with the mouse cursor position
* mouseDrag(): ask the terminal to send event when a mouse button is pressed and when draging, with the mouse cursor position
* mouseMotion(): ask the terminal to send all mouse event, even mouse motion that occurs without buttons
* mouseSGR(): another mouse protocol that extend coordinate mapping (without it, it supports only 223 rows and columns)
* focusEvent(): ask the terminal to send event when it gains and loses focus, not widely supported


## OS functions (not widely supported)

* windowTitle(): set the title of an xterm-compatible window



# Input management with `grabInput(options)`

* options: false/true/Object, *false* disable input grabbing, *true* or an Object turn it on,
  if it is an Object then those properties are supported:
	* mouse: if defined, it activate mouse event, those values are supported for 'mouse':
		* 'button': report only button-event
		* 'drag': report button-event, report motion-event only when a button is pressed (i.e. it is a mouse drag)
		* 'motion': report button-event & all motion-event, use it only when needed, many escape sequences are sent from the terminal
		  (for example, one may consider this for script running over SSH)
	* focus: true/false: if defined and true, focus event will be reported (if your terminal support it - *xterm* does)

This function turns input grabbing on, keyboard entries will not be echoed, and every input will generate an event on the `term` object.

Quick example:

```js
var term = require( 'terminal-kit' ) ;

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
	if ( matches.indexOf( 'CTRL_C' ) >= 0 ) { terminate() ; }
} ) ;

term.on( 'terminal' , function( name , data ) {
	console.log( "'terminal' event:" , name , data ) ;
} ) ;

term.on( 'mouse' , function( name , data ) {
	console.log( "'mouse' event:" , name , data ) ;
} ) ;
```


## 'key' event ( name , matches )
* name: string, the key name
* matches: array of matched key name

The 'key' event is emited whenever the user type something on the keyboard.

If `name` is a single char, this is a regular UTF8 character, entered by the user.
If the user type a word, each UTF8 character will produce its own 'key' event.

If `name` is a multiple chars string, then it is a SPECIAL key.

List of SPECIAL keys:

    ESCAPE ENTER BACKSPACE NUL TAB SHIFT_TAB 
    UP DOWN RIGHT LEFT
    INSERT DELETE HOME END PAGE_UP PAGE_DOWN
    KP_NUMLOCK KP_DIVIDE KP_MULTIPLY KP_MINUS KP_PLUS KP_DELETE KP_ENTER
    KP_0 KP_1 KP_2 KP_3 KP_4 KP_5 KP_6 KP_7 KP_8 KP_9
    F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12
    SHIFT_UP SHIFT_DOWN SHIFT_RIGHT SHIFT_LEFT
    ALT_UP ALT_DOWN ALT_RIGHT ALT_LEFT
    CTRL_UP CTRL_DOWN CTRL_RIGHT CTRL_LEFT

And modifier on regular A-Z key:

    CTRL_A ALT_A CTRL_ALT_A
    CTRL_B ALT_B CTRL_ALT_B
    CTRL_C ALT_C CTRL_ALT_C
    ...

Sometime, a key matches multiple combination. For example CTRL-M on linux boxes is always the same as ENTER.
So the event will provide as the 'name' argument the most useful/common, here *ENTER*.
However the 'matches' argument will contain `[ ENTER , CTRL_M ]`.

Also notice that some terminal will support less keys. For example, the Linux Console does not support SHIFT/CTRL/ALT + Arrows keys,
it will produce a normal arrow key.
There is no workaround here, the underlying keyboard driver simply does not support this.

KP_* keys needs `applicationKeypad()`, e.g. without it KP_1 will report '1' or END.
Some terminal does not support `applicationKeypad()` very well, and it is nearly impossible to differenciate (for example) a KP_1 from
an END, or a KP_7 from a HOME, since most X terminal will be reported as xterm or xterm-256color happily, but still does not report key
the same way...



## 'terminal' event
* name: string, the name of the subtype of event
* data: Object, provide some data depending on the event

The 'terminal' event is emited for terminal generic information.

The argument 'name' can be:

* CURSOR_LOCATION: it is emited in response of a requestCursorLocation(), data contains 'x' & 'y', the coordinate of the cursor.

* SCREEN_SIZE: it is emited in response of a requestScreenSize(), data contains 'width' & 'height', the size of the screen in characters,
  and 'resized' (true/false) if the size has changed

* SCREEN_RESIZE: it is emited when a terminal resizing is detected, most of time issuing a requestScreenSize() is useless,
  node will be notified of screen resizing, and so this event will be emited

* FOCUS_IN: it is emited if the terminal gains focus (if supported by your terminal)

* FOCUS_OUT: it is emited if the terminal loses focus (if supported by your terminal)



## 'mouse' event
* name: string, the name of the subtype of event
* data: Object, provide the mouse coordinate and keyboard modifier status, properties:
	* x: integer, the row number where the mouse is
	* y: integer, the column number where the mouse is
	* ctrl: true/false, if the CTRL key is down or not
	* alt: true/false, if the ALT key is down or not
	* shift: true/false, if the SHIFT key is down or not

Activated when grabInput() is used with the 'mouse' options, e.g. `{ mouse: 'button' }`, `{ mouse: 'drag' }` or `{ mouse: 'motion' }`.

The argument 'name' can be:

* MOUSE_LEFT_BUTTON_PRESSED: well... it is emited when the left mouse button is pressed
* MOUSE_LEFT_BUTTON_RELEASED: when this button is released
* MOUSE_RIGHT_BUTTON_PRESSED, MOUSE_RIGHT_BUTTON_RELEASED, MOUSE_MIDDLE_BUTTON_PRESSED, MOUSE_MIDDEL_BUTTON_RELEASED: self explanatory
* MOUSE_WHEEL_UP, MOUSE_WHEEL_DOWN: self explanatory
* MOUSE_OTHER_BUTTON_PRESSED, MOUSE_OTHER_BUTTON_RELEASED: a fourth mouse button is sometime supported
* MOUSE_MOTION: if the options `{ mouse: 'motion' }` is given to grabInput(), every move of the mouse will fire this event,
  if `{ mouse: 'drag' }` is given, it will be fired if the mouse move while a button is pressed



