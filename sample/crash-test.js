#!/usr/bin/env node

"use strict" ;

var term = require( '../lib/termkit' ).terminal ;

term.grabInput( { mouse: 'motion', focus: true } ) ;

term.on( 'mouse' , function() {} ) ;

setTimeout( function() { throw new Error( 'crash!' ) ; } , 10 )  ;

