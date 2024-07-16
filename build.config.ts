import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [{ input: 'src/index' }],
  outDir: 'lib',
  declaration: true,
  sourcemap: true,
  rollup: {
    emitCJS: true,
    esbuild: { minify: true }
  }
})
