

<a name="top"></a>
<a name="ref.document"></a>
## The Document Model

[!unstable](unstable.png)

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

* [Document](#ref.Document)
	* [new Document()](#ref.Document.new)



<a name="ref.Document"></a>
## Document

TODO



<a name="ref.Document"></a>
### new Document( options )

* options `Object`, where:
	* outputX, outputY, outputWidth, outputHeight `integer` (optional) the position and size of the document
	  with respect to the screen

Instead of using `new termkit.Document()`, it's recommended to use `term.createDocument()`.

TODO

