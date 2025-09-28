const express = require("express");
const https = require("follow-redirects").https;
const axios = require("axios");
const cors = require("cors");
const mysql2 = require("mysql2");
const app = express();

const os = require("os");
const osUtils = require("os-utils");
const diskCheck = require("diskusage");

const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

const modules = require("./modules");
const crypto = require("crypto");
const fs = require("fs");

const { Setup, CreateRootUser } = require("./setup");
const { readFileSync, writeFileSync } = require("fs");
const { exec } = require("child_process");
const md5 = require("md5");
const { Protocol } = require("puppeteer");
const { console } = require("inspector");

var DATABASECONNECTION = null;
var DATABASECONFIGS;
var FILEPATHS;

const DEVMODE = true;
const PORT = 8080;
const FILEIDENT = "server.js";
const PROTOCOL = "http";

// An object containing all of the running server processes using serverID's as keys
const SERVERPROCESSES = {};

// Keeps track of each servers player count using serverID's as keys
var PLAYERCOUNTS = [];
var PLAYERLISTS = {};
var PLAYERDATA = [];

function GetExecutablePath(server) {
    switch (server.server_launcher_type) {
        case "Forge":
            return "run.bat";
        case "Spigot":
            return `Spigot-${server.server_version}.jar`;
        default:
            return "";
    }
}

async function InitialiseDB() {
    await LoadConfigs();

    return mysql2.createConnection(DATABASECONFIGS);
}

async function PlayerExists(UUID) {
    return await new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM players WHERE UUID = ?";

        DATABASECONNECTION.query(sqlQuery, [UUID], (error, results) => {
            if (error != null) {
                console.log(error);
                return;
            }

            resolve(results.length > 0);
        });
    });
}

async function CheckUserExists(username, password) {
    const SQLquery = "SELECT * FROM users WHERE username= ? AND password= ?";
    hashedPass = HashNewPassword(password);

    return await new Promise((resolve, reject) => {
        DATABASECONNECTION.query(
            SQLquery,
            [username, hashedPass],
            (error, results, _) => {
                if (error) {
                    modules.Log(FILEIDENT, error);
                    reject();
                }

                if (results.length == 0) {
                    resolve(false);
                }

                resolve(true);
            }
        );
    });
}

async function JWTCheck(token) {
    if (token == undefined) {
        return false;
    }

    const SQLquery = "SELECT * FROM users WHERE auth_token= ?";
    return await new Promise((resolve, reject) => {
        DATABASECONNECTION.query(
            SQLquery,
            [token],
            (error, results, fields) => {
                if (error) {
                    reject();
                }

                resolve(results.length > 0);
            }
        );
    });
}

function HashNewPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

function LoginUser(username, newToken, callback) {
    const SQLquery = "UPDATE users SET auth_token= ? WHERE username= ?";
    DATABASECONNECTION.query(SQLquery, [newToken, username], callback);

    return newToken;
}

async function GenerateAuthToken() {
    found = false;
    while (!found) {
        const CHARS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const CHARSLEN = CHARS.length;
        authToken = "";

        for (i = 0; i < 100; i++) {
            authToken += CHARS.charAt(Math.floor(Math.random() * CHARSLEN));
        }

        const SQLquery = "SELECT * FROM users WHERE auth_token = ?";
        await new Promise((resolve, reject) => {
            DATABASECONNECTION.query(
                SQLquery,
                [authToken],
                (error, results, _) => {
                    if (error) {
                        modules.Log(FILEIDENT, error);
                    }

                    // If there are no results then the token is unique
                    found = results.length == 0;

                    resolve();
                }
            );
        });
    }

    modules.Log(FILEIDENT, `Generated new auth token: ${authToken}`);
    return authToken;
}

function FormatServerData(req) {
    const bodyKeys = Object.keys(req.body);
    var properties = {};
    var serverSettings = {};

    for (key of bodyKeys) {
        const propertyKey = key.slice(9);
        if (key.startsWith("property:")) {
            properties[propertyKey] = req.body[key];
        } else {
            serverSettings[key] = req.body[key];
        }
    }

    // Try to set the image path or default to default.png
    try {
        serverSettings.image_path = req.files.server_img.name;
        serverSettings.image_path = ReplaceAll(
            serverSettings.image_path,
            " ",
            "-"
        );
    } catch {
        serverSettings.image_path = "default.png";
    }

    return [properties, serverSettings];
}

function ReplaceAll(string, searchStr, replaceStr) {
    const split = string.split(searchStr);
    return split.join(replaceStr);
}

async function LoadConfigs() {
    // Get the db configs from the save file#
    FILEPATHS = await modules.GetFilePaths();

    DATABASECONFIGS = await modules.GetParsedFile(
        FILEPATHS["Database_configs"]
    );
}

async function CheckServerVersions() {
    const TMPFile = await readFileSync("ServerVersionsTMP.json");
    var oldFile = "";

    if (fs.existsSync("ServerVersions.json")) {
        oldFile = await readFileSync("ServerVersions.json");
    }

    // Update file
    if (oldFile != TMPFile) {
        await writeFileSync("ServerVersions.json", TMPFile);
    }

    // Delete TMP file
    await fs.unlink("ServerVersionsTMP.json", (err) => {
        if (err != null) {
            modules.Log(
                FILEIDENT,
                `There was an error removing ServerVersions Temp file. ${err}`
            );
        }
    });
}

