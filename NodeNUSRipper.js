/*-----------------------------------------------------------------------------
 NodeNUSRipper

 The in-house NUS (Nintendo Update Server) game/update/DLC downloader.
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
    async = require('async'),
    request = require('request'),
    struct = require('python-struct');

const NINTENDO_CDN_URL = 'http://ccs.cdn.c.shop.nintendowifi.net/ccs/download/';
const NINTENDO_NUS_URL = 'http://nus.cdn.c.shop.nintendowifi.net/ccs/download/';
const TITLE_TYPES = [
    '0000',  // application
    '0002',  // demo
    '000C',  // DLC
    '000E',  // update/patch
]

function Main() {}
util.inherits(Main, EventEmitter);

Main.prototype._config = {
    cdecrypt_location: '',
    cdecrypt_folder_location: '',
    ticket_cache_vendor: '',
    ticket_vendor: '',
    ticket_cache_folder: './ticketcache' 
}

Main.prototype.decrypt = function(location) {
    let self = this;

    if (!this._config.cdecrypt_location || this._config.cdecrypt_location.trim() == '' || !fs.pathExistsSync(this._config.cdecrypt_location)) {
        return;
    }

    fs.copySync(this._config.cdecrypt_location, path.join(location, 'cdecrypt.exe'));
    fs.copySync(path.join(this._config.cdecrypt_folder_location, 'libeay32.dll'), path.join(location, 'libeay32.dll'));
    fs.copySync(path.join(this._config.cdecrypt_folder_location, 'msvcr120d.dll'), path.join(location, 'msvcr120d.dll'));

    console.log('CemUI does not ship with any means to decrypt rom files.\nWhile we would love to do so, we cannot for legal reasons.\nIn order to decrypt the files, CemUI makes use of CDecrypt, which is also not shipped with CemUI due to legal reasons.\nPlease obtain a copy of CDecrypt and tell CemUI where to look for it.');
    
    let decrypter = child_process.execFile('cdecrypt.exe', [ 
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
    })
}

Main.prototype.formatTID = function(TID) {
    return TID.replace(/-/g, '').toUpperCase();
}

Main.prototype.getTIDType = function(TID) {
    return TID.toUpperCase().substring(4, 8);
}

Main.prototype.getTIDURL= function(TID) {
    const TID_TYPE = this.getTIDType(TID);
    if (TITLE_TYPES.indexOf(TID_TYPE) > -1) {
        URL_BASE = url.resolve(NINTENDO_CDN_URL, TID);
    } else URL_BASE = url.resolve(NINTENDO_NUS_URL, TID);

    return URL_BASE;
}

Main.prototype.parseTMD = function(file, cb) {
    var tmd = fs.readFileSync(file);
    
    var tmd_object = {},
        tmd_contents_count = struct.unpack('>H', tmd.subarray(0x1DE, 0x1E0))[0],
        tmd_contents = [];
    
    for (var i=0;i<tmd_contents_count;i++) {
        var content_binary = new Buffer.from(tmd.subarray(0xB04 + (0x30 * i), 0xB04 + (0x30 * i) + 0x4)).toString('binary');
            content_id = new Buffer(content_binary, 'ascii').toString('hex');
        tmd_contents.push({
            type: struct.unpack('>H', tmd.subarray(0xB0A + (0x30 * i), 0xB0A + (0x30 * i) + 0x2))[0],
            size: struct.unpack('>Q', tmd.subarray(0xB0C + (0x30 * i), 0xB0C + (0x30 * i) + 0x8))[0].low,
            id: content_id,
        });
    }

    tmd_object.contents = tmd_contents;

    if (cb) {
        return cb(tmd_object);
    }

    return tmd_object;
}

Main.prototype.downloadTicketCache = function(cb) {
    let self = this;
    fs.ensureDirSync(this._config.ticket_cache_folder);
    console.log('Updating ticket cache');
    request(this._config.ticket_cache_vendor, (error, response, body) => {

        if (error || response.statusCode != 200) return cb(true);

        let titles = JSON.parse(body);

        fs.writeJSONSync(path.join(this._config.ticket_cache_folder, '_cache.json'), titles);

        var queue = async.queue((title, callback) => {
            if (title.ticket == 1) {
                if (!fs.pathExistsSync(path.join(this._config.ticket_cache_folder, title.titleID + '.tik'))) {
                    this._downloadTicket(title.titleID, () => {
                        callback();
                    });
                } else {
                    let size = fs.statSync(path.join(this._config.ticket_cache_folder, title.titleID + '.tik')).size;
                    if (size < 172) { // 172 seems to be the standard size
                        this._downloadTicket(title.titleID, () => {
                            callback();
                        });
                    } else {
                        callback();
                    }
                }
            } else {
                callback();
            }
        });

        queue.drain = () => {
            self.emit('ticket_cache_downloaded');
            return cb();
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

Main.prototype.downloadTID = function(TID, location, cb) {
    let self = this;
    TID = this.formatTID(TID);
    fs.ensureDirSync(location);

    if (fs.pathExistsSync(path.join(this._config.ticket_cache_folder, TID.toLowerCase() + '.tik'))) {
        fs.createReadStream(path.join(this._config.ticket_cache_folder, TID.toLowerCase() + '.tik'))
            .pipe(fs.createWriteStream(path.join(location, 'title.tik')));
    } else if (this.getTIDType(TID) == '000E') {
        let URL_BASE = this.getTIDURL(TID);
        this._ripFile(URL_BASE + '/cetk', path.join(location, 'title.tik'), (error) => {
            self.emit('downloaded_ticket', TID);
        });
    } else {
        self.emit('error', {
            message: 'No valid ticket available'
        });
        return;
    }

    
    fs.createReadStream('uni.cert').pipe(fs.createWriteStream(path.join(location, 'title.cert')));

    this.downloadTMD(TID, path.join(location, 'title.tmd'), () => {
        self.emit('downloaded_tmd', TID);
        let tmd = this.parseTMD(path.join(location, 'title.tmd')),
            URL_BASE = this.getTIDURL(TID);

        var queue = async.queue((file, callback) => {
            this._ripFile(URL_BASE + '/' + file.id + '.h3', path.join(location, file.id + '.h3'), (error) => {
                this._ripFile(URL_BASE + '/' + file.id, path.join(location, file.id + '.app'), (error) => {
                    callback();
                });
            });

        });

        queue.drain = () => {
            self.emit('rom_rip_completed', location)
        }

        queue.push(tmd.contents);
    });
}

Main.prototype.downloadTMD = function(TID, file, cb) {
    TID = this.formatTID(TID);
    this._ripFile(this.getTIDURL(TID) + '/tmd', file, () => {
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
        console.log(tid)
        return cb();
    });
}

Main.prototype._ripFile = function(url, file, cb) {
    let self = this,
        files = file.split('\\');

    request.head(url, (error, response, body) => {
        if (fs.pathExistsSync(file) && response.statusCode == 200) {
            var size = fs.statSync(file).size;
            if (size == response.headers['content-length']) {
                self.emit('download_status', {
                    status: 'exists',
                    name: files[files.length-1],
                    path: file,
                    received_bytes: size,
                    total_bytes: size
                });
                return cb();
            }
        }
        if (error || response.statusCode != 200) {
            if (error) return cb(true);
            if (response.statusCode != 404) {
                setTimeout(() => { // there seems to be some kind of request rate limit in place by Nintendo, resulting in 500/504 errors. Sleeping for a bit may help this
                    this._ripFile(url, file, cb);
                    return;
                }, 1000);
            } else {
                self.emit('download_status', {
                    status: 'not_found',
                    name: files[files.length-1],
                    path: file,
                    received_bytes: 0,
                    total_bytes: 0
                });
                return cb(true);
            }
        }

        self.emit('download_status', {
            status: 'started',
            name: files[files.length-1],
            path: file,
            received_bytes: 0,
            total_bytes: response.headers['content-length']
        });

        let received_bytes = 0,
            total_bytes = response.headers['content-length'],
            dl = request(url),
            out = fs.createWriteStream(file);

        dl.on('data', function(chunk) {
            received_bytes += chunk.length;
            self.emit('download_status', {
                status: 'downloading',
                name: files[files.length-1],
                path: file,
                chunk: chunk.length,
                received_bytes: received_bytes,
                total_bytes: total_bytes
            });
        });
        
        dl.pipe(out)
        .on('finish', () => {
            self.emit('download_status', {
                status: 'finished',
                name: files[files.length-1],
                path: file,
                received_bytes: received_bytes,
                total_bytes: total_bytes
            });
            cb();
        });
    });
}

Main.prototype._tagaya = function(host, path, callback) {
    https.request({
        key: certs.key,
        cert: certs.cert,
        rejectUnauthorized: false,
        host: host,
        path: path,
        port: 443
    }, (res) => {
        var data = '';
        
        res.on('data', (d) => {
            data += d;
        });
        
        res.on('end', () => {
            callback(data, null);
        });
    }).on('error', (error) => {
        callback(null, error);
    }).end();
}


module.exports = Main;
