# theia-momot-ext

This package is a thin, decoupled Eclipse Theia and EMF.cloud contribution skeleton for MOMoT optimization tasks and trade-off exploration.

It provides contribution points for commands, menus, and views that utilize the decoupled MOMoT isomorphic results parser, Model Hub/Server REST client, and trade-off SVG widget.

---

## Architecture & Integration Layout

The extension leverages the isomorphic `cloud/` workspace packages to keep IDE-specific code thin, stateless, and easy to maintain.

```text
                  +-----------------------------------+
                  |         Eclipse Theia IDE         |
                  |                                   |
                  |   +---------------------------+   |
                  |   |  theia-momot-ext          |   |
                  |   |  (Commands, Views, Menu)  |   |
                  |   +-------------+-------------+   |
                  +-----------------|-----------------+
                                    |
            +-----------------------+-----------------------+
            | imports                                       | imports
            v                                               v
+-----------------------+                       +-----------------------+
| @momot/momot-results  |                       | @momot/tradeoff-ui    |
| (Parse Pareto .pf,    |                       | (Isomorphic SVG Plot, |
|  extract outputs)     |                       |  Interactive select)  |
+-----------+-----------+                       +-----------+-----------+
            |                                               |
            |                                               | wire selection
            v                                               v
+-----------------------------------------------------------+-----------+
| @momot/momot-emfcloud-bridge                                          |
| (isomorphic HTTP PUT client: loadOptimizedModel / pushJobResultsToHub)|
+-----------------------------------+-----------------------------------+
                                    |
                                    | PUT model content
                                    v
                  +-----------------------------------+
                  |      EMF.cloud Model Hub /        |
                  |          Model Server             |
                  +-----------------------------------+
```

---

## How to Import & Use in a Theia/EMF.cloud Host

### 1. Declaring Dependencies

In your Theia extension or web client application, add the core MOMoT isomorphic packages:

```json
{
  "dependencies": {
    "@momot/momot-results": "1.0.0",
    "@momot/momot-emfcloud-bridge": "1.0.0",
    "@momot/momot-tradeoff-ui": "1.0.0"
  }
}
```

### 2. Loading Pareto Results and Initializing the Trade-off UI

Inside your view or widget controller, fetch your job results and instantiate the plot:

```ts
import { parseParetoFront, getOutputContent } from '@momot/momot-results';
import { MomotTradeoffPlot } from '@momot/momot-tradeoff-ui';
import { DefaultMomotEmfcloudBridge } from '@momot/momot-emfcloud-bridge';

// 1. Parse your overall objectives Pareto front file
const pfContent = getOutputContent(jobResult, 'out/objectives/overall_objectives.pf');
const points = parseParetoFront(pfContent);

// 2. Initialize the Model Hub bridge client
const bridge = new DefaultMomotEmfcloudBridge({
  modelServerUrl: 'http://localhost:8081/modelserver',
  modelHubUrl: 'http://localhost:8081/modelhub'
});

// 3. Create the interactive SVG Trade-off Plot
const plot = new MomotTradeoffPlot(points, {
  width: 600,
  height: 400,
  xLabel: 'Makespan (Minimize)',
  yLabel: 'Solution Length (Minimize)',
  onSelect: async (point, index) => {
    console.log(`Point selected: [${point.objectives.join(', ')}]`);
    
    // Wire selection directly to EMF.cloud Model Hub
    const res = await wireSelectionToHub(index, jobResult, bridge);
    if (res.success) {
      console.log(`Successfully staged solution model ${res.path} under URI: ${res.targetUri}`);
    } else {
      console.error(`Failed to stage solution model: ${res.message}`);
    }
  }
});

// 4. Mount the rendered SVG directly to your view panel DOM container
const container = document.getElementById('my-theia-widget-container');
const svgElement = plot.renderToDom();
if (svgElement && container) {
  container.appendChild(svgElement);
}
```

---

## Interactive Demo

You can find an interactive story-like demo containing mock results and interactive selection-to-model resolution wiring in:
`cloud/packages/momot-tradeoff-ui/demo-fixture.html`

To run the demo, simply open `demo-fixture.html` in any web browser!
