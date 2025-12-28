const fs = require("fs");
const FILEIDENT = "MODULES";

const MINECRAFTPROPERTIES = {
    "General Game Properties": {
        "allow-flight": {
            options: [false, true],
            description: "Allow players to fly.",
        },
        difficulty: {
            options: ["easy", "medium", "hard", "peaceful"],
            description: "The difficulty of the game.",
        },
        "enable-command-block": {
            options: [false, true],
            description: "Enable command blocks.",
        },
        "force-gamemode": {
            options: [false, true],
            description: "Force the gamemode to be the same as the server's.",
        },
        gamemode: {
            options: ["survival", "creative", "adventure"],
            description: "The default gamemode for new players.",
        },
        hardcore: {
            options: [false, true],
            description: "Enable hardcore mode.",
        },
        "player-idle-timeout": {
            options: 0,
            description: "Time in minutes before an idle player is kicked.",
        },
        pvp: { options: [true, false], description: "Enable PvP." },
    },
    "World Properties": {
        "allow-nether": {
            options: [true, false],
            description: "Allow players to enter the Nether.",
        },
        "simulation-distance": {
            options: 10,
            description: "The distance in chunks to simulate.",
        },
        "view-distance": {
            options: 10,
            description: "The distance in chunks to view.",
        },
        "spawn-animals": {
            options: [true, false],
            description: "Allow animals to spawn.",
        },
        "spawn-monsters": {
            options: [true, false],
            description: "Allow monsters to spawn.",
        },
        "spawn-npcs": {
            options: [true, false],
            description: "Allow NPCs to spawn.",
        },
        "spawn-protection": {
            options: 16,
            description: "The radius of the spawn protection area.",
        },
    },
    "World Generation": {
        "generate-structures": {
            options: [true, false],
            description: "Generate structures like villages and temples.",
        },
        "generator-settings": {
            options: {},
            description: "Settings for world generation.",
        },
        "level-name": {
            options: "world",
            description: "The name of the world.",
        },
        "level-seed": {
            options: "",
            description: "The seed for world generation.",
        },
        "level-type": {
            options: [
                [
                    "minecraft:normal",
                    "minecraft:flat",
                    "minecraft:large_biomes",
                    "minecaft:amplified",
                    "minecraft:single_biome_surface",
                ],
            ],
            description: "The type of world to generate.",
        },
        "max-world-size": {
            options: 29999984,
            description: "The maximum world size.",
        },
    },
    "Whitelist and Operators Properties": {
        "enforce-whitelist": {
            options: [false, true],
            description: "Enforce the whitelist.",
        },
        "white-list": {
            options: [false, true],
            description: "Enable the whitelist.",
        },
        "broadcast-console-to-ops": {
            options: [true, false],
            description: "Broadcast console to ops.",
        },
        "broadcast-rcon-to-ops": {
            options: [true, false],
            description: "Broadcast RCON to ops.",
        },
        "function-permission-level": {
            options: 2,
            description: "Function permission level.",
        },
        "op-permission-level": {
            options: 4,
            description: "Operator permission level.",
        },
    },
    "Connection Properties": {
        "accept-incomming-connections": {
            options: [true, false],
            description: "Accept incoming connections.",
        },
        "accept-transfers": {
            options: [false, true],
            description: "Accept transfers from other servers.",
        },
        "enable-status": {
            options: [true, false],
            description: "Enable status.",
        },
        "enforce-secure-profiles": {
            options: [true, false],
            description: "Enforce secure profiles.",
        },
        "hide-online-players": {
            options: [false, true],
            description: "Hide online players.",
        },
        "max-players": {
            options: 20,
            description: "The maximum number of players.",
        },
        MOTD: {
            options: "A powercraft hosted server!",
            description: "The message of the day.",
        },
        "online-mode": {
            options: [true, false],
            description:
                "Enable online mode. This should remain on unless you are in LAN.",
        },
        "prevent-proxy-connections": {
            options: [false, true],
            description: "Prevent proxy connections.",
        },
        "server-ip": { options: "", description: "The server IP address." },
        "server-port": { options: 25565, description: "The server port." },
        "rate-limit": {
            options: 0,
            description: "The rate limit for connections.",
        },
    },
    "Query Properties": {
        "enable-query": {
            options: [false, true],
            description: "Enable query.",
        },
        "query-port": { options: 25565, description: "The query port." },
    },
    "RCON Properties": {
        "enable-rcon": { options: [false, true], description: "Enable RCON." },
        "rcon.password": { options: "", description: "The RCON password." },
        "rcon.port": { options: 25575, description: "The RCON port." },
    },
    "Resource Pack Properties": {
        "require-resource-pack": {
            options: [false, true],
            description: "Make all players require a resource pack.",
        },
        "resource-pack": { options: "", description: "The resource pack URL." },
        "resource-pack-id": {
            options: "",
            description: "The resource pack ID.",
        },
        "resource-pack-prompt": {
            options: "",
            description: "The resource pack prompt message.",
        },
        "resource-pack-sha1": {
            options: "",
            description: "The SHA1 hash of the resource pack.",
        },
    },
    "Advanced Properties": {
        "bug-report-link": { options: "", description: "The bug report link." },
        debug: { options: [false, true], description: "Enable debug mode." },
        "enable-jmx-monitoring": {
            options: [false, true],
            description: "Enable JMX monitoring.",
        },
        "entity-view-distance": {
            options: 100,
            description: "The entity view distance.",
        },
        "initial-disabled-packs": {
            options: "",
            description: "The initial disabled packs.",
        },
        "initial-enabled-packs": {
            options: "vanilla",
            description: "The initial enabled packs.",
        },
        "log-ips": { options: [true, false], description: "Log IP addresses." },
        "max-chained-neighbor-updates": {
            options: 1000000,
            description: "The maximum chained neighbor updates.",
        },
        "max-tick-time": {
            options: 60000,
            description: "The maximum tick time in milliseconds.",
        },
        "network-compression-threshold": {
            options: 256,
            description: "The network compression threshold in bytes.",
        },
        "pause-when-empty-seconds": {
            options: 60,
            description: "The number of seconds to pause when empty.",
        },
        "region-file-compression": {
            options: "deflate",
            description: "The region file compression type.",
        },
        "sync-chunk-writes": {
            options: [true, false],
            description: "Sync chunk writes.",
        },
        "text-filtering-config": {
            options: "",
            description: "The text filtering configuration.",
        },
        "text-filtering-version": {
            options: 0,
            description: "The text filtering version.",
        },
        "use-native-transport": {
            options: [true, false],
            description: "Use native transport.",
        },
    },
};

