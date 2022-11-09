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

module.exports = {
    getRouteStops,
    insertLinkerEntry,
    insertStationEntry
};