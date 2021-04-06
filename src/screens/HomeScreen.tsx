import React, {memo} from 'react';
import Background from '../components/Background';
//import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import Paragraph from '../components/Paragraph';
import {Navigation} from '../types';
import auth from "@react-native-firebase/auth";

type Props = {
  navigation: Navigation;
};

let user: any;

    auth()
    .onAuthStateChanged(async (signedInUser) => {
        signedInUser ? (user = signedInUser) : (user = null);
        console.log('id token: ', await user?.getIdToken());
    });

const HomeScreen = ({navigation}: Props) => (
  <Background>
    <Header>Skrib</Header>

    <Paragraph>Login to play Skrib.</Paragraph>
    <Button mode="contained" onPress={
        () => {
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

export default memo(HomeScreen);
