import json

with open('../data/poster_paths.json', 'r') as f:
    movies_new_paths = dict(json.load(f))

with open('../docs/data/movies.json', 'r') as f:
    movies = dict(json.load(f))

for id, data in movies.items():
    if id in movies_new_paths:
        data['poster_path'] = movies_new_paths[id]

with open('../docs/data/movies_new_urls.json', 'w') as f:
    json.dump(movies, f)
