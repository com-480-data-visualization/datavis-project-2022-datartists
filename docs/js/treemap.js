/*
 * Treemap class to show actor's movies
 */
class Treemap {
  constructor(container, legend_container, actorName) {
    this.container = d3.select(container);
    this.legend_container = d3.select(legend_container);
    this.data = [];
    this.name = actorName;
    this.margin = {
      top: 5,
      right: 5,
      left: 5,
      bottom: 5,
    };
    // get data then draw
    this.getData().then(() => this.draw());
  }

  // load the data
  getData() {
    return Promise.all([
      d3.json("data/actors_genres_movies.json"),
      d3.json("data/movies.json"),
      d3.json("data/genre_colors.json"),
    ]).then(([data, movies, colors]) => {
      this.data = data;
      this.movies = movies;
      this.color = colors;

      this.genres = Object.keys(this.data[Object.keys(this.data)[0]]);
    });
  }

  // update tree and legend when actor is changed
  update(name) {
    this.name = name;
    this.drawTree();
    this.drawLegend();
  }

  // setup graph and draw graph + legend
  draw() {
    this.svg = this.container.append("svg");
    this.drawLegend();

    this.tooltip = this.container
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    this.drawTree();
  }

  // draw the legend
  drawLegend() {
    $("#treemap-legend").empty();
    const usedGenres = Object.entries(this.data[this.name])
      .filter(([_, ids]) => ids.length)
      .map(([genre, _]) => genre);
    usedGenres.forEach((d) => {
      $("#treemap-legend").append(
        `<div class="flex flex-row items-center mr-2 shrink-0"><div class="w-4 h-4 mr-1" style="background-color: ${this.color[d]}"></div><div>${d}</div></div>`
      );
    });
  }

