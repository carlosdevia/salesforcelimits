'use strict';

// ==============================================
// Load libraries
// ==============================================

const dotenv   = require('dotenv').config();          // necessary if running via 'node app.js' instead of 'heroku local'. //get .env data.
const jsforce  = require('jsforce');                  // salesforce client
const express  = require('express');                  // nodejs de-facto web server
const handlebars   = require('express-handlebars');       // for html templating responses
const path     = require('path');                     // utility for parsing and formatting file paths

//Let's create some constants from the process.env
const {SF_LOGIN_URL, SF_USERNAME, SF_PASSWORD, SF_SECURITY_TOKEN,NODE_DEBUG} = process.env;

const app = express();

//Sets our app to use the handlebars engine
app.set('view engine', 'handlebars');
//Default handlebar configuration
app.engine('handlebars', handlebars({
    layoutsDir: __dirname + '/views/layouts',
    //Helpers for the HTML view.
    helpers: {
        'getUsedPercentage': getUsedPercentage,
        'getStatusColor': function(limit) {
            let percentage =  getUsedPercentage(limit);
            if(percentage>50) {
                return 'lightyellow';
            }
            if(percentage>80) {
                return 'red';
            }

            return 'lightgreen';
        },
        'getStatus': function(limit) {
            let percentage =  getUsedPercentage(limit);
            if(percentage>50) {
                return 'Warning';
            }
            if(percentage>80) {
                return 'Error';
            }

            return 'OK';

        },
    }
}));
//Public path
app.use(express.static('public'))

//JSForce Connection
const conn = new jsforce.Connection({
    loginUrl: SF_LOGIN_URL
})

app.get("/", async (req, res) => {
    //Get the required information for the view.
    let sfLimits = await getSfLimits();

    res.render('index', {layout : 'master',sfLimits: sfLimits});
});

async function getSfLimits() {
    try {
        //Let's login into salesforce
        const login = await conn.login(SF_USERNAME, SF_PASSWORD+SF_SECURITY_TOKEN);
        //Call the API
        const sfLimits = await conn.requestGet('/services/data/v51.0/limits');

        return sfLimits;
    } catch(err) {
        console.log(err);
    }
}

app.listen(process.env.PORT, () => {
    console.log('Listening on port ' + process.env.PORT);
});

function getUsedPercentage (limit) {
    if(!limit.Max) return 0;
    let percentage = ((limit.Max - limit.Remaining) * 100) / limit.Max;
    return (Math.round(percentage * 100) / 100 ) || 0;
}