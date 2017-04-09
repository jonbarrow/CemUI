# CemuManager

A small launcher for the Cemu WiiU emulator made with Electron

## What is it?

CemuManager is a small fan-project aimed as practice for me in developing Electron apps. CemuManager is a small launcher "hub" for your Cemu games, allowing you to launch games in Cemu from the application.

## Goals

Getting the thing fully working. A lot of planned, and suggested, features are not yet implemented. It is nowhere near done. Eventually I'd like to expand CemuManager to support multiple WiiU emulators, and evetually for it to become an all-in-one launcher for all emulators.

## Installation
- Install npm and node
- run `install.bat`

To run Cemu-Manager, simply run `run.bat`

## Releases

# V0.1.0 - First public release

<https://github.com/RedDuckss/CemuManager/releases/tag/v0.1.0>

## Known Bugs

Currently the only known bug is with box art downloading. At times, some box art may not download correctly, and thus will display as an invalid image. This is because I am pulling the box art from the internet (specifically <http://thegamesdb.net/>). If a box art is not displaying, it means that the image did not finish downloading before you selected the Cemu folder. To fix it, go to `data/cache` and delete both `.json` files. Reopening CemuManager will then prompt you to select both folders again.

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
