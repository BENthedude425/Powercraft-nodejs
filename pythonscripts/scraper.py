import os
import json
import requests
from threading import Thread
import time

STARTTIME = time.time()
cwd = os.getcwd()

observedthreadcount = 0
THREADCOUNT = 0

spigotURL = "https://getbukkit.org/download/spigot"
vanillaURL = "https://mcversions.net/"
forgeURL = "https://files.minecraftforge.net/net/minecraftforge/forge/"

spigotdata      = []
spigotdownloads = []
spigotversions  = []

vanilladata         = []
vanilladownloads    = []
vanillaversions     = []

forgedata         = []
forgedownloads    = []
forgepages        = []
forgeversions     = []

def readlines(filename):
    file = open(path(filename), "r")
    content = file.readlines()
    file.close()
    return content

def createthread(threadfunc, args):
    global THREADCOUNT
    thread = Thread(target = threadfunc, args=args )
    thread.start()
    THREADCOUNT += 1

def path(path):
    return (cwd + "/pythonscripts/" + path)

def fetchpage(url):
    return requests.get(url).text

def savepage(url, path):
    html = fetchpage(url)
    file = open(path(path), "w")
    file.write(html)
    file.close()

# -- SPIGOT -- #

def getspigot():
    global THREADCOUNT
    contents = readlines("spigot.html")

    for line in contents:
        splitline = line.split(" ")
        for segment in splitline:
            segment = segment.strip()
            if(segment.startswith("<h2>") and segment.endswith("</h2>")):
                spigotversions.append(line[4:-6])
            if(segment.startswith('href="https://getbukkit.org/get')):
                spigotdownloads.append(line[9: -40])

    for download in spigotdownloads:
        index = spigotdownloads.index(download)
        createthread(handlegetspigot, (download, index))
        max = len(spigotdownloads)

        print(f"Fetching spigot servers: {index}/{max} ({THREADCOUNT})")

def handlegetspigot(download, index):
    global THREADCOUNT
    http = fetchpage(download)
    httplines = http.split(">")
    
    for line in httplines:
        splitline = line.split(" ")
        for segment in splitline:
            if(segment.startswith('href="https://download.getbukkit.org/spigot') or segment.startswith('href="https://cdn.getbukkit.org/spigot')):
                spigotdownloads[index] = segment[6: -3]

    THREADCOUNT -= 1
    
def processspigot():
    for download in spigotdownloads:
        index = spigotdownloads.index(download)
        createthread(handleprocessspigot, (download, index))
        max = len(spigotdownloads)
        print(f"Processing vanilla servers: {index}/{max} ({THREADCOUNT})")

def handleprocessspigot(download, index):
    global THREADCOUNT
    http = fetchpage(download)
    http = http.split("\n")
    
    for line in http:
        line = line.strip()
        if(line.startswith('<a href="') and line.endswith(".jar</a>")):
            spigotdownloads[index] = line[9: line.index(">")]

    THREADCOUNT -= 1

# -- VANILLA -- #

def getvanilla():
    contents = fetchpage(vanillaURL) 
    contents = contents.split(">")

    for line in contents:
        if(line.startswith('<div class="item flex items-center p-3 border-b border-gray-700 snap-start ncItem" id="')):
            linesplit = line.split(" ")
            for segment in linesplit:
                if(segment.startswith("id=")):
                    vanillaversions.append(segment[4: -1])

        elif(line.startswith('<a class="text-xs whitespace-nowrap py-2 px-3 bg-green-700 hover:bg-green-900 rounded text-white no-underline font-bold transition-colors duration-200" href="/download/')):
            vanilladownloads.append( "https://mcversions.net" + line[158: -1])
        

    for download in vanilladownloads:
        global THREADCOUNT
        index = vanilladownloads.index(download)
        createthread(handlegetvanilla, (download, index))
        
        max = str(len(vanilladownloads))
        print(f"Fetching vanilla servers: {index}/{max} ({THREADCOUNT})")

