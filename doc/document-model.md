

<a name="top"></a>
<a name="ref.document-model"></a>
## The Document Model

The *document model* is **99% stable**, but the current documentation is still in progress.

The *document model* uses the whole or a part of the terminal area as a *document*, in a similar way than a webpage,
where multiple widgets are present on a specific place in the screen, all active at the same time.

It is opposed to the *inline mode* (i.e. all other Terminal Kit's features), where widgets are instanciated 
one at a time, line after line.

Some widgets exist in both the *inline mode* and the *document model*, but with different features.
Those differences will eventually disappear, once those *document model* widgets will be compatible with the *inline mode*
and supersede the older one.

The *document model* is backed by [*screenBuffers*](screenbuffer.md#top).

It can manage multiple widgets each with its own redraw condition, even some that overlap, like a [*drop-down menu*](#ref.DropDownMenu),
it manages widget keyboard focus, event dispatching, widget cycling, **with mouse support everywhere**.



<a name="toc"></a>
## Table of Contents

* Instantiable classes:
	* [Document](#ref.Document)
		* [Events()](#ref.Document.event)
		* [Key Bindings()](#ref.Document.keyBindings)
		* [new Document()](#ref.Document.new)
		* [.giveFocusTo()](#ref.Document.giveFocusTo)
		* [.focusNext()](#ref.Document.focusNext)
		* [.focusPrevious()](#ref.Document.focusPrevious)
		* [.createShortcuts()](#ref.Document.createShortcuts)
		* [.removeElementShortcuts()](#ref.Document.removeElementShortcuts)
    * [Button](#ref.Button)
    * [ColumnMenu](#ref.ColumnMenu)
    * [ColumnMenuMulti](#ref.ColumnMenuMulti)
    * [DropDownMenu](#ref.DropDownMenu)
    * [EditableTextBox](#ref.EditableTextBox)
    * [Form](#ref.Form)
    * [InlineInput](#ref.InlineInput)
    * [LabeledInput](#ref.LabeledInput)
    * [Layout](#ref.Layout)
    * [RowMenu](#ref.RowMenu)
    * [SelectList](#ref.SelectList)
    * [SelectListMulti](#ref.SelectListMulti)
    * [Slider](#ref.Slider)
    * [Text](#ref.Text)
    * [TextBox](#ref.TextBox)
    * [TextTable](#ref.TextTable)
    * [ToggleButton](#ref.ToggleButton)

* Base classes:
    * [Element](#ref.Element)
    * [Container](#ref.Container)
    * [BaseMenu](#ref.BaseMenu)



<a name="ref.Document"></a>
## Document

The *Document element* is the main [*Element*](#ref.Element) of the *document model*: it represents the whole document just like the
*document* object of the browser DOM. Most use cases just need one *document*, mapping the whole terminal area.

It is the necessary top-level *Element*, on top of all other widgets, since it manages drawing/redrawing of them, as well as event dispatching, and so on.
All other *elements* are children of a *document* or children of children of (children of... etc) a *document*: they just don't work without it.

Being a [*Container*](#ref.Container), it is backed by a [*screenBuffer*](screenbuffer.md#top).

So widgets are first drawn to the *document's screenBuffer*, and then the *document's screenBuffer* is *delta-optimized* drawn
to the underlying terminal.

TODOC



<a name="ref.Document.event"></a>
### Events

<a name="ref.Document.event.key"></a>
#### *key*

See [Element's key event](ref.Element.event.key).



<a name="ref.Document.keyBindings"></a>
### Key Bindings

* *focusNext*: give the focus the next element, default: "TAB"
* *focusPrevious*: give the focus the previous element, default: "SHIFT_TAB"



<a name="ref.Document.new"></a>
### new Document( options )

* options `Object`, where:
	* outputDst `Terminal` or `ScreenBuffer` this is the object where the document should be drawn into, 
	  **it is set automatically when using `term.createDocument()` instead of `new termkit.Document()`.**
	* eventSource `EventEmitter` or any EventEmitter-compatible objects (e.g. [nextgen-events](https://github.com/cronvel/nextgen-events))
	  **it is set automatically when using `term.createDocument()` instead of `new termkit.Document()`.**
	* outputX, outputY, outputWidth, outputHeight `integer` (optional) the position and size of the document
	  with respect to the screen (i.e. the *outputDst*)
	* keyBindings `Object` having a [*Terminal Kit key name*](events.md#ref.event.key) as the key and an action as value ([see above](#ref.Document.keyBindings))
	* noDraw `boolean` if true, don't draw the document on instantiation (default: false, draw immediately)
	* *... and all [Container](#ref.Container) options*

Instead of using `new termkit.Document()`, it's recommended to use `term.createDocument()`: it set automatically some options
like *outputDst* and *eventSource* to `term`.

This creates a *document* mapping an area of the terminal (or even an area of another *screenBuffer*).



<a name="ref.Document.giveFocusTo"></a>
### .giveFocusTo( element )

* element `Element` the element to give focus to

Give the focus to an *Element*.



<a name="ref.Document.focusNext"></a>
### .focusNext()

Give the focus to the next focusable *Element*.
This is usually done internally when the user press the *TAB* key or any keys binded to the *focusNext* action.



<a name="ref.Document.focusPrevious"></a>
### .focusPrevious()

Give the focus to the previous focusable *Element*.
This is usually done internally when the user press the *SHIFT_TAB* key or any keys binded to the *focusPrevious* action.



<a name="ref.Document.createShortcuts"></a>
### .createShortcuts()

TODOC / unstable



<a name="ref.Document.removeElementShortcuts"></a>
### .removeElementShortcuts()

TODOC / unstable



<a name="ref.Button"></a>
## Button

TODOC



<a name="ref.ColumnMenu"></a>
## ColumnMenu

TODOC



<a name="ref.ColumnMenuMulti"></a>
## ColumnMenuMulti

TODOC



<a name="ref.DropDownMenu"></a>
## DropDownMenu

TODOC



<a name="ref.EditableTextBox"></a>
## EditableTextBox

TODOC



<a name="ref.Form"></a>
## Form

TODOC



<a name="ref.InlineInput"></a>
## InlineInput

TODOC



<a name="ref.LabeledInput"></a>
## LabeledInput

TODOC



<a name="ref.Layout"></a>
## Layout

TODOC



<a name="ref.RowMenu"></a>
## RowMenu

TODOC



<a name="ref.SelectList"></a>
## SelectList

TODOC



<a name="ref.SelectListMulti"></a>
## SelectListMulti

TODOC



<a name="ref.Slider"></a>
## Slider

TODOC



<a name="ref.Text"></a>
## Text

TODOC



<a name="ref.TextBox"></a>
## TextBox

A textBox is box area containing a text.
The text can have **attributes** (**colors, styles**), it can be wrapped (**line-wrapping, word-wrapping**), the whole textBox can be **scrollable** 
(both horizontal and vertical).
The text content source can have **markup**.

When scrollable, it is sensible to mouse-wheel (anywhere) and click on the scrollbar.
It supports text-selection, and copy to clipboard (Linux only at the moment, it needs xclipboard).

It is built on top of a [TextBuffer](textbuffer.md#top).



<a name="ref.TextBox.event"></a>
### Events

<a name="ref.TextBox.event.key"></a>
#### *key*

See [Element's key event](ref.Element.event.key).



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
* *copyClipboard*: copy to clipboard, default: CTRL_O



<a name="ref.TextBox.new"></a>
### new TextBox( options )

* options `Object`, where:
	* attr `object` general attribute for the textBox
	* textAttr `object` attribute for the text content, default to `{ bgColor: 'default' }`
	* altTextAttr `object` alternate attribute for the text, default to `textAttr` + `{ color: 'gray' , italic: true } `
	* voidAttr `object` attribute for the area of the textBox without any text content, default to `{ bgColor: 'default' }`
	* emptyAttr `object` alias of `voidAttr`
	* scrollable `boolean` if set, the textBox is scrollable
	* hasHScrollBar `boolean` if set and if *scrollable*, the textBox has a horizontal scrollbar
	* hasVScrollBar `boolean` if set and if *scrollable*, the textBox has a vertical scrollbar
	* scrollX `number` the initial horizontal scroll value, default: 0
	* scrollY `number` the initial vertical scroll value, default: 0
	* extraScrolling `boolean` if unset (the default), it is possible to scroll down until both the content bottom and textBox bottom are on the same line,
	  if set, it is possible to scroll down until the bottom of the content reaches the top of the textBox
	* lineWrap `boolean` when set, the text content is wrapped to the next line instead of being clipped by the textBox border
	* wordWrap `boolean` like `lineWrap` but is word-aware, i.e. it doesn't split words
	* firstLineRightShift `number` if set (default: 0) , the first-line of content is right-shifted from this amount of cells, may be useful for prompt,
	  or continuing another box in the flow
	* hiddenContent `string` or `null`, if set, the content is hidden, using this string as a replacement for all chars (useful for password)
	* stateMachine `object` (TODOC)
	* *... and all [the super-class *Element* constructor's](#ref.Element.new) options*

This creates a *TextBox element*.



<a name="ref.TextBox.setSizeAndPosition"></a>
### .setSizeAndPosition( options )

* options `Object`, where:
	* x, y, width, height: see [the super-class *Element* constructor's](#ref.Element.new) options*

This set the size and position of the textBox, updating line-wrapping and scrollbar.



<a name="ref.TextBox.scrollTo"></a>
### .scrollTo( x , y )

* x, y `number` the new scrolling coordinates

This scroll the textBox to the *x,y* coordinates and update scrollbars.




<a name="ref.TextBox.scroll"></a>
### .scrollTo( dx , dy )

* dx, dy `number` the delta of the scroll

This scroll the textBox from this *x,y* delta and update scrollbars.



<a name="ref.TextBox.getContent"></a>
### .getContent()

It returns the current text-content.



<a name="ref.TextBox.getContentSize"></a>
### .getContentSize()

It returns the current text-content size, an object with a *width* and *height* property.



<a name="ref.TextBox.appendContent"></a>
### .appendContent( content , [dontDraw] )

Append text-content at the end of the current content. It supports markup if the textBox was instanciated with the `contentHasMarkup` options on.



<a name="ref.TextBox.prependContent"></a>
### .prependContent( content , [dontDraw] )

Prepend text-content at the begining of the current content. It supports markup if the textBox was instanciated with the `contentHasMarkup` options on.



<a name="ref.TextBox.getAltContent"></a>
### .getAltContent()

It returns the alternate text-content.



<a name="ref.TextBox.setAltContent"></a>
### .setAltContent( content , [hasMarkup] , [dontDraw] )

It set the alternate text-content, work like its [.setContent()](#ref.Element.setContent) counterpart.



<a name="ref.TextTable"></a>
## TextTable

TODOC



<a name="ref.ToggleButton"></a>
## ToggleButton

TODOC



<a name="ref.Element"></a>
## Element

TODOC



<a name="ref.Element.event"></a>
### Events

<a name="ref.Element.event.key"></a>
#### *key*

This event is emitted on any *Element* when a key is pressed **AND** that *Element* has the focus or the event has bubbled
to this *Element* **AND** there is no action binded to this key.

This event is strictly the same than [the regular Terminal Kit key event](events.md#ref.event.key).



<a name="ref.Element.event.shortcut"></a>
#### *shortcut*

TODOC / unstable.



<a name="ref.Element.new"></a>
### new Element( options )

* options `Object`, where:
	* parent `Element` this is the parent of the current *element*, the current *element* will be *attached* to it
	* x, y `number` this is the coordinate of the *element* **relative to its closest ancestor-container**
	* zIndex `number` the *element* z-index, greater z-index *elements* are rendered after (i.e. *over*) lesser z-index *elements*
	* z `number` alias of `zIndex`
	* width, height `number` the general width and height of the *element*
	* outputWidth, outputHeight `number` the width and height of the rendered *element* (inside its parent), for most widget it is the same than `width` and `height`
	  and will default to them
	* label `string` a label for this element, only relevant for some widgets
	* key `string` a key for this element, only relevant for some widgets
	* value `any` a value associated with this element, only relevant for some widgets
	* content `string` the content of the element that will be displayed, if it makes sense for the widget
	* contentHasMarkup `boolean` when set, the content contains Terminal Kit's markup, used to set attributes of parts of the content,
	  only relevant for some widgets, default: false.
	* contentWidth `number` the width (in terminal's cells) of the content, only relevant for some widgets
	* hidden `boolean` when set, the element is not visible and no interaction is possible with this element. It also affects children. Default: false.
	* disabled: mostly for user-input, the element is often grayed and unselectable, the effect depending on the widget
	* keyBindings `Object` having a [*Terminal Kit key name*](events.md#ref.event.key) as the key and an action as value ([see above](#ref.Document.keyBindings))
	* meta `any` a userland-only property, it associates the element with some data that make sense in the application business-logic
	* noDraw `boolean` if true, don't draw the document on instantiation (default: false, draw immediately)
	* shortcuts **unstable** (TODOC)

While *Element* is a super-class that is never directly instanciated, the derived class's constructor always call the *Element* constructor with the `options` object.
This contains all `options` that are common across all/many widgets.



<a name="ref.Element.updateZ"></a>
### .updateZ( z ) / .updateZIndex( z )

* z `number` the new z-index for that *element*

It updates the z-index of the *element* and triggers all internal mechanism needed.



<a name="ref.Element.topZ"></a>
### .topZ()

It updates the z-index of the *element* so that it is above all sibling *elements*.



<a name="ref.Element.bottomZ"></a>
### .bottomZ()

It updates the z-index of the *element* so that it is below all sibling *elements*.



<a name="ref.Element.setContent"></a>
### .setContent( content , [hasMarkup] , [dontDraw] )

* content `string` the new content for this *element*
* hasMarkup `boolean` when set, the content contains Terminal Kit's markup, default: false
* dontDraw `boolean` when set, the content's update does not trigger the *redraw* of the *element*

Set the content of this *element*.



<a name="ref.Element.draw"></a>
### .draw()

Draw the *element* on its parent.

It is called internally/automatically, userland code should not be bothered with that, except in rare use-cases.



<a name="ref.Element.redraw"></a>
### .redraw()

Redraw the *element*.
While `.draw()` is used when drawing the current *element* is enough (the *element* has not moved, and has not been resized),
`.redraw()` is used it is necessary to draw the closest ancestor which is a container.

It is called internally/automatically, userland code should not be bothered with that, except in rare use-cases.



<a name="ref.Element.drawCursor"></a>
### .drawCursor()

*Draw* the *element* cursor, i.e. move it to the right place.

It is called internally/automatically, userland code should not be bothered with that, except in rare use-cases.



<a name="ref.Element.saveCursor"></a>
### .saveCursor()

Save the *element* cursor position.



<a name="ref.Element.restoreCursor"></a>
### .restoreCursor()

Restore the *element* cursor position.



<a name="ref.Container"></a>
## Container

TODOC



<a name="ref.BaseMenu"></a>
## BaseMenu

TODOC

