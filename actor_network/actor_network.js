
function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

const nodes = [
    {id: "Alan Tudyk"},
    {id: "Peter Maloney"},
    {id: "Kelsey Grammer"},
    {id: "Seth Green"},
    {id: 'Ali Larter'},
    {id: 'Stephen McHattie'},
    {id: 'Ian Holm'},
    {id: 'Michael Cera'},
    {id: 'Jon Voight'},
    {id: 'Luke Perry'},
    {id: 'George Takei'},
    {id: 'George Lucas'},
    {id: 'Ethan Suplee'}
  ];


  const edges = [
    {source: 'Stephen McHattie', target: 'George Lucas', weight: 1},
    {source: 'Peter Maloney', target: 'Seth Green', weight: 1},
    {source: 'Ian Holm', target: 'Luke Perry', weight: 1},
    {source: 'Jon Voight', target: 'Seth Green', weight: 1},
    {source: 'Jon Voight', target: 'Ali Larter', weight:1},
    {source: 'Stephen McHattie', target: 'Ethan Suplee', weight: 1},
    {source: 'Kelsey Grammer', target: 'Jon Voight', weight: 1},
    {source: 'Kelsey Grammer', target: 'George Takei', weight: 1},
    {source: 'Seth Green', target: 'George Lucas', weight: 1},
    {source: 'Kelsey Grammer', target: 'Ian Holm', weight: 1},
    {source: 'Alan Tudyk', target: 'Seth Green', weight: 1},
    {source: 'Michael Cera', target: 'Seth Green', weight: 1}
  ];

  /*var nodes = []
  d3.json("sample_actor_nodes.json", function(data) {
    for(let i = 0; i < data.length; ++i){
      nodes.push(data[i])
    }
  });
  console.log(nodes)

  var edges = []
  d3.json("sample_actor_edges.json", function(data) {
    for(let i = 0; i < data.length; ++i){
      edges.push(data[i])
    }
  });
  console.log(edges)*/

whenDocumentLoaded(() => { 
  
  let graph = new d3plus.Network().select('#network').links(edges).nodes(nodes).linkSize(d => d.weight).render();
});