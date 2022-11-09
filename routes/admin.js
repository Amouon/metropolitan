var express = require("express"),
  router = express.Router();

const { response } = require("express");
const e = require("express");
const { redirect } = require("statuses");
const connection = require('../dabatase');
const session = require('express-session');
const { asyncWrapper } = require('../utils');
const { insertLinkerEntry, insertStationEntry } = require('../utils/dbHandlers');

router.use(express.urlencoded({
  extended: true
}))

router.use(session({
  secret: 'Q*/Xv$38&8TGhjv{',
  resave: true,
  saveUninitialized: true
}));

router.get("/", asyncWrapper(async function (req, res) {
  if (req.session.status) {
    res.render("pages/admin");
  } else res.redirect('/admin/login');
}));

router.get("/linker", asyncWrapper(async function (req, res) {
  if (req.session.status) {
    const db = await connection;
    const [cjroutes] = await db.query("SELECT * FROM cjroutes WHERE number NOT LIKE 'M%' ORDER BY cast(number as unsigned)"); 
    const [cjstops] = await db.query("SELECT * FROM cjstops");
    const [cjlinker] = await db.query("SELECT * FROM cjlinker")
    res.render("pages/linker", {cjroutes, cjstops, cjlinker});
  } else res.redirect('/admin/login')
}));

router.get("/stations", asyncWrapper(async function (req, res) {
  if (req.session.status) {
    res.render("pages/admin/stations");
  } else res.redirect('/admin/login');
}));

router.get("/times", asyncWrapper(async function (req, res) {
  if (req.session.status) {
    const db = await connection;
    const [cjroutes] = await db.query("SELECT * FROM cjroutes WHERE number NOT LIKE 'M%' ORDER BY cast(number as unsigned)");
    res.render("pages/admin/times", {cjroutes});
  } else res.redirect('/admin/login');
}));

router.get('/metropolitanLinker', asyncWrapper(async function (req, res) {
  if (req.session.status) {
    const db = await connection;
    const [cjroutes] = await db.query("SELECT * FROM cjroutes WHERE number LIKE 'M%' ORDER BY cast(number as unsigned)"); 
    const [cjstops] = await db.query("SELECT * FROM cjstops");
    const [cjlinker] = await db.query("SELECT * FROM cjlinker");
    res.render("pages/metropolitanLinker", {cjroutes, cjstops, cjlinker});
  } else res.redirect('/admin/login');
}));

router.get("/metropolitanTimes", asyncWrapper(async function (req, res) {
  if (req.session.status) {
    const db = await connection;
    const [cjroutes] = await db.query("SELECT * FROM cjroutes WHERE number LIKE 'M%' ORDER BY cast(number as unsigned)");
    res.render("pages/admin/metropolitanTimes", {cjroutes});
  } else res.redirect('/admin/login');
}));

// Login page
router.get('/login', function(req, res) {
  res.render('pages/admin-login');
});

// Process login 
router.post('/login', asyncWrapper(async function(req, res) {
  const db = await connection;

  const email = req.body.email;
  const password = req.body.password;
  
  if (email && password) {
    const [login] = await db.query('SELECT * FROM supervisors WHERE email = ? AND password = ?', [email, password]);
    if (login.length > 0) {
      // Authenticate the supervisor
      req.session.status = true;
      // Redirect to admin page
      res.redirect('/admin/linker');
    } else {
      req.session.status = false;
      res.send("Invalid login.");
    }
  }
}));

// Process linker requests
router.post('/linker', asyncWrapper(async function (req, res) {
  const data = req.body;
  const routeId = data.lineNo, stopId = data.stop, previousStop = data.precedingStop, routeDirection = data.routeDirection;
  if (previousStop === undefined) {
    await insertLinkerEntry(routeId, stopId, -1, routeDirection)
  }
  else {
    await insertLinkerEntry(routeId, stopId, previousStop, routeDirection)
  }
  res.redirect('/admin/linker');
}));

// Process station insertion requests
router.post('/stations', asyncWrapper(async function (req, res) {
  const stopName = req.body.stopName;
  await insertStationEntry(stopName);
  res.redirect('/admin/stations');
})); 

// Process time queries
router.post('/times', asyncWrapper(async function (req, res) {
  const db = await connection;
  const time = req.body.lineNo;
  const [lineNo] = await db.query('SELECT number FROM cjroutes WHERE id = ?', [time]);
  res.redirect('../../api/line/' + lineNo[0].number);
}))
module.exports = router;
