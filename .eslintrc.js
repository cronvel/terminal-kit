module.exports = {
	'root': true ,
	'env': {
		'browser': true ,
		'es6': true ,
		'node': true
	} ,
	'parserOptions': {
		'ecmaVersion': 2020
	} ,
	'extends': [ 'eslint:recommended' ] ,
	'rules': {
		
		/*
			Bad code -- detect anything that can be broken or lead to bugs
		*/
		
		
		
		'strict': [ 'error' , 'global' ] ,
		'unicode-bom': [ 'error' , 'never' ] ,
		'radix': 'error' ,
		'eqeqeq': 'error' ,
		'consistent-return': 'off' ,
		'valid-typeof': 'error' ,
		'no-unneeded-ternary': 'error' ,
		'no-unused-vars': 'warn' ,	// During development phase, it's boring to clean unused var since they can be used later
		'no-lonely-if': 'error' ,
		'no-nested-ternary': 'off' ,	// Now I use the streamlined ternary operator a lot
		'no-shadow': 'warn' ,
		'no-shadow-restricted-names': 'error' ,
		'require-atomic-updates': 'off' ,	// check for possible race condition on assignment, interesting but too nitpicky
		
		
		
		/*
			Code preferences
		*/
		
		
		
		'prefer-arrow-callback': 'error' ,
		'prefer-spread': 'warn' ,
		'prefer-rest-params': 'warn' ,
		'no-control-regex': 'off' ,	// because thing like \x00 are considered like a control even if escaped...
		'no-fallthrough': 'off' ,
		'no-empty': [ 'error' , {
			'allowEmptyCatch': true
		} ] ,
		
		
		
		/*
			Coding styles -- cosmetic rules and opinionated preferences
		*/
		
		
		
		// Indent & spaces (general)
		'indent': [ 'error' , 'tab' , {
			'SwitchCase': 1 ,
			'MemberExpression': 1 ,
			'flatTernaryExpressions': true
		} ] ,
		'newline-per-chained-call': [ 'error', {
			'ignoreChainWithDepth': 2 
		} ] ,
		'no-multi-spaces': 'off' ,
		'block-spacing': 'error' ,
		'comma-spacing': [ 'error' , {
			'before': true ,
			'after': true
		} ] ,
		'no-whitespace-before-property': 'error' ,
		'space-before-blocks': 'error' ,
		'space-before-function-paren': [ 'error' , {
			'anonymous': 'never',
			'named': 'never',
			'asyncArrow': 'always'
		} ] ,
		'space-infix-ops': 'error' ,
		'space-unary-ops': [ 'error' , {
			'words': true ,
			'nonwords': true ,
			'overrides': {
				'-': false ,
			}
		} ] ,
		'space-in-parens': [ 'error' , 'always' , {
			'exceptions': [ 'empty' ]
		} ] ,
		'no-trailing-spaces': 'error' ,
		'switch-colon-spacing': [ 'error' , {
			'after': true ,
			'before': true
		} ] ,
		'arrow-spacing': 'error' ,
		'rest-spread-spacing': [ 'error' , 'always' ] ,
		/* Troublesome with commented line of code
		'spaced-comment': [ 'error' , 'always' , {
			'line': {
				'markers': [ '/' ],
				'exceptions': [ '-', '*', '/' ]
			} ,
			'block': {
				'exceptions': [ '*' ] ,
				'balanced': true
			}
		} ] ,
		*/
		
		
		// Semi-colon
		'semi': [ 'error' , 'always' ] ,
		'semi-style': [ 'error' , 'last' ] ,
		'semi-spacing': [ 'error' , {
			'before': true ,
			'after': true
		} ] ,

		// Objects
		'key-spacing': [ 'error' , {
			'beforeColon': false ,
			'afterColon': true ,
			'mode': 'strict'
		} ] ,
		'object-curly-newline': [ 'error' , {
			'ObjectExpression' : {
				'consistent': true ,
				'minProperties': 4
			} ,
			'ObjectPattern' : {
				// object destructuring assigment
				'consistent': true ,
				'minProperties': 8
			}
		} ] ,
		'object-curly-spacing': [ 'error' , 'always' ] ,
		'object-property-newline': [ 'error' , { 'allowMultiplePropertiesPerLine': true } ] ,

		
		// Arrays
		'array-bracket-newline': [ 'error' , 'consistent' ] ,
		//'array-element-newline': [ 'error' , { 'multiline': true , 'minItems': 5 } ] ,
		'array-bracket-spacing': [ 'error' , 'always' ],
		
		'brace-style': [ 'error' , 'stroustrup' , {
			'allowSingleLine': true
		} ] ,
		
		
		// Misc style
		'no-else-return': 'warn' ,
		'comma-dangle': [ 'error' , 'never' ] ,
		'quotes': 'off' ,
		'camelcase': 'warn' ,
		
		
		
		/*
			Method limitation
		*/
		
		
		
		'no-console': 'off'
	}
} ;