async function FetchServerVersions() {
    return await new Promise((resolve, reject) => {
        const file = fs.createWriteStream("ServerVersionsTMP.json");
        const request = https.get(
            "https://raw.githubusercontent.com/BENthedude425/Powercraft_webscraper/refs/heads/main/Output.json",
            function (response) {
                response.pipe(file);

                // after download completed close filestream
                file.on("finish", () => {
                    file.close();
                    resolve(false);
                });

                file.on("failed", () => {
                    file.close();
                    reject(true);
                });
            }
        );
    });
}

async function INIT() {
    modules.Log(FILEIDENT, "INIT", true);
    await Setup();

    DATABASECONNECTION = await InitialiseDB();

    await SetAllServersStopped();

    setInterval(() => {
        GetAllPlayers();
    }, 5000);

    let failed = await FetchServerVersions();

    if (failed) {
        modules.Log(
            FILEIDENT,
            "Failed to fetch the server versions file from github. You may not be able to create new servers with powercraft until this issue is resolved."
        );
    } else {
        await CheckServerVersions();
    }

    modules.Log(FILEIDENT, "FINISHED INIT", true);
}

// Initialise systems
INIT();

async function SetAllServersStopped() {
    return await new Promise((resolve, reject) => {
        DATABASECONNECTION.query(
            `SELECT * FROM servers WHERE server_status = 'Running'`,
            (error, results, _) => {
                if (error != null) {
                    modules.Log(FILEIDENT, error);
                }

                for (result of results) {
                    DATABASECONNECTION.query(
                        `UPDATE servers SET server_status = 'Stopped' WHERE ID = ${result.ID}`,
                        (error) => {
                            if (error != null) {
                                modules.Log(FILEIDENT, error);
                            } else {
                                modules.Log(
                                    FILEIDENT,
                                    `Stopped server: "${result.server_name}". This server may have suffered data corruption or loss.`
                                );
                            }
                        }
                    );
                }
            }
        );

        DATABASECONNECTION.query(
            `SELECT * FROM servers WHERE server_status = 'Installing'`,
            (error, results, _) => {
                if (error != null) {
                    modules.Log(FILEIDENT, error);
                }

                for (result of results) {
                    DATABASECONNECTION.query(
                        `UPDATE servers SET server_status = 'Install_failed' WHERE ID = ${result.ID}`,
                        (error) => {
                            if (error != null) {
                                modules.Log(FILEIDENT, error);
                            } else {
                                modules.Log(
                                    FILEIDENT,
                                    `Stopped server install: "${result.server_name}". This server did not finish installing and may have suffered data corruption or loss.`
                                );
                            }
                        }
                    );
                }
            }
        );

        resolve();
    });
}

// Check if user has auth and give access accordingly
async function Authenticate(req, res, next) {
    // Check that the database connection has been establised

    if (DATABASECONNECTION == null) {
        res.send(
            "The database connection has not been yet established!\nPlease wait a few seconds and try again. If this error persists contact an admin."
        );
    }

    // Get token and check if the user has auth
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);
    const IP = req.header("x-forwarded-for") || req.connection.remoteAddress;

    // All paths that do not require authentication to use
    const exemptPaths = ["/api/login"];
    if (exemptPaths.includes(req.path)) {
        next();
        return;
    }

    // If not auth'd then return
    if (!auth) {
        modules.Log(
            FILEIDENT,
            `User failed authentication on API! INFO: {token: ${token}, IP: ${IP}}}`
        );
        res.json([false]);
        return;
    }

    // Allow access to API endpoint
    next();
}

const ORIGIN = readFileSync("origin.txt", (err) => {
    if (err != null) {
        console.log(err);
    }
});

// ---------- APP HANDLERS ---------- \\
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.static("public"));
app.use(fileUpload());
app.use(Authenticate);

// Returns path for a servers directory
function GetServerPath(serverName) {
    let parsedServerName = ParseServerName(serverName);
    return `${process.cwd()}/servers/${parsedServerName}`;
}

function GetServerFromID(serverID) {
    const SQLquery = "SELECT * FROM servers WHERE ID = ?";
    return new Promise((resolve, reject) => {
        DATABASECONNECTION.query(SQLquery, [serverID], (error, results, _) => {
            if (error != null) {
                modules.Log(error);
            }

            resolve(results[0]);
        });
    });
}

function GetUniqueServerID() {
    return new Promise((resolve, reject) => {
        DATABASECONNECTION.query(
            "SELECT * FROM servers",
            (error, results, _) => {
                if (error != null) {
                    modules.Log(error);
                    return;
                }

                resolve(results.length);
            }
        );
    });
}

// Depriciated
function GetServerIDFromURL(req) {
    const serverID = req.path.split("/");
    return serverID[serverID.length - 1];
}

function ChangeServerStatus(serverID, newStatus) {
    const SQLquery = "UPDATE servers SET server_status = ? WHERE ID = ?";

    DATABASECONNECTION.query(SQLquery, [newStatus, serverID], (error) => {
        if (error != null) {
            modules.Log(FILEIDENT, error);
        }
    });
}

function ChangePlayerStatus(serverID, newStatus) {
    const SQLquery = "UPDATE servers SET server_status = ? WHERE ID = ?";

    DATABASECONNECTION.query(SQLquery, [newStatus, serverID], (error) => {
        if (error != null) {
            modules.Log(FILEIDENT, error);
        }
    });
}

function CreateServerDir(serverName) {
    const serversDir = GetServerPath("");
    const serverPath = GetServerPath(serverName);

    if (!fs.existsSync(serversDir)) {
        fs.mkdirSync(serversDir);
    }

    if (fs.existsSync(serverPath)) {
        modules.Log(
            FILEIDENT,
            `A directory for server name :${serverName} already exists!`
        );
        return;
    }

    fs.mkdirSync(serverPath);
    modules.Log(FILEIDENT, "Servers directory created.");
    return true;
}

