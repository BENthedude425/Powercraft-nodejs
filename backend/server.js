const express = require('express')
const mysql2 = require('mysql2')
const app = express()
const setupFile = require('./setup')
const modules = require('./modules')

const PORT = 8080
var DATABASECONNECTION
var DATABASECONFIGS

var FILEPATHS;
const FILEPREFIX = modules.GetFilePrefix()
const FILEIDENT = 'server.js'

modules.Cout(FILEIDENT, '--------------------INIT--------------------')

async function InitialiseDB () {
  await setupFile.Setup()
  await LoadConfigs()


  //return mysql2.createConnection(DATABASECONFIGS)
}

async function LoadConfigs() {
  // Get the db configs from the save file#
  FILEPATHS = await modules.GetFilePaths()
  DATABASECONFIGS = await modules.GetParsedFile(FILEPATHS['Database_configs'])

}

async function INIT(){
  DATABASECONNECTION = await InitialiseDB()
}

// Initialise systems
INIT()

// ---------- APP HANDLERS ---------- \\
app.use(express.json());       
app.use(express.urlencoded({extended: true})); 

app.post('/api/create-user', (req, res) => {
  console.log(req.body.username, req.body.password)
  res.redirect("http://localhost/login")
})

app.get('/', (rep, res) => {
  res.send(DATABASECONFIGS)
})

app.get('/db', (rep, res) => {
  DATABASECONNECTION.query("SELECT * FROM users", (err, results, fields) =>{
    res.send(results)

  })
})

app.listen(PORT, () => {
  modules.Cout(FILEIDENT, `server started on port ${PORT}`)
})