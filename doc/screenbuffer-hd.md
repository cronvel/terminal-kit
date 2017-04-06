

<a name="top"></a>
<a name="ref.ScreenBufferHD"></a>
## The ScreenBuffer HD

![unstable](unstable.png)

*This feature is still in beta/unstable version, it is not under the SemVer contract.*

This is the 32-bit version of [the ScreenBuffer](screenbuffer.md#ref.ScreenBuffer), it subclasses it.

See the [the ScreenBuffer documentation](screenbuffer.md#ref.ScreenBuffer) for the common parts:
**only HD specific features are listed here.**

A *screenBufferHD* is a buffer holding contents for a rectangular area.
Each cell of the rectangular area contains:

* a character
* a 32-bit foreground color (RGBA)
* a 32-bit background color (RGBA)
* a style (bit flags: bold, dim, italic, underline, blink, inverse, hidden, strike)
* a transparency mask (bit flags: character transparency and style transparency)

When drawing to another surface, blending options can be given like *opacity* and the *blend function*
(normal, screen, multiply, overlay, etc).

**Note:** *screenBufferHD* and *screenBuffer* are not compatible ATM, it is not possible to draw one into the other.



## Table of Contents

* Static methods:
	* [ScreenBuffer.create()](#ref.ScreenBufferHD.create)

* Properties:
	* [.blending](#ref.ScreenBufferHD.blending)

* Methods:
	* [.draw()](#ref.ScreenBufferHD.draw)

* [The Attribute Object](#ref.ScreenBufferHD.attributes)



<a name="ref.ScreenBufferHD.create"></a>
### ScreenBuffer.create( options )

This creates a ScreenBufferHD instance with the appropriate options.



<a name="ref.ScreenBufferHD.blending"></a>
### .blending

Either `false` or an `object`, the is default value for [*.draw()*](#ref.ScreenBufferHD.draw)'s blending option.



<a name="ref.ScreenBufferHD.draw"></a>
### .draw( [options] )

This draws the current *screenBufferHD* into its *dst* (destination), which is either a `Terminal`
or another `ScreenBufferHD` instance.



<a name="ref.ScreenBufferHD.attributes"></a>
### The Attributes Object

An attributes object contains attributes to style cells.
Available attributes are:

* r `integer` the red channel of the foreground color (ranging from 0 to 255)
* g `integer` the green channel of the foreground color (ranging from 0 to 255)
* b `integer` the blue channel of the foreground color (ranging from 0 to 255)
* a `integer` the alpha channel of the foreground color (ranging from 0 to 255)
* bgR `integer` the red channel of the background color (ranging from 0 to 255)
* bgG `integer` the green channel of the background color (ranging from 0 to 255)
* bgB `integer` the blue channel of the background color (ranging from 0 to 255)
* bgA `integer` the alpha channel of the background color (ranging from 0 to 255)
* bold `boolean`
* dim `boolean`
* italic `boolean`
* underline `boolean`
* blink `boolean` (note: most terminal does not support it)
* inverse `boolean`
* hidden `boolean`
* strike `boolean`
* transparency `boolean` if true, all transparencies are activated
* styleTransparency `boolean` *style transparency*, anything drawn with that attribute
  will use the existing destination's style instead of its own style.
  Styles cover the bold, dim, italic, underline, blink, inverse, hidden and strike attributes.
* charTransparency `boolean` *character transparency*, anything drawn with that attribute
  will use the existing destination's character instead of its own character

