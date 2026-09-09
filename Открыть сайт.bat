@echo off
rem Zapuskaet lokalnyy server i otkryvaet sayt v brauzere.
rem Prosto dvazhdy klikni po etomu faylu.

start "" powershell -ExecutionPolicy Bypass -WindowStyle Minimized -File "%~dp0serve.ps1"
timeout /t 2 /nobreak >nul
start "" http://localhost:8080/
