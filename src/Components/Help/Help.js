import React, { Component } from "react";
import { Scrollbars } from "react-custom-scrollbars";

class Help extends Component {


getTypeList(){
  let types = ['audio','composer','composition','event','image','inspiration','location','movie','person','technique'];
  return types.map( (type, index) => (
                  <li className="icon" key={type}>
                    <div className={"icon color type-" + type + ' ' + (type ==='composer' ? 'node-composer-kazimierz-serocki' : (type ==='composition' ? 'node-influence-composer-kazimierz-serocki' : '') ) }></div><h2>{type}</h2>
                  </li>
                ))
}

 render() {

    return (
         <div className="help">
            <Scrollbars autoHeight autoHeightMax={this.props.height}>
              <div className="container">
                <ul>
                  <li className="full">
                    <h1>About this visualization</h1>
                    <p>
                      The <i>Musical Crossroads</i> visualization is a graph representation of the life and work of the composers that are featured in the Music in Movement project.
                    </p>
                  </li>

                  <li className="full">
                    <h1>Navigation</h1>
                    <p>
                        These tips may help you to explore the graph:
                    </p>

                    <ul className="tips">
                        <li>Drag the viewport using your mouse (click+drag) or touch screen (tap+drag)</li>
                        <li>Zoom the viewport using your mouse (scroll wheel) or touch screen (pinch zoom)</li>
                        <li>To explore an entity, click it to make its connections visible</li>
                        <li>Hover a dot on a link to display the relation between the entities it connects</li>
                        <li>The home button lets you return to the full network</li>
                        <li>The Prev(ious) and Next button let you walk though your history</li>
                    </ul>
                  </li>

                  <li className="full">
                    <h1>Legend</h1>
                    <ul>
                      { this.getTypeList() }
                    </ul>

                  </li>

                  <li className="full">
                    <h1>Dataset</h1>
                    <p>
                       The <i>Musical Crossroads</i> data set is created by the Music in Movement editorial team. The dataset isn't included in this repository.
                    </p>
                  </li>

                  <li className="full last">
                    <h1>License</h1>
                    <p>
                       This visualization is developed by Frontwise for Sound & Vision within the context of the Music in Movement project.<br />
                       It is licensed under the MIT license, and is available at GitHub: <a href="https://github.com/frontwise/mim-graph">https://github.com/frontwise/mim-graph</a>
                    </p>
                  </li>

                </ul>
              </div>
            </Scrollbars>
          </div>
    );
  }
}

export default Help;
