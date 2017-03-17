

## The ScreenBuffer

A *screenBuffer* is a buffer holding content for a rectangular area.
Each cell of the rectangular area contains:

* a character
* a style (foreground and background color, and styyle bit flags: bold, dim, italic, underline, blink,
  inverse, hidden, strike)
* a blending mask (bit flags: foreground transparency, background transparency, character transparency
  and style transparency)

They are two kind of *screenBuffer*s, depending on the write-destination:

* *screenBuffer* writing directly to the terminal
* *screenBuffer* writing to another *screenBuffer*

When there are a lot of moving things, it is a good practice to first create one big *screenBuffer* mapping the whole terminal,
then create smaller *screenBuffers* writing to the terminal's *screenBuffer*, each one managing a part of the UI of the application,
a widget, a moving area, a sprite, etc.

ScreenBuffer's write to the terminal are optimized: since writing to a terminal can be CPU-intensive, only cells
that have changed are written, avoiding to refresh the whole screen for no reason.
The *screenBuffer* will always try to minimize the amount of terminal escape sequences to produce the new *frame*.



<a name="ref.ScreenBuffer.create"></a>
### ScreenBuffer.create( options )

* options `Object`, where:
	* width `integer` buffer width (default to dst.width)
	* height `integer` buffer height (default to dst.height)
	* dst: a `Terminal` or `ScreenBuffer` instance, the destination to write on
	* x: `integer` (optional) default x-position in the dst
	* y: `integer` (optional) default y-position in the dst
	* wrap: `boolean` (optional, default: true) default wrapping behavior of [.put()](#ref.ScreenBuffer.put)
	* noFill: `boolean` (optional, default: false) if true, the *screenBuffer* will not be filled with empty chars,
	  i.e. it will not call [.fill()](#ref.ScreenBuffer.fill), useful for performance to avoid useless reset

This creates a ScreenBuffer instance with the appropriate options.



<a name="ref.ScreenBuffer.createFromString"></a>
### ScreenBuffer.createFromString( options , str )

* options `Object`, where:
	* attr `Object` or `integer` attributes of the chars (attribute object or bit flags, passed to [.put()](#ref.ScreenBuffer.put))
	* transparencyChar `string` a single character that is transparent
	* transparencyType `integer` bit flags for the transparency char
* str `string` the source string

This creates a ScreenBuffer instance from a string.
The height and width of the *screenBuffer* is computed using respectively the number of lines and the length of the largest line.
The string is written into the *screenBuffer* using the `attr` option.
See [the attr object and flags](#ref.ScreenBuffer.attr) for details.

If the `transparencyChar` option is set, this character will produce a transparent cell, or if `transparencyType` is specified,
a partly transparent cell.
See [the transparency flags](#ref.ScreenBuffer.transparency-flags) for details.



<a name="ref.ScreenBuffer.fill"></a>
### ScreenBuffer#fill( options )

* options `Object`, where:
	* attr `Object` or `integer` attributes of the chars (attribute object or bit flags, passed to [.put()](#ref.ScreenBuffer.put))
	* char `string` a single character used to fill the buffer

It fills the *screenBuffer* with the specified *char* and *attributes*.



<a name="ref.ScreenBuffer.put"></a>
### ScreenBuffer#put( options , format , [arg1] , [arg2] , ... )

* options `Object`, where:
	* x `integer` (optional) x-coordinate where to put the text, bypassing the cursor x-coordinate
	* y `integer` (optional) y-coordinate where to put the text, bypassing the cursor y-coordinate
	* attr `Object` or `integer` attributes of the chars (attribute object or bit flags, passed to [.put()](#ref.ScreenBuffer.put))
	* wrap `boolean` if true, text wrapping is enabled: when the cursor move beyond the last column, it is moved to the begining
	  of the next line
	* direction `string` the direction where the cursor move after each char, one of:
		* 'right' (default)
		* 'left'
		* 'up'
		* 'down'
		* 'none'/null: do not move after puting a char
	* dx `integer` x-coordinate increment of the cursor after each character (default: 1),
	  allow more precise controle than the *direction* option
	* dy `integer` y-coordinate increment after each character (default: 0),
	  allow more precise controle than the *direction* option
	* attr `Object` or `integer` attributes of the chars (attribute object or bit flags, passed to [.put()](#ref.ScreenBuffer.put))
* format `string` the string or the formated string to put into the *screenBuffer*
  (works just like any other `term( format , args... )`)
* arg1 (optional) the first argument of the format
* ...

It puts some text into the *screenBuffer*, using the provided *attributes*.



<a name="ref.ScreenBuffer.get"></a>
### ScreenBuffer#get( [options] )

* options `Object` (optional), where:
	* x `integer` (optional) x-coordinate of the cell to get, bypassing the cursor x-coordinate
	* y `integer` (optional) y-coordinate of the cell to get, bypassing the cursor y-coordinate

It gets the character and attributes of the cell the *screenBuffer*'s cursor is at, or the cell for the supplied x and y coordinate.
It returns an object, where:
* char `string` a single character string, the character at that cell
* attr `Object` the attribute object for this cell




<a name="ref.ScreenBuffer.resize"></a>
### ScreenBuffer#resize( [options] )

* options `Object` (optional), where:
	* x `integer` (optional) x-coordinate of the cell to get, bypassing the cursor x-coordinate
	* y `integer` (optional) y-coordinate of the cell to get, bypassing the cursor y-coordinate

It gets the character and attributes of the cell the *screenBuffer*'s cursor is at, or the cell for the supplied x and y coordinate.
It returns an object, where:
* char `string` a single character string, the character at that cell
* attr `Object` the attribute object for this cell




<a name="ref.ScreenBuffer.attr"></a>
<a name="ref.ScreenBuffer.transparency-flags"></a>

