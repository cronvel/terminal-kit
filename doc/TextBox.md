
<a name="top"></a>
<a name="ref.TextBox"></a>
## TextBox

A *textBox* is box area containing a text.
The text can have **attributes** (**colors, styles**), it can be wrapped (**line-wrapping, word-wrapping**), the whole textBox can be **scrollable** 
(both horizontal and vertical).
The text content source may have **markup** or **ansi** code (if so, the *contentHasMarkup* option should be set accordingly, see below).

When scrollable, it is sensible to mouse-wheel (anywhere) and click on the scrollbar.
It supports text-selection, and copy to clipboard (Linux only at the moment, it needs xclipboard).

It is backed by a [TextBuffer](TextBuffer.md#top).



<a name="ref.TextBox.toc"></a>
## Table of Contents

* [Events](#ref.TextBox.event)
	* [key](#ref.TextBox.event.key)

* [Key Bindings](#ref.TextBox.keyBindings)

* Constructor:
	* [new TextBox()](#ref.TextBox.new)

* Methods:
	* [.setSizeAndPosition()](#ref.TextBox.setSizeAndPosition)
	* [.scrollTo()](#ref.TextBox.scrollTo)
	* [.scroll()](#ref.TextBox.scroll)
	* [.scrollToTop()](#ref.TextBox.scrollToTop)
	* [.scrollToBottom()](#ref.TextBox.scrollToBottom)
	* [.getContent()](#ref.TextBox.getContent)
	* [.getContentSize()](#ref.TextBox.getContentSize)
	* [.prependContent()](#ref.TextBox.prependContent)
	* [.appendContent()](#ref.TextBox.appendContent)
	* [.appendLog()](#ref.TextBox.appendLog)
	* [.getAltContent()](#ref.TextBox.getAltContent)
	* [.setAltContent()](#ref.TextBox.setAltContent)

* Properties:
	* [.textBuffer()](#ref.TextBox.textBuffer)

* Inherit methods and properties from [Element](Element.md#ref.Element.toc)



<a name="ref.TextBox.event"></a>
### Events

<a name="ref.TextBox.event.key"></a>
#### *key*

See [Element's key event](Element.md#ref.Element.event.key).



<a name="ref.TextBox.keyBindings"></a>
### Key Bindings

* *tinyScrollUp*: scroll up a bit, default: UP
* *tinyScrollDown*: scroll down a bit, default: DOWN
* *scrollUp*: scroll up, default: PAGE_UP
* *scrollDown*: scroll down, default: PAGE_DOWN, *space*
* *scrollTop*: scroll to the top, default: HOME
* *scrollBottom*: scroll to the bottom, default: END
* *scrollLeft*: scroll left, default: LEFT
* *scrollRight*: scroll right, default: RIGHT
* *copyClipboard*: copy to clipboard, default: CTRL_Y



<a name="ref.TextBox.new"></a>
### new TextBox( options )

* options `Object`, where:
	* *all [the base class Element constructor's](Element.md#ref.Element.new) options*
	* contentHasMarkup `boolean` or `string` when set to *true* or the string *'markup'*, the content contains Terminal Kit's markup,
	  used to set attributes of parts of the content, when set to the string *'ansi'*, the content contains ANSI escape sequence,
	  default: false.
	* attr `object` general attribute for the textBox
	* textAttr `object` attribute for the text content, default to `{ bgColor: 'default' }`
	* altTextAttr `object` alternate attribute for the text, default to `textAttr` + `{ color: 'gray' , italic: true } `
	* voidAttr `object` attribute for the area of the textBox without any text content, default to `{ bgColor: 'default' }`
	* emptyAttr `object` alias of `voidAttr`
	* scrollable `boolean` if set, the textBox is scrollable (default: false)
	* hasHScrollBar `boolean` if set and if *scrollable*, the textBox has a horizontal scrollbar
	* hasVScrollBar `boolean` if set and if *scrollable*, the textBox has a vertical scrollbar
	* scrollX `number` the initial horizontal scroll value, default: 0
	* scrollY `number` the initial vertical scroll value, default: 0
	* extraScrolling `boolean` if unset (the default), it is possible to scroll down until both the content bottom and textBox bottom are on the same line,
	  if set, it is possible to scroll down until the bottom of the content reaches the top of the textBox
	* tabWidth `number` (default: 4) number of cells (=spaces) for the tab character
	* lineWrap `boolean` when set, the text content is wrapped to the next line instead of being clipped by the textBox border
	* wordWrap `boolean` like `lineWrap` but is word-aware, i.e. it doesn't split words
	* firstLineRightShift `number` if set (default: 0) , the first-line of content is right-shifted from this amount of cells, may be useful for prompt,
	  or continuing another box in the flow
	* hiddenContent `string` or `null`, if set, the content is hidden, using this string as a replacement for all chars (useful for password)
	* stateMachine `object` (TODOC)

This creates a *TextBox element*.



<a name="ref.TextBox.setSizeAndPosition"></a>
### .setSizeAndPosition( options )

* options `Object`, where:
	* x, y, width, height: see [the super-class *Element* constructor's](#ref.Element.new) options*

This set the size and position of the textBox, updating line-wrapping and scrollbar.



<a name="ref.TextBox.scrollTo"></a>
### .scrollTo( x , y )

* x, y `number` the new scrolling coordinates

This scrolls the textBox to the *x,y* coordinates and updates scrollbars.



<a name="ref.TextBox.scroll"></a>
### .scroll( dx , dy )

* dx, dy `number` the delta of the scroll

This scrolls the textBox from this *x,y* delta and updates scrollbars.



<a name="ref.TextBox.scrollToTop"></a>
### .scrollToTop()

This scrolls the textBox to the top and updates scrollbars.



<a name="ref.TextBox.scrollToBottom"></a>
### .scrollToBottom()

This scrolls the textBox to the bottom and updates scrollbars.



<a name="ref.TextBox.getContent"></a>
### .getContent()

It returns the current text-content.



<a name="ref.TextBox.getContentSize"></a>
### .getContentSize()

It returns the current text-content size, an object with a *width* and *height* property.



<a name="ref.TextBox.prependContent"></a>
### .prependContent( content , [dontDraw] )

* content `string` the text-content to prepend
* dontDraw `boolean` if set, don't outerDraw the widget (default: false, outerDraw)

Prepend text-content at the begining of the current content. It supports markup or ansi if the textBox was instanciated with the `contentHasMarkup` options on.



<a name="ref.TextBox.appendContent"></a>
### .appendContent( content , [dontDraw] )

* content `string` the text-content to append
* dontDraw `boolean` if set, don't outerDraw the widget (default: false, outerDraw)

Append text-content at the end of the current content. It supports markup or ansi if the textBox was instanciated with the `contentHasMarkup` options on.



<a name="ref.TextBox.appendLog"></a>
### .appendLog( content , [dontDraw] )

* content `string` the text-content to append
* dontDraw `boolean` if set, don't outerDraw the widget (default: false, outerDraw)

This method is almost like [.appendContent()](ref.TextBox.appendContent), but more suitable for logging.
It appends **a new line** of text-content at the end of the current content.
Then it performs an *intelligent scroll* of the textBox: *if the scrolling was already at the bottom*,
it will scroll down so that new content will be in the viewport.
It supports markup or ansi if the textBox was instanciated with the `contentHasMarkup` options on.



<a name="ref.TextBox.getAltContent"></a>
### .getAltContent()

It returns the alternate text-content.



<a name="ref.TextBox.setAltContent"></a>
### .setAltContent( content , [hasMarkup] , [dontDraw] )

* content `string` the alternate text-content
* hasMarkup `boolean` or `string` when set to *true* or the string *'markup'*, the content contains Terminal Kit's markup,
  used to set attributes of parts of the content, when set to the string *'ansi'*, the content contains ANSI escape sequence,
  default: false.
* dontDraw `boolean` if set, don't outerDraw the widget (default: false, outerDraw)

It set the alternate text-content, work like its [.setContent()](#ref.Element.setContent) counterpart.



<a name="ref.TextBox.textBuffer"></a>
### .textBuffer

This property holds the underlying [TextBuffer](TextBuffer.md#top) object.
It can be used to achieve more complex stuffs.

