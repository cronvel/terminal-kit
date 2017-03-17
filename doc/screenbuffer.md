

<a name="ref.ScreenBuffer"></a>
## The ScreenBuffer

A *screenBuffer* is a buffer holding contents for a rectangular area.
Each cell of the rectangular area contains:

* a character
* a foreground color
* a background color
* a style (bit flags: bold, dim, italic, underline, blink, inverse, hidden, strike)
* a blending mask (bit flags: foreground transparency, background transparency, character transparency
  and style transparency)

They are two kind of *screenBuffer*s, depending on the write-destination:

* *screenBuffer* writing directly to the terminal
* *screenBuffer* writing to another *screenBuffer*

When there are a lot of moving things, it is a good practice to first create one big *screenBuffer* mapping the whole terminal,
then create smaller *screenBuffers* writing to the terminal's *screenBuffer*, each one managing a part of the UI of the application,
a widget, a moving area, a sprite, etc.

ScreenBuffer's write to the terminal are optimized ([if the *delta* option is on](#ref.ScreenBuffer.draw)):
since writing to a terminal can be CPU-intensive, only cells that have changed are written, avoiding to refresh
the whole screen for no reason.
In that case, the *screenBuffer* will always try to minimize the amount of terminal escape sequences to produce the new *frame*.



## Table of Contents

