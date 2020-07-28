
<a name="top"></a>
<a name="ref.Container"></a>
## Container

*Container* is the base class of **ALL** document model objects having their own [screenBuffer](ScreenBuffer.md#top), most notably
the [Document](Document.md#top) instance.

A *container* has its own *inputDst* used as an *outputDst* for all its children, i.e. the exposed drawing area for its children.
In conjunction with the rectangular *viewport* used for clipping, that *Dst* may eventually be much bigger than what is
actually displayed on the terminal, it can be used to virtually enlarge the available area, for clipping/scrolling/overflowing purpose,
and so one...

Everything needing an intermediate [screenBuffer](ScreenBuffer.md#top) is an instance of *Container*.



<a name="ref.Container.toc"></a>
## Table of Contents

* Constructor:
    * [new Container()](#ref.Container.new)

* Methods:
    * [.resizeViewport()](#ref.Container.resizeViewport)
    * [.resizeInput()](#ref.Container.resizeInput)
    * [.resize()](#ref.Container.resize)
    * [.move()](#ref.Container.move)
    * [.moveTo()](#ref.Container.moveTo)
	* [.scrollTo()](#ref.Container.scrollTo)
	* [.scroll()](#ref.Container.scroll)
	* [.scrollToTop()](#ref.Container.scrollToTop)
	* [.scrollToBottom()](#ref.Container.scrollToBottom)

* Properties:
	* [.inputDst](#ref.Container.inputDst)

* Inherit methods and properties from [Element](Element.md#ref.Element.toc)



<a name="ref.Container.new"></a>
### new Container( options )

* options `Object`, where:
	* inputX, inputY `number` the position of the *inputDst* relative to its *outputDst*, default to *outputX*, *outputY* or *x*, *y*
	  when there is no clipping/scrolling
	* inputWidth, inputHeight `number` the size of the *inputDst*, default to *outputWidth*, *outputHeight* or *width*, *height*
	  when there is no clipping/scrolling, i.e. when the *inputDst* is fully drawn into the *outputDst*
	* movable `boolean` when set, the container can be moved using with a mouse drag (default: false)
	* scrollable `boolean` if set, the container is scrollable (default: false)
	* hasHScrollBar `boolean` if set and if *scrollable*, the container has a horizontal scrollbar
	* hasVScrollBar `boolean` if set and if *scrollable*, the container has a vertical scrollbar
	* scrollX `number` the initial horizontal scroll value, default: 0
	* scrollY `number` the initial vertical scroll value, default: 0
	* palette `Palette` a [Palette instance](Palette.md#top), default to the current document's palette
    * backgroundAttr `number` or `object` the background [attributes](ScreenBuffer#ref.ScreenBuffer.attributes) for the *inputDst* screenBuffer,
      default to `{ bgColor: 'default' }`

While *Container* is a super-class that is never directly instantiated, the derived class's constructor always call the *Container* constructor with the `options` object.
This contains all `options` that are common to all type of *Container*.



<a name="ref.Container.resizeViewport"></a>
### .resizeViewport( rect )

* rect `Rect` or Rect-like `object`, see [Rect](Rect.md#top)

Resize the *container* viewport, the rectangle used to clip the *inputDst* before writing it to the *outputDst*.



<a name="ref.Container.resizeInput"></a>
### .resizeInput( rect )

* rect `Rect` or Rect-like `object`, see [Rect](Rect.md#top)

Resize this *container* own [screenBuffer](ScreenBuffer.md#top), the *inputDst* for its children to write on.



<a name="ref.Container.resize"></a>
### .resize( rect )

* rect `Rect` or Rect-like `object`, see [Rect](Rect.md#top)

Resize both the *inputDst* and the viewport with the same size (like calling [.resizeInput()](#ref.Container.resizeInput)
and [.resizeViewport()](#ref.Container.resizeViewport) with the same arguments).



<a name="ref.Container.move"></a>
### .move( dx , dy )

* dx, dy `number` the delta of the position of the *container* relative to itself

Move that *container* relative to its current position.
In other words, change the position of its own [screenBuffer](ScreenBuffer.md#top) relative to its parent screenBuffer.



<a name="ref.Container.moveTo"></a>
### .moveTo( x , y )

* x, y `number` the position of the *container* relative to its parent *container*

Move that *container* to a position relative to its parent's *container*.
In other words, change the position of its own [screenBuffer](ScreenBuffer.md#top) relative to its parent screenBuffer.



<a name="ref.Container.scrollTo"></a>
### .scrollTo( x , y )

* x, y `number` the new scrolling coordinates

This scrolls the container to the *x,y* coordinates and updates scrollbars.



<a name="ref.Container.scroll"></a>
### .scroll( dx , dy )

* dx, dy `number` the delta of the scroll

This scrolls the container from this *x,y* delta and updates scrollbars.



<a name="ref.Container.scrollToTop"></a>
### .scrollToTop()

This scrolls the container to the top and updates scrollbars.



<a name="ref.Container.scrollToBottom"></a>
### .scrollToBottom()

This scrolls the container to the bottom and updates scrollbars.



<a name="ref.Container.inputDst"></a>
### .inputDst

This property holds the underlying [screenBuffer](ScreenBuffer#ref.ScreenBuffer.top) object.
It can be used to achieve more complex stuffs.

