const mysql = require('mysql2')
const fs = require('fs')
const modules = require('./modules')
const inquirer = require('inquirer')

const FILEPREFIX = modules.GetFilePrefix()
const FILEIDENT = 'setupfile'

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

  FILEPATHS_FILE = modules.GetFilePath()
  FILEPATHS = GetFilePaths()
  DATABASECONFIGS = await GetDataBaseConfigs()
  DATABASECONNECTION = mysql.createConnection(DATABASECONFIGS)

  const TableKeys = Object.keys(TABLES)
  for (let i = 0; i < TableKeys.length; i++) {
    selectedKey = TableKeys[i]
    err = CreateTable(selectedKey, TABLES[selectedKey])
  }
}

function LoadPrompts(){
  return inquirer
      .prompt([
        {
          type: "input",
          name: "host",
          message: 'Enter mysql DB address [localhost]'
        },
        {
          type: "input",
          name: 'user',
          message: 'Enter username of root user [root]'
        },
        {
          type: "input",
          name: 'password',
          message: 'Enter password for root user [rootpwd]'
        },
        {
          type: "input",
          name: 'database',
          message: 'Enter database name [powercraft]'
        }
      ])
  }

async function GetDataBaseConfigs () {
  if (!fs.existsSync(FILEPATHS.Database_configs)) {
    const answers = await LoadPrompts();  
    console.log(answers);
    fs.writeFileSync(
      FILEPATHS.Database_configs,
      JSON.stringify(DATABASECONFIGS)
    )
  }

  dbConfigs = modules.GetParsedFile(FILEPATHS.Database_configs)
  return dbConfigs
}

function GetFilePaths () {
  if (!fs.existsSync(FILEPATHS_FILE)) {
    fs.writeFileSync(modules.GetFilePath(), JSON.stringify(DEFAULTFILEPATHS))
  }

  const filePaths = modules.GetParsedFile(FILEPATHS_FILE)
  return filePaths
}

function CreateTable (tableName, values) {
  tableExists = JSON.stringify(SearchTable(tableName)).length > 0

  if (tableExists) {
    modules.Cout(FILEIDENT, `Table: ${tableName} already exists!`)
    return
  }

  DATABASECONNECTION.query(String('CREATE TABLE ' + tableName + ' ' + values))
  modules.Cout(FILEIDENT, `Table ${tableName} has been successfully created!`)
}

function SearchTable (tableName) {
  return DATABASECONNECTION.query(
    String(
      "SELECT * FROM information_schema.tables WHERE table_schema = '" +
        DATABASECONFIGS.database +
        "' AND table_name = '" +
        tableName +
        "' LIMIT 1"
    )
  )
}

function CreateDataBase (databaseName) {}

function SearchDataBase (databaseName) {}

module.exports = {
  Setup
}