  // draw the treemap
  drawTree() {
    d3.select(window).on("resize.treemap", () => {
      // deal with resizing
      this.update(this.name);
    });
    const { height, width } = this.container.node().getBoundingClientRect();

    this.svg.attr("width", width).attr("height", height);

    // Compute the treemap layout.
    const actorData = {
      name: this.name,
      children: Object.entries(this.data[this.name])
        .filter(([_, ids]) => ids.length)
        .map(([key, ids]) => ({
          name: key,
          children: ids.map((id) => ({
            // add attributes to each movie
            name: this.movies[id].title,
            value: Math.max(100000, this.movies[id].budget),
            budget: formatMoney(this.movies[id].budget),
            revenue: formatMoney(this.movies[id].revenue),
            vote_average: this.movies[id].vote_average,
            vote_count: this.movies[id].vote_count,
            year: this.movies[id].release_date.split("-")[0],
            poster_path: this.movies[id].poster_path,
          })),
        })),
    };
    const root = d3.hierarchy(actorData);
    root.sum((d) => d.value);

    this.leaves = root.leaves();
    root.sort((a, b) => d3.descending(a.value, b.value));

    // create treemap
    d3
      .treemap()
      .tile(d3.treemapBinary)
      .size([width, height])
      .paddingInner(1)
      .paddingOuter(1)(root);

    const that = this;

    this.svg
      .selectAll("g")
      .data(this.leaves, (l) => l.data.name)
      .join(
        (enter) => {
          // creating new nodes
          const node = enter
            .append("g")
            .on("mouseover", function (ev, n) {
              // reduce square opacity
              d3.select(this)
                .transition()
                .duration("50")
                .attr("opacity", ".85");
              // show tooltip
              that.tooltip
                .transition()
                .duration(50)
                .style("opacity", 1)
                .style("width", 200 + "px");
              that.tooltip.html(
                `<img src='https://image.tmdb.org/t/p/w200/${n.data.poster_path}'>` +
                  "<b>" +
                  n.data.name +
                  "</b>" +
                  "<br>Year: " +
                  n.data.year +
                  "<br>Genre: " +
                  n.parent.data.name +
                  "<br>Budget: " +
                  n.data.budget +
                  "<br>Revenue: " +
                  n.data.revenue +
                  "<br>Rating: " +
                  n.data.vote_average +
                  " (" +
                  n.data.vote_count +
                  " votes)"
              );
              // set tooltip position
              const tooltip_rect = that.tooltip.node().getBoundingClientRect();
              that.tooltip
                .style(
                  "left",
                  Math.min(
                    ev.pageX,
                    $(window).width() - tooltip_rect.width / 2 - 10
                  ) + "px"
                )
                .style("top", ev.pageY - tooltip_rect.height - 10 + "px");
            })
            .on("mousemove", function (ev, n) {
              const tooltip_rect = that.tooltip.node().getBoundingClientRect();
              // update tooltip position
              that.tooltip
                .style(
                  "left",
                  Math.min(
                    ev.pageX,
                    $(window).width() - tooltip_rect.width / 2 - 10
                  ) + "px"
                )
                .style("top", ev.pageY - tooltip_rect.height - 10 + "px");
            })
            .on("mouseout", function (ev, n) {
              // reset square opacity
              d3.select(this).transition().duration("50").attr("opacity", "1");
              // hide tooltip
              that.tooltip.transition().duration("50").style("opacity", 0);
            });

          // add the rectangle
          node
            .append("rect")
            .attr("x", (d) => d.x0)
            .attr("y", (d) => d.y0)
            .transition()
            .duration(1000)
            .attr("width", (d) => d.x1 - d.x0)
            .attr("height", (d) => d.y1 - d.y0)
            .attr("fill", (d, i) => this.color[d.parent.data.name]);

          // add the movie title
          node
            .append("text")
            .attr("id", "movie-title")
            .text((d) => d.data.name)
            .each(function (d) {
              const self = d3.select(this);
              const maxWidth = d.x1 - d.x0 - 5;
              let newSize = resizeText(self, maxWidth, 15, 40);
              // Move the textbox to fit the new size
              self.attr(
                "transform",
                (d) => `translate(${d.x0 + 5},${d.y0 + newSize})`
              );
            })
            .attr("fill", "white");

          // add the movie text
          node
            .append("text")
            .attr("id", "movie-budget")
            .text((d) => d.data.budget)
            .each(function (d) {
              const self = d3.select(this);
              const maxWidth = d.x1 - d.x0 - 5;
              let newSize = resizeText(self, maxWidth, 15, 30);
              // Move the textbox to fit the new size
              let textLength = self.node().getBBox().width;
              self
                .transition()
                .duration(1000)
                .attr(
                  "transform",
                  (d) =>
                    `translate(${d.x0 + maxWidth / 2 - textLength / 2},${
                      d.y1 - 5
                    })`
                );
            })
            .attr("fill", "white");

          return node;
        },
        (update) => {
          // update the rectangles and text with animation
          update
            .select("rect")
            .transition()
            .duration(1000)
            .attr("x", (d) => d.x0)
            .attr("y", (d) => d.y0)
            .attr("width", (d) => d.x1 - d.x0)
            .attr("height", (d) => d.y1 - d.y0);
          update.select("#movie-title").each(function (d) {
            const self = d3.select(this);
            const maxWidth = d.x1 - d.x0 - 5;
            // Reset text
            self.text(d.data.name);
            // Resize text according to maxWidth
            let newSize = resizeText(self, maxWidth, 15, 40);
            // Move the textbox to fit the new size
            self
              .transition()
              .duration(1000)
              .attr(
                "transform",
                (d) => `translate(${d.x0 + 5},${d.y0 + newSize})`
              );
          });
          update.select("#movie-budget").each(function (d) {
            const self = d3.select(this);
            const maxWidth = d.x1 - d.x0 - 5;
            // Reset text
            self.text(d.data.budget);
            // Move the textbox to fit the new size
            let textLength = self.node().getBBox().width;
            self
              .transition()
              .duration(1000)
              .attr(
                "transform",
                (d) =>
                  `translate(${d.x0 + maxWidth / 2 - textLength / 2},${
                    d.y1 - 5
                  })`
              );
          });
          return update;
        }
      );
  }
}

// Fit text into maxWidth while using the largest fontsize between minSize and maxSize
// If the text does not fit with minSize, add ellipsis
function resizeText(textElement, maxWidth, minSize, maxSize) {
  let text = textElement.text();
  let fontSize = maxSize;
  textElement.style("font-size", fontSize + "px");
  let textLength = textElement.node().getBBox().width;
  while (textLength > maxWidth && fontSize > minSize) {
    textElement.style("font-size", fontSize + "px");
    textLength = textElement.node().getBBox().width;
    fontSize--;
  }
  while (textLength > maxWidth && text.length > 0) {
    text = text.slice(0, -1);
    textElement.text(text + "...");
    textLength = textElement.node().getBBox().width;
  }
  return fontSize;
}

// value to formatted currency
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
