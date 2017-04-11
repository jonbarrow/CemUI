<img src="http://i.imgur.com/KJhV5ak.png"/>

# CemuManager
A small launcher for the Cemu WiiU emulator made with Electron

## What is it?
CemuManager is a small launcher "hub" that stores your Cemu games in a nice easy-to-access fashion.

![](http://i.imgur.com/jOrxr9D.gif)

**IMPORTANT:** CemuManager is still in heavy development and may be unstable. There are many features planned.
##### Planned featured include
- Multiple emulator support
- "Big-picture" type mode that can be used with a controller
- ~~All hail the dark theme~~ Added
 
## Installation & Running for public versions
- Download the latest release
- Extract

To run CemuManager, simply run `CemuManager.exe`
 
## Installation & Running for developer versions
- Clone the repo
- Install npm and node
- run `install.bat`

To run CemuManager, simply run `run.bat`

## Building from source
- Clone the repo
- Install npm and node
- run `install.bat`
- run `build.bat`
- app will be built to `builds/CemuManager-win32-ia32`

To run CemuManager, simply run `CemuManager.exe`

# Releases

## v0.1.2 - Second public release
[v0.1.2](https://github.com/RedDuckss/CemuManager/releases/tag/v0.1.2)
This version fixes many bugs and redesigns the layout. This is the first production ready release.

## v0.1.0 - First public release
[v0.1.0](https://github.com/RedDuckss/CemuManager/releases/tag/v0.1.0)
 
## Known Bugs
Currently the only known bug is with box art downloading. At times, some box art may not download correctly, and thus will display as an invalid image. This is because I am pulling the box art from the internet (specifically http://thegamesdb.net/). If a box art is not displaying, it means that the image did not finish downloading before you selected the Cemu folder. To fix it, go to `data/cache` and delete both `.json` files. Reopening CemuManager will then prompt you to select both folders again.

## Tasks to complete

- [x] Launch games
- [x] Lanuch games with other emulators
- [ ] Full screen mode option
- [ ] Change settings option
- [x] Add cemu folder
- [x] Find cemu.exe from folder
- [ ] Add external WiiU emulators option
- [x] Add game folder
- [x] Find games within the folder
- [ ] Dynamically load new games
- [ ] Dynamically remove games
- [ ] Load new game (single)
- [ ] Remove game (single)
