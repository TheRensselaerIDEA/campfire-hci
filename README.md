# Campfire-Hci
Code related to HCI extensions for the IDEA Campfire

# How to run
1. cd ./../path/to/campfire-hci
2. cd wrangler
3. npm install
4. electron .
If there are compatibility errors with electron, run this command in the directory of package.json.
```
npm rebuild --runtime=electron --target=1.8.2 --disturl=https://atom.io/download/atom-shell --abi=48
```

# How to include mouse utils
1. ```npm install @campfirehci/campfiremouseutil```
2. include in app.js
```javascript
var screen = electron.screen;
var mouseutil = require('campfirehci/campfiremouseutill')({ "arguments": values });
```

# Additional dependencies:
1. MSBuildTools
	- http://landinghub.visualstudio.com/visual-cpp-build-tools
2. Python 2.7
	- set PYTHON path variable to C:/../path/to/Python27.exe
	- OR npm install --global --production windows-build-tools
3. Node-Gyp
	- npm install --global node-gyp
	- see building robotjs
		- https://www.npmjs.com/package/robotjs
