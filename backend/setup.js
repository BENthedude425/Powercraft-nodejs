const mysql2 = require("mysql2");
const fs = require("fs");
const modules = require("./modules");
const inquirer = require("inquirer");
const crypto = require("crypto");

const FILEPREFIX = modules.GetFilePrefix();
const FILEIDENT = "setup.js";

const DEFAULTDBCONFIGS = {
    host: "localhost",
    user: "root",
    password: "root",
    database: "powercraft",
};

const TABLES = {
    UserRequests:
        "(username VARCHAR(255), password VARCHAR(255), date DATE, time TIME)",
    Users: "(ID INT(255), username VARCHAR(255), password VARCHAR(255), permission_level INT(4), auth_token VARCHAR(255))",
    Servers:
        "(ID INT(255), server_name VARCHAR(255), server_icon_path VARCHAR(255), server_executable_path VARCHAR(255), server_launcher_type VARCHAR(255), server_version VARCHAR(255), forge_release VARCHAR(255), server_status VARCHAR(255))",
};

const FILES = {
    Database_configs: ["data/DataBaseConfigs.json", GetDataBaseConfigsFromUser],
    DefaultMinecraftProperties: [
        "data/DefaultMinecraftProperties.json",
        modules.GetServerProperties,
    ],
};

var FILEPATHS_FILE;
var DATABASECONFIGS;
var DATABASECONNECTION;

async function Setup() {
    fs.mkdir(FILEPREFIX, (err) => {
        return;
    });

    // from modules
    FILEPATHS_FILE = await modules.GetFilePath();
    //FILES = await modules.GetFilePaths();

    const err = await CheckFilesExist();
    if (err) {
        modules.Log(FILEIDENT, err);
        return;
    }

    //DATABASECONFIGS = await GetDataBaseConfigs();
    DATABASECONFIGS = await modules.GetParsedFile(FILES.Database_configs[0]);

    await new Promise((resolve, reject) => {
        CreateDataBase(
            DATABASECONFIGS.database,
            async (err, results, fields) => {
                if (err && results.length == 0) {
                    modules.Log(
                        FILEIDENT,
                        ("Database could not be created. Exiting setup\n", err)
                    );
                    return;
                }

                modules.Log(FILEIDENT, "Checking all tables are existing");
                // Connect to the sql server under the database
                DATABASECONNECTION = mysql2.createConnection(DATABASECONFIGS);

                const TableKeys = Object.keys(TABLES);
                for (let i = 0; i < TableKeys.length; i++) {
                    tableCreated = false;
                    selectedKey = TableKeys[i];

                    await new Promise((resolve, reject) => {
                        CheckTableExists(resolve, selectedKey);
                    });
                }

                if ((await CheckUserExists()) == false) {
                    await CreateRootUser(DATABASECONNECTION);
                }

                resolve();
            }
        );
    });
}

async function CheckFilesExist() {
    const fileKeys = Object.keys(FILES);

    // loop each file and if they dont exist
    // write a file with the contents returned by its callback
    for (const key of fileKeys) {
        const selectedFile = FILES[key];
        const filePath = selectedFile[0];
        const callBack = selectedFile[1];

        if (!fs.existsSync(filePath)) {
            const fileContents = await callBack();

            fs.writeFileSync(filePath, JSON.stringify(fileContents, null, 4));
        }
    }
}

async function GetDataBaseConfigs() {
    if (!fs.existsSync(FILES.Database_configs[0])) {
        DATABASECONFIGS = await GetDataBaseConfigsFromUser();

        fs.writeFileSync(
            FILES.Database_configs[0],
            JSON.stringify(DATABASECONFIGS)
        );
    }

    dbConfigs = modules.GetParsedFile(FILES.Database_configs[0]);
    return dbConfigs;
}

async function CheckUserExists(username) {
    exists = false;
    query = "SELECT * FROM users";

    if (username != undefined) {
        query += ` WHERE username = '${username}'`;
    }

    await new Promise((resolve, reject) => {
        DATABASECONNECTION.query(query, (err, results, fields) => {
            if (err) {
                modules.Log(FILEIDENT, err);
            }
            exists = results.length > 0;
            resolve();
        });
    });

    return exists;
}

