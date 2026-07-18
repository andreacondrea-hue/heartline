@echo off
echo ================================================
echo   Heartline - first-time setup
echo ================================================
echo.
echo This installs everything Heartline needs to run.
echo It only takes a couple of minutes, and you only
echo need to do this once.
echo.

cd server
echo Installing server files...
call npm install
if not exist .env (
  copy .env.example .env > nul
  echo Created server\.env from the template.
)
cd ..

cd client
echo Installing game files...
call npm install
cd ..

echo.
echo ================================================
echo   All done! Double-click play.bat to start the game.
echo ================================================
pause
