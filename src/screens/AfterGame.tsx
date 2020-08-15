import React, {memo} from 'react';
import {Button, View} from 'react-native';
import {Navigation} from '../types';

const MainScreen = ({navigation}: {navigation: Navigation}) => (
  <View>
    <Button title="Test" onPress={() => navigation.navigate('Dashboard')} />
  </View>
);

export default memo(MainScreen);
