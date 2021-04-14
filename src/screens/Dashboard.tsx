import React, {useRef, useEffect, memo} from 'react';
import {Animated, StyleSheet, Button, View, Text} from 'react-native';

import {Navigation} from '../types';
import Background from '../components/Background';

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

const MainScreen = ({navigation}: {navigation: Navigation}) => {
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
