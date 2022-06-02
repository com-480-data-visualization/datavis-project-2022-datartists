class NetworkGraph {
  constructor(container, name) {
    this.container = d3.select(container);
    this.name = name;

    this.weightScale = d3.scaleSqrt().domain([1, 15]).range([5, 30]);

    d3.json("data/movies.json").then((data) => {
      this.movies = data;

      d3.json("data/actors_stats.json").then((data) => {
        this.actors = data;

        d3.json("data/actors_genres_movies.json").then((data) => {
          this.actors_genres = data;
          const genres = Object.keys(data[Object.keys(data)[0]]);

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

  update(name) {
    this.name = name;
    console.log(name);
    this.getData().then(() => {
      this.updateGraph();
    });
  }

  getData(top = 20) {
    return d3.json("data/actor_edges.json").then((edges_data) => {
      let nodes = edges_data
        .filter((e) => {
          return e.source === this.name || e.target === this.name;
        })
        .sort((e1, e2) => e2.weight - e1.weight)
        .map((e) => ({ id: e.source === this.name ? e.target : e.source }))
        .slice(0, top);
      nodes.push({ id: this.name });

      // console.log(nodes);
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

  updateGraph = () => {
    const { nodes, edges } = this.data;

    this.draw_links();
    this.draw_nodes();
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

  resize = () => {
    this.bb = this.container.node().getBoundingClientRect();
    this.svg.attr("width", this.bb.width);
    this.svg.attr("height", this.bb.height);
    this.simulation.force(
      "center",
      d3.forceCenter(this.bb.width / 2, this.bb.height / 2)
    );
    this.simulation.alpha(0.3).restart();
  };

  draw() {
    this.bb = this.container.node().getBoundingClientRect();
    this.svg = this.container
      .append("svg")
      .attr("width", this.bb.width)
      .attr("height", this.bb.height);

    d3.select(window).on("resize", this.resize);
    const { nodes, edges } = this.data;

    this.tooltip = this.container
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Initialize the links
    this.link = this.svg.append("g").selectAll("line");
    this.draw_links();

    // initialize nodes
    this.node = this.svg.append("g").selectAll("g");
    this.draw_nodes();

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
      .force("charge", d3.forceManyBody().strength(-1200)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
      .force("center", d3.forceCenter(this.bb.width / 2, this.bb.height / 2)) // This force attracts nodes to the center of the this.svg area
      .on("tick", this.ticked);
  }

  draw_nodes() {
    const that = this;
    const { nodes } = this.data;
    this.node = this.node
      .data(nodes, (n) => n.id)
      .join(
        (enter) => {
          const node = enter
            .append("g")
            .style("cursor", "pointer")
            .call(this.drag(this.simulation))
            .on("mouseover", function (ev, n) {
              d3.select(this)
                .transition()
                .duration("50")
                .attr("filter", "brightness(60%)");
              that.tooltip.transition().duration(50).style("opacity", 1);
              that.tooltip.html(
                "<img src='https://image.tmdb.org/t/p/w200/" +
                  that.actors[n.id].profile_path +
                  "'/><b>" +
                  n.id +
                  "</b>"
              );

              const { width, height } = that.tooltip
                .node()
                .getBoundingClientRect();
              that.tooltip
                .style("left", Math.max(ev.pageX, width / 2) + "px")
                .style("top", Math.max(0, ev.pageY - height - 10) + "px");
            })
            .on("mousemove", function (ev, n) {
              const { width, height } = that.tooltip
                .node()
                .getBoundingClientRect();
              that.tooltip
                .style("left", Math.max(ev.pageX, width / 2) + "px")
                .style("top", Math.max(0, ev.pageY - height - 10) + "px");
            })
            .on("mouseout", function (ev, n) {
              d3.select(this)
                .transition()
                .duration("50")
                .attr("filter", "brightness(100%)");
              that.tooltip.transition().duration("50").style("opacity", 0);
            })
            .on("click", (ev, n) => {
              this.name = n.id;
              window.updateData(this.name);
            });

          node
            .append("circle")
            .attr("r", (d) => {
              return d.id === this.name ? 20 : 10;
            })
            .style("fill", (d) => {
              const sums = Object.entries(that.actors_genres[d.id]).map(
                ([k, v]) => [
                  k,
                  v.reduce(
                    (acc, a) => acc + parseInt(that.movies[a].budget),
                    0
                  ),
                ]
              );
              console.log(sums);
              const maxGenre = sums[d3.maxIndex(sums, (d) => d[1])][0];
              console.log(d.id + " " + maxGenre);

              return that.genresColor[maxGenre];
            });

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

  draw_links() {
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
        that.tooltip.transition().duration(50).style("opacity", 1);
        that.tooltip.html(
          "<b>" +
            l.source.id +
            " and " +
            l.target.id +
            ":</b><br>" +
            movieNames.join("<br>")
        );
        const { width, height } = that.tooltip.node().getBoundingClientRect();

        that.tooltip
          .style("left", Math.max(ev.pageX, width / 2) + "px")
          .style("top", Math.max(0, ev.pageY - height - 10) + "px");
      })
      .on("mousemove", function (ev, n) {
        const { width, height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", Math.max(ev.pageX, width / 2) + "px")
          .style("top", Math.max(0, ev.pageY - height - 10) + "px");
      })
      .on("mouseout", function (ev, l) {
        d3.select(this)
          .transition()
          .duration("50")
          .style("stroke", "rgba(0,0,0,0.05)");
        that.tooltip.transition().duration("50").style("opacity", 0);
        that.node
          .filter((n) => {
            return n.id === l.source.id || n.id === l.target.id;
          })
          .select("circle")
          .transition()
          .duration("50")
          .attr("filter", "brightness(100%)");
      });
  }

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
