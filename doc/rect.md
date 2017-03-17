

## Rect

The `Rect` instances are structures defining a rectangular portion.

They have read-only properties:
* xmin `integer` the minimum x-coordinate of the rectangle
* xmax `integer` the maximum x-coordinate of the rectangle (included)
* ymin `integer` the minimum y-coordinate of the rectangle
* ymax `integer` the maximum y-coordinate of the rectangle (included)
* width `integer` the width of the rectangle
* height `integer` the height of the rectangle
* isNull `boolean` true if the rectangle is considered *null*



### Rect.create()

This creates a `Rect` instance.
This constructor accept three argument signatures.



#### Rect.create( xmin , xmax , ymin , ymax )

* xmin `integer` the minimum x-coordinate of the rectangle
* xmax `integer` the maximum x-coordinate of the rectangle (included)
* ymin `integer` the minimum y-coordinate of the rectangle
* ymax `integer` the maximum y-coordinate of the rectangle (included)



#### Rect.create( src )

* src: either a terminal



#### Rect.create( obj )

* obj `Object` where:
    * xmin `integer` the minimum x-coordinate of the rectangle
    * xmax `integer` the maximum x-coordinate of the rectangle (included)
    * ymin `integer` the minimum y-coordinate of the rectangle
    * ymax `integer` the maximum y-coordinate of the rectangle (included)

