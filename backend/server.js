express = require("express");
const cors = require("cors");
const mysql2 = require("mysql2");
const app = express();

const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

const modules = require("./modules");
const crypto = require("crypto");
const fs = require("fs");

const { Setup, CreateRootUser } = require("./setup");
const { readFileSync, writeFileSync } = require("fs");
const { exec } = require("child_process");

var DATABASECONNECTION;
var DATABASECONFIGS;
var FILEPATHS;

const DEVMODE = false;
const PORT = 8080;
const FILEIDENT = "server.js";

//const FIXEDIPADDRESS = 'http://newhost425.ddns.net:81'
//const FIXEDIPADDRESS = "http://localhost";
const FIXEDIPADDRESS = "http://192.168.0.62";

// An object containing all of the running server processes
const SERVERPROCESSES = {};
const DEFAULTEXECUTABLEFILE = {
    Forge: "run.bat",
    Spigot: "run.bat",
    Vanilla: "",
};

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
    var properties = "";
    var serverSettings = {};

    for (key of bodyKeys) {
        if (key.startsWith("property:")) {
            properties += key.slice(9, key.length) + "=" + req.body[key] + "\n";
        } else {
            serverSettings[key] = req.body[key];
        }
    }

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

    await SetAllServersStopped()
    modules.Log(FILEIDENT, "FINISHED INIT", true);
}

// Initialise systems
INIT();

async function SetAllServersStopped(){
    return await new Promise((resolve, reject) =>{
        DATABASECONNECTION.query(
            `SELECT * FROM servers WHERE server_status = 'Running'`,
            (error, results, _) =>{
                if (error != null){
                    modules.Log(FILEIDENT, error)
                }

                for(result of results){
                    DATABASECONNECTION.query(
                        `UPDATE servers SET server_status = 'Stopped' WHERE ID = ${result.ID}`,
                        (error) => {
                            if(error != null){
                                modules.Log(FILEIDENT, error)
                            }else{
                                modules.Log(FILEIDENT, `Stopped server: "${result.server_name}". This server may have suffered data corruption or loss.`)
                            }
                        } 
                    )
                }

                resolve()
            }
        )
    })
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

async function CreateServer(serverSettings, propertiesString) {
    // DELETE
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
    await fs.writeFileSync(terminalPath, "");

    // Agree to the eula
    await fs.writeFileSync(eulaPath, "eula=true");

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
            const newExecPath =
                DEFAULTEXECUTABLEFILE[server.server_launcher_type];
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
    const serverPath = GetServerPath(server.server_name)

    switch (fileExtension) {
        case ".jar":
            return `cd ${serverPath} && java -jar ${server.server_executable_path}`;
        default:
            return `cd ${serverPath} && ${server.server_executable_path}`
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
        ChangeServerStatus(serverID, "Stopped")
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

    // Create directory and download files and return path to the executable
    const launcherFileName = await CreateServer(serverSettings, properties);

    // Install server
    // java -jar filename --installServer
    modules.Log(`${FILEIDENT}-SERVERINSTALL`, "Installing server");

    const SQLquery =
        "INSERT INTO servers(id, server_name, server_icon_path, server_executable_path, server_launcher_type, server_version, forge_release, server_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    // Create entry in the table
    DATABASECONNECTION.query(
        SQLquery,
        [
            serverSettings.ID,
            serverSettings.server_name,
            serverSettings.image_path,
            launcherFileName,
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

    res.redirect(`${FIXEDIPADDRESS}/dashboard`);
});

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

app.get("/api/get-server-properties", async (req, res) => {
    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

    res.jsonp(modules.GetServerProperties());
});

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

        res.send(results);
    });
});

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
        fileContents = fs.readFileSync(path);
        fileContents = fileContents.toString().split("\n");

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
            console.log(server.server_status);
            if (server.server_status == "Install_failed") {
                console.log(server);
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

app.get("/api/get-all-servers", async (req, res) => {
    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

    DATABASECONNECTION.query("SELECT * FROM servers", (error, results) => {
        if (error != null) {
            res.jsonp(["Failed", error]);
            return;
        }

        res.jsonp(results);
    });
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

// Review if servers table is necessary or if any data needs to be added into any tables

// BINGO BANGO BONGO, BISH BASH BOSH!
// Author, BENthedude425.
