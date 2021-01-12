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



// Characters that are hard to type
// Comments explain how to type it on a linux platform, using a fr layout keyboard

const BIT_DOTS = "⠀⠁⠂⠃⠄⠅⠆⠇⡀⡁⡂⡃⡄⡅⡆⡇⠈⠉⠊⠋⠌⠍⠎⠏⡈⡉⡊⡋⡌⡍⡎⡏⠐⠑⠒⠓⠔⠕⠖⠗⡐⡑⡒⡓⡔⡕⡖⡗⠘⠙⠚⠛⠜⠝⠞⠟⡘⡙⡚⡛⡜⡝⡞⡟⠠⠡⠢⠣⠤⠥⠦⠧⡠⡡⡢⡣⡤⡥⡦⡧⠨⠩⠪⠫⠬⠭⠮⠯⡨⡩⡪⡫⡬⡭⡮⡯⠰⠱⠲⠳⠴⠵⠶⠷⡰⡱⡲⡳⡴⡵⡶⡷⠸⠹⠺⠻⠼⠽⠾⠿⡸⡹⡺⡻⡼⡽⡾⡿⢀⢁⢂⢃⢄⢅⢆⢇⣀⣁⣂⣃⣄⣅⣆⣇⢈⢉⢊⢋⢌⢍⢎⢏⣈⣉⣊⣋⣌⣍⣎⣏⢐⢑⢒⢓⢔⢕⢖⢗⣐⣑⣒⣓⣔⣕⣖⣗⢘⢙⢚⢛⢜⢝⢞⢟⣘⣙⣚⣛⣜⣝⣞⣟⢠⢡⢢⢣⢤⢥⢦⢧⣠⣡⣢⣣⣤⣥⣦⣧⢨⢩⢪⢫⢬⢭⢮⢯⣨⣩⣪⣫⣬⣭⣮⣯⢰⢱⢲⢳⢴⢵⢶⢷⣰⣱⣲⣳⣴⣵⣶⣷⢸⢹⢺⢻⢼⢽⢾⢿⣸⣹⣺⣻⣼⣽⣾⣿".split( '' ) ;
const GROWING_BLOCK =   [ ' ' , '▁' , '▂' , '▃' , '▄' , '▅' , '▆' , '▇' , '█' ] ;
const ENLARGING_BLOCK = [ ' ' , '▏' , '▎' , '▍' , '▌' , '▋' , '▊' , '▉' , '█' ] ;



