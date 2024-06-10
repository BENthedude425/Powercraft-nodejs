const fs = require("fs");


const FILEPREFIX = "data";
const FILEPATHS = {
  Database_configs: "data/DB_config.json",
};


function GetFilePath(){
    return "Files.json"
}

function GetFilePaths(){
    return fs.readFileSync(GetFilePath(),)
}

function GetFilePrefix(){
    return FILEPREFIX;
}

function Cout(fileIDENT, message){
    console.log(`[${String(fileIDENT).toUpperCase()}]     `, message)
}

function GetParsedFile(filepath) {
    return JSON.parse(String(fs.readFileSync(filepath)));
  }
  

module.exports = {
    Cout,
    GetParsedFile,
    GetFilePath,
    GetFilePrefix,
}