import json
import re
import time

import requests


def clear_line(n=1):
    LINE_UP = '\033[1A'
    LINE_CLEAR = '\x1b[2K'
    for i in range(n):
        print(LINE_UP, end=LINE_CLEAR)


BASE_URL = "https://www.themoviedb.org/movie/"

# Start ID in case the script needs to be restarted
START_ID: str = ''
# List of movie IDs
movies = list(json.load(open('../docs/data/movies.json')).keys())
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
paths = {}
index = movies.index(START_ID or "862")
N_MOVIES = len(movies)
try:
    for movie_id in movies[index:]:
        movie_url = BASE_URL + movie_id
        print(f'{index}/{N_MOVIES}')
        print(f'Getting movie {movie_id}')
        index += 1
        try:
            page = requests.get(movie_url, allow_redirects=True, headers=headers, timeout=10)
        except requests.RequestException:
            print(f'Request error while retrieving movie {movie_id}. Continuing...')
            time.sleep(2)
            continue
        # Get poster URL from page content
        poster_path = re.findall(r'\/t\/p\/w500\/(.*?\.jpg)\"\>', str(page.content))
        if poster_path:
            paths[movie_id] = poster_path[0]
        time.sleep(.1)
        clear_line(2)
finally:
    # Save the current progress in case of an exception
    with open(f'../data/poster_paths{START_ID}.json', 'w') as f:
        json.dump(paths, f, indent=4)
