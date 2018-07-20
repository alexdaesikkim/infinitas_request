import datetime
import json
import os
import re
from urllib.request import urlopen
from bs4 import BeautifulSoup


#problem: how to solve overlapping issues?
#1. can use local dict and keep track, but will double the memory size (3000ish max)
#2. somehow use json properties? but how to do this?
#3. use dict to store all data, then convert it to json later?

cb_version_url = "http://bemaniwiki.com/index.php?beatmania%20IIDX%2025%20CANNON%20BALLERS"
main_page = urlopen(cb_version_url)
version_name = BeautifulSoup(main_page, "html5lib").findAll('strong', text=re.compile("^LDJ:J:B:A:"))[0].text[-10:]
print(version_name)

infinitas_url = "http://bemaniwiki.com/index.php?beatmania%20IIDX%20INFINITAS%2F%C1%B4%B6%CA%A5%EA%A5%B9%A5%C8"

page_infinitas = urlopen(infinitas_url)

print ("Opened pages")

song_table = BeautifulSoup(page_infinitas, "html5lib").find_all('div', class_='ie5')[2]

infinitas_rows = song_table.find_all('tr')

print ("Parsed pages")

songs = []

song_dict = {}

#solution: use dictionary, have title + difficulty (in plain text, i.e. SPA) as the key
#REMINDER: leggendarias are separate difficulty due to reasons
#also, remove (HCN ver.) before creating key

#reminder to self for DDR: BSP, two of them exist. differentiate beginner

print ("Grabbing data...")

def get_level(col):
    level = col.text
    if level == '9*2' or level == '9*3':
        level = 9
    elif len(col) != 1 and level != '-' and level != '' and len(col) != 0 and level[0] != '-':
        index = len(level)-1
        end_index = index
        while (level[index] != ']'):
            index = index-1
        level = level[index+1:len(level)]
    elif level[0] == '-' or level == '':
        level = -1
    return int(level)

diff_options = {
    0: "basic",
    1: "novice",
    2: "hyper",
    3: "another",
    4: "leggendaria"
}

song_count = 0

def get_song(difficulty, version, title, artist, genre, bpm, default):
    global song_count
    key = title + " " + artist + " " + version + " " + bpm
    if key not in song_dict:
        data = {
            "title": title,
            "artist": artist,
            "genre": genre,
            "bpm": bpm,
            "difficulty": difficulty,
            "version": version,
            "default": default,
            "id": 0
        }
        song_dict[key] = True
        songs.append(data)
        song_count = song_count + 1

leggendaria = "LEGGENDARIA"
leggendaria_mark = "†"
hcn = "(HCN Ver.)"

def parse_raw(rows):
    for row in rows:
        cols = row.find_all('td')
        if len(cols) == 1:
            if(re.match("beatmania", cols[0].text)):
                version = cols[0].text
                if(version.endswith(" ▲ ▼ △")):
                    version = version[:-6]
                if(version.endswith(" ▲ △") or version.endswith(" ▼ △")):
                    version = version[:-4]
        if len(cols) == 12:
            #basic
            #if it ends in leggendaria, there's only another difficulty
            #if it ends with hcn just nope
            title = cols[10].text
            artist = cols[11].text
            genre = cols[9].text
            bpm = cols[8].text
            difficulty = {
                "0": get_level(cols[1]),
                "1": get_level(cols[2]),
                "2": get_level(cols[3]),
                "3": get_level(cols[4])
            }
            default = True
            if(cols[0].text != ''):
                default = False
            if title.endswith(leggendaria_mark) or title.endswith(leggendaria):
                print("when did this leak into the game LOL")
            elif not title.endswith(hcn):
                if title.startswith('[N]'):
                    get_song(difficulty, version, "Evans", artist, genre, bpm, default)
                else:
                    get_song(difficulty, version, title, artist, genre, bpm, default)
    return

parse_raw(infinitas_rows)

print ("Writing json")


#there will be json attached to the redis that'll check which one is 'unlocked' or not
#go through the main data and see if id is filled
#if not then assign id
if os.path.isfile("src/client/app/infinitas.json"):
    data_songs = {}
    count = 0
    with open('src/client/app/infinitas.json') as file:
        data = json.load(file)
        data_songs = data["songs"]
        count = data["songcount"]
    print("success")
    x = 0
    c = count
    for y in range(song_count):
        if x >= count or (data_songs[x]["title"] != songs[y]["title"]):
            songs[y]["id"] = c
            c += 1
        else:
            songs[y]["id"] = data_songs[x]["id"]
            x += 1
        print(str(x) + " " + str(y))
else:
    for x in range(song_count):
        songs[x]["id"] = x

final_data = {
    "id": "beatmaniaiidxINFINITAS",
    "songcount": song_count,
    "songs": songs
}

with open('src/client/app/infinitas.json', 'w') as file:
    json.dump(final_data, file, indent=2, sort_keys=True)
print("Finished updating .json file")
