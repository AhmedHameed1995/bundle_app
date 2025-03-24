@echo off
echo Fixing Prisma errors...

rem Stop any running processes that might be using the files
taskkill /F /IM node.exe /FI "MEMUSAGE gt 50000" 2>nul

rem Delete the .prisma folder from node_modules
echo Removing Prisma cache...
rmdir /S /Q node_modules\.prisma 2>nul

rem Run Prisma generate with force
echo Running Prisma db push...
npx prisma db push --force-reset

echo Running Prisma generate...
npx prisma generate

echo Done! You can now run "npm run dev:safe" to start the app.
pause 