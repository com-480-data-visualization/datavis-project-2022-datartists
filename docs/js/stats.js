window.showStats = (name) => {
  const actor_stats = window.stats[name];

  $("#actor-stats").find("*").remove();
  for (const key in actor_stats) {
    $("#actor-stats").append(
      `<p class="w-1/2">${key}: ${actor_stats[key]}</p>`
    );
  }
};

const margin = {
  top: 30,
  right: 30,
  bottom: 20,
  left: 20,
};

class TimeBarChart {
  constructor(container) {
    this.container = d3.select(container);
  }

  draw(name) {
    this.container.select("*").remove();
    const { height, width } = this.container.node().getBoundingClientRect();

    this.data = window.releasesData.filter((d) => d.actor === name);

    d3.select(window).on("resize.timebar", () => {
      this.draw(name);
    });

    this.xScale = d3
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

    // console.log(this.xScale(1999));

    // Bound yScale using minDataPoint and maxDataPoint
    this.yScale = d3
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
    let xS = this.xScale;
    let yS = this.yScale;

    /*   
        Create the chart.  
        Here we use 'curveLinear' interpolation.  
        Play with the other ones: 'curveBasis', 'curveCardinal', 'curveStepBefore'.  
        */

    // Add the chart to the HTML page
    this.svg = this.container
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    this.svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .text("Number of movies per year")
      .attr("text-anchor", "middle");

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
      .attr("fill", "#69b3a2")
      .style("transform", "translateX(-5px)");

    this.xAxis = d3.axisBottom(this.xScale).ticks(8).tickFormat(d3.format("d"));
    this.svg
      .append("g")
      .attr("transform", "translate(0," + (height - margin.bottom) + ")")
      .call(this.xAxis);

    this.yAxis = d3.axisLeft(this.yScale).ticks(4);

    this.svg
      .append("g")
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(this.yAxis);
  }
}
$(document).ready(function () {
  d3.json("data/actors_stats.json").then((data) => {
    window.stats = data;
    window.showStats(window.name);
  });

  d3.json("data/actors_releases_per_year.json").then((data) => {
    window.releasesData = data.data;

    const graph = new TimeBarChart("#releases");
    graph.draw(window.name);

    window.updateStats = (name) => {
      graph.draw(name);
    };
  });
});
