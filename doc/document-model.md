

<a name="top"></a>
<a name="ref.document-model"></a>
## The Document Model

The *document model* is **99% stable**, but the current documentation is still in progress.

The *document model* uses the whole or a part of the terminal area as a *document*, in a similar way than a webpage,
where multiple widgets are present on a specific place in the screen, all active at the same time.

It is opposed to the *inline mode* (i.e. all other Terminal Kit's features), where widgets are instanciated 
one at a time, line after line.

Some widgets exist in both the *inline mode* and the *document model*, but with different features.
Those differences will eventually disappear, once those *document model* widgets will be compatible with the *inline mode*
and supersede the older one.

The *document model* is backed by [*screenBuffers*](ScreenBuffer.md#top).

It can manage multiple widgets each with its own redraw condition, even some that overlap, like a [*drop-down menu*](DropDownMenu.md#top),
it manages widget keyboard focus, event dispatching, widget cycling, **with mouse support everywhere**.



<a name="toc"></a>
## Table of Contents

* Instantiable classes:
	* [Document](Document.md#top)
	* [AnimatedText](AnimatedText.md#top)
	* [Bar](Bar.md#top)
	* [Border](Border.md#top)
	* [Button](Button.md#top)
	* [ColumnMenu](ColumnMenu.md#top)
	* [ColumnMenuMulti](ColumnMenuMulti.md#top)
	* [DropDownMenu](DropDownMenu.md#top)
	* [EditableTextBox](EditableTextBox.md#top)
	* [Form](Form.md#top)
	* [InlineInput](InlineInput.md#top)
	* [InlineFileInput](InlineFileInput.md#top)
	* [InlineMenu](InlineMenu.md#top)
	* [LabeledInput](LabeledInput.md#top)
	* [Layout](Layout.md#top)
	* [RowMenu](RowMenu.md#top)
	* [SelectList](SelectList.md#top)
	* [SelectListMulti](SelectListMulti.md#top)
	* [Slider](Slider.md#top)
	* [Text](Text.md#top)
	* [TextBox](TextBox.md#top)
	* [TextTable](TextTable.md#top)
	* [ToggleButton](ToggleButton.md#top)
	* [Window](Window.md#top)

* Base classes:
	* [Element](Element.md#top)
	* [Container](Container.md#top)
	* [BaseMenu](BaseMenu.md#top)