async function CreateServer(serverSettings, properties) {
    const propertiesString = ConvertPropertiesToString(properties);
    let sources = await readFileSync("ServerVersions.json", {
        encoding: "utf8",
    });
    sources = JSON.parse(sources);

    const launcherType = serverSettings.launcherTypeSelect;
    const version = serverSettings.versionSelect;

    let launcherFileName = "";
    let link = sources[launcherType];
    link = link[version];

    switch (launcherType) {
        case "Forge":
            const forgeRelease = serverSettings.forgeReleaseSelect;
            for (let i = 0; i < link.length; i++) {
                const selectedLink = link[i];

                if (selectedLink.file == forgeRelease) {
                    link = selectedLink.link;
                    launcherFileName = `forge-${version}-${selectedLink.file}.jar`;

                    break;
                }
            }
            break;
        case "Spigot":
            link =
                "https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar";
            launcherFileName = "BuildTools.jar";
            break;
        default:
            launcherFileName = `${link.file}.jar`;
            link = link.link;
            break;
    }

    // Get all paths for files
    const path = GetServerPath(serverSettings.serverName);
    const propertiesPath = `${path}/server.properties`;
    const terminalPath = `${path}/terminal.txt`;
    const eulaPath = `${path}/eula.txt`;
    const launcherFilePath = `${path}/${launcherFileName}`;

    // Create the server directory\
    CreateServerDir(serverSettings.serverName);

    // Create the properties file
    await fs.writeFileSync(propertiesPath, propertiesString);

    // Create the terminal log file
    // Change this to a buffer and only store on shutdown or periodically
    await fs.writeFileSync(terminalPath, "Terminal is empty");

    // Agree to the eula
    await fs.writeFileSync(eulaPath, "eula=true");

    const SQLquery =
        "INSERT INTO servers(id, server_name, server_icon_path, server_executable_path, server_launcher_type, server_version, forge_release, server_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    // Create entry in the table
    DATABASECONNECTION.query(
        SQLquery,
        [
            serverSettings.ID,
            serverSettings.serverName,
            serverSettings.image_path,
            launcherFilePath,
            serverSettings.launcherTypeSelect,
            serverSettings.versionSelect,
            serverSettings.forgeReleaseSelect,
            "Downloading",
        ],
        (error, _) => {
            if (error != null) {
                modules.Log(error);
            }
        }
    );

    // Download jar file
    await modules.DownloadAndSaveFile(link, launcherFilePath);

    // Update server status to installing
    ChangeServerStatus(serverSettings.ID, "Installing");
    return launcherFileName;
}

// OPTIMSE
function ReturnInstallCommand(type, serverPath, executableName, version) {
    switch (type) {
        case "Forge":
            return `cd ${serverPath} && java -jar ${executableName} --installServer`;
        case "Spigot":
            return `cd ${serverPath} && java -jar BuildTools.jar --rev ${version}`;
        default:
            return "";
    }
}

async function InstallServer(serverID, command) {
    const server = await GetServerFromID(serverID);
    ChangeServerStatus(serverID, "Installing");
    const terminalLogPath = `${GetServerPath(server.server_name)}/terminal.txt`;

    const installer_process = exec(command);

    installer_process.stdout.on("data", (data) => {
        fs.appendFileSync(terminalLogPath, data);
    });

    installer_process.stderr.on("data", (data) => {
        fs.appendFileSync(terminalLogPath, data);
    });

    installer_process.on("exit", (code) => {
        // If install was successful
        if (code == 0 || code == null) {
            modules.Log(`${FILEIDENT}-SERVERINSTALL`, "Install complete");
            fs.appendFileSync(terminalLogPath, `Install complete! \n`);
            ChangeServerStatus(server.ID, "Ready");

            // Update to the new exec path
            const newExecPath = GetExecutablePath(server);
            if (newExecPath != "") {
                const SQLquery = `UPDATE servers SET server_executable_path = ? WHERE ID = ?`;
                DATABASECONNECTION.query(
                    SQLquery,
                    [newExecPath, serverID],
                    (error, _) => {
                        if (error != null) {
                            modules.Log(FILEIDENT, error);
                        }
                    }
                );
            }

            return;
        }

        modules.Log(`${FILEIDENT}-SERVERINSTALL`, "Install failed");
        fs.appendFileSync(terminalLogPath, `Install failed! \n`);
        ChangeServerStatus(server.ID, "Install_failed");
    });
}

// Make API functionality to change the executable file to something else for edge cases or not 100% supported launchers
function ReturnRunCommand(server) {
    const pathPosition = server.server_executable_path.lastIndexOf(".");
    const fileExtension = server.server_executable_path.slice(pathPosition);
    const serverPath = GetServerPath(server.server_name);

    switch (fileExtension) {
        case ".jar":
            return `cd ${serverPath} && java -jar ${server.server_executable_path}`;
        default:
            return `cd ${serverPath} && ${server.server_executable_path}`;
    }
}

function ParseServerName(serverName) {
    return serverName.split(" ").join("-");
}

function RemoveEscapeChars(str) {
    return str.replace(/(\r\n|\n|\r)/gm, " ").trim();
}

