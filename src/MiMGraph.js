import React from 'react';
import ReactDOM from 'react-dom';
import App from './Components/App/App';
import Config from './Config';

export default class MiMGraph {

  // constructor
  constructor(autoLoad) {
    this.graphData = null;
    if (autoLoad){
      this.load();
    }
  }

  // Initialize mim-graph
  load(){
    this.loadData(this.initElements.bind(this));
  }


  // load data from server
  loadData(callback){
    // graph data url, could be a static json file later one
    let url = Config.dataUrl;

    url = false;
    // placeholder data
    if (!url){

      // This objects shows the graph data format
      // Use it as an inspiration for your own data service
      this.graphData = {nodes: [
        {type:"composer",dateStart:"1950-01-01",dateEnd:"2000-01-01","description":"This is an example description", id:"composer-louis-andriessen", media:"",metadata:"",name:"Composer 1",sources:"http://www.wikipedia.org",thumbnail:"",copyright:"Example license"},
        {type:"composition",dateStart:"2000-01-01",dateEnd:"","description":"This is an example description", id:"composition1", media:"",metadata:"",name:"Composition 1",sources:"http://www.wikipedia.org",thumbnail:"",copyright:"Example license"},
        {type:"inspiration",dateStart:"",dateEnd:"","description":"This is an example description", id:"inspiration1", media:"",metadata:"",name:"Inspiration 1",sources:"http://www.wikipedia.org",thumbnail:"",copyright:"Example license"},
        {type:"technique",dateStart:"",dateEnd:"","description":"This is an example technique", id:"technique1", media:"",metadata:"",name:"Technique 1",sources:"http://www.wikipedia.org",thumbnail:"",copyright:"Example license"},
        ], links: [
          { id1: "composer-louis-andriessen", id2: "composition1", ids:["a"], descriptions1: ["Composed","Performed"],  descriptions2: ["Composed by","Performed by"] },
          { id1: "composition1", id2: "technique1", ids:["b"], descriptions1: ["Uses"],  descriptions2: ["Used by"] },
          { id1: "inspiration1", id2: "composition1", ids:["c"], descriptions1: ["Inspired"],  descriptions2: ["Inspired by"] },
          { id1: "composer-louis-andriessen", id2: "technique1", ids:["d"], descriptions1: ["Invented"],  descriptions2: ["Invented by"] },
        ]};
      callback();
      return;
    }

    // fetch data from url
    fetch( url )
      .then((response) => {
        if (response.status >= 400) {
          throw new Error("Error loading data");
        }
        return response.json();
      }).then((json)=> {

        // restructure to internal format
        // entities  --> nodes
        // relations --> links
        this.graphData = JSON.parse(JSON.stringify({nodes: json.entities, links: json.relations}));

        // call our callback function
        callback();
      });
  }

  initElements(){
     // get graph containers
    let elements = document.getElementsByClassName('mim-graph');

    // load graphdata  in each container
    var self = this;
    Array.from(elements).forEach((element)=>{
      self.initElement(element);
    });
  }

  // Init a element
  initElement(element){
    let rect = element.getBoundingClientRect();
    let bodyHeight = window.innerHeight && document.documentElement.clientHeight ?
        Math.min(window.innerHeight, document.documentElement.clientHeight) :
        window.innerHeight ||
        document.documentElement.clientHeight ||
        document.getElementsByTagName('body')[0].clientHeight;

    // get element height
    let height = parseInt(element.getAttribute('data-height'), 10);
    // for now we maximize height
    height = window.innerHeight;
    height = Math.min(height ? height: 800, bodyHeight - rect.top);
    element.style.height = height + 'px';

    let config = {
      activeNodeId : element.getAttribute("data-node-id"),
      height
    };

    // init graph inside the element with the given config
    this.initGraph(element, Object.assign({},this.graphData), config);
  }

  // Init graph in the specified dom element
  initGraph(element, graphData, config){
    // Link ReactDOM
    ReactDOM.render(
      <App graphData={graphData} config={config} />,
      element
    );
  }

  // Create a new MiMGraph instance
  static init(autoLoad=true){

    if (!MiMGraph.instance){
      MiMGraph.instance = new MiMGraph(autoLoad);
    }

    return MiMGraph.instance;
  }

}
