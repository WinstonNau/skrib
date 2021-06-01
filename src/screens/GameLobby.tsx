import React, {memo, useEffect, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import {Navigation} from '../types';
import Modal from 'react-native-modal';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import {gql, useMutation} from '@apollo/client';
import {TextInput} from 'react-native-paper';
import socket from '../lib/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: Navigation;
};

//if totalCount >= 2, which means that the joined person isn't the first one: Disable Start and Settings Button
//if totalCount = 1, which means that the joined person is the first one in the lobby: Enable Start and Settings Button
//start with at least >3 people

let gameIdG: string;
let gameTotal: number;
let gamePlayers: any;
let playerIdG: string;
let playerUsernameG: string | null;

interface JoinGameResp {
  joinGame: {
    game: {
      id: string;
      roundNum: number;
      gamePlayersByGameId: {
        nodes: {
          playerByPlayerId: {
            displayName: string;
            id: string;
          };
        }[];
        totalCount: number;
      };
    };
  };
}

interface LeaveGameResp {
  leaveGame: {
    clientMutationId: string;
  };
}

interface ChangeGameStatusResp {
  changeGameStatus: {
    clientMutationId: string;
  };
}

interface UpdateRoundNumberResp {
  updateRoundNum: {
    clientMutationId: string;
  };
}

const JOIN_GAME = gql`
  mutation JoinGame {
    joinGame(input: {}) {
      game {
        id
        gamePlayersByGameId(orderBy: CREATED_AT_ASC) {
          nodes {
            playerByPlayerId {
              displayName
              id
            }
          }
          totalCount
        }
        roundNum
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

const CHANGE_GAME_STATUS = gql`
  mutation ChangeGameStatus($gameId: UUID!) {
    changeGameStatus(input: {gameId: $gameId}) {
      clientMutationId
    }
  }
`;

const UPDATE_ROUND_NUMBER = gql`
  mutation updateGameRoundNumber($gameId: UUID!, $rounds: Int!) {
    updateRoundNum(input: {gameId: $gameId, rounds: $rounds}) {
      clientMutationId
    }
  }
