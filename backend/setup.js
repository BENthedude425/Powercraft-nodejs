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
  DATABASECONNECTION = mysql2.createConnection(DATABASECONFIGS)

  const TableKeys = Object.keys(TABLES)
  for (let i = 0; i < TableKeys.length; i++) {
    selectedKey = TableKeys[i]
    await CreateTable(selectedKey, TABLES[selectedKey])
  }


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

function CreateTable (tableName, values) {
  SearchTable(tableName, function(err,results, fields){
    if (err) console.warn(err)
    
    tableExists = results.length > 0;
    
  
    if (tableExists) {
      modules.Cout(FILEIDENT, `Table: ${tableName} already exists!`)
      return
    }
  
    DATABASECONNECTION.query(String('CREATE TABLE ' + tableName + ' ' + values), (err) =>{
      if(err) console.warn(err)
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

function CreateDataBase (databaseName) {}

function SearchDataBase (databaseName) {}

module.exports = {
  Setup
}
