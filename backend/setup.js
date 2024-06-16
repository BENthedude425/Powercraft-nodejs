const mysql2 = require('mysql2')
const fs = require('fs')
const modules = require('./modules')
const inquirer = require('inquirer')

const FILEPREFIX = modules.GetFilePrefix()
const FILEIDENT = 'setup.js'

const DEFAULTFILEPATHS = {
  Database_configs: 'data/DataBaseConfigs.json'
}

const DEFAULTDBCONFIGS = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'powercraft'
}

const TABLES = {
  Users:
    '(ID INT(255), username VARCHAR(255), password VARCHAR(255), permission_level INT(4))',
  Servers: '(ID INT(255), servername VARCHAR(255), directory VARCHAR(255))'
}

var FILEPATHS_FILE
var FILEPATHS
var DATABASECONFIGS
var DATABASECONNECTION

async function Setup () {
  modules.Cout(FILEIDENT, '--------------------SETUP DB--------------------')

  fs.mkdir(FILEPREFIX, err => {
    return
  })

  FILEPATHS_FILE = await modules.GetFilePath()
  FILEPATHS = await modules.GetFilePaths()
  DATABASECONFIGS = await GetDataBaseConfigs()
  
  
  err = await CreateDataBase(DATABASECONFIGS.database, async (err, results, fields) =>{

    if (err && results.length == 0){
      console.warn("Database could not be created. Exiting setup\n", err)
      return;
    }
    modules.Cout(FILEIDENT, "Checking all tables are existing")
    // Connect to the sql server under the database
    DATABASECONNECTION = mysql2.createConnection(DATABASECONFIGS)
    const TableKeys = Object.keys(TABLES)
    for (let i = 0; i < TableKeys.length; i++) {
      selectedKey = TableKeys[i]
      await CreateTable(selectedKey, TABLES[selectedKey])
    }
  
    modules.Cout(FILEIDENT, "setup finished")
  })
}

function GetDataBaseConfigsFromUser(){
  return answers = inquirer
      .prompt([
        {
          type: "input",
          name: "host",
          default:"localhost",
          message: 'Enter mysql DB address'
        },
        {
          type: "input",
          name: 'user',
          default:"powercraft_Server",
          message: 'Enter username of root user'
        },
        {
          type: "input",
          name: 'password',
          default:"powercraft_pwd",
          message: 'Enter password for root user'
        },
        {
          type: "input",
          name: 'database',
          default:"powercraft",
          message: 'Enter database name'
        }
      ]);
}

async function GetDataBaseConfigs () {
  if (!fs.existsSync(FILEPATHS.Database_configs)) {
    DATABASECONFIGS = await GetDataBaseConfigsFromUser();  

    fs.writeFileSync(
      FILEPATHS.Database_configs,
      JSON.stringify(DATABASECONFIGS)
    )
  }

  dbConfigs = modules.GetParsedFile(FILEPATHS.Database_configs)
  return dbConfigs
}

async function CreateTable (tableName, values) {
  await SearchTable(tableName, function(err,results, fields){
    if (err) modules.Cout(FILEIDENT, err)
    
    tableExists = results.length > 0;
    
  
    if (tableExists) {
      modules.Cout(FILEIDENT, `Table: ${tableName} already exists!`)
      return
    }
  
    DATABASECONNECTION.query(String('CREATE TABLE ' + tableName + ' ' + values), (err) =>{
      if(err) modules.Cout(FILEIDENT, err)
    })

    modules.Cout(FILEIDENT, `Table ${tableName} has been successfully created!`)
  })
}

function SearchTable (tableName, callback) {
  DATABASECONNECTION.query(
    String(
      "SELECT * FROM information_schema.tables WHERE table_schema = '" +
        DATABASECONFIGS.database +
        "' AND table_name = '" +
        tableName +
        "' LIMIT 1"
    ), 
    callback
  )
}

function CreateDataBase (databaseName, callback) {

  TempDBConfigs = Object.assign({}, DATABASECONFIGS)
  delete TempDBConfigs["database"]

  TempDBCONN = mysql2.createConnection(TempDBConfigs)

    TempDBCONN.query(
      String(
        "CREATE DATABASE IF NOT EXISTS " + databaseName
      ), 
      callback
    )
    
    TempDBCONN.end()
    modules.Cout(FILEIDENT, `The ${databaseName} database has been loaded successfully`)
  
}

module.exports = {
  Setup
}
