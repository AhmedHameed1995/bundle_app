@echo off
echo Starting the app with safe settings...

rem Set environment variables to skip problematic parts
set SKIP_PRISMA_GENERATE=true
set NODE_OPTIONS=--max-old-space-size=4096

rem Clear temporary files that might cause issues
rmdir /S /Q node_modules\.vite 2>nul
rmdir /S /Q node_modules\.cache 2>nul

echo Running the app...
npm run dev

echo App has stopped.
pause 