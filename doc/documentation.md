

# Terminal Kit

A full-blown terminal lib featuring: 256 colors, styles, keys & mouse handling, input field, progress bars, 
screen buffer (including 32-bit composition), text buffer, and many more...

Whether you just need colors & styles, build a simple interactive command line tool or a complexe terminal application:
this is the absolute terminal lib for Node.js!

It does **NOT** depend on ncurses.

* License: MIT
* Platform: linux and any xterm-compatible terminal.
  These terminals have been successfully tested:
	* xterm
	* gnome-terminal
	* Konsole
	* iTerm
	* Terminator
	* xfce4-terminal
	* Linux Console
	* rxvt/urxvt
	* Eterm
	* Terminology
	* **Your terminal?** Help tracking terminal compatibilities [on github!](https://github.com/cronvel/terminal-kit/issues)

Some tutorials are available at [blog.soulserv.net/tag/terminal](http://blog.soulserv.net/tag/terminal/).



<a name="ref.quick"></a>
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

// Get some user input
term.magenta( "Enter your name: " ) ;
term.inputField(
    function( error , input ) {
        term.green( "\nYour name is '%s'\n" , input ) ;
    }
) ;
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



<a name="ref.TOC"></a>
## Table of Contents

* [Global Terminal-Kit API](global-api.md#top)
	* [termkit.terminal: The Default Instance](global-api.md#ref.terminal)
	* [termkit.realTerminal: Real Terminal Access (e.g. escaping from pipes)](global-api.md#ref.realTerminal)
	* [termkit.createTerminal()](global-api.md#ref.createTerminal)
	* [termkit.getParentTerminalInfo()](global-api.md#ref.getParentTerminalInfo)
	* [termkit.getDetectedTerminal()](global-api.md#ref.getDetectedTerminal)
	* [termkit.autoComplete()](global-api.md#ref.autoComplete)
	* [termkit.stripEscapeSequences()](global-api.md#ref.stripEscapeSequences)
	* [termkit.stringWidth()](global-api.md#ref.stringWidth)
	* [termkit.truncateString()](global-api.md#ref.truncateString)

* [Terminal's Low-level and Basic *chainable* Methods](low-level.md#top)
	* [Colors](low-level.md#ref.colors)
	* [Styles](low-level.md#ref.styles)
	* [Moving the cursor](low-level.md#ref.movingCursor)
	* [Editing the screen](low-level.md#ref.editingScreen)
	* [Input/Output](low-level.md#ref.io)
	* [Operating System](low-level.md#ref.operating-system)
	* [Modifiers](low-level.md#ref.modifiers)
	* [Misc](low-level.md#ref.misc)

* [Terminal's High-level and Advanced Methods](high-level.md#top)
	* [.fullscreen()](high-level.md#ref.fullscreen)
	* [.processExit()](high-level.md#ref.processExit)
	* [.grabInput()](high-level.md#ref.grabInput)
	* [.getCursorLocation()](high-level.md#ref.getCursorLocation)
	* [.getColor()](high-level.md#ref.getColor)
	* [.setColor()](high-level.md#ref.setColor)
	* [.getPalette()](high-level.md#ref.getPalette)
	* [.setPalette()](high-level.md#ref.setPalette)
	* [.wrapColumn()](high-level.md#ref.wrapColumn)
	* [.yesOrNo()](high-level.md#ref.yesOrNo)
	* [.inputField()](high-level.md#ref.inputField)
	* [.fileInput()](high-level.md#ref.fileInput)
	* [.singleLineMenu()](high-level.md#ref.singleLineMenu)
	* [.singleRowMenu()](high-level.md#ref.singleRowMenu)
	* [.singleColumnMenu()](high-level.md#ref.singleColumnMenu)
	* [.gridMenu()](high-level.md#ref.gridMenu)
	* [.progressBar()](high-level.md#ref.progressBar)
	* [.bar()](high-level.md#ref.bar)
	* [.slowTyping()](high-level.md#ref.slowTyping)
	
* [Terminal's Events](events.md#top)
	* ['resize'](events.md#ref.event.resize)
	* ['key'](events.md#ref.event.key)
	* ['terminal'](events.md#ref.event.terminal)
	* ['mouse'](events.md#ref.event.mouse)

* [ScreenBuffer](screenbuffer.md#top)
* *New* [ScreenBuffer HD](screenbuffer-hd.md#top)
* [TextBuffer](textbuffer.md#top)
* [Rect](rect.md#top)