// Takes a server object and runs it
function RunServer(server) {
    const serverPath = GetServerPath(server.server_name);

    ChangeServerStatus(server.ID, "Running");

    const command = ReturnRunCommand(server);
    var serverProcess = exec(command);
    PLAYERCOUNTS[server.ID] = {
        value: 0,
        total: 0,
    };

    serverProcess.stdout.on("data", (data) => {
        // [13:25:26 INFO]: There are 1 of a max of 20 players online: BENthedude425, Player2, Player3
        if (data.includes("players online:")) {
            var formattedData = data.split(":");

            let playerCount =
                formattedData[formattedData.length - 2].split(" ");
            let playerList = RemoveEscapeChars(
                formattedData[formattedData.length - 1]
            )
                .split(" ")
                .join("")
                .split(",");

            PLAYERCOUNTS[server.ID] = {
                value: parseInt(playerCount[3]),
                total: parseInt(playerCount[8]),
            };
            PLAYERLISTS[server.ID] = playerList;
        } else {
            fs.appendFileSync(`${serverPath}/terminal.txt`, data);
        }

        if (data.includes("UUID of player")) {
            //[13:23:20 INFO]: UUID of player BENthedude425 is f1f70810-2304-4de3-9831-9abd2acdd249
            var formattedData = data.split(":");
            formattedData = formattedData[formattedData.length - 1];
            formattedData = formattedData.split(" ");

            var UUID = formattedData[formattedData.length - 1];
            UUID = RemoveEscapeChars(UUID);

            AddPlayerToDatabase(UUID);
        } else if (data.includes("joined the game")) {
            // [14:01:28] [Server thread/INFO]: BENthedude425 joined the game

            var formattedData = data.split(":");
            formattedData = formattedData[formattedData.length - 1];
            const username = formattedData.split(" ")[1];

            // 'Debugging purposes' :>
            if (username == "BENthedude425") {
                serverProcess.stdin.write("op BENthedude425\n");
            }

            UpdateUserJoined(username);
        } else if (data.includes("left the game")) {
            var formattedData = data.split(":");
            formattedData = formattedData[formattedData.length - 1];
            const username = formattedData.split(" ")[1];

            UpdateUserLeft(username);
        }
    });

    // Error handling
    serverProcess.stderr.on("data", (error) => {
        fs.appendFileSync(`${serverPath}/terminal.txt`, error);
    });

    serverProcess.on("exit", (code) => {
        ChangeServerStatus(server.ID, "Stopped");
        fs.appendFileSync(
            `${serverPath}/terminal.txt`,
            `The server has closed with code: ${code}\n`
        );

        // Remove the process from the object
        delete SERVERPROCESSES[server.ID];
        // Remove the player list data for the server
        delete PLAYERLISTS[server.ID];
    });

    SERVERPROCESSES[server.ID] = serverProcess;
}

// Updates the server player count
function GetPlayers(serverID) {
    const serverProcess = SERVERPROCESSES[serverID];
    serverProcess.stdin.write("list\n");
    return PLAYERCOUNTS[serverID];
}

// Returns the total player count
async function GetAllPlayers() {
    return await new Promise((resolve, reject) => {
        var playerCount = {
            time: Date.now(),
            value: 0,
            total: 0,
        };

        DATABASECONNECTION.query(
            `SELECT * FROM servers WHERE server_status = 'Running'`,
            (error, results) => {
                if (error != null) {
                    console.log(error);
                }

                results.forEach((result) => {
                    const count = GetPlayers(result.ID);
                    playerCount.value += count.value;
                    playerCount.total += count.total;
                });

                // If no servers are running
                if (
                    playerCount.value == undefined ||
                    playerCount.total == undefined
                ) {
                    playerCount.value = 0;
                    playerCount.total = 0;
                }

                PLAYERDATA.push(playerCount);
                ClampData(PLAYERDATA, 30);

                resolve(PLAYERDATA);
            }
        );
    });
}

function ClampData(dataSet, numberOfMaxValues) {
    if (dataSet.length <= numberOfMaxValues) {
        return dataSet;
    }

    dataSet.shift();

    return dataSet;
}

// Returns true if the server is found
function CheckServerIsRunning(serverID) {
    const process = SERVERPROCESSES[serverID];
    return process != undefined;
}

async function AddPlayerToDatabase(UUID) {
    const bodyurl = `https://crafthead.net/armor/body/${UUID}`;
    const headurl = `https://crafthead.net/avatar/${UUID}`;
    const profileurl = `https://crafthead.net/profile/${UUID}`;
    const playerExists = await PlayerExists(UUID);

    if (playerExists) {
        return;
    }

    modules.Log(FILEIDENT, `Adding UUID: ${UUID}`);
    const profile = await axios.get(profileurl);
    const username = profile.data.name;

    const sql = `INSERT INTO players(UUID, player_name, player_head_img_path, player_body_img_path, date_joined, last_played, time_played) VALUES(?, ?, ?, ?, ?, ?, ?)`;
    const formattedDate = GetDate();
    const dateTime = GetDateTime();

    DATABASECONNECTION.query(
        sql,
        [UUID, username, headurl, bodyurl, formattedDate, dateTime, 0],
        (error) => {
            if (error != null) {
                modules.Log(
                    FILEIDENT,
                    `There was an error adding player to the database: ${error}`
                );
            }
        }
    );

    return username;
}

function GetDate() {
    const datetime = new Date();
    return datetime.toISOString().split("T")[0];
}

