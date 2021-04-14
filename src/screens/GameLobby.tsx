import React, {memo, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {io} from 'socket.io-client';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import {Navigation} from '../types';
import Modal from 'react-native-modal';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import {gql, useMutation} from '@apollo/client';
import {TextInput} from 'react-native-paper';

const socket = io('https://skrib-socket.herokuapp.com');

//TODO: Notification from socket.io to update the GameLobby, when a new player joins

type Props = {
  navigation: Navigation;
};

//if totalCount >= 2, which means that the joined person isn't the first one: Disable Start and Settings Button
//if totalCount = 1, which means that the joined person is the first one in the lobby: Enable Start and Settings Button
//start with at least >3 people

const GameLobby = ({navigation}: Props) => {
  const JOIN_GAME = gql`
    mutation MyMutation {
      joinGame(input: {}) {
        game {
          gamePlayersByGameId {
            totalCount
            nodes {
              playerByPlayerId {
                displayName
              }
              gameId
            }
          }
        }
      }
    }
  `;

  let gameData: any;

  socket.on('newPlayer', (gameId) => {
    if (gameData.joinGame.game.gamePlayersByGameId.nodes.gameId === gameId) {
    }
  });

  const onFinish = async () => {
    let mutationResult: any;
    try {
      mutationResult = await registerUser({});
    } catch (err) {
      console.log(err);
    }

    const {data, errors} = mutationResult;
    gameData = data;

    if (errors) {
      console.log('Bye bye: ' + errors);
    } else {
      console.log('data:', data);
    }
  };

  console.log('Test GameLobby');

  //change to false as default value after/while testing

  const [settingsEnabled, setSettingsEnabled] = useState(true);
  const [startButtonEnabled, setStartButtonEnabled] = useState(true);

  const [numberOfRounds, setNumberOfRounds] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isAlertVisible, setAlertVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const toggleAlert = () => {
    setAlertVisible(!isAlertVisible);
  };

  const [registerUser] = useMutation(JOIN_GAME);

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
              testID={'back-button'}
              style={{flex: 1}}
              //disconnect the user from the Game
              onPress={() => {
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
      <View style={styles.rowView}>
        <Button
          disabled={!startButtonEnabled}
          style={{bottom: 20, width: '50%'}}
          onPress={() => navigation.navigate('Game')}>
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
