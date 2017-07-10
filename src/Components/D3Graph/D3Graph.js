import * as d3 from "d3";

// D3Graph.js

export default class D3Graph{

  constructor (el, graph, callbacks) {
  // props
  this.el = el;
  this.graph = graph;
  this.callbacks = callbacks;
  this.k = 1.5;
  this.infoGroupPos= { x: 0, y: 0};
  this.zoomDuration = 20;
  this.graphData = {};
  this.animDurationFactor = 2;

  // init zoom behaviour
  this.initZoom();

  // create svg
  this.initSVG(el,"100%",graph.config.height);

  // create graph holder
  this.initGraphHolder();

   // create simulation
  this.initSimulation();

};

// Init zoom
initZoom(){

  // zoom
  this.zoom = d3.zoom();
  this.zoom
  .scaleExtent([0.25, 3])
  .on("zoom", this.zoomed.bind(this))
  ;
}

// Performed when the view is zoomed
zoomed(e) {
  let transform = d3.event.transform;
  this.transformZoom(transform,this.zoomDuration);
}

// Apply zoom to root group g
transformZoom(transform, duration){
    this.g.transition().duration(duration).attr("transform", "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")");
    this.k = transform.k;
    if (this.infoGroup) {
      this.updateInfoPosition(this.infoGroupPos.x,this.infoGroupPos.y)
    }
}

// Init the SVG root element
initSVG(el,width,height){
  this.svg = d3.select(el).append("svg")
  .attr("class", "D3Graph")
  .attr("width", width)
  .attr("height", height)
  .call(this.zoom)
  .on("dblclick.zoom",null)
  ;
}

// init the Graph hold
initGraphHolder(){
  this.g = this.svg.append("g")
  .attr("class", "d3-graph");

  this.resetZoom();
  this.linksGroup = this.g.append("g").attr("class","d3-links");
  this.nodesGroup = this.g.append("g").attr("class","d3-nodes");
  this.infoGroup = this.g.append("g").attr("class","d3-info");
}

// Reset viewport zoom
resetZoom(zoomDuration = 20){
  var panelWidth = this.graph.config.width > 769
      ? (this.graph.config.activeNodeId ? Math.max(300,Math.min(400, 33 * this.graph.config.width)) : 0)
      : 0
      ;
  var center = {
    x: panelWidth + (this.graph.config.width - panelWidth) / 2 ,
    y: this.graph.config.height / 2,
  };
  this.zoomDuration = zoomDuration;
  this.svg.call(this.zoom.transform, d3.zoomIdentity.translate(center.x,center.y).scale(this.k), 200);
  this.zoomDuration = 20;
}



// Init the simulation of a force directed graph layout
initSimulation(){

  var config = this.graph.config;
  this.simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(d => d.id))
  .force("charge", d3.forceManyBody().strength( -60 ).distanceMin( 80 ) ) // -60, 80
  .force("center", d3.forceCenter(0,0) )
  .force("forceCollide", d3.forceCollide(d => 25 + d.radius * config.collisionScale).strength(config.collisionStrength) )
  .velocityDecay(0.5)
  ;
}

// Update graph
update(el, graph)  {
  // stop any running timeouts
  clearTimeout(this.activeLinkTimeout);
  clearTimeout(this.hoverTimeout);

  // update data
  this.graph = graph;

  this.graphData = {
    data:{
      nodes: this.graph.getVisibleNodes(),
      links: this.graph.getVisibleLinks()
    }
  }

  this.drawGraph(el, this.graphData.data);

  this.updateSimulation(this, this.graphData.data.nodes, this.graphData.data.links);
  this.simulation.tick();
  this.simulation.alphaTarget(0).alpha( graph.config.alphaTarget)
  this.simulation.restart();
  if (graph.config.centerForce){
    this.resetZoom(400);
  }
};

// Destroy graph
destroy(el) {

  // Stop simulation
  this.simulation.stop();
  this.simulation = null;

  // Cleanup
  this.svg.remove();

};

// Resize
resize(width,height){
  // only run when size is different
  if (width === this.graph.config.width && height === this.graph.config.height) { return; }

  this.graph.config.width = width;
  this.graph.config.height = height;

  this.svg.attr("width","100%");
  this.svg.attr("height",this.graph.config.height);
}

// Draw the graph
drawGraph(el, graph) {
  // Links
  this.drawLinks(this.linksGroup, graph.links);

  // Nodes
  this.drawNodes(this.nodesGroup, graph.nodes);
}