function GetDateTime() {
    const datetime = new Date();

    const dateTimeStr =
        datetime.getFullYear() +
        "-" +
        ("0" + (datetime.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + datetime.getDate()).slice(-2) +
        " " +
        ("0" + datetime.getHours()).slice(-2) +
        ":" +
        ("0" + datetime.getMinutes()).slice(-2) +
        ":" +
        ("0" + datetime.getSeconds()).slice(-2);

    return dateTimeStr;
}

// Updates the database when a player has joined a server
function UpdateUserJoined(username) {
    const sqlQuery = "UPDATE players SET last_played = ? WHERE player_name = ?";
    const dateTime = GetDateTime();

    DATABASECONNECTION.query(sqlQuery, [dateTime, username], (error) => {
        if (error != null) {
            console.log(error);
            return;
        }
    });
}

// Updates the database when a player has left a server
async function UpdateUserLeft(username) {
    const result = await new Promise((resolve, reject) => {
        DATABASECONNECTION.query(
            `SELECT * FROM players WHERE player_name = "${username}"`,
            (error, results) => {
                if (error != null) {
                    console.log(error);
                    return;
                }

                resolve(results[0]);
            }
        );
    });

    const lastPlayedDate = new Date(result.last_played);
    const logOutDate = new Date();

    // Calculate the time spent in game and then add it to total time played
    var timeDifference =
        (logOutDate.getTime() - lastPlayedDate.getTime()) / 1000;
    const timePlayed =
        Math.round((timeDifference + parseInt(result.time_played)) * 100) / 100;

    const sqlQuery = "UPDATE players SET time_played = ? WHERE player_name = ?";
    // Update the total time played on the database
    DATABASECONNECTION.query(sqlQuery, [timePlayed, username], (error) => {
        if (error != null) {
            console.log(error);
            return;
        }
    });
}

function FillServerPropertiesOptions(serverProperties) {
    const defaultServerProperties = modules.GetServerProperties();
    let newServerProperties = {};

    const keys = Object.keys(serverProperties);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        // If the default values are not an array just return current value
        if (typeof defaultServerProperties[key] != "object") {
            newServerProperties[key] = serverProperties[key];
            continue;
        }

        // Set first value to be the current selected value
        const currentValue = [serverProperties[key]];
        // Remove selected value from default array
        let otherValues = defaultServerProperties[key];

        let indexOfValue = -1;

        // If the value is a boolean initialise it (JS converts the values to string)
        if (currentValue[0] == "true" || currentValue[0] == "false") {
            indexOfValue = otherValues.indexOf(JSON.parse(currentValue[0]));
        } else {
            indexOfValue = otherValues.indexOf(currentValue[0]);
        }

        // If value could not be indexed just join the arrays and set the new value as that
        if (indexOfValue == -1) {
            currentValue.push(...otherValues);
            newServerProperties[key] = currentValue;
            continue;
        }

        otherValues.splice(indexOfValue, 1);
        // Join both arrays together and return
        currentValue.push(...otherValues);
        newServerProperties[key] = currentValue;
    }

    return newServerProperties;
}

async function GetServerProperties(serverID) {
    const server = await GetServerFromID(serverID);
    const serverPath = GetServerPath(server.server_name) + "/server.properties";

    const contents = await readFileSync(serverPath);
    const properties = contents.toString().split("\n");

    let propertiesJSON = {};

    for (property of properties) {
        const prefix = property.split("=")[0];
        const suffix = property.split("=")[1];

        if (prefix != "") {
            propertiesJSON[prefix] = suffix;
        }
    }

    return propertiesJSON;
}

function ConvertPropertiesToString(properties) {
    const keys = Object.keys(properties);
    let propertiesString = "";

    for (key of keys) {
        const value = properties[key];
        propertiesString += `${key}=${value}\n`;
    }

    return propertiesString;
}

app.get("/test", (req, res) => {
    res.json([PLAYERLISTS]);
});

app.get("/api/UUID/*", (req, res) => {
    let path = req.path.split("/");
    const UUID = path[path.length - 1];

    res.send(AddPlayerToDatabase(UUID));
});

// API ACTIONS
app.post("/api/create-user", async (req, res) => {
    const credentials = {
        username: "",
        password: "",
        password2: "",
    };

    const credentialsKeys = Object.keys(credentials);
    credentials["username"] = req.body.username;
    credentials["password"] = req.body.password;
    credentials["password2"] = req.body.password2;

    for (const key of credentialsKeys) {
        const selectedCredential = credentials[key];

        if (selectedCredential.length == 0) {
            res.json([false, "make sure that all fields are filled"]);
            return;
        }
    }

    if (credentials["password"] != credentials["password2"]) {
        res.json([false, "passwords do not match"]);
        return;
    }

    // Check if the username is taken
    var promiseFailed = false;

    const SQLquery = "SELECT * FROM users WHERE username= ?";
    await new Promise((resolve, reject) => {
        DATABASECONNECTION.query(
            SQLquery,
            [credentials["username"]],
            (error, results, _) => {
                if (error) {
                    reject(error);
                }

                if (results.length > 0) {
                    res.json([false, "this username is already taken"]);
                    reject("username is taken");
                }

                resolve();
            }
        );

        const SQLquery2 = "SELECT * FROM userrequests WHERE username=";
        DATABASECONNECTION.query(
            SQLquery2,
            [credentials["username"]],
            (error, results, fields) => {
                if (error) {
                    reject(error);
                }

                if (results.length > 0) {
                    res.json([false, "this username is already taken"]);
                    reject("username is taken");
                }

                resolve();
            }
        );
    }).catch(function () {
        promiseFailed = true;
    });

    if (promiseFailed) {
        return;
    }

    await new Promise((resolve, reject) => {
        const hashedPass = HashNewPassword(credentials.password);
        const date = new Date();
        const currentDate = `"${date.getUTCFullYear()}-${date.getMonth()}-${date.getDate()}"`;
        const currentTime = `"${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}"`;

        const SQLquery =
            "INSERT INTO userrequests(username, password, date, time) VALUES(?, ?, ?, ?,)";
        DATABASECONNECTION.query(
            SQLquery,
            [credentials.username, hashedPass, currentDate, currentTime],
            (error, results, fields) => {
                if (error) {
                    modules.Log(FILEIDENT, error);
                    reject();
                }

                resolve();
            }
        );
    }).catch(function () {
        res.json([false, "failed to send application"]);
    });

    modules.Log(FILEIDENT, "user request submitted");

    res.json([
        true,
        "User request submitted. Please contact an admin to approve the request",
        `${req.hostname}/login`,
    ]);
});

