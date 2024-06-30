const mysql2 = require('mysql2')
const fs = require('fs')
const modules = require('./modules')
const inquirer = require('inquirer')
const crypto = require('crypto')

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
    '(ID INT(255), username VARCHAR(255), password VARCHAR(255), permission_level INT(4), auth_token VARCHAR(255))',
  Servers: '(ID INT(255), servername VARCHAR(255), directory VARCHAR(255))'
}

var FILEPATHS_FILE
var FILEPATHS
var DATABASECONFIGS
var DATABASECONNECTION

async function Setup () {
  fs.mkdir(FILEPREFIX, err => {
    return
  })

  FILEPATHS_FILE = await modules.GetFilePath()
  FILEPATHS = await modules.GetFilePaths()
  DATABASECONFIGS = await GetDataBaseConfigs()

    await new Promise((resolve, reject) => {
      CreateDataBase(DATABASECONFIGS.database, async (err, results, fields) => {
        if (err && results.length == 0) {
          modules.Cout(
            FILEIDENT,
            ('Database could not be created. Exiting setup\n', err)
          )
          return
        }

        modules.Cout(FILEIDENT, 'Checking all tables are existing')
        // Connect to the sql server under the database
        DATABASECONNECTION = mysql2.createConnection(DATABASECONFIGS)
        const TableKeys = Object.keys(TABLES)
        for (let i = 0; i < TableKeys.length; i++) {
          tableCreated = false
          selectedKey = TableKeys[i]

          // Wait for each table to be created
          await new Promise((resolve, reject) => {
            DATABASECONNECTION.query(
              `CREATE TABLE IF NOT EXISTS ${selectedKey} ${TABLES[selectedKey]}`,
              (err, results, fields) => {
                if (err) modules.Cout(FILEIDENT, err)
                resolve()
              }
            )
          })
        }

        if ((await CheckUserExists()) == false) {
          err = await CreateRootUser(DATABASECONNECTION)

          while (err) {
            err = await CreateRootUser(DATABASECONNECTION)
          }
        }
      resolve()
      })
    })
}


function GetDataBaseConfigsFromUser () {
  return (answers = inquirer.prompt([
    {
      type: 'input',
      name: 'host',
      default: 'localhost',
      message: 'Enter mysql DB address'
    },
    {
      type: 'input',
      name: 'user',
      default: 'powercraft_Server',
      message: 'Enter username of root user'
    },
    {
      type: 'input',
      name: 'password',
      default: 'powercraft_pwd',
      message: 'Enter password for root user'
    },
    {
      type: 'input',
      name: 'database',
      default: 'powercraft',
      message: 'Enter database name'
    }
  ]))
}

function GetRootUserCredentialsFromUser () {
  return (answers = inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      default: 'root',
      message: 'Enter the username of the root powercraft user'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter the password of the root powercraft user'
    },
    {
      type: 'password',
      name: 'password2',
      message: 'Re-enter the password of the root powercraft user'
    }
  ]))
}

async function GetDataBaseConfigs () {
  if (!fs.existsSync(FILEPATHS.Database_configs)) {
    DATABASECONFIGS = await GetDataBaseConfigsFromUser()

    fs.writeFileSync(
      FILEPATHS.Database_configs,
      JSON.stringify(DATABASECONFIGS)
    )
  }

  dbConfigs = modules.GetParsedFile(FILEPATHS.Database_configs)
  return dbConfigs
}

function CreateDataBase (databaseName, callback) {
  TempDBConfigs = Object.assign({}, DATABASECONFIGS)
  delete TempDBConfigs['database']

  TempDBCONN = mysql2.createConnection(TempDBConfigs)

  TempDBCONN.query(
    String('CREATE DATABASE IF NOT EXISTS ' + databaseName),
    callback
  )

  TempDBCONN.end()
  modules.Cout(
    FILEIDENT,
    `The ${databaseName} database has been loaded successfully`
  )
}

async function CheckUserExists (username) {
  exists = false
  query = 'SELECT * FROM users'

  if (username != undefined) {
    query += ` WHERE username = '${username}'`
  }

  await new Promise((resolve, reject) => {
    DATABASECONNECTION.query(query, (err, results, fields) => {
      if (err) {
        modules.Cout(FILEIDENT, err)
      }
      exists = results.length > 0
      resolve()
    })
  })

  return exists
}

async function CreateRootUser (dbConnection, callback) {
  modules.Cout(FILEIDENT, 'Please create a new root user')
  credentials = await GetRootUserCredentialsFromUser()

  if (credentials.password.length == 0 || credentials.password2.length == 0) {
    WhiteSpace(10)
    modules.Cout(FILEIDENT, 'Something must be entered in each of the fields.')
    return true
  }

  if (credentials.password != credentials.password2) {
    WhiteSpace(10)
    modules.Cout(FILEIDENT, 'Both passwords must match')
    return true
  }

  if (CheckUserExists(credentials.username)) {
    overWrite = null
    while (true) {
      promptAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'overWrite',
          default: 'N',
          message: `A user with the username: ${credentials.username} already exists. Would you like to over-write? (Y/N)`
        }
      ])

      if (promptAnswers.overWrite.toLowerCase() == 'y') {
        overWrite = true
        break
      }

      if (promptAnswers.overWrite.toLowerCase() == 'n') {
        overWrite = false
        break
      }
    }

    if (!overWrite) {
      return
    }

    modules.Cout(FILEIDENT, 'Attempting to overwrite the user')
    await new Promise((resolve, reject) => {
      dbConnection.query(
        `DELETE FROM users WHERE username = '${credentials.username}'`,
        (error, results, fields) => {
          if (error) {
            modules.Cout(FILEIDENT, error)
          }
          resolve()
        }
      )
    })

    modules.Cout(FILEIDENT, 'User overwritten')
  }

  hashedPass = crypto
    .createHash('sha256')
    .update(credentials.password)
    .digest('hex')

  dbConnection.query(
    `INSERT INTO users VALUES (0, '${credentials.username}', '${hashedPass}', 1, '')`,
    callback
  )
  return false
}

function WhiteSpace (numberOfLines) {
  var whiteSpace = ''

  for (let i = 0; i < numberOfLines; i++) {
    whiteSpace += '\n'
  }

  console.log(whiteSpace)
}

module.exports = {
  Setup,
  CreateRootUser
}
