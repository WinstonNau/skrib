import React, {memo, useEffect} from 'react';
import {Button, View} from 'react-native';
import {Navigation} from '../types';
import {gql, useMutation} from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let gameIdG: string;

interface LeaveGameResp {
  leaveGame: {
    clientMutationId: string;
  };
}

const LEAVE_GAME = gql`
  mutation LeaveGame($gameId: UUID!) {
    leaveGame(input: {gameId: $gameId}) {
      clientMutationId
    }
  }
`;

const MainScreen = ({navigation}: {navigation: Navigation}) => {
  const [leaveGame] = useMutation<LeaveGameResp>(LEAVE_GAME);

  useEffect(() => {
    const main = async () => {
      gameIdG = (await AsyncStorage.getItem('game.id')) as string;

      console.log('in gameOver');

      let mutationResult: any;
      try {
        mutationResult = await leaveGame({
          variables: {
            gameId: gameIdG,
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
  }, []);

  return (
    <View style={{flex: 1, justifyContent: 'flex-end', alignItems: 'center'}}>
      <Button
        title="Back to Main Menu"
        onPress={() => {
          navigation.navigate('Dashboard');
        }}
      />
    </View>
  );
};

export default memo(MainScreen);
