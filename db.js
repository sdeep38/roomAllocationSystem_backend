import mysql from "mysql2/promise"

export const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Mysql#123",
    database: "test",
    waitForConnections: true,
    connectionLimit: 10,    // max simultaneous connections
    queueLimit: 0,          // unlimited queued requests
})