def handlegetvanilla(download, index):
    html = fetchpage(download)
    html = html.split(">")
    for line in html:
        linesplit = line.split(" ")
        
        for segment in linesplit:
            if(segment.startswith("href=\"https://mcversions.net/download")):
                vanilladownloads[index] = segment[6: -1]
            elif("download minecraft" in segment.lower()):
                vanillaversions.append(segment)

    global THREADCOUNT
    THREADCOUNT -= 1

def processvanilla():
    global THREADCOUNT
    for download in vanilladownloads:
        index = vanilladownloads.index(download)
        createthread(handleprocessvanilla, (download, index))

        max = len(vanilladownloads)
        print(f"Processing vanilla servers: {index}/{max} ({THREADCOUNT})")

def handleprocessvanilla(download, index):
    global THREADCOUNT
    http = fetchpage(download)
    httplines = http.split(">")

    for line in httplines:
        splitline = line.split(" ")
        for segment in splitline:
            if(segment.startswith('href="https://piston-data.mojang.com/v1/objects/')):
                vanilladownloads[index] = segment[6: -1]

    THREADCOUNT -= 1

# -- FORGE -- #

def getforge():
    global THREADCOUNT
    content = fetchpage(forgeURL)
    content = content.split(">")

    for line in content:
        splitline = line.split(" ")
        for segment in splitline:
            if(not segment.startswith('href="index')):continue

            url = segment[6: -1]
            version = segment[12: -6]
            
            forgeversions.append([version, []])
            forgepages.append(url)

    for page in forgepages:
        forgedownloads.append([])
        index = forgepages.index(page)
        createthread(handlegetforge, (page, index))
        max = len(forgepages)
        
        print(f"Searching forge server versions: {index}/{max} ({THREADCOUNT})")



def handlegetforge(download, index):
    global THREADCOUNT
    content = fetchpage(forgeURL + download)
    content = content.split(">")
    
    
    for line in content:    
        splitline = line.split(" ")
        for segment in splitline:
            if(not line.startswith('<a href="') or not segment.endswith('installer.jar"')):
                continue

            url = segment[6: ]        
            if(url.startswith('https://adfoc.us/serve/sitelinks/?id=271228&url=')):
                url = url[len("https://adfoc.us/serve/sitelinks/?id=271228&url="): ]

            version = url[58: url.index("/", 58)].split("-")   
            forgedownloads[index].append(url)

            forgeversions[index][1].append(version[1])
            #forgeversions[version[0]].append(version[1])

    THREADCOUNT -= 1
    amount = len(forgedownloads[index])
                


def writeoutput():
    data = []
    data.append({"spigot": spigotdata})
    data.append({"vanilla": vanilladata})
    data.append({"forge": forgedata})

    file = open(path("output.json"), "w")
    json.dump(data, file, indent=4)
    file.close()

def mergeall():
    for download in vanilladownloads:
        index = vanilladownloads.index(download)
        version = vanillaversions[index]

        vanilladata.append({
            "version": version,
            "url": download
        })

    for download in spigotdownloads:
        index = spigotdownloads.index(download)
        version = spigotversions[index]

        spigotdata.append({
            "version": version,
            "url": download
        })

    for version in forgeversions:
        index1 = forgeversions.index(version)
        forgedata.append([version[0], []])

        for subversion in version[1]:
            index2 = version[1].index(subversion)
            
            forgedata[index1][1].append({
                "version": subversion,
                "url": forgedownloads[index1][index2]
            })

def waitforthreads():
    global THREADCOUNT
    global observedthreadcount
    while(THREADCOUNT > 0):
        if(observedthreadcount != THREADCOUNT):
            print("Waiting on remaining threads: (" + str(THREADCOUNT) + ")")
            observedthreadcount = THREADCOUNT              

getvanilla()
getspigot()
getforge()

waitforthreads()

processvanilla()
processspigot()

waitforthreads()

mergeall()

writeoutput()


print("Done (" + str(round(time.time() - STARTTIME, 2)) + "s)")