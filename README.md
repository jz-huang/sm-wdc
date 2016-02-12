# tableau-wdc-survey-monkey
Tableau Web Data Connector for the Survey Monkey API.  Allows importing survey data to Tableau for visualization and analysis.
=======


Getting Started
---------------
* Register your app with the Survey Monkey Developers.
* Create a file named config.js at the project root.  It will contain config info for your app including client ID and secret you'll get in step 1.  Config.js needs to look like the following:


```
module.exports = {
  'HOSTPATH': 'http://localhost',
  'PORT': 8080,
  'SURVEY_MONKEY_CLIENT_ID': '',
  'SURVEY_MONKEY_CLIENT_SECRET': '',
  'SURVEY_MONKEY_API_KEY': '',
  'SURVEY_MONKEY_REDIRECT_URL': 'http://localhost:8080/redirect'
};
```
* Do the same for the config variable inside of smWDC.js.

You can change host, port, and redirect URL.  If you change these make sure you also change them in app.js.

* Make sure you have Node.js installed
* npm install
* npm start
* You can now use the WDC.  Note: you'll only get data if you use the WDC's [Simulator](http://onlinehelp.tableau.com/current/api/wdc/en-us/help.htm#WDC/wdc_simulator.htm%3FTocPath%3DWeb%2520Data%2520Connector%2520SDK|_____1) or Tableau Desktop

Current Limitations
---------------
Currently, this WDC only supports survey questions types that are available to a free Survey Monkey user (i.e. matrix drop down menu is not supported, images related question are not supported).

Notes:
1. For drop down menu, multiple choice, and matrix survey questions, there is an option to add a comment box or custom choice. Please take note to choose the appropriate option because custom
   choices and comment boxes are parsed differently.
