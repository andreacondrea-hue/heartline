@echo off
setlocal enabledelayedexpansion
echo ================================================
echo   Starting Heartline...
echo ================================================
echo.
echo Two new windows are about to open - one titled
echo "Heartline Server" and one titled "Heartline Game".
echo Leave BOTH of them open while you play.
echo Your browser should open to the game automatically
echo in a few seconds.
echo.

start "Heartline Server" cmd /k "cd server && npm run dev"
start "Heartline Game" cmd /k "cd client && npm run dev"

timeout /t 6 /nobreak > nul
start http://localhost:5173

echo.
echo If the game tab didn't open by itself, go to this
echo address in your browser:  http://localhost:5173
echo.
echo ------------------------------------------------
echo   Want to play on your PHONE too?
echo ------------------------------------------------
echo Keep this computer on and these two windows open,
echo then connect your phone to the SAME WiFi network as
echo this computer. On your phone's browser, try each of
echo these addresses until one loads the game:
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
  set "IP=%%a"
  set "IP=!IP: =!"
  echo   http://!IP!:5173
)
echo.
echo Once it loads, use your phone browser's menu and
echo choose "Add to Home Screen" (or "Install app") to
echo get a real app icon on your phone, no app store or
echo apk needed.
echo ------------------------------------------------
echo.
echo When you're done playing, just close the two new
echo windows (or press Ctrl+C in each, then close them).
echo This window is safe to close now.
pause
