

<a name="top"></a>
<a name="ref.TextBuffer"></a>
## The TextBuffer

A *textBuffer* is a buffer holding text contents that can be used for things like *text areas*, or even *text editors*.

A *textBuffer* is way more flexible than a raw *screenBuffer* for that purpose.
Nonetheless, a *textBuffer* is always backed by a [*screenBuffer*](screenbuffer.md#top), i.e. its *dst* (destination)
should be a *screenBuffer*.

Internally, it has 3 buffers:
* a buffer holding raw text (line of text): *raw text buffer*
* a buffer holding attributes (colors, styles): the *attr buffer*
* a misc buffer holding userland data, useful for your application: the *misc buffer*

It comes with a lot of facilities to interact with the text, to manage the cursor, to colorize the text, to manage tabs...



## Table of Contents



<a name="ref.TextBuffer.create"></a>
### TextBuffer.create( options )

* options `Object`, where:
	* dst: `ScreenBuffer` the destination to write on
	* width `integer` (optional, default: Infinity) width, i.e. max-length of a line
	* height `integer` (optional, default: Infinity) height, i.e. maximum number of lines
	* x: `integer` (optional) default x-position in the dst
	* y: `integer` (optional) default y-position in the dst
	* tabWidth: `integer` (optional, default: 4) set the tabulation width
	* forceInBound: `integer` (optional, default: false) if true, the cursor cannot move out of bounds
	* hidden: `boolean` (optional, default: false) if true, the text is invisible
	* wrap: `boolean` (optional, default: false) set the wrapping behavior

This creates a TextBuffer instance with the appropriate options.



<a name="ref.TextBuffer.getText"></a>
### .getText()

It extracts and returns the text content of the *textBuffer*.



<a name="ref.TextBuffer.setText"></a>
### .setText( text )

* text `string` the text content

This set the text content of the *textBuffer*.

It reset both the *attr buffer* and the *misc buffer*.

