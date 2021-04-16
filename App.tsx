import React, {useEffect} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {Provider} from 'react-native-paper';
import App from './src';
import {theme} from './src/core/theme';
import {ApolloProvider} from '@apollo/client';

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

let user: any;

auth().onAuthStateChanged(async (signedInUser) => {
  signedInUser ? (user = signedInUser) : (user = null);
  console.log('id token: ', await user?.getIdToken());
});

const httpLink = createHttpLink({
  uri: 'https://skrib.herokuapp.com/graphql',
});

const authLink = setContext(async (_, {headers}) => {
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: user ? `Bearer ${await user.getIdToken()}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function Main() {
  useEffect(() => {
    Platform.OS === 'android' ? requestAndroidMicrophonePermission() : null;
  }, []);
  return (
    <ApolloProvider client={client}>
      <Provider theme={theme}>
        <App />
      </Provider>
    </ApolloProvider>
  );
}

export default Main;
