
// Mini formater

function format( str )
{
	if ( typeof str !== 'string' )
	{
		if ( str && typeof str === 'object' && typeof str.toString === 'function' ) { str = str.toString() ; }
		else { return '' ; }
	}
	
	var arg , index = 1 , length = arguments.length ;
	
	str = str.replace( /%[siuUd%]/g , function( match ) {
		
		if ( match === '%%' ) { return '%'; }
		
		if ( index >= length ) { return '' ; }
		arg = arguments[ index ] ;
		index ++ ;
		
		switch ( match )
		{
			case '%s':
				if ( typeof arg === 'string' ) { return arg ; }
				if ( typeof arg === 'number' ) { return '' + arg ; }
				if ( typeof arg.toString === 'function' ) { return arg.toString() ; }
				return '' ;
			case '%d':
				if ( typeof arg === 'number' ) { return '' + arg ; }
				return 0 ;
			case '%i':
				if ( typeof arg === 'number' ) { return '' + Math.floor( arg ) ; }
				return 0 ;
			case '%u':
				if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 0 ) ; }
				return 0 ;
			case '%U':
				if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 1 ) ; }
				return 1 ;
		}
	} ) ;
	
	for ( ; index < length ; index ++ )
	{
		arg = arguments[ index ] ;
		if ( typeof arg === 'string' ) { str += arg ; }
		if ( typeof arg === 'number' ) { str += arg ; }
		if ( typeof arg.toString === 'function' ) { str += arg.toString() ; }
	}
	
	return str;
}



module.exports = format ;


