# campfire-hci
Code related to HCI extensions for the IDEA Campfire
#How to run
1. cd ./../path/to/campfire-hci
2. cd exampleproject
3. npm install
4. electron .
If there are compatibility errors with electron, run this command in the directory of package.json.
```
npm rebuild --runtime=electron --target=1.8.2 --disturl=https://atom.io/download/atom-shell --abi=48
```

#How to include mouse utils
1. ```npm install @fangt/campfiremouseutil```
2. include in app.js
```javascript
var screen = electron.screen;
var mouseutil = require('@fangt/campfiremouseutil')(screen);
```
