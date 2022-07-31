import React, {memo, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {Navigation} from '../types';
import Background from '../components/Background';
import {gql, useMutation} from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {GoogleSignin} from '@react-native-community/google-signin';
import TextInputOutlined from 'react-native-paper/lib/typescript/components/TextInput/TextInputOutlined';

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

interface GetUsernameResp {
  currentPlayer: {
    player: {
      displayName: string;
    };
  };
}

const REGISTER_USER = gql`
  mutation RegisterPlayer($displayName: String!) {
    registerPlayer(input: {displayName: $displayName}) {
      player {
        createdAt
      }
    }
  }
`;

const GET_USERNAME = gql`
  mutation GetUsername {
    currentPlayer(input: {}) {
      player {
        displayName
      }
    }
  }
`;

const Tab = createBottomTabNavigator();

const MainScreen = ({navigation}: {navigation: Navigation}) => {
  const [registerUser] = useMutation<RegisterUserResp>(REGISTER_USER);
  const [getUsername] = useMutation<GetUsernameResp>(GET_USERNAME);

  const [playButton, setPlayButton] = useState(false);
  const [anonymousLogin, setAnonymousLogin] = useState(false);
  const [textUsername, setTextUsername] = useState('');

  useEffect(() => {
    const main = async () => {
      await setAnonymousLogin(
        await JSON.parse(
          (await AsyncStorage.getItem('anonymous.login')) as string
        )
      );

      console.log(anonymousLogin);

      if (anonymousLogin) {
        return;
      } else if (
        !JSON.parse(
          (await AsyncStorage.getItem('logged.in')) as string
        ) as boolean
      ) {
        let name = await AsyncStorage.getItem('user.name');
        console.log(name);

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

        await AsyncStorage.setItem('logged.in', JSON.stringify(true));
      } else {
        try {
          let mutationResult = await getUsername();

          const {data, errors} = mutationResult;

          if (errors) {
            console.log('Bye bye');
          } else {
            console.log(data);
            await AsyncStorage.setItem(
              'user.name',
              data?.currentPlayer.player.displayName as string
            );
          }
        } catch (e) {
          console.log(e);
        }
      }
    };
    main();
  }, [registerUser]);

  const signOut = async () => {
    await AsyncStorage.setItem('logged.in', JSON.stringify(false));
    await auth().signOut();
    navigation.navigate('HomeScreen');
  };

  function HomeScreen() {
    if (anonymousLogin) {
      return (
        <Background>
          <View style={styles.titleview}>
            <Text style={styles.titlestyle}>Skrib</Text>
          </View>
          <FadeInView style={styles.playbuttonview}>
            <TextInput
              style={styles.input}
              onChangeText={(text) => {
                setTextUsername(text);
              }}
              placeholder={'Username'}
              value={textUsername}
            />
            <Button title={'Log out'} onPress={signOut} />
            <Button
              title="Play now!"
              disabled={!playButton}
              onPress={() => navigation.navigate('GameLobby')}
            />
          </FadeInView>
        </Background>
      );
    } else {
      return (
        <Background>
          <View style={styles.titleview}>
            <Text style={styles.titlestyle}>Skrib</Text>
          </View>
          <FadeInView style={styles.playbuttonview}>
            <Button title={'Log out'} onPress={signOut} />
            <Button
              title="Play now!"
              disabled={!playButton}
              onPress={() => navigation.navigate('GameLobby')}
            />
          </FadeInView>
        </Background>
      );
    }
  }

  function ProfileScreen() {
    return (
      <View>
        <Text>Hello World</Text>
      </View>
    );
  }

  function AchievementScreen() {
    return (
      <View>
        <Text>Hello World</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName={'Home'}
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, color, size}) => {
            let iconName = '';

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Achievements') {
              iconName = focused ? 'trophy' : 'trophy-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person-circle' : 'person-circle-outline';
            }

            // You can return any component that you like here!
            return <Icon name={iconName} color={color} size={size} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: 'blue',
          inactiveTintColor: 'gray',
        }}>
        <Tab.Screen name="Achievements" component={AchievementScreen} />
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
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
  input: {
    height: 40,
    margin: 12,
  },
});

export default memo(MainScreen);
