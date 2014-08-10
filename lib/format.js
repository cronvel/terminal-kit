
// Mini formater

function format( str )
{
	if ( typeof str !== 'string' )
	{
		if ( str && typeof str === 'object' && typeof str.toString === 'function' ) { str = str.toString() ; }
		else { return '' ; }
	}
	
	var arg , autoIndex = 1 , args = arguments , length = arguments.length ;
	
	//console.log( 'format args:' , arguments ) ;
	
	//str = str.replace( /%[siuUd%]/g , function( match ) {
	str = str.replace( /%([0-9]*)([siuUd%])/g , function( match , index , mode ) {
		
		//console.log( 'replaceArgs:' , arguments , 'MATCH:' , match ) ;
		if ( mode === '%' ) { return '%'; }
		
		if ( ! index ) { index = autoIndex ; }
		if ( index >= length ) { return '' ; }
		arg = args[ index ] ;
		autoIndex ++ ;
		
		switch ( mode )
		{
			case 's':
				if ( typeof arg === 'string' ) { return arg ; }
				if ( typeof arg === 'number' ) { return '' + arg ; }
				if ( typeof arg.toString === 'function' ) { return arg.toString() ; }
				return '' ;
			case 'd':
				if ( typeof arg === 'number' ) { return '' + arg ; }
				return 0 ;
			case 'i':
				if ( typeof arg === 'number' ) { return '' + Math.floor( arg ) ; }
				return 0 ;
			case 'u':
				if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 0 ) ; }
				return 0 ;
			case 'U':
				if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 1 ) ; }
				return 1 ;
		}
	} ) ;
	
	for ( ; autoIndex < length ; autoIndex ++ )
	{
		arg = args[ autoIndex ] ;
		if ( typeof arg === 'string' ) { str += arg ; }
		if ( typeof arg === 'number' ) { str += arg ; }
		if ( typeof arg.toString === 'function' ) { str += arg.toString() ; }
	}
	
	return str;
}



// Count the number of parameters needed for this string
format.count = function count( str )
{
	if ( typeof str !== 'string' ) { return 0 ; }
	
	// This regex differs slightly from the main regex: we do not count '%%'
	var matches = str.match( /%[0-9]*[siuUd]/g ) ;
	if ( ! matches ) { return 0 ; }
	else { return matches.length ; }
} ;



module.exports = format ;


