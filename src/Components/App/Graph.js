import Positions from './DefaultPositions.js';

// GraphController.js

export default class Graph{

  constructor (graph,config) {
    // config
    this.config = {
      // Allow going to full graph
      fullGraph: false,

      // show backgrounds in nodes
      showBackgroundInNodes: false,

      // show also secondary related nodes when setActiveNodeing
      secondaryRelated: false,

      // radius of node; many parameters are based
      // on a node"s radius, to provide a way of uniform
      // scaling.
      radius: 22,

      // amount added to radius for each link
      radiusIncrement:  1.3,

      // penalty for nodes with < 2 links
      noLinkPenalty: 0,

      // view width
      width: 100,

      // view height
      height: 100,

      // offset of link stroke width
      linkOffset: 2,

      // scale of link stroke width
      linkScale: 0.15,

      // scale of icons as factor of radius
      iconScale: 1.03,

      // icon y as factor of radius
      iconLift: -0.18,

      // text y as factor of radius
      textOffset: 0.88,

      // scale of text as factor of radius
      textScale: 0.15,

      // offset of text scale
      textScaleOffset: 4.0,

      // max width of text as factor of diameter
      textWidth: 1.5,

      // scale of collision as factor of radius
      collisionScale: 1.8,

      // strength of node collision
      collisionStrength: 0.3,

      // alphaTarget of graph after update
      alphaTarget: 1,

      // amount of additional node spreading for full graph
      fullGraphSpread: 4,

      // height of text lines as factor font size
      lineHeight: 1.3,

      // scale of label as factor of radius
      labelScale: 0.01,

      // offset of label scale
      labelScaleOffset: 5,

      // scale of padding as factor of radius
      labelPaddingScale: 0.1,

      // offset padding of label
      labelPaddingOffset: 0.5,

      // base padding of label as factor of radius
      labelPaddingFactor: 1.5,

      // base padding of label as factor of radius
      labelPadding: 1.5,

      // label corner radius
      labelRadius: 0,

      // size of the relation descriptions dot as factor of the link value
      relationDotSize: 1.4,

      // selector scale as factor of node radius
      selectorScale: 1.5,

      // selector opacity
      selectorOpacity: 0.4,

      // size of the info text in px
      infoTextScale: 7,

       // size of the info line-height in px
      infoLineHeight: 1.5,

      // size of the info text padding in px
      infoTextPadding: 10,

      // scale of the info block
      infoBaseScale: 2.0,

      // active node id
      activeNodeId: null,

      // active relation id
      activeLinkId: null,

      // force rendering graph
      forceRender: false,

      // force rendering graph
      centerForce: true,


    };

    this.config = Object.assign({},this.config,config);
    this.data = this.prepareGraph(graph);

    // initial history object
    this.history = {
      index: -1,
      ids: []
    };

    // preload with active node
    if(this.config.activeNodeId){
      this.setActiveNode(this.getNode(this.config.activeNodeId));
    }
  }

  // update the config
  updateConfig(config){
    this.config = Object.assign({},this.config, config);
  }

  // Prepare graph data by adding fields
  // required for graph visualisation
  prepareGraph(graph){

    var config = this.config;
    var index = {};

    // set default position and radius
    graph.nodes.forEach((node, i)=>{

        // check for valid id:
        // a node id can not start with a number
        // so check for a number first, before selecting
        if (!isNaN(parseInt(node.id.substr(0,1), 10))){
          throw new Error("A node id cannot start with a number: " + node.id);
        }

        // fix node ids with space
        if (node.id.indexOf(" ") > -1){
          let newId = node.id.replace(" ","-");
          graph.links.forEach((link)=>{
            if (link.id1 === node.id){
              link.id1 = newId;
            } else{
              if (link.id2 === node.id){
                link.id2 = newId;
              }
            }
          });
          node.id = newId;
        }

        // positions from list, or random
        if (node.id in Positions){
          node.x = Positions[node.id].x;
          node.y = Positions[node.id].y;
        } else{
          node.x = Math.random() * 100;
          node.y = Math.random() * 100;
        }

        // helper properties
        node.radius = config.radius;
        node.links = 0;
        node.opacity = 1;
        node.visible = node;
        node.wasVisible = false;
        node.active = false;
        node.extraClass = "";
        node.linkList = [];

        // limit title length
        node.name = node.name.substring(0,128);

        // set to node index
        index[node.id] = i;
    });

    // calculate radius based on number of links
    graph.links.forEach((link)=>{

      // set source/target properties
      link.source = link.id1;
      link.target = link.id2;
      link.id = link.ids.join("-");
      link.centerPos = {x: 0, y: 0};

      // set source/target nodes
      link.sourceNode = graph.nodes[index[link.source]];
      link.targetNode = graph.nodes[index[link.target]];

       // increase node radius for each link
        graph.nodes.forEach((node)=>{
          if (node.id === link.id1 || node.id === link.id2){
            node.radius += config.radiusIncrement;
            node.links++;
            node.linkList.push(link);
          }
      });
    });

    // only links to existing nodes
    graph.links = graph.links.filter(link => (graph.nodes[index[link.source]] || !graph.nodes[index[link.target]] ) );

    // calculate link value based on connected node links
    graph.links.forEach((link)=>{
      link.value = config.linkOffset + config.linkScale * (graph.nodes[index[link.source]].links + graph.nodes[index[link.target]].links) / 2;
      link.ratio = graph.nodes[index[link.source]].radius / (graph.nodes[index[link.source]].radius + graph.nodes[index[link.target]].radius) ;
    });

    // check for extra graph class for compositions
    graph.links.forEach((link) =>{
      if (link.sourceNode.type === "composer" && link.targetNode.type === "composition"){
        link.targetNode.extraClass = "node-influence-" + link.sourceNode.id;
      }
      if (link.targetNode.type === "composer" && link.sourceNode.type === "composition"){
        link.sourceNode.extraClass = "node-influence-" + link.targetNode.id;
      }
    })

     // give penalty to nodes with < 2 links
    graph.nodes.forEach((node, i)=>{
      if (node.links < 2){
        node.radius -= config.noLinkPenalty;
      }
    });

    // remove orphan nodes
    graph.nodes = graph.nodes.filter(node=>(node.links > 0));

    return graph;
  }


