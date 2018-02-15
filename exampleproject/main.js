const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');


var {app2, BrowserWindow2, ipcMain} = electron;
var floorWindow = null;
var mainWindow = null;




function createWindow () {

  var screenElectron = electron.screen;
  //Mouse support entry point
  var mouseutil = require('@fangt/campfiremouseutil')(screenElectron);

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
                                  show: true,
                                  webPreferences:{nodeIntegration: true}})

  // Now load the wall URL
  mainWindow.loadURL('https://lp01.idea.rpi.edu/shiny/erickj4/swotr/?view=Wall');

  // Create a browser window for the "Floor"...
  // Floor on Campfire must be centered (x position)
  //floorWindow = new BrowserWindow({ frame:false, x:((1920-1080)/2)-1920, y:0, width:1080, height:800}, webPreferences:{nodeIntegration: false} )
  // "Floor" for debug should fill available screen
  floorWindow = new BrowserWindow({x:floorScreen.size.width, y:0, 
                                   width:floorScreen.size.width, height:floorScreen.size.height, 
                                   show: true,
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
