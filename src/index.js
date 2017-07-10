import './index.css';
import MiMGraph from './MiMGraph';

// Listen for the DOM to be fully loaded, then initialize MiMGraph
window.addEventListener('load', function() {
  MiMGraph.init(!(window.MiMGraphAutoLoad === false));
});
