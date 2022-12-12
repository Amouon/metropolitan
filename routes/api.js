const fetch = require('node-fetch');

const express = require("express");
const router = express.Router();
const jsDOM = require('jsdom');
const { JSDOM } = jsDOM;
const { asyncWrapper } = require('../utils');

const connection = require('../dabatase');
const { getCsvSchedule, SCHEDULE_TYPES } = require('../utils/csvHandlers');
const { getRouteStops, insertTimeTableIntoDatabase } = require('../utils/dbHandlers');
const { processTUZTimeBlock } = require('../utils/jsonHandlers');
const { request } = require('express');

router.get("/", function (req, res) {
  res.render("pages/admin");
});

router.get("/linii", asyncWrapper(async function (req, res) {
    const db = await connection;
    const response = await fetch('https://ctpcj.ro/index.php/ro/orare-linii/linii-urbane');
    const body = await response.text();
    const { document } = (new JSDOM(body)).window;
    const routeBlockNodes = document.querySelectorAll('#portfolio .element');
    for (const block of routeBlockNodes) {
        let lineNo = block.querySelector('a').text.trim().replace("Linia ", '');
        let lineRoute = block.querySelector('.ruta').textContent.trim();
        let type = "";
        if (block.className.indexOf('troleibuze') > -1) type = 'trolleybus';
        else if (block.className.indexOf('autobuze') > -1) type = 'bus';
        else if (block.className.indexOf('microbuze') > -1) type = 'minibus';
        else if (block.className.indexOf('tramvaie') > -1) type = 'tram';
        else type = "N/A";
        console.log(lineNo, lineRoute, type);
        db.query("INSERT INTO cjroutes (route, number, type) VALUES (?, ?, ?)", [lineRoute, lineNo, type]);
    } 

    //const lineNumber =

    //).map((element) => element.text.trim().replace("Linia ", ''));

    res.render("pages/admin");
}));

router.get("/metropolitane", asyncWrapper(async function (req, res) {
    const db = await connection;
    const response = await fetch('https://ctpcj.ro/index.php/ro/orare-linii/linii-metropolitane');
    const body = await response.text();
    const { document } = (new JSDOM(body)).window;
    const routeBlockNodes = document.querySelectorAll('#portfolio .element');
    for (const block of routeBlockNodes) {
        let lineNo = block.querySelector('a').text.trim().replace("Linia", '');
        let lineRoute = block.querySelector('.ruta').textContent.trim();
        console.log(lineNo, lineRoute);
        db.query("INSERT INTO cjroutes (route, number) VALUES (?, ?)", [lineRoute, lineNo]);
    }
    res.render("pages/admin");
}));

router.get("/line/:number", asyncWrapper(async function(req, res) {
    const db = await connection;

    const { number } = req.params;
    // find the id of the line in the cjroutes table
    const [rows] = await db.query('SELECT id FROM cjroutes WHERE number = ?', [number]);
    if (!rows.length) return console.error('Line doesn\'t exist');
    const lineId = rows[0].id;
    const [status] = await db.query('SELECT * FROM cjtimes WHERE lineNo = ?', [lineId]);
    if (!status.length) {
        await processSchedule(db, number, lineId, SCHEDULE_TYPES.WEEKDAY);
        await processSchedule(db, number, lineId, SCHEDULE_TYPES.SATURDAY);
        await processSchedule(db, number, lineId, SCHEDULE_TYPES.SUNDAY);
    } 
    if(number.charAt() != 'M') res.redirect('../../admin/times');
    else res.redirect('../../admin/metropolitanTimes');
}));

async function processSchedule(db, number, lineId, scheduleType) {
    let scheduleTypeId = 0;
    switch(scheduleType) {
        case SCHEDULE_TYPES.WEEKDAY:
            scheduleTypeId = 0;
            break;
        case SCHEDULE_TYPES.SATURDAY:
            scheduleTypeId = 1;
            break;
        case SCHEDULE_TYPES.SUNDAY:
            scheduleTypeId = 2;
            break;
    }
    const workingDayHours = await getCsvSchedule(number, scheduleType);
    await db.query('DELETE FROM cjtimes WHERE lineNo = ? AND type = ?', [lineId, scheduleTypeId])
    if (workingDayHours === "undefined") {
        if (workingDayHours[0][0] == "Nu circula") workingDayHours[0][0] = "";
        if (workingDayHours[0][1] == "Nu circula") workingDayHours[0][1] = "";
    }
    for (const workingDayHour of workingDayHours) {
        await db.query('INSERT INTO cjtimes(lineNo, departureStart, departureReturn, type) VALUES (?, ?, ?, ?)', [lineId, workingDayHour[0], workingDayHour[1], scheduleTypeId]);
    }
}

router.get("/request/:number", asyncWrapper(async function(req, res) {
    const { number } = req.params;
    const direction = req.query.direction;
    res.json(await getRouteStops(number, direction));
}));

router.get("/fetchSJRoutes", asyncWrapper(async function (req, res) {
    const db = await connection;
    let body = [];
    let response = [];
    const lines = require('../jsons/sjIds.json')
    await db.query("TRUNCATE TABLE sjroutes");
    await db.query("TRUNCATE TABLE sjtimes");
    for (const line of lines.line) {
        let processedNode = { 
            weekday : { 
                departureTime : [],
                returnTime : [] 
            },
            saturday : {
                departureTime : [],
                returnTime : [] 
            },
            sunday : {
                departureTime : [],
                returnTime : [] 
            },
            checks : [-1, -1, -1, -1]
        }
        let testObjectsNameThatIWillChange = [];
        let processedSchedule = [];
        let day = { type : "noDay"};
        response = await fetch('https://www.tuz.ro/wp-json/wp/v2/posts/' + line.identifier + "\\", {
        method: "GET",
        headers: {
            "Referer": "https://www.tuz.ro",
        }
        }).then(response => response.json());
        await db.query('INSERT INTO sjroutes(number, route, identifier) VALUES (?, ?, ?)', [line.number, line.route, line.identifier]);
        let timeBlockNodes = response.content.rendered.split(/\r?\n/).map(e => e.split('<p>'));
        for (const block of timeBlockNodes) {
            if (block[1] !== undefined && !block[1].includes("iframe")) await processTUZTimeBlock(block[1], day, processedNode);
        }
        insertTimeTableIntoDatabase(processedNode, line.number);
    }
}));
module.exports = router;

