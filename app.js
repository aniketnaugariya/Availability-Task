const express = require('express');
require('dotenv').config()
const path = require('path');
const app = express();

const port = process.env.PORT || 8081;
const bodyParser = require('body-parser');
const cors = require('cors');
const multipart = require('connect-multiparty');
require('./src/db/mongodb'); // Mongo db connection

app.engine('html', require('ejs').renderFile);

app.get('/register', (req, res)=>{
    res.render('signup.html',{ title:'Signup page'});
})
app.get('/', (req, res)=>{
    res.render('login.html',{ title:'login page'});
})

app.get('/addAvailability', (req, res)=>{
    return  res.render('addAvailability.html',{ title:'Add Availability'});
})

app.get('/getAvailability', (req, res)=>{
    res.render('AvailabilityList.html',{ title:'Get Availability',result:[{startTime:'1', endTime:'2'}]});
})

app.use(cors());
app.options('*', cors());
app.use((req, res, next)=>{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
})

app.use(multipart());
app.use(bodyParser.json({extend: true, limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

require('./src/versions/version1')(app);

app.listen(port, ()=>{
 console.log(`Server running on ...port:${port}`);
})
