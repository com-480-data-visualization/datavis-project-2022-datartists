window.showStats = (name) => {
  const actor_stats = window.stats[name];

  $("#actor-stats").find("*").remove();
  $("#actor-image").find("*").remove();

  const stats_graph = new HorizontalMovieBar("#actor-stats");
  stats_graph.draw(name);

  document.getElementById("button_movies").onclick = function(){
    const stats_graph = new HorizontalMovieBar("#actor-stats");
    stats_graph.draw(name);
  }
  document.getElementById("button_rating").onclick = function(){
    const stats_graph = new HorizontalRatingBar("#actor-stats");
    stats_graph.draw(name);
  }

  //const stat_elements = ["Total movies", "Average rating", "Average budget", "Average revenue"]
  for (const key in actor_stats) {
    /*if (stat_elements.includes(key)) {
      $("#actor-stats").append(
        `<p class="h-1/2">${key}: ${actor_stats[key]}</p>`
      );
    }*/
    if (key == "profile_path"){
      $("#actor-image").append(
        `<img src="https://image.tmdb.org/t/p/original/${actor_stats[key]}"></img>`
      );
    }
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
      .attr("y", 18)
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
      .attr("fill", "#1a75ff")
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

///////////////////////////////////////////////////////////////

const margin_horizontal = {
  top: 30,
  right: 30,
  bottom: 20,
  left:90,
};

const avg_total_movies = 33.20

/*
 * Horizontal Bar Chart for actor stats
 */ 
class HorizontalMovieBar{

  constructor(container) {
    this.container = d3.select(container);
  }

  draw(name) {
    this.container.select("*").remove();
    const { height, width } = this.container.node().getBoundingClientRect();

    let actor_data = window.stats[name];

    this.data = [{actor: "Others", count: avg_total_movies}, {actor: name, count: actor_data["Total movies"]}];


    d3.select(window).on("resize.horizontalbar", () => {
      this.draw(name);
    });

    this.xScale = d3
      .scaleLinear()
      .domain([20, d3.max(this.data.map(function (d) {
        return d.count;
        }))
      ])
      .range([margin_horizontal.left, width - margin_horizontal.right]);  

    // Bound yScale using minDataPoint and maxDataPoint
    this.yScale = d3
      .scaleBand()
      .range([height - margin_horizontal.bottom, margin_horizontal.top])
      .domain(this.data.map(function (d) {return d.actor}));
      
    let xS = this.xScale;
    let yS = this.yScale;

    // Add the chart to the HTML page
    this.svg = this.container
      .append("svg")
      .attr("width", width)
      .attr("height", height);

     // create tooltip element  
     const tooltip = d3.select("body")
     .append("div")
     .attr("class","d3-tooltip")
     .style("position", "absolute")
     .style("z-index", "10")
     .style("visibility", "hidden")
     .style("padding", "15px")
     .style("background", "rgba(0,0,0,0.6)")
     .style("border-radius", "5px")
     .style("color", "#fff")
     .text("a simple tooltip");

    const bar_color = "#4da6ff"

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
        return xS(d.count)-margin_horizontal.left;
      })
      .attr("height", "15px")
      .attr("fill", bar_color)
      .style("transform", "translateY(8px)")
      .on("mouseover", function(ev, d) {
        tooltip.html(`Movies: ${d.count}`).style("visibility", "visible");
        d3.select(this)
          .attr("fill", "#004d99");
      })
      .on("mousemove", function(event){
        tooltip
          .style("top", (event.pageY-10)+"px")
          .style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function() {
        tooltip.html(``).style("visibility", "hidden");
        d3.select(this).attr("fill", bar_color);
      });

    this.xAxis = d3.axisBottom(this.xScale).ticks(4).tickFormat(d3.format("d"));
    this.svg
      .append("g")
      .attr("transform", "translate(0," + (height - margin_horizontal.bottom) + ")")
      .call(this.xAxis);

    this.yAxis = d3.axisLeft(this.yScale).ticks(2);

    this.svg
      .append("g")
      .attr("transform", "translate(" + margin_horizontal.left + ",0)")
      .call(this.yAxis);
  }

}

const avg_total_rating = 5.84

class HorizontalRatingBar{

  constructor(container) {
    this.container = d3.select(container);
  }

  draw(name) {
    this.container.select("*").remove();
    const { height, width } = this.container.node().getBoundingClientRect();

    let actor_data = window.stats[name];

    this.data = [{actor: "Others", count: avg_total_rating}, {actor: name, count: actor_data["Average rating"]}];


    d3.select(window).on("resize.horizontalbar", () => {
      this.draw(name);
    });

    this.xScale = d3
      .scaleLinear()
      .domain([0, 10])
      .range([margin_horizontal.left, width - margin_horizontal.right]);  

    // Bound yScale using minDataPoint and maxDataPoint
    this.yScale = d3
      .scaleBand()
      .range([height - margin_horizontal.bottom, margin_horizontal.top])
      .domain(this.data.map(function (d) {return d.actor}));
      
    let xS = this.xScale;
    let yS = this.yScale;

    // Add the chart to the HTML page
    this.svg = this.container
      .append("svg")
      .attr("width", width)
      .attr("height", height);

     // create tooltip element  
     const tooltip = d3.select("body")
     .append("div")
     .attr("class","d3-tooltip")
     .style("position", "absolute")
     .style("z-index", "10")
     .style("visibility", "hidden")
     .style("padding", "15px")
     .style("background", "rgba(0,0,0,0.6)")
     .style("border-radius", "5px")
     .style("color", "#fff")
     .text("a simple tooltip");

    const bar_color = "#ffc266"

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
        return xS(d.count)-margin_horizontal.left;
      })
      .attr("height", "15px")
      .attr("fill", bar_color)
      .style("transform", "translateY(8px)")
      .on("mouseover", function(ev, d) {
        tooltip.html(`Average rating: ${d.count}`).style("visibility", "visible");
        d3.select(this)
          .attr("fill", "#e68a00");
      })
      .on("mousemove", function(event){
        tooltip
          .style("top", (event.pageY-10)+"px")
          .style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function() {
        tooltip.html(``).style("visibility", "hidden");
        d3.select(this).attr("fill", bar_color);
      });

    this.xAxis = d3.axisBottom(this.xScale).ticks(4).tickFormat(d3.format("d"));
    this.svg
      .append("g")
      .attr("transform", "translate(0," + (height - margin_horizontal.bottom) + ")")
      .call(this.xAxis);

    this.yAxis = d3.axisLeft(this.yScale).ticks(2);

    this.svg
      .append("g")
      .attr("transform", "translate(" + margin_horizontal.left + ",0)")
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
