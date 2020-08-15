import React, {useRef, useEffect, memo} from 'react';
import {Animated, StyleSheet, Button} from 'react-native';

import {Navigation} from '../types';

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
    justifyContent: 'center',
  },
});

const MainScreen = ({navigation}: {navigation: Navigation}) => (
  <FadeInView style={styles.playbuttonview}>
    <Button title="Play now!" onPress={() => navigation.navigate('Game')} />
  </FadeInView>
);

export default memo(MainScreen);
