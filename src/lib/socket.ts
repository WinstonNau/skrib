import {io} from 'socket.io-client';

const socket = io('https://skrib-socket.herokuapp.com');

socket.on('connect', () => {
  console.log(
    'Socket: ' + socket.id + ' is now successfully connected to the server'
  );
});

socket.on('disconnect', (reason) => {
  if (
    reason === 'ping timeout' ||
    reason === 'transport close' ||
    reason === 'transport error'
  ) {
    // if the socket wasn't forcibly disconnected
    socket.connect();
  }
});

socket.on('test', () => {
  console.log('TEST');
});

export default socket;
