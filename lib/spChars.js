/*
	Terminal Kit
	
	Copyright (c) 2009 - 2016 Cédric Ronvel
	
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

module.exports = {
	password: '●' ,		// Currently: the same as blackCircle
	forwardSingleQuote: '´' ,	// Altgr + ,
	overscore: '¯' ,	// Altgr + Shift + $
	multiply: '×' ,		// Altgr + Shift + ;
	divide: '÷' ,		// Altgr + Shift + :
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
	box: {
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
		} ,
	}
} ;

