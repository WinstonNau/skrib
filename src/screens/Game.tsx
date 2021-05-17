import React, {Component, memo, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNSketchCanvas from '@terrylinla/react-native-sketch-canvas';
import socket from '../lib/socket';
import Button from '../components/Button';
import Modal from 'react-native-modal';
import {CountdownCircleTimer} from 'react-native-countdown-circle-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FlashMessage, {showMessage} from 'react-native-flash-message';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-community/voice';

let gameIdG: string;
let playerUsernameG: string;
let chosenWord: string;
let playersG: Array<string>;

type Props = {};
type State = {
  recognized: string;
  pitch: string;
  error: string;
  end: string;
  started: string;
  results: string[];
  partialResults: string[];
};

//TODO: Create query to get all gamePlayers from gameId
interface GamePlayer {
  username: string;
  score: string;
}

class VoiceGuess extends Component<Props, State> {
  state = {
    recognized: '',
    pitch: '',
    error: '',
    end: '',
    started: '',
    results: [],
    partialResults: [],
    resultWord: '',
    stop: false,
  };

  constructor(props: Props) {
    super(props);
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;
  }

  componentWillUnmount() {
    Voice.destroy().then(Voice.removeAllListeners);
  }

  onSpeechStart = (e: any) => {
    console.log('onSpeechStart: ', e);
    this.state.stop = false;
    this.setState({
      started: '√',
    });
  };

  // onSpeechRecognized = (e: SpeechRecognizedEvent) => {
  //   console.log('onSpeechRecognized: ', e);
  //   this.setState({
  //     recognized: '√',
  //   });
  // };

  onSpeechEnd = (e: any) => {
    console.log('onSpeechEnd: ', e);
    this.setState({
      end: '√',
    });
  };

  onSpeechError = (e: SpeechErrorEvent) => {
    console.log('onSpeechError: ', e);
    this.setState({
      error: JSON.stringify(e.error),
    });
  };

  onSpeechResults = (e: SpeechResultsEvent) => {
    //@ts-ignore
    let w = e.value[0];
    if (this.state.stop) {
      if (w === chosenWord) {
        console.log('correct guess');
        showMessage({
          message: w,
          type: 'success',
        });
        socket.emit('correctGuess', gameIdG, playerUsernameG);
        //TODO: Also call a mutation, which increases the score of the gamePlayer by s
      } else {
        console.log('wrong guess');
        showMessage({
          message: w,
          type: 'danger',
        });
        socket.emit('wrongGuess', gameIdG, playerUsernameG, w);
      }
      //@ts-ignore
      console.log('onSpeechResults: ', e.value[0]);
      this.setState({
        results: e.value || [],
      });
    }
  };

  onSpeechPartialResults = (e: SpeechResultsEvent) => {
    console.log('onSpeechPartialResults: ', e);
    this.setState({
      partialResults: e.value || [],
    });
  };

  // onSpeechVolumeChanged = (e: any) => {
  //   console.log('onSpeechVolumeChanged: ', e);
  //   this.setState({
  //     pitch: e.value,
  //   });
  // };

  _startRecognizing = async () => {
    this.setState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
    });

    try {
      await Voice.start('de-DE');
    } catch (e) {
      console.error(e);
    }
  };

  _stopRecognizing = async () => {
    try {
      await Voice.stop();

      this.state.stop = true;
    } catch (e) {
      console.error(e);
    }
  };

  render() {
    return (
      <View style={styles.containerTwo}>
        <TouchableOpacity
          onPressIn={this._startRecognizing}
          onPressOut={this._stopRecognizing}>
          <Image
            style={styles.button}
            source={require('../assets/button.png')}
          />
        </TouchableOpacity>
      </View>
    );
  }
}

