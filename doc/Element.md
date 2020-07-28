
<a name="top"></a>
<a name="ref.Element"></a>
## Element

*Element* is the base class of **ALL** document model objects.



<a name="ref.Element.toc"></a>
## Table of Contents

* [Events](#ref.Element.event)
	* [key](#ref.Element.event.key)
	* [shortcut](#ref.Element.event.shortcut)

* [Key Bindings](#ref.Element.keyBindings)

* Constructor:
	* [new Element()](#ref.Element.new)

* Methods:
	* [.updateZ() / .updateZIndex()](#ref.Element.updateZ)
	* [.topZ()](#ref.Element.topZ)
	* [.bottomZ()](#ref.Element.bottomZ)
	* [.setContent()](#ref.Element.setContent)
	* [.draw()](#ref.Element.draw)
	* [.redraw()](#ref.Element.redraw)
	* [.drawCursor()](#ref.Element.drawCursor)
	* [.saveCursor()](#ref.Element.saveCursor)
	* [.restoreCursor()](#ref.Element.restoreCursor)



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
	* autoWidth, autoHeight `boolean` or `number`, when set to a number greater than 0 and lesser than or equals to 1 (true=1),
	  compute the width and/or height as a proportion of the parent Container width and/or height, e.g.: *true* or *1* use 100%
	  of the parent Container
	* label `string` a label for this element, only relevant for some widgets
	* key `string` a key for this element, only relevant for some widgets
	* value `any` a value associated with this element, only relevant for some widgets
	* content `string` the content of the element that will be displayed, if it makes sense for the widget
	* contentHasMarkup <a name="ref.Element.new.contentHasMarkup"></a>`boolean` or `string` when set to *true* or the string *'markup'*, the content contains Terminal Kit's markup,
	  used to set attributes of parts of the content, when set to the string *'ansi'*, the content contains ANSI escape sequence,
	  *true* and *markup* are only relevant for some widgets and *ansi* is even less supported, default: false.
	* contentWidth `number` the width (in terminal's cells) of the content, only relevant for some widgets
	* hidden `boolean` when set, the element is not visible and no interaction is possible with this element. It also affects children. Default: false.
	* disabled: mostly for user-input, the element is often grayed and unselectable, the effect depending on the widget
	* keyBindings `Object` having a [*Terminal Kit key name*](events.md#ref.event.key) as the key and an action as value ([see Document](Document.md#ref.Document.keyBindings))
	* meta `any` a userland-only property, it associates the element with some data that make sense in the application business-logic
	* noDraw `boolean` if true, don't draw the document on instantiation (default: false, draw immediately)
	* shortcuts **unstable** (TODOC)

While *Element* is a super-class that is never directly instantiated, the derived class's constructor always call the *Element* constructor with the `options` object.
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
* hasMarkup `boolean` or `string` when set to *true* or the string *'markup'*, the content contains Terminal Kit's markup,
  used to set attributes of parts of the content, when set to the string *'ansi'*, the content contains ANSI escape sequence,
  default: false. **NOTE:** not all widget support markup or ansi!
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

