/*-----------------------------------------------------------------------------
 NodeNUSRipper

 The in-house NUS (Nintendo Update Server) game/update/DLC downloader for CemUI 2.0.
 Designed for use only in the free OSS CemUI.

 Copyright (C) 2017 Jonathan Barrow (RedDucks(s))
-----------------------------------------------------------------------------*/

var EventEmitter = require('events').EventEmitter,
    child_process = require('child_process'),
    readline = require('readline'),
    fs = require('fs-extra'),
    url = require('url'),
    util = require('util'),
    path = require('path'),
    http = require('http'),
    async = require('async'),
    request = require('request'),
    struct = require('python-struct');

const NINTENDO_CCS_URL = 'http://ccs.cdn.c.shop.nintendowifi.net/ccs/download/';
const NINTENDO_NUS_URL = 'http://nus.cdn.c.shop.nintendowifi.net/ccs/download/';
const TITLE_TYPES = [
    '0000',  // application
    '0002',  // demo
    '000C',  // DLC
    '000E',  // update/patch
];
const DLC_PATCH = new Buffer.from([
    0x00, 0x01, 0x00, 0x14, 0x00, 0x00, 0x00, 0xAC, 0x00, 0x00, 0x00, 0x14, 0x00, 0x01, 0x00, 0x14, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x84, 0x00, 0x00, 0x00, 0x84, 0x00, 0x03,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00
]);
const TIK = new Buffer.from([
    0x00, 0x01, 0x00, 0x04, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1,
    0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E,
    0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15,
    0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A,
    0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5,
    0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB,
    0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1,
    0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED,
    0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1,
    0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E,
    0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15,
    0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A,
    0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5,
    0xED, 0x15, 0xAB, 0xE1, 0x1A, 0xD1, 0x5E, 0xA5, 0xED, 0x15, 0xAB, 0xE1, 0x1A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x52, 0x6F, 0x6F,
    0x74, 0x2D, 0x43, 0x41, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x33, 0x2D, 0x58, 0x53, 0x30, 0x30, 0x30, 0x30,
    0x30, 0x30, 0x30, 0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0xFE, 0xED, 0xFA, 0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0xFE, 0xED, 0xFA,
    0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0xFE, 0xED,
    0xFA, 0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0xFE,
    0xED, 0xFA, 0xCE, 0xFE, 0xED, 0xFA, 0xCE, 0x01, 0x00, 0x00, 0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0xCC,
    0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x14, 0x00, 0x00, 0x00, 0xAC,
    0x00, 0x00, 0x00, 0x14, 0x00, 0x01, 0x00, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00, 0x84, 0x00, 0x00, 0x00, 0x84, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

function Main() {}
util.inherits(Main, EventEmitter);

Main.prototype._config = {
    cdecrypt_location: '',
    cdecrypt_folder_location: '',
    ticket_cache_vendor: '',
    ticket_vendor: '',
    ticket_cache_folder: './ticketcache' 
}

Main.prototype.CANCEL_LIST = [];

Main.prototype.cancel = function(tid) {
    this.CANCEL_LIST.push(this.formatTID(tid));
}

Main.prototype.decrypt = function(location, cb) {
    let self = this;

    if (!this._config.cdecrypt_location || this._config.cdecrypt_location.trim() == '' || !fs.pathExistsSync(this._config.cdecrypt_location)) {
        self.emit('rom_decryption_missing', location);
        if (cb) {
            cb(true);
        }
        return;
    }
    self.emit('rom_decryption_started', location);

    fs.copySync(this._config.cdecrypt_location, path.join(location, 'cdecrypt.exe'));
    fs.copySync(path.join(this._config.cdecrypt_folder_location, 'libeay32.dll'), path.join(location, 'libeay32.dll'));
    fs.copySync(path.join(this._config.cdecrypt_folder_location, 'msvcr120d.dll'), path.join(location, 'msvcr120d.dll'));

    console.log('CemUI does not ship with any means to decrypt rom files.\nWhile we would love to do so, we cannot for legal reasons.\nIn order to decrypt the files, CemUI makes use of CDecrypt, which is also not shipped with CemUI due to legal reasons.\nPlease obtain a copy of CDecrypt and tell CemUI where to look for it.');
    
    let decrypter = child_process.spawn('cdecrypt.exe', [ 
        'title.tmd', 'title.tik' 
    ], { 
        cwd: path.resolve(process.cwd(), location)
    });

    let reader = readline.createInterface(decrypter.stdout, decrypter.stdin);
    
    reader.on('line', (line) => {
        self.emit('file_decrypted', line);
    });

    decrypter.on('exit', () => {
        let dir = fs.readdirSync(location),
            files = dir.filter(file => {
                let extension =  path.extname(file);
                if (extension == '.app' || extension == '.h3') return file;
            });

        files.push('title.tmd');
        files.push('title.tik');
        files.push('title.cert');

        files.push('cdecrypt.exe');
        files.push('libeay32.dll');
        files.push('msvcr120d.dll');

        for (let file of files) {
            fs.unlinkSync(path.join(location, file));
        }

        self.emit('rom_decryption_completed', location);
        if (cb) {
            return cb();
        }
    })
}

Main.prototype.formatTID = function(TID) {
    return TID.replace(/-/g, '').toUpperCase();
}

Main.prototype.getTIDType = function(TID) {
    return TID.toUpperCase().substring(4, 8);
}

Main.prototype.getTIDURL = function(TID) {
    TID = this.formatTID(TID);
    const TID_TYPE = this.getTIDType(TID);
    if (TITLE_TYPES.indexOf(TID_TYPE) > -1) {
        URL_BASE = url.resolve(NINTENDO_CCS_URL, TID);
    } else URL_BASE = url.resolve(NINTENDO_NUS_URL, TID);

    return URL_BASE;
}

Main.prototype.parseTMD = function(file, cb) {
    var tmd = fs.readFileSync(file);
    
    var tmd_object = {},
        tmd_contents_count = struct.unpack('>H', new Buffer.from(tmd.subarray(0x1DE, 0x1E0)))[0],
        tmd_contents = [],
        tid_buffer = new Buffer.from(tmd.subarray(0x18C, 0x194)),
        version_buffer = new Buffer.from(tmd.subarray(0x1DC, 0x1DE)),
        version = struct.unpack('>H', version_buffer)[0];
 
    for (var i=0;i<tmd_contents_count;i++) {
        let offset = 0xB04 + (0x30 * i),
            content_binary = new Buffer.from(tmd.subarray(offset, offset + 0x4)).toString('binary');
            content_id = new Buffer(content_binary, 'ascii').toString('hex');

        tmd_contents.push({
            type: struct.unpack('>H', new Buffer.from(tmd.subarray(0xB0A + (0x30 * i), 0xB0A + (0x30 * i) + 0x2)))[0],
            size: struct.unpack('>Q', new Buffer.from(tmd.subarray(0xB0C + (0x30 * i), 0xB0C + (0x30 * i) + 0x8)))[0].low,
            id: content_id,
        });
    }

    tmd_object.contents = tmd_contents;
    tmd_object.version = version;

    if (cb) {
        return cb(tmd_object);
    }

    return tmd_object;
}

Main.prototype._patchDLC = function(ticket) {
    let unpatched_buffer = fs.readFileSync(ticket),
    ticket_beginning = unpatched_buffer.slice(0, 0x140 + 0x164),
    ticket_end = unpatched_buffer.slice(0x140 + 0x210),
    patched_buffer = Buffer.concat([ticket_beginning, DLC_PATCH, ticket_end]);

    fs.writeFileSync(ticket, patched_buffer);
}

Main.prototype._generateTicket = function(tid, version, key, output, cb) {
    console.log(tid)
    console.log(version)
    console.log(key)
    var ticket = TIK,
        version_buffer = new Buffer.from(version.toString()),
        tid_buffer = new Buffer.from(this._stringToBin(tid), 'binary'),
        key_buffer = new Buffer.from(this._stringToBin(key), 'binary');

    version_buffer.copy(ticket, 0x1E6, 0);
    tid_buffer.copy(ticket, 0x1DC, 0);
    key_buffer.copy(ticket, 0x1BF, 0);

    fs.writeFileSync(output, ticket);

    if (cb) {
        return cb();
    }
}

Main.prototype.downloadTicketCache = function(cb) {
    let self = this;
    fs.ensureDirSync(this._config.ticket_cache_folder);
    request(this._config.ticket_cache_vendor, (error, response, body) => {
        if (error || response.statusCode != 200) {
            return cb(true);
        }
        let titles = JSON.parse(body),
            cache = [];

        fs.writeJSONSync(path.join(this._config.ticket_cache_folder, '_cache.json'), titles);

        var queue = async.queue((title, callback) => {
            if (title.titleKey && title.titleKey.trim() != '') {
                if (!fs.pathExistsSync(path.join(this._config.ticket_cache_folder, title.titleID + '.tik')) && title.ticket == 1) {
                    this._downloadTicket(title.titleID, () => {
                        if (this.getTIDType(title.titleID) == '0000') {
                            cache.push(title);
                        }
                        callback();
                    });
                } else if (fs.pathExistsSync(path.join(this._config.ticket_cache_folder, title.titleID + '.tik'))) {
                    let size = fs.statSync(path.join(this._config.ticket_cache_folder, title.titleID + '.tik')).size;
                    if (size < 172) { // 172 seems to be the standard size
                        this._downloadTicket(title.titleID, () => {
                            if (this.getTIDType(title.titleID) == '0000') {
                                cache.push(title);
                            }
                            callback();
                        });
                    } else {
                        if (this.getTIDType(title.titleID) == '0000') {
                            cache.push(title);
                        }
                        callback();
                    }
                } else {
                    if (this.getTIDType(title.titleID) == '0000') {
                        cache.push(title);
                    }
                    callback();
                }
            } else {
                callback();
            }
        });

        queue.drain = () => {
            self.emit('ticket_cache_downloaded', cache);
            if (cb) {
                cb(cache);
            }
            return;
        }

        queue.push(titles);
    });
}

Main.prototype.setTicketVendor = function(vendor) {
    this._config.ticket_vendor = vendor;
}

Main.prototype.setTicketCacheVendor = function(vendor) {
    this._config.ticket_cache_vendor = vendor;
}

Main.prototype.setTicketCacheLocation = function(location) {
    this._config.ticket_cache_folder = location;
    //this.downloadTicketCache(this._config.ticket_vendor, location);
}

Main.prototype.setCDecryptLocation = function(location) {
    this._config.cdecrypt_location = location;
    this._config.cdecrypt_folder_location = location.replace(/\/[^\/]+\/?$/, '');
}

Main.prototype.verifyEncryptedContents = function(location, tid, cb) {
    var tmd = this.parseTMD(path.join(location, 'title.tmd'));
    this._checkApplicationFiles(tmd.contents, location, tid, () => {
        this._checkHashFiles(tmd.contents.filter(item => {return item.type>=8195}), location, tid, () => {
            return cb();
        });
    });
}

Main.prototype._checkApplicationFiles = function(contents, location, tid, cb) {
    var queue = async.queue((file, callback) => {
        if (fs.pathExistsSync(path.join(location, file.id + '.app'))) {
            var size = fs.statSync(path.join(location, file.id + '.app')).size;
            if (size < file.size) {
                this._ripFile(tid, this.getTIDURL(tid) + '/' +  file.id, path.join(location, file.id + '.app'), () => {
                    callback();
                });
            } else {
                callback();
            }
        } else {
            this._ripFile(tid, this.getTIDURL(tid) + '/' +  file.id, path.join(location, file.id + '.app'), () => {
                callback();
            });
        }
    });

    queue.drain = () => {
        return cb();
    }

    queue.push(contents);
}

Main.prototype._checkHashFiles = function(contents, location, tid, cb) {
    var queue = async.queue((file, callback) => {
        if (fs.pathExistsSync(path.join(location, file.id + '.h3'))) {
            var size = fs.statSync(path.join(location, file.id + '.h3')).size;
            this._getHeaders(this.getTIDURL(tid) + '/' +  file.id + '.h3', (headers) => {
                if (size < headers['content-length']) {
                    this._ripFile(tid, this.getTIDURL(tid) + '/' +  file.id + '.h3', path.join(location, file.id + '.h3'), () => {
                        callback();
                    });
                } else {
                    callback();
                }
            });
        } else {
            this._ripFile(tid, this.getTIDURL(tid) + '/' +  file.id + '.h3', path.join(location, file.id + '.h3'), () => {
                callback();
            });
        }
    });

    queue.drain = () => {
        return cb();
    }

    queue.push(contents);
}

Main.prototype.downloadTID = function(TID, location, update, cb) {
    let self = this,
        cache = fs.readJSONSync(path.join(this._config.ticket_cache_folder, '_cache.json'));
    TID = this.formatTID(TID);
    fs.ensureDirSync(location);

    if (this.CANCEL_LIST.contains(TID)) {
        this.CANCEL_LIST.splice(this.CANCEL_LIST.indexOf(TID), 1);
    }
    
    fs.createReadStream('uni.cert').pipe(fs.createWriteStream(path.join(location, 'title.cert')));

    this.downloadTMD(TID, path.join(location, 'title.tmd'), () => {
        self.emit('downloaded_tmd', TID);
        let tmd = this.parseTMD(path.join(location, 'title.tmd')),
            URL_BASE = this.getTIDURL(TID);

        if (fs.pathExistsSync(path.join(this._config.ticket_cache_folder, TID.toLowerCase() + '.tik'))) {
            fs.createReadStream(path.join(this._config.ticket_cache_folder, TID.toLowerCase() + '.tik'))
                .pipe(fs.createWriteStream(path.join(location, 'title.tik')));
        } else if (this.getTIDType(TID) == '000E') {
            let URL_BASE = this.getTIDURL(TID);
            this._ripFile(tid, URL_BASE + '/cetk', path.join(location, 'title.tik'), (error) => {
                self.emit('downloaded_ticket', TID);
            });
        } else {
            for (var i=0;i<cache.length;i++) {
                var game = cache[i];
                if (game.titleID == TID.toLowerCase()) {
                    i = cache.length;
                    if (!game.titleKey) {
                        self.emit('error', {
                            message: 'No valid ticket available'
                        });
                        return;
                    }
                    this._generateTicket(TID.toLowerCase(), tmd.version, game.titleKey, path.join(location, 'title.tik'));
                }
            }
        }

        if (this.getTIDType(TID) == '000C') {
            this._patchDLC(path.join(location, 'title.tik'));
        }

        let tmd_total_size = 0;
        for (let tmd_file of tmd.contents) {
            tmd_total_size += tmd_file.size;
            if (tmd_file.type >= 8195) {
                tmd_total_size += 20;
            }
        }

        console.log(tmd_total_size)

        self.emit('download_total_size', {
            tid: TID,
            size: tmd_total_size
        });

        var queue = async.queue((file, callback) => {

            if (this.CANCEL_LIST.contains(TID)) {
                console.log('KILLED');
                queue.kill();
            }

            if (fs.pathExistsSync(path.join(location, file.id + '.app'))) {
                var size = fs.statSync(path.join(location, file.id + '.app')).size;
                if (size < file.size) {
                    this._ripFile(TID, URL_BASE + '/' +  file.id, path.join(location, file.id + '.app'), () => {
                        if (file.type >= 8195) {
                            this._ripFile(TID, URL_BASE + '/' + file.id + '.h3', path.join(location, file.id + '.h3'), (error) => {
                                return callback();
                            });
                        } else {
                            return callback();
                        }
                    });
                } else {
                    self.emit('download_status', {
                        status: 'exists',
                        tid: TID,
                        name: file.id + '.app',
                        path: path.join(location, file.id + '.app'),
                        received_bytes: size,
                        received_bytes_raw: size,
                        total_bytes: size
                    });
                    if (file.type >= 8195) {
                        this._ripFile(TID, URL_BASE + '/' + file.id + '.h3', path.join(location, file.id + '.h3'), (error) => {
                            return callback();
                        });
                    } else {
                        return callback();
                    }
                }
            } else {
                this._ripFile(TID, URL_BASE + '/' +  file.id, path.join(location, file.id + '.app'), () => {
                    if (file.type >= 8195) {
                        this._ripFile(TID, URL_BASE + '/' + file.id + '.h3', path.join(location, file.id + '.h3'), (error) => {
                            return callback();
                        });
                    } else {
                        return callback();
                    }
                });
            }
        });

        queue.drain = () => {
            self.emit('rom_rip_completed', location);
            if (cb) {
                return cb(location);
            }
        }

        queue.push(tmd.contents);
    });
}

Main.prototype.downloadTMD = function(TID, file, cb) {
    TID = this.formatTID(TID);
    this._ripFile(TID, this.getTIDURL(TID) + '/tmd', file, () => {
        return cb();
    });
}

Main.prototype._downloadTicket = function(tid, cb) {
    let ticket_url = this._config.ticket_vendor + '/ticket/' + tid + '.tik';
    ticket_url = ticket_url.replace(/([^:]\/)\/+/g, '$1');

    request(ticket_url)
    .pipe(fs.createWriteStream(path.join(this._config.ticket_cache_folder, tid + '.tik')))
    .on('error', () => {
        console.log('ERROR', tid)
        return cb();
    })
    .on('finish', () => {
        return cb();
    });
}

Main.prototype._ripFile = function(TID, url, file, cb) {
    let self = this,
        files = file.split('\\');

    this._getHeaders(url, (headers) => {
        if (fs.pathExistsSync(file)) {
            var size = fs.statSync(file).size;
            if (size >= headers['content-length']) {
                self.emit('download_status', {
                    status: 'exists',
                    tid: TID,
                    name: files[files.length-1],
                    path: file,
                    received_bytes: size,
                    received_bytes_raw: size,
                    total_bytes: size
                });
                return cb();
            }
        }

        let received_bytes = 0,
            total_bytes = headers['content-length'],
            req = request.get(url);

        req.on('response', (response) => {
            if (response.statusCode !== 200) {
                if (response.statusCode == 404) {
                    console.log(file);
                    return cb();
                }
                console.log(url);
                console.log(file);
                console.log(response.statusCode)
                throw new Error('Invalid response code', response.statusCode);
            } else {
                self.emit('download_status', {
                    status: 'started',
                    tid: TID,
                    name: files[files.length-1],
                    path: file,
                    received_bytes: 0,
                    received_bytes_raw: 0,
                    total_bytes: headers['content-length']
                });

                var out = fs.createWriteStream(file);
                req.pipe(out);

                out.on('finish', () => {
                    self.emit('download_status', {
                        status: 'finished',
                        tid: TID,
                        name: files[files.length-1],
                        path: file,
                        received_bytes: received_bytes,
                        received_bytes_raw: 0,
                        total_bytes: total_bytes
                    });
                    out.close(cb);
                });
        
                out.on('error', (error) => {
                    console.log(error);
                    console.log(error.message);
                    console.log(url);
                    console.log(file);
                    throw error
                });

                req.on('data', (chunk) => {

                    if (this.CANCEL_LIST.contains(TID)) {
                        console.log('KILLED');
                        req.abort();
                        req.destroy();
                    }

                    received_bytes += chunk.length;
                    self.emit('download_status', {
                        status: 'downloading',
                        tid: TID,
                        name: files[files.length-1],
                        path: file,
                        chunk_length: chunk.length,
                        received_bytes: received_bytes,
                        received_bytes_raw: chunk.length,
                        total_bytes: total_bytes
                    });
                });
        
                req.on('error', (error) => {
                    console.log(error);
                    console.log(error.message);
                    console.log(url);
                    console.log(file);
                    throw error;
                });
            }
        });
    });
}

Main.prototype._stringToBin = function(string) {
    var return_string = '';
    for (var i=0; i<string.length; i+=2) {
        return_string += String.fromCharCode(parseInt(string.substr(i, 2), 16));
    }
    return return_string;
}

Main.prototype._getHeaders = function(uri, cb) {
    let url_tmp = new url.URL(uri);
    var options = {method: 'HEAD', host: url_tmp.host, port: 80, path: url_tmp.pathname};
    var req = http.request(options, function(res) {
        return cb(res.headers);
    });
    req.end();
}

module.exports = Main;

Array.prototype.contains = function(el) {
    return this.indexOf(el) > -1;
}