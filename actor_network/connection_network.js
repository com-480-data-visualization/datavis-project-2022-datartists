
function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

  /*
  * Example graph for 30 most connected actors to Tom Cruise and their interconnections
  * prepare the data in the connection_graph.ipynb file
  */

  var nodes = []
  d3.json("one_actor_nodes.json", function(data) {
    for(let i = 0; i < data.length; ++i){
      nodes.push(data[i])
    }
  });
  console.log(nodes)

  var edges = []
  d3.json("one_actor_edges.json", function(data) {
    for(let i = 0; i < data.length; ++i){
      edges.push(data[i])
    } 
  });
  console.log(edges)

whenDocumentLoaded(() => { 
  
  let graph = new d3plus.Network().select('#network').links(edges).nodes(nodes).render();
});