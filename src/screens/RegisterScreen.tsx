import React, {memo, useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import BackButton from '../components/BackButton';
import {theme} from '../core/theme';
import {Navigation} from '../types';
import {emailValidator, passwordValidator, nameValidator} from '../core/utils';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
// import {GoogleSignin} from '@react-native-community/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {gql} from '@apollo/client/core';
import {useLazyQuery} from '@apollo/client';
import {getUserAgent} from 'react-native-device-info';

// GoogleSignin.configure({
//   webClientId:
//     '703490486450-2mncou1hcl9skqpe8bl69t978099tte2.apps.googleusercontent.com',
// });

type Props = {
  navigation: Navigation;
};

interface CheckUsernameResp {
  playerByDisplayName: {
    displayName: string;
  };
}

const CHECK_USERNAME = gql`
  query CheckUsername($displayName: String!) {
    playerByDisplayName(displayName: $displayName) {
      displayName
    }
  }
`;

const RegisterScreen = ({navigation}: Props) => {
  const [name, setName] = useState({value: '', error: ''});
  const [email, setEmail] = useState({value: '', error: ''});
  const [password, setPassword] = useState({value: '', error: ''});

  const [registerButton, setRegisterButton] = useState(true);

  const [getUsername, {loading, data}] = useLazyQuery<CheckUsernameResp>(
    CHECK_USERNAME
  );

  useEffect(() => {
    if (data) {
      if (data.playerByDisplayName === null) {
        auth()
          .createUserWithEmailAndPassword(email.value, password.value)
          .then((uc: FirebaseAuthTypes.UserCredential) => {
            console.log('User account created & signed in!');
            _saveUsername(name.value);
            const setLoggedIn = async () => {
              await AsyncStorage.setItem('logged.in', JSON.stringify(false));
              navigation.navigate('Dashboard');
              setRegisterButton(true);
            };
            setLoggedIn();
          })
          .catch((error) => {
            if (error.code === 'auth/email-already-in-use') {
              setEmail({
                ...email,
                error: 'That email address is already in use!',
              });
              console.log('That email address is already in use!');
            }

            if (error.code === 'auth/invalid-email') {
              setEmail({
                ...email,
                error: 'That email address is invalid!',
              });
              console.log('That email address is invalid!');
            }

            setRegisterButton(true);

            console.error(error);
          });
      } else if (data?.playerByDisplayName.displayName === name.value) {
        setName({...name, error: 'This username is already in use.'});
        setRegisterButton(true);
      } else {
        setName({...name, error: 'An unknown error occurred.'});
        setRegisterButton(true);
        console.log('An unknown error occurred.');
      }
    }
  }, [data]);

  if (loading) {
    console.log('Loading...');
  }

  const _onSignUpPressed = async () => {
    setRegisterButton(false);

    const nameError = nameValidator(name.value);
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (emailError || passwordError || nameError) {
      setName({...name, error: nameError});
      setEmail({...email, error: emailError});
      setPassword({...password, error: passwordError});
      setRegisterButton(true);
      return;
    }

    getUsername({variables: {displayName: name.value}});
  };

  const _saveUsername = async (user: string) => {
    try {
      await AsyncStorage.setItem('user.name', user);
    } catch (e) {
      console.log('Error:', e);
    }
  };

  return (
    <Background>
      <BackButton goBack={() => navigation.navigate('HomeScreen')} />

      <Logo />

      <Header>Create Account</Header>

      <TextInput
        label="Username"
        returnKeyType="next"
        value={name.value}
        onChangeText={(text) => setName({value: text, error: ''})}
        error={!!name.error}
        errorText={name.error}
      />

      <TextInput
        label="Email"
        returnKeyType="next"
        value={email.value}
        onChangeText={(text) => setEmail({value: text, error: ''})}
        error={!!email.error}
        errorText={email.error}
        autoCapitalize="none"
        autoCompleteType="email"
        textContentType="emailAddress"
        keyboardType="email-address"
      />

      <TextInput
        label="Password"
        returnKeyType="done"
        value={password.value}
        onChangeText={(text) => setPassword({value: text, error: ''})}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
      />

      <Button
        mode="contained"
        onPress={_onSignUpPressed}
        style={styles.button}
        disabled={!registerButton}>
        Sign Up
      </Button>

      {/*<Button*/}
      {/*  onPress={() =>*/}
      {/*    onGoogleButtonPress().then(() => {*/}
      {/*      console.log('Signed in with Google!');*/}
      {/*      navigation.navigate('Dashboard');*/}
      {/*    })*/}
      {/*  }>*/}
      {/*  Sign-up with Google*/}
      {/*</Button>*/}

      <View style={styles.row}>
        <Text style={styles.label}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.link}>Login</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
};

// async function onGoogleButtonPress() {
//   // Get the users ID token
//   const {idToken} = await GoogleSignin.signIn();
//
//   // Create a Google credential with the token
//   const googleCredential = auth.GoogleAuthProvider.credential(idToken);
//
//   // Sign-in the user with the credential
//   return auth().signInWithCredential(googleCredential);
// }

const styles = StyleSheet.create({
  label: {
    color: theme.colors.secondary,
  },
  button: {
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});

export default memo(RegisterScreen);
