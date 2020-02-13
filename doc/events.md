

<a name="top"></a>
## Events

Those events are fired on your `Terminal` instances.



## Table of Contents

* ['resize'](#ref.event.resize)
* ['key'](#ref.event.key)
* ['mouse'](#ref.event.mouse)
* ['terminal'](#ref.event.terminal)
	


<a name="ref.event.resize"></a>
### 'resize' event ( width , height )

* width `number` the new width in character
* height `number` the new height in character

The 'resize' event is emitted when the terminal get resized, and it contains the new width and height.
Also `term.width` and `term.height` are updated too.



<a name="ref.event.key"></a>
### 'key' event ( name , matches , data )

* name `string` the key name
* matches `Array` of matched key name
* data `Object` contains more informations, mostly useful for debugging purpose, where:
	* isCharacter `boolean` is true if this is a *regular* character, i.e. *not* a control character
	* codepoint `number` (optional) the utf-8 code point of the character, if relevant
	* code `number` or `Buffer`, for multibyte character it is the raw `Buffer` input, for single byte character it is a `number`
	  between 0 and 255

The 'key' event is emitted whenever the user type something on the keyboard.

If `name` is a single char, this is a regular UTF8 character, entered by the user.
If the user type a word, each UTF8 character will produce its own 'key' event.

If `name` is a multiple chars string, then it is a SPECIAL key.

<a name="ref.event.key.specialKeyCodes"></a>
List of SPECIAL keys:

    ESCAPE ENTER BACKSPACE NUL TAB SHIFT_TAB 
    UP DOWN RIGHT LEFT
    INSERT DELETE HOME END PAGE_UP PAGE_DOWN
    KP_NUMLOCK KP_DIVIDE KP_MULTIPLY KP_MINUS KP_PLUS KP_DELETE KP_ENTER
    KP_0 KP_1 KP_2 KP_3 KP_4 KP_5 KP_6 KP_7 KP_8 KP_9
    F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12
    SHIFT_F1 SHIFT_F2 SHIFT_F3 SHIFT_F4 SHIFT_F5 SHIFT_F6
	SHIFT_F7 SHIFT_F8 SHIFT_F9 SHIFT_F10 SHIFT_F11 SHIFT_F12
    CTRL_F1 CTRL_F2 CTRL_F3 CTRL_F4 CTRL_F5 CTRL_F6
	CTRL_F7 CTRL_F8 CTRL_F9 CTRL_F10 CTRL_F11 CTRL_F12
    CTRL_SHIFT_F1 CTRL_SHIFT_F2 CTRL_SHIFT_F3 CTRL_SHIFT_F4
	CTRL_SHIFT_F5 CTRL_SHIFT_F6 CTRL_SHIFT_F7 CTRL_SHIFT_F8
	CTRL_SHIFT_F9 CTRL_SHIFT_F10 CTRL_SHIFT_F11 CTRL_SHIFT_F12
    SHIFT_UP SHIFT_DOWN SHIFT_RIGHT SHIFT_LEFT
    ALT_UP ALT_DOWN ALT_RIGHT ALT_LEFT
    CTRL_UP CTRL_DOWN CTRL_RIGHT CTRL_LEFT
    SHIFT_INSERT SHIFT_DELETE SHIFT_HOME SHIFT_END SHIFT_PAGE_UP SHIFT_PAGE_DOWN
    CTRL_INSERT CTRL_DELETE CTRL_HOME CTRL_END CTRL_PAGE_UP CTRL_PAGE_DOWN
    ALT_BACKSPACE ALT_INSERT ALT_DELETE ALT_HOME ALT_END ALT_PAGE_UP ALT_PAGE_DOWN
	SHIFT_TAB ALT_TAB
	ALT_SPACE CTRL_ALT_SPACE

And modifier on regular A-Z key:

    CTRL_A ALT_A CTRL_ALT_A ALT_SHIFT_A
    CTRL_B ALT_B CTRL_ALT_B ALT_SHIFT_B
    CTRL_C ALT_C CTRL_ALT_C ALT_SHIFT_C
    ...

Sometime, a key matches multiple combination.
For example CTRL-M on linux boxes is always the same as ENTER.
So the event will provide as the 'name' argument the most useful/common, here *ENTER*.
However the 'matches' argument will contain `[ ENTER , CTRL_M ]`.

Also notice that some terminal will support less keys.
For example, the Linux Console does not support SHIFT/CTRL/ALT + Arrows keys, it will produce a normal arrow key.
There is no workaround here, the underlying keyboard driver simply does not support this.

KP_* keys needs `applicationKeypad()`, e.g. without it KP_1 will report '1' or END.

Some terminal does not support `applicationKeypad()` at all, sometime turning numlock off can works, sometime not,
so it is nearly impossible to differentiate (for example) a KP_1 from an END, or a KP_7 from a HOME:
**dont rely too much on that!**

If you have to use some of those less supported keys, either provide alternatives keys, or make key bindings configurable.



<a name="ref.event.mouse"></a>
### 'mouse' event ( name , data )

* name `string` the name of the subtype of event
* data `Object` provide the mouse coordinates and keyboard modifiers status, where:
	* x `number` the row number where the mouse is
	* y `number` the column number where the mouse is
	* ctrl `boolean` true if the CTRL key is down or not
	* alt `boolean` true if the ALT key is down or not
	* shift `boolean` true if the SHIFT key is down or not
	* left `boolean` **ONLY** defined for MOUSE_DRAG subtype, true if it's a left-button mouse-drag
	* right `boolean` **ONLY** defined for MOUSE_DRAG subtype, true if it's a right-button mouse-drag
	* xFrom `number` **ONLY** defined for MOUSE_DRAG subtype, the x position from where the mouse-drag started
	* yFrom `number` **ONLY** defined for MOUSE_DRAG subtype, the y position from where the mouse-drag started

Activated when grabInput() is called with the 'mouse' options, e.g. `{ mouse: 'button' }`, `{ mouse: 'drag' }` or `{ mouse: 'motion' }`.

The argument 'name' can be:

* MOUSE_LEFT_BUTTON_PRESSED: well... it is emitted when the left mouse button is pressed
* MOUSE_LEFT_BUTTON_RELEASED: when this button is released
* MOUSE_RIGHT_BUTTON_PRESSED, MOUSE_RIGHT_BUTTON_RELEASED, MOUSE_MIDDLE_BUTTON_PRESSED, MOUSE_MIDDLE_BUTTON_RELEASED: self explanatory
* MOUSE_WHEEL_UP, MOUSE_WHEEL_DOWN: self explanatory
* MOUSE_OTHER_BUTTON_PRESSED, MOUSE_OTHER_BUTTON_RELEASED: a fourth mouse button is sometime supported
* MOUSE_BUTTON_RELEASED: a button were released, however the terminal does not tell us which one
* MOUSE_MOTION: if the options `{ mouse: 'motion' }` is passed to grabInput(), every moves of the mouse will fire this event
* MOUSE_DRAG: if the options `{ mouse: 'motion' }` or `{ mouse: 'drag' }` is passed to grabInput(), every moves of the mouse
  while a button is pressed will fire this event

*Good* terminals will provide everything: which specific buttons was pressed, which was released, mouse wheel, motions...

Some terminals will just report *MOUSE_BUTTON_RELEASED* for any button releases instead of the correct
*MOUSE_LEFT_BUTTON_RELEASED* / *MOUSE_RIGHT_BUTTON_RELEASED* / *MOUSE_MIDDLE_BUTTON_RELEASED* / *MOUSE_OTHER_BUTTON_RELEASED*.

Some terminals will never report *MOUSE_RIGHT_BUTTON_PRESSED* (e.g. old versions of *Gnome-Terminal*), instead it triggers
the terminal's context menu.

Some terminals will never report *MOUSE_MOTION* / *MOUSE_DRAG*.
By the way, **you can still get the mouse position** when a button is pressed (or released): the *data* argument still contains
the x and y coordinates of the mouse when said event was fired.

For *MOUSE_DRAG*, *left* and *right* are not activated at the same time, if they are both pressed, it will be considered
as a left-button drag (per terminal limitation).

So your application should not rely too much on less supported features: it should always provide alternatives.



<a name="ref.event.terminal"></a>
### 'terminal' event ( name , data )

* name `string` the name of the subtype of event
* data `Object` provide some data depending on the event's subtype

The 'terminal' event is emitted for terminal generic information.

The argument 'name' can be:

* CURSOR_LOCATION: it is emitted in response of a requestCursorLocation(), data contains 'x' & 'y', the coordinate of the cursor.

* SCREEN_SIZE: **rarely useful** it is emitted in response of a requestScreenSize(), data contains 'width' & 'height', the size of
  the screen in characters, and 'resized' (true/false) if the size has changed without node.js being notified

* FOCUS_IN: it is emitted if the terminal gains focus (if supported by your terminal)

* FOCUS_OUT: it is emitted if the terminal loses focus (if supported by your terminal)

* CLIPBOARD: **internal usage only** it is emitted in response of a requestClipboard()

