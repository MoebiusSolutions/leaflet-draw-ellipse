import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'

export default {
    entry: 'src/Leaflet.draw-ellipse.js',
    format: 'es',
    plugins: [
        resolve(),
        babel({
            exclude: 'node_modules/**' // only transpile our source code
        })
    ],
    dest: 'Leaflet.draw-ellipse.js' // equivalent to --output
}