#!/usr/bin/env node
const { program } = require('commander');
const { exec } = require('child_process');

program
  .command('dev')
  .description('Start development server')
  .action(() => {
    console.log('Starting development server with nodemon...');
    const command = 'nodemon --watch src -e ts,ts-node src/main.ts';
    const child = exec(command);
    child.stdout.on('data', (data) => {
      console.log(data);
    });
    
    child.stderr.on('data', (data) => {
      console.error(data);
    });
  });

program
  .command('build')
  .description('Build the project')
  .action(() => {
    console.log('Building the project...');
    const command = 'babel src --out-dir dist --extensions ".ts" --source-maps inline';
    const child = exec(command);
    child.stdout.on('data', (data) => {
      console.log(data);
    });
    
    child.stderr.on('data', (data) => {
      console.error(data);
    });
  });

program
  .command('start')
  .description('Start the project')
  .action(() => {
    console.log('Starting the project...');
    const command = 'node dist/main.js';
    const child = exec(command);
    child.stdout.on('data', (data) => {
      console.log(data);
    });
    
    child.stderr.on('data', (data) => {
      console.error(data);
    });
  });

program.parse(process.argv);
