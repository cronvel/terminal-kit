#!/usr/bin/env node

var term = require( '../lib/termkit' ).terminal ;

term.grabInput( { mouse: 'motion', focus: true } ) ;

term.on( 'mouse' , function( name , data ) {} ) ;

setTimeout( function() { throw new Error( 'crash!' ) ; } , 10 )  ;

