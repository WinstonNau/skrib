import React, {useRef} from 'react';
import {
  Animated,
  StyleSheet,
  View,
  AppRegistry,
  Text,
  Button,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import RNSketchCanvas from '@terrylinla/react-native-sketch-canvas';
//import auth from '@react-native-firebase/auth';
import {Provider} from 'react-native-paper';
import App from './src';
import {theme} from './src/core/theme';
//import {LoginScreen} from './src/screens';

interface Main {
  props: any;
  navigation: any;
}

const Drawing = () => (
  <View style={styles.container}>
    <View style={{flex: 1, flexDirection: 'row'}}>
      <RNSketchCanvas
        containerStyle={{backgroundColor: 'transparent', flex: 1}}
        canvasStyle={{backgroundColor: 'transparent', flex: 1}}
        defaultStrokeIndex={0}
        defaultStrokeWidth={5}
        closeComponent={
          <View style={styles.functionButton}>
            <Text style={styles.white}>Close</Text>
          </View>
        }
        undoComponent={
          <View style={styles.functionButton}>
            <Text style={styles.white}>Undo</Text>
          </View>
        }
        clearComponent={
          <View style={styles.functionButton}>
            <Text style={styles.white}>Clear</Text>
          </View>
        }
        eraseComponent={
          <View style={styles.functionButton}>
            <Text style={styles.white}>Eraser</Text>
          </View>
        }
        strokeComponent={(color) => (
          <View style={[{backgroundColor: color}, styles.strokeColorButton]} />
        )}
        strokeSelectedComponent={(color) => {
          return (
            <View
              style={[
                {backgroundColor: color, borderWidth: 2},
                styles.strokeColorButton,
              ]}
            />
          );
        }}
        strokeWidthComponent={(w) => {
          return (
            <View style={styles.strokeWidthButton}>
              <View style={style(w).default} />
            </View>
          );
        }}
        saveComponent={
          <View style={styles.functionButton}>
            <Text style={styles.white}>Save</Text>
          </View>
        }
        savePreference={() => {
          return {
            folder: 'RNSketchCanvas',
            filename: String(Math.ceil(Math.random() * 100000000)),
            transparent: false,
            imageType: 'png',
          };
        }}
      />
    </View>
  </View>
);

const style = (w: number) =>
  StyleSheet.create({
    default: {
      backgroundColor: 'white',
      marginHorizontal: 2.5,
      width: Math.sqrt(w / 3) * 10,
      height: Math.sqrt(w / 3) * 10,
      borderRadius: (Math.sqrt(w / 3) * 10) / 2,
    },
  });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  strokeColorButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  strokeWidthButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#39579A',
  },
  functionButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    height: 30,
    width: 60,
    backgroundColor: '#39579A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  playbuttonview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  white: {
    color: 'white',
  },
});

AppRegistry.registerComponent('Drawing', () => Drawing);

function LoginS({navigation}: Main) {
  return (
    <Provider theme={theme}>
      <App />
    </Provider>
  );
}

function MainScreen({navigation}: Main) {
  return (
    <FadeInView style={styles.playbuttonview}>
      <Button title="Play now!" onPress={() => navigation.navigate('Game')} />
    </FadeInView>
  );
}

const GameScreen = () => <Drawing />;

const FadeInView = (props: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  React.useEffect(() => {
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

const Stack = createStackNavigator();

function Navigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">
        <Stack.Screen name="Login" component={LoginS} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigator;
