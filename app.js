const express = require('express')
const http = require('http')
const https = require('https')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const sanitizeFilename = require('sanitize-filename')
const fabric = require('fabric').fabric

const config = require('./config.js')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors())
app.use(session({
    secret: config.SECRET,
    resave: true,
    saveUninitialized: true,
}))

const IMAGE_FOLDER = `user/img`
const JSON_FOLDER = `user/json`
for (folder of [IMAGE_FOLDER, JSON_FOLDER]) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, {recursive: true})
    }
}

// routes
app.get('/drawing/:id', async (req, res, next) => {
    try {
        const content = await fs.promises.readFile(`${JSON_FOLDER}/${req.params.id}.json`, {encoding: 'utf-8'})
        res.json(JSON.parse(content))
    } catch(e) {
        next(e)
    }
})

var canvas = new fabric.StaticCanvas(null, { width: 11, height: 13 }) // 1 canvas for whole app
app.post('/drawing', async (req, res, next) => {
    const name = sanitizeFilename(req.body.name || '___').replace(/\s/g, '_')
    const drawing = req.body.json
    const dimensions = req.body.dimensions
    try {
        // save to png using minimally cropped dimensions provided by client
        canvas.setDimensions({ width: dimensions.width, height: dimensions.height })
        // render image
        await new Promise((resolve, reject) => {
            canvas.loadFromJSON(drawing, () => {
                canvas.renderAll()
                resolve()
            })
        })
        // save image and json
        const fileBase = `${name}--${new Date().toISOString().replace(/[-:\.]/g, '_').replace(/(.*)T(.*)Z/, '$1--$2')}`
        var imgStream = fs.createWriteStream(`${IMAGE_FOLDER}/${fileBase}.png`)
        canvas.createPNGStream().on('data', chunk => imgStream.write(chunk))
        await fs.promises.writeFile(`${JSON_FOLDER}/${fileBase}.json`, JSON.stringify(drawing), 'utf-8')
        // return
        res.sendStatus(200)
    } catch(e) {
        next(e)
    }
})

// catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handler
app.use((err, req, res, next) => {
    console.error('\tERROR:', err.message)
    console.log('\t\tURL:', req.originalUrl)
    console.log('\t\tPATH:', req.route && req.route.path)
    console.log('\t\tQUERY:', req.query)
    console.log('\t\tBODY:', req.body)
    res.sendStatus(err.status || 500)
})

// start listening on http and https
http.createServer(app).listen(config.HTTP_PORT, function () {
    console.log(`
************************************
** Started listening on port ${config.HTTP_PORT} **
************************************`)
})
try {
    https.createServer({ key: fs.readFileSync(config.KEY_PATH), cert: fs.readFileSync(config.CERT_PATH) }, app).listen(config.HTTPS_PORT, function () {
        console.log(`
    ++++++++++++++++++++++++++++++++++++
    ++ Started listening on port ${config.HTTPS_PORT} ++
    ++++++++++++++++++++++++++++++++++++`)
    })
} catch (e) {

}

module.exports = app