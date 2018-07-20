import json
import os
import re

data = []
with open('sinobuz_temp.json') as file:
    song_id = 0
    orig_data = json.load(file)
    for x in orig_data:
        version = list(x.keys())[0]
        songs = x[version]
        sorted_list = sorted(songs, key=lambda p: (p["difficulty"]["3"], p["title"]))
        for song in sorted_list:
            song["id"] = song_id
            song_id += 1
        obj={
            version: sorted_list
        }
        data.append(obj)
print ("Finished reading")

with open('infinitas.json', 'w') as file:
    json.dump(data, file, indent=2, sort_keys=True)
print ("Finished writing")
