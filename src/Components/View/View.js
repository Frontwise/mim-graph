import React, { Component } from "react";
import ReactDOM from "react-dom";
import D3Graph from "../D3Graph/D3Graph";

class View extends Component {

  constructor(props){
    super(props);
    this.graph = props.graph;
    this.callbacks = props.callbacks;
    this.lastActiveNodeId = undefined;
    this.lastActiveLinkId = undefined;
  }

  componentDidMount() {
    var el = ReactDOM.findDOMNode(this);

    // update config width, height
    this.graph.updateConfig({
      width:el.offsetWidth,
      height:el.offsetHeight
    });

    // disable scrolling
    el.onwheel = (e)=>{ e.preventDefault(); }
    el.onmousewheel = (e)=>{ e.preventDefault(); }

    this.d3graph = new D3Graph(el, this.graph, this.callbacks);
    window.addEventListener("resize",this.resize.bind(this));
  }

  resize(){
    var el = ReactDOM.findDOMNode(this);
    this.d3graph.resize(el.offsetWidth,el.offsetHeight);
  }

  componentDidUpdate() {
    var el = ReactDOM.findDOMNode(this);
    this.d3graph.update(el, this.graph);
  }

  shouldComponentUpdate(nextProps, nextState){

    if (this.graph.config.forceRender){ return true; }

    // handle active link id updates
    if (this.lastActiveLinkId !== this.graph.config.activeLinkId){
      this.d3graph.updateActiveLink(this.graph.config.activeLinkId);
    }


    // handle active node id updates
    let update = this.lastActiveNodeId !== this.graph.config.activeNodeId;
    this.updateActiveLinkIds();

    return update;
  }

  updateActiveLinkIds(){
    this.lastActiveNodeId = this.graph.config.activeNodeId;
    this.lastActiveLinkId = this.graph.config.activeLinkId;
  }

  componentWillUnmount() {
    var el = ReactDOM.findDOMNode(this);
    this.d3graph.destroy(el);
    this.d3graph = null;
  }


  render() {
    return (
      <div className="View"/>
    );
  }
}

export default View;