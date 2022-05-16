class Treemap {
  constructor(container) {
    this.container = d3.select(container);
    this.data = [];
    this.margin = {
      top: 5,
      right: 5,
      left: 5,
      bottom: 5,
    };
  }

  getData() {
    return Promise.all([
      d3.json("data/actors_genres_movies.json"),
      d3.json("data/movies.json"),
    ]).then(([data, movies]) => {
      this.data = data;
      this.movies = movies;

      const genres = Object.keys(this.data[Object.keys(this.data)[0]]);
      this.color = d3.scaleOrdinal(genres, d3.schemeTableau10);
    });
  }

  update(name) {
    this.name = name;
    this.draw_tree();
  }

  draw(name) {
    this.name = name;
    this.svg = this.container.append("svg").style("font-size", 12);

    this.tooltip = this.container
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    this.draw_tree();
  }

  draw_tree() {
    d3.select(window).on("resize.treemap", () => {
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
            name: this.movies[id].title,
            value: Math.max(100000, this.movies[id].budget),
          })),
        })),
    };
    const root = d3.hierarchy(actorData);
    root.sum((d) => d.value);

    this.leaves = root.leaves();
    root.sort((a, b) => d3.descending(a.value, b.value));

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
          const node = enter
            .append("g")
            .on("mouseover", function (ev, n) {
              d3.select(this)
                .transition()
                .duration("50")
                .attr("opacity", ".85");
              that.tooltip.transition().duration(50).style("opacity", 1);
              that.tooltip
                .html(
                  n.data.name +
                    "<br>Genre: " +
                    n.parent.data.name +
                    "<br>Budget: " +
                    n.data.value
                )
                .style("left", ev.pageX + "px")
                .style("top", ev.pageY - 100 + "px");
            })
            .on("mousemove", function (ev, n) {
              that.tooltip
                .style("left", ev.pageX + "px")
                .style("top", ev.pageY - 100 + "px");
            })
            .on("mouseout", function (ev, n) {
              d3.select(this).transition().duration("50").attr("opacity", "1");
              that.tooltip.transition().duration("50").style("opacity", 0);
            })
            .attr("data-value", (d) => d.data.value);

          node
            .append("rect")
            .attr("x", (d) => d.x0)
            .attr("y", (d) => d.y0)
            .transition()
            .duration(1000)
            .attr("width", (d) => d.x1 - d.x0)
            .attr("height", (d) => d.y1 - d.y0)
            .attr("fill", (d, i) => this.color(d.parent.data.name));

          node
            .append("text")
            .text((d) => d.data.name)
            .attr("transform", (d) => `translate(${d.x0 + 5},${d.y0 + 15})`)
            .each(function (d) {
              const self = d3.select(this);
              const maxWidth = d.x1 - d.x0 - 5;
              let textLength = self.node().getBBox().width;
              let text = self.text();
              while (textLength > maxWidth && text.length > 0) {
                text = text.slice(0, -1);
                self.text(text + "...");
                textLength = self.node().getBBox().width;
              }
            })
            .attr("fill", "white");

          return node;
        },
        (update) => {
          update
            .select("rect")
            .transition()
            .duration(1000)
            .attr("x", (d) => d.x0)
            .attr("y", (d) => d.y0)
            .attr("width", (d) => d.x1 - d.x0)
            .attr("height", (d) => d.y1 - d.y0)
            .attr("fill", (d, i) => this.color(d.parent.data.name));
          update
            .select("text")
            .transition()
            .duration(1000)
            .attr("transform", (d) => `translate(${d.x0 + 5},${d.y0 + 15})`)
            .each(function (d) {
              const self = d3.select(this);
              const maxWidth = d.x1 - d.x0 - 5;
              let textLength = self.node().getBBox().width;
              let text = self.text();
              while (textLength > maxWidth && text.length > 0) {
                text = text.slice(0, -1);
                self.text(text + "...");
                textLength = self.node().getBBox().width;
              }
            });
          return update;
        }
      );
  }
}

$(document).ready(function () {
  const treemap = new Treemap("#treemap");
  treemap.getData().then(() => treemap.draw(window.name));
  window.reloadTreemap = (name) => {
    treemap.update(name);
  };
});
