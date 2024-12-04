const express = require("express");
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

const PORT = 8080;
var DATABASECONNECTION;
var DATABASECONFIGS;

var FILEPATHS;
const FILEPREFIX = modules.GetFilePrefix();
const FILEIDENT = "server.js";

//const FIXEDIPADDRESS = 'http://newhost425.ddns.net:81'
//const FIXEDIPADDRESS = "http://localhost";
const FIXEDIPADDRESS = "http://192.168.0.62";

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

function GetServerPath(serverName) {
    const path = `${process.cwd()}/../servers/${serverName}`;
    return path;
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
    let sources = await readFileSync("Output.json", { encoding: "utf8" });
    sources = JSON.parse(sources);

    const serverName = serverSettings.server_name;
    const launcherType = serverSettings.launcherTypeSelect;
    const version = serverSettings.versionSelect;

    let launcherFileName = ""
    let link = sources[launcherType];
    link = link[version];

    if (launcherType == "Forge") {
        const forgeRelease = serverSettings.forgeReleaseSelect;

        for (let i = 0; i < link.length; i++) {
            const selectedLink = link[i];
            if (selectedLink.release == forgeRelease) {
                link = selectedLink.link;
                launcherFileName = `forge-${version}-${selectedLink.release}.jar`
                break;
            }
        }
    }else{
        const launcherFileName = link.file;
        link = link.link;
    }


    console.log(launcherFileName)    
    console.log(link)
    
    
    // Get all paths for files
    const path = GetServerPath(serverName);
    const propertiesPath = `${path}/server.properties`;
    const launcherFilePath = `${path}/${launcherFileName}`;

    // Create the server directory
    CreateServerDir(serverName);
    // Create the properties file
    await fs.writeFileSync(propertiesPath, propertiesString);
    // download jar file

    const fileContents = await DownloadFile(link);
    var buffer = await fileContents.arrayBuffer();
    buffer = Buffer.from( buffer)
    fs.createWriteStream(launcherFilePath).write(buffer);

    //await fs.writeFileSync(launcherFilePath, fileContents);
}

async function DownloadFile(URL) {
    return await fetch(URL).then((res) => res.blob());
}

app.post("/api/create-server", async (req, res) => {
    const [properties, serverSettings] = FormatServerData(req);
    console.log(serverSettings.image_path);
    const ID = await new Promise((resolve, reject) => {
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

    // if no image is attached use default one
    if (serverSettings.image_path != "default.png") {
        writeFileSync(
            `${process.cwd()}/images/${serverSettings.image_path}`,
            req.files.server_img.data
        );
    }

    // Create entry in the table
    DATABASECONNECTION.query(
        `INSERT INTO servers(id, server_name, server_directory, server_icon_path) VALUES (${ID}, "${serverSettings.server_name}", "${serverSettings.server_name}", "${serverSettings.image_path}")`,
        (error, results, fields) => {
            if (error != null) {
                modules.Log(error);
            }
        }
    );

    CreateServer(serverSettings, properties);

    // add server to sql db
    // create a directory
    // create properties file
    // download jar file

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
    const splitPath = req.path.split("/");
    const serverName = splitPath[splitPath.length - 1];

    // fetch data based on the server name

    if (serverName == "server1") {
        res.json([false]);
    }
});

app.get("/api/get-server-properties", async (req, res) => {
    res.jsonp(modules.GetServerProperties());
});

app.get("/api/get-server-versions", async (req, res) => {
    let contents = await readFileSync("Output.json", { encoding: "utf8" }); // Change to get the data from an endpoint
    contents = JSON.parse(contents);
    res.jsonp(contents);
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

//  URL STRUCT "/api/servers/'servername'/page"
