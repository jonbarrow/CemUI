<img src="http://i.imgur.com/KJhV5ak.png"/>

# CemuManager
A small launcher for the Cemu WiiU emulator made with Electron.
You can reach us (the developers) on Discord here https://discord.gg/WYVnFEQ

## What is it?
CemuManager is a small launcher "hub" that stores your Cemu games in a nice easy-to-access fashion.
 
<kbd>
<img src="http://i.imgur.com/jOrxr9D.gif"/>
</kbd>
 
**IMPORTANT:** CemuManager is still in heavy development and may be unstable. There are many features planned.

## How can I help? / I have a suggestion!
We always welcome suggestions and Pull Requests! This program is written in NodeJS and packaged with Electron. This means that anyone with experience in JavaScript, Node, html, css, and C++ can contribute just fine! With Node, C++ users can contribute as well, due to Node supporting C++ modules, and will be packaged by Electron just fine!

If you have a suggestion, and do not know any of the required languages, you can reach us on our Discord server: https://discord.gg/WYVnFEQ

## I found a bug!
Given that this project is still very early in development, bugs will probably be common, and vary from person to person. If you find a bug, we ask that you follow this format for reporting the bug on the `Issue` tracker on the repo:
- A detailed name describing the bug (no "A bug happened" type titles!)
- A detailed description of the bug
- CemuManager version
- Exact steps to reproduce
- A screenshot/video of the bug/error message
- If possible, a video or gif showing the exact steps to reproduce (There are many free video recorders out there. It doesn't matter how you record it, as long as it's recorded)
- And above all: stay calm. Currently there are only 2 developers working on this project, and for one this is the first NodeJS app they have worked on. Also given the nature of how Electron packages apps, bugs may not occur on our end but will on yours. Please be patient while we attempt to fix the issue.

Additionally, you can contact us via our Discord server if you want to speak with us directly. The link is https://discord.gg/WYVnFEQ

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
 

## Tasks to complete

- [x] Launch games
- [x] Launch games with other emulators
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
