

<a name="top"></a>
<a name="ref.TextBuffer"></a>
## The TextBuffer

A *textBuffer* is a buffer holding text contents that can be used for things like *text areas*, or even *text editors*.

A *textBuffer* is way more flexible than a raw *screenBuffer* for that purpose.
Nonetheless, a *textBuffer* is always backed by a [*screenBuffer*](ScreenBuffer.md#top), i.e. its *dst* (destination)
should be a *screenBuffer*.

Internally, it has 3 buffers:
* a buffer holding raw text (line of text): *raw text buffer*
* a buffer holding attributes (colors, styles): the *attr buffer*
* a misc buffer holding userland data, useful for your application: the *misc buffer*

It comes with a lot of facilities to interact with the text, to manage the cursor, to colorize the text, to manage tabs...

**Note:** The *TextBuffer* is still in *beta*, some methods are missing but the existing API should be **stable**
or remain **backward compatible**.
If you wonder what can be done with *textBuffers*, have a look to [Neon](https://www.npmjs.com/package/ne),
a small text-editor in early alpha stage, featuring a javascript syntax hilighter.



## Table of Contents

* Constructor and static methods:
	* [TextBuffer()](#ref.TextBuffer.new)
	* [TextBuffer.create()](#ref.TextBuffer.create)

* Properties:
	* [.x](#ref.TextBuffer.xy)
	* [.y](#ref.TextBuffer.xy)

* Methods:
	* [.getText()](#ref.TextBuffer.getText)
	* [.setText()](#ref.TextBuffer.setText)
	* [.getHidden()](#ref.TextBuffer.getHidden)
	* [.setHidden()](#ref.TextBuffer.setHidden)
	* [.getContentSize()](#ref.TextBuffer.getContentSize)
	* [.getCursorOffset()](#ref.TextBuffer.getCursorOffset)
	* [.setCursorOffset()](#ref.TextBuffer.setCursorOffset)
	* [.setEmptyCellAttr()](#ref.TextBuffer.setEmptyCellAttr)
	* [.setAttrAt()](#ref.TextBuffer.setAttrAt)
	* [.setAttrCodeAt()](#ref.TextBuffer.setAttrCodeAt)
	* [.setAttrRegion()](#ref.TextBuffer.setAttrRegion)
	* [.setAttrCodeRegion()](#ref.TextBuffer.setAttrCodeRegion)
	* [.getMisc()](#ref.TextBuffer.getMisc)
	* [.getMiscAt()](#ref.TextBuffer.getMiscAt)
	* [.moveTo()](#ref.TextBuffer.moveTo)
	* [.moveToColumn()](#ref.TextBuffer.moveToColumn)
	* [.moveToLine(), .moveToRow()](#ref.TextBuffer.moveToLine)
	* [.move()](#ref.TextBuffer.move)
	* [.moveUp()](#ref.TextBuffer.moveUp)
	* [.moveDown()](#ref.TextBuffer.moveDown)
	* [.moveLeft()](#ref.TextBuffer.moveLeft)
	* [.moveRight()](#ref.TextBuffer.moveRight)
	* [.moveForward()](#ref.TextBuffer.moveForward)
	* [.moveBackward()](#ref.TextBuffer.moveBackward)
	* [.moveToStartOfWord()](#ref.TextBuffer.moveToStartOfWord)
	* [.moveToEndOfWord()](#ref.TextBuffer.moveToEndOfWord)
	* [.moveToStartOfLine()](#ref.TextBuffer.moveToStartOfLine)
	* [.moveToEndOfLine()](#ref.TextBuffer.moveToEndOfLine)
	* [.moveToStartOfBuffer()](#ref.TextBuffer.moveToStartOfBuffer)
	* [.moveToEndOfBuffer()](#ref.TextBuffer.moveToEndOfBuffer)
	* [.moveInBound()](#ref.TextBuffer.moveInBound)
	* [.insert()](#ref.TextBuffer.insert)
	* [.prepend()](#ref.TextBuffer.prepend)
	* [.append()](#ref.TextBuffer.append)
	* [.delete()](#ref.TextBuffer.delete)
	* [.backDelete()](#ref.TextBuffer.backDelete)
	* [.newLine()](#ref.TextBuffer.newLine)
	* [.joinLine()](#ref.TextBuffer.joinLine)
	* [.iterate()](#ref.TextBuffer.iterate)
	* [.wrapLine()](#ref.TextBuffer.wrapLine)
	* [.wrapAllLines()](#ref.TextBuffer.wrapAllLines)
	* [.draw()](#ref.TextBuffer.draw)
	* [.drawCursor()](#ref.TextBuffer.drawCursor)
	* [.load()](#ref.TextBuffer.load)
	* [.save()](#ref.TextBuffer.save)



<a name="ref.TextBuffer.new"></a>
### new TextBuffer( options )

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



<a name="ref.TextBuffer.create"></a>
### TextBuffer.create( options )

DEPRECATED, use [new TextBuffer()](#ref.TextBuffer.new) instead.



<a name="ref.TextBuffer.xy"></a>
### .x , .y

Those properties are respectively the x and the y coordinate, in the *dst* (destination), where the *textBuffer*
should be drawn.
This can be overriden when invoking *.draw()*.



<a name="ref.TextBuffer.getText"></a>
### .getText()

It extracts and returns the text content of the *textBuffer*.



<a name="ref.TextBuffer.setText"></a>
### .setText( text , [ [markup] , baseAttr ] )

* text `string` the text content
* markup `boolean` or 'ansi', true if the text contains markup that should be interpreted
  'ansi' if it contains *ANSI* code (default: false - raw text)
* baseAttr `object` or `integer`, an attribute used as the base attribute for the text content
  (if there is markup, the markup attributes are *stacked* with this base attribute)

This set the text content of the *textBuffer*.

It reset both the *attr buffer* (or set it to the correct attribute if there is markup) and the *misc buffer*.

For the *markup* option, see also [the full style markup reference](markup.md#top).



<a name="ref.TextBuffer.getHidden"></a>
### .getHidden()

It returns *true* if the *textBuffer* is in *hidden mode*.



<a name="ref.TextBuffer.setHidden"></a>
### .setHidden( state )

* state `boolean` if true, it enables the *hidden mode*, else it disables it

It set on or off the *hidden mode*.
The *hidden mode* is useful if your *textBuffer* is holding things like password.



<a name="ref.TextBuffer.getContentSize"></a>
### .getContentSize()

It returns an object with a *width* and *height* properties: the size of the text content.



<a name="ref.TextBuffer.getCursorOffset"></a>
### .getCursorOffset()

It returns the cursor offset in the raw text content.



<a name="ref.TextBuffer.setCursorOffset"></a>
### .setCursorOffset( offset )

* offset `integer` the new offset of the cursor

It set the cursor offset in the raw text content.



<a name="ref.TextBuffer.setEmptyCellAttr"></a>
### .setEmptyCellAttr( attr )

* attr `Object` or `integer` attributes of the chars (attribute object or bit flags,
  see: [the attribute object](ScreenBuffer.md#ref.ScreenBuffer.attributes))

This set the attributes for empty cells, i.e. cells in the *screenBuffer* where there is no *textBuffer* content (not even spaces).



<a name="ref.TextBuffer.setAttrAt"></a>
### .setAttrAt( attr , x , y )

* attr `Object` or `integer` attributes of the char (attribute object or bit flags,
  see: [the attribute object](ScreenBuffer.md#ref.ScreenBuffer.attributes))
* x `integer` the x-coordinate (i.e. the column number)
* y `integer` the y-coordinate (i.e. the row number)

This set the attributes for the *textBuffer* cell at *(x,y)* coordinates.



<a name="ref.TextBuffer.setAttrCodeAt"></a>
### .setAttrCodeAt( attr , x , y )

* attr `integer` attributes of the char in the bit flags form
* x `integer` the x-coordinate (i.e. the column number)
* y `integer` the y-coordinate (i.e. the row number)

Like [.setAttrAt()](#ref.TextBuffer.setAttrAt), but it only accepts attributes in the bit flags form (faster).



<a name="ref.TextBuffer.setAttrRegion"></a>
### .setAttrRegion( attr , [region] )

* attr `Object` or `integer` attributes of the char (attribute object or bit flags,
  see: [the attribute object](ScreenBuffer.md#ref.ScreenBuffer.attributes))
* region `Object` (optional, default to the whole *textBuffer*) the targeted rectangular region, where:
	* xmin `integer` the minimal x-coordinate
	* xmax `integer` the maximal x-coordinate
	* ymin `integer` the minimal y-coordinate
	* ymax `integer` the maximal y-coordinate

This set the attributes for the *textBuffer* cells in the rectangular *region* (if specified), or all cells of the *textBuffer*.



<a name="ref.TextBuffer.setAttrCodeRegion"></a>
### .setAttrCodeRegion( attr , [region] )

* attr `integer` attributes of the char in the bit flags form
* region `Object` (optional, default to the whole *textBuffer*) the targeted rectangular region, where:
	* xmin `integer` the minimal x-coordinate
	* xmax `integer` the maximal x-coordinate
	* ymin `integer` the minimal y-coordinate
	* ymax `integer` the maximal y-coordinate

Like [.setAttrRegion()](#ref.TextBuffer.setAttrRegion), but it only accepts attributes in the bit flags form (faster).



<a name="ref.TextBuffer.getMisc"></a>
### .getMisc()

Get the *misc* meta data at the current cursor position.



<a name="ref.TextBuffer.getMiscAt"></a>
### .getMiscAt( x , y )

* x `integer` the x-coordinate (i.e. the column number)
* y `integer` the y-coordinate (i.e. the row number)

Get the *misc* meta data at the *(x,y)* coordinates.



<a name="ref.TextBuffer.moveTo"></a>
### .moveTo( x , y )

* x `integer` the x-coordinate (i.e. the column number)
* y `integer` the y-coordinate (i.e. the row number)

It moves the *textBuffer*'s cursor to the *(x,y)* coordinates.



<a name="ref.TextBuffer.moveToColumn"></a>
### .moveToColumn( x )

* x `integer` the x-coordinate (i.e. the column number)

It moves the *textBuffer*'s cursor to the *xth* column.



<a name="ref.TextBuffer.moveToLine"></a>
### .moveToLine( y ) , .moveToRow( y )

* y `integer` the y-coordinate (i.e. the row number)

It moves the *textBuffer*'s cursor to the *yth* row/line.



<a name="ref.TextBuffer.move"></a>
### .move( x , y )

* x `integer` the **relative** x-coordinate (i.e. the column number)
* y `integer` the **relative** y-coordinate (i.e. the row number)

Like [.moveTo()](#ref.TextBuffer.moveTo), but it moves the *textBuffer*'s cursor relative to its current position.



<a name="ref.TextBuffer.moveUp"></a>
### .moveUp()

It moves the *textBuffer*'s cursor one cell up.



<a name="ref.TextBuffer.moveDown"></a>
### .moveDown()

It moves the *textBuffer*'s cursor one cell down.



<a name="ref.TextBuffer.moveLeft"></a>
### .moveLeft()

It moves the *textBuffer*'s cursor one cell left.



<a name="ref.TextBuffer.moveRight"></a>
### .moveRight()

It moves the *textBuffer*'s cursor one cell right.



<a name="ref.TextBuffer.moveForward"></a>
### .moveForward( justSkipNullCells )

* justSkipNullCells `boolean`

It moves the *textBuffer*'s cursor one *character* forward, different form [.moveRight()](#ref.TextBuffer.moveRight),
since it would move the cursor at the begining of the next line if it was on the last character of a line.

It always skips *null cells*.
*Null cells* are produced by tabulation: there is only one *text character* but followed by *n null cells*
that are not part of the actual text content.

If *justSkipNullCells* is set, it does not move forward unless the cursor is over a *null cell*.



<a name="ref.TextBuffer.moveBackward"></a>
### .moveBackward( justSkipNullCells )

* justSkipNullCells `boolean`

It moves the *textBuffer*'s cursor one *character* backward, different form [.moveLeft()](#ref.TextBuffer.moveLeft),
since it would move the cursor at the end of the previous line if it was on the first character of a line.

It always skips *null cells*.
*Null cells* are produced by tabulation: there is only one *text character* but followed by *n null cells*
that are not part of the actual text content.

If *justSkipNullCells* is set, it does not move backward unless the cursor is over a *null cell*.



<a name="ref.TextBuffer.moveToStartOfWord"></a>
### .moveToStartOfWord()

It moves the *textBuffer*'s cursor to the start of the current word.



<a name="ref.TextBuffer.moveToEndOfWord"></a>
### .moveToEndOfWord()

It moves the *textBuffer*'s cursor to the end of the current word.



<a name="ref.TextBuffer.moveToStartOfLine"></a>
### .moveToStartOfLine()

It moves the *textBuffer*'s cursor to the begining of the current line.



<a name="ref.TextBuffer.moveToEndOfLine"></a>
### .moveToEndOfLine()

It moves the *textBuffer*'s cursor to the end of the current line.



<a name="ref.TextBuffer.moveToStartOfBuffer"></a>
### .moveToStartOfBuffer()

It moves the *textBuffer*'s cursor to the begining of the buffer (i.e. the begining of the first line).



<a name="ref.TextBuffer.moveToEndOfBuffer"></a>
### .moveToEndOfBuffer()

It moves the *textBuffer*'s cursor to the end of the buffer (i.e. the end of the last line).



<a name="ref.TextBuffer.moveInBound"></a>
### .moveInBound( ignoreCx )

* ignoreCx `boolean` do not affect the cursor's x-coordinate

It moves the *textBuffer*'s cursor in bound, i.e. to a cell that has text content.



<a name="ref.TextBuffer.insert"></a>
### .insert( text , [ [markup] , attr ] )

* text `string` the raw text to insert
* markup `boolean` or 'ansi', true if the text contains markup that should be interpreted
  'ansi' if it contains *ANSI* code (default: false - raw text)
* attr `Object` or `integer` (optional, default: the empty cell attributes) attributes of the text about to be inserted
 (attribute object or bit flags, see: [the attribute object](ScreenBuffer.md#ref.ScreenBuffer.attributes))

It inserts the text at the current cursor position, with the given attributes.



<a name="ref.TextBuffer.prepend"></a>
### .prepend( text , [ [markup] , attr ] )

* text `string` the raw text to insert
* markup `boolean` or 'ansi', true if the text contains markup that should be interpreted
  'ansi' if it contains *ANSI* code (default: false - raw text)
* attr `Object` or `integer` (optional, default: the empty cell attributes) attributes of the text about to be inserted
 (attribute object or bit flags, see: [the attribute object](ScreenBuffer.md#ref.ScreenBuffer.attributes))

It prepend the text (i.e. insert it at the begining), with the given attributes.



<a name="ref.TextBuffer.append"></a>
### .append( text , [ [markup] , attr ] )

* text `string` the raw text to insert
* markup `boolean` or 'ansi', true if the text contains markup that should be interpreted
  'ansi' if it contains *ANSI* code (default: false - raw text)
* attr `Object` or `integer` (optional, default: the empty cell attributes) attributes of the text about to be inserted
 (attribute object or bit flags, see: [the attribute object](ScreenBuffer.md#ref.ScreenBuffer.attributes))

It append the text (i.e. insert it at the end), with the given attributes.



<a name="ref.TextBuffer.delete"></a>
### .delete( [n] )

* n `integer` (optional, default: 1) the number of chars to delete

It deletes *n* characters at the current cursor position.
This is the action usually bound to the *delete* key.



<a name="ref.TextBuffer.backDelete"></a>
### .backDelete( [n] )

* n `integer` (optional, default: 1) the number of chars to delete

It deletes *n* characters **backward** starting from the current cursor position.
This is the action usually bound to the *backspace* key.



<a name="ref.TextBuffer.newLine"></a>
### .newLine()

It inserts a new line at the current cursor position.
It will split the current line in two, if there are characters at/after the current cursor position.



<a name="ref.TextBuffer.joinLine"></a>
### .joinLine()

It moves the cursor to the end of the line and joins the current line with the following line.



<a name="ref.TextBuffer.iterate"></a>
### .iterate( options , callback )

* options `Object` where:
	* finalCall `boolean` call the callback one more time at the end of the buffer with an empty string
* callback `Function( cellData )`, where:
	* cellData `Object` where:
		* offset `integer` the offset/position of the current cell in the raw/serialized text
		* x `integer` the x-coordinate (i.e. the column number) of the current cell
		* y `integer` the y-coordinate (i.e. the row number) of the current cell
		* text `string` a single character string, the character of the current cell
		* attr `integer` the attributes of the current cell in the bit flags mode, use 
		  [ScreenBuffer.attr2object()](ScreenBuffer.md#ref.ScreenBuffer.attr2object) to convert it if necessary
		* misc `Object` userland meta-data for the current cell

It iterates over the whole *textBuffer*, using the *callback* for each cell.



<a name="ref.TextBuffer.wrapLine"></a>
### .wrapLine( [y] , [width] , [wordWrap] )

* y `integer` the line to wrap (default: current line, the line where the cursor is)
* width `integer` the wanted width (default: the current textBuffer's *lineWrapWidth*)
* wordWrap `boolean` if true, force word-aware line-splitting (default: the current textBuffer's *wordWrap*)

It wraps the current line (or the line *y*), splitting it as many times it is necessary to fit the wanted width.

The *wordWrap* option can be used to avoid splitting in a middle of a word or before punctuation.



<a name="ref.TextBuffer.wrapAllLines"></a>
### .wrapAllLines( [width] , [wordWrap] )

* width `integer` the wanted width (default: the current textBuffer's *lineWrapWidth*)
* wordWrap `boolean` if true, force word-aware line-splitting (default: the current textBuffer's *wordWrap*)

Same than [`.wrapLine()`](#ref.TextBuffer.wrapLine), but for all lines.



<a name="ref.TextBuffer.draw"></a>
### .draw( [options] )

* options `Object` (optional) if provided, each defined option will override the default behavior. Available options are:
	* dst `ScreenBuffer` (optional) override `textBuffer.dst`
	* x `integer` (optional) override `textBuffer.x`
	* y `integer` (optional) override `textBuffer.y`
	* srcClipRect `Rect` (optional, default: the whole source region is used) the source clipping rectangle
	* dstClipRect `Rect` (optional, default: the whole destination region is used) the destination clipping rectangle
	* blending `boolean` (optional, default: false) if true blending (transparencies) is allowed
	* wrap `boolean` or `string` (optional, default: false) if set, wrapping will be enabled, it can be set to:
		* 'x': only wrap along the x-axis
		* 'y': only wrap along the y-axis
		* true, 'both': wrap along the x and y axis
		* false: no wrapping
	* tile `boolean` (optional, default: false) if true, the source will fill the destination entirely using tiling:
	  the source is repeated multiple times along the x and y axis.

This draws the current *textBuffer* into its *dst* (destination), which is a `ScreenBuffer` instance.

To actually display a *textBuffer*, you need to:
* draw the *textBuffer* to a *screenBuffer*
* then draw that *screenBuffer* to the terminal (or draw the whole *screenBuffer* chain until the terminal)



<a name="ref.TextBuffer.drawCursor"></a>
### .drawCursor( [options] )

* options `Object` (optional) if provided, each defined option will override the default behavior. Available options are:
	* dst `ScreenBuffer` (optional) override `textBuffer.dst`

This draws the current *textBuffer*'s cursor into its *dst* (destination), which is a `ScreenBuffer` instance.
*Drawing the cursor* means that the destination's cursor is moved to the coordinate of the source's cursor.
It updates the cursor position so the user know where he is typing.



<a name="ref.TextBuffer.load"></a>
### .load( filepath , callback )

* filepath `string` the path of the file to load
* callback `Function( error )` completion callback

This erases all contents (text, attr and misc) and loads the content of the file (which is a text file).



<a name="ref.TextBuffer.save"></a>
### .save( filepath , callback )

* filepath `string` the path of the file to save into
* callback `Function( error )` completion callback

This saves the raw text content into a file.

