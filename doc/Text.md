<a name="top"></a>
<a name="ref.Text"></a>
## Text

A *Text* is a basic widget that displays text content with optional formatting.
It can display plain text or content with markup/ANSI formatting, and supports features like padding and content ellipsis.
Text widgets can have fixed sizes or adapt their size automatically to the content.

<a name="ref.Text.toc"></a>
## Table of Contents

* Events: Inherits from [Element](Element.md#ref.Element.event)

* Constructor:
	* [new Text()](#ref.Text.new)

* Methods:
	* [.setContent()](#ref.Text.setContent)
	* [.computeRequiredWidth()](#ref.Text.computeRequiredWidth)
	* [.computeRequiredHeight()](#ref.Text.computeRequiredHeight)
	* [.resizeOnContent()](#ref.Text.resizeOnContent)

* Inherit methods and properties from [Element](Element.md#ref.Element.toc)

<a name="ref.Text.new"></a>
### new Text( options )

* options `Object`, where:
	* *all [the base class Element constructor's](Element.md#ref.Element.new) options*
	* attr `object` attributes for the text, default to `{ bgColor: 'brightBlack' }`
	* content `string` or `Array` of strings, the text content of the widget
	* contentHasMarkup `boolean` or `string` when set to *true*, the content contains Terminal Kit's markup,
	  when set to *'ansi'* or *'legacyAnsi'*, the content contains ANSI escape sequences, default: false
	* leftPadding `string` text to display before the content, default: ''
	* rightPadding `string` text to display after the content, default: ''
	* paddingHasMarkup `boolean` when true, padding strings can contain markup, default: false
	* contentEllipsis `string` or `boolean` character(s) to display when content is clipped, if true it's '…', default: ''
	* contentAdaptativeWidth `boolean` when true, the widget width adapts to the content width, default: true if width is not provided
	* contentAdaptativeHeight `boolean` when true, the widget height adapts to the content height, default: true if height is not provided

This creates a *Text element* to display formatted text.

<a name="ref.Text.setContent"></a>
### .setContent( content , hasMarkup , [dontDraw] , [dontResize] )

* content `string` or `Array` of strings, the new text content
* hasMarkup `boolean` or `string` whether the content has markup, 'ansi', or 'legacyAnsi' formatting
* dontDraw `boolean` if true, don't redraw the element (default: false)
* dontResize `boolean` if true, don't resize the element even if adaptative size is enabled (default: false)

Updates the text content of the widget. If the content is a multiline array and `forceContentArray` is true (default),
the content will be treated as multiple lines.

<a name="ref.Text.computeRequiredWidth"></a>
### .computeRequiredWidth()

Calculates the width required for the content including left and right padding. Returns the inner width.

<a name="ref.Text.computeRequiredHeight"></a>
### .computeRequiredHeight()

Calculates the height required for the content. Returns the content height.

<a name="ref.Text.resizeOnContent"></a>
### .resizeOnContent()

Adjusts the widget dimensions based on content if contentAdaptativeWidth or contentAdaptativeHeight are enabled.

## Example

```javascript
// Simple text display
var text = new termkit.Text({
    parent: document,
    content: 'Simple text content',
    attr: { color: 'blue', bgColor: 'black' },
    x: 10,
    y: 5
});

// Text with markup
var markupText = new termkit.Text({
    parent: document,
    content: '^[fg:*royal-blue]Text with ^[fg:red]color^:',
    contentHasMarkup: true,
    x: 10,
    y: 7
});

// Multiline text with padding
var paddedText = new termkit.Text({
    parent: document,
    content: ['First line', 'Second line'],
    leftPadding: '| ',
    rightPadding: ' |',
    contentEllipsis: '…',
    attr: { bgColor: 'magenta' },
    x: 10,
    y: 10,
    width: 20
});
```