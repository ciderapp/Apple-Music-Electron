const ws = require('ws');
const http = require('http');
const WebSocketServer = ws.Server;
const WebSocket = ws.WebSocket;
const url = require('url');
const fs = require('fs');
const path = require('path');
const port = process.argv[2] || 9000;

const wsapi = {
    port: 6969,
    wss: null,
    InitWebSockets () {
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

        class StandardResponse {
            constructor(status, data, message, echo) {
                this.status = status;
                this.message = message;
                this.data = data;
            }
            export() {
                return this;
            }
        }
        
        const defaultResponse = new StandardResponse(200, {}, "OK").export();

        console.log(`WebSocketServer started on port: ${this.port}`);
        wss.on('connection', function connection(ws) {
            ws.on('message', function incoming(message) {
                console.log('received: %s', message);
            });
            // ws on message
            ws.on('message', function incoming(message) {
                console.log('received: %s', message);
                let data = JSON.parse(message);
                let response = defaultResponse;
                if(data.action) {
                    data.action.toLowerCase();
                }
                switch (data.action) {
                    default:
                        response.message = "Action not found";
                    break;
                    case "shuffle":
        
                    break;
                    case "repeat":
        
                    break;
                    case "seek":
                        response.message = "Seek";
                    break;
                    case "pause":
                        response.message = "Paused";
                    break;
                    case "play":
                        response.message = "Playing";
                    break;
                    case "stop":
                        response.message = "Stopped";
                    break;
                    case "volume":
                        response.message = "Volume";
                    break;
                    case "mute":
                        response.message = "Muted";
                    break;
                    case "unmute":
                        response.message = "Unmuted";
                    break;
                    case "next":
                        response.message = "Next";
                    break;
                    case "previous":
                        response.message = "Previous";
                    break;
                    case "musickit-api":
        
                    break;
                    case "musickit-library-api":
        
                    break;
                    case "search":
        
                    break;
                    case "show-window":
        
                    break;
                    case "hide-window":
        
                    break;
                    case "play-mediaitem":
                        response.data = {
                            track: data.track
                        };
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
            ws.send(JSON.stringify(defaultResponse));
        });
    },
    InitWebServer () {
        // Web Remote
    }
}

module.exports = wsapi