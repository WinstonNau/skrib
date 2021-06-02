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
  SpeechErrorEvent,
  SpeechResultsEvent,
} from '@react-native-community/voice';
import {gql} from '@apollo/client/core';
import {useMutation} from '@apollo/client';
import {graphql, MutateProps} from '@apollo/client/react/hoc';

import {Navigation} from '../types';

let gameIdG: string;
let roundNumG: number;
let playerUsernameG: string;
let chosenWord: string;
let playersG: Array<string>;
let rounds = 0;
//TODO: Figure out a better way to do getPlSc
let getPlSc = true;

interface Props extends Partial<MutateProps> {
  timer: number;
}

type State = {
  recognized: string;
  pitch: string;
  error: string;
  end: string;
  started: string;
  results: string[];
  partialResults: string[];
};

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

  onSpeechResults = async (e: SpeechResultsEvent) => {
    //@ts-ignore
    let w = e.value[0];
    if (this.state.stop) {
      if (w === chosenWord) {
        console.log('correct guess');
        showMessage({
          message: w,
          type: 'success',
        });
        const {mutate} = this.props;

        if (mutate) {
          const {data} = await mutate({
            variables: {addedScore: this.props.timer * 10},
          });

          socket.emit('correctGuess', gameIdG, playerUsernameG);

          if (data) {
            console.log('Success', data);
          }
        }
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

const UPDATE_SCORES = gql`
  mutation UpdateScoreMutation($addedScore: Int!) {
    updateScore(input: {addedScore: $addedScore}) {
      clientMutationId
    }
  }
`;

const EnhancedVoiceGuess = graphql<Props>(UPDATE_SCORES)(VoiceGuess);

function shuffleArray(array: any[]) {
  array.forEach((v, i, arr) => {
    if (i === 0) {
      return;
    }
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  });
}

const Drawing = ({navigation}: {navigation: Navigation}) => {
  let canvas: RNSketchCanvas | null = null;

  const wordArray = [
    'Affe',
    'Vollmond',
    'Elefant',
    'Schlange',
    'Decke',
    'Kissen',
    'Bett',
    'Programmiersprache',
    'Massage',
    'Wand',
    'Küche',
    'Balkon',
    'Word',
    'Fernseher',
    'Schrank',
    'Computer',
    'Maus',
  ];

  const [isGameOver, setGameOver] = useState(false);

  const [isWordModalVisible, setWordModalVisibility] = useState(false);
  const [isWaitingModalVisible, setWaitingModalVisibility] = useState(false);
  const [isRoundOverModalVisible, setRoundOverModalVisibility] = useState(
    false
  );

  const [choiceOneWord, setChoiceOneWord] = useState('Test');
  const [choiceTwoWord, setChoiceTwoWord] = useState('Test');
  const [choiceThreeWord, setChoiceThreeWord] = useState('Test');

  const [playerScores, setPlayerScores] = useState([] as Array<GamePlayer>);

  const [timer, setTimer] = useState(0);

  const [isDrawer, setDrawer] = useState(false);

  const [updateScore] = useMutation(UPDATE_SCORES);
  const [getScores] = useMutation<GetScoresResp>(GET_SCORES);

  // const userUpdatesScore = async (score: number) => {
  //   console.log('in userLeavesGame');
  //
  //   let mutationResult: any;
  //   try {
  //     mutationResult = await updateScore({
  //       variables: {
  //         addedScore: score,
  //       },
  //     });
  //   } catch (err) {
  //     console.log(err);
  //   }
  //
  //   const {data, errors} = mutationResult;
  //
  //   if (errors) {
  //     console.log('Bye bye: ' + errors);
  //   } else {
  //     console.log('data:', data);
  //   }
  // };

  const getPlayerScores = async () => {
    console.log('in getPlayerScores');

    if (getPlSc) {
      getPlSc = false;
      try {
        let mutationResult = await getScores({
          variables: {
            gameId: gameIdG,
          },
        });

        const {data, errors} = mutationResult;

        console.log('getPlayerScores data:', data);

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
        console.log('getPlayerScores error:', e);
      }
    }
  };

  const updatePlayerScore = async () => {
    try {
      let mutationResult = await updateScore({
        variables: {
          addedScore: timer * 10,
        },
      });

      const {data, errors} = mutationResult;

      if (errors) {
        console.log('Bye bye:', errors);
      } else {
        console.log(data);
      }
    } catch (e) {
      console.log('getPlayerScores error:', e);
    }
  };

  const toggleChooseWordModal = () => {
    setWordModalVisibility(!isWordModalVisible);
  };

  const randomWord = () => {
    const randomIndex = Math.floor(Math.random() * wordArray.length);
    return wordArray[randomIndex];
  };

  useEffect(() => {
    const main = async () => {
      playerUsernameG = (await AsyncStorage.getItem('user.name')) as string;
      gameIdG = (await AsyncStorage.getItem('game.id')) as string;
      roundNumG = JSON.parse(
        (await AsyncStorage.getItem('round.num')) as string
      ) as number;
      playersG = JSON.parse(
        (await AsyncStorage.getItem('players')) as string
      ) as Array<string>;
      console.log('in useEffect w/o');
      console.log(playerUsernameG);
      console.log(gameIdG);
      console.log(roundNumG);
      console.log(playersG);
      if (playerUsernameG === playersG[0]) {
        setDrawer(true);
        setWordModalVisibility(true);
      } else {
        setWaitingModalVisibility(true);
      }
      shuffleArray(wordArray);
      setChoiceOneWord(wordArray[0]);
      setChoiceTwoWord(wordArray[1]);
      setChoiceThreeWord(wordArray[2]);
    };
    main();
    return () => {
      console.log('onComponentUnmounted');
      socket.off('newPath');
      socket.off('clear');
      socket.off('undo');
      socket.off('wordSelected');
      socket.off('playerGuessedWrong');
      socket.off('playerGuessedCorrect');
      socket.off('roundFinished');
      socket.off('gameOver');
    };
  }, []);

  const [firstTime, setFirstTime] = useState(true);
  useEffect(() => {
    if (firstTime) {
      setFirstTime(false);
      return;
    }

    if (timer === 0) {
      if (isDrawer) {
        const i = playersG.findIndex(
          (username) => username === playerUsernameG
        );

        if (i < 0) {
          console.error('Something went wrong');
        }

        if (
          roundNumG.toString() === rounds.toString() &&
          i === playersG.length - 1
        ) {
          setGameOver(true);
          socket.emit('gameIsOver', gameIdG);
          //Maybe create another GameOverModal
          getPlayerScores();
          setRoundOverModalVisibility(true);
          setTimeout(() => {
            navigation.navigate('AfterGame');
            getPlSc = true;
            setRoundOverModalVisibility(false);
          }, 5000);
        } else {
          socket.emit(
            'roundOver',
            gameIdG,
            playersG[i < playersG.length - 1 ? i + 1 : 0]
          );
          getPlayerScores();
          setRoundOverModalVisibility(true);
          setTimeout(() => {
            getPlSc = true;
            setRoundOverModalVisibility(false);
            setDrawer(false);
          }, 5000);
        }
      }
      return;
    } else if (timer === 8) {
      if (!isDrawer) {
        showMessage({
          message:
            "The word's first two letters are: " +
            chosenWord.split('')[0] +
            chosenWord.split('')[1] +
            '_'.repeat(chosenWord.length - 2),
          type: 'info',
        });
      }
    } else if (timer === 15) {
      if (!isDrawer) {
        showMessage({
          message:
            "The word's first letter is: " +
            chosenWord.split('')[0] +
            '_'.repeat(chosenWord.length - 1),
          type: 'info',
        });
      }
    } else if (timer === 23) {
      if (!isDrawer) {
        showMessage({
          message: 'The word has ' + chosenWord.length + ' letters.',
          type: 'info',
        });
      }
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
    }
  });

  socket.on('clear', (gameId: string) => {
    if (gameIdG === gameId) {
      //clear the canvas
      canvas?.clear();
    }
  });

  socket.on('undo', (gameId: string) => {
    if (gameIdG === gameId) {
      //undo the last drawn path
      canvas?.undo();
    }
  });

  socket.on('wordSelected', (gameId: string, word: string) => {
    if (gameIdG === gameId) {
      chosenWord = word;
      setWaitingModalVisibility(false);
      setTimer(25);
    }
  });

  socket.on('playerGuessedWrong', (gameId, user, guess) => {
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
        if (isDrawer) {
          const i = playersG.findIndex(
            (username) => username === playerUsernameG
          );

          if (i < 0) {
            console.error('Something went wrong');
          }
          if (getPlSc) {
            getPlayerScores();
            getPlSc = false;
          }
          setRoundOverModalVisibility(true);
          if (
            roundNumG.toString() === rounds.toString() &&
            i === playersG.length - 1
          ) {
            setGameOver(true);
            socket.emit('gameIsOver', gameIdG);
            setRoundOverModalVisibility(true);
            setTimeout(() => {
              navigation.navigate('AfterGame');
              getPlSc = true;
              setRoundOverModalVisibility(false);
            }, 5000);
          } else {
            socket.emit(
              'roundOver',
              gameIdG,
              playersG[i < playersG.length - 1 ? i + 1 : 0]
            );

            setRoundOverModalVisibility(true);
            setTimeout(() => {
              getPlSc = true;
              setRoundOverModalVisibility(false);
              setDrawer(false);
            }, 5000);
          }
        } else {
          setTimer(0);
        }
      }
    };
    main();
  });

  socket.on('roundFinished', (gameId, nextPlayer) => {
    if (gameIdG === gameId) {
      if (getPlSc) {
        getPlayerScores();
        getPlSc = false;
      }
      setRoundOverModalVisibility(true);
      setTimer(0);
      setTimeout(() => {
        if (nextPlayer === playerUsernameG) {
          getPlSc = true;
          setDrawer(true);
          shuffleArray(wordArray);
          setChoiceOneWord(wordArray[0]);
          setChoiceTwoWord(wordArray[1]);
          setChoiceThreeWord(wordArray[2]);
          console.log(isWordModalVisible);
          setWordModalVisibility(true);
        }
        setRoundOverModalVisibility(false);
      }, 5000);
    }
  });

  socket.on('gameOver', (gameId) => {
    if (gameId === gameIdG) {
      setGameOver(true);
      setRoundOverModalVisibility(true);
      setTimeout(() => {
        navigation.navigate('AfterGame');
        setRoundOverModalVisibility(false);
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
                    rounds++;
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
                  rounds++;
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
                  rounds++;
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
                  rounds++;
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
            backdropTransitionOutTiming={600}
            onModalHide={() => {
              if (!isGameOver) {
                console.log('Kohpai', "it's visible");
                setWordModalVisibility(true);
              }
            }}>
            <View style={styles.content}>
              <Text style={styles.contentTitle}>Round over:</Text>
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
            backdropTransitionOutTiming={600}
            onModalHide={() => {
              if (!isGameOver) {
                console.log('Kohpai', "it's waiting");
                setWaitingModalVisibility(true);
              }
            }}>
            <View style={styles.content}>
              <Text style={styles.contentTitle}>Round over:</Text>
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
            </View>
          </Modal>
          <View style={{flex: 1}} pointerEvents={'none'}>
            <RNSketchCanvas
              ref={(ref: RNSketchCanvas) => (canvas = ref)}
              containerStyle={{backgroundColor: 'transparent', flex: 1}}
              canvasStyle={{backgroundColor: 'transparent', flex: 1}}
            />
          </View>
          <EnhancedVoiceGuess timer={timer} />
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
  item: {
    padding: 8,
    fontSize: 18,
    height: 50,
  },
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

export default memo(Drawing);
