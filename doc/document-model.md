

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
	* [Button](#ref.Button)
	* [ColumnMenu](#ref.ColumnMenu)
	* [ColumnMenuMulti](#ref.ColumnMenuMulti)
	* [DropDownMenu](#ref.DropDownMenu)
	* [EditableTextBox](#ref.EditableTextBox)
	* [Form](#ref.Form)
	* [InlineInput](#ref.InlineInput)
	* [LabeledInput](#ref.LabeledInput)
	* [Layout](#ref.Layout)
	* [RowMenu](#ref.RowMenu)
	* [SelectList](#ref.SelectList)
	* [SelectListMulti](#ref.SelectListMulti)
	* [Slider](#ref.Slider)
	* [Text](#ref.Text)
	* [TextBox](#ref.TextBox)
	* [TextTable](#ref.TextTable)
	* [ToggleButton](#ref.ToggleButton)

* Base classes:
	* [Element](Element.md#top)
	* [Container](Container.md#top)
	* [BaseMenu](BaseMenu.md#top)



<a name="ref.Button"></a>
## Button

TODOC



<a name="ref.ColumnMenu"></a>
## ColumnMenu

TODOC



<a name="ref.ColumnMenuMulti"></a>
## ColumnMenuMulti

TODOC



<a name="ref.DropDownMenu"></a>
## DropDownMenu

TODOC



<a name="ref.EditableTextBox"></a>
## EditableTextBox

TODOC



<a name="ref.Form"></a>
## Form

TODOC



<a name="ref.InlineInput"></a>
## InlineInput

An inlineInput is a one-line-text-input.

TODOC



<a name="ref.LabeledInput"></a>
## LabeledInput

TODOC



<a name="ref.Layout"></a>
## Layout

TODOC



<a name="ref.RowMenu"></a>
## RowMenu

TODOC



<a name="ref.SelectList"></a>
## SelectList

TODOC



<a name="ref.SelectListMulti"></a>
## SelectListMulti

TODOC



<a name="ref.Slider"></a>
## Slider

TODOC



<a name="ref.Text"></a>
## Text

TODOC



<a name="ref.TextTable"></a>
## TextTable

TODOC



<a name="ref.ToggleButton"></a>
## ToggleButton

TODOC

