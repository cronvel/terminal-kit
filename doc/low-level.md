

<a name="top"></a>
## Terminal's Low-level and Basic *chainable* Methods

This section is about low-level methods of `Terminal` instances.

**NOTE:** In the following code sample, `term` is always a `Terminal` instance.

Basic methods map low-level terminal capabilities.

For all the functions below, additional arguments can be provided.

If a boolean is provided, it will turn the feature *on* or *off*.
For example `term.red( true )` turn all subsequent output in red, while `term.red( false )` disable red and go back
to default color.

Without arguments, it is always the same as *true*, e.g. `term.red()` do the same thing than `term.red( true )`.

Some function cannot be turned off, they just perform an action.
For example `term.reset()` reset the terminal, usually to its default.
This is not reversible, thus `term.reset( false )` does nothing.

If the additional argument is a string, then it will turn *on* the feature, output the string and finally turn *off* the feature.
That's it:  
`term.red( 'Hello world!' )`  
... is the same as:  
`term.red( true ) ; term( 'Hello world!' ) ; term.red( false ) ;`.

<a name="ref.chainable"></a>
#### Style Mixing and Chainable

Also styles can be mixed, using a nice syntax: simply chain all style and color properties!
This will output *“Hello world!”* in red, bold and italic, on a blue background:
`term.red.bgBlue.bold.italic( 'Hello world!' )`  
By the way, the order doesn't matter, so this is strictly equivalent:
`term.bgBlue.italic.bold.red( 'Hello world!' )`  

All the following functions are chainable, and their arguments can be combined.
We can do:  
`term.moveTo.red( 1 , 1 , "My name is %s, I'm %d.\n" , 'Jack' , 32  )`
which will move the cursor to (1,1), then output *“My name is Jack, I'm 32.”* in red.

<a name="ref.string-formatting"></a>
#### String Formatting

Also those string support a printf()-like formatting syntax.  
So we can do `term.red( "My name is %s, I'm %d." , 'Jack' , 32 )` to output *“My name is Jack, I'm 32.”* in red.

<a name="ref.style-markup"></a>
#### Style Markup

Style markup are introduced by a caret `^` followed by another character.
Colors are produced by the first letter of its name, e.g. red is produced with a `^r`, except black which is produced by `^k`.
Other styles are produced with a symbol. For example `^_` switch to underline.
To remove all styles, `^:` or `^ ` can be used.
A style reset is always produced at the end of the string as soon as one style markup was used.

Those two lines produce the same result:
```js
term( "My name is " ).red( "Jack" )( " and I'm " ).green( "32\n" ) ;
term( "My name is ^rJack^ and I'm ^g32\n" ) ;
```

