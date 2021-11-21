

<a name="top"></a>
## Markup

Terminal-kit support markup on multiple places.
Markup are special sequences starting with a caret `^` inserted directly inside the text content, that are parsed to produce text-styling.

For example, the string `"This is ^Ggreen^ and this is ^Rred^ !"` would output the word 'green' in green and 'red' in red,
when passed to most Terminal-kit functions.

Regular markup consists only of two chars, first the caret `^`, then any char listed below.

Complex markup is used to lift the single character limitation, it starts with `^[` followed by the command, and ends with `]`.
For example, the string `"This is ^[green]green^ and this is ^[red]red^ !"` would output the word 'green' in green and 'red' in red,
when passed to most Terminal-kit functions.
Complex markup supports the `key:value` format, the previous markup is equivalent to: `"This is ^[fg:green]green^ and this is ^[fg:red]red^ !"`.
In that example, *fg* was for *ForeGround color*, in the same vein *bg* can be used to set up the *BackGround color*: `"This is ^[bg:green]green^ and this is ^[bg:red]red^ !"`.

If the terminal support *true color*, you can use hexadecimal color code (`#` followed by 3 or 6 hexadecimal characters), e.g.: `"This is ^[#f9a]pink^ !"`.



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



#### Complex markup *key:value* format

By keys:

* `fg` (or aliases: `fgColor`, `color`, `c`) set the foreground color, the value can be one of the ANSI color (*red*, *brightRed*, etc),
	it can also be any color declared in a *Palette* for methods of object supporting `Palette`, it can be a color-code (e.g.: `#aa5577`)
	if both the terminal and the method support *true-color*.
* `bg` (or alias: `bgColor`) set the background color, the supported values are exactly the same than for *foreground color*.



#### Complex markup **NOT** in the *key:value* format

Any ANSI color (*red*, *brightRed*, etc) or color code (e.g.: `#aa5577`) will be considered as the value for the *foreground color*.

