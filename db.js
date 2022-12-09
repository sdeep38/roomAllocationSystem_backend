import mysql from "mysql2"

export const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Mysql#123",
    database: "test"
})