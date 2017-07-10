Music in Movement - Graph visualization
======

`mim-graph` is a graph visualization for the Music in Movement project.

> Please note: This repository only includes the visualization source code, not the complete Music in Movement dataset.


Config
------

Clone the repository and change the config in `src/Config.js` to match your data endpoints. To make this visualization match your needs; you can also customize files like `src/Components/Help/Help.js`, `src/Components/App/types.scss`.


Compile
------

From your command line run:
- `npm install` -- installs the required packages
- `npm run scss` -- starts the SCSS compiler watch
- `npm start` -- compiles the application and opens a browser at `http://localhost:3000`.


Setup
------

Include `mim-graph` on your page:

```html
<link href="mim/mim-graph.css" rel="stylesheet" type="text/css" />
```

```html
<script src="mim/mim-graph.js"></script>
```

Set UTF-8 as the required charset:

```html
<meta charset="utf-8">
```


Initializing visualizations
------

The library will automatically initialize on `window.onload` and inject the visualization in all elements with the class `mim-graph`.

> Auto initializing can be prevented by setting `window.MiMGraphAutoLoad=false;` before `window.onload` is triggered.

Graph with focus on a specific entity with id `composer-louis-andriessen`:
```html
<div class="mim-graph" data-node-id="composer-louis-andriessen"></div>
```


Graph with focus on a specific entity with id `composer-louis-andriessen` and height `600`px:
```html
<div class="mim-graph" data-height="600" data-node-id="composer-louis-andriessen"></div>
```

> Height defaults to 800 and is limited by window.innerHeight


Full graph:
```html
<div class="mim-graph"></div>
```

Event based control
------
The active node of the visualisation can be changed by sending a `MIM_GRAPH_SET_ACTIVE_NODE` event to the `window` with detail parameter: `{detail: {nodeId: "composer-louis-andriessen"}}`


Namespaces
------

In order to prevent conflicts with other code on the host page, `mimgraph` is limited to the following namespaces:

1. CSS styling of the graph visualization has `.mim-graph` as root class.
2. The Javascript is embedded in the object `MiMGraph`


Data
------
The music in movement dataset has been excluded from this repository. Check `MiMGraph.js` for an example of the data format


License
------
License is provided in the file `LICENSE`.



