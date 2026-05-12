@echo off
echo Creating frontend structure...

:: Create folders
mkdir frontend
cd frontend

mkdir css
mkdir js

:: Create HTML files
type nul > index.html
type nul > dashboard.html
type nul > forums.html
type nul > forum.html
type nul > wallet.html
type nul > upload.html

:: Create CSS file
type nul > css\style.css

:: Create JS files
type nul > js\auth.js
type nul > js\app.js
type nul > js\forum.js
type nul > js\wallet.js

echo Done! Folder structure created successfully.
pause
