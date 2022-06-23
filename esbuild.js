const {build} =require('esbuild');
const {fork} = require("child_process");
const watch = require("node-watch");
const fs = require("fs/promises");
const path = require('path');

const PKG = require('./package.json');
const DEV = process.argv.includes('--dev');
const TEST = process.argv.includes('--test');

(async() => {
  if(DEV){
    build_dev_app().then( bundle => {
      console.log('Sarting app in watch mode...');
      console.log('﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋');
      nodemon('test/app.js');

      watch([ 'src','test/dev_app'], {recursive: true}, async() => {
        await bundle.rebuild();
        console.log('\n﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌');
        console.log('[!] Sources was edited. Restarting app...');
        console.log('﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋');
      });

    });
  } else if(TEST){
    console.log('Building tests...');
    await build_test_app();
  } else {
    console.log('Building modules...');
    build_module_esm();
    build_module_cjs();
  }
})();


async function build_module_esm(){
  return await build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    minify: true,
    platform: "node",
    outfile: PKG.module,
  });
}

async function build_module_cjs(){
  return await build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    minify: true,
    platform: "node",
    outfile: PKG.main,
  });
}

async function build_dev_app(){
  return await build({
    entryPoints: ['./test/dev_app/index.ts'],
    bundle: true,
    minify: false,
    incremental: true,
    platform: "node",
    sourcemap: 'inline',
    outfile: 'test/app.js',
  });
}

async function build_test_app(){
  return await build({
    entryPoints: ['./test/tests/index.ts'],
    bundle: true,
    minify: true,
    platform: "node",
    sourcemap: 'inline',
    outfile: 'test/app.js',
    plugins: [testsImportsPlugin()]
  });
}


function nodemon(path,options){
  let child;

  const kill = () => {
    child && child.kill();
  };

  const start = () => {
    child = fork(path, [] , options);
  };

  process.on('SIGTERM', kill);
  process.on('exit', kill);

  start();
  watch(path,() => {
    kill();
    start();
  });
}

function testsImportsPlugin(){
  const pattern = /^\d+_.+\.ts$/;
  return {
    name: 'Tests-Imports-Plugin',
    setup(build) {
      build.onLoad({filter: /index.ts$/}, async(args) => {
        const dir = path.dirname(args.path);
        const tests = (await fs.readdir( dir ))
          .filter(file => pattern.test(file))
          .map( file => `import "${dir}/${file}";`)
          .join("\n");

        let body = await fs.readFile(args.path,'utf-8');
        body = body.replace(
          '/*Bundler will write tests imports here*/',
          tests
        );
        return {
          contents: body,
          loader: "ts"
        };
      });
    },
  };
}