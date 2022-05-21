import ast
import json
import re
import time
import pandas as pd

import requests

URL = "https://www.themoviedb.org/person/"

credits = pd.read_csv('../data/credits.csv')
actor_names = dict()
with open('../docs/data/actors_stats.json', 'r') as f:
    top_actors = json.load(f).keys()
for _, r in credits.iterrows():
    for g in ast.literal_eval(r['cast']):
        if g['name'] in top_actors:
            actor_names[g["id"]] = g["name"]

headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
paths = {}
for id in actor_names.keys():
    try:
        actor_url = URL + str(id)
        page = requests.get(actor_url, allow_redirects=True, headers=headers)
        profile_path = re.findall(r'\/t\/p\/w500\/(.*?\.jpg)\"\>', str(page.content))
        if (len(profile_path) > 0):
            paths[id] = profile_path[0]
        print('.', end='')
        time.sleep(.1)
    except:
        print(id)
        continue

with open(f'../data/profile_paths.json', 'w') as f:
        json.dump(paths, f, indent=4)