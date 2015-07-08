var hipchat = require('node-hipchat'),
    http = require('http'),
    https = require('https'),
    mailer = require('./mailer.js'),
    config = require('./config.js'),
    transform = require('./transform.js');

var pages = config.pages;

console.log('starting vcheck');
check();
loop();

function loop() {
    setTimeout(function() {
        check();
        loop();
    }, config.interval * 1000);
}

function check() {
    pages.forEach(function(item) {
        var options, protocol;
        if (config.proxy) {
            options = {
                host: config.proxy.host,
                port: config.proxy.port,
                path: item.url,
                headers: {
                    Host: item.url
                }
            }
        } else {
            options = item.url;
        }
        protocol = item.url.indexOf('https:') === 0 ? https : http;
        protocol.get(options, function(res) {
            var data = '';
            res.on('data', function (chunk) {
                data = data + chunk;
            });
            res.on('end', function () {
                var compare = function(data) {
                    if (!item.data) {
                        console.log(item.name + ' initial version: ' + data);
                        item.data = data;
                        if (process.argv[2] === 'test') postUpdate(item);
                    }
                    if (!data !== null && item.data !== data) {
                        console.log(item.name + ': ' + data);
                        item.data = data;
                        postUpdate(item);
                    }
                };
                if (res.statusCode === 200) {
                    if (item.transform) {
                        transform(data, item.transform, compare);
                    } else {
                        compare(data);
                    }
                }
            });
        }).on('error', function(e) {
            console.log('error requesting ' + item.name + ': ' + e.message);
        }); 
    });
}

function hipchatClient(token) {
    return new hipchat({
        apikey: token,
        proxy: config.proxy
    });
}

function postUpdate(item) {
    var conf = config.notifications,
        email = conf.email,
        message = item.print ? item.print() : conf.print ? conf.print.bind(item)() : item.data,
        rooms = [].concat(item.room ? item.room : conf.hipchat.room);
    
    rooms.forEach(function(room) {
        var token = config.notifications.hipchat.token;
        if (room.token) {
            token = room.token;
            room = room.id;
        }
	    hipchatClient(token).postMessage({
	        room: room,
	        from: item.name,
	        message: message,
	        message_format: 'html'
	    }, function(res, data) {
	        if (!res || res.status !== 'sent') {
	            console.log('notification to hipchat room ' + room + ' failed: ' + data);
	        }
	    });
    });

    if (item.email && email) {
        var subject = item.subject ? item.subject(item) : email.subject ? email.subject.bind(item)() : item.name
        mailer.send(item.email, subject, message);  
    }
}
