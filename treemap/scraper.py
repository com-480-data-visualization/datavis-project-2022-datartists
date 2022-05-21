import json
import re
import time

import requests
from bs4 import BeautifulSoup

URL = "https://www.themoviedb.org/movie/"

START_ID = "862"
movies = list(json.load(open('../docs/data/movies.json')).keys())
headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
paths = {}
for id in movies[movies.index(START_ID or "862"):]:
    try:
        movie_url = URL +id
        page = requests.get(movie_url, allow_redirects=True, headers=headers)
        poster_path = re.findall(r'\/t\/p\/w500\/(.*?\.jpg)\"\>', str(page.content))
        if (len(poster_path) > 0):
            paths[id] = poster_path[0]
        time.sleep(.2)
    except:
        print(id)
        continue

with open(f'data/poster_paths{START_ID}.json', 'w') as f:
        json.dump(paths, f, indent=4)