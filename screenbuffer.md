

## The ScreenBuffer

A screenBuffer is a buffer holding content for a rectangular area.
Each cell of the rectangular area contains:

* a character
* a style (foreground and background color, and styyle bit flags: bold, dim, italic, underline, blink,
  inverse, hidden, strike)
* a blending mask (bit flags: foreground transparency, background transparency, character transparency
  and style transparency)

They are two kind of screenBuffers, depending on the write-destination:

* screenBuffer writing directly to the terminal
* screenBuffer writing to another screenBuffer

When there are a lot of moving things, it is a good practice to first create one big screenBuffer mapping the whole terminal,
then create smaller screenBuffers writing to the terminal's screenBuffer, each one managing a part of the UI of the application,
a widget, a moving area, a sprite, etc.

ScreenBuffer's write to the terminal are optimized: since writing to a terminal can be CPU-intensive, only cells
that have changed are written, avoiding to refresh the whole screen for no reason.
The screenBuffer will always try to minimize the amount of terminal escape sequences to produce the new *frame*.