const Drawing = () => {
  let canvas: RNSketchCanvas | null = null;

  const [isWordModalVisible, setWordModalVisibility] = useState(false);
  const [isWaitingModalVisible, setWaitingModalVisibility] = useState(false);
  const [isRoundOverModalVisible, setRoundOverModalVisibility] = useState(
    false
  );

  //TODO: Create a database of words to draw
  const [choiceOneWord, setChoiceOneWord] = useState('Test eins');
  const [choiceTwoWord, setChoiceTwoWord] = useState('Test zwei');
  const [choiceThreeWord, setChoiceThreeWord] = useState('Test drei');

  const [timer, setTimer] = useState(0);

  const [isDrawer, setDrawer] = useState(false);

  const toggleChooseWordModal = () => {
    setWordModalVisibility(!isWordModalVisible);
  };

  useEffect(() => {
    const main = async () => {
      //"as string" should maybe be removed
      playerUsernameG = (await AsyncStorage.getItem('user.name')) as string;
      gameIdG = (await AsyncStorage.getItem('game.id')) as string;
      playersG = JSON.parse(
        (await AsyncStorage.getItem('players')) as string
      ) as Array<string>;
      console.log('in useEffect w/o');
      console.log(playerUsernameG);
      console.log(gameIdG);
      console.log(playersG);
      if (playerUsernameG === playersG[0]) {
        setDrawer(true);
        setWordModalVisibility(true);
      } else {
        setWaitingModalVisibility(true);
      }
    };
    main();
  }, []);

  const [firstTime, setFirstTime] = useState(true);
  useEffect(() => {
    if (firstTime) {
      setFirstTime(false);
      return;
    }

    if (timer === 0) {
      console.log('in timer 0');
      if (isDrawer) {
        console.log('in timer 0 is Drawer');
        const i = playersG.findIndex(
          (username) => username === playerUsernameG
        );

        if (i < 0) {
          console.error('Something went wrong');
        }

        socket.emit(
          'roundOver',
          gameIdG,
          playersG[i < playersG.length - 1 ? i + 1 : 0]
        );
      }
      setRoundOverModalVisibility(true);
      setTimeout(() => {
        setRoundOverModalVisibility(false);
        setDrawer(false);
        if (isDrawer) {
          setWordModalVisibility(true);
        } else {
          setWaitingModalVisibility(true);
        }
      }, 5000);
      return;
    } else if (timer === 8) {
      console.log('in timer 8');
      showMessage({
        message:
          "The word's first two letters are: " +
          chosenWord.split('')[0] +
          chosenWord.split('')[1] +
          '_'.repeat(chosenWord.length - 2),
        type: 'info',
      });
    } else if (timer === 15) {
      console.log('in timer 15');
      showMessage({
        message:
          "The word's first letter is: " +
          chosenWord.split('')[0] +
          '_'.repeat(chosenWord.length - 1),
        type: 'info',
      });
    } else if (timer === 23) {
      console.log('in timer 23');
      showMessage({
        message: 'The word has ' + chosenWord.length + ' letters.',
        type: 'info',
      });
    }

    // save intervalId to clear the interval when the
    // component re-renders
    const intervalId = setInterval(() => {
      setTimer(timer - 1);
    }, 1000);

    // clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId);
    // add timeLeft as a dependency to re-rerun the effect
    // when we update it
  }, [timer]);

  socket.on('newPath', (gameId: string, path: any) => {
    if (gameIdG === gameId) {
      //draw the path
      canvas?.addPath(path);
      console.log('Received (' + socket.id + '):', path);
    }
  });

  socket.on('clear', (gameId: string) => {
    if (gameIdG === gameId) {
      //clear the canvas
      canvas?.clear();
      console.log('Clear successful');
    }
  });

  socket.on('undo', (gameId: string) => {
    if (gameIdG === gameId) {
      //undo the last drawn path
      canvas?.undo();
      console.log('Undo successful');
    }
  });

  socket.on('wordSelected', (gameId: string, word: string) => {
    console.log('wordSelected received: ' + gameId, word);
    if (gameIdG === gameId) {
      chosenWord = word;
      console.log(word);
      setWaitingModalVisibility(false);
      setTimer(25);
    }
  });

  socket.on('playerGuessedWrong', (gameId, user, guess) => {
    console.log('playerGuessedWrong received');
    if (gameIdG === gameId) {
      showMessage({
        message: user + ': ' + guess,
        type: 'default',
      });
    }
  });

  socket.on('playerGuessedCorrect', (gameId, playerUsername, guess) => {
    const main = async () => {
      if (gameIdG === gameId) {
        showMessage({
          message: playerUsername + ' guessed the correct word: ' + guess,
          type: 'warning',
        });
        console.log('in PlayerGuessedCorrect');
        if (isDrawer) {
          console.log('in PlayerGuessedCorrect isDrawer');
          setFirstTime(true);
          setTimer(0);
          const i = playersG.findIndex(
            (username) => username === playerUsernameG
          );

          if (i < 0) {
            console.error('Something went wrong');
          }

          socket.emit(
            'roundOver',
            gameIdG,
            playersG[i < playersG.length - 1 ? i + 1 : 0]
          );
          setRoundOverModalVisibility(true);
          setTimeout(() => {
            console.log('in PlayerGuessedCorrect in Drawer set Timeout');
            setDrawer(false);
            setRoundOverModalVisibility(false);
            setWaitingModalVisibility(true);
          }, 5000);
        }
      }
    };
    main();
  });

  socket.on('roundFinished', (gameId, nextPlayer) => {
    console.log('in roundFinished, nextPlayer: ', nextPlayer);
    if (gameIdG === gameId) {
      setFirstTime(true);
      setRoundOverModalVisibility(true);
      setTimeout(() => {
        console.log('in roundFinished setTimeout', playerUsernameG, nextPlayer);
        if (nextPlayer === playerUsernameG) {
          console.log('nextPlayer is drawer');
          setDrawer(true);
          setRoundOverModalVisibility(false);
          console.log(isWordModalVisible);
          if (!isWordModalVisible) {
            setWordModalVisibility(true);
          }
        } else {
          console.log('nextPlayer is not drawer');
          setDrawer(false);
          setRoundOverModalVisibility(false);
          if (!isWaitingModalVisible) {
            setWaitingModalVisibility(true);
          }
        }
      }, 5000);
    }
  });

  if (isDrawer) {
    return (
      <SafeAreaView style={styles.container}>
        <FlashMessage position="top" />
        <View style={{flex: 1, flexDirection: 'row'}}>
          <Modal
            isVisible={isWordModalVisible}
            backdropColor="#B4B3DB"
            backdropOpacity={0.8}
            animationIn="zoomInDown"
            animationOut="zoomOutUp"
            animationInTiming={600}
            animationOutTiming={600}
            backdropTransitionInTiming={600}
            backdropTransitionOutTiming={600}>
            <View style={styles.content}>
              <Text style={styles.contentTitle}>Choose a word:</Text>
              <CountdownCircleTimer
                isPlaying
                duration={15}
                colors={[
                  ['#004777', 0.4],
                  ['#F7B801', 0.4],
                  ['#A30000', 0.2],
                ]}
                onComplete={() => {
                  if (isWordModalVisible) {
                    let word = '';
                    switch (Math.floor(Math.random() * 3)) {
                      case 0:
                        word = choiceOneWord;
                        break;
                      case 1:
                        word = choiceTwoWord;
                        break;
                      case 2:
                        word = choiceThreeWord;
                        break;
                    }
                    console.log(word);
                    chosenWord = word;
                    setTimer(25);
                    socket.emit('selectWord', gameIdG, word);
                    setWordModalVisibility(false);
                  }
                }}>
                {({remainingTime, animatedColor}) => (
                  <Animated.Text style={{color: animatedColor}}>
                    {remainingTime}
                  </Animated.Text>
                )}
              </CountdownCircleTimer>
              <Button
                testID={'choice-one-button'}
                onPress={() => {
                  chosenWord = choiceOneWord;
                  socket.emit('selectWord', gameIdG, choiceOneWord);
                  toggleChooseWordModal();
                  setTimer(25);
                }}>
                {choiceOneWord}
              </Button>
              <Button
                testID={'choice-two-button'}
                onPress={() => {
                  chosenWord = choiceTwoWord;
                  socket.emit('selectWord', gameIdG, choiceTwoWord);
                  toggleChooseWordModal();
                  setTimer(25);
                }}>
                {choiceTwoWord}
              </Button>
              <Button
                testID={'choice-three-button'}
                onPress={() => {
                  chosenWord = choiceThreeWord;
                  socket.emit('selectWord', gameIdG, choiceThreeWord);
                  toggleChooseWordModal();
                  setTimer(25);
                }}>
                {choiceThreeWord}
              </Button>
            </View>
          </Modal>
          <Modal
            isVisible={isRoundOverModalVisible}
            backdropColor="#B4B3DB"
            backdropOpacity={0.8}
            animationIn="zoomInDown"
            animationOut="zoomOutUp"
            animationInTiming={600}
            animationOutTiming={600}
            backdropTransitionInTiming={600}
            backdropTransitionOutTiming={600}>
            <View style={styles.content}>
              <Text style={styles.contentTitle}>Round over:</Text>
              {/*Insert flatlist with username + score */}
            </View>
          </Modal>
          <RNSketchCanvas
            onStrokeEnd={(path) => {
              console.log('onStrokeEnd:', JSON.stringify(path));
              socket.emit('newPathDrawn', gameIdG, path);
            }}
            ref={(ref: RNSketchCanvas) => (canvas = ref)}
            containerStyle={{backgroundColor: 'transparent', flex: 1}}
            canvasStyle={{backgroundColor: 'transparent', flex: 1}}
            defaultStrokeIndex={0}
            defaultStrokeWidth={5}
            undoComponent={
              <View style={styles.functionButton}>
                <Text style={styles.white}>Undo</Text>
              </View>
            }
            onUndoPressed={() => {
              socket.emit('undoReq', gameIdG);
            }}
            clearComponent={
              <View style={styles.functionButton}>
                <Text style={styles.white}>Clear</Text>
              </View>
            }
            onClearPressed={() => {
              socket.emit('clearReq', gameIdG);
            }}
            eraseComponent={
              <View style={styles.functionButton}>
                <Text style={styles.white}>Eraser</Text>
              </View>
            }
            strokeComponent={(color) => (
              <View
                style={[{backgroundColor: color}, styles.strokeColorButton]}
              />
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
          />
        </View>
        <View
          style={{
            position: 'absolute',
            //should may be changed
            top: '7.2%',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: 25,
            }}>
            {timer}
          </Text>
        </View>
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView style={styles.container}>
        <FlashMessage position="top" />
        <View style={{flex: 1, flexDirection: 'row'}}>
          <Modal
            isVisible={isWaitingModalVisible}
            backdropColor="#B4B3DB"
            backdropOpacity={0.8}
            animationIn="zoomInDown"
            animationOut="zoomOutUp"
            animationInTiming={600}
            animationOutTiming={600}
            backdropTransitionInTiming={600}
            backdropTransitionOutTiming={600}>
            <View style={styles.content}>
              <Text style={styles.contentTitle}>Waiting...</Text>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          </Modal>
          <Modal
            isVisible={isRoundOverModalVisible}
            backdropColor="#B4B3DB"
            backdropOpacity={0.8}
            animationIn="zoomInDown"
            animationOut="zoomOutUp"
            animationInTiming={600}
            animationOutTiming={600}
            backdropTransitionInTiming={600}
            backdropTransitionOutTiming={600}>
            <View style={styles.content}>
              <Text style={styles.contentTitle}>Round over:</Text>
              {/*Insert flatlist with username + score */}
            </View>
          </Modal>
          <View style={{flex: 1}} pointerEvents={'none'}>
            <RNSketchCanvas
              ref={(ref: RNSketchCanvas) => (canvas = ref)}
              containerStyle={{backgroundColor: 'transparent', flex: 1}}
              canvasStyle={{backgroundColor: 'transparent', flex: 1}}
            />
          </View>
          <VoiceGuess />
        </View>
      </SafeAreaView>
    );
  }
};

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
  white: {
    color: '#FFFFFF',
  },
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
  button: {
    width: 50,
    height: 50,
  },
  containerTwo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  action: {
    textAlign: 'center',
    color: '#0000FF',
    marginVertical: 5,
    fontWeight: 'bold',
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  stat: {
    textAlign: 'center',
    color: '#B0171F',
    marginBottom: 1,
  },
});

// const updatePath = (path) => {};

const GameScreen = () => <Drawing />;

export default memo(GameScreen);
