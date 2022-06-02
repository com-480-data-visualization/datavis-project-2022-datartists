const margin = {
  top: 30,
  right: 30,
  bottom: 20,
  left: 20,
};

class TimeBarChart {
  constructor(container, actorName) {
    this.container = d3.select(container);
    this.name = actorName;
    d3.json("data/actors_releases_per_year.json").then((data) => {
      this.releasesData = data.data;
      this.draw();
      this.show();
    });
  }

  show() {
    this.svg.style("display", "block");
  }

  draw() {
    // Add the chart to the HTML page
    this.svg = this.container.append("svg").style("display", "none");

    // create tooltip element
    this.tooltip = this.container
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    this.xAxis = this.svg.append("g");

    this.yAxis = this.svg.append("g");

    this.draw_bars();
  }

  update(name) {
    this.name = name;
    this.draw_bars();
  }

  draw_bars() {
    const that = this;
    const { height, width } = this.container.node().getBoundingClientRect();

    this.data = this.releasesData.filter((d) => d.actor === this.name);

    d3.select(window).on("resize.timebar", () => {
      this.draw_bars();
      if (this.svg.style("display") === "block") {
        this.show();
      }
    });

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

    // Bound yScale using minDataPoint and maxDataPoint
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

    /*   
        Create the chart.  
        Here we use 'curveLinear' interpolation.  
        Play with the other ones: 'curveBasis', 'curveCardinal', 'curveStepBefore'.  
        */

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
      .style("transform", "translateX(-5px)")
      .on("mouseover", function (ev, d) {
        that.tooltip.transition().duration(50).style("opacity", 1);
        that.tooltip.html(`Movie releases: ${d.title}`);
        d3.select(this)
          .transition()
          .duration("50")
          .attr("filter", "brightness(60%)");

        const { height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", ev.pageX + "px")
          .style("top", ev.pageY - height - 10 + "px");
      })
      .on("mousemove", function (ev) {
        const { height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", ev.pageX + "px")
          .style("top", ev.pageY - height - 10 + "px");
      })
      .on("mouseout", function () {
        that.tooltip.transition().duration(50).style("opacity", 0);
        d3.select(this)
          .transition()
          .duration("50")
          .attr("filter", "brightness(100%)");
      });

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

const margin_horizontal = {
  top: 30,
  right: 30,
  bottom: 20,
  left: 60,
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
    d3.json("data/actors_stats.json").then((data) => {
      this.stats = data;
      this.draw();
    });
  }

  show() {
    this.svg.style("display", "block");
  }

  draw() {
    // Add the chart to the HTML page
    this.svg = this.container
      .append("svg")
      .style("display", "none")
      .attr("id", this.statName.split(" ").join("_"));

    // create tooltip element
    this.tooltip = this.container
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    this.xAxis = this.svg.append("g");

    this.yAxis = this.svg.append("g");

    this.draw_bars();
  }

  update(name) {
    this.name = name;
    this.draw_bars();
  }

  draw_bars() {
    const that = this;
    const { height, width } = this.container.node().getBoundingClientRect();

    this.data = [
      { actor: "Average", count: this.avgValue },
      { actor: this.name, count: this.stats[this.name][this.statName] },
    ];

    d3.select(window).on("resize." + this.statName.split(" ").join("_"), () => {
      this.draw_bars();
      if (this.svg.style("display") === "block") {
        this.show();
      }
    });

    const xS = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(
          this.data.map(function (d) {
            return that.widthFormat(d.count);
          })
        ),
      ])
      .range([margin_horizontal.left, width - margin_horizontal.right]);

    // Bound yScale using minDataPoint and maxDataPoint
    const yS = d3
      .scaleBand()
      .range([height - margin_horizontal.bottom, margin_horizontal.top])
      .domain(
        this.data.map(function (d) {
          return d.actor;
        })
      )
      .padding(0.5);

    // Add the chart to the HTML page
    this.svg.attr("width", width).attr("height", height);

    this.svg
      .selectAll("rect")
      .data(this.data)
      .join("rect")
      .attr("y", function (d) {
        return yS(d.actor);
      })
      .attr("x", function (d) {
        return margin_horizontal.left;
      })
      .attr("width", function (d) {
        return xS(that.widthFormat(d.count)) - margin_horizontal.left;
      })
      .attr("height", yS.bandwidth())
      .attr("fill", (d) => (d.actor == "Average" ? "lightgray" : "#3b83f6"))
      .on("mouseover", function (ev, d) {
        that.tooltip.transition().duration(50).style("opacity", 1);
        that.tooltip.html(`${that.statName}: ${d.count}`);
        d3.select(this)
          .transition()
          .duration("50")
          .attr("filter", "brightness(60%)");

        const { height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", ev.pageX + "px")
          .style("top", ev.pageY - height - 10 + "px");
      })
      .on("mousemove", function (ev) {
        const { height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", ev.pageX + "px")
          .style("top", ev.pageY - height - 10 + "px");
      })
      .on("mouseout", function () {
        that.tooltip.transition().duration(50).style("opacity", 0);
        d3.select(this)
          .transition()
          .duration("50")
          .attr("filter", "brightness(100%)");
      });

    const xAxis = d3.axisBottom(xS).ticks(8).tickFormat(this.format);
    this.xAxis
      .attr(
        "transform",
        "translate(0," + (height - margin_horizontal.bottom) + ")"
      )
      .call(xAxis);

    const yAxis = d3.axisLeft(yS);
    this.yAxis
      .attr("transform", "translate(" + margin_horizontal.left + ",0)")
      .call(yAxis);
  }
}

function format_money(value) {
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

function money_to_value(money) {
  money = money.slice(1);
  if (money.charAt(money.length - 1) == "M") {
    return parseFloat(money.slice(0, -1)) * 1e6;
  } else if (money.charAt(money.length - 1) == "B") {
    return parseFloat(money.slice(0, -1)) * 1e9;
  } else {
    return parseFloat(money.slice(0, -1)) * 1e3;
  }
}
