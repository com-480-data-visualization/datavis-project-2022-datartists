/*
 * Network graph class to show actors connections
 */
class NetworkGraph {
  constructor(container, name) {
    this.container = d3.select(container);
    this.name = name;

    // log scale for the node size
    this.weightScale = d3.scaleSqrt().domain([1, 15]).range([5, 30]);

    // load accessory data, get data for the actor then draw
    d3.json("data/movies.json").then((data) => {
      this.movies = data;

      d3.json("data/actors_stats.json").then((data) => {
        this.actors = data;

        d3.json("data/actors_genres_movies.json").then((data) => {
          this.actors_genres = data;

          d3.json("data/genre_colors.json").then((data) => {
            this.genresColor = data;

            this.getData().then(() => {
              this.draw();
            });
          });
        });
      });
    });
  }

  // update the data for the asked actor and redraw the graph
  update(name) {
    this.name = name;
    this.getData().then(() => {
      this.updateGraph();
    });
  }

  // load the actor edges data and filter to get the top 20 actors and all their interconnections
  getData(top = 20) {
    return d3.json("data/actor_edges.json").then((edges_data) => {
      // get the top 20 actors
      let nodes = edges_data
        .filter((e) => {
          return e.source === this.name || e.target === this.name;
        })
        .sort((e1, e2) => e2.weight - e1.weight)
        .map((e) => ({ id: e.source === this.name ? e.target : e.source }))
        .slice(0, top);
      nodes.push({ id: this.name });

      // get edges between the top 20 actors
      const edges = edges_data.filter((e) => {
        let source = false;
        const node_present = nodes.find((n) => {
          if (n.id === e.source) {
            source = true;
          }
          return n.id === e.source || n.id === e.target;
        });
        const other_node_present = nodes.find((n) =>
          source ? n.id === e.target : n.id === e.source
        );
        return node_present && other_node_present;
      });
      this.data = { nodes, edges };
    });
  }

  // update the graph
  updateGraph = () => {
    const { nodes, edges } = this.data;

    // update links, nodes and reset the force simulation
    this.drawLinks();
    this.drawNodes();
    this.simulation.nodes(nodes);
    this.simulation.force(
      "link",
      d3
        .forceLink() // This force provides links between nodes
        .id(function (d) {
          return d.id;
        }) // This provide  the id of a node
        .links(edges)
    );
    this.simulation.alpha(0.3).restart();
  };

  // resize handler
  resize = () => {
    this.bb = this.container.node().getBoundingClientRect();
    this.svg.attr("width", this.bb.width);
    this.svg.attr("height", this.bb.height);
    // center the graph and reset the simulation
    this.simulation.force(
      "center",
      d3.forceCenter(this.bb.width / 2, this.bb.height / 2)
    );
    this.simulation.alpha(0.3).restart();
  };

  // setup graph and draw
  draw() {
    this.bb = this.container.node().getBoundingClientRect();
    this.svg = this.container
      .append("svg")
      .attr("width", this.bb.width)
      .attr("height", this.bb.height);

    d3.select(window).on("resize", this.resize);
    const { nodes, edges } = this.data;

    // create tooltip
    this.tooltip = this.container
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Initialize the links
    this.link = this.svg.append("g").selectAll("line");
    this.drawLinks();

    // initialize nodes
    this.node = this.svg.append("g").selectAll("g");
    this.drawNodes();

    // Let's list the force we wanna apply on the network
    this.simulation = d3
      .forceSimulation(nodes) // Force algorithm is applied to data.nodes
      .force(
        "link",
        d3
          .forceLink() // This force provides links between nodes
          .id(function (d) {
            return d.id;
          }) // This provide  the id of a node
          .links(edges) // and this the list of links
      )
      .force("charge", d3.forceManyBody().strength(-1200)) // This adds repulsion between nodes
      .force("center", d3.forceCenter(this.bb.width / 2, this.bb.height / 2)) // This force attracts nodes to the center of the this.svg area
      .on("tick", this.ticked);
  }

