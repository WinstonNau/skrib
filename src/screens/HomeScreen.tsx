import React, {memo, useEffect} from 'react';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import Paragraph from '../components/Paragraph';
import {Navigation} from '../types';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: Navigation;
};

const HomeScreen = ({navigation}: Props) => {
  const user = auth().currentUser;
  return (
    <Background>
      <Header>Skrib</Header>

      <Button
        mode="outlined"
        onPress={() => {
          auth()
            .signInAnonymously()
            .then(() => {
              const main = async () => {
                await AsyncStorage.setItem(
                  'anonymous.login',
                  JSON.stringify(true)
                );
                navigation.navigate('Dashboard');
              };
              main();
            });
        }}>
        Play
      </Button>
      <Paragraph>Login to play Skrib.</Paragraph>
      <Button
        mode="contained"
        onPress={() => {
          if (user) {
            navigation.navigate('Dashboard');
          } else {
            navigation.navigate('LoginScreen');
          }
        }}>
        Login
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('RegisterScreen')}>
        Sign Up
      </Button>
    </Background>
  );
};

export default memo(HomeScreen);
