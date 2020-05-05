const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const pgSession = require('connect-pg-simple')(session)

const pgPool = require('./database/db.js').pool
const db = require('./database/db.js')

require('dotenv').config()

const IN_PRODUCTION = process.env.NODE_ENV === 'production'

const app = express()
const port = process.env.PORT || 3001

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', `${process.env.DOMAIN}`)
    res.header('Access-Control-Allow-Credentials', true)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-PINGOTHER')
    next()
})

app.use(cookieParser(process.env.SECRET))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded( { extended: true } ))

app.use(session({
    name: process.env.SESS_ID,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: new pgSession({
        pool: pgPool, 
        conString : `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}` 
        }),
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
        sameSite: true,
        secure: IN_PRODUCTION
    }
}))

app.use(require('./routes/routes'))

if (IN_PRODUCTION) {
    app.use(express.static(path.join(__dirname, 'client/build')))

    //alternate
    /*app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname + 'client/build/index.html'))
    })*/
}

app.disable('x-powered-by');

function cleanUpServer() {
    db.shutdown()
}

[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, cleanUpServer);
})

app.listen(port, () => console.log(`Server is running on port ${port}`))