module.exports = {
	password: '●' ,		// Currently: the same as blackCircle

	forwardSingleQuote: '´' ,	// Altgr + ,
	overscore: '¯' ,	// Altgr + Shift + $
	multiply: '×' ,		// Altgr + Shift + ;
	divide: '÷' ,		// Altgr + Shift + :

	// Arrows
	up: '↑' ,			// Altgr + Shift + u
	down: '↓' ,			// Altgr + u
	left: '←' ,			// Altgr + y
	right: '→' ,		// Altgr + i
	leftAndRight: '↔' ,
	upAndDown: '↕' ,
	upLeft: '↖' ,
	upRight: '↗' ,
	downRight: '↘' ,
	downLeft: '↙' ,
	upLeftAndDownRight: '⤡' ,
	upRightAndDownLeft: '⤢' ,

	// Those names are most common in the UTF-8 parlance
	northWest: '↖' ,
	northEast: '↗' ,
	southEast: '↘' ,
	southWest: '↙' ,
	northWestAndSouthEast: '⤡' ,
	northEastAndSouthWest: '⤢' ,

	fullBlock: '█' ,
	upperHalfBlock: '▀' ,
	lowerHalfBlock: '▄' ,

	// Array of 0-8 growing/enlarging blocks
	growingBlock: GROWING_BLOCK ,
	enlargingBlock: ENLARGING_BLOCK ,

	bitDots: BIT_DOTS ,

	// When editing this, update spChars.md doc
	bar: {
		classic: {
			border: [ '[' , ']' ] ,
			body: [ '=' , ' ' ]
		} ,
		classicWithArrow: {
			border: [ '[' , ']' ] ,
			body: [ '=' , '>' , ' ' ]
		} ,
		classicWithHalf: {
			border: [ '[' , ']' ] ,
			body: [ '=' , ' ' , '-' , '=' , ' ' ]
		} ,
		solid: {
			border: [ '^!▉' , '▏' ] ,
			body: [ '█' , ... ENLARGING_BLOCK , ' ' ]
		}
	} ,

	// When editing this, update spChars.md doc
	box: {
		plain: {
			vertical: '█' ,
			horizontal: '█' ,
			topLeft: '█' ,
			topRight: '█' ,
			bottomLeft: '█' ,
			bottomRight: '█' ,
			topTee: '█' ,
			bottomTee: '█' ,
			leftTee: '█' ,
			rightTee: '█' ,
			cross: '█'
		} ,
		empty: {
			vertical: ' ' ,
			horizontal: ' ' ,
			topLeft: ' ' ,
			topRight: ' ' ,
			bottomLeft: ' ' ,
			bottomRight: ' ' ,
			topTee: ' ' ,
			bottomTee: ' ' ,
			leftTee: ' ' ,
			rightTee: ' ' ,
			cross: ' '
		} ,
		ascii: {
			vertical: '|' ,
			horizontal: '-' ,
			topLeft: '|' ,
			topRight: '|' ,
			bottomLeft: '|' ,
			bottomRight: '|' ,
			topTee: '-' ,
			bottomTee: '-' ,
			leftTee: '|' ,
			rightTee: '|' ,
			cross: '+'
		} ,
		light: {
			vertical: '│' ,
			horizontal: '─' ,
			topLeft: '┌' ,
			topRight: '┐' ,
			bottomLeft: '└' ,
			bottomRight: '┘' ,
			topTee: '┬' ,
			bottomTee: '┴' ,
			leftTee: '├' ,
			rightTee: '┤' ,
			cross: '┼'
		} ,
		lightRounded: {
			vertical: '│' ,
			horizontal: '─' ,
			topLeft: '╭' ,
			topRight: '╮' ,
			bottomLeft: '╰' ,
			bottomRight: '╯' ,
			topTee: '┬' ,
			bottomTee: '┴' ,
			leftTee: '├' ,
			rightTee: '┤' ,
			cross: '┼'
		} ,
		heavy: {
			vertical: '┃' ,
			horizontal: '━' ,
			topLeft: '┏' ,
			topRight: '┓' ,
			bottomLeft: '┗' ,
			bottomRight: '┛' ,
			topTee: '┳' ,
			bottomTee: '┻' ,
			leftTee: '┣' ,
			rightTee: '┫' ,
			cross: '╋'
		} ,
		double: {
			vertical: '║' ,
			horizontal: '═' ,
			topLeft: '╔' ,
			topRight: '╗' ,
			bottomLeft: '╚' ,
			bottomRight: '╝' ,
			topTee: '╦' ,
			bottomTee: '╩' ,
			leftTee: '╠' ,
			rightTee: '╣' ,
			cross: '╬'
		} ,
		dotted: {
			vertical: '┊' ,
			horizontal: '┄' ,
			topLeft: '┌' ,
			topRight: '┐' ,
			bottomLeft: '└' ,
			bottomRight: '┘' ,
			topTee: '┬' ,
			bottomTee: '┴' ,
			leftTee: '├' ,
			rightTee: '┤' ,
			cross: '┼'
		}
	} ,

	// When editing this, update spChars.md doc
	animation: {
		asciiSpinner: [ '│' , '/' , '-' , '\\' ] ,
		lineSpinner: [ '│' , '/' , '─' , '\\' ] ,
		dotSpinner: [
			BIT_DOTS[ 7 ] ,
			BIT_DOTS[ 19 ] ,
			BIT_DOTS[ 49 ] ,
			BIT_DOTS[ 112 ] ,
			BIT_DOTS[ 224 ] ,
			BIT_DOTS[ 200 ] ,
			BIT_DOTS[ 140 ] ,
			BIT_DOTS[ 14 ]
		] ,
		bitDots: BIT_DOTS ,
		impulse: [
			"∙∙∙" ,
			"●∙∙" ,
			"∙●∙" ,
			"∙∙●" ,
			"∙●∙" ,
			"●∙∙" ,
			"∙∙∙" ,
			"∙∙∙"
		] ,
		unboxing: [ ' ' , '▁' , '▂' , '▃' , '▄' , '▅' , '▆' , '▇' , '█' , '▉' , '▊' , '▋' , '▌' , '▍' , '▎' , '▏' ] ,
		'unboxing-color': [
			'^r^#^b ' , '^r^#^b▁' , '^r^#^b▂' , '^r^#^b▃' , '^r^#^b▄' , '^r^#^b▅' , '^r^#^b▆' , '^r^#^b▇' , '^r^#^m█' , '^r^#^m▉' , '^r^#^m▊' , '^r^#^m▋' , '^r^#^m▌' , '^r^#^m▍' , '^r^#^m▎' , '^r^#^m▏' ,
			'^m^#^y█' , '^m^#^y▇' , '^m^#^y▆' , '^m^#^y▅' , '^m^#^y▄' , '^m^#^y▃' , '^m^#^y▂' , '^m^#^y▁' , '^b^#^y ' , '^b^#^y▏' , '^b^#^y▎' , '^b^#^y▍' , '^b^#^y▌' , '^b^#^y▋' , '^b^#^y▊' , '^b^#^y▉'
		]
	} ,

	blackSquare: '■' ,
	whiteSquare: '□' ,
	blackCircle: '●' ,
	whiteCircle: '○' ,
	blackUpTriangle: '▲' ,
	whiteUpTriangle: '△' ,
	blackDownTriangle: '▼' ,
	whiteDownTriangle: '▽' ,
	blackLeftTriangle: '◀' ,
	whiteLeftTriangle: '◁' ,
	blackRightTriangle: '▶' ,
	whiteRightTriangle: '▷' ,
	blackDiamond: '◆' ,
	whiteDiamond: '◇' ,
	blackStar: '★' ,
	whiteStar: '☆' ,
	spadeSuit: '♠' ,
	heartSuit: '♥' ,
	diamondSuit: '♦' ,
	clubSuit: '♣' ,

	// Powerline specific characters (https://powerline.readthedocs.io)
	// It is displayed only with the appropriate font
	powerline: {
		branch: '' ,
		line: '' ,
		readOnly: '' ,
		rightTriangleSeparator: '' ,
		rightArrowSeparator: '' ,
		leftTriangleSeparator: '' ,
		leftArrowSeparator: ''
	}
} ;

