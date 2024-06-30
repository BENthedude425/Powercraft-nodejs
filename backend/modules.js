const fs = require("fs");


const FILEPREFIX = "data";
const FILEPATHS = {
  Database_configs: "data/DB_config.json",
};


function GetFilePath(){
    return "Files.json"
}

function GetFilePaths () {
    if (!fs.existsSync(GetFilePath())) {
      fs.writeFileSync(modules.GetFilePath(), JSON.stringify(DEFAULTFILEPATHS))
    }
  
    const filePaths = GetParsedFile(GetFilePath())
    return filePaths
  }

function GetFilePrefix(){
    return FILEPREFIX;
}

function Cout(fileIDENT, message, center=false){
  whiteSpaceNumber = "25"
  whiteSpace = ""

  prefix = `[${String(fileIDENT).toUpperCase()}]`

  for(i = 0; i < whiteSpaceNumber - prefix.length; i++){
    whiteSpace += " "
  }

  if(center){
    message = CenterText(message)
  }

  console.log(`${prefix}${whiteSpace}`, message)
}

function CenterText(text){
  const fixedMessageLen = 55
  const messageLen = (fixedMessageLen - text.length) / 2
  side = ""
  extra = ""


  for(i = 0; i < messageLen; i++){
     side += "-"
  }

if(Number.isInteger(messageLen)){
    extra = "-"
  }

  return side + text + side + extra
}

function GetParsedFile(filepath) {
    return JSON.parse(String(fs.readFileSync(filepath)));
}
  

module.exports = {
    Cout,
    GetParsedFile,
    GetFilePath,
    GetFilePaths,
    GetFilePrefix,
}