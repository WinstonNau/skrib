import React, {useRef, Component} from 'react';
import {Animated, StyleSheet, Button, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

interface Main {
  props: any;
  navigation: any;
}

function MainScreen({navigation}: Main) {
  return (
    <FadeInView style={styles.playbuttonview}>
      <Button title="Play now!" onPress={() => navigation.navigate('Game')} />
    </FadeInView>
  );
}

function GameScreen({}: Main) {
  return <View />;
}

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

const styles = StyleSheet.create({
  playbuttonview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Skrib">
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
