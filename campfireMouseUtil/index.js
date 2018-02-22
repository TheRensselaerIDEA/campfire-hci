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

var mouseController = 
{
    //Initialize screen variables with electron.
    setScreens: function(screen)
    {
      this.wallScreen = null;
      this.floorScreen = null;
      var allScreens = screen.getAllDisplays();
      var main = screen.getPrimaryDisplay();
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

    rotateMouse: function()
    {
      this.wallSize = this.wallScreen.size;
      var w = this.wallSize.width/2;
      var h = (this.wallSize.height/2);
      var twoPI = Math.PI * 2;
      var x = 0, y = 0;
      var radius = 1000;

      //Moves mouse in a circle
      for (var a = 0; a < twoPI; a+=0.1)
      {
        y = h + radius * Math.sin(a);
        x = w + radius * Math.cos(a);
        robot.moveMouse(x, y);
        console.log("ROBOT MOVING:" + x + "," + y);
      }
    },
    listen: function()
    {
        var wall = this.wallScreen,
            floor = this.floorScreen;

        var mPos = robot.getMousePos();
        var lastX = mPos.x, lastY = mPos.y;
        //determines if the mouse cursor is within the boundaries of the floor, else we are on the wall.
        //These functions are created in local scope to be used by the event listener.
        var onFloor = function(x,y, floor)
        {
          var fb = floor.bounds;

          if ((x <= fb.x + fb.width && x >= fb.x) && 
             (y <= fb.y + fb.height && y >= fb.y))
          {
            return true;
          }
          return false;
        }
        //Checks change between last position(lx, ly) current position(x,y)
        //
        var getDir = function(x, y, lx, ly)
        {
          var hDir, vDir;

          hDir = lx < x ? "right" : "left";
          vDir = ly < y ? "down" : "up";

          vDir = ly - y == 0 ?  vDir = "null" : vDir;
          hDir = lx - x == 0 ?  hDir = "null" : hDir;
          return [hDir, vDir];
        }

        
        //There is a mapping from f(f_x,f_y) -> w_x,w_y
        //where f(f_x,f_y) is a function applied to the coordinates of the floor screen
        //and the output is a corresponding point on the wall  screen.

        mouse.on('move', function(xPos, yPos) 
        {
          var dir = getDir(xPos, yPos, lastX, lastY)
          lastX = xPos;
          lastY = yPos;

          var isOnFloor = onFloor(xPos, yPos, floor);

          //DEBUGGING!!!
          debug = "Mouse movement\n";
          for (var i = 0; i < dir.length; i++)
          {
            if (dir[i] != "null")
            {
              debug += dir[i] + " "
            }
          }
          debug += "\nOnFloor = " + isOnFloor
          debug += "\n(LastX, LastY): " + "(" + lastX + "," + lastY + ")";
          debug += "\n(Mx, My): " + "(" + xPos + "," + yPos + ")";
          console.log(debug);

/*          if (xPos <= 1 && hDir == "left")
          {
            console.log("Condition met");
            robot.moveMouse(wall.bounds.x, wall.bounds.y);
          }
*/
        }
        );
    },
    init: function(screen)
    {
      this.screens = this.setScreens(screen);
      this.listen();
     // this.rotateMouse();
    }
}
	//TODO: process screen dimensions
mouseController.init(electronScreen);
	
	
}