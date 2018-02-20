// Author 'Tommy Fang'
// RPI Campfire HCI Project
'use strict';

const electron = require('electron');
const robot = require('robotjs');
var mouse = require('win-mouse')();

module.exports = function(electronScreen) {
	//initialize screen variables by copying from source electron app
	var mouseController = {
		setScreens: function(screen)
		{
			this.wallScreen = null;
			this.floorScreen = null;
			var allScreens = screen.getAllDisplays();
		  // Wider screen should be the "Wall"
		  if (allScreens[0].size.width > allScreens[1].size.width)
		  {
		  	this.wallScreen = allScreens[0];
		    this.floorScreen = allScreens[1];
		  } 
		  else 
		  {
		    this.floorScreen = allScreens[0];
		    this.wallScreen = allScreens[1];
		  }
		},
		init: function(screen)
		{
			this.setScreens(screen);
			console.log(this.wallScreen);
			console.log(this.floorScreen);
			
			//There is a mapping from f(f_x,f_y) -> w_x,w_y
			//where f(f_x,f_y) is a function applied to the coordinates of the floor screen
			//and the output is a corresponding point on the wall screen.
			mouse.on('move', function(xPos, yPos) {
					//console.log(xPos, yPos);
				}
			);
		}
	}
	//TODO: process screen dimensions
	mouseController.init(electronScreen);
}