function ValidateUserCreds(credentials) {
    var err = false;
    const keys = Object.keys(credentials);

    for (const key of keys) {
        const selectedCred = credentials[key];

        if (selectedCred.length == 0) {
            modules.Log(FILEIDENT, "All fields must be filled");
            err = true;
        }
    }

    if (credentials.password != credentials.password2) {
        modules.Log(FILEIDENT, "Both passwords must match");
        err = true;
    }

    return err;
}

function WhiteSpace(numberOfLines) {
    var whiteSpace = "";

    for (let i = 0; i < numberOfLines; i++) {
        whiteSpace += "\n";
    }

    console.log(whiteSpace);
}

//---Database Creation---\\\

function CreateDataBase(databaseName, callback) {
    TempDBConfigs = Object.assign({}, DATABASECONFIGS);
    delete TempDBConfigs["database"];

    TempDBCONN = mysql2.createConnection(TempDBConfigs);

    TempDBCONN.query(
        String("CREATE DATABASE IF NOT EXISTS " + databaseName),
        callback
    );

    TempDBCONN.end();
    modules.Log(
        FILEIDENT,
        `The ${databaseName} database has been loaded successfully`
    );
}

async function CreateRootUser(dbConnection) {
    credentials = await GetRootUserCredentialsFromUser();

    // Recur if the credentials provided are unsuitable
    if (ValidateUserCreds(credentials)) {
        CreateRootUser(dbConnection);
        return;
    }

    if (CheckUserExists(credentials.username)) {
        const overWrite = GetOverWriteFromUser();
        if (!overWrite) {
            return;
        }

        modules.Log(FILEIDENT, "Attempting to overwrite the user");
        await new Promise((resolve, reject) => {
            dbConnection.query(
                `DELETE FROM users WHERE username = '${credentials.username}'`,
                (error, results, fields) => {
                    if (error) {
                        modules.Log(FILEIDENT, error);
                    }
                    resolve();
                }
            );
        });

        modules.Log(FILEIDENT, "User overwritten");
    }

    hashedPass = crypto
        .createHash("sha256")
        .update(credentials.password)
        .digest("hex");

    dbConnection.query(
        `INSERT INTO users VALUES (0, '${credentials.username}', '${hashedPass}', 1, '')`,
        callback
    );
    return false;
}

function CheckTableExists(resolve, selectedKey) {
    DATABASECONNECTION.query(
        `CREATE TABLE IF NOT EXISTS ${selectedKey} ${TABLES[selectedKey]}`,
        (err, results, fields) => {
            if (err) modules.Log(FILEIDENT, err);
            resolve();
        }
    );
}

//---Get user input -- \\

function GetRootUserCredentialsFromUser() {
    return (answers = inquirer.prompt([
        {
            type: "input",
            name: "username",
            default: "root",
            message: "Enter the username of the root powercraft user",
        },
        {
            type: "password",
            name: "password",
            message: "Enter the password of the root powercraft user",
        },
        {
            type: "password",
            name: "password2",
            message: "Re-enter the password of the root powercraft user",
        },
    ]));
}

async function GetOverWriteFromUser() {
    overWrite = null;
    while (true) {
        promptAnswers = await inquirer.prompt([
            {
                type: "input",
                name: "overWrite",
                default: "N",
                message: `A user with the username: ${credentials.username} already exists. Would you like to over-write? (Y/N)`,
            },
        ]);

        if (promptAnswers.overWrite.toLowerCase() == "y") {
            overWrite = true;
            break;
        }

        if (promptAnswers.overWrite.toLowerCase() == "n") {
            overWrite = false;
            break;
        }
    }

    return overWrite;
}

function GetDataBaseConfigsFromUser() {
    return (answers = inquirer.prompt([
        {
            type: "input",
            name: "host",
            default: "localhost",
            message: "Enter mysql DB address",
        },
        {
            type: "input",
            name: "user",
            default: "powercraft_Server",
            message: "Enter username of root user",
        },
        {
            type: "input",
            name: "password",
            default: "powercraft_pwd",
            message: "Enter password for root user",
        },
        {
            type: "input",
            name: "database",
            default: "powercraft",
            message: "Enter database name",
        },
    ]));
}

module.exports = {
    Setup,
    CreateRootUser,
};
