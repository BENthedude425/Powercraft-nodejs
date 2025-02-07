const fs = require("fs");
const FILEIDENT = "MODULES";

const MINECRAFTPROPERTIES = {
    "enable-jmx-monitoring": [false, true],
    "rcon.port": 25575,
    "level-seed": "",
    "gamemode": ["survival", "creative", "adventure"],
    "enable-command-block": [false, true],
    "enable-query": [false, true],
    "enforce-secure-profiles": [true, false],
    "level-name": "world",
    "motd": "A powercraft hosted server!",
    "query-port": 25565,
    "pvp": [true, false],
    "generate-structures": [true, false],
    "max-chained-neighbor-updates": 1000000,
    "difficulty": ["easy", "medium", "hard", "peaceful"],
    "network-compression-threshold": 256,
    "max-tick-time": 60000,
    "require-resource-pack": [false, true],
    "use-native-transport": [true, false],
    "max-players": 20,
    "online-mode": [true, false],
    "enable-status": [true, false],
    "allow-flight": [false, true],
    "initial-disabled-packs": "",
    "broadcast-rcon-to-ops": [true, false],
    "view-distance": 10,
    "server-ip": "",
    "resource-pack-prompt": "",
    "allow-nether": [true, false],
    "server-port": 25565,
    "enable-rcon": [false, true],
    "sync-chunk-writes": [true, false],
    "op-permission-level": 4,
    "prevent-proxy-connections": [false, true],
    "hide-online-players": [false, true],
    "resource-pack": "",
    "entity-broadcast-range-percentage": 100,
    "simulation-distance": 10,
    "rcon.password": "",
    "player-idle-timeout": 0,
    "force-gamemode": [false, true],
    "rate-limit": 0,
    "hardcore": [false, true],
    "white-list": [false, true],
    "broadcast-console-to-ops": [true, false],
    "spawn-npcs": [true, false],
    "spawn-animals": [true, false],
    "log-ips": [true, false],
    "function-permission-level": 2,
    "initial-enabled-packs": "vanilla",

    "level-type": [
        "minecraft:normal",
        "minecraft:flat",
        "minecraft:large_biomes",
        "minecaft:amplified",
        "minecraft:single_biome_surface",
    ],
    "text-filtering-config": "",
    "spawn-monsters": [true, false],
    "enforce-whitelist": [false, true],
    "spawn-protection": 16,
    "resource-pack-sha1": "",
    "max-world-size": 29999984,
};

const FILEPREFIX = "data";
const FILEPATHS = {
    Database_configs: "data/DB_config.json",
};

function GetFilePath() {
    return "Files.json";
}

function GetFilePaths() {
    if (!fs.existsSync(GetFilePath())) {
        fs.writeFileSync(GetFilePath(), JSON.stringify(DEFAULTFILEPATHS));
    }

    const filePaths = GetParsedFile(GetFilePath());
    return filePaths;
}

function GetFilePrefix() {
    return FILEPREFIX;
}

function GetServerProperties() {
    return MINECRAFTPROPERTIES;
}

function Log(fileIDENT, message, center = false) {
    whiteSpaceNumber = "25";
    whiteSpace = "";

    prefix = `[${String(fileIDENT).toUpperCase()}]`;

    // If message is a string capitalise the first letter
    if (typeof message == "string") {
        message = message[0].toUpperCase() + message.slice(1);
    }

    for (i = 0; i < whiteSpaceNumber - prefix.length; i++) {
        whiteSpace += " ";
    }

    if (center) {
        message = CenterText(message);
    }

    console.log(`${prefix}${whiteSpace}`, message);
}

function CenterText(text) {
    const fixedMessageLen = 55;
    const messageLen = (fixedMessageLen - text.length) / 2;
    side = "";
    extra = "";

    for (i = 0; i < messageLen; i++) {
        side += "-";
    }

    if (Number.isInteger(messageLen)) {
        extra = "-";
    }

    return side + text + side + extra;
}

function GetParsedFile(filepath) {
    return JSON.parse(String(fs.readFileSync(filepath)));
}

async function DownloadFile(URL) {
    return await fetch(URL).then((res) => res.blob());
}

async function DownloadAndSaveFile(URL, downloadPath) {
    Log(FILEIDENT, `Downloading file from: ${URL}`);
    const fileContents = await DownloadFile(URL);

    var buffer = await fileContents.arrayBuffer();
    buffer = Buffer.from(buffer);

    fs.createWriteStream(downloadPath).write(buffer);
    Log(FILEIDENT, `File Downloaded`);
}

module.exports = {
    Log,
    GetParsedFile,
    GetFilePath,
    GetFilePaths,
    GetFilePrefix,
    GetServerProperties,
    DownloadFile,
    DownloadAndSaveFile,
};
