const ws = require('ws');
const http = require('http');
const WebSocketServer = ws.Server;
const WebSocket = ws.WebSocket;
const url = require('url');
const fs = require('fs');
const path = require('path');
const port = process.argv[2] || 9000;
const {ipcMain, app} = require('electron');

const wsapi = {
    standardResponse: function(status, data, message, type = "generic") {
        this.status = status;
        this.message = message;
        this.data = data;
        this.type = type;
    },
    port: 6969,
    wss: null,
    clients: [],
    createId() {
        // create random guid
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    InitWebSockets () {
        ipcMain.on('wsapi-updatePlaybackState', (event, arg) => {
            wsapi.updatePlaybackState(arg);
        })

        ipcMain.on('wsapi-returnQueue', (event, arg) => {
            wsapi.returnQueue(JSON.parse(arg));
        });

        ipcMain.on('wsapi-returnSearch', (event, arg) => {
            console.log(arg);
            wsapi.returnSearch(JSON.parse(arg));
        });

        wss = new WebSocketServer({
            port: 6969,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    // See zlib defaults.
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024
                },
                // Other options settable:
                clientNoContextTakeover: true, // Defaults to negotiated value.
                serverNoContextTakeover: true, // Defaults to negotiated value.
                serverMaxWindowBits: 10, // Defaults to negotiated value.
                // Below options specified as default values.
                concurrencyLimit: 10, // Limits zlib concurrency for perf.
                threshold: 1024 // Size (in bytes) below which messages
                // should not be compressed if context takeover is disabled.
            }
        })
        
        const defaultResponse = new wsapi.standardResponse(0, {}, "OK");

        console.log(`WebSocketServer started on port: ${this.port}`);
        wss.on('connection', function connection(ws) {
            ws.id = wsapi.createId();
            console.log(`Client ${ws.id} connected`)
            wsapi.clients.push(ws);
            ws.on('message', function incoming(message) {

            });
            // ws on message
            ws.on('message', function incoming(message) {
                let data = JSON.parse(message);
                let response = new wsapi.standardResponse(0, {}, "OK");;
                if(data.action) {
                    data.action.toLowerCase();
                }
                switch (data.action) {
                    default:
                        response.message = "Action not found";
                    break;
                    case "identify":
                        response.message = "Thanks for identifying!"
                        response.data = {
                            id: ws.id
                        }
                        ws.identity = {
                            name: data.name,
                            author: data.author,
                            description: data.description,
                            version: data.version
                        }
                    break;
                    case "quick-play":
                        app.win.webContents.executeJavaScript(`wsapi.quickPlay(\`${data.term}\`)`);
                        response.message = "Quick Play";
                    break;
                    case "shuffle":
                        app.win.webContents.executeJavaScript(`wsapi.toggleShuffle()`);
                    break;
                    case "repeat":
                        app.win.webContents.executeJavaScript(`wsapi.toggleRepeat()`);
                    break;
                    case "seek":
                        app.win.webContents.executeJavaScript(`MusicKit.getInstance().seekToTime(${parseFloat(data.time)})`);
                        response.message = "Seek";
                    break;
                    case "pause":
                        app.win.webContents.executeJavaScript(`MusicKit.getInstance().pause()`);
                        response.message = "Paused";
                    break;
                    case "play":
                        app.win.webContents.executeJavaScript(`MusicKit.getInstance().play()`);
                        response.message = "Playing";
                    break;
                    case "stop":
                        app.win.webContents.executeJavaScript(`MusicKit.getInstance().stop()`);
                        response.message = "Stopped";
                    break;
                    case "volume":
                        app.win.webContents.executeJavaScript(`MusicKit.getInstance().volume = ${parseFloat(data.volume)}`);
                        response.message = "Volume";
                    break;
                    case "mute":
                        app.win.webContents.executeJavaScript(`MusicKit.getInstance().mute()`);
                        response.message = "Muted";
                    break;
                    case "unmute":
                        app.win.webContents.executeJavaScript(`MusicKit.getInstance().unmute()`);
                        response.message = "Unmuted";
                    break;
                    case "next":
                        app.win.webContents.executeJavaScript(`MusicKit.getInstance().skipToNextItem()`);
                        response.message = "Next";
                    break;
                    case "previous":
                        app.win.webContents.executeJavaScript(`MusicKit.getInstance().skipToPreviousItem()`);
                        response.message = "Previous";
                    break;
                    case "musickit-api":
        
                    break;
                    case "musickit-library-api":
        
                    break;
                    case "get-queue":
                        app.win.webContents.executeJavaScript(`wsapi.getQueue()`);
                    break;
                    case "search":
                        if(!data.limit) {
                            data.limit = 10;
                        }
                        app.win.webContents.executeJavaScript(`wsapi.search(\`${data.term}\`, \`${data.limit}\`)`);
                    break;
                    case "show-window":
                        app.win.show()
                    break;
                    case "hide-window":
                        app.win.hide()
                    break;
                    case "play-mediaitem":
                        app.win.webContents.executeJavaScript(`wsapi.playTrackById(${data.id})`);
                        response.message = "Playing track";
                    break;
                    case "get-status":
                        response.data = {
                            isAuthorized: true
                        };
                        response.message = "Status";
                    break;
                    case "get-currentmediaitem":
                        response.data = {
                            "id": "1",
                            "title": "Test Title",
                            "artist": "Test Artist",
                            "album": "Test Album",
                            "duration": "0",
                            "cover": "",
                            "url": ""
                        };
                    break;
                }
                ws.send(JSON.stringify(response));
            });
            
            ws.on('close', function close() {
                // remove client from list
                wsapi.clients.splice(wsapi.clients.indexOf(ws), 1);
                console.log(`Client ${ws.id} disconnected`);
            });
            ws.send(JSON.stringify(defaultResponse));
        });
    },
    sendToClient(id) {
        // replace the clients.forEach with a filter to find the client that requested
    },
    updatePlaybackState(attr) {
        const response = new wsapi.standardResponse(0, attr, "OK", "playbackStateUpdate");
        wsapi.clients.forEach(function each(client) {
            client.send(JSON.stringify(response));
        });
    },
    returnSearch(results) {
        const response = new wsapi.standardResponse(0, results, "OK", "searchResults");
        wsapi.clients.forEach(function each(client) {
            client.send(JSON.stringify(response));
        });
    },
    returnQueue(queue) {
        const response = new wsapi.standardResponse(0, queue, "OK", "returnQueue");
        wsapi.clients.forEach(function each(client) {
            client.send(JSON.stringify(response));
        });
    },
    InitWebServer () {
        // Web Remote
        
    }
}

module.exports = wsapi