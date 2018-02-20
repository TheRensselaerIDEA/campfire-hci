// Author 'Tommy Fang'
// RPI Campfire HCI Project
'use strict';

const electron = require('electron');
const robot = require('robotjs');
var mouse = require('win-mouse')();

// Parameters: An electron.screen object
// Output: Enable mouse event listener and carry out functions based on user mouse positions (x,y).
module.exports = function(electronScreen) {

	//MouseController object stores all code related to mouse utilities.
var mouseController = {
    //Initialize screen variables with electron.
    setScreens: function(screen)
    {
      this.wallScreen = null;
      this.floorScreen = null;
      var allScreens = screen.getAllDisplays();
      var main = screen.getPrimaryDisplay();
      console.log("PRIMARY");
      // TV["id"] = 2779098405
      //main monitor id = 2528732444
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
    /*  console.log(this.wallScreen);
      console.log(this.floorScreen);
    */  //There is a mapping from f(f_x,f_y) -> w_x,w_y
      //where f(f_x,f_y) is a function applied to the coordinates of the floor screen
      //and the output is a corresponding point on the wall screen.

      var lastX = 0, lastY = 0;
      mouse.on('move', function(xPos, yPos) 
      {
        //Get direction of mouse
        var hDir, vDir = "NULL";
        //check dx (change in x) and dy (change in y) positions.
        hDir = lastX < xPos ? "right" : "left";
        vDir = lastY < yPos ? "down" : "up";

        vDir = lastY - yPos == 0 ?  vDir = "null" : vDir;
        hDir = lastX - xPos == 0 ?  hDir = "null" : hDir;

        console.log(lastX +','+lastY)
        lastX = xPos;
        lastY = yPos;
      }
      );
    }
  }
	//TODO: process screen dimensions
	mouseController.init(electronScreen);
}