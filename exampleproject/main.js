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
      //TV id = 2779098405
      //main id = 2528732444
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
          var isOnFloor = onFloor(xPos, yPos, floor);
          lastX = xPos, lastY = yPos;

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
          //DEBUGGING!!
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
function createWindow () {

  var screenElectron = electron.screen;
  mouseController.init(screenElectron);
  //Mouse support entry point
//  var mouseutil = require('@fangt/campfiremouseutil')(screenElectron);

  var mainScreen = screenElectron.getPrimaryDisplay();
  var allScreens = screenElectron.getAllDisplays();
  var wallScreen = null;
  var floorScreen = null;

  // Wider screen should be the "Wall"
  if (allScreens[0].size.width > allScreens[1].size.width){
    wallScreen = allScreens[0];
    floorScreen = allScreens[1];
  } else {
    floorScreen = allScreens[0];
    wallScreen = allScreens[1];
  }

/*  console.log("Main screen",mainScreen);
  console.log("all screens", allScreens)
*/
  // Create a browser window for the "Wall"...
  // "Wall" should fill available screen


  mainWindow = new BrowserWindow({x: 0, y: 0, 
                                  width: wallScreen.size.width, height: wallScreen.size.height, 
                                  show: false,
                                  webPreferences:{nodeIntegration: true}})

  // Now load the wall URL
  mainWindow.loadURL('https://lp01.idea.rpi.edu/shiny/erickj4/swotr/?view=Wall');

  // Create a browser window for the "Floor"...
  // Floor on Campfire must be centered (x position)
  //floorWindow = new BrowserWindow({ frame:false, x:((1920-1080)/2)-1920, y:0, width:1080, height:800}, webPreferences:{nodeIntegration: false} )
  // "Floor" for debug should fill available screen
  floorWindow = new BrowserWindow({x:floorScreen.size.width, y:0, 
                                   width:floorScreen.size.width, height:floorScreen.size.height, 
                                   show: false,
                                   webPreferences:{nodeIntegration: true}})

  // Now load the floor URL
  //https://lp01.idea.rpi.edu/shiny/erickj4/swotr/?view=Floor
  floorWindow.loadURL('https://lp01.idea.rpi.edu/shiny/erickj4/swotr/?view=Floor')

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
