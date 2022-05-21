import ast
import json
import re
import time

import pandas as pd
import requests


def clear_line(n=1):
    LINE_UP = '\033[1A'
    LINE_CLEAR = '\x1b[2K'
    for i in range(n):
        print(LINE_UP, end=LINE_CLEAR)


BASE_URL = "https://www.themoviedb.org/person/"

# Start ID in case the script needs to be restarted
START_ID = None
credits_df = pd.read_csv('../data/credits.csv')
actor_names = dict()
with open('../docs/data/actors_stats.json', 'r') as f:
    top_actors = json.load(f).keys()
for _, r in credits_df.iterrows():
    for g in ast.literal_eval(r['cast']):
        if g['name'] in top_actors:
            actor_names[g["id"]] = g["name"]
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
paths = {}
actor_ids = list(actor_names.keys())
index = actor_ids.index(START_ID or 31)
N_ACTORS = len(actor_ids)
try:
    for actor_id in actor_ids[index:]:
        movie_url = BASE_URL + str(actor_id)
        print(f'{index}/{N_ACTORS}')
        print(f'Getting actor {actor_id}')
        index += 1
        try:
            page = requests.get(movie_url, allow_redirects=True, headers=headers, timeout=10)
        except requests.RequestException:
            print(f'Request error while retrieving movie {actor_id}. Continuing...')
            time.sleep(2)
            continue
        # Get poster URL from page content
        poster_path = re.findall(r'\/t\/p\/w500\/(.*?\.jpg)\"\>', str(page.content))
        if poster_path:
            paths[actor_id] = poster_path[0]
        time.sleep(.1)
        clear_line(2)
finally:
    # Save the current progress in case of an exception
    actor_name_path = {actor_names.get(k): v for k, v in paths.items() if k in actor_names}
    with open(f'../data/profile_paths{START_ID or ""}.json', 'w') as f:
        json.dump(actor_name_path, f, indent=4)
