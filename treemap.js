let genres;

function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        // `DOMContentLoaded` already fired
        action();
    }
}

whenDocumentLoaded(() => {

    const actor_name = "Adam Adele"
    let charactersViz
    d3.json("/data/data.json").then(function (json) {
        console.log(json)
        const actor = json.actors.find(actor => actor.name === actor_name)
        console.log(actor)
        const movies = json.movies.filter(movie => movie.id in actor.movies)
        console.log(movies)
        genres = json.genres

        charactersViz = visualizeMoviesTreeMap(movies)
        charactersViz.render()
    });

});
const font_config = {
    "font": {
        "family": ["-apple-system", "system-ui", "BlinkMacSystemFont", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
        "weight": 400
    }
};

function visualizeMoviesTreeMap(movies) {
    return new d3plus.Treemap()
        .select('#treemap')
        .data(movies)
        .label(movie => movie.title)
        //.color(movie => genres.find(function(genre){return genre.id === movie.genres[0]}).color)
        .sum("budget")
}