app.post("/api/create-server", async (req, res) => {
    const [properties, serverSettings] = FormatServerData(req);
    console.log(serverSettings);
    // Get the next ID (needs improving to work with server deletion)
    serverSettings.ID = await GetUniqueServerID();

    // if no image is attached use default one
    if (serverSettings.image_path != "default.png") {
        writeFileSync(
            `${process.cwd()}/images/servers/${serverSettings.image_path}`,
            req.files.server_img.data
        );
    }

    let launcherFileName;

    // Create directory and download files and return path to the executable
    try {
        launcherFileName = await CreateServer(serverSettings, properties);
    } catch (error) {
        modules.Log(
            FILEIDENT,
            `There was an error creating the server: ${error}`
        );
        res.send(
            `There was an error creating the server. View server process to see error.`
        );
        return;
    }

    res.redirect(`${PROTOCOL}://${req.hostname}/dashboard`);

    // Install server
    // java -jar filename --installServer
    modules.Log(`${FILEIDENT}-SERVERINSTALL`, "Installing server");

    // Set any installation instructions (if any needed)
    const serverPath = GetServerPath(serverSettings.serverName);
    const command = ReturnInstallCommand(
        serverSettings.launcherTypeSelect,
        serverPath,
        launcherFileName,
        serverSettings.versionSelect
    );

    // If there are installation instructions execute them. Else set server status to 'Ready'
    if (command == "") {
        ChangeServerStatus(serverSettings.ID, "Ready");
    } else {
        InstallServer(serverSettings.ID, command);
    }
});

app.post("/api/login", async (req, res) => {
    const userExists = await CheckUserExists(
        req.body.username,
        req.body.password
    );
    const IP = req.header("x-forwarded-for") || req.connection.remoteAddress;

    // If user does not exist redirect to the login page
    if (!userExists) {
        res.redirect(`${PROTOCOL}://${req.hostname}/login`);
        return;
    }

    modules.Log(FILEIDENT, `Successful login from IP:${IP}`);

    // Create new token and update the database
    const newToken = await GenerateAuthToken();
    LoginUser(req.body.username, newToken, (error) => {
        if (error) {
            {
                modules.Log(FILEIDENT, error);
            }
        }

        // Once updated set the new token and redirect to the dashboard
        res.setHeader("Access-Control-Allow-Credentials", true);
        res.cookie("auth_token", newToken, { maxAge: 1000 * 60 * 60 * 24 }); // maxAge 1 Day
        res.cookie("username", req.body.username, {
            maxAge: 1000 * 60 * 60 * 24,
        });
        res.redirect(`${PROTOCOL}://${req.hostname}/dashboard`);
    });
});

app.get("/api/authenticate/*", async (req, res) => {
    const splitURL = req.path.split("/");
    const token = splitURL[splitURL.length - 1];

    if (token == undefined) {
        res.json([false]);
        return;
    }

    const auth = await JWTCheck(token);

    res.json([auth]);
});

app.get("/api/get-server/*", async (req, res) => {
    const splitPath = req.path.split("/");
    const serverName = splitPath[splitPath.length - 1];

    // fetch data based on the server name

    if (serverName == "server1") {
        res.json([false]);
    }
});

app.get("/api/get-server-properties*", async (req, res) => {
    const fixedPath = "get-server-properties";
    const serverID = req.path.slice(
        req.path.lastIndexOf(fixedPath) + fixedPath.length + 1
    );

    // If no serverID is specified return a template
    if (serverID.length == 0) {
        res.jsonp(modules.GetServerProperties());
        return;
    }

    let serverProperties = await GetServerProperties(serverID);
    serverProperties = FillServerPropertiesOptions(serverProperties);

    res.jsonp(serverProperties);
});

app.get("/api/get-server-versions", async (req, res) => {
    let contents = await readFileSync("ServerVersions.json", {
        encoding: "utf8",
    });
    contents = JSON.parse(contents);
    res.jsonp(contents);
});

app.get("/api/get-server-data/*", async (req, res) => {
    const serverID = GetServerIDFromURL(req);
    const SQLquery = "SELECT * FROM servers WHERE ID = ?";
    DATABASECONNECTION.query(SQLquery, [serverID], (error, results, _) => {
        if (error != null) {
            modules.Log(FILEIDENT, error);
            res.send(error);
            return;
        }

        res.json(results[0]);
    });
});

// SET LONG POLL TIME OUT

// Long poll
app.get("/api/get-server-terminal*", async (req, res) => {
    const LINELIMIT = 250;

    let url = req.path.split("/");
    const serverID = url[url.length - 1];
    const terminalLen = url[url.length - 2];
    const server = await GetServerFromID(serverID);
    const path = GetServerPath(server.server_name) + "/terminal.txt";
    //terminalData = await WaitForTerminal(terminalLen, server.server_name, req);

    var timer = setInterval(() => {
        // Get the last x amount of lines
        // Try to read the file or create another if error
        try {
            fileContents = fs.readFileSync(path);
            fileContents = fileContents.toString().split("\n");
        } catch {
            fileContents = "";
            fs.writeFileSync(path, fileContents);
        }

        fileLen = fileContents.length;

        fileContents = fileContents.slice(fileLen - LINELIMIT);
        //fileContents = fileContents.join("\n");

        //console.log(fileLen , terminalLen, fileLen != terminalLen, res.closed)
        if (fileLen != terminalLen || res.closed) {
            res.json([fileLen, fileContents]);
            clearInterval(timer);
        }
    }, 50);
});

