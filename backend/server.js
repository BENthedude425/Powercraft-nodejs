express = require("express");
const cors = require("cors");
const mysql2 = require("mysql2");
const app = express();
const os = require("os");
const osUtils = require("os-utils");

const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

const modules = require("./modules");
const crypto = require("crypto");
const fs = require("fs");

const { Setup, CreateRootUser } = require("./setup");
const { readFileSync, writeFileSync } = require("fs");
const { exec } = require("child_process");
const md5 = require("md5");

var DATABASECONNECTION;
var DATABASECONFIGS;
var FILEPATHS;

const DEVMODE = true;
const PORT = 8081;
const FILEIDENT = "server.js";

// Needed for redirections on the frontend
const FIXEDIPADDRESS = "http://test.powercraft.uk:81";
//const FIXEDIPADDRESS = "http://192.168.0.62";

// An object containing all of the running server processes
const SERVERPROCESSES = {};

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

async function CheckUserExists(username, password) {
    const SQLquery = "SELECT * FROM users WHERE username= ? AND password= ?";
    hashedPass = HashNewPass(password);

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
    const SQLquery = "SELECT * FROM users WHERE auth_token= ?";
    return new Promise((resolve, reject) => [
        DATABASECONNECTION.query(
            SQLquery,
            [token],
            (error, results, fields) => {
                if (error) {
                    reject();
                }

                resolve(results.length > 0);
            }
        ),
    ]);
}

function HashNewPass(pass) {
    return crypto.createHash("sha256").update(pass).digest("hex");
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

async function INIT() {
    modules.Log(FILEIDENT, "INIT", true);
    DATABASECONNECTION = await InitialiseDB();
    await Setup();

    await SetAllServersStopped();
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

                resolve();
            }
        );
    });
}

// ---------- APP HANDLERS ---------- \\
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ credentials: true, origin: FIXEDIPADDRESS }));
app.use(express.static("public"));
app.use(fileUpload());

// Returns path for a servers directory
function GetServerPath(serverName) {
    const path = `${process.cwd()}/../servers/${serverName}`;
    return path;
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

function CreateServerDir(serverName) {
    const serversDir = GetServerPath("");
    const serverPath = GetServerPath(serverName);

    if (!fs.existsSync(serversDir)) {
        fs.mkdirSync(serversDir);
    }

    fs.mkdirSync(serverPath);
    modules.Log(FILEIDENT, "Servers directory created.");
    CreateServerDir;
    return true;
}

async function CreateServer(serverSettings, properties) {
    // DELETE
    const propertiesString = ConvertPropertiesToString(properties);
    let sources = await readFileSync("Output.json", { encoding: "utf8" });
    sources = JSON.parse(sources);

    const serverID = serverSettings.ID;
    const serverName = serverSettings.server_name;
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
    const path = GetServerPath(serverName);
    const propertiesPath = `${path}/server.properties`;
    const terminalPath = `${path}/terminal.txt`;
    const eulaPath = `${path}/eula.txt`;
    const launcherFilePath = `${path}/${launcherFileName}`;

    // Create the server directory\
    CreateServerDir(serverName);

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
            serverSettings.server_name,
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
    ChangeServerStatus(serverID, "Installing");
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
            return `cd ${serverPath} && java -jar ${server.server_executable_path} nogui`;
        default:
            return `cd ${serverPath} && ${server.server_executable_path}`;
    }
}

// Takes a server object and runs it
function RunServer(server) {
    const executableName = server.server_executable_path;
    const serverID = server.ID;
    const serverPath = GetServerPath(server.server_name);

    ChangeServerStatus(serverID, "Running");

    const command = ReturnRunCommand(server);
    var serverProcess = exec(command);

    serverProcess.stdout.on("data", (data) => {
        fs.appendFileSync(`${serverPath}/terminal.txt`, data);
    });

    serverProcess.stderr.on("data", (data) => {
        fs.appendFileSync(`${serverPath}/terminal.txt`, data);
    });

    serverProcess.on("exit", (code) => {
        ChangeServerStatus(serverID, "Stopped");
        fs.appendFileSync(
            `${serverPath}/terminal.txt`,
            `The server has closed with code: ${code}\n`
        );
        // Remove the process from the object
        SERVERPROCESSES[serverID] = null;
    });

    SERVERPROCESSES[serverID] = serverProcess;
}

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

    const SQLquery = "SELECT * FROM USERS WHERE username= ?";
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
        const hashedPass = HashNewPass(credentials.password);
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
        `${FIXEDIPADDRESS}/login`,
    ]);
});

