const express = require('express')
const mysql = require('mysql')
const multer = require('multer')
const csv = require('fast-csv')
const fs = require('fs')
const path = require('path');


const app = express()
app.set('view engine', 'ejs');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    multipleStatements: true,
})

db.connect((error) => {
    if (error) {
        console.log(error)
    } else {
        console.log('Mysql connected')
    }
})

// Set global directory
global.__basedir = __dirname;

// Set The Storage Engine
const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    const filetypes = /csv|xml/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
        return cb(null, true);
    } else {
        cb('Please upload csv/xml file!');
    }
}

const upload = multer({ storage, fileFilter }).single('myData')

app.get('/', (req, res) => {
    const sql = 'USE db_architect; SELECT * FROM transactions'
    db.query(sql, (error, result) => {
        if (error) {
            res.render('index', {
                msg: err
            });
        }
        else {
            res.render('index', {
                data: result[1]
            });
        }
    })
})

function idMapping(status) {
    switch (status) {
        case 'Approved': return 1;
        case 'Failed', 'Rejected': return 2;
        case 'Finished', 'Done': return 3;
        default: return 3;
    }
}

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.render('index', {
                msg: err
            });
        } else {
            if (req.file == undefined) {
                res.render('index', {
                    msg: 'Error: No File Selected!'
                });
            } else {
                let uploadData = [];
                let filePath = __basedir + '/public/uploads/' + req.file.filename
                fs.createReadStream(filePath)
                    .pipe(csv.parse({ headers: false }))
                    .on('error', (error) => {
                        throw error.message
                    })
                    .on('data', (row) => {
                        uploadData.push(row)
                    })
                    .on('end', () => {
                        let sql = `USE db_architect;\n`
                        uploadData.forEach(data => {
                            sql += `INSERT INTO transactions(transaction_id, amount, currency_code, transaction_date, trans_status) VALUES ('${data[0]}', '${data[1]}', '${data[2]}', '${data[3]}', ${idMapping(data[4])});`
                        })
                        db.query(sql, (error, results) => {
                            if (error) {
                                console.log(error)
                                res.render('index', {
                                    msg: error,
                                });
                            }
                            else {
                                res.redirect('/');
                            }
                        })
                    })
            }
        }
    });
})
// Public Folder
app.use(express.static('./public'));

app.get('/init', (req, res) => {
    const sql = `
    DROP database if exists db_architect;
    CREATE DATABASE db_architect;
    USE db_architect;
    DROP TABLE IF EXISTS transaction_status_mapping;

    CREATE TABLE transaction_status_mapping
    (
        id bigint NOT NULL,
        trans_status text NOT NULL,
        csv_format text NOT NULL,
        xml_format text NOT NULL,
        PRIMARY KEY (id)
    );
    
    INSERT INTO transaction_status_mapping VALUES (1, 'A', 'Approved', 'Approved');
    INSERT INTO transaction_status_mapping VALUES (2, 'R', 'Failed', 'Rejected');
    INSERT INTO transaction_status_mapping VALUES (3, 'D', 'Finished', 'Done');
    
    DROP TABLE IF EXISTS transactions;
    
    CREATE TABLE transactions
    (
        transaction_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10,0) NOT NULL,
        currency_code VARCHAR(10) NOT NULL,
        transaction_date DATETIME NOT NULL,
        trans_status bigint NOT NULL,
        create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (transaction_id)
    );`

    db.query(sql, (error, result) => {
        if (error) console.log(error)
        else {
            res.render('index', { msg: 'Init tables successful!' })
        }
    })
})

app.listen('3000', () => {
    console.log('Server started on port 3000')
})