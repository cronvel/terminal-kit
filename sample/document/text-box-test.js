#!/usr/bin/env node
/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

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

"use strict" ;



const termkit = require( '../..' ) ;
const term = termkit.terminal ;

term.clear() ;

var text ;
//text = 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.' ;
//text = 'Permission is hereby ^Y^+granted^:, ^C^+free^ of charge, to any person obtaining a copy of this ^/software^ and associated documentation files (the ^/"Software"^:), to deal in the ^/Software^ without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the ^/Software^:, and to permit persons to whom the ^/Software^ is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice ^R^_shall^ be included in all copies or substantial portions of the ^/Software^:.\n\n^+THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.' ;
text = 'Permission is hereby \x1b[31mgranted\x1b[0m, free of \x1b[1;3mcharge\x1b[0m, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.' ;

/*
// Test forbidden splitters
text = '' ;
//      |                             |		<-- column limits
text += 'Permission  is  hereby granted ! free of charge\n' ;
text += 'Permission is  hereby granted ! free of charge\n' ;	// forbidden splitter just after the split
//      |                             |
text += 'Permission is hereby granted ! free of charge\n' ;	// forbidden splitter right at the split
text += 'Permission    is    granted ! free of charge\n' ;	// forbidden splitter just before the split
//      |                             |
text += 'Permission   is    granted ! free of charge\n' ;
text += '\n-- 2 spaces --\n\n' ;
//      |                             |
text += 'Permission  is  hereby granted  ! free of charge\n' ;
text += 'Permission is  hereby granted  ! free of charge\n' ;
//      |                             |
text += 'Permission is hereby granted  ! free of charge\n' ;
text += 'Permission    is    granted  ! free of charge\n' ;
//      |                             |
text += 'Permission   is    granted  ! free of charge\n' ;
text += 'Permission   is   granted  ! free of charge\n' ;
text += '\n-- 3 spaces --\n\n' ;
//      |                             |
text += 'Permission  is  hereby granted   ! free of charge\n' ;
text += 'Permission is  hereby granted   ! free of charge\n' ;
//      |                             |
text += 'Permission is hereby granted   ! free of charge\n' ;
text += 'Permission    is    granted   ! free of charge\n' ;
//      |                             |
text += 'Permission   is    granted   ! free of charge\n' ;
text += 'Permission   is   granted   ! free of charge\n' ;
text += 'Permission  is   granted   ! free of charge\n' ;
//*/

var document = term.createDocument( {
	palette: new termkit.Palette()
	//	backgroundAttr: { bgColor: 'magenta' , dim: true } ,
} ) ;

var textBox = new termkit.TextBox( {
	parent: document ,
	content: text ,
	//contentHasMarkup: true ,
	contentHasMarkup: 'ansi' ,
	scrollable: true ,
	vScrollBar: true ,
	//hScrollBar: true ,
	//lineWrap: true ,
	wordWrap: true ,
	x: 10 ,
	y: 2 ,
	width: 30 ,
	height: 15
} ) ;


//setTimeout( () => textBox.setContent( '^RChanged!' , true ) , 1000 ) ;


term.on( 'key' , function( key ) {
	switch( key ) {
		case 'CTRL_C' :
			term.grabInput( false ) ;
			term.hideCursor( false ) ;
			term.styleReset() ;
			term.clear() ;
			process.exit() ;
			break ;
	}
} ) ;

