const setupSearchBar = () => {
  const options = {
    // Search in `author` and in `tags` array
    keys: ["id"],
  };
  d3.json("data/actor_nodes.json").then((data) => {
    const fuse = new Fuse(data, options);
    const $rbox = $("#search-results");
    $("#search-input").on("input", function () {
      if ($(this).val().length === 0) {
        $rbox.hide();
      } else {
        $rbox.find("*").remove();
        $rbox.width($(this).css("width"));
        const results = fuse.search($(this).val());
        results.slice(0, 10).forEach((r) => {
          $rbox.append(
            `<button class="actor-button px-2 py-1">${r.item.id}</button>`
          );
        });
        $rbox.show();
        const that = this;
        $(".actor-button").on("click", function () {
          window.updateData($(this).text());
          $(that).val("");
          $rbox.hide();
        });
      }
    });
  });
};

const showStats = (name) => {
  const graphs = {
    releases: new TimeBarChart("#actor-stats", name),
    movies: new ComparisonBars("#actor-stats", name, "Total movies", 33.2),
    ratings: new ComparisonBars("#actor-stats", name, "Average rating", 5.84),
    budget: new ComparisonBars(
      "#actor-stats",
      name,
      "Average budget",
      "$11.35M",
      format_money,
      money_to_value
    ),
    revenue: new ComparisonBars(
      "#actor-stats",
      name,
      "Average revenue",
      "$33.45M",
      format_money,
      money_to_value
    ),
  };

  $(".stats-button").removeClass("bg-blue-500 text-white");
  $(".stats-button:first-of-type").addClass("bg-blue-500 text-white");

  $(".stats-button").on("click", function () {
    $(".stats-button").removeClass("bg-blue-500 text-white");
    $(this).addClass("bg-blue-500 text-white");
    const id = $(this).attr("id");
    $("#actor-stats > svg").hide();
    graphs[id].show();
  });

  d3.json("data/actors_stats.json").then((data) => {
    $("#actor-image").append(
      `<img class="object-contain" src="https://image.tmdb.org/t/p/original/${data[name]["profile_path"]}"></img>`
    );

    window.updateStats = (name) => {
      Object.values(graphs).forEach((g) => g.update(name));
      $("#actor-image").empty();
      $("#actor-image").append(
        `<img class="object-contain" src="https://image.tmdb.org/t/p/original/${data[name]["profile_path"]}"></img>`
      );
    };
  });
};

$(document).ready(function () {
  setupSearchBar();
  const name = "Tom Cruise";
  d3.select(".actor-name").html(name);
  const treemap = new Treemap("#treemap", "#treemap-legend", name);
  const network = new NetworkGraph("#network", name);
  showStats(name);

  window.updateData = (name) => {
    d3.select(".actor-name").html(this.name);
    treemap.update(name);
    network.update(name);
    window.updateStats(name);
  };
});
