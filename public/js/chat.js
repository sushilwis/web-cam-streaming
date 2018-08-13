var socket = io();

function scrollToBottom () {
  // Selectors
  var messages = jQuery('#messages');
  var newMessage = messages.children('li:last-child')
  // Heights
  var clientHeight = messages.prop('clientHeight');
  var scrollTop = messages.prop('scrollTop');
  var scrollHeight = messages.prop('scrollHeight');
  var newMessageHeight = newMessage.innerHeight();
  var lastMessageHeight = newMessage.prev().innerHeight();

  if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
    messages.scrollTop(scrollHeight);
  }
}



function loadCam(stream){
  // var video = $('#video');
  // console.log(video);
  // video.src = window.URL.createObjectURL(stream);
  video.srcObject = stream;
  console.log('from load cam stream');        
  socket.emit('stream', stream);        
  // socket.emit('stream', 'dsdfsdfs');        
}


function loadFail(stream){
  console.log('from loadfail cam stream');
}

function viewVideo(video, context){
  context.drawImage(video, 0, 0, context.width, context.height);
  // var room = GetParameterValues('room');
  // console.log(room);
  socket.emit('createStream', canvas.toDataURL('image/webp'));
  // socket.emit('stream', {room: room, data: canvas.toDataURL('image/webp')});
}




socket.on('connect', function () {
  var params = jQuery.deparam(window.location.search);

  socket.emit('join', params, function (err) {
    if (err) {
      alert(err);
      window.location.href = '/';
    } else {
      console.log('No error');
    }
  });
});




socket.on('disconnect', function () {
  console.log('Disconnected from server');
});



socket.on('updateUserList', function (users) {
  var ol = jQuery('<ol></ol>');

  users.forEach(function (user) {
    ol.append(jQuery('<li></li>').text(user));
  });

  jQuery('#users').html(ol);
});




socket.on('newStream', function (message) {
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#message-template').html();
  var html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime
  });

  var img = document.getElementById('streamPlay');
  img.src = message.stream;

  jQuery('#messages').append(html);
  scrollToBottom();
});




socket.on('newLocationMessage', function (message) {
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#location-message-template').html();
  var html = Mustache.render(template, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime
  });

  jQuery('#messages').append(html);
  scrollToBottom();
});




jQuery('#message-form').on('submit', function (e) {
  e.preventDefault();

  var messageTextbox = jQuery('[name=message]');

  var video = document.getElementById('video');
  var canvas = document.getElementById('preview');
  var context = canvas.getContext('2d');

  canvas.width = 480;
  canvas.height = 360;

  context.width = canvas.width;
  context.height = canvas.height;

  navigator.getUserMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msgGetUserMedia
  );


  if(navigator.getUserMedia){
    navigator.getUserMedia({video: true}, loadCam, loadFail);
  }

  context.drawImage(video, 0, 0, context.width, context.height);


  socket.emit('createStream', {
    text: messageTextbox.val(),
    streamData: canvas.toDataURL('image/webp')
  }, function () {
    messageTextbox.val('')
  });
});




var locationButton = jQuery('#send-location');
locationButton.on('click', function () {
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.');
  }

  locationButton.attr('disabled', 'disabled').text('Sending location...');

  navigator.geolocation.getCurrentPosition(function (position) {
    locationButton.removeAttr('disabled').text('Send location');
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, function () {
    locationButton.removeAttr('disabled').text('Send location');
    alert('Unable to fetch location.');
  });
});
