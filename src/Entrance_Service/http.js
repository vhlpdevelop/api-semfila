const express = require("express");
const http = require("http")
const webSocket = require("socket.io")

const app= express();
const serverHttp = http.createServer(app)
const io = new webSocket.Server(serverHttp)

