
To do that, ScreenBuffer need to support a sort of indexed chars.

Unicode greatest code points is 1FFFFF, so it never use the highest byte of an UInt32.
That byte could be used to store some flags.
A flag could be used to tell that the cell contains multiple combined chars (like diacritics).

If so, the lowest 24 bits would not be a code point, but an index to a globally shared lookup table containing
the one cell string for that index.

To do so, .readChar() and .writeChar() should be replaced.

Loader/saver should be rewritten.
When saving, the lookup table should be saved as well into the JSON header.

Also string-kit should be updated, new methods like .unicode.toComboArray() should be created.

