const express = require("express");
const cors = require("cors");
const mysql2 = require("mysql2");
const app = express();

const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer();

const modules = require("./modules");
const crypto = require("crypto");

const {
    Setup,
    GetRootUserCredentialsFromUser,
    CreateRootUser,
} = require("./setup");


const PORT = 8080;
var DATABASECONNECTION;
var DATABASECONFIGS;

var FILEPATHS;
const FILEPREFIX = modules.GetFilePrefix();
const FILEIDENT = "server.js";

//const FIXEDIPADDRESS = 'http://newhost425.ddns.net:81'
const FIXEDIPADDRESS = "http://localhost";

async function InitialiseDB() {
    await LoadConfigs();

    return mysql2.createConnection(DATABASECONFIGS);
}

async function CheckUserExists(username, password, callback) {
    success = false;
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
                        modules.Cout(FILEIDENT, error);
                    }

                    // If there are no results then the token is unique
                    found = results.length == 0;

                    resolve();
                }
            );
        });
    }

    modules.Cout(FILEIDENT, `Generated new auth token: ${authToken}`);
    return authToken;
}

async function LoadConfigs() {
    // Get the db configs from the save file#
    FILEPATHS = await modules.GetFilePaths();
    DATABASECONFIGS = await modules.GetParsedFile(
        FILEPATHS["Database_configs"]
    );
}

async function INIT() {
    modules.Cout(FILEIDENT, "INIT", true);
    DATABASECONNECTION = await InitialiseDB();
    await Setup();
    modules.Cout(FILEIDENT, "FINISHED INIT", true);
}

// Initialise systems
INIT();

// ---------- APP HANDLERS ---------- \\
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({credentials: true, origin: 'http://localhost'}));
app.use(express.static("public"));

// API ACTIONS

app.post("/api/create-user", async (req, res) => {
    const credentials = {
        username: "",
        password: "",
        password2: "",
    };

    credentials["username"] = req.body.username;
    credentials["password"] = req.body.password;
    credentials["password2"] = req.body.password2;

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
                    modules.Cout(FILEIDENT, error);
                    reject();
                }

                resolve();
            }
        );
    }).catch(function () {
        res.json([false, "failed to send application"]);
    });

    modules.Cout(FILEIDENT, "user request submitted");
    res.json([
        true,
        "User request submitted. Please contact an admin to approve the request",
        `${FIXEDIPADDRESS}/login`,
    ]);
});

app.post("/api/login", async (req, res) => {
    CheckUserExists(
        req.body.username,
        req.body.password,
        async (error, results, fields) => {
            if (error) {
                modules.Cout(FILEIDENT, error);
            }

            newToken = await GenerateAuthToken();

            LoginUser(req.body.username, newToken, (error, results, fields) => {
                if (error) {
                    {
                        modules.Cout(FILEIDENT, error);
                    }
                }

                res.cookie("auth_token", newToken);
                res.redirect(`${FIXEDIPADDRESS}/dashboard`);
            });
        }
    );
});

//

app.get("/api/authenticate/*", async (req, res) => {
    const splitURL = req.path.split("/");
    const token = splitURL[splitURL.length - 1];
    const auth = await JWTCheck(token);

    res.json([auth]);
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
        res.send(results);
    });
});

app.get("/createnewrootuser", async (req, res) => {
    modules.Cout(FILEIDENT, "DELETE THIS FUNCTION");
    CreateRootUser(DATABASECONNECTION, (error, results, fields) => {
        if (error) {
            res.send("Failed to create user");
            return;
        }

        res.send("Created user");
    });
});

app.listen(PORT, () => {
    modules.Cout(FILEIDENT, `server started on port ${PORT}`);
});

function GetCookies(req) {
    var cookies = [];
    try {
        var rawCookies = req.headers.cookie;
        rawCookies = rawCookies.split(";");

        for (const cookie of rawCookies) {
            const cookieParts = cookie.split("=");

            cookies[cookieParts[0]] = cookieParts[1];
        }

        return cookies;
    } catch {
        modules.Cout(FILEIDENT, "FAILED TO AUTHENTICATE USER");
        return false;
    }
}

function GetCookie(req, cookieName) {
    const cookies = GetCookies(req);
    return cookies[cookieName];
}
