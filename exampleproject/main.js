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

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');


var {app2, BrowserWindow2, ipcMain} = electron;
var floorWindow = null;
var mainWindow = null;

var mouseController =
{
    //Initialize screen variables with electron.
    setScreens: function()
    {
      this.wallScreen = null;
      this.floorScreen = null;

      this.floorOffset = 0.75,
      this.wallOffset = 0.25;
      this.screen = electron.screen;
      var allScreens = this.screen.getAllDisplays();
      var main = this.screen.getPrimaryDisplay();
      //console.log(allScreens);
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
        var params = this.params;
        //These functions are created in local scope to be used by the event listener.
        var util =
        {
          //Might be useful one day. not used in current implementation.
          getDir: function(x, y, lx, ly)
          {
            var hDir, vDir;
            //Checks change between last position(lx, ly) current position(x,y)
            hDir = lx < x ? "right" : "left";
            vDir = ly < y ? "down" : "up";

            vDir = ly - y == 0 ?  vDir = "null" : vDir;
            hDir = lx - x == 0 ?  hDir = "null" : hDir;
            return [hDir, vDir];
          },
          //Input: dx: distance between centerx and mousex
          //       dy: distance between centery and mousey
          //Output: degrees from origin angle
          calcTheta: function(dx, dy)
          {
            //degree of angle
            var t = Math.atan2(dy,dx) * 180 / Math.PI;
            if (t < 0) t = 360 + t;
            return t
          },
          //determines if the mouse cursor is within the boundaries of the floor, else we are on the wall.
          onFloor: function(x,y, fb)
          {
            return ((x <= fb.x + fb.width && x >= fb.x) &&
               (y <= fb.y + fb.height && y >= fb.y));
          },
          screenWrap: function(xPos, yPos, wb)
          {
              //moving right to left
              if (yPos >= wb.height-2) return;
              if (xPos >= (wb.x + wb.width)-2)
              {
                console.log("Transitioning right to left")
                robot.moveMouse(wb.x+4, yPos);
              }
              //left to right
              else if (xPos < wb.x + 2)
              {
                console.log("Transitioning left to right");
                robot.moveMouse(wb.x+wb.width-4, yPos);
              }
              return;
          }
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
            //case for reaching vertical border, the mouse appears on the opposite border.
            if (params["screenWrap"])
            {
                util.screenWrap(xPos, yPos, wb);
            }
            if (xPos > wb.x && yPos > (wb.height)-4)
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
                theta = util.calcTheta(dx, dy),
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
            wallOffset = 0.25,
            isOnFloor = false,
            lastX = null, lastY = null;
        // Event Listener: Receives x and y positions of the mouse
        mouse.on('move', function(mouseX, mouseY)
        {
          lastX = mouseX,
          lastY = mouseY;
          isOnFloor = util.onFloor(mouseX, mouseY, fb);
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
/*          debug = "";
         debug += "\nOnFloor = " + isOnFloor
          debug += "\n(LastX, LastY): " + "(" + lastX + "," + lastY + ")";
         debug += "\n Current R - " + currentR;
          debug += "\n(Mx, My): " + "(" + xPos + "," + yPos + ")";
         debug += "\nWall Center: " + wCx + "," + (wCy);
         debug += "\nFloor Center" + fCx + "," + fCy;
          debug += "\n(Theta): " + "(" + theta + ")";
         debug += "\n" + fCx + "," + fCy;
*/          //DEBUGGING!!
        }
        );
    },
    init: function(args)
    {

      this.setArgs(args);
      this.screens = this.setScreens();
      this.createWindow();
      this.listen();

    //  this.rotateMouse();
    },
    setArgs: function(args)
    {
      this.params = {"display": true, 
                     "screenWrap": true,
                     "centerMode": false};

      if (Object.keys(args).length > 0)
      {
        var val, arg;
        for (arg in args)
        {
          val = args[arg];
          this.params[arg] = val;
      }
     }
    },
    createWindow: function() 
        {
        var floorScreen = this.floorScreen, wallScreen = this.wallScreen;
        var displayEnabled = this.params["display"];
        var floorWindow = null, mainWindow = null;
        //Mouse support entry point
        //var mouseutil = require('@fangt/campfiremouseutil')(screenElectron, args);
        var mainScreen = this.screen.getPrimaryDisplay();
        var allScreens = this.screen.getAllDisplays();

        mainWindow = new BrowserWindow({x: 0, y: 0,
                                        width: wallScreen.size.width, height: wallScreen.size.height,
                                        show: displayEnabled,
                                        frame: false,
                                        webPreferences:{nodeIntegration: true}})

        // Now load the wall URL
        mainWindow.setContentSize(6400,800);
        mainWindow.loadURL('file://' + __dirname + '/images/wall_invert.png');
        //console.log(wallScreen.size);
        //console.log(mainWindow.getSize());
        // Create a browser window for the "Floor"...
        // Floor on Campfire must be centered (x position)
        // "Floor" for debug should fill available screen
        

        floorScreen.bounds.width=1920;
        floorScreen.bounds.height=1080;

        floorWindow = new BrowserWindow({x:floorScreen.bounds.x, y:floorScreen.bounds.y,
                                         width:floorScreen.bounds.width, height:floorScreen.bounds.height,
                                         show: displayEnabled,
                                         frame:false,
                                         webPreferences:{nodeIntegration: true}})

        floorWindow.setContentSize(1920,1080);
        // Now load the floor URL
        //https://lp01.idea.rpi.edu/shiny/erickj4/swotr/?view=Floor
        floorWindow.loadURL('file://' + __dirname + '/images/target2_invert.png');
        floorWindow.setFullScreen(false);
        mainWindow.setFullScreen(false);

        // Emitted when the window is closed.
        mainWindow.on('closed', function () {
          // Dereference the window object, usually you would store windows
          // in an array if your app supports multi windows, this is the time
          // when you should delete the corresponding element.
          mainWindow = null
          floorWindow = null
        })
      }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
  mouseController.init({"display": false, "screenWrap": true});
})

// Quit when all windows are closed.


/*app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
*/
