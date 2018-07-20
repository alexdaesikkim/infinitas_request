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

def get_song(difficulty, title, artist, genre, bpm, default):
    global song_count
    key = title + " " + artist + " " + bpm
    if key not in song_dict:
        data = {
            "title": title,
            "artist": artist,
            "genre": genre,
            "bpm": bpm,
            "difficulty": difficulty,
            "default": default,
            "id": 0
        }
        song_dict[key] = True
        song_count = song_count + 1
        return data
    else:
        return "already exists"

leggendaria = "LEGGENDARIA"
leggendaria_mark = "†"
hcn = "(HCN Ver.)"

def parse_raw(rows):
    count = 0
    version_id = 0
    version_songs = []
    version = ""
    for row in rows:
        cols = row.find_all('td')
        if len(cols) == 1:
            if(re.match("beatmania", cols[0].text)):
                #if(version != ""):
                    #songs[version]["count"] = count
                    #count = 0
                if(version != ""):
                    d = {
                        "version": version,
                        "version_id": version_id,
                        "count": len(version_songs),
                        "songs": version_songs
                    }
                    songs.append(d)
                    version_id += 1
                version = cols[0].text
                if(version.endswith(" ▲ ▼ △")):
                    version = version[:-6]
                if(version.endswith(" ▲ △") or version.endswith(" ▼ △")):
                    version = version[:-4]
                version_songs = []
        if len(cols) == 12:
            count += 1
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
            print(version)
            if(cols[0].text != ''):
                default = False
            if title.endswith(leggendaria_mark) or title.endswith(leggendaria):
                print("when did this leak into the game LOL")
            elif not title.endswith(hcn):
                if title.startswith('[N]'):
                    data = get_song(difficulty, "Evans", artist, genre, bpm, default)
                    version_songs.append(data)
                else:
                    data = get_song(difficulty, title, artist, genre, bpm, default)
                    version_songs.append(data)
    d = {
        "version": version,
        "version_id": version_id,
        "count": len(version_songs),
        "songs": version_songs
    }
    songs.append(d)
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
    print("success")
    # have to count both
    # huge chance new list might have more versions
    old_index = 0
    for new_index in range(len(songs)):
        if(data_songs[old_index]["version"] != songs[new_index]["version"]):
            for n in range(len(songs[new_index]["songs"])):
                songs[new_index]["songs"][n]["id"] = n
            new_index += 1
        elif(data_songs[old_index]["count"] != songs[new_index]["count"]):
            new_id = data_songs[old_index]["count"]
            o = 0
            for n in range(songs[new_index]["count"]):
                if(o >= data_songs[old_index]["count"] or data_songs[old_index]["songs"][o]["title"] != songs[new_index]["songs"][n]["title"]):
                    songs[new_index]["songs"][n]["id"] = new_i
                    new_id += 1
                else:
                    songs[new_index]["songs"][n]["id"] = data_songs[old_index]["songs"][o]["id"]
                    o += 1
            old_index += 1
else:
    for version in range(len(songs)):
        for index in range(songs[version]["count"]):
            songs[version]["songs"][index]["id"] = index

final_data = {
    "id": "beatmaniaiidxINFINITAS",
    "songs": songs
}

with open('src/client/app/infinitas.json', 'w') as file:
    json.dump(final_data, file, indent=2, sort_keys=True)
print("Finished updating .json file")