See [the full style markup reference](markup.md#top) for details.



## Table of Contents

* [Properties](#ref.properties)
* Methods
	* [Colors](#ref.colors)
	* [Background Colors](#ref.bgColors)
	* [Styles](#ref.styles)
	* [Moving the cursor](#ref.movingCursor)
	* [Editing the screen](#ref.editingScreen)
	* [Input/Output](#ref.io)
	* [Operating System](#ref.operating-system)
	* [Modifiers](#ref.modifiers)
	* [Misc](#ref.misc)



<a name="ref.properties"></a>
### Properties

* .width: the width of the terminal
* .height: the height of the terminal



<a name="ref.colors"></a>
### Foreground colors

* .defaultColor(): back to the default foreground color
* .black(): ...
* .red(): ...
* .green(): ...
* .yellow(): dark yellow, most of time it is brown or orange
* .blue(): ...
* .magenta(): ...
* .cyan(): ...
* .white(): ...
* .brightBlack()/.gray()/.grey(): dark gray
* .brightRed(): ...
* .brightGreen(): ...
* .brightYellow(): true yellow
* .brightBlue(): ...
* .brightMagenta(): ...
* .brightCyan(): ...
* .brightWhite(): ...
* .color(register): choose between 16 colors using an 0..15 integer, **it also accepts a color name**
* .darkColor(register): choose between 8 regular (dark) colors using an 0..7 integer
* .brightColor(register): choose between 8 bright colors using an 0..7 integer
* .color256(register): if the terminal support 256 colors, it chooses between them using an 0..255 integer
* .colorRgb(r,g,b): pick the closest match for an RGB value (from a 16 or 256 colors palette or even the 
	exact color if the terminal support 24 bits colors), *r,g,b* are in the 0..255 range
* .colorRgbHex(rgb): pick the closest match for an RGB value (from a 16 or 256 colors palette or even the 
	exact color if the terminal support 24 bits colors), where *rgb* is in the hex format, e.g. `#ef1234`
* .colorGrayscale(l): pick the closest match for a grayscale value (from a 16 or 256 colors palette or
	even the exact color if the terminal support 24 bits colors), *l* is in the 0..255 range



<a name="ref.bgColors"></a>
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
* .bgBrightBlack()/.bgGray()/.bgGrey(): dark gray
* .bgBrightRed(): ...
* .bgBrightGreen(): ...
* .bgBrightYellow(): true yellow
* .bgBrightBlue(): ...
* .bgBrightMagenta(): ...
* .bgBrightCyan(): ...
* .bgColor(register): choose between 16 colors using an 0..15 integer, **it also accepts a color name**
* .bgBrightWhite(): choose between 8 regular (dark) colors using an 0..7 integer
* .bgBrightColor(): choose between 8 bright colors using an 0..7 integer
* .bgColor256(register): if the terminal support 256 colors, it choose between them using an 0..255 integer
* .bgColorRgb(r,g,b): pick the closest match for an RGB value (from a 16 or 256 colors palette or even the
	exact color if the terminal support 24 bits colors) as the background color, *r,g,b* are in the 0..255 range
* .bgColorRgbHex(rgb): pick the closest match for an RGB value (from a 16 or 256 colors palette or even the
	exact color if the terminal support 24 bits colors) as the background color,
	where *rgb* is in the hex format, e.g. `#ef1234`
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
* .scrollUp(n): scroll whole page up by 'n' lines, new lines are added at the bottom, the absolute cursor position do not change (Linux Console doesn't support it)
* .scrollDown(n): scroll whole page down by 'n' lines, new lines are added at the top, the absolute cursor position do not change (Linux Console doesn't support it)
* .scrollingRegion(top,bottom): limit all scrolling operations to the region between *top* and *bottom* line included (Linux Console doesn't support it)
* .resetScrollingRegion(): reset the scrolling region: the whole screen would be affected by scrolling operation again (Linux Console doesn't support it)
* .moveTo(x,y): move the cursor to the (x,y) coordinate (1,1 is the upper-left corner)
* .move(x,y): relative move of the cursor
* .hideCursor(): hide/show the cursor
* .tabSet(): set a new tab stop at the current cursor position
* .tabClear(): clear the tab stop at the current cursor position
* .tabClearAll(): clear all tab stops
* .forwardTab(n): move the cursor to the next tabulation 'n' times
* .backwardTab(n): move the cursor to the previous tabulation 'n' times



<a name="ref.editingScreen"></a>
### Editing the Screen

* .clear(): clear the screen and move the cursor to the upper-left corner
* .eraseDisplayBelow(): erase everything below the cursor
* .eraseDisplayAbove(): erase everything above the cursor
* .eraseDisplay(): erase everything
* .eraseScrollback(): erase the *history* lines, a.k.a. the *saved line* or the *scrollback buffer*
* .eraseLineAfter(): erase current line after the cursor
* .eraseLineBefore(): erase current line before the cursor
* .eraseLine(): erase current line
* .eraseArea(x,y,[width],[height]): a handy higher level method that erases a rectangular area on the screen
* .insertLine(n): insert n lines
* .deleteLine(n): delete n lines
* .insert(n): insert n chars after (like the INSERT key). The inserted characters are empty ones (equivalent to spaces).
* .delete(n): delete n chars after (like the DELETE key)
* .erase(n): erase n chars after (i.e. overwrite with empty char)
* .backDelete(): delete one char backward (like the BACKSPACE key), shorthand composed by a .left(1)
  followed by a .delete(1)
* .scrollUp(n): scroll up n lines, new lines are added at the bottom
* .scrollDown(n): scroll down n lines, new lines are added at the top
* .alternateScreenBuffer(): this set/unset the alternate screen buffer, many terminal do not support it or inhibit it



<a name="ref.io"></a>
### Input/Output

* .requestCursorLocation(): request the cursor location, a 'terminal' event will be fired when available
* .requestScreenSize(): **DEPRECATED** request for screen size, a 'terminal' event will be fired when available,
	**DO NOT USE**: use .width and .height instead, those properties are updated whenever a resize event is received
* .requestColor(n): **rarely useful** request for color *n*, **DO NOT USE**: use high-level .getColor() instead
* .applicationKeypad(): should allow keypad to send different code than 0..9 keys, not widely supported



<a name="ref.internal-io"></a>
### Internal input/output (do not use directly, use grabInput() instead)

* .mouseButton(): ask the terminal to send event when a mouse button is pressed, with the mouse cursor position
* .mouseDrag(): ask the terminal to send event when a mouse button is pressed and when draging, with the mouse cursor position
* .mouseMotion(): ask the terminal to send all mouse event, even mouse motion that occurs without buttons
* .mouseSGR(): another mouse protocol that extend coordinate mapping (without it, it supports only 223 rows and columns)
* .focusEvent(): ask the terminal to send event when it gains and loses focus, not widely supported



<a name="ref.operating-system"></a>
### Operating System

* .cwd(uri): set the terminal's Current Working Directory to *uri* (should start with *file://*)
* .windowTitle(str): set the title of an xterm-compatible window to *str*
* .iconName(str): set the icon name to *str*
* .notify(title,text): (*gnome-terminal*) produce a notification **if the terminal is not the foreground window**



<a name="ref.modifiers"></a>
### Modifiers

* .error(): it will write to STDERR instead of STDOUT
  E.g.: `term.error.red( 'Got error %E' , myError )` will output to *STDERR*  the error inspection of `myError`,
  preceded by *'Got error '*, all in red.
* .str(): do not output anything, instead return a string containing the sequences.
  E.g.: `var myString = term.str.blue( 'BLUE' )` will write in `myString` a string containing the escape code for blue,
  the text *'BLUE'* and the style-reset escape sequence
* .noFormat(str): disable all string formatting and markup, output *str* without interpreting it - useful when your
  string may contain `%` and `^` (e.g. user input) and you don't want to escape them
* .markupOnly(str): disable string formatting but still interpret `^` [markup](markup.md#top) for details.
* .wrap(str): enable word wrapping, and support continuing text. By default it wraps using the full terminal width,
  but it can be configurable. See [.wrapColumn()](high-level.md#ref.wrapColumn) for configuration and behavior details.
* .bindArgs(...): since it is not possible to use *.bind()* on Terminal-kit's chainable functions, this is a replacement.
  When used, instead of doing anything, it just returns a function. A common use-case is for high-level methods that
  require a styling function, e.g.: `term.bar( 0.26 , { barStyle: term.red } )`.
  If we want to use *truecolor*, we have to do: `term.bar( 0.26 , { barStyle: term.colorRgbHex.bindArgs( '#650fbe' ) } )`.



<a name="ref.misc"></a>
### Misc

* .reset(): full reset of the terminal
* .bell(): emit an audible bell
* .setCursorColor(register): set the cursor color to one of the 256 *register*
* .setCursorColorRgb(r,g,b): set the cursor color to a custom RGB value
* .resetCursorColorRgb(): reset the cursor color to the terminal's default
* .setDefaultColorRgb(r,g,b): set the default foreground color
* .resetDefaultColorRgb(): reset the foreground color to the terminal's default
* .setDefaultBgColorRgb(r,g,b): set the default background color, most of time the terminal window background
* .resetDefaultBgColorRgb(): reset the background color to the terminal's default
* .setHighlightBgColorRgb(r,g,b): set the highlight (selection) background color, replace the default behavior
  which is to invert the foreground and background color on selection
* .resetHighlightBgColorRgb(): reset the highlight (selection) background color, restore back the default behavior
  which is to invert the foreground and background color on selection
  
