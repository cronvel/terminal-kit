
<a name="top"></a>
<a name="ref.InlineInput"></a>
## InlineInput

The *inlineInput* is a single-line user-input text field.

It is meant to be the equivalent/replacement of the non-document-model [.inputField()](high-level.md#ref.inputField),
and in the futur, it will probably completely supersede it.

InlineInput features:

* prompt
* placeholder
* history
* auto-completion
* auto-completion hint
* auto-completion menu



<a name="ref.InlineInput.toc"></a>
## Table of Contents

* [Events](#ref.InlineInput.event)
	* [key](#ref.InlineInput.event.key)

* [Key Bindings](#ref.InlineInput.keyBindings)

* Constructor:
	* [new InlineInput()](#ref.InlineInput.new)

* Methods:

* Inherit methods and properties from [EditableTextBox](EditableTextBox.md#ref.EditableTextBox.toc)



<a name="ref.InlineInput.event"></a>
### Events

<a name="ref.InlineInput.event.key"></a>
#### *key*

See [Element's key event](Element.md#ref.Element.event.key).



<a name="ref.InlineInput.event.submit"></a>
#### *submit* ( value , undefined , element )

Arguments:
* value `string` this is the value of the *InlineInput*, i.e. the user input
* undefined `undefined` never used for *InlineInput*, exists for consistency across all *submit* events
* element `InlineInput` the submitting *InlineInput* element

This event is triggered when the user submits its input, with said input as the submitted value.



<a name="ref.InlineInput.event.cancel"></a>
#### *cancel* ( element )

Arguments:
* element `InlineInput` the canceling *InlineInput* element

This event is triggered when the user cancels the input, if the *inlineInput* is cancelable.



<a name="ref.InlineInput.keyBindings"></a>
### Key Bindings

* *submit*: submit the input, default: ENTER, KP_ENTER
* *cancel*: cancel the input (if the input is cancelable), default: ESCAPE
* *autoComplete*: try to auto-complete the current input, if an auto-complete array or function was provided, default: TAB
* *historyAutoComplete*: try to auto-complete the current input using the history, if an history array was provided, default: CTRL_R
* *historyPrevious*: set the current input to the previous history value, default: UP
* *historyNext*: set the current input to the next history value, default: DOWN
* *backDelete*: delete one character backward, default: BACKSPACE
* *delete*: delete one character, default: DELETE
* *backward*: move the cursor one character backward, default: LEFT
* *forward*: move the cursor one character forward, default: RIGHT
* *startOfWord*: move the cursor to the begining of the previous word, default: CTRL_LEFT
* *endOfWord*: move the cursor to the end of the next word, default: CTRL_RIGHT
* *startOfLine*: move the cursor at the begining of input, default: HOME
* *endOfLine*: move the cursor at the end of input, default: END
* *copyClipboard*: copy to clipboard (rely on xclip), default: CTRL_O
* *pasteClipboard*: paste from clipboard (rely on xclip), default: CTRL_P



<a name="ref.InlineInput.new"></a>
### new InlineInput( options )

* options `Object`, where:
	* *most of [the base class EditableTextBox constructor's](EditableTextBox.md#ref.EditableTextBox.new) options*
	* value/content `string` the initial input value (default to an empty string)
	* prompt `object` or `null`, if set, display a prompt before the user-input area, properties should be:
		* content `string` the prompt string
		* *any properties of [the TextBox constructor's](TextBox.md#ref.TextBox.new) options*
	* placeholder `string` the placeholder string
	* placeholderHasMarkup `boolean` or `string`, true if the placeholder contains markup, can also be the string 'ansi'
	  if the placeholder string contains ANSI code, default: false.
	* history `array` or `null` if set, it is an array containing previous entry, browsable with *historyPrevious/historyNext* keys (default keys: UP and DOWN),
		default: null
	* disabled `boolean` if true, the input is disabled (inactive, the user can't change it), default: false
	* submitted `boolean` if true, the input is already submitted, default: false
	* cancelable `boolean` if true, the *inlineInput* is cancelable, i.e. the user can use the cancel key (default key: ESCAPE), default: false
	* canceled `boolean` if true, the input is already canceled, default: false
	* autoComplete `Array` or `Function( inputString , [callback] )` or `null` if set, this is either an array of possible completion,
	  so the autocomplete key (default key: TAB) will auto-complete the input. If it is a function, it should accept an input `string`
	  and return the completed `string` (if no completion can be done, it should return the input string,
	  if multiple candidate are possible, it should return an array of string), the function can be **asynchronous** en return a `Promise`.
	* useAutoCompleteHint `boolean` if true and used in conjunction with the `autoComplete` option, write an auto-completion preview
	  at the right of the input (usually using a gray+italic style), default: false
	* autoCompleteHint `boolean` alias of `useAutoCompleteHint` (mimic `.inputField()`'s option)
	* useAutoCompleteMenu `boolean` if true and used in conjunction with the `autoComplete` option, create an addhoc [RowMenu](RowMenu.md#ref.top)
	  everytime the auto-completion return more than one candidate
	* autoCompleteMenu `boolean` alias of `useAutoCompleteMenu` (mimic `.inputField()`'s option)
	* menu `object` or `null` if set and used in conjunction with the `autoComplete` option, this object is passed to
	  the [RowMenu's contructor](RowMenu.md#ref.RowMenu.new)

This creates an *InlineInput element*.

