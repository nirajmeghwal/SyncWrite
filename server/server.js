import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';
import Connection from './database/db.js';
import { getDocument, updateDocument } from './controller/document-controller.js'
import path from 'path';
const PORT = process.env.PORT || 9000;
const app=express();
Connection();
const httpServer = createServer(app);
httpServer.listen(PORT);
const io = new Server(httpServer);
//----Deployment----
const __dirname=path.resolve();
if(process.env.NODE_ENV==='production'){
   // Correct use of __dirname
console.log(__dirname); 

// Serving static files from the "client/build" directory
app.use(express.static(path.join(__dirname, 'client/build')));

// For any other route, serve the index.html from the "client/build" directory
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client/build', 'index.html'));
});
}
io.on('connection', socket => {
    socket.on('get-document', async documentId => {
        
        const document = await getDocument(documentId);
       
        socket.join(documentId);
        
        socket.emit('load-document', document.data);
       

        socket.on('send-changes', delta => {
           console.log("send-changes")
            socket.broadcast.to(documentId).emit('receive-changes', delta);
            
        })
        socket.on('save-document', async data => {
            console.log("saving document..");
            await updateDocument(documentId, data);
        })
        socket.on("ping", (callback) => {
            callback();
        });
    })
});
