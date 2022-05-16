class NetworkGraph {
  constructor(container, name) {
    this.container = d3.select(container);
    this.name = name;
    d3.select(".actor-name").html(name);
    this.getData().then(() => {
      this.draw();
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
      let unique = new Set();
      let nodes = edges_data
        .filter((e) => {
          return (
            (e.source === this.name || e.target === this.name) &&
            e.source !== e.target
          );
        })
        .sort((e1, e2) => e2.weigth - e1.weigth)
        .map((e) => ({ id: e.source === this.name ? e.target : e.source }))
        .filter((e) => {
          const has = unique.has(e.id);
          unique.add(e.id);
          return !has;
        })
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
    d3.select(".actor-name").html(this.name);
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

    window.reloadTreemap(this.name);
    window.showStats(this.name);
    window.updateStats(this.name);
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
                .attr("opacity", ".85");
              that.tooltip.transition().duration(50).style("opacity", 1);
              that.tooltip
                .html(n.id)
                .style("left", ev.pageX + "px")
                .style("top", ev.pageY - 50 + "px");
            })
            .on("mousemove", function (ev, n) {
              that.tooltip
                .style("left", ev.pageX + "px")
                .style("top", ev.pageY - 50 + "px");
            })
            .on("mouseout", function (ev, n) {
              d3.select(this).transition().duration("50").attr("opacity", "1");
              that.tooltip.transition().duration("50").style("opacity", 0);
            })
            .on("click", (ev, n) => {
              this.name = n.id;
              this.getData().then(() => {
                this.updateGraph();
              });
            });

          node
            .append("circle")
            .attr("r", (d) => {
              return d.id === this.name ? 20 : 10;
            })
            .style("fill", "#69b3a2");

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
      .style("stroke", "rgba(0,0,0,0.1)")
      .style("stroke-width", function (d) {
        return d.weigth * 2 + "px";
      })
      .attr("data-target", (d) => d.target)
      .attr("data-source", (d) => d.source)
      .on("mouseover", function (ev, l) {
        d3.select(this).transition().duration("50").attr("opacity", ".85");
        that.tooltip.transition().duration(50).style("opacity", 1);
        that.tooltip
          .html(l.weigth + " movies in common")
          .style("left", ev.pageX + "px")
          .style("top", ev.pageY - 50 + "px");
      })
      .on("mousemove", function (ev, n) {
        that.tooltip
          .style("left", ev.pageX + "px")
          .style("top", ev.pageY - 50 + "px");
      })
      .on("mouseout", function (ev, n) {
        d3.select(this).transition().duration("50").attr("opacity", "1");
        that.tooltip.transition().duration("50").style("opacity", 0);
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

$(document).ready(function () {
  const graph = new NetworkGraph("#network", window.name);

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
          graph.update($(this).text());
          $(that).val("");
          $rbox.hide();
        });
      }

      // graph.update(result);
    });
    // const result = fuse.search("george san");
    // console.log(result);
  });
});
