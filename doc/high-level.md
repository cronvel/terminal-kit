

<a name="top"></a>
## Terminal's High-level and Advanced Methods

This section is about high-level methods of `Terminal` instances.

**NOTE:** In the following code sample, `term` is always a `Terminal` instance.

This is where Terminal-Kit becomes really shiny: you can really build a feature-rich terminal application using this.

You can handle keyboard inputs, change the terminal color palette, create menu, get text input (similar to *readline*),
create nice progress bars, or display some special effects.



## Table of Contents

* [.fullscreen()](#ref.fullscreen)
* [.processExit()](#ref.processExit)
* [.grabInput()](#ref.grabInput)
* [.getCursorLocation()](#ref.getCursorLocation)
* [.getColor()](#ref.getColor)
* [.setColor()](#ref.setColor)
* [.getPalette()](#ref.getPalette)
* [.setPalette()](#ref.setPalette)
* [.yesOrNo()](#ref.yesOrNo)
* [.inputField()](#ref.inputField)
* [.singleLineMenu()](#ref.singleLineMenu)
* [.progressBar()](#ref.progressBar)
* [.slowTyping()](#ref.slowTyping)
	


## Advanced methods of a **Terminal** instance

Advanced methods are high-level library functions.



<a name="ref.fullscreen"></a>
### .fullscreen( options )

* options: true/false/object: if truthy it activate fullscreen mode, falsy return to normal mode,
  if it is an object it supports those properties:
	* noAlternate `boolean` true if the alternate screen buffer should not be used

Basically, this method try to achieve the same goal than the native terminal capability *alternate screen buffer*.
If *alternate screen buffer* is disabled on your terminal, it will provide a clean fallback, clearing the screen and positionning
the cursor at the upper-left corner.



<a name="ref.processExit"></a>
### .processExit( code )

* code `number` the exit code

This method should be used instead of calling `process.exit()` directly. The *code* argument will be transmitted to
`process.exit()` as it is.

It helps quitting cleanly your application without leaving the terminal in a bad state, so the user get a working shell back.



<a name="ref.grabInput"></a>
### .grabInput( options )

* options: false/true/Object, *false* disable input grabbing, *true* or an Object turn it on,
  if it is an Object then those properties are supported:
	* mouse: if defined, it activate mouse event, those values are supported for 'mouse':
		* 'button': report only button-event
		* 'drag': report button-event and report motion-event only when a button is pressed (i.e. a mouse drag)
		* 'motion': report button-event and all motion-event, use it only when needed, many escape sequences are sent from
		  the terminal (e.g. you may consider it for script running over SSH)
	* focus: true/false: if defined and true, focus event will be reported (if your terminal support it - *xterm* does)

This function turns input grabbing on, keyboard entries will not be echoed, and every input will generate an event
on the `term` object.


Quick example:

```js
var term = require( 'terminal-kit' ).terminal ;

function terminate()
{
	term.grabInput( false ) ;
	setTimeout( function() { process.exit() } , 100 ) ;
}

term.bold.cyan( 'Type anything on the keyboard...\n' ) ;
term.green( 'Hit CTRL-C to quit.\n\n' ) ;

term.grabInput( { mouse: 'button' } ) ;

term.on( 'key' , function( name , matches , data ) {
	console.log( "'key' event:" , name ) ;
	if ( name === 'CTRL_C' ) { terminate() ; }
} ) ;

term.on( 'terminal' , function( name , data ) {
	console.log( "'terminal' event:" , name , data ) ;
} ) ;

term.on( 'mouse' , function( name , data ) {
	console.log( "'mouse' event:" , name , data ) ;
} ) ;
```



<a name="ref.getCursorLocation"></a>
### .getCursorLocation( callback )

* callback( error , x , y )
	* error `mixed` truthy if an underlying error occurs
	* x `integer` the x coordinate of the cursor
	* y `integer` the y coordinate of the cursor

Get the cursor location.



<a name="ref.getColor"></a>
### .getColor( register , callback )

* register `number` the register number in the 0..255 range
* callback( error , rgb )
	* error `mixed` truthy if an underlying error occurs
	* rgb `Object` where:
		* r `number` in the 0..255 range, the red value
		* g `number` in the 0..255 range, the green value
		* b `number` in the 0..255 range, the blue value

Get the RGB values of a color register.



<a name="ref.setColor"></a>
### .setColor( register , r , g , b , [names] ) *or* .setColor( register , rgb , [names] )

* register `number` the register number in the 0..255 range
* r `number` in the 0..255 range, the red value
* g `number` in the 0..255 range, the green value
* b `number` in the 0..255 range, the blue value
* rgb `Object` where:
	* r `number` in the 0..255 range, the red value
	* g `number` in the 0..255 range, the green value
	* b `number` in the 0..255 range, the blue value
* names `Array` of `string`: names for that color, it default to an empty array

Set the RGB values for a color indexed by the integer *register*.



<a name="ref.getPalette"></a>
### .getPalette( register , callback )

* callback( error , palette )
	* error `mixed` truthy if an underlying error occurs
	* palette `Array` of 16 `Object` where:
		* r `number` in the 0..255 range, the red value
		* g `number` in the 0..255 range, the green value
		* b `number` in the 0..255 range, the blue value
		* names `Array` of `string`, names for this color

Request from the terminal the 16-colors palette in use.

If the terminal does not support the feature, then the default palette for this terminal is provided,
and each color that was modified by the lib replace it.



<a name="ref.setPalette"></a>
### .setPalette( palette )

* palette either:
	* `Array` of 16 `Object` where:
		* r `number` in the 0..255 range, the red value
		* g `number` in the 0..255 range, the green value
		* b `number` in the 0..255 range, the blue value
		* names `Array` of `string`, names for this color
	* *OR* `string` one of the built-in palette (default, gnome, konsole, linux, solarized, vga, xterm)

If the terminal support it, it will reset the 16-colors palette to the provided one.



<a name="ref.yesOrNo"></a>
### .yesOrNo( [options] , callback )

* options `Object` where:
	* yes `string` or `Array` contains a key code or an array of key code that will trigger the yes
	* no `string` or `Array` contains a key code or an array of key code that will trigger the 
	* echoYes `String` contains what to write on yes, default 'yes'
	* echoNo `String` contains what to write on no, default 'no'
* callback( error , result )
	* error `mixed` truthy if an underlying error occurs
	* result `boolean` true for 'yes' or false for 'no'

Wait for user input, call the completion callback when the user hit the 'y' key or the 'n' key,
*result* will be true if the user hit any *yes* keys or false if the user hit any *no* keys.
Other keys do not do anything.

Turn input grabbing on if necessary.

We can specify the keys for *yes* and *no* by providing a string or an array of string.

It returns an object featuring some functions to control things during the input process:

* abort(): abort the input process and do not even call the yesOrNo()'s callback



Quick example:

```js
var term = require( 'terminal-kit' ).terminal ;

function question()
{
	term( 'Do you like javascript? [Y|n]\n' ) ;
	
	// Exit on y and ENTER key
	// Ask again on n
	term.yesOrNo( { yes: [ 'y' , 'ENTER' ] , no: [ 'n' ] } , function( error , result ) {
	
		if ( result )
		{
			term.green( "'Yes' detected! Good bye!\n" ) ;
			process.exit() ;
		}
		else
		{
			term.red( "'No' detected, are you sure?\n" ) ;
			question() ;
		}
	} ) ;
}

question() ;
```

It produces:

![Yes or no output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/yes-no-doc1.gif)



<a name="ref.inputField"></a>
### .inputField( [options] , callback )

* options `Object` where:
	* echo `boolean` if true (the default), input are displayed on the terminal
	* default `string` default input/placeholder
	* cancelable `boolean` if true (default: false), it is cancelable by user using the cancel key (default: ESC),
	  thus will return null
	* style `Function` style used, default to the terminal instance (no style)
	* hintStyle `Function` style used for hint (auto-completion preview), default to `terminal.brightBlack` (gray)
	* maxLength `number` maximum length of the input
	* minLength `number` minimum length of the input
	* history `Array` (optional) an history array, so UP and DOWN keys move up and down in the history
	* maxLength `number` (optional) the maximum length (in characters) of the user input
	* autoComplete `Array` or `Function( inputString , [callback] )` (optional) an array of possible completion,
	  so the TAB key will auto-complete the input field. If it is a function, it should accept an input `string`
	  and return the completed `string` (if no completion can be done, it should return the input string,
	  if multiple candidate are possible, it should return an array of string), if **the function accepts 2 arguments**
	  (checked using *function*.length), then **the auto-completer will be asynchronous**!
	  Also note that if it is an array or the result of the function is an array, and if that array has a
	  special property `prefix` (a string), then this prefix will be prepended to the output of the auto complete menu.
	* autoCompleteMenu `boolean` or `Object` of options, used in conjunction with the 'autoComplete' options, if *truthy*
	  any auto-complete attempt having many completion candidates will display a menu to let the user choose between each
	  possibilities. If an object is given, it should contain options for the [.singleLineMenu()](#ref.singleLineMenu)
	  that is used for the completion (notice: some options are overwritten: 'y' and 'exitOnUnexpectedKey')
	* autoCompleteHint `boolean` if true (default: false) use the hintStyle to write the auto-completion preview
	  at the right of the input
	* keyBindings `Object` overide default key bindings, object's keys are Terminal-kit key names, the value is the action (string).
	* tokenHook `Function( token , isEndOfInput , previousTokens , term , config )` this is a hook called for each token
	  of the input, where:
	  	* token `String` is the current token
                * isEndOfInput `boolean` true if this is the **last token and if it ends the input string**
                  (e.g. it is possible for the last token to be followed by some blank char, in that case *isEndOfInput*
                  would be false)
	  	* previousTokens `Array` of `String` is a array containing all tokens before the current one
	  	* term is a Terminal instance
	  	* config `Object` is an object containing dynamic settings that can be altered by the hook, where:
	  		* style `Function` style in use (see the *style* option)
	  		* hintStyle `Function` style in use for hint (see the *hintStyle* option)
	  		* tokenRegExp `RegExp` the regexp in use for tokenization (see the *tokenRegExp* option)
	  		* autoComplete `Array` or `Function( inputString , [callback] )` (see the *autoComplete* option)
	  		* autoCompleteMenu `boolean` or `Object` (see the *autoCompleteMenu* option)
	  		* autoCompleteHint `boolean` enable/disable the auto-completion preview (see the *autoCompleteHint* option)
	  The config settings are always reset on new input, on new tokenization pass.
	  The hook can return a *style* (`Function`, like the *style* option) that will be used to print that token.
	  Used together, this can achieve syntax hilighting, as well as dynamic behavior suitable for a shell.
	  Finally, it can return a string, styled or not, that will be displayed in place of that token,
	  useful if the token should have multiple styles (but that string **MUST** contains the same number of
	  printable character, or it would lead hazardous behavior).
	* tokenResetHook `Function( term , config )` this is a hook called before the first token
	* tokenRegExp `RegExp` this is the regex used to tokenize the input, by default a token is space-delimited,
	  so "one two three" would be tokenized as [ "one" , "two" , "three" ].
* callback( error , input )
	* error `mixed` truthy if an underlying error occurs
	* input `string` the user input

Wait for user input, call the completion callback when the user hit the *ENTER* key and pass the user input
to the callback.

It turns input grabbing on if necessary.

Special keys are supported by the input field:

* ENTER, KP_ENTER: end the input process and return the current user input
* DELETE: delete
* BACKSPACE: backward delete
* LEFT, RIGHT: move the cursor one character left or right
* HOME: move the cursor at the beginning of the input field
* END: move the cursor at the end of the input field
* DOWN, UP: use the history feature (if `options.history` is set)
* TAB: use the auto-completion feature (if `options.autoComplete` is set)

Additional keys are used when the auto-completion displays its menu (see [.singleLineMenu()](#ref.singleLineMenu) for details).

All those key are customization through the *keyBindings* options.
Available actions are:

* submit: submit the input field (default: ENTER and KP_ENTER)
* cancel: cancel the input field (default: ESC, the input field should be cancelable)
* backDelete: delete one character backward (default: BACKSPACE)
* delete: delete one character (default: DELETE)
* backward: move the cursor one character backward (default: LEFT)
* forward: move the cursor one character forward (default: RIGHT)
* historyPrevious: use the previous history entry (default: UP)
* historyNext: use the next history entry (default: DOWN)
* startOfInput: move the cursor at the begining of input (default: HOME)
* endOfInput: move the cursor at the end of input (default: END)
* autoComplete: auto-complete the input (default: TAB)

It returns an EventEmitter object featuring some functions to control things during the input process:

* abort(): abort the input process and do not even call the inputField()'s callback
* stop(): stop the input process now, call the inputField()'s callback (same behavior than a regular 'ENTER' key pressed)
* getInput(): get the current input string
* getPosition(): return an object containing 'x' and 'y' properties, the coordinates where the input field starts
* redraw(): redraw the input field, useful if you had echo'ed something that can mess it
* hide(): hide the input field, it still records keystrokes
* show(): show the input field again
* rebase(): rebase the input field to the current cursor position. Please note: it does NOT erase the previously entered
  text, you have to use hide() before. It works this way because you may want to modify the screen in between, and
  it needs some I/O with the terminal to works accordingly.

It emits:

* *ready*: when the input field is ready (rarely useful)



Quick example, featuring *history* and *auto-completion*:

```js
var term = require( 'terminal-kit' ).terminal ;

var history = [ 'John' , 'Jack' , 'Joey' , 'Billy' , 'Bob' ] ;

var autoComplete = [
	'Barack Obama' , 'George W. Bush' , 'Bill Clinton' , 'George Bush' ,
	'Ronald W. Reagan' , 'Jimmy Carter' , 'Gerald Ford' , 'Richard Nixon' ,
	'Lyndon Johnson' , 'John F. Kennedy' , 'Dwight Eisenhower' ,
	'Harry Truman' , 'Franklin Roosevelt'
] ;

term( 'Please enter your name: ' ) ;

term.inputField(
	{ history: history , autoComplete: autoComplete , autoCompleteMenu: true } ,
	function( error , input ) {

		term.green( "\nYour name is '%s'\n" , input ) ;
		process.exit() ;
	}
) ;
```

It produces:

![Input field output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/input-field-doc1.gif)

If we need our own auto-completer, we might take advantage of the built-in static method
[termkit.autoComplete()](global-api.md#ref.autoComplete).

Custom auto-completer can be asynchronous, if the function's *length* is **exactly 2**.

<a name="ref.example.autoComplete"></a>
This is an example of a file selector that exposes the async behavior of auto-completer and the usage of
the static `termkit.autoComplete()` method:

```js
var fs = require( 'fs' ) ;
var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;

var autoCompleter = function autoCompleter( inputString , callback )
{  
    fs.readdir( __dirname , function( error , files ) {
        callback( undefined , termkit.autoComplete( files , inputString , true ) ) ;
    } ) ;
} ;
    
term( 'Choose a file: ' ) ;

term.inputField(
	{ autoComplete: autoCompleter , autoCompleteMenu: true } ,
	function( error , input ) {
		if ( error )
		{
			term.red.bold( "\nAn error occurs: " + error + "\n" ) ;
		}
		else
		{
			term.green( "\nYour file is '%s'\n" , input ) ;
		}
		
		process.exit() ;
	}
) ;
```

It produces:

![Input field output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/input-field-doc2.gif)

Also note that if the `autoComplete` options is an array or if it is a function whose output is an array, 
a special property `prefix` (a string) can be set on it: this prefix will be prepended to the output of the auto complete menu.



<a name="ref.singleLineMenu"></a>
### .singleLineMenu( menuItems , [options] , callback )

* menuItems `array` of menu item text
* options `object` of options, where:
	* y `number` the line where the menu will be displayed, default to the next line
	* separator `string` (default: '  ') the string separating each menu item
	* nextPageHint `string` (default: ' » ') string indicator for a next page
	* previousPageHint `string` (default: ' « ') string indicator for a previous page
	* style `function` the style of unselected items, default to the current `term`
	* selectedStyle `function` the style of the selected item, default to `term.dim.blue.bgGreen`
	* exitOnUnexpectedKey `boolean` if an unexpected key is pressed, it exits, calling the callback with undefined values
* callback( error , response ), where:
	* error `mixed` truthy if an underlying error occurs
	* response `Object` where
		* selectedIndex `number` the user-selected menu item index
		* selectedText `string` the user-selected menu item text
		* x `number` the x coordinate of the selected menu item (the first character)
		* y `number` the y coordinate of the selected menu item (same coordinate for all items since it's a single line menu)
		* unexpectedKey `string` when 'exitOnUnexpectedKey' option is set and an unexpected key is pressed, this contains
		  the key that produced the exit

It creates an interactive menu that uses only a single line.

It features **paging** if items oversize the line length, and supports the following keys:

* ENTER, KP_ENTER: end the process and return the currently selected menu item
* LEFT, RIGHT: move and select the previous or the next item in the menu
* UP, DOWN: go the previous or the next page of items (if paging is used)
* HOME, END: move and select the first or the last item of the menu

If the 'exitOnUnexpectedKey' option is set, any other keys will exit the menu, the callback's *response* argument
does not contain any property except 'unexpectedKey', that will contain the key having triggered the exit.

Example:

```js
var term = require( 'terminal-kit' ).terminal ;

var items = [ 'File' , 'Edit' , 'View' , 'History' , 'Bookmarks' , 'Tools' , 'Help' ] ;

var options = {
	y: 1 ,	// the menu will be on the top of the terminal
	style: term.inverse ,
	selectedStyle: term.dim.blue.bgGreen
} ;

term.clear() ;

term.singleLineMenu( items , options , function( error , response ) {
	term( '\n' ).eraseLineAfter.green(
		"#%s selected: %s (%s,%s)\n" ,
		response.selectedIndex ,
		response.selectedText ,
		response.x ,
		response.y
	) ;
	process.exit() ;
} ) ;
```

It produces:

![Single line menu output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/single-line-menu-doc1.gif)

It creates a menu on the top of the terminal, with unselected items using inverted foreground/background colors,
and the selected item using blue on green.
When the user press RETURN/ENTER, it displays the index, text and coordinates of the selected menu item.



<a name="ref.progressBar"></a>
### .progressBar( [options] )

* options `object` of options, all of them are **OPTIONAL**, where:
	* width: `number` the total width of the progress bar, default to the max available width
	* percent: `boolean` if true, it shows the progress in percent alongside with the progress bar
	* eta: `boolean` if true, it shows the Estimated Time of Arrival alongside with the progress bar
	* items `number` the number of items that should be completed, turns the *item mode* on
	* title `string` the title of the current progress bar, turns the *title mode* on
	* barStyle `function` the style of the progress bar items, default to `term.cyan`
	* barBracketStyle `function` the style of the progress bar bracket character, default to options.barStyle if given
	  or `term.blue`
	* percentStyle `function` the style of percent value string, default to `term.yellow`
	* etaStyle `function` the style of the ETA display, default to `term.bold`
	* itemStyle `function` the style of the item display, default to `term.dim`
	* titleStyle `function` the style of the title display, default to `term.bold`
	* itemSize `number` the size of the item status, default to 33% of width
	* titleSize `number` the size of the title, default to 33% of width or title.length depending on context
	* barChar `string` the char used for the bar, default to '='
	* barHeadChar `string` the char used for the bar, default to '>'
	* maxRefreshTime `number` the maximum time between two refresh in ms, default to 500ms
	* minRefreshTime `number` the minimum time between two refresh in ms, default to 100ms

It creates a nice progress bar and return a controller object to interact with it.

The controller provides those functions:

* update( updateObject ): update the progress bar, having the arguments:
	* updateObject `object` or `number` or `null`. If *updateObject* is not an object, it's a shorthand for `{ progress: value }`.
	  It supports those properties:
		* progress `number` or `null` the progress value:
			* if it's a float between 0 and 1, it's the actual progress value to be displayed
			* if `null` then it will display a spinning wheel: something is in progress, but cannot be quantified
		* items `number` change the number of items that should be completed, turns the *item mode* on
		* title `string` change the title of the current progress bar, turns the *title mode* on

* startItem( name ): in *item mode*, it informs the progress bar that a new item is processing, having arguments:
	* name `string` the name of the item that will be displayed in the item status part of the progress bar

* itemDone( name ): in *item mode*, it informs the progress bar that an item is now done, if that item was started using
  `.startItem()`, it will be removed from the running item list. When the number of finished item reaches the `items` parameter
  (see the `.progressBar()`'s 'items' option or `.update()` method's 'items' option), the progressBar reaches 100% and stop.
  It has the arguments:
	* name `string` the name of the item that just finished.

* stop(): stop the progress bar, no redraw will occurs

* resume(): resume a previously stopped progress bar, it will be redrawn again



Example of a progress bar using fake progress values:

```js
var term = require( 'terminal-kit' ).terminal ;

var progressBar , progress = 0 ;


function doProgress()
{
	// Add random progress
	progress += Math.random() / 10 ;
	progressBar.update( progress ) ;
	
	if ( progress >= 1 )
	{
		// Cleanup and exit
		setTimeout( function() { term( '\n' ) ; process.exit() ; } , 200 ) ;
	}
	else
	{
		setTimeout( doProgress , 100 + Math.random() * 400 ) ;
	}
}


progressBar = term.progressBar( {
	width: 80 ,
	title: 'Serious stuff in progress:' ,
	eta: true ,
	percent: true
} ) ;

doProgress() ;
```

It produces:

![Progress bar output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/progress-bar-doc1.gif)

It creates a progress bar and feeds it with a random progress value, then quit when it reaches 100%.


Example of a progress bar in *item mode*:

```js
var term = require( 'terminal-kit' ).terminal ;

var progressBar ;

var thingsToDo = [
	'update my lib' ,
	'data analyzing' ,
	'serious business' ,
	'decrunching data' ,
	'do my laundry' ,
	'optimizing'
] ;

var countDown = thingsToDo.length ;


function start()
{
	if ( ! thingsToDo.length ) { return ; }
	
	var task = thingsToDo.shift() ;
	
	progressBar.startItem( task ) ;
	
	// Finish the task in...
	setTimeout( done.bind( null , task ) , 500 + Math.random() * 1200 ) ;
	
	// Start another parallel task in...
	setTimeout( start , 400 + Math.random() * 400 ) ;
}


function done( task )
{
	progressBar.itemDone( task ) ;
	countDown -- ;
	
	// Cleanup and exit
	if ( ! countDown )
	{
		setTimeout( function() { term( '\n' ) ; process.exit() ; } , 200 ) ;
	}
}


progressBar = term.progressBar( {
	width: 80 ,
	title: 'Daily tasks:' ,
	eta: true ,
	percent: true ,
	items: thingsToDo.length
} ) ;

start() ;
```

It produces:

![Progress bar output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/progress-bar-doc2.gif)

It creates a progress bar and start and finish task with a random time, then quit when everything is done.



<a name="ref.slowTyping"></a>
### .slowTyping( str , [options] , callback )

* str `string` the text to display
* options `object` of options, where:
	* style `function` the style of text, default to `term.green`
	* flashStyle `function` or `falsy` if a `function` is given, then this is the style of the text for the flash effect,
		if `falsy` then the flash effect is turn off, default to `term.bold.brightGreen`
	* delay `number` average delay before printing the next char, default to 150 ms
	* flashDelay `number` fixed delay before the `flashStyle` of the last printed char is replaced by the regular `style`,
		default to 100 ms
* callback `function` that will be called on completion

It outputs some text with an old-fashioned slow-typing effect.

Example:

```js
var term = require( 'terminal-kit' ).terminal ;

term.slowTyping(
	'What a wonderful world!\n' ,
	{ flashStyle: term.brightWhite } ,
	function() { process.exit() ; }
) ;
```

It produces:

![Slow typing output](https://raw.githubusercontent.com/cronvel/terminal-kit/master/sample/slow-typing-doc1.gif)


