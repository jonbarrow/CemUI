/*var request = require('request'),
    url = 'http://thegamesdb.net/banners/screenshots/9060-1.jpg',
    url_sections = url.split('/'),
    id = url_sections[url_sections.length-1],
    status = 200,
    number = 1;

console.log(id)

request('http://thegamesdb.net/banners/screenshots/', (error, status, body) => {
    console.log(status.statusCode);
})*/

var request = require('request').defaults({headers: {'User-Agent': "Allow My Robot 188167AE4E7920FD", 'Connection': 'keep-alive'}}),
    http = require('http-get'),
    cheerio = require('cheerio'),
    XMLParser = require('pixl-xml'),
    fs = require('fs');

const SITE_MAP_URL = 'http://sitemap.gamefaqs.com';
const SITE_URL = 'http://gamefaqs.com';

/*request(SITE_MAP_URL + '/images/wii-u/', (error, status, body) => {
    if (status.statusCode === 200) {
        var $ = cheerio.load(body),
            elements = $('body').find('ul').find('li');
        for (var i=elements.length-1;i>=0;i--) {
            request(SITE_MAP_URL + elements[i].children[0].attribs.href, (error, status, body) => {
                if (status.statusCode === 200) {
                    var $ = cheerio.load(body),
                        games = $('body').find('ul').find('li');
                    for (var j=games.length-1;j>=0;j--) {
                        request(games[j].children[0].attribs.href, (error, status, body) => {
                            if (status.statusCode === 200) {
                                var $ = cheerio.load(body),
                                    images = $('body').find('table.contrib').find('img.img100.imgboxart');
                                for (var k=images.length-1;k>=0;k--) {
                                    if (images[k].parent.name == 'div') {
                                        downloadicon(images[k].attribs.src);
                                    }
                                }
                            }
                        })
                    }
                }
            });
        }
    }
});

function downloadicon(url) {
    request(url).pipe(fs.createWriteStream('./icons/' + url.replace(/\//g, '').replace(/\\/g, '').replace(/:/g, '')).on('error', downloadicon(url)))
    .on('close', () => {
        console.log(url)
    })
    .on('error', () => {
        downloadicon(url);
    });
}*/

/*var links = fs.readFileSync('games.txt').toString().split('\r\n')
for (var i=links.length-1;i>=0;i--) {
    downloadicons(links[i])
}

function downloadicons(url) {
    if (!url) return;
    if (url.length < 10) return;
    setTimeout(function() {
        request(url, (error, status, body) => {
            if (status && status.statusCode === 200) {
                var $ = cheerio.load(body),
                    images = $('body').find('table.contrib').find('img.img100.imgboxart');
                for (var i=images.length-1;i>=0;i--) {
                    if (images[i].parent.name == 'div') {
                        request
                        .get(images[i].attribs.src)
                        .on('error', (error) => {
                            console.log('2')
                            downloadicons(url);
                        })
                        .pipe(fs.createWriteStream('./icons/' + images[i].attribs.src.replace(/\//g, '').replace(/\\/g, '').replace(/:/g, '')))
                    }
                }
            } else if (error) {
                console.log('1')
                downloadicons(url);
            }
        })
    }.bind(this), 1000);
}*/

/*var xml = XMLParser.parse('w.xml'),
    dict = {};

xml.companies.company.forEach(function(comp) {
    dict[comp.name] = comp.code;
}, this);

console.log(dict)*/

var fs = require('fs'),
    tga2png = require('tga2png'),
    png2ico = require('png-to-ico');

tga2png('C:/Users/halol/Documents/Games/WiiU/Super Mario Maker [AMAE0101] - Copy/meta/iconTex.tga').then(buffer=> {
    png2ico(buffer).then((buffer) => {
        fs.writeFileSync('smm-ico.ico', buffer);
    }).catch(console.log);
}, error => console.log);