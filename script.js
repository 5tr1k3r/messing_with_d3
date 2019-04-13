// dimensions
let width = 1200;
let height = 900;

const filename = "price_data.json"
const link_color = "#ddd"
const link_opacity = 1

const margin = {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
};

// create an svg to draw in
let svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append('g')
    .attr('transform', 'translate(' + margin.top + ',' + margin.left + ')');

width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom;

let linkWidthScale = d3.scaleLinear()
    .range([1, 20]);
let linkStrengthScale = d3.scaleLinear()
    .range([0, 0.15]);
let nodeRadiusScale = d3.scaleSqrt()
let nodeRadiusFactor = 0.6

let simulation = d3.forceSimulation()
    // pull nodes together based on the links between them
    .force("link", d3.forceLink()
        .id(function(d) {
            return d.id;
        })
        .strength(function(d) {
            return linkStrengthScale(d.price);
        }))
    // push nodes apart to space them out
    .force("charge", d3.forceManyBody()
        .strength(-100))
    // add some collision detection so they don't overlap
    .force("collide", d3.forceCollide()
        .radius(50))
    // and draw them around the centre of the space
    .force("center", d3.forceCenter(width / 2, height / 2));

// load the graph
d3.json(filename, function(error, graph) {
    // set the nodes
    let nodes = graph.nodes;
    // links between nodes
    let links = graph.links;

    linkWidthScale.domain(d3.extent(links, function(d) {
        return d.price;
    }));
    linkStrengthScale.domain(d3.extent(links, function(d) {
        return d.price;
    }));

    // add the links to our graphic
    let link = svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr('stroke', link_color)
        .attr('stroke-opacity', link_opacity)
        .attr('stroke-width', function(d) {
            return linkWidthScale(d.price);
        });

    // add the nodes to the graphic
    let node = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g");

    // a circle to represent the node
    node.append("circle")
        .attr("class", "node")
        .attr("r", function(d) {
            return nodeRadiusScale(d.price) * nodeRadiusFactor;
        })
        .attr("fill", function(d) {
            return d.color;
        })
        .on("mouseover", mouseOver(.1))
        .on("mouseout", mouseOut);

    // hover text for the node
    node.append("title")
        .text(function(d) {
            return d.desc;
        });

    // add a label to each node
    node.append("text")
        .attr("dx", function(d) {
            return nodeRadiusScale(d.price) * nodeRadiusFactor + 1;
        })
        .attr("dy", ".35em")
        .text(function(d) {
            return d.name;
        })
        .style("stroke", "black")
        .style("stroke-width", 0.5)
        // .style("fill", function(d) {
        //     return d.color;
        // });
        .style("fill", "black");

    // add the nodes to the simulation and
    // tell it what to do on each tick
    simulation
        .nodes(nodes)
        .on("tick", ticked);

    // add the links to the simulation
    simulation
        .force("link")
        .links(links);

    // on each tick, update node and link positions
    function ticked() {
        link.attr("d", positionLink);
        node.attr("transform", positionNode);
    }

    // links are drawn as curved paths between nodes,
    // through the intermediate nodes
    function positionLink(d) {
        let offset = 0;

        let midpoint_x = (d.source.x + d.target.x) / 2;
        let midpoint_y = (d.source.y + d.target.y) / 2;

        let dx = (d.target.x - d.source.x);
        let dy = (d.target.y - d.source.y);

        let normalise = Math.sqrt((dx * dx) + (dy * dy));

        let offSetX = midpoint_x + offset * (dy / normalise);
        let offSetY = midpoint_y - offset * (dx / normalise);

        return "M" + d.source.x + "," + d.source.y +
            "S" + offSetX + "," + offSetY +
            " " + d.target.x + "," + d.target.y;
    }

    // move the node based on forces calculations
    function positionNode(d) {
        // keep the node within the boundaries of the svg
        if (d.x < 0) {
            d.x = 0
        }
        if (d.y < 0) {
            d.y = 0
        }
        if (d.x > width) {
            d.x = width
        }
        if (d.y > height) {
            d.y = height
        }
        return "translate(" + d.x + "," + d.y + ")";
    }

    // build a dictionary of nodes that are linked
    let linkedByIndex = {};
    links.forEach(function(d) {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
    });

    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index === b.index;
    }

    // fade nodes on hover
    function mouseOver() {
        return function(d) {
            // check all other nodes to see if they're connected
            // to this one. if so, keep the opacity at 1, otherwise
            // fade
            node.style("stroke-opacity", function(o) {
                return isConnected(d, o) ? 1 : 0;
            });
            node.style("fill-opacity", function(o) {
                return isConnected(d, o) ? 1 : 0;
            });
            // also style link accordingly
            link.style("stroke-opacity", function(o) {
                return o.source === d || o.target === d ? 1 : 0;
            });
            // link.style("stroke", function(o) {
            //     return o.source === d || o.target === d ? o.source.color : link_color;
            // });
            link.style("stroke", function(o) {
                return o.color;
            });
        };
    }

    function mouseOut() {
        node.style("stroke-opacity", 1);
        node.style("fill-opacity", 1);
        link.style("stroke-opacity", link_opacity);
        link.style("stroke", link_color);
    }

});
