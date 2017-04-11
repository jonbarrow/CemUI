@echo off
call electron-packager . CemuManager --overwrite --asar --out=builds/ --platform=win32 --arch=ia32 --icon "./ico.ico"
echo Application built
echo Press any key to exit...
set /p input=