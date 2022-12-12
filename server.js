const { Router } = require('express');
var express = require('express');
var app = express();

const { redirect } = require('statuses');

const { asyncWrapper } = require('./utils');

const adminRouters = require('./routes/admin');
const api = require('./routes/api');

const connection = require('./dabatase');
// set the view engine to ejs
app.use('/public', express.static('public'));
app.set('view engine', 'ejs');

var path = require('path');
var dir = path.join(__dirname, 'views')
app.use(express.static(dir));

// use res.render to load up an ejs view file

// connecting database

/* const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "routes"
});

// checking connection

db.connect(function(err) {
  if (err) throw err;
  console.log('Successfully connected to database.');
}); */



// Home page

app.get('/', function(req, res) {
  res.render('pages/home');
});

// UrbanCJ dynamic page

app.get('/urban', asyncWrapper(async function(req, res) {
  const db = await connection;
  let routes = [];
  // Fetching the routes from the database 
  switch(req.query.region) {
    case "CJ":
      [routes] = await db.query("SELECT * FROM cjroutes WHERE number NOT LIKE 'M%' ORDER BY cast(number as unsigned)")
      break;
    case "SM":
      [routes] = await db.query("SELECT * FROM smroutes ORDER BY cast(number as unsigned)");
      break;
    case "SJ":
      [routes] = await db.query("SELECT * FROM sjroutes");
      break;
  }
  res.render('pages/urban', {routes, query : req.query, selected : 4});
  }));

// About page

app.get('/about', asyncWrapper(async function(req, res) {
  //await Promise.reject(new Error('fail'));
  res.render('pages/about');
}));

// Route page

app.get('/route', asyncWrapper(async function(req, res) {
  const db = await connection;
  let linker = [];
  let lineNo = [];
  let times = [];
  let detailed = []
  try {
    if (req.query.region == "CJ") {
      [linker] = await db.query("SELECT * FROM cjlinker RIGHT JOIN cjstops on stopId = stop_id RIGHT JOIN cjroutes on routeId = id WHERE number = ?", [req.query.route]);
      [lineNo] = await db.query("SELECT id FROM cjroutes WHERE number = ?", [req.query.route]);
      [times] = await db.query("SELECT id, lineNo, IFNULL(departureStart, '') departureStart, IFNULL(departureReturn, '') departureReturn, type FROM cjtimes WHERE lineNo = ?", [lineNo[0].id]);
      [detailed] = await db.query("SELECT endOne, endTwo, IFNULL(info, '') info, IFNULL(changes, '') changes, type FROM cjdetailed JOIN cjroutes on id = routeId WHERE routeId = ?", [lineNo[0].id]);
    };
    if (req.query.region == "SM") {
      [linker] = await db.query("SELECT * FROM smlinker RIGHT JOIN smstops on stopId = stop_id RIGHT JOIN smroutes on routeId = id WHERE number = ?", [req.query.route]);
      [lineNo] = await db.query("SELECT id FROM smroutes WHERE number = ?", [req.query.route]);
      [times] = await db.query("SELECT id, lineNo, IFNULL(departureStart, '') departureStart, IFNULL(departureReturn, '') departureReturn, type FROM smtimes WHERE lineNo = ?", [lineNo[0].id]);
      [detailed] = await db.query("SELECT endOne, endTwo, IFNULL(info, '') info, IFNULL(changes, '') changes, type FROM smdetailed JOIN smroutes on id = routeId WHERE routeId = ?", [lineNo[0].id]);
    }
    if (req.query.region == "SJ") {
      [lineNo] = await db.query("SELECT id FROM sjroutes WHERE number = ?", [req.query.route]);
      [times] = await db.query("SELECT id, lineNo, IFNULL(departureStart, '') departureStart, IFNULL(departureReturn, '') departureReturn, type FROM sjtimes WHERE lineNo = ?", [lineNo[0].id]);
    };
  }
  catch(err) {
    if (err instanceof TypeError) console.log("bro");
  }
    res.render('pages/route', {linker, query : req.query, times, detailed : detailed[0]});

}));

// Metropolitan routes page

app.get('/metropolitan', asyncWrapper(async function (req, res) {
  const db = await connection;
  let query = {region: "CJ"};
  const [routes] = await db.query("SELECT * FROM cjroutes WHERE number LIKE 'M%' ORDER BY cast(number as unsigned)");
  res.render('pages/urban', {routes, query, selected : 5});
}));

// Contact

app.use('/contact', function(req, res) {
  res.render('pages/contact');
});


app.use('/admin', adminRouters);

app.use('/api', api);

app.get('/')

app.listen(8080);
console.log('Server is listening on port 8080');
