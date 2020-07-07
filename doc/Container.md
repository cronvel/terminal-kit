
<a name="top"></a>
<a name="ref.Container"></a>
## Container

*Container* is the base class of **ALL** document model objects having their own [screenBuffer](ScreenBuffer.md#top), most notably
the [Document](Document.md#top) instances.

A *container* has its own *inputDst* used as an *outputDst* for all its children, i.e. the exposed drawing area for its children.
That *Dst* may eventually be much bigger than what is actually displayed on the terminal, it can be used to virtually enlarge the available area,
for clipping/scrolling/overflowing purpose, and so one...

Everything needing an intermediate [screenBuffer](ScreenBuffer.md#top) is an instance of *Container*.



<a name="ref.Container.toc"></a>
## Table of Contents

* Constructor:
    * [new Container()](#ref.Container.new)

* Methods:
    * [.resize() / .resizeInput()](#ref.Container.resize)
    * [.moveTo()](#ref.Container.moveTo)

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
	* palette `Palette` a [Palette instance](Palette.md#top), default to the current document's palette
    * backgroundAttr `number` or `object` the background [attributes](ScreenBuffer#ref.ScreenBuffer.attributes) for the *inputDst* screenBuffer,
      default to `{ bgColor: 'default' }`

While *Container* is a super-class that is never directly instantiated, the derived class's constructor always call the *Container* constructor with the `options` object.
This contains all `options` that are common to all type of *Container*.



### .resize( rect ) / .resizeInput( rect )

* rect `Rect` or Rect-like `object`, see [Rect](Rect.md#top)

Resize this *container* own [screenBuffer](ScreenBuffer.md#top).



<a name="ref.Container.moveTo"></a>
### .moveTo( x , y )

* x, y `number` the position of the *container* relative to its parent *container*

Move that *container* to a position relative to its parent's *container*.
In other words, change the position of its own [screenBuffer](ScreenBuffer.md#top) relative to the parent screenBuffer.



<a name="ref.Container.inputDst"></a>
### .inputDst

This property holds the underlying [screenBuffer](ScreenBuffer#ref.ScreenBuffer.top) object.
It can be used to achieve more complex stuffs.