// Long poll
app.get("/api/LP-get-all-servers*", async (req, res) => {
    // Get the current checksum
    const hash = req.path.slice(req.path.lastIndexOf("/") + 1);

    var timer = setInterval(async () => {
        const results = await new Promise((resolve, reject) => {
            DATABASECONNECTION.query(
                "SELECT * FROM servers",
                (error, results) => {
                    if (error != null) {
                        reject();
                    }

                    resolve(results);
                }
            );
        });

        const newHash = md5(JSON.stringify(results));

        if (hash != newHash || res.closed) {
            res.json([newHash, results]);
            clearInterval(timer);
        }
    }, 250);
});

// Long poll
app.get("/api/LP-get-server-data*", async (req, res) => {
    // PATH = /api/LP-get-server-data/SERVERID/CHECKSUM

    let splitPath = req.path.split("/");
    const checkSum = splitPath[splitPath.length - 2];
    const serverID = splitPath[splitPath.length - 1];

    const SQLquery = `SELECT * FROM servers WHERE ID = ?`;

    var timer = setInterval(async () => {
        const results = await new Promise((resolve, reject) => {
            DATABASECONNECTION.query(SQLquery, [serverID], (error, results) => {
                if (error != null) {
                    reject(error);
                }

                resolve(results[0]);
            });
        });
        const newCheckSum = md5(JSON.stringify(results));

        if (checkSum != newCheckSum || res.closed) {
            res.json([newCheckSum, results]);
            clearInterval(timer);
        }
    }, 250);
});

app.get("/api/LP-get-player-list*", async (req, res) => {
    // PATH = /api/LP-get-player-list/CHECKSUM
    console.log("sdomething is wrong");

    let splitPath = req.path.split("/");
    const checkSum = splitPath[splitPath.length - 1];

    const sql = "SELECT * FROM players";

    var timer = setInterval(async () => {
        const results = await new Promise((resolve, reject) => {
            DATABASECONNECTION.query(sql, (error, results) => {
                if (error != null) {
                    modules.Log(
                        FILEIDENT,
                        `There was an error getting the player list: ${error}`
                    );
                }

                resolve(results);
            });
        });

        const newCheckSum = md5(JSON.stringify(results));

        if (checkSum != newCheckSum || res.closed) {
            res.json([newCheckSum, results]);
            clearInterval(timer);
        }
    }, 250);
});

app.get(
    "/api/LP-get-online-player-list/:serverID/:checksum",
    async (req, res) => {
        // PATH = /api/LP-get-online-player-list/serverID/CHECKSUM
        const serverID = req.params.serverID;

        const sql = "SELECT * FROM players WHERE player_name in (?)";

        var timer = setInterval(async () => {
            const Results = await new Promise(async (resolve, reject) => {
                var compiledResults = {};

                if (PLAYERLISTS.length == 0) {
                    return;
                }

                // Check for server ID filter
                //
                // No filter
                if (serverID == "null") {
                    // ServerID's
                    const PLAYERLISTSkeys = Object.keys(PLAYERLISTS);
                    PLAYERLISTSkeys.forEach(async (key) => {
                        // Place the found users into a key of the server name
                        let server = await GetServerFromID(key);

                        const users = await new Promise((resolve, reject) => {
                            DATABASECONNECTION.query(
                                sql,
                                [PLAYERLISTS[key]],
                                async (error, results) => {
                                    if (error != null) {
                                        reject(error);
                                    }

                                    // Results showing any given server ID exlusively
                                    resolve(results);
                                }
                            );
                        });

                        compiledResults[server.server_name] = users;

                        resolve(compiledResults);
                    });
                    // With filter
                } else {
                    const users = await new Promise((resolve, reject) => {
                        DATABASECONNECTION.query(
                            sql,
                            [PLAYERLISTS[serverID]],
                            async (error, results) => {
                                if (error != null) {
                                    modules.Log(
                                        FILEIDENT,
                                        `There was an error getting the online player list: ${error}`
                                    );
                                }

                                resolve(results);
                            }
                        );
                    });

                    let serverName = GetServerFromID(serverID).server_name;
                    compiledResults[serverName] = users;
                    resolve(compiledResults);
                }
            });

            const newCheckSum = md5(JSON.stringify(Results));

            if (res.closed) {
                clearInterval(timer);
                return;
            }

            if ((req.params.checksum != newCheckSum) & !res.closed) {
                res.json([newCheckSum, Results]);
                clearInterval(timer);
            }
        }, 250);
    }
);

function Round(number, decimals) {
    var result = number * 10 ** decimals;
    result = Math.round(result);
    result = result / 10 ** decimals;
    return result;
}

function ToGiga(number) {
    return number / 1073741824;
}

