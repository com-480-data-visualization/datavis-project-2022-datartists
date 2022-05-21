import ast
import json

import pandas as pd

with open('profile_paths.json', 'r') as f:
    profiles_new_paths = dict(json.load(f))

with open('docs/data/actors_stats.json', 'r') as f:
    actor_stats = dict(json.load(f))

credits = pd.read_csv('data/credits.csv')
actor_names = dict()
with open('docs/data/actors_stats.json', 'r') as f:
    top_actors = json.load(f)
print(top_actors['Tom Hanks'])

for _, r in credits.iterrows():
    for g in ast.literal_eval(r['cast']):
        if g['name'] in top_actors.keys():
            actor_names[g["id"]] = g["name"]
print(actor_names[31])
for id, path in profiles_new_paths.items():
    name = actor_names[int(id)]
    if name in actor_stats:
        actor_stats[name]['profile_path'] = path

with open(f'docs/data/actor_stats_profiles.json', 'w') as f:
    json.dump(actor_stats, f)