// Draw the links of the graph
drawLinks(g, links){

  let config = this.graph.config;
  // Update
  this.links = g.selectAll(".link")
                .data(links, d => d.id);


  // show all links in transition
  // this is required to cancel any exit transitions
  this.links.transition().duration(800 * this.animDurationFactor).style("opacity", 1);

  var linkEnter = this.links.enter();

  var link = linkEnter.append("g").attr("class","link").attr("id",d => "link-" + d.id);

  link.append("line")
    .attr("stroke-width", d => d.value);

  // circle center
  link.append("circle")
    .attr("r", d => d.value * config.relationDotSize)
    .on("mouseover", this.setActiveLink.bind(this, true))
    .on("mouseout", this.setActiveLink.bind(this, false))
    ;


  // enter animation
  link.style("opacity", 0)
    .transition()
    .duration(800 * this.animDurationFactor)
    .style("opacity", 1);


  this.links.merge(linkEnter);

  // EXIT
  //this.links.exit().remove();
  this.links.exit()
  .transition()
  .duration(800 * this.animDurationFactor)
  .style("opacity", 0)
  .on("end", function(d){ d3.select(this).style("opacity",0).remove(); });

  // update selection for first run
  this.links = g.selectAll(".link");
}

// Hover on link circle
setActiveLink(enable, l){
  clearTimeout(this.activeLinkTimeout);
  this.activeLinkTimeout = setTimeout( () => {
    this.callbacks.setActiveLinkId(enable ? l.id : "");

    this.linksGroup.select("#link-"+l.id).classed("hover",enable);

    this.applyNodeHover(enable, [l.sourceNode, l.targetNode], [l]);
  }, 100);

}

// Draw the nodes of the graph
drawNodes(g, nodes){

  let config = this.graph.config;

  // JOIN
  this.nodes = g.selectAll(".node")
                .data(nodes, d => d.id);


  // show all nodes in transition
  // this is required to cancel any exit transitions
   this.nodes
    .transition()
    .duration(500 * this.animDurationFactor)
    .attr("scale", 1)
    .style("opacity",1)
    ;

  // UPDATE
  // No updates as elements are only shown/hidden


  // ENTER
  var nodeEnter = this.nodes.enter();
  this.buildNode(nodeEnter);

  // Merge
  this.nodes.merge(nodeEnter)


  // EXIT
   this.nodes.exit()
   .attr("scale", 1)
   .transition()
   .duration(800 * this.animDurationFactor)
   .attr("scale", 0)
   .style("opacity",0)
   .on("end", function(d){d.opacity = 1; d3.select(this).style("opacity",0).remove();});

  // update selection for first run
  this.nodes = g.selectAll(".node");

  // unset active
  this.nodes.selectAll(".contents.active")
    .classed("active", false)
    ;

  // set active
  if (config.activeNodeId){
    this.nodes.select("#node-" + config.activeNodeId)
    .classed("active",true);
  }

};

