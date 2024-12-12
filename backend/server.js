express = require("express");
const cors = require("cors");
const mysql2 = require("mysql2");
const app = express();

const sleep = require("system-sleep");

const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

const modules = require("./modules");
const crypto = require("crypto");
const fs = require("fs");

const { Setup, CreateRootUser } = require("./setup");
const { readFileSync, writeFileSync } = require("fs");
const { exec } = require("child_process");
const { resolve } = require("path");

const PORT = 8080;
var DATABASECONNECTION;
var DATABASECONFIGS;

var FILEPATHS;
const FILEPREFIX = modules.GetFilePrefix();
const FILEIDENT = "server.js";

//const FIXEDIPADDRESS = 'http://newhost425.ddns.net:81'
//const FIXEDIPADDRESS = "http://localhost";
const FIXEDIPADDRESS = "http://192.168.0.62";

// An object containing all of the running server processes
const SERVERPROCESSES = {};

async function InitialiseDB() {
    await LoadConfigs();

    return mysql2.createConnection(DATABASECONFIGS);
}

async function CheckUserExists(username, password, callback) {
    hashedPass = HashNewPass(password);
    DATABASECONNECTION.query(
        `SELECT * FROM users WHERE username='${username}' AND password='${hashedPass}'`,
        callback
    );
}