* Static methods:
	* [ScreenBuffer.create()](#ref.ScreenBuffer.create)
	* [ScreenBuffer.createFromString()](#ref.ScreenBuffer.createFromString)
	* [ScreenBuffer.attr2object()](#ref.ScreenBuffer.attr2object)
	* [ScreenBuffer.object2attr()](#ref.ScreenBuffer.object2attr)
	* [ScreenBuffer.loadSync()](#ref.ScreenBuffer.loadSync)

* Methods:
	* [.saveSync()](#ref.ScreenBuffer.saveSync)
	* [.fill()](#ref.ScreenBuffer.fill)
	* [.clear()](#ref.ScreenBuffer.clear)
	* [.put()](#ref.ScreenBuffer.put)
	* [.get()](#ref.ScreenBuffer.get)
	* [.resize()](#ref.ScreenBuffer.resize)
	* [.draw()](#ref.ScreenBuffer.draw)
	* [.drawCursor()](#ref.ScreenBuffer.drawCursor)
	* [.moveTo()](#ref.ScreenBuffer.moveTo)
	* [.dumpChars()](#ref.ScreenBuffer.dumpChars)
	* [.dump()](#ref.ScreenBuffer.dump)

* [The Attribute Object](#ref.ScreenBuffer.attributes)



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



<a name="ref.ScreenBuffer.attr2object"></a>
### ScreenBuffer.attr2object( attrFlags )

* attrFlags `integer` attributes in the bit flags form

It returns the object form of the attributes from its bit flags form.



<a name="ref.ScreenBuffer.object2attr"></a>
### ScreenBuffer.object2attr( attrObject )

* attrObject `Object` attributes in the object form

It returns the bit flags form of the attributes from its object form.



<a name="ref.ScreenBuffer.loadSync"></a>
### ScreenBuffer.loadSync( filepath )

* filepath `string` the path of a *screenBuffer* file to load

This static method loads a *screenBuffer* file and returns a `ScreenBuffer` instance.



<a name="ref.ScreenBuffer.saveSync"></a>
### .saveSync( filepath )

* filepath `string` the path of the file to write the *screenBuffer*

This saves the *screenBuffer* into a file.



<a name="ref.ScreenBuffer.fill"></a>
### .fill( [options] )

* options `Object` (optional), where:
	* attr `Object` or `integer` attributes of the chars (attribute object or bit flags, passed to [.put()](#ref.ScreenBuffer.put))
	* char `string` a single character used to fill the buffer

It fills the *screenBuffer* with the specified *char* and *attributes*.



<a name="ref.ScreenBuffer.clear"></a>
### .clear()

It clears the *screenBuffer*, this is like calling [.fill()](#ref.ScreenBuffer.fill) with no argument.



<a name="ref.ScreenBuffer.put"></a>
### .put( options , format , [arg1] , [arg2] , ... )

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
### .get( [options] )

* options `Object` (optional), where:
	* x `integer` (optional) x-coordinate of the cell to get, bypassing the cursor x-coordinate
	* y `integer` (optional) y-coordinate of the cell to get, bypassing the cursor y-coordinate

It gets the character and attributes of the cell the *screenBuffer*'s cursor is at, or the cell for the supplied x and y coordinate.
It returns an object, where:
* char `string` a single character string, the character at that cell
* attr `Object` the attribute object for this cell




<a name="ref.ScreenBuffer.resize"></a>
### .resize( fromRect )

* fromRect `Object` or `Rect` the rectangle used to resize the buffer, if it is an object, it should contains properties
  needed by the [`Rect`'s contructor](https://github.com/cronvel/terminal-kit/blob/master/doc/rect.md), namely either:
	* width `integer` the width of the rectangle
	* height `integer` the height of the rectangle
	* x `integer` (optional, default to the left-most x-coordinate) the minimum x-coordinate of the rectangle
	* y `integer` (optional, default to the top-most y-coordinate) the minimum y-coordinate of the rectangle
  or:
	* xmin `integer` the minimum x-coordinate of the rectangle
	* xmax `integer` the maximum x-coordinate of the rectangle (included)
	* ymin `integer` the minimum y-coordinate of the rectangle
	* ymax `integer` the maximum y-coordinate of the rectangle (included)

This resizes the *screenBuffer*.

If only the *width* and the *height* is given, the *screenBuffer* will shrink/enlarge from its right-side and bottom-side.
With the four properties, it is possible to define where the current *screenBuffer* area will land after the resize.



<a name="ref.ScreenBuffer.draw"></a>
### .draw( [options] )

* options `Object` (optional) if provided, each defined option will overide the default behavior. Available options are:
	* dst `Terminal` or `ScreenBuffer` (optional) overide the `screenBuffer.dst`
	* x `integer` (optional) overide `screenBuffer.x`
	* y `integer` (optional) overide `screenBuffer.y`
	* srcClipRect `Rect` (optional, default: the whole source region is used) the source clipping rectangle
	* dstClipRect `Rect` (optional, default: the whole destination region is used) the destination clipping rectangle
	* blending `boolean` (optional, default: false) if true blending (transparencies) is allowed, **it does not work if
	  dst is a terminal**, it only works when drawing to another *screenBuffer*
	* delta `boolean` (optional, default: false) if true and if the destination is a **terminal**, only the cells that have changed since
	  the last draw will be updated: **it will keep performance of terminal application high**
	* wrap `boolean` or `string` (optional, default: false) if set, wrapping will be enabled, it can be set to:
		* 'x': only wrap along the x-axis
		* 'y': only wrap along the y-axis
		* true, 'both': wrap along the x and y axis
		* false: no wrapping
	* tile `boolean` (optional, default: false) if true, the source will fill the destination entirely, using tiling: the source is repeated
	  multiple times along the x and y axis.

This draws the current *screenBuffer* into its *dst* (destination), which is either a `Terminal`
or another `ScreenBuffer` instance.



<a name="ref.ScreenBuffer.drawCursor"></a>
### .drawCursor( [options] )

* options `Object` (optional) if provided, each defined option will overide the default behavior. Available options are:
	* dst `Terminal` or `ScreenBuffer` (optional) overide the `screenBuffer.dst`

This draws the current *screenBuffer*'s cursor into its *dst* (destination), which is either a `Terminal`
or another `ScreenBuffer` instance.
*Drawing the cursor* means that the destination cursor is moved to the coordinate of the source cursor.

This method is useful if the source is something that receive user input: the user must know where he is writing.



<a name="ref.ScreenBuffer.moveTo"></a>
### .moveTo( x , y )

* x `integer` new cursor x-coordinate
* y `integer` new cursor y-coordinate

It moves the *screenBuffer* cursor.



<a name="ref.ScreenBuffer.dumpChars"></a>
### .dumpChars()

Returns a string containing a dump of the *screenBuffer* characters.
Mostly useful for debugging purpose.



<a name="ref.ScreenBuffer.dump"></a>
### .dump()

Returns a string containing a dump of the *screenBuffer*, including attributes.
Mostly useful for debugging purpose, but will likely gives you a headache.



<a name="ref.ScreenBuffer.attributes"></a>
### The Attributes Object

An attributes object contains attributes to style cells.
Available attributes are:

* color `integer` or `string` the foreground color index (ranging from 0 to 255) or the color name
* bgColor `integer` or `string` the background color index (ranging from 0 to 255) or the color name
* bold `boolean`
* dim `boolean`
* italic `boolean`
* underline `boolean`
* blink `boolean` (note: most terminal does not support it)
* inverse `boolean`
* hidden `boolean`
* strike `boolean`
* transparency `boolean` if true, all transparencies are activated
* fgTransparency `boolean` *foreground color transparency*, anything written with that attributes
  will use the existing destination foreground color instead of its own foreground color
* bgTransparency `boolean` *background color transparency*, anything written with that attributes
  will use the existing destination background color instead of its own background color
* styleTransparency `boolean` *style transparency*, anything written with that attributes
  will use the existing destination style instead of its own style, styles cover the bold, dim, italic, underline,
  blink, inverse, hidden and strike attributes
* charTransparency `boolean` *character transparency*, anything written with that attributes
  will use the existing destination characters instead of its own character

Transparency can achieve some special FX, like making a colorful rectangle moving behind some text.

