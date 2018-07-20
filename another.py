import json
import os
import re

songs = []
data = {}
with open('2017082800.json') as file:
    data = json.load(file)
    songs = [x for x in data["songs"] if (x['difficulty'] == 3 or x['difficulty'] == 4) and x['style'] == 'single']

song_id = 0
for song in songs:
    song["level"] = int(song["level"])

songs.sort(
    key = lambda l: (l["level"], l["difficulty"])
)

for song in songs:
    song["id"] = song_id
    song.pop('bpm', None)
    song.pop('genre', None)
    song.pop('style', None)
    song_id += 1

with open('test.json', 'w') as file:
    json.dump(songs, file, indent=2, sort_keys=True)
