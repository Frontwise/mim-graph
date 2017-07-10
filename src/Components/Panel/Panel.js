import React, { Component } from "react";
import { Scrollbars } from "react-custom-scrollbars";

class Panel extends Component {

  checkMakeLink(data){
    if (data && typeof data === "string" && data.startsWith("http")){
      return (<a href={data} target="_blank">{data}</a>)
    }
    return (<span>{data}</span>);
  }

  makeList(data, className){
      return (<ul className={className} >{data.split("\n").map((source,index)=>(<li key={index}>{this.checkMakeLink(source)}</li>))}</ul>)
  }

  getMediaPlayer(media){
    if (!media){ return null };

    switch(true){

      case media.endsWith(".mp3"):
        return <audio controls>
                  <source src={media} type="audio/mpeg" />
                </audio>
      case media.endsWith(".ogg"):
        return <audio controls>
                  <source src={media} type="audio/ogg" />
                </audio>
      default:
        return null
    }
  }

  getFormattedDate(s){
    var dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return (new Date(s)).toLocaleString('en-US', dateOptions)
  }

  render() {
    let node = this.props.node;

    return (
         <div className={["Panel",this.props.active ? "active" : null].join(" ")} key={node.id}>
            <Scrollbars autoHeight autoHeightMax={this.props.height}>
              <div className="image">
                {node.thumbnail ? <div className="thumbnail" style={{backgroundImage: "url("+node.thumbnail+")"}} /> : null }
                <div className={["icon","color","type-"+node.type, node.thumbnail ? "float" : "", node.extraClass, node.type==="composer" ? "node-"+node.id : "" ].join(" ")} />
              </div>
              <h1>{node.name}</h1>
              <h2 className={"color-dark-"+ node.type}>{node.type}</h2>
              {this.getMediaPlayer(node.media)}
              <p>{node.description}</p>
              {node.dateStart ? <p className="date">{this.getFormattedDate(node.dateStart)} {node.dateEnd ? ' ‒ ' + this.getFormattedDate(node.dateEnd) : ''}</p> : null}
              {node.sources ? this.makeList(node.sources, "sources") : null }
              {node.copyright ? this.makeList(node.copyright, "copyright"): null }
            </Scrollbars>
          </div>
    );
  }
}

export default Panel;
