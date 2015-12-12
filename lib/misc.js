/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
	Copyright (c) 2009 - 2015 Cédric Ronvel 
	
	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/



var misc = {} ;
module.exports = misc ;



// Color name to index
misc.color2index = function color2index( color )
{
	switch ( color.toLowerCase() )
	{
		case 'black' : return 0 ;
		case 'red' : return 1 ;
		case 'green' : return 2 ;
		case 'yellow' : return 3 ;
		case 'blue' : return 4 ;
		case 'magenta' : return 5 ;
		case 'cyan' : return 6 ;
		case 'white' : return 7 ;
		case 'brightblack' : return 8 ;
		case 'brightred' : return 9 ;
		case 'brightgreen' : return 10 ;
		case 'brightyellow' : return 11 ;
		case 'brightblue' : return 12 ;
		case 'brightmagenta' : return 13 ;
		case 'brightcyan' : return 14 ;
		case 'brightwhite' : return 15 ;
		default : return undefined ;
	}
} ;



