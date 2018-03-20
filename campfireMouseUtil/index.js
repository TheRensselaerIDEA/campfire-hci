/*
  Author: Tommy Fang
  Date: 3/20/2018
  Advisors: Professors Jim Hendler and John Erickson
  Rensselaer Polytechnic Institute Master's Project Spring 2018
  
  
  Please see attached slides for references on figures which are crucial
  in explaining the logic behind this architecture.
*/
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

      this.floorOffset = 0.75, 
      this.wallOffset = 0.25; 

      var allScreens = screen.getAllDisplays();
      var main = screen.getPrimaryDisplay();
      //console.log(allScreens);
        if (allScreens[0].size.width > allScreens[1].size.width)
        {
          this.wallScreen = allScreens[0];
          this.floorScreen = allScreens[2];
        }
        else
        {
          this.floorScreen = allScreens[0];
          this.wallScreen = allScreens[2];
        }
    },
    rotateMouse: function()
    {
      this.floorSize = this.floorScreen.size;
      var w = this.floorSize.width/2;
      var h = (this.floorSize.height/2);
      var twoPI = Math.PI * 2;
      var x = 0, y = 0;
      var radius = (this.floorSize.height/2)-1;

      //Moves mouse in a circle
      for (var a = 0; a < twoPI; a+=0.1)
      {
        y = h + radius * Math.sin(a);
        x = w + radius * Math.cos(a);
        robot.moveMouse(x, y);
        console.log("ROBOT MOVING:" + x + "," + y + "," + a);
      }
    },
    listen: function()
    {
        var wall = this.wallScreen,
            floor = this.floorScreen;
        var fb = floor.bounds, wb = wall.bounds;
        var mPos = robot.getMousePos();
        var lastX = mPos.x, lastY = mPos.y;
        var usingCampfire = true;
        var borderOffset = 30;
        var onFloor = false;
        //These functions are created in local scope to be used by the event listener.
        //Checks change between last position(lx, ly) current position(x,y)
        var getDir = function(x, y, lx, ly)
        {
          var hDir, vDir;

          hDir = lx < x ? "right" : "left";
          vDir = ly < y ? "down" : "up";

          vDir = ly - y == 0 ?  vDir = "null" : vDir;
          hDir = lx - x == 0 ?  hDir = "null" : hDir;
          return [hDir, vDir];
        }
          //determines if the mouse cursor is within the boundaries of the floor, else we are on the wall.
        var onFloor = function(x,y)
        {
          return ((x <= fb.x + fb.width && x >= fb.x) &&
             (y <= fb.y + fb.height && y >= fb.y));
        }
        //Input: dx: distance between centerx and mousex
        //       dy: distance between centery and mousey

        //Output: 
        var calcTheta = function(dx, dy)
        {
          //degree of angle
          var t = Math.atan2(dy,dx) * 180 / Math.PI;
          if (t < 0) t = 360 + t;
          return t
        }
        var wallListener = function(xPos, yPos, fCx, fCy, fRadius, userOffset, borderOffset)
        {
            //Get position of mouse and convert to percentage of x position to width on wall screen.
            var perc = (xPos - wb.x) / wb.width,
            twoPI = Math.PI * 2,
            //convert to radians, degrees dont return correct values using Math.sin, cos
            //Theta's range = [0, 2pi]
            wallOffset = twoPI * userOffset,
            //2pi * pi/2 = pi
            theta = (perc * twoPI) + wallOffset;
            //Clamp theta to [0, 2pi]
            if (theta > twoPI)
            {
              theta = Math.abs(theta - twoPI);
            }
            //case for reaching vertical border, the mouse should appear on the opposite border.
            //moving right to left
            if (xPos >= wb.x + wb.width)
            {
              robot.moveMouse(wb.x, yPos);
            }
            /*if (xPos <= wb.x)
            {
              robot.moveMouse(wb.x+wb.width-1, yPos);
            }*/
            if (xPos > wb.x && yPos > wb.height-1)
            {
              var newRadius = fRadius - borderOffset;
              var x = fCx + (newRadius * Math.cos(theta));
              var y = fCy + (newRadius * Math.sin(theta));
              robot.moveMouse(x, y);
            }
        }
        var floorListener = function(xPos, yPos, fCx, fCy, fRadius, userOffset, borderOffset)
        {
            var dx = xPos - fCx,
                dy = yPos - fCy,
                theta = calcTheta(dx, dy),
                currentR = Math.sqrt(dx**2 + dy**2);

            //Placeholder for threshold, should check if radius from center to mouse is greater than the screen border
            if (currentR > fRadius)
            {
              /* theta/360 outputs a number between 0,1 this fraction of the total wall screen width 
                determines x value to place on wall screen.
                The y value is easily determined because the 
                mouse will transition from the floor to wall and always appear at the bottom of the wall screen.
              */ 
              var frac = theta/360,
              floorOffset = (wb.x + wb.width) * (userOffset);

              // the fraction of width from the origin: (wb.x + (wb.width * frac))
              //wallOffset is typically 4800 = (3/4) * 6400 if the origin is at 0 degrees
              var x = floorOffset + (wb.x + (wb.width * frac));
              if (x > wb.x + wb.width)
              {
                x -= wb.x + wb.width;
              }
              var y = wb.height - borderOffset;
              robot.moveMouse(x, y);
            }
        }
              //Center of screen is (origin + length) / 2
          var fCx = fb.x + (fb.width)/2,
              fCy = fb.y + (fb.height)/2,
              wCx = wb.x + (wb.width)/2,
              wCy = (wb.y + wb.height)/2,
              //Radius of floor circle, used to determine threshold for transitioning to wall.
              fRadius = (fb.height/2)-1,
              //These two offsets determine an origin angle for both screens.
              //Due to the way the wall screen is oriented on top of the floor screen, these variables are required.
              floorOffset = 0.75, 
              wallOffset = 0.25; 
        // Event Listener: Receives x and y positions of the mouse
        mouse.on('move', function(mouseX, mouseY)
        {
          var lastX = mouseX, lastY = mouseY;
          var isOnFloor = onFloor(mouseX, mouseY, fb);
          //Floor radius from center of floor
          //Wall radius from center of wall
          //current radius from center of current screen
          //Transitioning from floor to wall
          if (isOnFloor)
          {
            floorListener(mouseX, mouseY, fCx, fCy, fRadius, floorOffset, borderOffset);
          }
          //Logic for transitioning from wall to floor
          else if(!isOnFloor)
          {
            wallListener(mouseX, mouseY, fCx, fCy, fRadius, wallOffset, borderOffset);
          }
          //DEBUGGING!!!
          var debug = "";
         // debug += "\nOnFloor = " + isOnFloor
          //debug += "\n(LastX, LastY): " + "(" + lastX + "," + lastY + ")";
         // debug += "\n Current R - " + currentR;
          //debug += "\n(Mx, My): " + "(" + xPos + "," + yPos + ")";
         // debug += "\nWall Center: " + wCx + "," + (wCy);
          debug += "\nFloor Center" + fCx + "," + fCy;
          //debug += "\n(Theta): " + "(" + theta + ")";
         // debug += "\n" + fCx + "," + fCy;
          //DEBUGGING!!
        }
        );
    },
    init: function(screen)
    {
      this.screens = this.setScreens(screen);
      this.listen(/*add parameters*/);
      //this.rotateMouse();
    },
    setMode: function(args)
    {
      mouse.destroy();
      mouse = require('win-mouse')()
      if (args.length > 0)
      {
        var param;
        for (var i = 0; i < args.length; i++){
           console.log(args[i]);
           param = args[i];
           if (param.hasOwnProperty("floorOffset"))
           {
              this.floorOffset = param["floorOffset"];
           }
           // param = {"wallOffset": float from (0.0, 1.0) or degrees/360, radians/2pi}
            if (param.hasOwnProperty("wallOffset"))
           {
              this.wallOffset = param["wallOffset"];
           }
           // param = {"trayMode": True or False}
            if (param.hasOwnProperty("trayMode"))
           {
              this.trayMode = param["trayMode"];
           }
        }
      }
      this.listen();

    }
}
  //TODO: process screen dimensions
mouseController.init(electronScreen);
  
  
}