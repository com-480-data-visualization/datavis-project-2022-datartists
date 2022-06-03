// format value to money
function formatMoney(value) {
  if (value === 0) {
    return "-";
  }
  if (value >= 1e9) {
    return "$" + parseFloat((value / 1e9).toFixed(2)) + "B";
  } else {
    if (value >= 1e6) {
      return "$" + parseFloat((value / 1e6).toFixed(2)) + "M";
    } else {
      if (value >= 1e3) {
        return "$" + parseFloat((value / 1e3).toFixed(2)) + "K";
      } else {
        return "$" + parseFloat(value.toFixed(2));
      }
    }
  }
}

// revert formated money to number
function moneyToValue(money) {
  money = money.slice(1);
  if (money.charAt(money.length - 1) == "M") {
    return parseFloat(money.slice(0, -1)) * 1e6;
  } else if (money.charAt(money.length - 1) == "B") {
    return parseFloat(money.slice(0, -1)) * 1e9;
  } else {
    return parseFloat(money.slice(0, -1)) * 1e3;
  }
}

const setupSearchBar = () => {
  const options = {
    // Search in the id attribute
    keys: ["id"],
  };
  d3.json("data/actor_nodes.json").then((data) => {
    // load actors data then use Fuse to search
    const fuse = new Fuse(data, options);
    const $rbox = $("#search-results");
    // show search results
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

// show stats graphs
const showStats = (name) => {
  // create all stats graphs
  const graphs = {
    releases: new TimeBarChart("#actor-stats", name), // by default shown
    movies: new ComparisonBars("#actor-stats", name, "Total movies", 33.2),
    ratings: new ComparisonBars("#actor-stats", name, "Average rating", 5.84),
    budget: new ComparisonBars(
      "#actor-stats",
      name,
      "Average budget",
      "$11.35M",
      formatMoney,
      moneyToValue
    ),
    revenue: new ComparisonBars(
      "#actor-stats",
      name,
      "Average revenue",
      "$33.45M",
      formatMoney,
      moneyToValue
    ),
  };

  // by default highlight the release button
  $(".stats-button").removeClass("bg-blue-500 text-white");
  $(".stats-button:first-of-type").addClass("bg-blue-500 text-white");

  // show the appropriate graph on button click
  $(".stats-button").on("click", function () {
    $(".stats-button").removeClass("bg-blue-500 text-white");
    $(this).addClass("bg-blue-500 text-white");
    const id = $(this).attr("id");
    $("#actor-stats > svg").hide();
    graphs[id].show();
  });

  d3.json("data/actors_stats.json").then((data) => {
    // add actor image
    $("#actor-image").append(
      `<img class="object-contain" src="https://image.tmdb.org/t/p/original/${data[name]["profile_path"]}"></img>`
    );

    // stats graphs + actor image update function
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
  // setup search bar
  setupSearchBar();
  // set first actor name
  const name = "Tom Cruise";
  // display name
  d3.select(".actor-name").html(name);
  // draw treemap, network and stats graphs
  const treemap = new Treemap("#treemap", "#treemap-legend", name);
  const network = new NetworkGraph("#network", name);
  showStats(name);

  // set window function to update the graphs for a new actor
  window.updateData = (name) => {
    d3.select(".actor-name").html(this.name);
    treemap.update(name);
    network.update(name);
    window.updateStats(name);
  };
});
