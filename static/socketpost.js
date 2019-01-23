document.addEventListener('DOMContentLoaded', () => {

  // Used to clear local storgae
  //localStorage.setItem('username', '')
  // This line needs to be changed to include the url when deploying on heroku
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  // When the socket connects
  socket.on('connect', () => {
    // Check the local storage for variable username and if not present then create it
    if (!localStorage.getItem('username')) {
      localStorage.setItem('username', '');
      // Hide the following
      document.querySelector("#rooms").style.display = "none";
      document.querySelector("#messages").style.display = "none";
      document.querySelector("#message").style.display = "none";

      // When the submitname button is pressed
      document.getElementById('submitname').onclick = (e) => {
          e.preventDefault()
          // Gets the username value
          const user = document.getElementById('username').value;
          // Sends the data to the server
          socket.emit('submit username', {'username': user});

          // Blanks the username field after submission
          const element = document.getElementById('username');
          element.value = '';
        };
      }
    else {
      // Gets the username from the local storage
      const user = localStorage.getItem('username');
      // Will need to set html element to username value

      // Checks to see if the user was in a room when they were last on the app
      if (!localStorage.getItem('currentroom')) {
        localStorage.setItem('currentroom', '');
         // Then display the nav bar but not the chat options yet so they can choose or create a room
         document.querySelector("#rooms").style.display = "block";
         // Hide the following
         document.querySelector("#login").style.display = "none";
      }
      else {
        const room = localStorage.getItem('currentroom');
        // Will need to set html element to currentroom value
        // Shows the following
        document.querySelector("#rooms").style.display = "block";
        document.querySelector("#messages").style.display = "block";
        document.querySelector("#message").style.display = "block";
        // Hide the following
        document.querySelector("#login").style.display = "none";
      }
    }
  });

  // Posting a message to the server
  document.getElementById('submitpost').onclick = (e) => {
      e.preventDefault()

      const message = document.getElementById('posttext').value;
      const user = document.getElementById('username').value;
      // Will also need to add the datetime to be sent to the server here
      // Will also need info on what room the message was sent from and what room to update
      socket.emit('submit message', {'message': message, 'username': user});

      const element = document.getElementById('posttext');
      element.value = '';
  };

  // Recieving a message from the server
  socket.on('announce message', data => {
    const li = document.createElement('li');
    li.innerHTML = `${data.username}: ${data.message}`;
    document.getElementById('messages').append(li);
  })

  // Recieving user confirmation from the server
  socket.on('verify user', data => {
    // Some code here to update the username in the html
    const user = `${data.username}`;
    // Sets the local storage using the returned username
    localStorage.setItem('username', user)

    // Checks to see if the user was in a room when they were last on the app
    if (!localStorage.getItem('currentroom')) {
      localStorage.setItem('currentroom', '');
       // Then display the nav bar but not the chat options yet so they can choose or create a room
       document.querySelector("#rooms").style.display = "block";
       // Hide the following
       document.querySelector("#login").style.display = "none";
    }
    else {
      const room = localStorage.getItem('currentroom');
      // Will need to set html element to currentroom value
      // Shows the following
      document.querySelector("#rooms").style.display = "block";
      document.querySelector("#messages").style.display = "block";
      document.querySelector("#message").style.display = "block";
      // Hide the following
      document.querySelector("#login").style.display = "none";
    }
  })
});
