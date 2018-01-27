var http = require('http'); 
var fs = require('fs'); 
const config = require('./config'); 

function download(url, dest, cb) {

    return new Promise((resolve, reject) =>  {

        let request = require('request'); 
        request(url, function (error, response, body) {
            if (error) {
                reject(error);
            }
            fs.writeFile(dest, body, 'utf8', resolve); 
        }); 
    }); 
}

function getStats() {
    const socket = require('net'); 
    const fs = require('fs'); 

    return new Promise((resolve, reject) =>  {
        var s = socket.Socket(); 
        
        s.setEncoding('ascii'); 
        s.on('data', function(d) {
            let data = JSON.parse(d.toString()); 
            let date = new Date(); 
            data.lastUpdated = new Date(); 

            fs.writeFile('public/data.json', JSON.stringify(data), 'utf8', resolve); 
        }); 

        s.connect(3333, config.local.host); 
        s.write('{"id":0,"jsonrpc":"2.0","method":"miner_getstat1"}'); 

        s.end(); 
    }); 
    
}


function upload() {
    let Client = require('ssh2-sftp-client'); 
    let sftp = new Client(); 
    sftp.connect({
        host: config.remote.host,
        port: '',
        username: config.remote.username,
        password: config.remote.password
    }).then(() => {
        return sftp.put('./public/log.html', `${config.remote.path}log.html`);
    }).then(() => {
        return sftp.put('./public/index.html', `${config.remote.path}/index.html`);
    }).then(() => {
        return sftp.put('./public/data.json', `${config.remote.path}/data.json`);
    }).then((data) => {
        sftp.end(); 
        console.log('success upload'); 
    })
    .catch((err) =>  {
        console.log(err, 'catch error'); 
        sftp.end(); 
    }); 
}



let count = 1; 
function run () {
    console.log('run', count,  new Date()); 
    download(config.local.protocol + config.local.host + ':' + config.local.port, 'public/log.html')
    .then(() =>  {
        console.log('downloaded log'); 
        return getStats(); 
    })
    .then(() =>  {
        console.log('downloaded stats'); 
        return upload(); 
    })
    .then(() =>  {
        console.log('uploaded site'); 
    })
    .catch((e) =>  {
        console.log(e); 
    }); 
}

run(); 
setInterval(run, config.frequency); 


process.on('uncaughtException', function (err) {
  console.log(err); 
}); 
