const {build} =require('esbuild');
const {fork} = require("child_process");
const watch = require("node-watch");

const PKG = require('./package.json');
const DEV = process.argv.includes('--dev');

(async() => {
  if(DEV){
    build_test_app().then( bundle => {
      console.log('Sarting app in watch mode...');
      console.log('﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋');
      nodemon('test/app.js');

      watch([ 'src','test/app'], {recursive: true}, async() => {
        await bundle.rebuild();
        console.log('\n﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌');
        console.log('[!] Sources was edited. Restarting app...');
        console.log('﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋');
      });

    });
  } else {
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

async function build_test_app(){
  return await build({
    entryPoints: ['./test/app/index.ts'],
    bundle: true,
    minify: false,
    incremental: true,
    platform: "node",
    sourcemap: 'inline',
    outfile: 'test/app.js',
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