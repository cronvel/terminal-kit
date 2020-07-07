
<a name="top"></a>
<a name="ref.Document"></a>
## Document

The *Document element* is the main [*Element*](Element.md#top) of the *document model*: it represents the whole document just like the
*document* object of the browser DOM. Most use cases just need one *document*, mapping the whole terminal area.

It is the necessary top-level *Element*, on top of all other widgets, since it manages drawing/redrawing of them, as well as event dispatching, and so on.
All other *elements* are children of a *document* or children of children of (children of... etc) a *document*: they just don't work without it.

Being a [*Container*](Container.md#top), it is backed by a [*screenBuffer*](ScreenBuffer.md#top).

So widgets are first drawn to the *document's screenBuffer*, and then the *document's screenBuffer* is *delta-optimized* drawn
to the underlying terminal.

TODOC



<a name="ref.Document.toc"></a>
## Table of Contents

* [Events](#ref.Document.event)
	* [key](#ref.Document.event.key)

* [Key Bindings](#ref.Document.keyBindings)

* Constructor:
	* [new Document()](#ref.Document.new)

* Methods:
	* [.giveFocusTo()](#ref.Document.giveFocusTo)
	* [.focusNext()](#ref.Document.focusNext)
	* [.focusPrevious()](#ref.Document.focusPrevious)
	* [.createShortcuts()](#ref.Document.createShortcuts)
	* [.removeElementShortcuts()](#ref.Document.removeElementShortcuts)

* Inherit methods and properties from [Container](Container.md#ref.Container.toc)



<a name="ref.Document.event"></a>
### Events

<a name="ref.Document.event.key"></a>
#### *key*

See [Element's key event](Element.md#ref.Element.event.key).



<a name="ref.Document.keyBindings"></a>
### Key Bindings

* *focusNext*: give the focus the next element, default: "TAB"
* *focusPrevious*: give the focus the previous element, default: "SHIFT_TAB"



<a name="ref.Document.new"></a>
### new Document( options )

* options `Object`, where:
	* *all [the base class Container's constructor](Container.md#ref.Container.new) options*
	* outputDst `Terminal` or `ScreenBuffer` this is the object where the document should be drawn into, 
	  **it is set automatically when using `term.createDocument()` instead of `new termkit.Document()`.**
	* eventSource `EventEmitter` or any EventEmitter-compatible objects (e.g. [nextgen-events](https://github.com/cronvel/nextgen-events))
	  **it is set automatically when using `term.createDocument()` instead of `new termkit.Document()`.**
	* outputX, outputY, outputWidth, outputHeight `integer` (optional) the position and size of the document
	  with respect to the screen (i.e. the *outputDst*)
	* keyBindings `Object` having a [*Terminal Kit key name*](events.md#ref.event.key) as the key and an action as value ([see above](#ref.Document.keyBindings))
	* noDraw `boolean` if true, don't draw the document on instantiation (default: false, draw immediately)

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

