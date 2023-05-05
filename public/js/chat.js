var socketio = io()
// const qs = qs()

// Elements
const $messages = document.querySelector("#messages")
const $messageForm = document.querySelector("#chat-form")
const $messageFormInput = $messageForm.querySelector("#chatInput")
const $messageFormButton = $messageForm.querySelector("button")
const $locationButton = document.querySelector("#send-location")
const $sidebar = document.querySelector(".chat__sidebar")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const { username , room } = Qs.parse(location.search, { ignoreQueryPrefix: true})


function autoscroll() {
    // New message element
    const $newMessage = $messages.lastElementChild
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage) 
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    console.log("New Message Height:",newMessageHeight)
    // Visible Height
    const visibleHeight = $messages.offsetHeight
    console.log("Visible Height:",visibleHeight)
    
    // Height of Messages Container
    const containerHeight = $messages.scrollHeight
    console.log("Container Height:",containerHeight)
    
    // How far user scrolled
    const scrolledOffset = $messages.scrollTop + visibleHeight
    console.log("Scroll Offset Height:",scrolledOffset)

    if(containerHeight - newMessageHeight <= scrolledOffset){
        console.log("Container-NewMessage Height:",containerHeight - newMessageHeight)
        $messages.scrollTop = $messages.scrollHeight
    }
}   



socketio.on("message", (value) => {
    // console.log(value)
    const html = Mustache.render(messageTemplate, {
        user: value.username,
        message: value.text,
        createdAt: moment(value.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socketio.on("locationMessage", (value) => {
    // console.log(value)
    const html = Mustache.render(locationMessageTemplate, {
        user: value.username,
        url: value.url,
        createdAt: moment(value.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socketio.on('roomData', ({room, users}) => {
    console.log(room)
    console.log(users)
    const html = Mustache.render(sidebarTemplate, {
        users,
        room,
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute("disabled", "disabled")  
    const message = e.target.elements.chatInput.value
    socketio.emit("sendMessage", message, (cb_message) => {
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ""
        $messageFormInput.focus()
        if(cb_message){{
            return console.log(cb_message)
        }}
        console.log("The message is delivered.")
    })
})

$locationButton.addEventListener("click", () => {
    $locationButton.setAttribute("disabled", "disabled")  
    if ("geolocation" in navigator) {
        /* geolocation is available */
        navigator.geolocation.getCurrentPosition( (position) => {
            let location = position
            // console.log(position)
            socketio.emit("sendLocation", {
                lat: location.coords.latitude,
                long: location.coords.longitude
            }, () => {
                console.log("Location shared.")
                $locationButton.removeAttribute("disabled")
            })
        })
    } else {
        /* geolocation IS NOT available */
        return alert("Geolocation is not supported by your browser.")
    }
})

socketio.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href = "/"
    }
})