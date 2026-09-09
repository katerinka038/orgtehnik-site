@echo off
rem Otpravlyaet sayt na GitHub. Prosto dvazhdy klikni po etomu faylu.
cd /d "%~dp0"

echo.
echo   Otpravlyaem sayt na GitHub...
echo.
echo   Esli poyavitsya okno "Sign in with your browser" -
echo   nazhmi ego i voydi v GitHub. Eto nuzhno tolko odin raz.
echo.

git push -u origin main

echo.
echo   ================================================
echo   Esli vyshe net krasnykh oshibok - vsyo otpravilos.
echo   Obnovi stranitsu repozitoriya v brauzere.
echo   ================================================
echo.
pause
