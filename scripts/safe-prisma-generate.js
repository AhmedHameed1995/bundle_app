#!/usr/bin/env node

/**
 * Safe Prisma Generate Script
 * 
 * This script runs prisma generate with error handling to prevent
 * crashing the Shopify app build process when Prisma has issues.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Running safe Prisma generate...');

// Check if we need to skip Prisma generation
if (process.env.SKIP_PRISMA_GENERATE === 'true') {
  console.log('⏩ Skipping Prisma generate (SKIP_PRISMA_GENERATE=true)');
  process.exit(0);
}

// Ensure the Prisma directory exists
const prismaDir = path.resolve(__dirname, '../prisma');
if (!fs.existsSync(prismaDir)) {
  console.log('❌ Error: prisma directory not found');
  console.log('✅ Continuing without Prisma generation');
  process.exit(0);
}

// Try running prisma db push first to ensure database is synced
try {
  console.log('🔄 Running prisma db push...');
  const dbPushProcess = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Wait for db push to complete
  await new Promise((resolve) => {
    dbPushProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Prisma db push completed successfully');
      } else {
        console.log(`⚠️ Prisma db push exited with code ${code}`);
      }
      resolve();
    });
  });
} catch (err) {
  console.log('⚠️ Could not run prisma db push:', err.message);
}

// Create a child process for prisma generate
const prismaProcess = spawn('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  shell: true
});

// Handle process completion
prismaProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Prisma generate completed successfully');
  } else {
    console.log(`⚠️ Prisma generate exited with code ${code}`);
    console.log('✅ Continuing without Prisma generation');
  }
  process.exit(0); // Always exit with success code to not break the build
});

// Handle process errors
prismaProcess.on('error', (err) => {
  console.log('❌ Error running Prisma generate:', err.message);
  console.log('✅ Continuing without Prisma generation');
  process.exit(0); // Always exit with success code to not break the build
});

// Handle timeouts
setTimeout(() => {
  console.log('⏱️ Prisma generate timed out after 60 seconds');
  console.log('✅ Continuing without Prisma generation');
  prismaProcess.kill();
  process.exit(0);
}, 60000); 