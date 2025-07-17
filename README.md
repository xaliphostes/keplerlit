# Three.js with iso-contours on 3D triangulated surfaces

Written in TypeScript.

<p align="center">
    <img src="media/screen.png" alt="drawing" width="500"/>
</p>

## Building the lib
```bash
git clone https://github.com/xaliphostes/keplerlit.git
npm install
npm run build
```

## Testing

Run
```bash
npm run serve
```

and then open [this link](http://127.0.0.1:8080).

## Live server
[**Try this link**](https://xaliphostes.github.io/keplerlit/)

# Usage
```js
const threeGeom = new THREE.TorusGeometry(1.5, .5, 32, 63);
const scalarField = [...] // at vertices

const filledContours = new keplerlit.IsoContoursFilled('Rainbow', 256, [0, 0.1, 0.7, 3.1])
const result = filledContours.run(scalarField, convertToKeplerGeometry(threeGeom))
const newThreeGeom = createMeshFromKeplerResult(result) // filled
scene.add(newThreeGeom)

// ----------------------------------------------
// Utilities for three <-> keplerlit
// ----------------------------------------------

/**
 * Convert Three.js BufferGeometry to KeplerLit BufferGeometry.
 * Since this lib is independent of three.js, we have to convert the geometry and topology accordingly
 */
function convertToKeplerGeometry(threeGeometry) {
    const positions = threeGeometry.attributes.position.array;
    const indices = threeGeometry.index ? threeGeometry.index.array : this.generateIndices(positions.length / 3);

    const keplerPositions = new keplerlit.Float32BufferAttribute(Array.from(positions), 3);
    const keplerIndices = new keplerlit.Uint32BufferAttribute(Array.from(indices), 1);

    const keplerGeometry = new keplerlit.BufferGeometry();
    keplerGeometry.setPositions(keplerPositions);
    keplerGeometry.setIndices(keplerIndices);

    return keplerGeometry;
}

/**
 * Convert a result from keplerlit to three.js in order to visualize 
 * (have to do that for filled iso-contours only)
 * 
 * ```js
 * const filledContours = new keplerlit.IsoContoursFilled('Rainbow', 256, isoList)
 * const result = filledContours.run(scalarField, keplerGeometry)
 * createMeshFromKeplerResult(result)
 * ```
 */
createMeshFromKeplerResult(result) {
    const geometry = new THREE.BufferGeometry();

    // Convert positions
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(result.position, 3));

    // Convert indices
    geometry.setIndex(new THREE.Uint32BufferAttribute(result.index, 1));

    // Convert colors
    const colors = new Float32Array(result.color);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    geometry.computeVertexNormals();
    // geometry.setAttribute('normal', new THREE.Float32BufferAttribute(result.normal, 3))

    const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        wireframe: this.showWireframeIso,
        flatShading: false,
        polygonOffset: true,
        polygonOffsetFactor: .5
    });

    return new THREE.Mesh(geometry, material);
}
```