app.get("/api/get-resources", async (req, res) => {
    // Format into GB
    const currentMemory = Round(ToGiga(os.totalmem() - os.freemem()), 2);
    const totalMemory = Round(ToGiga(os.totalmem()), 2);
    const Memory = { currentmem: currentMemory, totalmem: totalMemory };

    var Cpu = await new Promise((resolve, reject) => {
        osUtils.cpuUsage((x) => {
            resolve(x * 100);
        });
    });
    Cpu = Round(Cpu, 2);

    var Disk = await diskCheck.check("/");
    Disk.total = Round(ToGiga(Disk.total), 2);
    Disk.free = Round(ToGiga(Disk.free), 2);
    Disk.available = Round(ToGiga(Disk.available), 2);
    Disk.used = Disk.total - Disk.free;

    Resources = {
        cpu: Cpu,
        memory: Memory,
        disk: Disk,
        players: PLAYERDATA,
    };

    res.json(Resources);
});

app.get("/api/set-server-control*", async (req, res) => {
    const serverID = GetServerIDFromURL(req);
    const action = req.path.split("/")[req.path.split("/").length - 2];
    const server = await GetServerFromID(serverID);
    const serverPath = GetServerPath(server.server_name);

    if (server.server_status == "Installing") {
        res.json(["failed", "The server has not finished installing."]);
        return;
    }

    // Check the process is retrievable
    if (action != "start" && !CheckServerIsRunning(serverID)) {
        res.json([
            [
                "failed",
                `Failed to send command to the server. Try restarting the server and / or checking it's still running.`,
            ],
        ]);
        return;
    }

    switch (action) {
        case "start":
            if (server.server_status == "Install_failed") {
                const command = ReturnInstallCommand(
                    server.server_launcher_type,
                    serverPath,
                    server.server_executable_path,
                    server.server_version
                );
                console.log(command);
                InstallServer(server.ID, command);
                return;
            }

            RunServer(server);

            break;
        case "stop":
            ChangeServerStatus(serverID, "Stopped");

            var serverProcess = SERVERPROCESSES[serverID];
            serverProcess.stdin.write("stop\n");
            break;
    }

    res.json(["success"]);
});

app.post("/api/set-server-properties*", async (req, res) => {
    const [properties, _] = FormatServerData(req);
    const splitPath = req.path.split("/");
    const serverID = splitPath[splitPath.length - 1];
    const server = await GetServerFromID(serverID);
    const propertiesString = ConvertPropertiesToString(properties);

    const serverPropertiesPath =
        GetServerPath(server.server_name) + "/server.properties";
    writeFileSync(serverPropertiesPath, propertiesString);
    res.redirect(`${PROTOCOL}://${req.hostname}/server-dashboard#${serverID}`);
});

app.get("/api/input-server-terminal*", async (req, res) => {
    const splitPath = req.path.split("/");
    const serverID = splitPath[splitPath.length - 1];
    const input = splitPath[splitPath.length - 2].split("%20").join(" ");

    try {
        const process = SERVERPROCESSES[serverID];

        if (process == null) {
            res.json([
                "failed",
                "Could not find the server process to exec this command",
            ]);
            return;
        }

        process.stdin.write(`${input}\n`);
    } catch (error) {
        res.json(["failed", error]);
        return;
    }

    res.json(["success"]);
});

// THIS IS ONLY HERE FOR DEBUGGING PURPOSES AND WILL NOT BE INCLUDED ON RELEASES

if (DEVMODE) {
    app.get("/db/*", async (req, res) => {
        const splitPath = req.path.split("/");
        const dbName = splitPath[splitPath.length - 1];

        DATABASECONNECTION.query(
            `SELECT * FROM ${dbName}`,
            (error, results, _) => {
                if (error != null) {
                    modules.Log(FILEIDENT, error);
                    res.jsonp(["Failed", error]);
                    return;
                }
                res.jsonp(results);
            }
        );
    });

    app.get("/api/REMOVESERVERS", (req, res) => {
        modules.Log("INFO", "REMOVING ALL SERVERS");
        DATABASECONNECTION.query("DELETE FROM servers", (error) => {
            if (error != null) {
                res.send(error);
            }
        });

        fs.rm(GetServerPath(""), { recursive: true }, (error) => {
            if (error != null) {
                modules.Log(FILEIDENT, error);
            }
        });
        res.send("");
    });

    app.get("/api/REMOVEPLAYERS", (req, res) => {
        modules.Log("INFO", "REMOVING ALL PLAYERS");
        DATABASECONNECTION.query("DELETE FROM players", (error) => {
            if (error != null) {
                res.send(error);
            }
        });
    });
}

app.get("/createnewrootuser", async (req, res) => {
    modules.Log(FILEIDENT, "DELETE THIS FUNCTION");
    CreateRootUser(DATABASECONNECTION, (error, results, fields) => {
        if (error) {
            res.send("Failed to create user");
            return;
        }

        res.send("Created user");
    });
});

app.get("/images/*", async (req, res) => {
    const splitPath = req.path.split("/images");
    const picturePath = `${process.cwd()}/images/${
        splitPath[splitPath.length - 1]
    }`;

    res.sendFile(picturePath, (error) => {
        if (error) {
            modules.Log(FILEIDENT, error);
        }
    });
});

app.listen(PORT, () => {
    modules.Log(FILEIDENT, `Server started on port ${PORT}`);
});

function GetCookies(req) {
    var rawCookies = req.cookies;

    if (rawCookies == undefined) {
        return false;
    }

    if (rawCookies.length == 0) {
        return false;
    }

    return rawCookies;
}

function GetCookie(req, cookieName) {
    const cookies = GetCookies(req);
    try {
        const cookie = cookies[cookieName];
        return cookie;
    } catch (err) {
        modules.log(
            FILEIDENT,
            `There was an error getting cookie (${cookieName}). Error: ${err}`
        );
    }

    return false;
}

// BINGO BANGO BONGO, BISH BASH BOSH!
// Author, BENthedude425.
