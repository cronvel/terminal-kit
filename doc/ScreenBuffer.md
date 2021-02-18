

<a name="top"></a>
<a name="ref.ScreenBuffer"></a>
## The ScreenBuffer

A *screenBuffer* is a buffer holding contents for a rectangular area.
Each cell of the rectangular area contains:

* a character
* a 8-bit foreground color
* a 8-bit background color
* a style (bit flags: bold, dim, italic, underline, blink, inverse, hidden, strike)
* a blending mask (bit flags: foreground transparency, background transparency, character transparency
  and style transparency)

They are two kinds of *screenBuffers*, depending on the write-destination:

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

* Constructor and static methods:
	* [ScreenBuffer()](#ref.ScreenBuffer.new)
	* [ScreenBuffer.create()](#ref.ScreenBuffer.create)
	* [ScreenBuffer.createFromString()](#ref.ScreenBuffer.createFromString)
	* [ScreenBuffer.loadImage()](#ref.ScreenBuffer.loadImage)
	* [ScreenBuffer.attr2object()](#ref.ScreenBuffer.attr2object)
	* [ScreenBuffer.object2attr()](#ref.ScreenBuffer.object2attr)
	* [ScreenBuffer.loadSync()](#ref.ScreenBuffer.loadSync)

* Properties:
	* [.dst](#ref.ScreenBuffer.dst)
	* [.x](#ref.ScreenBuffer.xy)
	* [.y](#ref.ScreenBuffer.xy)
	* [.blending](#ref.ScreenBuffer.blending)

* Methods:
	* [.fill()](#ref.ScreenBuffer.fill)
	* [.clear()](#ref.ScreenBuffer.clear)
	* [.put()](#ref.ScreenBuffer.put)
	* [.get()](#ref.ScreenBuffer.get)
	* [.resize()](#ref.ScreenBuffer.resize)
	* [.draw()](#ref.ScreenBuffer.draw)
	* [.drawCursor()](#ref.ScreenBuffer.drawCursor)
	* [.moveTo()](#ref.ScreenBuffer.moveTo)
	* [.vScroll()](#ref.ScreenBuffer.vScroll)
	* [.dumpChars()](#ref.ScreenBuffer.dumpChars)
	* [.dump()](#ref.ScreenBuffer.dump)
	* [.saveSync()](#ref.ScreenBuffer.saveSync)

* [The Attribute Object](#ref.ScreenBuffer.attributes)



<a name="ref.ScreenBuffer.new"></a>
### new ScreenBuffer( options )

* options `Object`, where:
	* width `integer` buffer width (default: dst.width)
	* height `integer` buffer height (default: dst.height)
	* dst: `Terminal` or `ScreenBuffer` instance, the destination to write on
	* x `integer` (optional) default x-position in the dst
	* y `integer` (optional) default y-position in the dst
	* blending `boolean` (optional, default: false) default value for [.draw()](#ref.ScreenBuffer.draw)'s blending option,
	  if true, blending is enabled (e.g. background transparency, char transparency, etc...)
	* wrap `boolean` (optional, default: false) default wrapping behavior of [.put()](#ref.ScreenBuffer.put)
	* noFill `boolean` (optional, default: false) if true, the *screenBuffer* will not be filled with empty chars,
	  i.e. it will not call [.fill()](#ref.ScreenBuffer.fill), useful for performance to avoid useless reset

This creates a ScreenBuffer instance with the appropriate options.



<a name="ref.ScreenBuffer.create"></a>
### ScreenBuffer.create( options )

DEPRECATED, use [new ScreenBuffer()](#ref.ScreenBuffer.new) instead.



<a name="ref.ScreenBuffer.createFromString"></a>
### ScreenBuffer.createFromString( options , str )

* options `Object`, where:
	* attr `Object` or `integer` attributes of the chars (attribute object or bit flags,
	  see: [the attribute object](#ref.ScreenBuffer.attributes))
	* transparencyChar `string` (optional) a single character that will have get the transparency attribute
	* transparencyType `integer` (optional, default: full transparency) bit flags for the transparency char
* str `string` the source string

This creates a ScreenBuffer instance from a string.
The height and width of the *screenBuffer* is computed using respectively the number of lines and the length of the largest line.
The string is written into the *screenBuffer* using the `attr` option.
See [the attr object and flags](#ref.ScreenBuffer.attributes) for details.

If the `transparencyChar` option is set, this character will produce a transparent cell, or if `transparencyType` is specified,
a partly transparent cell.
See [the transparency flags](#ref.ScreenBuffer.attributes) for details.



<a name="ref.ScreenBuffer.loadImage"></a>
### ScreenBuffer.loadImage( url , [options] , callback )

* url `string` the file path or URL of the image
* options `object` (optional), where:
	* term `Terminal` (optional, default to `termkit.terminal`) pass a *Terminal* instance, so the correct palette
	  will be known when converting the *True Color* image into a 8-bit ScreenBuffer
	* shrink `object` (optional, but **recommanded**) if set, the image may be shrinked to conform to the max width and height.
	  When shrinking, aspect ratio is always preserved. It has those properties:
		* width `integer` the max width of the image
		* height `integer` the max height of the image
* callback `Function( error , image )` the callback, where:
	* error: truthy if an error occured
	* image `ScreenBufferHD` the *screenBuffer* of the image

This creates a ScreenBufferHD from an image.
Support all format supported by [get-pixels](#https://www.npmjs.com/package/get-pixels), namely *PNG*, *JPEG* and *GIF*.
Only the first frame of *GIF* are used ATM.

It uses the *upper half block* UTF-8 character (▀) to double the height resolution and produces the correct aspect ratio:
the upper half having a foreground color and the lower half having the background color.

The *shrink* object option can be used to reduce the size of the image.
It is suggested to set it to `{ width: term.width, height: term.height * 2 }` to avoid creating a 2000 lines image.

The *alpha channel* is correctly supported, also it is important to draw that image to another *screenBufferHD* for this
to work as expected (remember: blending only works when drawing on another *screenBufferHD*).
Moreover, the target buffer must have **consistent foreground and background color**, since all the area will be
filled with `▀` characters.

Something like that will do the trick:

```js
var screen = new ScreenBuffer( { dst: term , noFill: true } ) ;

screen.fill( attr: {
	// Both foreground and background must have the same color
	color: 0 ,
	bgColor: 0
} } ) ;

ScreenBuffer.loadImage(
	path_to_image ,
	{ terminal: term , shrink: { width: term.width , height: term.height * 2 } } ,
	function( error , image ) {
		if ( error ) { throw error ; }	// Doh!
		
		image.draw( { dst: screen , blending: true } ) ;
		screen.draw() ;
    }
) ;
```

There is a full example of an image viewer located here: `./sample/image-viewer.js` in the repository.



<a name="ref.ScreenBuffer.attr2object"></a>
### ScreenBuffer.attr2object( attrFlags ) / .attr2object( attrFlags )

* attrFlags `integer` attributes in the bit flags form

It returns the object form of the attributes from its bit flags form.
It exists both as a static method and as an instance method.



<a name="ref.ScreenBuffer.object2attr"></a>
### ScreenBuffer.object2attr( attrObject ) / .object2attr( attrObject )

* attrObject `Object` attributes in the object form

It returns the bit flags form of the attributes from its object form.
It exists both as a static method and as an instance method.



<a name="ref.ScreenBuffer.loadSync"></a>
### ScreenBuffer.loadSync( filepath )

* filepath `string` the path of a *screenBuffer* file to load

This static method loads **synchronously** a *screenBuffer* file and returns a `ScreenBuffer` instance.



<a name="ref.ScreenBuffer.dst"></a>
### .dst

This property contains a `Terminal` or `ScreenBuffer` instance, that is the destination to write on.



<a name="ref.ScreenBuffer.xy"></a>
### .x , .y

Those properties are respectively the x and the y coordinate, in the *dst* (destination), where the *screenBuffer*
should be drawn.
This can be overriden when invoking [*.draw()*](#ref.ScreenBuffer.draw).



<a name="ref.ScreenBuffer.blending"></a>
### .blending

A `boolean`, the is default value for [*.draw()*](#ref.ScreenBuffer.draw)'s blending option.
If true, blending is enabled (e.g. background transparency, char transparency, etc).



<a name="ref.ScreenBuffer.fill"></a>
### .fill( [options] )

* options `Object` (optional), where:
	* attr `Object` or `integer` (optional) attributes of the chars (attribute object or bit flags,
	  see: [the attribute object](#ref.ScreenBuffer.attributes)) (default to the default attributes)
	* char `string` (optional) a single character used to fill the buffer (default: the space character)
	* region: `Object` or `Rect` (optional), a [`Rect` compliant object](Rect.md#ref.Rect.new) defining the region to fill
	  (default: fill the whole ScreenBuffer)

It fills the *screenBuffer* with the specified *char* and *attributes*.
If the *region* is specified, then only that *region* will be filled.



<a name="ref.ScreenBuffer.clear"></a>
### .clear()

It clears the *screenBuffer*, this is like calling [.fill()](#ref.ScreenBuffer.fill) with no argument.



<a name="ref.ScreenBuffer.put"></a>
### .put( options , format , [arg1] , [arg2] , ... )

* options `Object`, where:
	* x `integer` (optional) x-coordinate where to put the text, bypassing the cursor x-coordinate
	* y `integer` (optional) y-coordinate where to put the text, bypassing the cursor y-coordinate
	* markup `boolean` or 'ansi', true if the text contains markup that should be interpreted,
	  'ansi' if it contains *ANSI* code
	* attr `Object` or `integer` attributes of the chars (attribute object or bit flags,
	  see: [the attribute object](#ref.ScreenBuffer.attributes))
	* wrap `boolean` if true, text wrapping is enabled: when the cursor move beyond the last column, it is moved to the begining
	  of the next line
    * newLine: if true, then \r and \n produce new lines, false by default: .put() does not manage lines
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
* format `string` the string or the formated string to put into the *screenBuffer*
  (works just like any other `term( format , args... )`)
* arg1 (optional) the first argument of the format
* arg2...
* ...

It puts some text into the *screenBuffer*, using the provided *attributes*.

For the *markup* option, see also [the full style markup reference](markup.md#top).



<a name="ref.ScreenBuffer.get"></a>
### .get( [options] )

* options `Object` (optional), where:
	* x `integer` (optional) x-coordinate of the cell to get, bypassing the cursor x-coordinate
	* y `integer` (optional) y-coordinate of the cell to get, bypassing the cursor y-coordinate

It gets the character and attributes of the cell the *screenBuffer*'s cursor is at, or the cell for the supplied x and y coordinate.
It returns an object, where:
* char `string` a single character string, the character at that cell
* attr `Object` the attribute object for this cell, see: [the attribute object](#ref.ScreenBuffer.attributes)




<a name="ref.ScreenBuffer.resize"></a>
### .resize( fromRect )

* fromRect `Object` or `Rect` the rectangle used to resize the buffer, if it is an object, it should contains properties
  needed by the [`Rect`'s contructor](Rect.md#ref.Rect.new), namely either:
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
With the four properties, it is possible to define where the current *screenBuffer* content will land after the resize.



<a name="ref.ScreenBuffer.draw"></a>
### .draw( [options] )

* options `Object` (optional) if provided, each defined option will override the default behavior. Available options are:
	* dst `Terminal` or `ScreenBuffer` (optional) override `screenBuffer.dst`
	* x `integer` (optional) override `screenBuffer.x`
	* y `integer` (optional) override `screenBuffer.y`
	* srcClipRect `Rect` (optional, default: the whole source region is used) the source clipping rectangle
	* dstClipRect `Rect` (optional, default: the whole destination region is used) the destination clipping rectangle
	* blending `boolean` (optional, default: false) if true blending (transparencies) is allowed,
	  also **if dst is a terminal, partial transparency does not work**
	* delta `boolean` (optional, default: false) if true and if the destination is a **terminal**, only the cells that have changed since
	  the last draw will be updated: **it will keep performance of terminal application high**
	* wrap `boolean` or `string` (optional, default: false) if set, wrapping will be enabled, it can be set to:
		* 'x': only wrap along the x-axis
		* 'y': only wrap along the y-axis
		* true, 'both': wrap along the x and y axis
		* false: no wrapping
	* tile `boolean` (optional, default: false) if true, the source will fill the destination entirely using tiling:
	  the source is repeated multiple times along the x and y axis.

This draws the current *screenBuffer* into its *dst* (destination), which is either a `Terminal`
or another `ScreenBuffer` instance.

Blending works only when drawing to another *screenBuffer*.



<a name="ref.ScreenBuffer.drawCursor"></a>
### .drawCursor( [options] )

* options `Object` (optional) if provided, each defined option will override the default behavior. Available options are:
	* dst `Terminal` or `ScreenBuffer` (optional) override `screenBuffer.dst`

This draws the current *screenBuffer*'s cursor into its *dst* (destination), which is either a `Terminal`
or another `ScreenBuffer` instance.
*Drawing the cursor* means that the destination's cursor is moved to the coordinate of the source's cursor.

This method is useful if the *screenBuffer* is (for example) a widget that receive user input: the user must know
where he is typing.



<a name="ref.ScreenBuffer.moveTo"></a>
### .moveTo( x , y )

* x `integer` new cursor x-coordinate
* y `integer` new cursor y-coordinate

It moves the *screenBuffer*'s cursor.



<a name="ref.ScreenBuffer.vScroll"></a>
### .vScroll( lineOffset , [attr] , [ymin] , [ymax] , [scrollTerminal] ) *or* .vScroll( offset , [scrollTerminal] ) 

* lineOffset `integer` the vertical offset (the number of lines), positive values move the content toward crescent *y* coordinates,
  thus move the content down, negative values move the content up.
* attr `Object` or `integer` attributes of inserted empty lines (attribute object or bit flags,
  see: [the attribute object](#ref.ScreenBuffer.attributes))
* scrollTerminal `boolean` (optional, default: false) if true **AND** if the *screenBuffer*'s *dst* is a *Terminal* instance,
  it will scroll the underlying terminal, see details below.

This scrolls the *screenBuffer*'s content vertically.

If *scrollTerminal* option is set **AND** if the *screenBuffer*'s *dst* is a *Terminal* instance, then the following happens:
* the *dst terminal* is issued a *.scrollingRegion()* with the *screenBuffer* vertical bounds
* the *dst terminal* is issued a *.scrollDown()* or a *.scrollUp()* depending on the lineOffset sign
* the internal buffer storing last draw's data is updated, so the next call to *.draw()* with the *delta* option on
  will not redraw the region that has scrolled unless it has changed again
* the *dst terminal* is issued a .resetScrollingRegion()

This option has **one big limitation:** the *screenBuffer* should cover the whole terminal's width, because terminals
only supports full-width scrolling region.
You *may* avoid using this option for thinner *screenBuffers*, because things lying to the left or to the right would be scrolled too.

Also note that it doesn't *draw* the *screenBuffer* to the terminal, but it the internal delta is maintained properly.



<a name="ref.ScreenBuffer.dumpChars"></a>
### .dumpChars()

Returns a string containing a dump of the *screenBuffer*'s characters.
Mostly useful for debugging purpose.



<a name="ref.ScreenBuffer.dump"></a>
### .dump()

Returns a string containing a dump of the *screenBuffer*, including attributes.
Mostly useful for debugging purpose, but will likely gives you a headache.



<a name="ref.ScreenBuffer.saveSync"></a>
### .saveSync( filepath )

* filepath `string` the path of the file to write the *screenBuffer*

This saves **synchronously** the *screenBuffer* to a file.



<a name="ref.ScreenBuffer.attributes"></a>
### The Attributes Object

An attributes object contains attributes to style cells.
Available attributes are:

* color `integer` or `string` the foreground color index (ranging from 0 to 255) or the color name
* defaultColor `boolean` if true, set the foreground color to the default terminal foreground color
* bgColor `integer` or `string` the background color index (ranging from 0 to 255) or the color name
* bgDefaultColor `boolean` if true, set the background color to the default terminal background color
* bold `boolean`
* dim `boolean`
* italic `boolean`
* underline `boolean`
* blink `boolean` (note: most terminal does not support it)
* inverse `boolean`
* hidden `boolean`
* strike `boolean`
* transparency `boolean` if true, all transparencies are activated
* fgTransparency `boolean` *foreground color transparency*, anything drawn with that attribute
  will use the existing destination's foreground color instead of its own foreground color
* bgTransparency `boolean` *background color transparency*, anything drawn with that attribute
  will use the existing destination's background color instead of its own background color
* styleTransparency `boolean` *style transparency*, anything drawn with that attribute
  will use the existing destination's style instead of its own style.
  Styles cover the bold, dim, italic, underline, blink, inverse, hidden and strike attributes.
* charTransparency `boolean` *character transparency*, anything drawn with that attribute
  will use the existing destination's character instead of its own character

Transparency can achieve some special FX, like making a colorful rectangle moving behind some text.

