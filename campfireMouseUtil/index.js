// Author 'Tommy Fang'
// RPI Campfire HCI Project
'use strict';

const electron = require('electron');
const robot = require('robotjs');
var mouse = require('win-mouse')();

module.exports = function(electronScreen) {
	//initialize screen variables by copying from source electron app
	var screen = electronScreen;
	//TODO: process screen dimensions

	function init()
	{
		mouse.on('move', function(xPos, yPos) {

			//There is a mapping from f(f_x,f_y) -> w_x,w_y
			//where f(f_x,f_y) is a function applied to the coordinates of the floor screen
			//and the output is a corresponding point on the wall screen.
			console.log(xPos, yPos);
	});
	}

	init();


}