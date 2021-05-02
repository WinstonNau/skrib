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

//let gameData: JoinGameResp;
let gameIdG: string;
let gameTotal: number;
let gamePlayers: any;
let playerIdG: any;
let playerUsernameG: string | null;

interface JoinGameResp {
  joinGame: {
    game: {
      id: string;
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

interface GetUsernameResp {
  playerById: {
    displayName: string;
  };
}

interface LeaveGameResp {
  leaveGame: {
    clientMutationId: string;
  };
}

// interface GetPlayerIdResp {
//   currentPlayer: {
//     player: {
//       id: string;
//     };
//   };
// }

interface User {
  userId: string;
  username: string;
}

const JOIN_GAME = gql`
  mutation JoinGame {
    joinGame(input: {}) {
      game {
        id
        gamePlayersByGameId {
          nodes {
            playerByPlayerId {
              displayName
              id
            }
          }
          totalCount
        }
      }
    }
  }
`;

// const GET_PLAYER_ID = gql`
//   mutation GetPlayerId {
//     currentPlayer(input: {}) {
//       player {
//         id
//       }
//     }
//   }
// `;

// const GetPlayerId = async () => {
//   const [getPlayerId] = useMutation<GetPlayerIdResp>(GET_PLAYER_ID);
//   console.log('in GetPlayerId');
//
//   try {
//     let mutationResult = await getPlayerId();
//     const {data, errors} = mutationResult;
//
//     if (errors) {
//       console.log('mutationResult error in GetPlayerId');
//     } else {
//       console.log('PlayerIdG =', (playerIdG = data?.currentPlayer.player.id));
//     }
//   } catch (e) {
//     console.log('GetPlayerId error:', e);
//   }
// };

// const useGetUsernameById = (playerId: any) => {
//   const GET_USERNAME = gql`
//     query GetUsernameById($id: UUID!) {
//       playerById(id: $id) {
//         displayName
//       }
//     }
//   `;
//
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const {loading, error, data} = useQuery<GetUsernameResp>(GET_USERNAME, {
//     variables: {
//       id: playerId,
//     },
//   });
//
//   if (error) {
//     console.log(error);
//   } else {
//     return data?.playerById.displayName;
//   }
// };

const LEAVE_GAME = gql`
  mutation LeaveGame($gameId: UUID!) {
    leaveGame(input: {gameId: $gameId}) {
      clientMutationId
    }
  }
`;

const GameLobby = ({navigation}: Props) => {
  const [joinGame] = useMutation<JoinGameResp>(JOIN_GAME);
  const [leaveGame] = useMutation<LeaveGameResp>(LEAVE_GAME);

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

  useEffect(() => {
    const main = async () => {
      console.log('in onFinish');

      try {
        const mutationResult = await joinGame();
        console.log('Joined successfully');

        const {data, errors} = mutationResult;
        if (data) {
          const {id, gamePlayersByGameId} = data.joinGame.game;
          const {totalCount, nodes} = gamePlayersByGameId;

          if (totalCount === 1) {
            setSettingsEnabled(true);
            setStartButtonEnabled(true);
          }

          gameIdG = id;
          //gameData = data;
          gameTotal = totalCount;
          gamePlayers = nodes;
          playerUsernameG = await AsyncStorage.getItem('user.name');
          nodes.forEach((u) => {
            console.log(
              'in nodes.forEach:',
              u.playerByPlayerId.id,
              u.playerByPlayerId.displayName
            );
            setUsernames(
              users.concat([
                {
                  userId: u.playerByPlayerId.id,
                  username: u.playerByPlayerId.displayName,
                },
              ])
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
          socket.emit('playerJoined', gameIdG, playerIdG, playerUsernameG);
        }
      } catch (err) {
        console.log('Error catched:::', err);
      }
    };
    main();
    // return () => {
    //   //calls leaveGameMutation
    //   userLeavesGame();
    // };
  }, [joinGame]);

  //change to false as default value after/while testing

  const [settingsEnabled, setSettingsEnabled] = useState(false);
  const [startButtonEnabled, setStartButtonEnabled] = useState(false);

  const [numberOfRounds, setNumberOfRounds] = useState('3');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isAlertVisible, setAlertVisible] = useState(false);

  const [users, setUsernames] = useState([
    {userId: '69dc043d-b227-4199-b443-113e8a3756cc', username: 'FirstNameTest'},
  ] as Array<User>);

  socket.on(
    'newPlayer',
    (game: string, playerId: string, playerUsername: string) => {
      if (gameIdG === game) {
        //Adds the username to the list
        setUsernames(
          users.concat([
            {
              userId: playerId,
              username: playerUsername,
            },
          ])
        );
      }
    }
  );
  socket.on('playerDisconnect', (game, playerId) => {
    if (gameIdG === game) {
      //Deletes the username from the list
      setUsernames(users.filter((u) => u.userId !== playerId));
    }
  });

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const toggleAlert = () => {
    setAlertVisible(!isAlertVisible);
  };

  // if (gameTotal === 1) {
  //   setSettingsEnabled(true);
  //   setStartButtonEnabled(true);
  // }

  return (
    <Background>
      <BackButton goBack={toggleAlert} />

      <View style={styles.waitingText}>
        <Header>Waiting for players</Header>
      </View>
      <Modal
        testID={'modalSettings'}
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
          <Button testID={'close-button'} onPress={toggleModal}>
            Apply
          </Button>
        </View>
      </Modal>
      <Modal
        testID={'modalAlert'}
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
              style={{flex: 1}}
              //disconnect the user from the Game
              onPress={() => {
                toggleAlert();
                socket.emit('playerLeave', gameIdG, playerIdG);
                userLeavesGame();
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
        data={users.map((u) => ({key: u.username}))}
        renderItem={({item}) => <Text style={styles.item}>{item.key}</Text>}
      />
      <View style={styles.rowView}>
        <Button
          disabled={!startButtonEnabled}
          style={{bottom: 20, width: '50%'}}
          onPress={() => {
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
