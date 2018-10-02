import React, { Component } from "react";
import Panel from "../Panel/Panel";
import View from "../View/View";
import Help from "../Help/Help";
import Graph from "./Graph";
import CSSTransition from "react-transition-group/CSSTransition";
import TransitionGroup from "react-transition-group/TransitionGroup";

class App extends Component {
  constructor(props) {
    super(props);

    this.props = props;

    // call back functions for children
    this.callbacks = {
      setActiveNodeId: this.setActiveNodeId.bind(this),
      setActiveLinkId: this.setActiveLinkId.bind(this)
    };

    // create initial state
    this.state = {
      height: props.config.height,
      activeNodeId: props.config.activeNodeId,
      activeLinkId: props.config.activeLinkId,
      graphData: props.graphData,
      graph: null,
      panelActive: window.innerWidth > 768,
      helpActive: false
    };

    // resize listener
    window.addEventListener("resize", this.resize.bind(this));

    // node change listener
    this.initNodeChangeListener();
  }

  initNodeChangeListener() {
    var self = this;
    window.addEventListener("MIM_GRAPH_SET_ACTIVE_NODE", e => {
      if (e.detail && e.detail.nodeId) {
        self.setActiveNodeId(e.detail.nodeId, true);
      }
    });
  }

  componentWillMount() {
    // init graph
    this.setState({
      graph: new Graph(
        this.state.graphData,
        {
          height: this.state.height
        },
        this.callbacks
      )
    });
  }

  componentDidMount() {
    // active node preload if the id is set and the node exists
    if (
      this.state.activeNodeId &&
      this.state.graph.getNode(this.state.activeNodeId)
    ) {
      this.setActiveNodeId(this.state.activeNodeId, true);
      this.state.graph.setFullGraph(true);
    } else {
      this.setActiveNodeId("", false);
      this.state.graph.setFullGraph(true);
    }
    this.setState({});
  }

  resize() {
    // this.setState({
    //   height: Math.min(this.state.initHeight, window.innerHeight),
    // })
  }

  // set active node id in the graph and update the state
  setActiveNodeId(id, addToHistory = true) {
    let node = this.state.graph.getNode(id);

    if (!node) {
      id = "";
    }

    // upgate graph
    this.state.graph.setActiveNode(node, addToHistory);

    // update state
    this.setState({
      activeNodeId: id
    });

    // send event to main window, so the host application could
    // link an action to it; e.g. loading additional information
    var event = new CustomEvent("MIM_GRAPH_ACTIVE_NODE", {
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  }

  // go 1 step back
  historyPrev() {
    let nodeId = this.state.graph.historyPrev();
    if (nodeId !== false) {
      this.setActiveNodeId(nodeId, false);
    }
  }

  // go 1 step forward
  historyNext() {
    let nodeId = this.state.graph.historyNext();
    if (nodeId !== false) {
      this.setActiveNodeId(nodeId, false);
    }
  }

  // set active link id in the graph and update the state
  setActiveLinkId(id) {
    // check for valid link
    if (id) {
      let link = this.state.graph.getLink(id);
      if (!link) {
        // id set, but invalid link
        return;
      }

      // prevent showing hidden links
      if (
        this.state.graph.config.activeNodeId &&
        this.state.graph.getNode(this.state.graph.config.activeNodeId)
      ) {
        let hit = false;
        let links = this.state.graph.getVisibleLinks();
        links.some(link => {
          if (link.id === id) {
            hit = true;
            return true;
          }
          return false;
        });
        if (!hit) {
          // link is currently not visible
          return;
        }
      }
    }
    this.state.graph.setActiveLinkId(id);
    this.setState({
      activeLinkId: id
    });
  }

  // set Panel inactive
  setPanelActive(panelActive) {
    this.setState({ panelActive });
  }

  // toggle Panel active
  togglePanelActive() {
    this.setPanelActive(!this.state.panelActive);
  }

  // set Help inactive
  setHelpActive(helpActive) {
    this.setState({ helpActive });
  }

  // toggle Help active
  toggleHelpActive() {
    this.setHelpActive(!this.state.helpActive);
  }

  // main render function
  render() {
    let graph = this.state.graph;
    let activeNodeId = this.state.activeNodeId;
    let activeNode = this.state.graph.getNode(activeNodeId);

    return (
      <div className="App">
        {graph ? (
          <View
            graph={graph}
            activeNodeId={activeNodeId}
            callbacks={this.callbacks}
          />
        ) : null}
        <TransitionGroup className="panel-transition">
          <CSSTransition
            key={activeNodeId}
            classNames="fade-wait"
            timeout={{ enter: 400, exit: 200 }}
            in={activeNode && activeNodeId && this.state.panelActive}
            unmountOnExit
          >
            {activeNodeId ? (
              <Panel
                key={activeNodeId}
                active={this.state.panelActive}
                height={this.state.height}
                node={activeNode}
                setPanelActive={this.setPanelActive}
              />
            ) : (
              <div />
            )}
          </CSSTransition>
        </TransitionGroup>

        <div className="steps">
          <div
            title="Full graph view"
            className={[
              "home icon-button",
              this.state.activeNodeId ? "" : "inactive"
            ].join(" ")}
            onClick={() => {
              this.setActiveNodeId(null);
            }}
          >
            HOME
          </div>
          <div
            title={graph.hasPrev() ? "Go back" : "No more steps to go back"}
            className={[
              "prev icon-button",
              graph.hasPrev() ? "" : "inactive"
            ].join(" ")}
            onClick={this.historyPrev.bind(this)}
          >
            PREV
          </div>
          <div
            title={
              graph.hasNext() ? "Go forward" : "No more steps to go forward"
            }
            className={[
              "next icon-button",
              graph.hasNext() ? "" : "inactive"
            ].join(" ")}
            onClick={this.historyNext.bind(this)}
          >
            NEXT
          </div>
        </div>

        {!this.state.helpActive ? (
          <div
            title="Show additional information about this visualization"
            onClick={() => {
              this.setHelpActive(true);
            }}
            className="icon-button help-button"
          >
            HELP
          </div>
        ) : null}

        {activeNode ? (
          <div
            className={[
              "toggle-panel icon-button",
              this.state.panelActive ? "close" : null
            ].join(" ")}
            onClick={this.togglePanelActive.bind(this)}
          >
            {this.state.panelActive ? "CLOSE" : "INFO"}
          </div>
        ) : null}

        <div className="help-transition">
          <CSSTransition
            classNames="fade-wait"
            timeout={{ enter: 400, exit: 200 }}
            in={this.state.helpActive}
            unmountOnExit={true}
          >
            <Help height={this.state.height} />
          </CSSTransition>
        </div>

        {this.state.helpActive ? (
          <div
            className="icon-button close-help-button"
            onClick={() => {
              this.setHelpActive(false);
            }}
          >
            CLOSE
          </div>
        ) : null}
      </div>
    );
  }
}

export default App;
