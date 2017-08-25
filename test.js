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

var request = require('request'),
    cheerio = require('cheerio'),
    fs = require('fs');

const SITE_MAP_URL = 'http://sitemap.gamefaqs.com';
const SITE_URL = 'http://gamefaqs.com';

request(SITE_MAP_URL + '/images/wii-u/', (error, status, body) => {
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
                                    console.log(images[k].parent.name)
                                }
                            }
                        })
                    }
                }
            });
        }
    }
});
