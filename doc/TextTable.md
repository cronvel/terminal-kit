
<a name="top"></a>
<a name="ref.TextTable"></a>
## TextTable

A *textTable* is a table of text with automatic column computing, cell fitting and word-wrapping.

Each cell is a [*TextBox*](TextBox.md#top) instance.

TextTable features:

* Various table border support [see borders/frames](spChars.md#ref.spChars.box)
* Distinct attributes/styles/colors for:
	* frame/border
	* regular cells
	* first row
	* first column
	* first cell
	* even rows
	* even columns
	* *even* cells (cells in both even row and even column)
	* *checkered* cells
* Fitting the table columns and rows to widget size: expand/shrink to width/height
* Line or word wrapping inside of cells



<a name="ref.TextTable.toc"></a>
## Table of Contents

* Constructor:
	* [new TextTable()](#ref.TextTable.new)

* Methods:
	* [.setCellContent()](#ref.TextTable.setCellContent)

* Inherit methods and properties from [Element](Element.md#ref.Element.toc)



<a name="ref.TextTable.new"></a>
### new TextTable( options )

* options `Object`, where:
	* *all of [the base class Element constructor's](Element.md#ref.Element.new) options*
	* cellContents `array` of `array` of `string` the text for each cell, the top-level array contains rows, 
	  the nested arrays contain cell of text
	* contentHasMarkup `boolean` or `string` as usual it indicates if the content has markup or ANSI code,
	  [see Element's documentation](Element.md#ref.Element.new.contentHasMarkup), except that here it applies to
	  the *cellContents* options instead of *content*
	* textAttr `object` generic/default attributes for the cell's content (*textBox*), default to `{ bgColor: 'default' }`
	* voidAttr `object` attributes for the area of the cell (*textBox*) without any text content, default to `null`
	* firstRowTextAttr `object` attributes for the cell's content of the first row, default to `null` (= no special attributes,
	  fallback to another suitable attribute definition)
	* firstRowVoidAttr `object` attributes for the cell's void area, it is to *firstRowTextAttr* what *voidAttr* is to *textAttr*,
	  default to `null` (= no special attributes, fallback to another suitable attribute definition)
	* evenRowTextAttr `object` attributes for the cell's content of all even rows, default to `null` (= no special attributes,
	  fallback to another suitable attribute definition)
	* evenRowVoidAttr `object` attributes for the cell's void area, it is to *evenRowTextAttr* what *voidAttr* is to *textAttr*,
	  default to `null` (= no special attributes, fallback to another suitable attribute definition)
	* firstColumnTextAttr `object` attributes for the cell's content of the first column, default to `null` (= no special attributes,
	  fallback to another suitable attribute definition)
	* firstColumnVoidAttr `object` attributes for the cell's void area, it is to *firstColumnTextAttr* what *voidAttr* is to *textAttr*,
	  default to `null` (= no special attributes, fallback to another suitable attribute definition)
	* evenColumnTextAttr `object` attributes for the cell's content of all even columns, default to `null` (= no special attributes,
	  fallback to another suitable attribute definition)
	* evenColumnVoidAttr `object` attributes for the cell's void area, it is to *evenColumnTextAttr* what *voidAttr* is to *textAttr*,
	  default to `null` (= no special attributes, fallback to another suitable attribute definition)
	* firstCellTextAttr `object` attributes for the cell's content of the first cell (i.e. the top-left cell),
	  default to `null` (= no special attributes, fallback to another suitable attribute definition)
	* firstCellVoidAttr `object` attributes for the cell's void area, it is to *firstCellTextAttr* what *voidAttr* is to *textAttr*,
	  default to `null` (= no special attributes, fallback to another suitable attribute definition)
	* evenCellTextAttr `object` attributes for the cell's content of all cells that are **both on an even row and on an even column**,
	  default to `null` (= no special attributes, fallback to another suitable attribute definition)
	* evenCellVoidAttr `object` attributes for the cell's void area, it is to *evenCellTextAttr* what *voidAttr* is to *textAttr*,
	  default to `null` (= no special attributes, fallback to another suitable attribute definition)
	* checkerEvenCellTextAttr `object` attributes for the cell's content of all checker-style-even cells, i.e.:
	  when *rowNumber* + *columnNumber* is even, default to `null` (= no special attributes,
	  fallback to another suitable attribute definition)
	* checkerEvenCellVoidAttr `object` attributes for the cell's void area, it is to *checkerEvenCellTextAttr* what *voidAttr* is to *textAttr*,
	  default to `null` (= no special attributes, fallback to another suitable attribute definition)
	* expandToWidth `boolean` when set, expand columns' width to fill all the widget's width (default: false)
	* shrinkToWidth `boolean` when set, shrink the columns' width so it does not overflow the widget width (default: false)
	* expandToHeight `boolean` when set, expand rows' height to fill all the widget's height (default: false)
	* shrinkToHeight `boolean` when set, shrink the rows' height so it does not overflow the widget's height (default: false)
	* lineWrap `boolean` when set, the text content is wrapped to the next line instead of being clipped by the textBox border (default: false)
	* wordWrap `boolean` like `lineWrap` but is word-aware, i.e. it doesn't split words (default: false)
	* fit `boolean` shorthand, when set (default: false) it activates options: *expandToWidth, shrinkToWidth, expandToHeight, shrinkToHeight*
	  and *wordWrap*
	* hasBorder `boolean` when set, draw frames/borders around cells, default to true
	* borderAttr `object` attributes for the borders chars, default to the *textAttr* option
	* borderChars `object` or `string` the chars used for the border, if it is a string, it is one of
	  the [built-in borders/frames](spChars.md#ref.spChars.box), if it is an object, it should be in
	  the [border format](spChars.md#ref.spChars.box.custom), default to *'light'*
	* textBoxKeyBindings `object` if set, it replaces default key-bindings for all the *TextBox* instances

This creates a *TextTable element*.



<a name="ref.TextTable.setCellContent"></a>
### .setCellContent( x , y , content , [dontDraw] , [dontUpdateLayout] )

* x,y `number` the cell coordinate to modify
* content `string` the new content for this table cell
* dontDraw `boolean` when set, the cell content's update does not trigger the *redraw* of the *textTable*
* dontUpdateLayout `boolean` when set, the table layout is not updated

This update an existing cell content.
The table layout will be updated if needed, except if *dontUpdateLayout* is set.
The content may contain *markup*, but it should have been enabled on the *textTable* creation for this to work.

