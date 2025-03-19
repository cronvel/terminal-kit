<a name="top"></a>
<a name="ref.Layout"></a>
## Layout

A *Layout* is a responsive container widget that divides the available space into rows and columns, creating nested containers.
It's useful for creating complex user interfaces with multiple panels. The layout is fully responsive and will adjust when the terminal is resized.

Each box in the layout is an independent container that can hold other widgets. Boxes can be created with fixed sizes, percentage-based sizes, or automatic sizing.

<a name="ref.Layout.toc"></a>
## Table of Contents

* [Events](#ref.Layout.event)
	* [parentResize](#ref.Layout.event.parentResize)

* Constructor:
	* [new Layout()](#ref.Layout.new)

* Methods:
	* [.computeBoundingBoxes()](#ref.Layout.computeBoundingBoxes)
	* [.onParentResize()](#ref.Layout.onParentResize)

* Inherit methods and properties from [Element](Element.md#ref.Element.toc)

<a name="ref.Layout.event"></a>
### Events

<a name="ref.Layout.event.parentResize"></a>
#### *parentResize*

This event is triggered when the parent container is resized, allowing the layout to recalculate its boxes.

<a name="ref.Layout.new"></a>
### new Layout( options )

* options `Object`, where:
	* *all [the base class Element constructor's](Element.md#ref.Element.new) options*
	* layout `Object` defining the layout structure with the following properties:
		* id `string` the identifier for this layout box
		* x, y `number` (optional) the offset from the parent container
		* width, height `number` (optional) fixed size in cells
		* widthPercent, heightPercent `number` (optional) size as a percentage of the parent container
		* rows `Array` (optional) an array of row definitions
		* columns `Array` (optional) an array of column definitions
	* boxChars `string` or `Object` the box drawing characters to use, can be 'light' (default) or 'double', or a custom object

This creates a *Layout element* with nested containers.

<a name="ref.Layout.computeBoundingBoxes"></a>
### .computeBoundingBoxes()

Recalculates the size and position of all layout boxes based on the current terminal size and layout definition.
This is called automatically when the layout is created and when the terminal is resized.

<a name="ref.Layout.onParentResize"></a>
### .onParentResize()

Handler for the parentResize event. Recalculates bounding boxes when the parent container is resized.

## Example

```javascript
var layout = new termkit.Layout({
    parent: document,
    boxChars: 'double',
    layout: {
        id: 'main',
        widthPercent: 100,
        heightPercent: 80,
        rows: [
            {
                id: 'top-row',
                heightPercent: 75,
                columns: [
                    { id: 'left-panel', widthPercent: 33 },
                    { id: 'middle-panel' }, // auto width
                    { id: 'right-panel', width: 30 } // fixed width
                ]
            },
            {
                id: 'bottom-row',
                columns: [
                    { id: 'bottom-left', width: 20 },
                    { id: 'bottom-right' } // auto width
                ]
            }
        ]
    }
});

// Add widgets to containers
new termkit.Text({
    parent: document.elements['left-panel'],
    content: 'Left panel content'
});
```