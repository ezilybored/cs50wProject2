document.addEventListener("DOMContentLoaded", () => {
  //localStorage.setItem("username", "");
  //localStorage.setItem("currentroom", "");

  var socket = io.connect(
    //location.protocol + "//" + document.domain + ":" + location.port
    var socket = io.connect('https://thewhitelodge.herokuapp.com/');

  );

  let storedName = localStorage.getItem("username");
  let storedRoom = localStorage.getItem("currentroom");
  let rooms = document.querySelector(".rooms");
  let messages = document.querySelector(".messages");
  let message = document.querySelector(".message");
  let login = document.querySelector(".loginbox");

  // On log in. Check to see if there is a user still logged in and whether they were in a room
  socket.on("connect", () => {
    if (!storedName && !storedRoom) {
      console.log("no name and no room");
      localStorage.setItem("username", "");
      localStorage.setItem("currentroom", "");
      rooms.style.display = "none";
      messages.style.display = "none";
      message.style.display = "none";
      login.style.display = "grid";
    } else if (storedName && !storedRoom) {
      console.log("name but no room");
      localStorage.setItem("currentroom", "");
      rooms.style.display = "block";
      messages.style.display = "block";
      message.style.display = "flex";
      login.style.display = "none";
      var roomhtml = document.getElementById("roomname");
      roomhtml.innerHTML = `Please select a room`;

      socket.emit("room_list");
    } else {
      console.log("name and room");
      storedName = localStorage.getItem("username");
      storedRoom = localStorage.getItem("currentroom");
      rooms.style.display = "block";
      messages.style.display = "block";
      message.style.display = "flex";
      login.style.display = "none";

      socket.emit("room_list");

      socket.emit("choose_room", { room: storedRoom, user: storedName });
    }

    // When the user chooses a username on the login screen
    document.getElementById("submitname").onclick = e => {
      e.preventDefault();
      const user = document.getElementById("username").value;
      localStorage.setItem("username", user);
      //socket.emit("submit username", { username: user });
      rooms.style.display = "block";
      messages.style.display = "block";
      message.style.display = "flex";
      login.style.display = "none";
      var roomhtml = document.getElementById("roomname");
      roomhtml.innerHTML = `Please select a room`;
      var list = document.getElementById("messageslist");
      list = [];
      socket.emit("room_list");

      const element = document.getElementById("username");
      element.value = "";
    };
  });

  // When the list of rooms is returned. This populates the drop down menu
  socket.on("list_of_rooms", data => {
    const returnedlist = `${data.list}`;
    const splitreturn = returnedlist.split(",");
    for (var i = 0; i < splitreturn.length; i++) {
      const option = document.createElement("OPTION");
      option.innerHTML = splitreturn[i];
      document.getElementById("roomlist").append(option);
    }
  });

  //  Choosing a current room from the server when logging in
  document.getElementById("chooseroom").onclick = e => {
    e.preventDefault();
    const list = document.getElementById("roomlist");
    const selected = list.options[list.selectedIndex].text;
    const storedname = localStorage.getItem("username");

    socket.emit("choose_room", { room: selected, user: storedname });
  };

  // Posting a new room to the server
  document.getElementById("submitroom").onclick = e => {
    e.preventDefault();

    const newroom = document.getElementById("newroom").value;
    socket.emit("submit room", { room: newroom });

    const element = document.getElementById("newroom");
    element.value = "";
  };

  // Recieving new room from the server
  socket.on("verify room", data => {
    const success = `${data.success}`;
    if (success == "true") {
      const newroom = `${data.roomname}`;
      // Appends the new room to the current list of available rooms
      const option = document.createElement("OPTION");
      option.innerHTML = newroom;
      document.getElementById("roomlist").append(option);

      localStorage.setItem("currentroom", newroom);

      rooms.style.display = "block";
      messages.style.display = "block";
      message.style.display = "flex";
      login.style.display = "none";

      const selected = localStorage.getItem("currentroom");
      socket.emit("choose_room", { room: selected });
    } else {
      alert("I'm sorry, this room name is taken");
    }
  });

  // When a user join a room
  socket.on("room_choice", data => {
    let storedName = localStorage.getItem("username");
    console.log(storedName);
    const success = `${data.success}`;
    if (success == "true") {
      const newroom = `${data.roomname}`;

      localStorage.setItem("currentroom", newroom);

      var roomhtml = document.getElementById("roomname");
      roomhtml.innerHTML = `${newroom} - ${storedName}`;

      var list = document.getElementById("messageslist");
      list.innerHTML = "";

      // JSON object is sent from the server and added to the messages list
      const messageRecieved = `${data.message}`;
      //const storedname = localStorage.getItem("username");
      const parsemessages = JSON.parse(messageRecieved);
      for (var i = 0; i < parsemessages.length; i++) {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${parsemessages[i].username}:</strong> <br> ${
          parsemessages[i].message
        } <br> - <font size="0.8" color="#212121">${
          parsemessages[i].timestamp
        }</font>`;
        if (parsemessages[i].username == storedName) {
          li.style.background = "linear-gradient(to top, #FFBE0D, #FFBE4F)";
          li.style.marginLeft = "30%";
        }
        var list = document.getElementById("messageslist");
        list.append(li);
        var scroll = document.querySelector(".messages");
        scroll.scrollTop = scroll.scrollHeight;
      }
      const li = document.createElement("li");
      li.innerHTML = `${storedName} has entered the room.`;
      li.style.background = "white";
      document.getElementById("messageslist").append(li);
      var scroll = document.querySelector(".messages");
      scroll.scrollTop = scroll.scrollHeight;
    }
  });

  // Posting a message to the server
  document.getElementById("submitpost").onclick = e => {
    e.preventDefault();

    const message = document.getElementById("posttext").value;
    const user = localStorage.getItem("username");
    const room = localStorage.getItem("currentroom");

    var date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    let hour = date.getHours();
    let minutes = date.getMinutes();
    let stringdate = `Time -  ${hour}:${minutes} Date - ${day}, ${month}, ${year}`;

    socket.emit("submit message", {
      message: message,
      username: user,
      roomdata: room,
      timestamp: stringdate
    });

    const element = document.getElementById("posttext");
    element.value = "";
  };

  // Recieving a message from the server
  socket.on("announce message", data => {
    const storedname = localStorage.getItem("username");
    // If the {data.roomname} submitted from the server matches the roomname in localstorage then add the message to the bottom of the list
    const li = document.createElement("li");
    li.innerHTML = `<strong>${data.username}:</strong> <br> ${
      data.message
    } <br> <font size="0.8" color="#212121">${data.timestamp}</font>`;
    var list = document.getElementById("messageslist");
    if (data.username == storedname) {
      li.style.background = "linear-gradient(to top, #FFBE0D, #FFBE4F)";
      li.style.marginLeft = "30%";
    }
    list.append(li);
    var scroll = document.querySelector(".messages");
    scroll.scrollTop = scroll.scrollHeight;
  });

  // Logging the current user out
  document.getElementById("logout").onclick = e => {
    e.preventDefault();
    localStorage.setItem("username", "");
    localStorage.setItem("currentroom", "");

    document.querySelector(".rooms").style.display = "none";
    document.querySelector(".messages").style.display = "none";
    document.querySelector(".message").style.display = "none";
    document.querySelector(".loginbox").style.display = "grid";

    location.reload();
  };
});

/*
  // When the socket connects. Checks to see if the user was previously signed in and/or in a room
  socket.on("connect", () => {
    if (!localStorage.getItem("username")) {
      localStorage.setItem("username", "");

      document.querySelector(".rooms").style.display = "none";
      document.querySelector(".messages").style.display = "none";
      document.querySelector(".message").style.display = "none";

      // When the submitname button is pressed
      document.getElementById("submitname").onclick = e => {
        e.preventDefault();

        const user = document.getElementById("username").value;
        socket.emit("submit username", { username: user });

        const element = document.getElementById("username");
        element.value = "";
      };
    } else {
      //const user = localStorage.getItem('username');
      //const storedname = localStorage.getItem('username');

      // Checks to see if the user was in a room when they were last on the app
      if (!localStorage.getItem("currentroom")) {
        localStorage.setItem("currentroom", "");

        document.querySelector(".rooms").style.display = "block";

        socket.emit("room_list");

        document.querySelector(".loginbox").style.display = "none";
      } else {
        const room = localStorage.getItem("currentroom");
        document.querySelector(".rooms").style.display = "block";
        document.querySelector(".messages").style.display = "block";
        document.querySelector(".message").style.display = "grid";
        document.querySelector(".loginbox").style.display = "none";

        socket.emit("room_list");
        const storedname = localStorage.getItem("username");
        socket.emit("choose_room", { room: room, user: storedname });
      }
    }
  });

  // Posting a message to the server
  document.getElementById("submitpost").onclick = e => {
    e.preventDefault();

    const message = document.getElementById("posttext").value;
    const user = localStorage.getItem("username");
    const room = localStorage.getItem("currentroom");
    var date = new Date();
    var stringdate = String(date);

    socket.emit("submit message", {
      message: message,
      username: user,
      roomdata: room,
      timestamp: stringdate
    });

    const element = document.getElementById("posttext");
    element.value = "";
  };

  // Posting a new room to the server
  document.getElementById("submitroom").onclick = e => {
    e.preventDefault();

    const newroom = document.getElementById("newroom").value;
    socket.emit("submit room", { room: newroom });

    const element = document.getElementById("newroom");
    element.value = "";
  };

  //  Choosing a current room from the server when logging in
  document.getElementById("chooseroom").onclick = e => {
    e.preventDefault();

    const list = document.getElementById("roomlist");
    const selected = list.options[list.selectedIndex].text;
    const storedname = localStorage.getItem("username");

    socket.emit("choose_room", { room: selected, user: storedname });
  };

  // Recieving a message from the server
  socket.on("announce message", data => {
    const storedname = localStorage.getItem("username");
    // If the {data.roomname} submitted from the server matches the roomname in localstorage then add the message to the bottom of the list
    const li = document.createElement("li");
    li.innerHTML = `<strong>${data.username}:</strong> <br> ${
      data.message
    } <br> <font size="0.8" color="#212121">${data.timestamp}</font>`;
    var list = document.getElementById("messageslist");
    if (data.username == storedname) {
      li.style.background = "linear-gradient(to top, #FFBE0D, #FFBE4F)";
      li.style.marginLeft = "30%";
    }
    list.append(li);
    var scroll = document.querySelector(".messages");
    scroll.scrollTop = scroll.scrollHeight;
  });

  // Recieving user confirmation from the server
  socket.on("verify user", data => {
    const user = `${data.username}`;
    localStorage.setItem("username", user);
    const storedname = localStorage.getItem("username");
    //var userhtml = document.getElementById("displayname");
    //userhtml.innerHTML = storedname;

    // If the user was in a room at last visit
    if (!localStorage.getItem("currentroom")) {
      localStorage.setItem("currentroom", "");

      document.querySelector(".rooms").style.display = "block";
      document.querySelector(".loginbox").style.display = "none";

      socket.emit("room_list");
    } else {
      const room = localStorage.getItem("currentroom");

      document.querySelector(".rooms").style.display = "block";
      document.querySelector(".messages").style.display = "block";
      document.querySelector(".message").style.display = "grid";
      document.querySelector(".loginbox").style.display = "none";

      socket.emit("chooseroom", { room: room, user: storedname });
      socket.emit("room_list");
    }
  });

  // Recieving new room from the server
  socket.on("verify room", data => {
    const success = `${data.success}`;
    if (success == "true") {
      const newroom = `${data.roomname}`;

      const option = document.createElement("OPTION");
      option.innerHTML = newroom;
      document.getElementById("roomlist").append(option);

      if (!localStorage.getItem("currentroom")) {
        localStorage.setItem("currentroom", newroom);
      } else {
        localStorage.setItem("currentroom", newroom);
      }

      document.querySelector(".rooms").style.display = "block";
      document.querySelector(".messages").style.display = "block";
      document.querySelector(".message").style.display = "grid";
      document.querySelector(".loginbox").style.display = "none";

      const selected = localStorage.getItem("currentroom");
      socket.emit("choose_room", { room: selected });
    } else {
      alert("I'm sorry, this room name is taken");
    }
  });

  // When the list of rooms is returned. This populates the drop down menu
  socket.on("list_of_rooms", data => {
    const returnedlist = `${data.list}`;
    const splitreturn = returnedlist.split(",");
    for (var i = 0; i < splitreturn.length; i++) {
      const option = document.createElement("OPTION");
      option.innerHTML = splitreturn[i];
      document.getElementById("roomlist").append(option);
    }
  });

  // When a room is signed in
  socket.on("room_choice", data => {
    const success = `${data.success}`;
    if (success == "true") {
      const newroom = `${data.roomname}`;

      localStorage.setItem("currentroom", newroom);
      /*
      if (!localStorage.getItem("currentroom")) {
        localStorage.setItem("currentroom", newroom);
      } else {
        localStorage.setItem("currentroom", newroom);
      }
      */
/*
      const room = localStorage.getItem("currentroom");
      var roomhtml = document.getElementById("roomname");
      roomhtml.innerHTML = room;

      document.querySelector(".messages").style.display = "block";
      document.querySelector(".message").style.display = "grid";

      var list = document.getElementById("messageslist");
      list.innerHTML = "";

      // JSON object is sent from the server and added to the messages list
      const messages = `${data.message}`;
      const storedname = localStorage.getItem("username");
      const parsemessages = JSON.parse(messages);
      for (var i = 0; i < parsemessages.length; i++) {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${parsemessages[i].username}:</strong> <br> ${
          parsemessages[i].message
        } <br> - <font size="0.8" color="#212121">${
          parsemessages[i].timestamp
        }</font>`;
        if (parsemessages[i].username == storedname) {
          li.style.background = "linear-gradient(to top, #FFBE0D, #FFBE4F)";
          li.style.marginLeft = "30%";
        }
        var list = document.getElementById("messageslist");
        list.append(li);
        var scroll = document.querySelector(".messages");
        scroll.scrollTop = scroll.scrollHeight;
      }
      const li = document.createElement("li");
      li.innerHTML = `${storedname} has entered the room.`;
      li.style.background = "white";
      document.getElementById("messageslist").append(li);
      var scroll = document.querySelector(".messages");
      scroll.scrollTop = scroll.scrollHeight;
    }
  });

  document.getElementById("logout").onclick = e => {
    e.preventDefault();
    localStorage.setItem("username", "");
    localStorage.setItem("currentroom", "");

    document.querySelector(".rooms").style.display = "none";
    document.querySelector(".messages").style.display = "none";
    document.querySelector(".message").style.display = "none";
    document.querySelector(".loginbox").style.display = "grid";

    const list = document.getElementById("roomlist");
    list.innerHTML = "<option>Please select a room</option>";
  };
});
*/
