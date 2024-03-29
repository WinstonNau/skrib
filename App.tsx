import React, {useEffect} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {Provider} from 'react-native-paper';
import App from './src';
import {theme} from './src/core/theme';
import {ApolloProvider} from '@apollo/client';
import {SocketIOProvider} from 'use-socketio';

import client from './src/lib/apollo';

const requestAndroidMicrophonePermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Skrib',
        message:
          'Skrib needs access to your microphone to handle your guesses.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('You can use the microphone');
    } else {
      console.log('Microphone permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
};

function Main() {
  useEffect(() => {
    Platform.OS === 'android' ? requestAndroidMicrophonePermission() : null;
  }, []);
  return (
    <ApolloProvider client={client}>
      <Provider theme={theme}>
        <SocketIOProvider url="https://skrib-socket.herokuapp.com">
          <App />
        </SocketIOProvider>
      </Provider>
    </ApolloProvider>
  );
}

export default Main;
