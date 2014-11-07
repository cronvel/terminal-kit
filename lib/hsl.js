/*
	RGB <-> HSL convertor, adaptated from Garry Tan code, found here:
	http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
*/


/*
	Converts an RGB color value to HSL.
	Conversion formula adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	Assumes r, g, and b are contained in the set [0, 255] and returns h, s, and l in the set [0, 1].
	
	rgbToHsl( r , g , b )
	rgbToHsl( rgb )
*/

exports.rgbToHsl = function rgbToHsl( r , g , b )
{
	if ( typeof r === 'object' )
	{
		b = r.b ;
		g = r.g ;
		r = r.r ;
	}
	
	r /= 255 ;
	g /= 255 ;
	b /= 255 ;
	
	var max = Math.max( r , g , b ) ;
	var min = Math.min( r , g , b ) ;
	var hsl = {} ;
	
	hsl.l = ( max + min ) / 2 ;
	
	if ( max === min )
	{
		hsl.h = hsl.s = 0 ; // achromatic
	}
	else
	{
		var diff = max - min ;
		hsl.s = hsl.l > 0.5 ? diff / ( 2 - max - min ) : diff / ( max + min ) ;
		
		switch( max )
		{
			case r :
				hsl.h = ( g - b ) / diff + ( g < b ? 6 : 0 ) ;
				break ;
			case g :
				hsl.h = ( b - r ) / diff + 2 ;
				break ;
			case b :
				hsl.h = ( r - g ) / diff + 4 ;
				break ;
		}
		
		hsl.h /= 6 ;
	}
	
	return hsl ;
} ;



exports.hslToRgb = function hslToRgb( h , s , l )
{
	
	var r, g, b;
	
	if(s == 0)
	{
		r = g = b = l; // achromatic
	}
	else
	{
		function hue2rgb(p, q, t)
		{
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}
		
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}
	
	return [r * 255, g * 255, b * 255];
} ;

