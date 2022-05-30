import json

with open('../data/profile_paths.json', 'r') as f:
    profiles_new_paths = dict(json.load(f))

with open('../docs/data/actors_stats.json', 'r') as f:
    actor_stats = dict(json.load(f))

for name, path in profiles_new_paths.items():
    if name in actor_stats:
        actor_stats[name]['profile_path'] = path

with open('../docs/data/actors_stats.json', 'w') as f:
    json.dump(actor_stats, f)
