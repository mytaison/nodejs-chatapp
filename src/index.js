const http = require("http")
const { Server } = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const { addUser, getUser, getUsersInRoom, removeUser } = require("./utils/users")

const app = require("./app")
const { userInfo } = require("os")
const server = http.createServer(app)
const io = new Server(server)

// Routes
app.get("/" , (req, res) => {
    res.render(index)
})

app.get("*" , (req, res) => {
    res.send(404, "Page not found")
})

app.post("*" , (req, res) => {
    res.send(404, "Page not found")
})

const PORT = process.env.PORT || 3000

let totalConnection = 0
io.on("connection", (socket) => {
    const welcomeMessage = "Welcome!"
    console.log(`New Websocket Connection : ${++totalConnection}`)
    // socket.emit("message", generateMessage(welcomeMessage))

    // Broadcasting message to others about new user, user will not receive the message
    // socket.broadcast.emit("message", generateMessage("A new user has joined the chat."))

    socket.on('join', ({ username, room }, callback) => {
        const { error, user} = addUser({
            id: socket.id,
            username : username,
            room: room
        })
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        // socket.emit (client), io.emit (all clients), socket.broadcase.emit (all client except the sender client),
        // io.to.emit (all clients in a room), socket.broadcase.to.io (all clients except sender in a room)
        socket.emit('message', generateMessage("admin", welcomeMessage))
        socket.broadcast.to(user.room).emit("message", generateMessage(`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    // sendMessage
    socket.on("sendMessage", (message, callback) => {
        const filter = new Filter()
        if(filter.isProfane(message)) {
            return callback("Profanity is not allowed!")
        }
        const userInfo = getUser(socket.id)
        if(userInfo){
            io.to(userInfo.room).emit("message", generateMessage(userInfo.username, message))
            callback("")
        }
    })

    // sendLocation
    socket.on("sendLocation", (location, callback) => {
        // console.log(location)
        const userInfo = getUser(socket.id)
        if(userInfo){
            io.to(userInfo.room).emit("locationMessage", generateLocationMessage(userInfo.username, `https://google.com/maps?q=${location.lat},${location.long}`))
            callback("")
        }
    })
    //disconnect
    socket.on("disconnect", () => {
        const removedUser = removeUser(socket.id)
        if(removedUser){
            io.to(removedUser.room).emit("message", generateMessage(`${removedUser.username} has left the room.`))
            io.to(removedUser.room).emit('roomData', {
                room: removedUser.room,
                users: getUsersInRoom(removedUser.room)
            })
        }
    })
})


server.listen(PORT, () => {
    console.log(`Server is started on port: ${PORT}`)
})
