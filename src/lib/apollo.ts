import auth from '@react-native-firebase/auth';
import {ApolloClient, createHttpLink, InMemoryCache} from '@apollo/client';
import {setContext} from '@apollo/client/link/context';

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

export default client;
