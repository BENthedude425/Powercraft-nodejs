const express = require('express')
const cors = require('cors')
const mysql2 = require('mysql2')
const app = express()
const cookieParser = require('cookie-parser')
const modules = require('./modules')
const crypto = require('crypto')
const {
  Setup,
  GetRootUserCredentialsFromUser,
  CreateRootUser
} = require('./setup')

const PORT = 8080
var DATABASECONNECTION
var DATABASECONFIGS

var FILEPATHS
const FILEPREFIX = modules.GetFilePrefix()
const FILEIDENT = 'server.js'
const FIXEDIPADDRESS = 'http://newhost425.ddns.net:81'

async function InitialiseDB () {
  await LoadConfigs()

  return mysql2.createConnection(DATABASECONFIGS)
}

async function CheckUserExists (username, password, callback) {
  success = false
  hashedPass = crypto.createHash('sha256').update(password).digest('hex')
  DATABASECONNECTION.query(
    `SELECT * FROM users WHERE username='${username}' AND password='${hashedPass}'`,
    callback
  )
}

function LoginUser (username, newToken, callback) {
  DATABASECONNECTION.query(
    `UPDATE users SET auth_token='${newToken}' WHERE username='${username}'`,
    callback
  )

  return newToken
}

async function GenerateAuthToken () {
  found = false
  while (!found) {
    const CHARS =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const CHARSLEN = CHARS.length
    authToken = ''

    for (i = 0; i < 100; i++) {
      authToken += CHARS.charAt(Math.floor(Math.random() * CHARSLEN))
    }

    await new Promise((resolve, reject) => {
      DATABASECONNECTION.query(
        `SELECT * FROM users WHERE auth_token='${authToken}'`,
        (error, results, fields) => {
          if (error) {
            modules.Cout(FILEIDENT, error)
          }

          // If there are no results then the token is unique
          found = results.length == 0

          resolve()
        }
      )
    })
  }

  modules.Cout(FILEIDENT, `Generated new auth token: ${authToken}`)
  return authToken
}

async function LoadConfigs () {
  // Get the db configs from the save file#
  FILEPATHS = await modules.GetFilePaths()
  DATABASECONFIGS = await modules.GetParsedFile(FILEPATHS['Database_configs'])
}

async function INIT () {
  modules.Cout(FILEIDENT, 'INIT', true)
  DATABASECONNECTION = await InitialiseDB()
  await Setup()
  modules.Cout(FILEIDENT, 'FINISHED INIT', true)
}

// Initialise systems
INIT()

// ---------- APP HANDLERS ---------- \\
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors())

app.post('/api/create-user', (req, res) => {
  values = {
    username: '',
    password: '',
    permission_level: 4
  }

  res.redirect(`${FIXEDIPADDRESS}/login`)
})

app.post('/api/login', async (req, res) => {
  CheckUserExists(
    req.body.username,
    req.body.password,
    async (error, results, fields) => {
      if (error) {
        modules.Cout(FILEIDENT, error)
      }

      newToken = await GenerateAuthToken()

      LoginUser(req.body.username, newToken, (error, results, fields) => {
        if (error) {
          {
            modules.Cout(FILEIDENT, error)
          }
        }

        res.cookie('auth_token', newToken)
        res.redirect(`${FIXEDIPADDRESS}/dashboard`)
      })
    }
  )
})

app.get('/api/authenticate/*', (req, res) => {
  const splitURL = req.path.split('/')
  const token = splitURL[splitURL.length - 1]

  DATABASECONNECTION.query(
    `SELECT * FROM users WHERE auth_token='${token}'`,
    (err, results, fields) => {
      res.json([results.length > 0])
    }
  )
})

app.get('/', (req, res) => {
  res.send([DATABASECONFIGS, req.cookies])
})

app.get('/db', (req, res) => {
  DATABASECONNECTION.query('SELECT * FROM users', (err, results, fields) => {
    res.send(results)
  })
})

app.get('/createnewrootuser', async (req, res) => {
  modules.Cout(FILEIDENT, 'DELETE THIS FUNCTION')
  CreateRootUser(DATABASECONNECTION, (error, results, fields) => {
    if (error) {
      res.send('Failed to create user')
      return
    }

    res.send('Created user')
  })
})

app.listen(PORT, () => {
  modules.Cout(FILEIDENT, `server started on port ${PORT}`)
})