// Build the node on nodeEnter object
buildNode(nodeEnter){
  let config = this.graph.config;

  // get node holder
  var node = nodeEnter
  .append("g")
  .attr("class",d => "node type-" + d.type.toLowerCase())
  .on("mouseover", this.hoverNode.bind(this, true))
  .on("mouseout", this.hoverNode.bind(this, false))
  ;

  // init dragging
  node.call(d3.drag()
    .on("start", this.nodeDragStart.bind(this))
    .on("drag", this.nodeDrag.bind(this))
    .on("end", this.nodeDragEnd.bind(this))
    )
  ;

  // main node holder
  var nodeContents = node.append("g")
    .attr("id",d => "node-"+d.id)
    .attr("class",d => ["contents",(d.active ? " active" : ""),d.extraClass].join(" ") )
  ;

  // selector
  nodeContents.append("circle")
  .attr("r", d => d.radius * config.selectorScale)
  .attr("class", d => "selector color")
  .style("opacity",d=> config.selectorOpacity)
  ;

  // circle
  nodeContents.append("circle")
  .attr("r", d => d.radius)
  .attr("class", d => "icon color")
  ;

  // add the title
  // nodeContents.append("title")
  // .text(d => d.name)
  // ;


  // clipped thumbnail (experimental)
  // ---
  if (config.showBackgroundInNodes){
  let thumbnailGroup =  nodeContents.append("g");

    // clip path
    thumbnailGroup.append("clipPath")
      .attr("visibility",d => d.thumbnail ? null: "hidden")
      .attr("id", d => "clip-" + d.id)
      .attr("pointer-events", "none")
      .append("circle")
          .attr("r", d => d.radius)
    ;

    // add thumbnail image
    thumbnailGroup.append("image")
    .attr("visibility",d => d.thumbnail ? null: "hidden")
    .attr("xlink:href", d => d.thumbnail ? d.thumbnail : "")
    .attr("clip-path", d => "url(#clip-" + d.id+")")
    .attr("width", d => d.radius * 2)
    .attr("height", d => d.radius * 2)
    .attr("x", d=> -d.radius)
    .attr("y", d=> -d.radius)
    .attr("preserveAspectRatio", "xMinYMin slice")
    .style("opacity","0.2")
    .attr("pointer-events", "none")
    ;

    // ---
  }

  // add the icon
  nodeContents.append("image")
  .attr("xlink:href", d => process.env.REACT_APP_IMAGE_HOST + "/types/icon-"+d.type.toLowerCase()+".png")
  .attr("width", d => d.radius * config.iconScale)
  .attr("height", d => d.radius * config.iconScale)
  .attr("x", d => d.radius * config.iconScale / -2)
  .attr("y", d => d.radius * config.iconScale / -2 + d.radius * config.iconLift)
  .style("opacity",d=>d.opacity)
  .attr("pointer-events", "none")
  ;


  // We don"t us a single node group with a transform
  // attribute with linear scaling here, because
  // the text should not be scaling linear/uniform
  // for improved readability.

  // add the text
   nodeContents.append("text")
  .attr("text-anchor","middle")
  .attr("y", d => d.radius * config.textOffset)
  .attr("dy", ".35em")
  .attr("style",d => "font-size: "+(d.radius*config.textScale+config.textScaleOffset)+"px;font-weight:bold;")
  .attr("visibility",d => d.name ? null: "hidden")
  .style("opacity",d=>d.opacity)
  .call(this.wrapText.bind(this))
  .attr("pointer-events", "none")
  ;

  // insert text background label before text
  let radiusPadding = config.labelPadding * config.labelPaddingScale ;
  nodeContents.insert("rect","text")
  .attr("x",d => d.bbox.x - (d.radius * radiusPadding + config.labelPaddingOffset))
  .attr("y",d => d.bbox.y -  (d.radius * radiusPadding + config.labelPaddingOffset))
  .attr("rx",d => config.labelRadius * (d.radius * config.labelScale + config.labelScaleOffset))
  .attr("ry",d => config.labelRadius * (d.radius * config.labelScale + config.labelScaleOffset))
  .attr("width", d => d.bbox.width + 2 * (d.radius * radiusPadding + config.labelPaddingOffset))
  .attr("height", d => d.bbox.height + 2 *  (d.radius * radiusPadding + config.labelPaddingOffset))
  .attr("class", d=> "color-alt")
  .attr("visibility",d => d.name ? null : "hidden")
  ;

  // scale in transition
  nodeContents
    .transition()
    .duration(800 * this.animDurationFactor)
    .style("opacity", 1)
    ;

  node
    .attr("scale",0)
    .transition()
    .duration(800 * this.animDurationFactor)
    .attr("scale",1)
    ;

  // transform
  node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
}


// Hover on link circle
hoverNode(enable, d){
  clearTimeout(this.hoverTimeout);
  this.hoverTimeout = setTimeout(()=>{

    // related
    let nodes = this.graph.getRelated(d);

    // current node
    nodes.push(d);
    this.applyNodeHover(enable, nodes, d.linkList )
  }, 100);

}


// Apply node hover to graph
applyNodeHover(enable, nodes, links){

  // unhover all
  let opacity = enable ? (this.graph.config.activeNodeId ? 0.4 : 0.3) : 1;
  this.nodes.selectAll(".contents").transition().duration(400 * this.animDurationFactor).style("opacity",opacity);
  this.linksGroup.selectAll(".link").style("opacity",opacity * 0.5);

  if (enable){
    // highlight nodes
    nodes.forEach((node)=>{
      this.nodes.select("#node-"+node.id).transition().style("opacity", 1);
    });

    // show links
    links.forEach((link)=>{
      this.linksGroup.select("#link-"+link.id).style("opacity", 1);
    });
  }
}

