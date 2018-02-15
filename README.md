# campfire-hci
Code related to HCI extensions for the IDEA Campfire
#How to run
1. cd ./../path/to/campfire-hci
2. cd exampleproject
3. npm install
4. electron .

#How to include mouse utils
1. include in app.js
'''javascript
var screen = electron.screen;
var mouseutil = require('@fangt/campfiremouseutil')(screen);
'''
