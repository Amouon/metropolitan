const connection = require('../dabatase');

async function getRouteStops(lineNo, direction) {
    const db = await connection;
    const RouteStops = await db.query("SELECT stop_id, stop_name FROM routes.cjlinker JOIN routes.cjstops on stop_id = stopId WHERE routeId = ? AND routeDirection = ?", [lineNo, direction]);
    return RouteStops[0];
}

async function insertLinkerEntry(routeId, stopId, previousStop, routeDirection) {
    const db = await connection;
    let status = await db.query("SELECT linkerId FROM cjlinker WHERE routeId = ? AND previousStop = ? AND routeDirection = ?", [routeId, previousStop, routeDirection]);
    if (status[0].length == 0) {
        await db.query("INSERT INTO cjlinker(routeId, stopId, previousStop, routeDirection) VALUES (?, ?, ?, ?)", [routeId, stopId, previousStop, routeDirection]);
    }
    
    else {
        [ linkerId ] = status[0];
        linkerId = linkerId.linkerId;
        await db.query("INSERT INTO cjlinker(routeId, stopId, previousStop, routeDirection) VALUES (?, ?, ?, ?)", [routeId, stopId, previousStop, routeDirection]);
        await db.query("UPDATE cjlinker SET previousStop = ? WHERE linkerId = ?", [stopId, linkerId]);
    }    
}

async function insertStationEntry(stopName) {
    const db = await connection;
    const [status] = await db.query("SELECT * FROM cjstops WHERE stop_name = ?", [stopName]);
    if(status[0] == undefined) {
        await db.query("INSERT INTO cjstops(stop_name) VALUES (?)", [stopName]);
    }
}

async function insertTimeTableIntoDatabase(processedNode, identifier) {
    const db = await connection;
    let [[id]] = await db.query("SELECT id FROM sjroutes WHERE number = ?", [identifier]);
    id = id.id;
    let maxLength = Math.max(processedNode.weekday.departureTime.length, processedNode.weekday.returnTime.length);
    for (let i = 0; i < maxLength; i++) {
        await db.query("INSERT INTO sjtimes(lineNo, departureStart, departureReturn, type) VALUES (?, ?, ?, ?)", [id, processedNode.weekday.departureTime[i], processedNode.weekday.returnTime[i], 0])
    }
    maxLength = Math.max(processedNode.saturday.departureTime.length, processedNode.saturday.returnTime.length);
    for (let i = 0; i < maxLength; i++) {
        await db.query("INSERT INTO sjtimes(lineNo, departureStart, departureReturn, type) VALUES (?, ?, ?, ?)", [id, processedNode.saturday.departureTime[i], processedNode.saturday.returnTime[i], 1])
    }
    maxLength = Math.max(processedNode.sunday.departureTime.length, processedNode.sunday.returnTime.length);
    for (let i = 0; i < maxLength; i++) {
        await db.query("INSERT INTO sjtimes(lineNo, departureStart, departureReturn, type) VALUES (?, ?, ?, ?)", [id, processedNode.sunday.departureTime[i], processedNode.sunday.returnTime[i], 2])
    }
}
module.exports = {
    getRouteStops,
    insertLinkerEntry,
    insertStationEntry,
    insertTimeTableIntoDatabase
};