// Wrap long text in multiple lines
wrapText(selection){
  var config = this.graph.config;
  // loop every element
  selection.each((d,index,elements) => {
    var fontSize = d.radius*config.textScale+config.textScaleOffset;
    var lineHeight = fontSize * config.lineHeight;

    // get text element
    var elem = d3.select(elements[index]);

    // split name by spaces
    var words = d.name.split(/\s+/);

    // initial span
    var span = elem.append("tspan").attr("dy",0).attr("x",0);

    // line holder
    var line = [];

    // word count
    var len = words.length;

    // loop all words
    words.forEach((word,index)=>{

      // add to line
      line.push(word);

      // set line to elem
      span.text(line.join(" "));

      // measure width
      if (span.node().getComputedTextLength() > d.radius * 2 * config.textWidth){
        let newLine = [];

        // cut last words if there are multiple words in the line
        if(line.length > 1){
          newLine = line.pop();
          span.text(line.join(" "))
          line = [newLine];
        } else{
          line = [];
        }
        // create new span
        if (index < len){
          span = elem.append("tspan").attr("dy",lineHeight).attr("x",0);

          span.text(line.join(" "));
        }
      }
    });

    // get and store bounding box
    d.bbox = elem.node().getBBox();
  });


}

// Get center position of a link
getLinkCenterPos(d){
  let dx = d.source.x - d.target.x;
  let dy = d.source.y - d.target.y;
  let dr = Math.sqrt(dx*dx+dy*dy) - d.target.radius - d.source.radius;

  let angle = Math.atan2(dy,dx);

  return {
      x: d.source.x - ((d.source.radius + dr / 2)* Math.cos(angle) ) ,
      y: d.source.y - ((d.source.radius + dr / 2)* Math.sin(angle) ) ,
    };
}


// Get center X of a link
getLinkCenterX(d){
  return ((1-d.ratio) * d.source.x + d.target.x * d.ratio);
}

// Get center Y of a link
getLinkCenterY(d){
  return ((1-d.ratio) * d.source.y + d.target.y * d.ratio);
}


// Update simulation with the new graph data
updateSimulation(self, nodes, links){
  var config = self.graph.config;
  var graphSpread = config.activeNodeId ? 1 : config.fullGraphSpread;

  // update simulation
  this.simulation
  .nodes(nodes)
  .force("charge", d3.forceManyBody().strength( -60 * graphSpread ))
  .force("center", config.centerForce ? d3.forceCenter(0,0) : null )
  .on("tick", ()=>{

    // link line
    this.links.select("line")
      .attr("x1", d => d ? d.source.x : 0)
      .attr("y1", d => d ? d.source.y : 0)
      .attr("x2", d => d ? d.target.x : 0)
      .attr("y2", d => d ? d.target.y : 0);

    // get center pos
    links.forEach(link => {link.centerPos = this.getLinkCenterPos(link)});

    // link circles
    this.links.select("circle")
      .attr("transform", d => d ? "translate("+ d.centerPos.x + "," + d.centerPos.y + ")" : "") ;

    // info box
    if (self.graph.config.activeLinkId){
      let link = self.graph.getLink(self.graph.config.activeLinkId);
      if (link){
        self.updateInfoPosition(link.centerPos.x, link.centerPos.y);
      }
    }

    // move active node to center
    // except when there are 3 nodes visible:
    // then centering could result in a straight line
    // which is undesirable
    if (self.graph.config.activeNodeId && nodes.length !== 3){
         let node = self.graph.getNode(self.graph.config.activeNodeId);
         node.x *= 0.9; node.y *= 0.9;
    }

    // update nodes
    this.nodes.attr("transform", function(d) { return (d ? (d.x ? "translate(" + d.x + "," + d.y + ")" : "translate(0,0)") :"") + "scale("+ d3.select(this).attr("scale")+")" } );
  })
  ;



  // update simulation force
  this.simulation.force("link")
  .links(links)
  .distance( link => ( (link.source.links === 1 || link.target.links === 1) ? (link.source.radius + link.target.radius ) * 1.85 : (link.source.radius + link.target.radius ) * 2.0) )// 150
  .strength( link => ( (link.source.links < 5 || link.target.links < 5 ) ? 0.8 / graphSpread : (link.source.radius + link.target.radius ) * (0.001 / graphSpread ) ) ) // 0.08
  ;
  // update simulation
  this.simulation.alphaTarget(0.3)
  .alphaDecay(this.graph.config.activeNodeId ? 0.025 : 0.001)
  .restart();

}

