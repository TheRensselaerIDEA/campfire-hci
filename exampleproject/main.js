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
    setScreens: function(screen)
    {
      this.wallScreen = null;
      this.floorScreen = null;
      var allScreens = screen.getAllDisplays();
      var main = screen.getPrimaryDisplay();
      //console.log(allScreens);
      if (allScreens.length > 1)
      {
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
      }
      else
      {
        this.wallScreen = main;
        this.floorScreen = main;
      }

    },
    rotateMouse: function()
    {
      this.floorSize = this.floorScreen.size;
      var w = this.floorSize.width/2;
      var h = (this.floorSize.height/2);
      var twoPI = Math.PI * 2;
      var x = 0, y = 0;
      var radius = 539;

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
        var borderOffset = 10;
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
          if ((x <= fb.x + fb.width && x >= fb.x) &&
             (y <= fb.y + fb.height && y >= fb.y))
          {
            return true;
          }
          return false;
        }
        var calcTheta = function(dx, dy)
        {
          var t = Math.atan2(dy,dx) * 180 / Math.PI;
          if (t < 0) t = 360 + t;
          return t
        }
        var wallListener = function(xPos, yPos, fCx, fCy, fRadius, borderOffset)
        {
            //Get position of mouse and convert to percentage of x position to width on wall screen.
            var perc = (xPos - wb.x) / wb.width,
            twoPI = Math.PI * 2,
            //convert to radians
            //Theta's range = [0, 2*Pi]
            angleOffset = 0;//Math.PI;

            theta = perc * (twoPI) + angleOffset;
            if (theta > twoPI)
            {
              theta = Math.abs(theta - Math.PI * 2);
            }
            //case for reaching vertical border, the mouse should appear on the opposite border.
            if (xPos >= wb.x + wb.width)
            {
              robot.moveMouse(wb.x, yPos);
            }
            /*if (xPos <= wb.x)
            {
              robot.moveMouse(wb.x+wb.width-1, yPos);
            }*/
            if (xPos > wb.x && yPos > wb.height-2)
            {
              //place holder values for radius, until tested on campfire.
           //   if (theta > 360) theta = 360;
              var newRadius = fRadius - borderOffset;
              var x = fCx + (newRadius * Math.cos(theta));
              var y = fCy + (newRadius * Math.sin(theta));
              robot.moveMouse(x, y);
              console.log("\nWall: Moved from " + xPos, yPos);
              console.log("Wall: Moved to " + x + "," + y);
            }
        }
        var floorListener = function(xPos, yPos, fCx, fCy, borderOffset)
        {
            var dx = xPos - fCx, 
                dy = yPos - fCy,
                theta = calcTheta(dx, dy),
                currentR = Math.sqrt(dx**2 + dy**2), 
                offset = 539;
            //Placeholder for threshold, should check if radius from center to mouse is greater than the screen border
            if (currentR > offset)
            {
              //experimental method, theta/360 outputs a number between 0,1 this portion can be used to determine
              // the value of x to be placed at on the wall screen.
              // I believe the y value is irrelevant because the mouse will transition from the floor to wall and always appear at the bottom of the wall screen.
              var frac = theta/360;
              var x = wb.x + (wb.width * frac);
              var y = wb.height - borderOffset;  
              robot.moveMouse(x, y);
             // console.log("\nFloor: Moved from " + xPos, yPos);
              //console.log("\nFloor: Moved to " + x + "," + y);
            }
        }
          var fCx = fb.x + (fb.width)/2,
              fCy = fb.y + (fb.height)/2,
              wCx = wb.x + (wb.width)/2, 
              wCy = (wb.y + wb.height)/2;

        //There is a mapping from f(f_x,f_y) -> w_x,w_y
        //where f(f_x,f_y) is a function applied to the coordinates of the floor screen
        //and the output is a corresponding point on the wall  screen.
        mouse.on('move', function(xPos, yPos)
        {
          var lastX = xPos, lastY = yPos;
          var isOnFloor = onFloor(xPos, yPos, fb);
          //Floor radius from center of floor
          fRadius = 540;
          //Wall radius from center of wall
          //current radius from center of current screen
          //Transitioning from floor to wall
          if (isOnFloor)
          {
            floorListener(xPos, yPos, fCx, fCy, borderOffset);
          }
          //Logic for transitioning from wall to floor
          else if(!isOnFloor)
          {
            wallListener(xPos, yPos, fCx, fCy, fRadius, borderOffset);
          }
          //DEBUGGING!!!
          debug = "";
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
        for (var i = 0; i < args.length; i++){
           console.log(args[i]);
        }
      }
      this.listen();

    }
}
function createWindow () {

  var screenElectron = electron.screen;
  //Mouse support entry point
  //var mouseutil = require('@fangt/campfiremouseutil')(screenElectron);
  mouseController.init(screenElectron);
  var mainScreen = screenElectron.getPrimaryDisplay();
  var allScreens = screenElectron.getAllDisplays();
  var wallScreen = null;
  var floorScreen = null;

  // Wider screen should be the "Wall"
  if (allScreens[0].size.width > allScreens[1].size.width){
    wallScreen = allScreens[0];
    floorScreen = allScreens[2];
  } else {
    floorScreen = allScreens[0];
    wallScreen = allScreens[2];
  }

  console.log("Main screen",mainScreen);
  console.log("all screens", allScreens)

  // Create a browser window for the "Wall"...
  // "Wall" should fill available screen


  mainWindow = new BrowserWindow({x: 0, y: 0,
                                  width: wallScreen.size.width, height: wallScreen.size.height,
                                  show: true,
                                  frame: false,
                                  webPreferences:{nodeIntegration: true}})
  // Now load the wall URL
  mainWindow.loadURL('file://' + __dirname + '/walltest.html');
  //console.log(wallScreen.size);
  //console.log(mainWindow.getSize());
  // Create a browser window for the "Floor"...
  // Floor on Campfire must be centered (x position)
  //floorWindow = new BrowserWindow({ frame:false, x:((1920-1080)/2)-1920, y:0, width:1080, height:800}, webPreferences:{nodeIntegration: false} )
  // "Floor" for debug should fill available screen
  floorWindow = new BrowserWindow({x:floorScreen.bounds.x, y:floorScreen.bounds.y,
                                   width:floorScreen.size.width, height:floorScreen.size.height,
                                   show: true,
                                   frame: false,
                                   webPreferences:{nodeIntegration: true}})
floorWindow.setContentSize(1920,1080);
  // Now load the floor URL
  //https://lp01.idea.rpi.edu/shiny/erickj4/swotr/?view=Floor
  floorWindow.loadURL('file://' + __dirname + '/floortest.html')
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.


app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
