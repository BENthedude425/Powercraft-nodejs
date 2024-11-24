import  requests
import os

cwd = os.getcwd()

def path(path):
    return (cwd + "/pythonscripts/" + path)


spigot = "https://getbukkit.org/download/spigot"
vanilla = "https://mcversions.net/"
forge = "https://files.minecraftforge.net/net/minecraftforge/forge/"

html = requests.get(forge).text

file = open(path("forge.html"), "w")
file.write(html)
file.close()