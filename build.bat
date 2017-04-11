@echo off
call electron-packager . CemuManager --overwrite --asar --out=builds/ --platform=win32 --arch=ia32 --icon "./ico.ico"
echo Application built
pause