// Node dragging started
nodeDragStart(d) {
  if (!d3.event.active) { this.simulation.alphaTarget(0.3).restart(); }
  d.fx = d.x;
  d.fy = d.y;

  // store initial drag position
  d.dragX = d.fx;
  d.dragY = d.fy;
  d.startTime = (new Date()).getTime();
}

// Node being dragged
nodeDrag(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

// Node dragging ended
nodeDragEnd(d) {
  if (!d3.event.active) { this.simulation.alphaTarget(0); }

  // check drag distance
  let dx = d.dragX - d.fx;
  let dy = d.dragY - d.fy;
  let distance = Math.sqrt(dx*dx+dy*dy);
  let duration = (new Date()).getTime() - d.startTime;
  if (distance < 10 && duration < 500){

    // select
    if (this.graph.config.activeNodeId !== d.id){
      this.callbacks.setActiveNodeId(d.id);
    }
  }

  // reset movement
  d.fx = null;
  d.fy = null;
}

// Calculate center in group of nodes
getCenter(nodes){
  var x = 0, y = 0;
  nodes.forEach(node => {x += node.x; y+= node.y; });
  return { x : x/nodes.length, y: y/nodes.length };
}


// Updates the active link id and handles
// displaying the link description information
updateActiveLink(id){
  let config = this.graph.config;
  let self = this;

  // empty infograph
  if (id){
    this.infoGroup.selectAll("*").remove();
    // reset infoGroup transitions
    this.infoGroup.transition().style("opacity", 1);

  } else{
    this.infoGroup
      .transition()
      .duration(400)
      .style("opacity", 0)
      .on("end", function(d){ d3.select(this).style("opacity",0).selectAll("*").remove(); });
  }

  if (id){
    let link = this.graph.getLink(id);
    if (!link){
      return;
    }
    // build info box:

    // add group
    let g = this.infoGroup
          .append("g")
          ;

    // add text
    let text = g.append("text")
      .attr("text-anchor","middle")
      .attr("style","font-size: "+(config.infoTextScale)+"px;")
      ;
    var arrow = " → " //" &#x2192 ";
    link.descriptions1.map(
      (_, index) => (
        self.graph.config.activeNodeId === link.sourceNode.id ?
         [link.sourceNode.name,(link.descriptions1[index] ? link.descriptions1[index] : "Related to"),link.targetNode.name] :
         [link.targetNode.name,(link.descriptions2[index] ? link.descriptions2[index] : "Related to"),link.sourceNode.name]
        )
      ).forEach((lineParts)=>{

          let mainSpan = text.append("tspan")
            .attr("dy",config.infoTextScale * config.infoLineHeight)
            .attr("x",0)
          ;

          mainSpan.append("tspan")
                  .text(lineParts[0] + arrow);

          mainSpan.append("tspan")
                  .attr("class","description")
                  .text(lineParts[1]);

          mainSpan.append("tspan")
                  .text(arrow + lineParts[2]);
        }
    )
    ;

    var bbox = text.node().getBBox();

    var offsetY = link.value * config.relationDotSize;

    text.attr("y", offsetY + 1 );

    // insert box in background for the hovers
    bbox.width += config.infoTextPadding;
    bbox.height += config.infoTextPadding;
    g.insert("rect",":last-child")
      .attr("class","background")
      .attr("x",bbox.width / -2)
      .attr("y",offsetY)
      //.attr("y",bbox.height / -2)
      .attr("width", bbox.width)
      .attr("height", bbox.height)
      ;

    // add a transparent rect to capture mouse events.
    // this prevent an onmouseout event when the text is hovered
    g.append("rect")
      .attr("x",bbox.width / -2)
      .attr("y",offsetY)
      //.attr("y",bbox.height / -2)
      .attr("width", bbox.width)
      .attr("height", bbox.height)
      .attr("style","opacity:0")
      ;

    // red dot at 0,0 for development :)
    // let dot = g.append("circle").attr("style","fill:#ff0000;").attr("r",2);

    this.updateInfoPosition(link.centerPos.x, link.centerPos.y);
  }

}

// Updates the position of the link info popup
updateInfoPosition(x,y){
  this.infoGroupPos.x = x;
  this.infoGroupPos.y = y;
  this.infoGroup.attr("transform","translate("+this.infoGroupPos.x+","+this.infoGroupPos.y+") scale(" + this.graph.config.infoBaseScale/this.k + ")");
}

}

