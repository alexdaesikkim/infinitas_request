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


sinobuz_version_url = "http://bemaniwiki.com/index.php?beatmania%20IIDX%2024%20SINOBUZ"
main_page = urlopen(sinobuz_version_url)
version_name = BeautifulSoup(main_page, "html5lib").findAll('strong', text=re.compile("^LDJ:J:A:A:"))[0].text[-10:]

sinobuz_new_url = "http://bemaniwiki.com/index.php?beatmania%20IIDX%2024%20SINOBUZ%2F%BF%B7%B6%CA%A5%EA%A5%B9%A5%C8"
sinobuz_old_url = "http://bemaniwiki.com/index.php?beatmania%20IIDX%2024%20SINOBUZ%2F%B5%EC%B6%CA%A5%EA%A5%B9%A5%C8"

page_new = urlopen(sinobuz_new_url)
page_old = urlopen(sinobuz_old_url)

print ("Opened pages")

song_new_table = BeautifulSoup(page_new, "html5lib").find('div', class_='ie5')
song_old_table = BeautifulSoup(page_old, "html5lib").find_all('div', class_='ie5')[1]

sinobuz_new_rows = song_new_table.find_all('tr')
sinobuz_old_rows = song_old_table.find_all('tr')

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
    if len(col) != 1 and level != '-':
        index = len(level)-1
        end_index = index
        while (level[index] != ']'):
            index = index-1
        level = level[index+1:len(level)]
    elif level == '-':
        level = "-1"
    return int(level)

leggendaria = "LEGGENDARIA"
leggendaria_mark = "†"
hcn = "(HCN Ver.)"

all_songs = []

song_id = 0

def parse_raw(rows, version):
    global song_id
    first = 0
    songs = []
    leggendaria = False
    for row in rows:
        cols = row.find_all('td')
        if version != "beatmania IIDX 24 SINOBUZ" and len(cols) == 1:
            if(re.match("beatmania", cols[0].text) and not leggendaria):
                if(len(songs) > 0):
                    obj = {
                        version: songs
                    }
                    all_songs.append(obj)
                    songs = []
                version = cols[0].text
                if(version.endswith(" ▲ ▼ △")):
                    version = version[:-6]
                if(version.endswith(" ▲ △") or version.endswith(" ▼ △")):
                    version = version[:-4]
            if(re.match("LEGGENDARIA", cols[0].text)):
                version = "LEGGENDARIA"
                leggendaria = True
                obj = {
                    version: songs
                }
                all_songs.append(obj)
                songs = []
        if len(cols) == 11:
            #basic
            #if it ends in leggendaria, there's only another difficulty
            #if it ends with hcn just nope
            title = cols[9].text
            artist = cols[10].text
            genre = cols[8].text
            bpm = cols[7].text
            key = title + " " + artist + " " + version + " " + bpm
            if key not in song_dict:
                data = {
                    "title": title,
                    "artist": artist,
                    "genre": genre,
                    "bpm": bpm,
                    "difficulty":{
                        "0": get_level(cols[0]),
                        "1": get_level(cols[1]),
                        "2": get_level(cols[2]),
                        "3": get_level(cols[3])
                    }
                }
                songs.append(data);
                print(data["difficulty"]["3"])
                song_dict[key] = True
    obj = {
        version: songs
    }
    all_songs.append(obj)
    return

parse_raw(sinobuz_old_rows, "")
parse_raw(sinobuz_new_rows, "beatmania IIDX 24 SINOBUZ")

print ("Writing json")

#remember to change the datetime to the one from the page, not on the date it was update on the app's server
with open('sinobuz.json', 'w') as file:
    json.dump(all_songs, file, indent=2, sort_keys=True)
print ("Finished")
