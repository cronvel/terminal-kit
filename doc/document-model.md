

<a name="top"></a>
<a name="ref.document"></a>
## The Document Model

![unstable](unstable.png)

The *document model* is almost stable, but the current documentation is still in progress.

The *document model* uses the whole or a part of terminal area as a *document*, in a similar way than a webpage,
where multiple widgets are present on a specific place in the screen, all active at the same time.

It is opposed to the *inline mode* (i.e. all other Terminal Kit's features), where widgets are instanciated 
one at a time, line after line.

Some widget exist in both the *inline mode* and the *document model*, but with different features.
Those differences will eventually disappear, once those *document model* widgets will be compatible with the *inline mode*
and supersede the older one.

The *document model* is backed by [*screenBuffers*](screenbuffer.md#top).

It can manages drawing multiple widgets, even some that can overlap, like a [*drop-down menu*](#ref.DropDownMenu),
manage widget focus, event dispatching, widget cycling, **with mouse support everywhere**.



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
    * [EditableTextBox)](#ref.EditableTextBox)
    * [Form](#ref.Form)
    * [LabeledInput](#ref.LabeledInput)
    * [Layout](#ref.Layout)
    * [RowMenu](#ref.RowMenu)
    * [SelectList](#ref.SelectList)
    * [SelectListMulti](#ref.SelectListMulti)
    * [TextBox](#ref.TextBox)
    * [Text](#ref.Text)
    * [ToggleButton](#ref.ToggleButton)

* Base classes:
    * [Element](#ref.Element)
    * [Container](#ref.Container)
    * [BaseMenu](#ref.BaseMenu)



<a name="ref.Document"></a>
## Document

The *Document element* is the main [*Element*](#ref.Element) of the *document model*: it represents the whole document just like the
*document* object of the browser DOM. Most use cases need just one *document*, mapping the whole terminal.

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
	  ** it is set automatically when using `term.createDocument()` instead of `new termkit.Document()`.**
	* eventSource `EventEmitter` or any EventEmitter-compatible objects (e.g. [nextgen-events](https://github.com/cronvel/nextgen-events))
	  ** it is set automatically when using `term.createDocument()` instead of `new termkit.Document()`.**
	* outputX, outputY, outputWidth, outputHeight `integer` (optional) the position and size of the document
	  with respect to the screen (i.e. the *outputDst*)
	* keyBindings `Object` having a [*Terminal Kit key name*](events.md#ref.event.key) as the key and an action as value ([see below](#ref.Document.keyBindings))
	* noDraw `boolean` if true, don't draw the document on instantiation (default: false, draw immediately)
	* *... and all [Container](#ref.Container) options*

Instead of using `new termkit.Document()`, it's recommended to use `term.createDocument()`: it set automatically some options
like *outputDst* and *eventSource* to `term`.

TODOC



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



<a name="ref.TextBox"></a>
## TextBox

TODOC



<a name="ref.Text"></a>
## Text

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



<a name="ref.Container"></a>
## Container

TODOC



<a name="ref.BaseMenu"></a>
## BaseMenu

TODOC

