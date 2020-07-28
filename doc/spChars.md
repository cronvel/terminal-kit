
<a name="top"></a>
<a name="ref.spChars"></a>
## Special Characters sets



<a name="ref.spChars.toc"></a>
## Table of Contents

* [Borders/boxes/frames](#ref.spChars.box)
* [Animations/spinners](#ref.spChars.animation)



<a name="ref.spChars.box"></a>
### Borders/boxes/frames

Available borders:

* plain: use only full-block chars
* empty: use only empty spaces
* ascii: use ASCII chars `-`, `|` and `+`
* light: light frames
* lightRounded: light frames and rounded borders
* heavy: heavy/thick frames/borders
* double: double lines frames/borders
* dotted: dotted lines frames/borders

<a name="ref.spChars.box.custom"></a>
Everywhere a border/box/frame is required, a custom border could be provided, it should be an `object` of single char,
having all those mandatory properties:

* vertical: vertical line char, e.g. `│`
* horizontal: horizontal line char, e.g. `─`
* topLeft: top-left corner char, e.g. `┌`
* topRight: top-right corner char, e.g. `┐`
* bottomLeft: bottom-left corner char, e.g. `└`
* bottomRight: bottom-right corner char, e.g. `┘`
* topTee: tee char that is *flat* on the top side, e.g. `┬`
* bottomTee: tee char that is *flat* on the bottom side, e.g. `┴`
* leftTee: tee char that is *flat* on the left side, e.g. `├`
* rightTee: tee char that is *flat* on the right side, e.g. `┤`
* cross: cross char, e.g. `┼`



<a name="ref.spChars.animation"></a>
### Animations/spinners

Available animations:

* asciiSpinner: spinner using only ASCII chars
* lineSpinner: spinning lines
* dotSpinner: spinning dots using braille chars
* bitDots: 8-bit counter using braille chars
* impulse: three pulsing dots
* unboxing: growing and shrinking block horizontaly and verticaly
* unboxing-color: same than *unboxing* but with colors

<a name="ref.spChars.animation.custom"></a>
Everywhere an animation is required, a custom animation could be provided, it is an `array` of ( `array` of `string` **OR** `string` ).
The `array` of `array` of `string` is used when the animation require multiple lines of text.