async function JWTCheck(token) {
    return new Promise((resolve, reject) => [
        DATABASECONNECTION.query(
            `SELECT * FROM users WHERE auth_token='${token}'`,
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
    DATABASECONNECTION.query(
        `UPDATE users SET auth_token='${newToken}' WHERE username='${username}'`,
        callback
    );

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

        await new Promise((resolve, reject) => {
            DATABASECONNECTION.query(
                `SELECT * FROM users WHERE auth_token='${authToken}'`,
                (error, results, fields) => {
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
    modules.Log(FILEIDENT, "FINISHED INIT", true);
}

// Initialise systems
INIT();

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
    return new Promise((resolve, reject) => {
        DATABASECONNECTION.query(
            `SELECT * FROM servers WHERE ID = ${serverID}`,
            (error, results, _) => {
                if (error != null) {
                    modules.Log(error);
                }

                resolve(results[0]);
            }
        );
    });
}

function GetUniqueServerID() {
    return new Promise((resolve, reject) => {
        DATABASECONNECTION.query(
            `SELECT * FROM servers`,
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
    DATABASECONNECTION.query(
        `UPDATE servers SET server_status = "${newStatus}" WHERE ID = ${serverID}`,
        (error) => {
            if (error != null) {
                modules.Log(FILEIDENT, error);
            }
        }
    );
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

    if (launcherType == "Forge") {
        const forgeRelease = serverSettings.forgeReleaseSelect;

        for (let i = 0; i < link.length; i++) {
            const selectedLink = link[i];
            if (selectedLink.release == forgeRelease) {
                link = selectedLink.link;
                launcherFileName = `forge-${version}-${selectedLink.release}.jar`;
                break;
            }
        }
    } else {
        launcherFileName = `${link.file}.jar`;
        link = link.link;
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
    await DownloadAndSaveFile(link, launcherFilePath);

    // Update server status to installing
    ChangeServerStatus(serverID, "Installing");
    return launcherFileName;
}

async function DownloadFile(URL) {
    return await fetch(URL).then((res) => res.blob());
}

async function DownloadAndSaveFile(URL, downloadPath) {
    modules.Log(FILEIDENT, `Downloading file from: ${URL}`);
    const fileContents = await DownloadFile(URL);

    var buffer = await fileContents.arrayBuffer();
    buffer = Buffer.from(buffer);

    fs.createWriteStream(downloadPath).write(buffer);
    modules.Log(FILEIDENT, `File Downloaded`);
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
    await new Promise((resolve, reject) => {
        DATABASECONNECTION.query(
            `SELECT * FROM USERS WHERE username='${credentials["username"]}'`,
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

        DATABASECONNECTION.query(
            `SELECT * FROM userrequests WHERE username='${credentials["username"]}'`,
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

        DATABASECONNECTION.query(
            `INSERT INTO userrequests(username, password, date, time) VALUES("${credentials["username"]}", "${hashedPass}", ${currentDate}, ${currentTime})`,
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

    const serverPath = GetServerPath(serverSettings.server_name);

    // Create entry in the table
    DATABASECONNECTION.query(
        `INSERT INTO servers(id, server_name, server_icon_path, server_executable_path, server_launcher_type, server_version, forge_release, server_status) VALUES (${serverSettings.ID}, "${serverSettings.server_name}", "${serverSettings.image_path}", "${serverPath}/${launcherFileName}", "${serverSettings.launcherTypeSelect}", "${serverSettings.versionSelect}", "${serverSettings.forgeReleaseSelect}", "downloading")`,
        (error, results, fields) => {
            if (error != null) {
                modules.Log(error);
            }
        }
    );

    if (serverSettings.launcherType == "Forge") {
        const terminalLogPath = `${serverPath}/terminal.txt`;
        const command = `cd ${serverPath} && java -jar ${launcherFileName} --installServer`;
        const installer_process = exec(command);

        installer_process.stdout.on("data", (data) => {
            fs.appendFileSync(terminalLogPath, data);
        });

        installer_process.stderr.on("data", (data) => {
            fs.appendFileSync(terminalLogPath, data);
        });

        installer_process.on("exit", (code) => {
            modules.Log(`${FILEIDENT}-SERVERINSTALL`, "Install complete");
            fs.appendFileSync(terminalLogPath, `Install complete! \n`);
            ChangeServerStatus(serverSettings.ID, "ready");
        });
    } else {
        ChangeServerStatus(serverSettings.ID, "ready");
    }

    res.redirect(`${FIXEDIPADDRESS}/dashboard`);
});

app.post("/api/login", async (req, res) => {
    CheckUserExists(
        req.body.username,
        req.body.password,
        async (error, results, fields) => {
            if (error) {
                modules.Log(FILEIDENT, error);
            }

            newToken = await GenerateAuthToken();

            if (results.length == 0) {
                res.redirect(`${FIXEDIPADDRESS}/login`);
                return;
            }

            LoginUser(req.body.username, newToken, (error, results, fields) => {
                if (error) {
                    {
                        modules.Log(FILEIDENT, error);
                    }
                }

                modules.Log(FILEIDENT, "logged in user");
                res.cookie("auth_token", newToken, { maxAge: 9999999 });
                res.redirect(`${FIXEDIPADDRESS}/dashboard`);
            });
        }
    );
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
    DATABASECONNECTION.query(
        `SELECT * FROM servers WHERE ID = ${serverID}`,
        (error, results, _) => {
            if (error != null) {
                modules.Log(FILEIDENT, error);
                res.send(error);
                return;
            }

            res.send(results);
        }
    );
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

    // Check the process is retrievable
    if (action != "start") {
        try {
            const process = SERVERPROCESSES[serverID];
            if (process == null) {
                res.json([
                    ["failed",
                    `Could not find the server process. More advanced response needs to be put in place here though, lol`,]
                ]);
                return;
            }
        } catch (error) {
            res.json(["failed", error]);
            return;
        }
    }

    switch (action) {
        case "start":
            ChangeServerStatus(serverID, "running");
            // get the file name automatically
            const command = `cd ${serverPath} && java -jar Spigot-1.20.4.jar`;
            var serverProcess = exec(command);

            serverProcess.stdout.on("data", (data) => {
                fs.appendFileSync(`${serverPath}/terminal.txt`, data);
            });

            serverProcess.stderr.on("data", (data) => {
                fs.appendFileSync(`${serverPath}/terminal.txt`, data);
            });

            serverProcess.on("exit", (code) => {
                fs.appendFileSync(
                    `${serverPath}/terminal.txt`,
                    `The server has closed with code: ${code}\n`
                );
                // Remove the process from the object
                SERVERPROCESSES[serverID] = null;
            });

            SERVERPROCESSES[serverID] = serverProcess;
            break;
        case "stop":
            ChangeServerStatus(serverID, "stopped");

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
            return
        }

        process.stdin.write(`${input}\n`);
    } catch (error) {
        res.json(["failed", error]);
        return;
    }

    res.json(["success"]);
});

// Get Data from database

app.get("/db/*", async (req, res) => {
    const splitPath = req.path.split("/");
    const db = splitPath[splitPath.length - 1];

    // Check that the user is JWT authenticated
    const token = GetCookie(req, "auth_token");
    const auth = await JWTCheck(token);

    if (!auth) {
        res.json(["Failed to authenticate!"]);
        return;
    }

    DATABASECONNECTION.query(`SELECT * FROM ${db}`, (err, results, fields) => {
        res.jsonp(results);
    });
});

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
    modules.Log(FILEIDENT, `server started on port ${PORT}`);
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
