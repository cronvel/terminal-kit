

<a name="top"></a>
## Markup

Terminal-kit support markup on multiple places.
Markup are special sequences starting with a caret `^` inserted directly inside the text content, that are parsed to produce text-styling.

For example, the string `"This is ^Ggreen^ and this is ^Rred^ !"` would output the word 'green' in green and 'red' in red,
when passed to most Terminal-kit functions.

Regular markup consists only of two chars, first the caret `^`, then any char listed below.



#### Special markup

* `^^` output a single caret `^`
* `^:` style reset (back to the default color/background color/attribute)
* `^ ` syntactic sugar: style reset and still output a space
* `^;` *special* style reset: it also reset attribute forced by a document-model's widget
* `^#` *shift*, the next markup will use the *background* list



#### Regular markup

* `^-` set the dim attribute
* `^+` set the bold attribute
* `^_` set the underline attribute
* `^/` set the italic attribute
* `^!` set the inverse attribute
* `^k` set color to black
* `^r` set color to red
* `^g` set color to green
* `^y` set color to yellow/brown
* `^b` set color to blue
* `^m` set color to magenta
* `^c` set color to cyan
* `^w` set color to white
* `^K` set color to gray
* `^R` set color to bright red
* `^G` set color to bright green
* `^Y` set color to (bright) yellow
* `^B` set color to bright blue
* `^M` set color to bright magenta
* `^C` set color to bright cyan
* `^W` set color to bright white



#### Background markup (just after the `^#` shift)

* `^k` set background color to black
* `^r` set background color to red
* `^g` set background color to green
* `^y` set background color to yellow/brown
* `^b` set background color to blue
* `^m` set background color to magenta
* `^c` set background color to cyan
* `^w` set background color to white
* `^K` set background color to gray
* `^R` set background color to bright red
* `^G` set background color to bright green
* `^Y` set background color to (bright) yellow
* `^B` set background color to bright blue
* `^M` set background color to bright magenta
* `^C` set background color to bright cyan
* `^W` set background color to bright white


