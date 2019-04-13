// dimensions
let width = 1200;
let height = 900;

const filename = "price_data.json"
const link_color = "#ddd"
const link_opacity = 1
const push_force = -100
const collision_radius = 50

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
    .attr('transform', 'translate(' + margin.top + ',' + margin.left + ')')

width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom;

let linkWidthScale = d3.scaleLinear()
    .range([1, 25]);
let linkStrengthScale = d3.scaleLinear()
    .range([0, 0.1]);
let nodeRadiusScale = d3.scaleSqrt()
let nodeRadiusFactor = 0.6

let clicked = false

let simulation = d3.forceSimulation()
// pull nodes together based on the links between them
    .force("link", d3.forceLink()
        .id(function (d) {
            return d.id;
        })
        .strength(function (d) {
            return linkStrengthScale(d.price);
        }))

    // push nodes apart to space them out
    .force("charge", d3.forceManyBody()
        .strength(push_force))

    // add some collision detection so they don't overlap
    .force("collide", d3.forceCollide()
        .radius(collision_radius))

    // and draw them around the centre of the space
    .force("center", d3.forceCenter(width / 2, height / 2));


// load the graph
d3.json(filename, function (error, graph) {
    // set the nodes
    let nodes = graph.nodes;
    // links between nodes
    let links = graph.links;

    linkWidthScale.domain(d3.extent(links, function (d) {
        return d.price;
    }));
    linkStrengthScale.domain(d3.extent(links, function (d) {
        return d.price;
    }));

    // add the links
    let link = svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr('stroke', link_color)
        .attr('stroke-opacity', link_opacity)
        .attr('stroke-linecap', "round")
        .attr('stroke-width', function (d) {
            return linkWidthScale(d.price)
        })

    // todo
    // hover text for the link
    link.append("title")
        .text(function (d) {
            return d.price;
        });

    // add the nodes to the graph
    let node = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g");

    // a circle to represent a node
    node.append("circle")
        .attr("class", "node")
        .attr("r", function (d) {
            return nodeRadiusScale(d.price) * nodeRadiusFactor;
        })
        .attr("fill", function (d) {
            return d.color;
        })
        .on("mouseover", mouseOverNode())
        .on("mouseout", mouseOutNode)
        .on('click', function (d) {
            return clickOnNode(d)
        })

    // hover text for the node
    node.append("title")
        .text(function (d) {
            return d.desc;
        });

    // add a label to each node
    node.append("text")
        .attr("dx", function (d) {
            return nodeRadiusScale(d.price) * nodeRadiusFactor + 1;
        })
        .attr("dy", ".35em")
        .text(function (d) {
            return d.name;
        })
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

    // links are drawn as straight lines between nodes
    function positionLink(d) {
        let midpoint_x = (d.source.x + d.target.x) / 2;
        let midpoint_y = (d.source.y + d.target.y) / 2;

        return "M" + d.source.x + "," + d.source.y +
            "S" + midpoint_x + "," + midpoint_y +
            " " + d.target.x + "," + d.target.y;
    }

    // move the node based on forces calculations
    function positionNode(d) {
        // offset for the right border so the mod names aren't hidden
        let x_offset = 120

        // offset for top and bottom so mod names arent on top of each other
        let y_offset = 30

        // keep the node within the boundaries of the svg
        if (d.x < 0) {
            d.x = 0
        }
        if (d.y < 0) {
            d.y = Math.random() * y_offset | 0
        }
        if (d.x > (width - x_offset)) {
            d.x = width - x_offset
        }
        if (d.y > height) {
            d.y = height - (Math.random() * y_offset | 0)
        }
        return "translate(" + d.x + "," + d.y + ")";
    }

    // build a dictionary of nodes that are linked
    let linkedByIndex = {};
    links.forEach(function (d) {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
    });

    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index === b.index;
    }

    function showConnectedOnly(d) {
        node.attr('display', function (o) {
            if (!isConnected(d, o)) {
                return "none"
            }
        });

        link.attr("display", function (o) {
            if (!(o.source === d || o.target === d)) {
                return "none";
            }
        });

        link.style("stroke", function (o) {
            return o.color;
        });
    }

    // fade nodes on hover
    function mouseOverNode() {
        return function (d) {
            if (!clicked) {
                console.log('hovered')
                showConnectedOnly(d)
            }
        };
    }

    function mouseOutNode() {
        if (!clicked) {
            console.log('unhovered')
            node.style("stroke-opacity", 1);
            node.style("fill-opacity", 1);
            link.style("stroke-opacity", link_opacity);
            link.style("stroke", link_color);
            node.attr("display", "initial")
            link.attr("display", "initial")
        }
    }

    function clickOnNode(d) {
        if (!clicked) {
            console.log('clicked node')
            clicked = true
            showConnectedOnly(d)
        }
        else {
            console.log('unclicked node')
            clicked = false
            mouseOutNode()
        }
    }
});
