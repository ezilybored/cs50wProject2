document.addEventListener('DOMContentLoaded', () => {

  // Used to clear local storgae
  localStorage.setItem('username', '')
  localStorage.setItem('currentroom', '')
  // This line needs to be changed to include the url when deploying on heroku
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  // When the socket connects. Checks to see if the user was previously signed in and/or in a room
  socket.on('connect', () => {

    if (!localStorage.getItem('username')) {
      localStorage.setItem('username', '');

      document.querySelector("#rooms").style.display = "none";
      document.querySelector("#messages").style.display = "none";
      document.querySelector("#message").style.display = "none";

      // When the submitname button is pressed
      document.getElementById('submitname').onclick = (e) => {
          e.preventDefault()

          const user = document.getElementById('username').value;
          socket.emit('submit username', {'username': user});

          const element = document.getElementById('username');
          element.value = '';
        };
      }
    else {
      const user = localStorage.getItem('username');
      const storedname = localStorage.getItem('username');
      var userhtml = document.getElementById("displayname");
      userhtml.innerHTML = storedname;

      // Checks to see if the user was in a room when they were last on the app
      if (!localStorage.getItem('currentroom')) {
        localStorage.setItem('currentroom', '');

         document.querySelector("#rooms").style.display = "block";

         socket.emit('room_list');

         document.querySelector("#login").style.display = "none";
      }
      else {
        const room = localStorage.getItem('currentroom');

        document.querySelector("#rooms").style.display = "block";
        document.querySelector("#messages").style.display = "block";
        document.querySelector("#message").style.display = "block";
        document.querySelector("#login").style.display = "none";

        socket.emit('room_list');
        const storedname = localStorage.getItem('username');
        socket.emit('chooseroom', {'room': selected, 'user': storedname});
      }
    }
  });

  // Posting a message to the server
  document.getElementById('submitpost').onclick = (e) => {
      e.preventDefault()

      const message = document.getElementById('posttext').value;
      const user = localStorage.getItem('username');
      const room = localStorage.getItem('currentroom');
      var date = new Date();
      var timestamp = date.getTime();

      socket.emit('submit message', {'message': message, 'username': user, 'roomdata': room, 'timestamp': timestamp});

      const element = document.getElementById('posttext');
      element.value = '';
  };

  // Posting a new room to the server
  document.getElementById('submitroom').onclick = (e) => {
      e.preventDefault()

      const newroom = document.getElementById('newroom').value;
      socket.emit('submit room', {'room': newroom});

      const element = document.getElementById('newroom');
      element.value = '';
  };

  //  Choosing a current room from the server when logging in
  document.getElementById('chooseroom').onclick = (e) => {
      e.preventDefault()

      const list = document.getElementById('roomlist');
      const selected = list.options[list.selectedIndex].text;
      const storedname = localStorage.getItem('username');

      socket.emit('choose_room', {'room': selected, 'user': storedname});

  };

  // Recieving a message from the server
  socket.on('announce message', data => {
    // If the {data.roomname} submitted from the server matches the roomname in localstorage then add the message to the bottom of the list
    const li = document.createElement('li');
    li.innerHTML = `${data.username}: ${data.message}: ${data.timestamp}`;
    document.getElementById('messageslist').append(li);
  })

  // Recieving user confirmation from the server
  socket.on('verify user', data => {
    const user = `${data.username}`;
    localStorage.setItem('username', user)
    const storedname = localStorage.getItem('username');
    var userhtml = document.getElementById("displayname");
    userhtml.innerHTML = storedname;

    // If the user was in a room at last visit
    if (!localStorage.getItem('currentroom')) {
      localStorage.setItem('currentroom', '');

       document.querySelector("#rooms").style.display = "block";
       document.querySelector("#login").style.display = "none";

       socket.emit('room_list');
    }
    else {
      const room = localStorage.getItem('currentroom');

      document.querySelector("#rooms").style.display = "block";
      document.querySelector("#messages").style.display = "block";
      document.querySelector("#message").style.display = "block";
      document.querySelector("#login").style.display = "none";

      socket.emit('chooseroom', {'room': room, 'user': storedname});
      socket.emit('room_list');
    }
  })

  // Recieving new room from the server
  socket.on('verify room', data => {
    const success = `${data.success}`;
    if (success == "true") {
      const newroom = `${data.roomname}`;

      const option = document.createElement("OPTION");
      option.innerHTML = newroom;
      document.getElementById('roomlist').append(option);

      if (!localStorage.getItem('currentroom')) {
        localStorage.setItem('currentroom', newroom);
      }
      else {
        localStorage.setItem('currentroom', newroom);
      }

      document.querySelector("#rooms").style.display = "block";
      document.querySelector("#messages").style.display = "block";
      document.querySelector("#message").style.display = "block";
      document.querySelector("#login").style.display = "none";

      const selected = localStorage.getItem('currentroom');
      socket.emit('choose_room', {'room': selected});
    }
    else {
      alert("I'm sorry, this room name is taken");
    }
  })

  // When the list of rooms is returned. This populates the drop down menu
  socket.on('list_of_rooms', data => {
    const returnedlist = `${data.list}`;
    const splitreturn = returnedlist.split(",");
    for(var i=0; i<splitreturn.length; i++) {
      const option = document.createElement("OPTION");
      option.innerHTML = splitreturn[i];
      document.getElementById('roomlist').append(option);
    }
  })

  // When a room is signed in
  socket.on('room_choice', data => {
    const success = `${data.success}`;
    if (success == "true") {
      const newroom = `${data.roomname}`;

      if (!localStorage.getItem('currentroom')) {
        localStorage.setItem('currentroom', newroom);
      }
      else {
        localStorage.setItem('currentroom', newroom);
      }

      const room = localStorage.getItem('currentroom');
      var roomhtml = document.getElementById("roomname");
      roomhtml.innerHTML = room;

      document.querySelector("#messages").style.display = "block";
      document.querySelector("#message").style.display = "block";

      var list = document.getElementById("messageslist");
      list.innerHTML = "";

      // JSON object is sent from the server and added to the messages list
      const messages = `${data.message}`;
      const parsemessages = JSON.parse(messages)
      for (var i=0; i<parsemessages.length; i++) {
        const li = document.createElement('li');
        li.innerHTML = `${parsemessages[i].username}: ${parsemessages[i].message: ${parsemessages[i].timestamp}`;
        document.getElementById('messageslist').append(li);
      }
    }
  })
});