app.post("/api/create-server", async (req, res) => {
    const [properties, serverSettings] = FormatServerData(req);

    // Get the next ID (needs improving to work with server deletion)
    serverSettings.ID = await GetUniqueServerID();

    // if no image is attached use default one
    if (serverSettings.image_path != "default.png") {
        writeFileSync(
            `${process.cwd()}/images/${serverSettings.image_path}`,
            req.files.server_img.data
        );
    }

    res.redirect(`${FIXEDIPADDRESS}/dashboard`);

    // Create directory and download files and return path to the executable
    const launcherFileName = await CreateServer(serverSettings, properties);

    // Install server
    // java -jar filename --installServer
    modules.Log(`${FILEIDENT}-SERVERINSTALL`, "Installing server");

    // Set any installation instructions (if any needed)
    const serverPath = GetServerPath(serverSettings.server_name);
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

function ConvertPropertiesToString(properties) {
    const keys = Object.keys(properties);
    let propertiesString = "";

    for (key of keys) {
        const value = properties[key];
        propertiesString += `${key}=${value}\n`;
    }

    return propertiesString;
}

app.post("/api/login", async (req, res) => {
    const userExists = await CheckUserExists(
        req.body.username,
        req.body.password
    );

    // If user does not exist redirect to the login page
    if (!userExists) {
        res.redirect(`${FIXEDIPADDRESS}/login`);
        return;
    }

    // Create new token and update the database
    const newToken = await GenerateAuthToken();
    LoginUser(req.body.username, newToken, (error) => {
        if (error) {
            {
                modules.Log(FILEIDENT, error);
            }
        }

        // Once updated set the new token and redirect to the dashboard
        res.cookie("auth_token", newToken, { maxAge: 1000 * 60 * 60 * 24 }); // maxAge 1 Day
        res.redirect(`${FIXEDIPADDRESS}/dashboard`);
    });
});

app.get("/api/authenticate/*", async (req, res) => {
    const splitURL = req.path.split("/");
    const token = splitURL[splitURL.length - 1];

    if (token == "undefined") {
        res.json([false]);
        return;
    }

    const auth = await JWTCheck(token);

    res.json([auth]);
});

app.get("/api/get-server/*", async (req, res) => {
    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

    const splitPath = req.path.split("/");
    const serverName = splitPath[splitPath.length - 1];

    // fetch data based on the server name

    if (serverName == "server1") {
        res.json([false]);
    }
});

app.get("/api/get-server-properties*", async (req, res) => {
    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

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

app.get("/api/get-server-versions", async (req, res) => {
    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

    let contents = await readFileSync("Output.json", { encoding: "utf8" }); // Change to get the data from an endpoint
    contents = JSON.parse(contents);
    res.jsonp(contents);
});

app.get("/api/get-server-data/*", async (req, res) => {
    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

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
    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

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
            fileContents = "Terminal is empty";
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
app.get("/api/get-all-servers/*", async (req, res) => {
    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

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
app.get("/api/LP-get-server-data/*", async (req, res) => {
    // PATH = /api/LP-get-server-data/SERVERID/CHECKSUM

    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

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

function Round(number, decimals) {
    var result = number * 10 ** decimals;
    result = Math.round(result);
    result = result / 10 ** decimals;
    return result;
}

app.get("/api/get-resources", async (req, res) => {
    // Format into GB
    const freeMemory = Round(os.freemem() / 1073741824, 2);
    const totalMemory = Round(os.totalmem() / 1073741824, 2);
    const Memory = { freemem: freeMemory, totalmem: totalMemory };

    var cpu = await new Promise((resolve, reject) => {
        osUtils.cpuUsage((x) => {
            resolve(x * 100);
        });
    });
    cpu = Round(cpu, 2);

    Resources = {
        cpu: cpu,
        memory: Memory,
    };

    res.json(Resources);
});

// Returns true if the server is found
function CheckServerIsRunning(serverID) {
    const process = SERVERPROCESSES[serverID];
    return process != undefined;
}

app.get("/api/set-server-control*", async (req, res) => {
    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

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
    res.redirect(`${FIXEDIPADDRESS}/server-dashboard/${serverID}`);
});

app.get("/api/input-server-terminal*", async (req, res) => {
    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

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
        modules.Log("WARNING", "REMOVING ALL SERVERS");
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
    const splitPath = req.path.split("/");
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
