import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import { Socket } from 'engine.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, "public")))

const typingUsers = new Set()

io.on('connection', (socket) => {
  console.log('a user connected');
  
  // On envoie un message de bienvenue au client
  io.emit("system_message", { 
    content: `${socket.id} s'est connecté, il aurait dû rester chez lui`,
  })

  // Quand ce client de déconnecte
    socket.on("disconnect", () => {
        console.log("user disconnected")

        // On envoie un message de déconnexion au client
        io.emit("system_message", {
            content: `${socket.id} s'est deconnecté, bon débarra`
        })
    })

    // Quand le client envoie un message
    socket.on("user_message_send", (data) => {

        // Bloquer les messages vides
        if (data.content === "") return

        console.log("message received",data)

        // Gérer la commande /name
        if (data.content.startsWith("/name")) {
            const newName = data.content.slice(6).trim()
            if (!newName) return

            socket.username = newName
            io.emit("system_message", {
                content: `${socket.id} à changé son pseudo en ${newName}`
            })
            return
        }

        // On affiche le message dans la conversation
        io.emit("user_message", {
            content: data.content,
            time: new Date().toLocaleTimeString(),
            author: socket.username ?? socket.id
        })
    })   

        // On affiche le message qui dit que tu est en train d'écrire
        socket.on("typing_start", () => {
            typingUsers.add(socket.username ?? socket.id)

            io.emit("typing", Array.from(typingUsers.values()))

            setTimeout(() => {
                typingUsers.delete(socket.username ?? socket.id)
                io.emit("typing", Array.from(typingUsers.values()))
            }, 3000)
        }) 
    
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});