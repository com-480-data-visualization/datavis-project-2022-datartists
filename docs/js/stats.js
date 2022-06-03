const margin = {
  top: 30,
  right: 30,
  bottom: 20,
  left: 20,
};

/*
 * Time series with bars chart to show number of movies per year
 */
class TimeBarChart {
  constructor(container, actorName) {
    this.container = d3.select(container);
    this.name = actorName;
    // load the data then draw
    d3.json("data/actors_releases_per_year.json").then((data) => {
      this.releasesData = data.data;
      this.draw();
      this.show(); // show this graph by default
    });
  }

  // show the graph (by default it's hidden)
  show() {
    this.svg.style("display", "block");
  }

  draw() {
    // Add the chart to the HTML page hut hidden
    this.svg = this.container.append("svg").style("display", "none");

    // create tooltip element
    this.tooltip = this.container
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Initialize the axes
    this.xAxis = this.svg.append("g");

    this.yAxis = this.svg.append("g");

    this.drawBars();
  }

  // update graph for a new actor
  update(name) {
    this.name = name;
    this.drawBars();
  }

  // draw or update the bars
  drawBars() {
    const that = this;
    const { height, width } = this.container.node().getBoundingClientRect();

    this.data = this.releasesData.filter((d) => d.actor === this.name);

    // redraw bars on window resizing
    d3.select(window).on("resize.timebar", () => {
      this.drawBars();
      if (this.svg.style("display") === "block") {
        // if the graph was visible, show it again
        this.show();
      }
    });

    // create x and y scales
    const xS = d3
      .scaleLinear()
      .range([margin.left, width - margin.right])
      .domain([
        d3.min(
          this.data.map(function (d) {
            return d.release_date;
          })
        ) - 1,
        2018,
      ]);

    const yS = d3
      .scaleLinear()
      .range([height - margin.bottom, margin.top])
      .domain([
        0,
        d3.max(
          this.data.map(function (d) {
            return d.title;
          })
        ),
      ]);

    this.svg.attr("width", width).attr("height", height);

    this.svg
      .selectAll("rect")
      .data(this.data)
      .join("rect")
      .attr("x", function (d) {
        return xS(d.release_date);
      })
      .attr("y", function (d) {
        return yS(d.title);
      })
      .attr("width", "10px")
      .attr("height", function (d) {
        return height - yS(d.title) - margin.bottom;
      })
      .attr("fill", "#3b83f6")
      .style("transform", "translateX(-5px)") // center bar on tick
      .on("mouseover", function (ev, d) {
        // show tooltip
        that.tooltip.transition().duration(50).style("opacity", 1);
        that.tooltip.html(`Movie releases: ${d.title}`);

        // decrease brightness of the bar
        d3.select(this)
          .transition()
          .duration("50")
          .attr("filter", "brightness(60%)");

        // set tooltip position
        const { height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", ev.pageX + "px")
          .style("top", ev.pageY - height - 10 + "px");
      })
      .on("mousemove", function (ev) {
        // set tooltip position
        const { height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", ev.pageX + "px")
          .style("top", ev.pageY - height - 10 + "px");
      })
      .on("mouseout", function () {
        // hide tooltip
        that.tooltip.transition().duration(50).style("opacity", 0);
        // increase back brightness of the bar
        d3.select(this)
          .transition()
          .duration("50")
          .attr("filter", "brightness(100%)");
      });

    // draw x and y axes
    const xAxis = d3.axisBottom(xS).ticks(8).tickFormat(d3.format("d"));

    this.xAxis
      .attr("transform", "translate(0," + (height - margin.bottom) + ")")
      .call(xAxis);

    const yAxis = d3.axisLeft(yS).ticks(4);

    this.yAxis
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(yAxis);
  }
}

///////////////////////////////////////////////////////////////

const marginHorizontal = {
  top: 30,
  right: 30,
  bottom: 20,
  left: 100,
};

/*
 * Horizontal Bar Chart for actor stats
 */
class ComparisonBars {
  constructor(
    container,
    actorName,
    statName,
    avgValue,
    format = d3.format("d"),
    widthFormat = (v) => v
  ) {
    this.container = d3.select(container);
    this.name = actorName;
    this.statName = statName;
    this.avgValue = avgValue;
    this.format = format;
    this.widthFormat = widthFormat;
    // get data then draw
    d3.json("data/actors_stats.json").then((data) => {
      this.stats = data;
      this.draw();
    });
  }

  // show the graph (by default it's hidden)
  show() {
    this.svg.style("display", "block");
  }

  draw() {
    // Add the chart to the HTML page but hidden
    this.svg = this.container
      .append("svg")
      .style("display", "none")
      .attr("id", this.statName.split(" ").join("_"));

    // create tooltip element
    this.tooltip = this.container
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // initialize axis
    this.xAxis = this.svg.append("g");

    this.yAxis = this.svg.append("g");

    this.drawBars();
  }

  // update graph for a new actor
  update(name) {
    this.name = name;
    this.drawBars();
  }

  // draw or update the bars
  drawBars() {
    const that = this;
    const { height, width } = this.container.node().getBoundingClientRect();

    // set actor and stat data
    this.data = [
      { actor: "Average", count: this.avgValue },
      { actor: this.name, count: this.stats[this.name][this.statName] },
    ];

    // redraw bars on window resizing
    d3.select(window).on("resize." + this.statName.split(" ").join("_"), () => {
      this.drawBars();
      if (this.svg.style("display") === "block") {
        // if the graph was visible, show it again
        this.show();
      }
    });

    // create x and y scales
    const xS = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(
          this.data.map(function (d) {
            return that.widthFormat(d.count); // format width (e.g. formated number to value)
          })
        ),
      ])
      .range([marginHorizontal.left, width - marginHorizontal.right]);

    const yS = d3
      .scaleBand()
      .range([height - marginHorizontal.bottom, marginHorizontal.top])
      .domain(
        this.data.map(function (d) {
          return d.actor;
        })
      )
      .padding(0.5);

    this.svg.attr("width", width).attr("height", height);

    this.svg
      .selectAll("rect")
      .data(this.data)
      .join("rect")
      .attr("y", function (d) {
        return yS(d.actor);
      })
      .attr("x", function (d) {
        return marginHorizontal.left;
      })
      .attr("width", function (d) {
        return xS(that.widthFormat(d.count)) - marginHorizontal.left;
      })
      .attr("height", yS.bandwidth())
      .attr("fill", (d) => (d.actor == "Average" ? "lightgray" : "#3b83f6"))
      .on("mouseover", function (ev, d) {
        // show tooltip
        that.tooltip.transition().duration(50).style("opacity", 1);
        that.tooltip.html(`${that.statName}: ${d.count}`);

        // decrease brightness of the bar
        d3.select(this)
          .transition()
          .duration("50")
          .attr("filter", "brightness(60%)");

        // set tooltip position
        const { height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", ev.pageX + "px")
          .style("top", ev.pageY - height - 10 + "px");
      })
      .on("mousemove", function (ev) {
        // set tooltip position
        const { height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", ev.pageX + "px")
          .style("top", ev.pageY - height - 10 + "px");
      })
      .on("mouseout", function () {
        // hide tooltip
        that.tooltip.transition().duration(50).style("opacity", 0);

        // increase back brightness of the bar
        d3.select(this)
          .transition()
          .duration("50")
          .attr("filter", "brightness(100%)");
      });

    // create x and y axes
    const xAxis = d3.axisBottom(xS).ticks(8).tickFormat(this.format);
    this.xAxis
      .attr(
        "transform",
        "translate(0," + (height - marginHorizontal.bottom) + ")"
      )
      .call(xAxis);

    const yAxis = d3.axisLeft(yS);
    this.yAxis
      .attr("transform", "translate(" + marginHorizontal.left + ",0)")
      .call(yAxis);
  }
}
