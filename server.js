const { Server } = require("socket.io");
const NodeRSA = require("node-rsa");

const io = new Server({
    cors: {
        origin: "*",
    }
});

const clients = [];

io.on("connection", (socket) => {
    console.log('connection opened');

    socket.join('room')

    socket.on("getKey", (args) => {
        const key = new NodeRSA({b: 512})
        const publicKey = key.exportKey('public')
        const privateKey = key.exportKey('private')

        console.log(publicKey)
        console.log(privateKey)

        const client = {
            publicKey,
            id: clients.length + 1
        }

        clients.push(client)

        socket.emit("publickey", publicKey)
        socket.emit("privatekey", privateKey)
        socket.emit("clientid", client.id)
    })

    socket.on('getClients', (args) => {
        const availableClients = clients.filter(item => {
            return item.id !== args.id
        })

        socket.emit(`${args.id}Clients`, availableClients)
    })

    socket.on('Message', (args) => {
        console.log(`from: ${args.from}`)
        console.log(`to: ${args.to}`)
        console.log(`message: ${args.text}`)

        socket.broadcast.to('room').emit(`${args.to}Message`, {
            text: args.text,
            from: args.from,
        })
    })
});

io.listen(4000);