  // nodes
  drawNodes() {
    const that = this;
    const { nodes } = this.data;
    this.node = this.node
      .data(nodes, (n) => n.id)
      .join(
        // when creating new nodes
        (enter) => {
          const node = enter
            .append("g")
            .style("cursor", "pointer")
            .call(this.drag(this.simulation)) // handle node drag
            .on("mouseover", function (ev, n) {
              // decrease brightness of the node
              d3.select(this)
                .transition()
                .duration("50")
                .attr("filter", "brightness(60%)");
              // show tooltip
              that.tooltip.transition().duration(50).style("opacity", 1);
              that.tooltip.html(
                "<img src='https://image.tmdb.org/t/p/w200/" +
                  that.actors[n.id].profile_path +
                  "'/><b>" +
                  n.id +
                  "</b>"
              );

              // set tooltip position
              const { width, height } = that.tooltip
                .node()
                .getBoundingClientRect();
              // use max to prevent tooltip from going outside the window
              that.tooltip
                .style("left", Math.max(ev.pageX, width / 2) + "px")
                .style("top", Math.max(0, ev.pageY - height - 10) + "px");
            })
            .on("mousemove", function (ev, n) {
              // update tooltip position
              const { width, height } = that.tooltip
                .node()
                .getBoundingClientRect();
              that.tooltip
                .style("left", Math.max(ev.pageX, width / 2) + "px")
                .style("top", Math.max(0, ev.pageY - height - 10) + "px");
            })
            .on("mouseout", function (ev, n) {
              // reset brightness of node
              d3.select(this)
                .transition()
                .duration("50")
                .attr("filter", "brightness(100%)");
              // hide tooltip
              that.tooltip.transition().duration("50").style("opacity", 0);
            })
            .on("click", (ev, n) => {
              // when clicking on a node update all the graphs
              this.name = n.id;
              window.updateData(this.name);
            });

          // add node circle
          node
            .append("circle")
            .attr("r", (d) => {
              return d.id === this.name ? 20 : 10;
            })
            .style("fill", (d) => {
              // use the color of the genre with the largest budget sum
              const sums = Object.entries(that.actors_genres[d.id]).map(
                ([k, v]) => [
                  k,
                  v.reduce(
                    (acc, a) => acc + parseInt(that.movies[a].budget),
                    0
                  ),
                ]
              );
              const maxGenre = sums[d3.maxIndex(sums, (d) => d[1])][0];

              return that.genresColor[maxGenre];
            });

          // add node text
          node
            .append("text")
            .text(function (d) {
              return d.id;
            })
            .attr("dy", (d) => {
              return (d.id === this.name ? 30 : 20) + "px";
            })
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "black")
            .style("text-anchor", "middle")
            .style("dominant-baseline", "middle");
          return node;
        },
        (update) => {
          // when updating a node
          update.select("circle").attr("r", (d) => {
            return d.id === this.name ? 20 : 10;
          });
          update.selectAll("text").attr("dy", (d) => {
            return (d.id === this.name ? 30 : 20) + "px";
          });
          return update;
        }
      );
  }

  // links
  drawLinks() {
    const that = this;
    const { edges } = this.data;
    this.link = this.link
      .data(edges, (d) => d.source + "-" + d.target)
      .join("line")
      .style("cursor", "pointer")
      .style("stroke", "rgba(0,0,0,0.05)")
      .style("stroke-width", function (d) {
        return that.weightScale(d.weight) + "px";
      })
      .on("mouseover", function (ev, l) {
        // decrease brightness of connected nodes and the link
        const movieNames = l.movie_ids.map((id) => that.movies[id].title);
        that.node
          .filter((n) => {
            return n.id === l.source.id || n.id === l.target.id;
          })
          .select("circle")
          .transition()
          .duration("50")
          .attr("filter", "brightness(60%)");
        d3.select(this)
          .transition()
          .duration("50")
          .style("stroke", "rgba(0,0,0,0.7)");

        // show tooltip
        that.tooltip.transition().duration(50).style("opacity", 1);
        that.tooltip.html(
          "<b>" +
            l.source.id +
            " and " +
            l.target.id +
            ":</b><br>" +
            movieNames.join("<br>")
        );

        // set tooltip position
        const { width, height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", Math.max(ev.pageX, width / 2) + "px")
          .style("top", Math.max(0, ev.pageY - height - 10) + "px");
      })
      .on("mousemove", function (ev, n) {
        // set tooltip position
        const { width, height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", Math.max(ev.pageX, width / 2) + "px")
          .style("top", Math.max(0, ev.pageY - height - 10) + "px");
      })
      .on("mouseout", function (ev, l) {
        // reset brightness of connected nodes and the link
        d3.select(this)
          .transition()
          .duration("50")
          .style("stroke", "rgba(0,0,0,0.05)");
        that.node
          .filter((n) => {
            return n.id === l.source.id || n.id === l.target.id;
          })
          .select("circle")
          .transition()
          .duration("50")
          .attr("filter", "brightness(100%)");
        // hide tooltip
        that.tooltip.transition().duration("50").style("opacity", 0);
      });
  }

  // prevent nodes to leave the window
  checkBounds(d) {
    if (d.x < 15) d.x = 15;
    if (d.x > this.bb.width - 15) d.x = this.bb.width - 15;
    if (d.y < 15) d.y = 15;
    if (d.y > this.bb.height - 15) d.y = this.bb.height - 15;
  }

  // This function is run at each iteration of the force algorithm, updating the nodes position.
  ticked = () => {
    this.link
      .attr("x1", (d) => {
        this.checkBounds(d.source);
        return d.source.x;
      })
      .attr("y1", (d) => {
        return d.source.y;
      })
      .attr("x2", (d) => {
        this.checkBounds(d.target);
        return d.target.x;
      })
      .attr("y2", (d) => {
        return d.target.y;
      });

    this.node.attr("transform", (d) => {
      this.checkBounds(d);
      return "translate(" + d.x + "," + d.y + ")";
    });
  };

  // handle node dragging
  drag() {
    const dragstarted = (event) => {
      if (!event.active) this.simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };

    const dragged = (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragended = (event) => {
      if (!event.active) this.simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    };

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
}
