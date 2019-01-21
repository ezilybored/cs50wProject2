document.addEventListener('DOMContentLoaded', () => {

  // This line needs to be changed to include the url when deploying on heroku
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  socket.on('connect', () => {
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
  });

  socket.on('announce message', data => {
    const li = document.createElement('li');
    li.innerHTML = `${data.username}: ${data.message}`;
    document.getElementById('messages').append(li);
  })
});
