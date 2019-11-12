

<a name="top"></a>
<a name="ref.document"></a>
## The Document Model

![unstable](unstable.png)

The *document model* is almost stable, but the current documentation is still in progress.

The *document model* uses the whole or a part of terminal area as a *document*, in a similar way than a webpage,
where multiple widgets are present on a specific place in the screen.

It is opposed to the *inline mode* (i.e. all other Terminal Kit's features), where widgets are instanciated 
one at a time, line after line.

Some widget exist in both the *inline mode* and the *document model*, but with different features.
Those differences will eventually disappear, once those *document model* widgets will be compatible with the *inline mode*
and supersede the older one.

The *document model* is backed by a [*screenBuffer*](screenbuffer.md#top).



## Table of Contents

* Instantiable classes:
	* [Document](#ref.Document)
		* [new Document()](#ref.Document.new)
    * [Button](#ref.Button)
    * [ColumnMenu](#ref.ColumnMenu)
    * [ColumnMenuMulti](#ref.ColumnMenuMulti)
    * [DropDownMenu](#ref.DropDownMenu)
    * [EditableTextBox)](#ref.EditableTextBox)
    * [Form](#ref.Form)
    * [LabeledInput](#ref.LabeledInput)
    * [Layout](#ref.Layout)
    * [RowMenu](#ref.RowMenu)
    * [SelectList](#ref.SelectList)
    * [SelectListMulti](#ref.SelectListMulti)
    * [TextBox](#ref.TextBox)
    * [Text](#ref.Text)
    * [ToggleButton](#ref.ToggleButton)

* Base classes:
    * [Element](#ref.Element)
    * [Container](#ref.Container)
    * [BaseMenu](#ref.BaseMenu)



<a name="ref.Document"></a>
## Document

TODOC



<a name="ref.Document"></a>
### new Document( options )

* options `Object`, where:
	* outputX, outputY, outputWidth, outputHeight `integer` (optional) the position and size of the document
	  with respect to the screen

Instead of using `new termkit.Document()`, it's recommended to use `term.createDocument()`.

TODOC



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



<a name="ref.TextBox"></a>
## TextBox

TODOC



<a name="ref.Text"></a>
## Text

TODOC



<a name="ref.ToggleButton"></a>
## ToggleButton

TODOC



<a name="ref.Element"></a>
## Element

TODOC



<a name="ref.Container"></a>
## Container

TODOC



<a name="ref.BaseMenu"></a>
## BaseMenu

TODOC