  // Add id to history
  addToHistory(id){
    var history = this.history;

    // don"t add duplicates
    if (history.index >= 0 && history.ids[history.index] === id){
      return;
    }

    history.index ++;

    // remove old
    if (history.index > 0 && history.index < history.ids.length){
      history.ids = history.ids.slice(0,history.index)
    }
    // add new
    history.ids[history.index] = id;
  }

  // Previous step in history
  historyPrev(){
    var history = this.history;

    if (this.hasPrev()){
      history.index--;
      let node = this.getNode(history.ids[history.index]);
      return node ? node.id : null;
    }
    return false;
  }

  hasPrev(){
    return this.history.index > 0;
  }

  // Previous step in history
  historyNext(){
    var history = this.history;

    if (this.hasNext()){
      history.index++;
      let node = this.getNode(history.ids[history.index]);
      return node ? node.id : null;
    }
    return false;
  }

  hasNext(){
    return this.history.index < this.history.ids.length-1;
  }

  // setActiveNode the given node
  setActiveNode(d, addToHistory = true){
    // example implementation
    // for highlighting
    if (!d || d.active){

      if (this.config.fullGraph){

        // stop focus
        this.data.nodes.forEach(node => {
          node.wasVisible = node.visible;
          node.visible = true;
          node.active = false;
          node.opacity = 1;
        });

        this.config.activeNodeId = null;

        if (!d){

          // add null to history
          if (addToHistory){
            this.addToHistory(null);
          }
        }
      }

    } else{

      // disable focus
      this.data.nodes.forEach(node => {
        node.fx=null;
        node.fy = null;
        node.wasVisible = node.visible;
        node.visible = false;
        node.active = false;
        node.opacity = 1;
      });

      this.config.activeNodeId = d.id;

      // focus node
      d.opacity = 1;
      d.active = true;
      d.visible = true;

      // center
      d.fx = this.config.width / -2;
      d.fy = this.config.height / -2;

      // lock
      d.fx = d.x;
      d.fy = d.y;
      setTimeout(()=>{d.fx=null;d.fy=null;},10);

      // related
      let related = this.getRelated(d);

      // secondary related
      if (this.config.secondaryRelated){
        let sRelated = [];
        var self = this;
        // add original related
        related.forEach(node => { sRelated[node.id] = node});

        // add related of related
        related.forEach(node => {
          let rel = self.getRelated(node);
          rel.forEach(n => {sRelated[n.id] = n});
        })

        related = Object.keys(sRelated).map(id => (sRelated[id]));
      }

      related.forEach(node=>{
        // spawn from active node
        if (!node.wasVisible) {
          node.x = d.x;
          node.y = d.y;
        }
        node.opacity = 1;
        node.visible = true;
      });


      // add id to history
      if (addToHistory){
        this.addToHistory(d.id);
      }
    }
}

// get related nodes for a given node object
getRelated(node){
  var index = {};
  this.data.nodes.forEach((n,i)=>{index[n.id] = i});

  let result = [];
  this.data.links.forEach(r=>{
    switch(true){
      case r.id1===node.id:
      result.push(r.targetNode);
      break;
      case r.id2===node.id:
      result.push(r.sourceNode);
      break;
      default:
    }
  });
  return result;
}

// get a node object by a given id
getNode(id){
  if (!id){ return null; }

  for (var i = 0, len = this.data.nodes.length; i<len; i++){
    if (this.data.nodes[i].id === id){
      return this.data.nodes[i];
    }
  }
  return null;
}


// get a relation object by a given id
getLink(id){
  if (!id){ return null; }

  for (var i = 0, len = this.data.links.length; i<len; i++){
    if (this.data.links[i].id === id){
      return this.data.links[i];
    }
  }
  return null;
}

// set active link
setActiveLinkId(id){
  this.config.activeLinkId = id;
}


getVisibleNodes(){
  return this.data.nodes.filter(node=>node.visible);
}

getVisibleLinks(){
  return this.data.links.filter(link=>link.sourceNode.visible && link.targetNode.visible)
}

setFullGraph(fullGraph){
  this.config.fullGraph = fullGraph;
}


}

