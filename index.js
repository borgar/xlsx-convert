const { load } = require('./src/transpile');

const arg = process.argv.filter(d => /\.xlsx$/.test(d))

if (arg.length > 1) {
  console.error('One file at time plz!');
  process.exit(1);
}

async function convertFile (fn) {
  const wb = await load(fn);
  const output = JSON.stringify(wb, null, 2);
  console.log(output);
}

convertFile(arg[0]);
