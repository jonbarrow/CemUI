const {Menu, shell} = require('electron')
const electron = require('electron')
const app = electron.app

const template = [
    {
        label: 'View',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.reload();
                    }
                }
            },
            {
                label: 'Toggle Dev Tools',
                accelerator: 'Ctrl+Shift+I',
                click (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.webContents.toggleDevTools()
                    }
                }
            },
            { type: 'separator' },
            { role: 'resetzoom' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Cemu',
                click () {
                    shell.openExternal('http://cemu.info/')
                }
            },
            {
                label: 'CemUI',
                click () {
                    shell.openExternal('http://cemui.com/')
                }
            },
            {
                label: 'Cemu Compatibility List',
                click () {
                    shell.openExternal('http://compat.cemu.info/')
                }
            },
            {
                label: 'SMMDB',
                click () {
                    shell.openExternal('https://smmdb.ddns.net/')
                }
            },
            {
                label: 'Cemu Graphics Packs',
                click () {
                    shell.openExternal('https://github.com/slashiee/cemu_graphic_packs')
                }
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)