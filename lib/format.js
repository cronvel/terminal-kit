
// Mini formater

/*
	Candidate format:
	%c	for char? (can receive a string or an integer translated into an UTF8 chars)
	%C	for currency formating?
	%O	for object? (using JSON.stringify() ?)
	%B	for Buffer objects?
	%e	for scientific notation?
*/

function format( str )
{
	if ( typeof str !== 'string' )
	{
		if ( str === null || str === undefined ) { return '' ; }
		else if ( /*str && typeof str === 'object' && */ typeof str.toString === 'function' ) { str = str.toString() ; }
		else { return '' ; }
	}
	
	var arg , autoIndex = 1 , args = arguments , length = arguments.length , self = this ;
	
	//console.log( 'format args:' , arguments ) ;
	
	// /!\ each changes here should be reported on format.count() too /!\
	str = str.replace( /%([+-]?)([0-9]*)(([a-zA-Z%])|\[([a-zA-Z0-9_]+)(:([^\]]*))?\])/g ,
		function( match , relative , index , trash , mode , fn , trash2 , argString ) {
		
			//console.log( 'replaceArgs:' , arguments , 'MATCH:' , match ) ;
			if ( mode === '%' ) { return '%'; }
			
			if ( fn )
			{
				var i , argMatches , argList = [] ;
				
				if ( argString && ( argMatches = argString.match( /%([+-]?)([0-9]*)[a-zA-Z]/g ) ) )
				{
					//console.log( argMatches ) ;
					//console.log( argString ) ;
					for ( i = 0 ; i < argMatches.length ; i ++ )
					{
						relative = argMatches[ i ][ 1 ] ;
						index = argMatches[ i ][ 2 ] ;
						
						if ( index )
						{
							index = parseInt( index ) ;
							
							if ( relative )
							{
								if ( relative === '+' ) { index = autoIndex + index ; }
								else if ( relative === '-' ) { index = autoIndex - index ; }
							}
						}
						else
						{
							index = autoIndex ;
						}
						
						autoIndex ++ ;
						
						if ( index >= length || index < 1 ) { argList[ i ] = undefined ; }
						else { argList[ i ] = args[ index ] ; }
					}
				}
				
				//console.log( '~F~' ) ;
				if ( typeof self[ fn ] !== 'function' ) { return '' ; }
				return self[ fn ].apply( self , argList ) ;
			}
			
			if ( index )
			{
				index = parseInt( index ) ;
				
				if ( relative )
				{
					if ( relative === '+' ) { index = autoIndex + index ; }
					else if ( relative === '-' ) { index = autoIndex - index ; }
				}
			}
			else
			{
				index = autoIndex ;
			}
			
			autoIndex ++ ;
			
			if ( index >= length || index < 1 ) { return '' ; }
			
			arg = args[ index ] ;
			
			switch ( mode )
			{
				case 's' :	// string
					if ( arg === null || arg === undefined ) { return '' ; }
					if ( typeof arg === 'string' ) { return arg ; }
					if ( typeof arg === 'number' ) { return '' + arg ; }
					if ( typeof arg.toString === 'function' ) { return arg.toString() ; }
					return '' ;
				case 'f' :	// float
					if ( typeof arg === 'number' ) { return '' + arg ; }
					return 0 ;
				case 'd' :
				case 'i' :	// integer decimal
					if ( typeof arg === 'number' ) { return '' + Math.floor( arg ) ; }
					return 0 ;
				case 'u' :	// unsigned decimal
					if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 0 ) ; }
					return 0 ;
				case 'U' :	// unsigned positive decimal
					if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 1 ) ; }
					return 1 ;
				case 'x' :
				case 'h' :	// unsigned hexadecimal
					if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 0 ).toString( 16 ) ; }
					return 0 ;
				case 'o' :	// unsigned hexadecimal
					if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 0 ).toString( 8 ) ; }
					return 0 ;
				case 'b' :	// unsigned binary
					if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 0 ).toString( 2 ) ; }
					return 0 ;
				case 'D' :	// drop: do nothing but increment auto-index anyway
				default :
					return '' ;
			}
	} ) ;
	
	for ( ; autoIndex < length ; autoIndex ++ )
	{
		arg = args[ autoIndex ] ;
		if ( arg === null || arg === undefined ) { continue ; }
		else if ( typeof arg === 'string' ) { str += arg ; }
		else if ( typeof arg === 'number' ) { str += arg ; }
		else if ( typeof arg.toString === 'function' ) { str += arg.toString() ; }
	}
	
	return str ;
}



// Count the number of parameters needed for this string
format.count = function count( str )
{
	if ( typeof str !== 'string' ) { return 0 ; }
	
	// This regex differs slightly from the main regex: we do not count '%%' and '%['
	var matches = str.match( /%[+-]?[0-9]*[a-zA-Z]/g ) ;
	if ( ! matches ) { return 0 ; }
	else { return matches.length ; }
} ;



module.exports = format ;


