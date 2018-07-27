

<a name="top"></a>
<a name="ref.Rect"></a>
## Rect

The `Rect` instances are structures defining a rectangular portion.

They have read-only properties:
* xmin `integer` the minimum x-coordinate of the rectangle
* xmax `integer` the maximum x-coordinate of the rectangle (included)
* ymin `integer` the minimum y-coordinate of the rectangle
* ymax `integer` the maximum y-coordinate of the rectangle (included)
* width `integer` the width of the rectangle
* height `integer` the height of the rectangle
* isNull `boolean` true if the rectangle is considered *null*



<a name="ref.Rect.new"></a>
### new Rect()

This creates a `Rect` instance.
This constructor has three argument signatures.



#### new Rect( xmin , xmax , ymin , ymax )

* xmin `integer` the minimum x-coordinate of the rectangle
* xmax `integer` the maximum x-coordinate of the rectangle (included)
* ymin `integer` the minimum y-coordinate of the rectangle
* ymax `integer` the maximum y-coordinate of the rectangle (included)



#### new Rect( obj )

* obj `Object`, it can contain either:
	* xmin `integer` the minimum x-coordinate of the rectangle
	* xmax `integer` the maximum x-coordinate of the rectangle (included)
	* ymin `integer` the minimum y-coordinate of the rectangle
	* ymax `integer` the maximum y-coordinate of the rectangle (included)
  
  or:	
	* x `integer` the minimum x-coordinate of the rectangle
	* y `integer` the minimum y-coordinate of the rectangle
	* width `integer` the width of the rectangle
	* height `integer` the height of the rectangle



#### new Rect( src )

* src: the source to create a *rect* from, it can be:
	* a `Rect` instance
	* a `Terminal` instance
	* a `ScreenBuffer` instance
	* a `TextBuffer` instance



<a name="ref.Rect.create"></a>
### Rect.create()

DEPRECATED, use [new Rect()](#ref.Rect.new) instead.



<a name="ref.Rect.wrappingRect"></a>
### Rect.wrappingRect( params )

* params `Object` parameters, where:
	* srcRect `Rect` the source rectangle
	* dstRect `Rect` the destination rectangle
	* offsetX `integer` the x-offset of the source relative to the destination
	* offsetY `integer` the y-offset of the source relative to the destination
	* wrapOnly `String` (optional) either *'x'* or *'y'*: only wrap along that axis

This class method is useful to wrap a source on a destination.
It returns an array of up to 4 *blitter parameters*, objects having the those properties:
* srcRect
* dstRect
* offsetX
* offsetY

This compute how the source can be copied (blitted) into the destination if the destination feature wrapping.
E.g.: if we have got a sprite moving past the right-side, part of the sprite that is outside of the destination
would not be clipped away, instead it would be copied on the left-side.



<a name="ref.Rect.regionIterator"></a>
### Rect.regionIterator()

*Internal usage only, not part of the public API.*



<a name="ref.Rect.tileIterator"></a>
### Rect.tileIterator()

*Internal usage only, not part of the public API.*



<a name="ref.Rect.wrapIterator"></a>
### Rect.wrapIterator()

*Internal usage only, not part of the public API.*



<a name="ref.Rect.set"></a>
### .set( obj )

* obj `Object`, it can contain either:
	* xmin `integer` the minimum x-coordinate of the rectangle
	* xmax `integer` the maximum x-coordinate of the rectangle (included)
	* ymin `integer` the minimum y-coordinate of the rectangle
	* ymax `integer` the maximum y-coordinate of the rectangle (included)

This set the new positions and dimensions for the rectangle.



<a name="ref.Rect.clip"></a>
### .clip( dstRect , [offsetX] , [offsetY] , [dstClipping] )

* dstRect `Rect` the destination *Rect* instance
* offsetX `integer` the x-offset of the source relative to the destination
* offsetY `integer` the y-offset of the source relative to the destination
* dstClipping `boolean` if true, the *dstRect* is clipped too (i.e. mutual clipping of *src* and *dst*)

This clips the source *Rect* instance relative to the *dstRect*.

Argument *offsetX* and *offsetY* are offsets of the source relative to the *dstRect* coordinate system, i.e. the position
of the source rectangle inside the destination rectangle.

