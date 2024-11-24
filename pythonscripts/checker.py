import os, time, json

lines = []

cwd = os.getcwd()

file = open((cwd + "/pythonscripts/output.json"), "r")
contents = file.readlines()
file.close()

for line in contents:
    found = False
    for foundline in lines:
        if foundline[0] == line:
            foundline[1] += 1
            found = True
        
    if not found:
        lines.append([line, 1])

for line in lines:
    index = lines.index(line)
    if line[1] == 1:
        del lines[index]

for line in lines:
    if line[1] == 1:
        print("still slipping")
        lines.remove(line)




file = open(cwd + "/pythonscripts/f.txt", "w+")
for line in lines:
    file.write(json.dumps(line) + "\n")
file.close()