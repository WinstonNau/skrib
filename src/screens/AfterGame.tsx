import React, {memo, useEffect, useState} from 'react';
import {Button, FlatList, StyleSheet, Text, View} from 'react-native';
import {Navigation} from '../types';
import {gql, useMutation} from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let gameIdG: string;

interface GamePlayer {
  username: string;
  score: number;
}

interface GetScoresResp {
  getGame: {
    game: {
      gamePlayersByGameId: {
        nodes: {
          score: number;
          playerByPlayerId: {
            displayName: string;
          };
        }[];
      };
    };
  };
}

interface LeaveGameResp {
  leaveGame: {
    clientMutationId: string;
  };
}

const GET_SCORES = gql`
  mutation getPlayerScores($gameId: UUID!) {
    getGame(input: {gameId: $gameId}) {
      game {
        gamePlayersByGameId(orderBy: SCORE_DESC) {
          nodes {
            score
            playerByPlayerId {
              displayName
            }
          }
        }
      }
    }
  }
`;

const LEAVE_GAME = gql`
  mutation LeaveGame($gameId: UUID!) {
    leaveGame(input: {gameId: $gameId}) {
      clientMutationId
    }
  }
`;

const MainScreen = ({navigation}: {navigation: Navigation}) => {
  const [getScores] = useMutation<GetScoresResp>(GET_SCORES);
  const [leaveGame] = useMutation<LeaveGameResp>(LEAVE_GAME);

  const [playerScores, setPlayerScores] = useState([] as Array<GamePlayer>);

  const getPlayerScores = async () => {
    console.log('in PlayerGetScores');

    try {
      let mutationResult = await getScores({
        variables: {
          gameId: gameIdG,
        },
      });

      const {data, errors} = mutationResult;

      const nodes = data?.getGame.game.gamePlayersByGameId.nodes;

      setPlayerScores([] as Array<GamePlayer>);

      nodes?.forEach((p) => {
        setPlayerScores((pScores) =>
          pScores.concat([
            {username: p.playerByPlayerId.displayName, score: p.score},
          ])
        );
      });

      if (errors) {
        console.log('Bye bye:', errors);
      } else {
        console.log(data);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const playerLeavesGame = async () => {
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

  useEffect(() => {
    const main = async () => {
      gameIdG = (await AsyncStorage.getItem('game.id')) as string;
      await getPlayerScores();
      await playerLeavesGame();
    };
    main();
  }, []);

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <FlatList
        data={playerScores.map((u) => ({
          username: u.username,
          score: u.score,
        }))}
        renderItem={({item}) => (
          <Text style={styles.item}>
            {item.username} {item.score}
          </Text>
        )}
      />
      <Button
        title="Back to Main Menu"
        onPress={() => {
          navigation.navigate('Dashboard');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 15,
    fontSize: 18,
    height: 50,
  },
});

export default memo(MainScreen);
