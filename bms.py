import json
import os
import re
from urllib.request import urlopen
from bs4 import BeautifulSoup
from selenium import webdriver

songs = []

def get_song(song_id, title, artist, genre, level):
    data = {
        "id": song_id,
        "title": title,
        "artist": artist,
        "genre": genre,
        "level": level
    }
    songs.append(data)


def get_url(level):
    base_url = "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=search&type=insane&exlevel="+ str(level) +"&7keys=1"
    return base_url


levels = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,99]
song_id = 0

for level in levels:
    url = get_url(level)
    song_page = urlopen(url)
    table = BeautifulSoup(song_page, "html5lib").find('tbody')
    song_rows = table.find_all('tr')
    del song_rows[0]
    for row in song_rows:
        col = row.find_all('td')
        title = col[2].text
        artist = col[3].text
        genre = col[1].text
        get_song(song_id, title, artist, genre, level)
        song_id += 1
    print("Parsed level " + str(level))


final_data = {
    "songs": songs
}

with open('./insane_bms.json', 'w') as file:
    json.dump(final_data, file, indent=2, sort_keys=True)
print ("Finished")