const FILEPREFIX = "data";
const FILEPATHS = {
    Database_configs: "data/DataBaseConfigs.json",
};

function GetFilePath() {
    return "Files.json";
}

async function GetFilePaths() {
    return await new Promise((resolve, reject) => {
        if (!fs.existsSync(GetFilePath())) {
            fs.writeFileSync(GetFilePath(), JSON.stringify(FILEPATHS));
        }

        const filePaths = GetParsedFile(GetFilePath());
        resolve(filePaths);
    });
}

function GetFilePrefix() {
    return FILEPREFIX;
}

function GetDefaultServerProperties() {
    return MINECRAFTPROPERTIES;
}

function Log(fileIDENT, message, center = false) {
    const whiteSpaceNumber = "25";
    var whiteSpace = "";

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

    const date = new Date();

    // Format times to be 2 digits long
    let hours =
        date.getHours().toString().length == 1
            ? `0${date.getHours()}`
            : date.getHours();
    let minutes =
        date.getMinutes().toString().length == 1
            ? `0${date.getMinutes()}`
            : date.getMinutes();
    let seconds =
        date.getSeconds().toString().length == 1
            ? `0${date.getSeconds()}`
            : date.getSeconds();

    const timeStamp = `[${hours}:${minutes}:${seconds}]`;

    console.log(`${timeStamp}   ${prefix}${whiteSpace}`, message);
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
    GetDefaultServerProperties,
    DownloadFile,
    DownloadAndSaveFile,
};
