const mysql = require('mysql2/promise');

module.exports = (async () => {
    const db = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "Q*/Xv$38&8TGhjv{",
        database: "routes"
    });
    return db;
})();