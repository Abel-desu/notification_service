#!/usr/bin/env node

const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[!]${colors.reset} ${msg}`)
};

const config = {
  host: 'localhost',
  user: 'root',
  password: '2702@AD',
  database: 'notification_service',
  port: 3306
};

async function createDatabase() {
  try {
    log.info('Creating database...');
    
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port
    });

    await connection.query(`DROP DATABASE IF EXISTS ${config.database}`);
    log.info(`Dropped existing database if it exists`);

    await connection.query(`CREATE DATABASE ${config.database}`);
    log.success(`Database '${config.database}' created successfully`);

    await connection.end();
    return true;
  } catch (error) {
    log.error(`Failed to create database: ${error.message}`);
    return false;
  }
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    log.info(`Running: ${command}`);
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        log.error(`Command failed: ${error.message}`);
        if (stderr) console.error(stderr);
        reject(error);
      } else {
        console.log(stdout);
        resolve(stdout);
      }
    });
  });
}

async function main() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   Notification Service Setup Script    ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Step 1: Create Database
    log.info('Step 1/4: Creating database...');
    const dbCreated = await createDatabase();
    if (!dbCreated) {
      log.error('Failed to create database. Exiting.');
      process.exit(1);
    }

    // Step 2: Run Migrations
    log.info('Step 2/4: Running migrations...');
    await runCommand('npm run db:migrate');
    log.success('Migrations completed');

    // Step 3: Seed Data
    log.info('Step 3/4: Seeding demo data...');
    await runCommand('npm run db:seed');
    log.success('Demo data seeded');

    // Step 4: Summary
    console.log(`\n${colors.green}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║         Setup Completed! ✓             ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════╝${colors.reset}\n`);

    log.success('Database created');
    log.success('Migrations applied');
    log.success('Demo data seeded');

    console.log(`\n${colors.blue}Next steps:${colors.reset}`);
    console.log(`  1. Start server: npm run dev`);
    console.log(`  2. Test API: curl http://localhost:3000/api/health`);
    console.log(`  3. See CURL_EXAMPLES.md for API examples\n`);

  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

main();
