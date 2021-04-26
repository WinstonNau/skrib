import React, {memo, useEffect, useRef} from 'react';
import {Animated, Button, StyleSheet, Text, View} from 'react-native';

import {Navigation} from '../types';
import Background from '../components/Background';
import {gql, useMutation} from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FadeInView = (props: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View // Special animatable View
      style={{
        ...props.style,
        opacity: fadeAnim, // Bind opacity to animated value
      }}>
      {props.children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  playbuttonview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titlestyle: {
    borderTopWidth: 50,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontSize: 50,
    fontStyle: 'normal',
    color: '#9400d3',
  },
});

type Props = {
  navigation: Navigation;
};

interface RegisterUserResp {
  registerPlayer: {
    player: {
      createdAt: string;
    };
  };
}

const MainScreen = ({navigation}: {navigation: Navigation}) => {
  const REGISTER_USER = gql`
    mutation RegisterPlayer($displayName: String!) {
      registerPlayer(input: {displayName: $displayName}) {
        player {
          createdAt
        }
      }
    }
  `;

  const [registerUser] = useMutation<RegisterUserResp>(REGISTER_USER);
  useEffect(() => {
    const main = async () => {
      console.log('In onFinish');

      console.log(await AsyncStorage.getItem('user.name'));

      let name = await AsyncStorage.getItem('user.name');

      let mutationResult: any;
      try {
        mutationResult = await registerUser({
          variables: {
            displayName: name,
          },
        });
      } catch (err) {
        console.log(err);
      }

      const {data, errors} = mutationResult;

      if (errors) {
        console.log('Bye bye: ' + errors);
      } else {
        console.log('data:', data);
      }
    };
    main();
  }, [registerUser]);
  return (
    <Background>
      <View style={styles.titleview}>
        <Text style={styles.titlestyle}>Skrib</Text>
      </View>
      <FadeInView style={styles.playbuttonview}>
        <Button
          title="Play now!"
          onPress={() => navigation.navigate('GameLobby')}
        />
      </FadeInView>
    </Background>
  );
};

export default memo(MainScreen);
