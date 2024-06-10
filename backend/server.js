const express = require('express')
const mysql = require('mysql')
const app = express()
const setupFile = require('./setup')
const modules = require('./modules')

const PORT = 8080
var DATABASECONNECTION
var dataBaseConfigs

var FILEPATHS;
const FILEPREFIX = modules.GetFilePrefix()
const FILEIDENT = 'server'

modules.Cout(FILEIDENT, '--------------------INIT--------------------')

async function InitialiseDB () {
  if (await setupFile.Setup()) setupFile.Setup()
  LoadConfigs()
  Listen()
  return mysql.createConnection( dataBaseConfigs)
}

function LoadConfigs() {
  // Get the db configs from the save file
  dataBaseConfigs = modules.GetParsedFile(FILEPATHS['Database_configs'])
  FILEPATHS = modules.GetFilePaths()
}

// Initialise systems
DATABASECONNECTION =  InitialiseDB()

// ---------- APP HANDLERS ---------- \\

app.post('/api/configs', (req, res) => {
  // check auth
  // update the corresponding config file
})

app.get('/', (rep, res) => {
  res.send(dataBaseConfigs)
})

function Listen(){
  app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`)
  })
  
}