`;

const GameLobby = ({navigation}: Props) => {
  const [joinGame] = useMutation<JoinGameResp>(JOIN_GAME);
  const [leaveGame] = useMutation<LeaveGameResp>(LEAVE_GAME);
  const [changeGameStatus] = useMutation<ChangeGameStatusResp>(
    CHANGE_GAME_STATUS
  );
  const [updateRoundNumber] = useMutation<UpdateRoundNumberResp>(
    UPDATE_ROUND_NUMBER
  );

  const userLeavesGame = async () => {
    console.log('in userLeavesGame');

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

  const gameStatusChange = async () => {
    console.log('in changeGameStatus');

    let mutationResult: any;
    try {
      mutationResult = await changeGameStatus({
        variables: {
          gameId: gameIdG,
        },
      });
    } catch (err) {
      console.log('Error in changeGameStatus', err);
    }

    const {data, errors} = mutationResult;

    if (errors) {
      console.log('Bye bye: ' + errors);
    } else {
      console.log('data:', data);
    }
  };

  const updateGameRoundNumber = async (r: number) => {
    let mutationResult: any;
    try {
      mutationResult = await updateRoundNumber({
        variables: {gameId: gameIdG, rounds: r},
      });
    } catch (err) {
      console.log('Error in UpdateGameRoundNumber', err);
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
      try {
        const mutationResult = await joinGame();
        console.log('Joined successfully');

        const {data, errors} = mutationResult;
        if (data) {
          const {id, roundNum, gamePlayersByGameId} = data.joinGame.game;
          const {totalCount, nodes} = gamePlayersByGameId;

          if (totalCount === 1) {
            setSettingsEnabled(true);
            setStartButtonEnabled(true);
          }

          gameIdG = id;
          try {
            await AsyncStorage.setItem('game.id', gameIdG);
            await AsyncStorage.setItem('round.num', JSON.stringify(roundNum));
          } catch (e) {
            console.log('Error:', e);
          }
          //gameData = data;
          gameTotal = totalCount;
          gamePlayers = nodes;
          playerUsernameG = await AsyncStorage.getItem('user.name');
          nodes.forEach((u) => {
            setUsernames((users) =>
              users.concat(u.playerByPlayerId.displayName)
            );
          });

          console.log(
            'Game ID',
            gameIdG,
            'Total Players:',
            gameTotal,
            'Players:',
            JSON.stringify(gamePlayers),
            'Player ID:',
            playerIdG,
            'Player Username:',
            playerUsernameG
          );
        }

        if (errors) {
          console.log('Bye bye: ' + errors);
        } else {
          console.log('data:', JSON.stringify(data, undefined, 2));
          socket.emit('playerJoined', gameIdG, playerUsernameG);
        }
      } catch (err) {
        console.log('Error catched:::', err);
      }
    };
    main();
  }, [joinGame]);

  //change to false as default value after/while testing

  const [settingsEnabled, setSettingsEnabled] = useState(false);
  const [startButtonEnabled, setStartButtonEnabled] = useState(false);
  const [leaveGameButtonEnabled, setLeaveGameButtonEnabled] = useState(true);

  const [numberOfRounds, setNumberOfRounds] = useState('3');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isAlertVisible, setAlertVisible] = useState(false);

  const [users, setUsernames] = useState([] as Array<string>);

  socket.on('newPlayer', (game, playerUsername) => {
    if (gameIdG === game) {
      //Adds the username to the list
      setUsernames(users.concat(playerUsername));
    }
  });

  socket.on('playerDisconnect', (game, playerUsername) => {
    if (gameIdG === game) {
      //Deletes the username from the list
      setUsernames(users.filter((u) => u !== playerUsername));
    }
  });

  socket.on('roundNumberUpdated', (gameId, roundNum) => {
    const main = async () => {
      if (gameIdG === gameId) {
        console.log('received new round number:', roundNum);
        await AsyncStorage.setItem('round.num', JSON.stringify(roundNum));
      }
    };
    main();
  });

  socket.on('gameStarted', (gameId) => {
    const main = async () => {
      if (gameIdG === gameId) {
        await AsyncStorage.setItem('players', JSON.stringify(users));
        navigation.navigate('Game');
      }
    };
    main();
  });

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const toggleAlert = () => {
    setAlertVisible(!isAlertVisible);
  };

  return (
    <Background>
      <BackButton goBack={toggleAlert} />

      <View style={styles.waitingText}>
        <Header>Waiting for players</Header>
      </View>
      <Modal
        isVisible={isModalVisible}
        backdropColor="#B4B3DB"
        backdropOpacity={0.8}
        animationIn="zoomInDown"
        animationOut="zoomOutUp"
        animationInTiming={600}
        animationOutTiming={600}
        backdropTransitionInTiming={600}
        backdropTransitionOutTiming={600}>
        <View style={styles.content}>
          <Text style={styles.contentTitle}>Settings</Text>
          <TextInput
            mode={'outlined'}
            style={styles.input}
            onChangeText={(val) => {
              setNumberOfRounds(val);
            }}
            keyboardType={'numeric'}
            value={numberOfRounds}
            placeholder={'Number of rounds'}
          />
          <Button
            testID={'close-button'}
            onPress={() => {
              if (/^\d+$/.test(numberOfRounds)) {
                const main = async () => {
                  await updateGameRoundNumber(parseInt(numberOfRounds, 10));
                  await AsyncStorage.setItem(
                    'round.num',
                    JSON.stringify(parseInt(numberOfRounds, 10))
                  );
                  socket.emit('newRoundNumber', gameIdG, numberOfRounds);
                };
                main();
              }
              toggleModal();
            }}>
            Apply
          </Button>
        </View>
      </Modal>
      <Modal
        isVisible={isAlertVisible}
        backdropColor="#B4B3DB"
        backdropOpacity={0.8}
        animationIn="zoomInDown"
        animationOut="zoomOutUp"
        animationInTiming={600}
        animationOutTiming={600}
        backdropTransitionInTiming={600}
        backdropTransitionOutTiming={600}>
        <View style={styles.content}>
          <Text style={styles.contentTitle}>Are you sure?</Text>
          <View style={styles.rowView}>
            <Button
              disabled={!leaveGameButtonEnabled}
              style={{flex: 1}}
              //disconnect the user from the Game
              onPress={async () => {
                setLeaveGameButtonEnabled(false);
                socket.emit('playerLeave', gameIdG, playerUsernameG);
                await userLeavesGame();
                toggleAlert();
                navigation.navigate('Dashboard');
              }}>
              Back
            </Button>
            <Button style={{flex: 1}} onPress={toggleAlert}>
              Close
            </Button>
          </View>
        </View>
      </Modal>
      <FlatList
        data={users.map((u) => ({key: u}))}
        renderItem={({item}) => <Text style={styles.item}>{item.key}</Text>}
      />
      <View style={styles.rowView}>
        <Button
          disabled={!startButtonEnabled}
          style={{bottom: 20, width: '50%'}}
          onPress={async () => {
            setStartButtonEnabled(false);
            console.log(users);
            await gameStatusChange();
            await AsyncStorage.setItem('players', JSON.stringify(users));
            socket.emit('startGame', gameIdG);
            navigation.navigate('Game');
          }}>
          START
        </Button>
        <Button
          style={{bottom: 20, width: '50%'}}
          disabled={!settingsEnabled}
          onPress={toggleModal}>
          Settings
        </Button>
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  waitingText: {top: 10 + getStatusBarHeight(), flex: 1},
  startButton: {bottom: 20},
  settingsTO: {
    flex: 1,
  },
  item: {
    padding: 20,
    fontSize: 18,
    height: 50,
  },
  rowView: {flexDirection: 'row', justifyContent: 'flex-end'},
  content: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    // alignItems: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  contentTitle: {
    fontSize: 30,
    marginBottom: 12,
  },
  input: {
    height: 40,
    margin: 12,
  },
});

export default memo(GameLobby);
