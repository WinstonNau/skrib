import React, {memo} from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import RNSketchCanvas from '@terrylinla/react-native-sketch-canvas';
import socket from '../lib/socket';

//TODO: Create a clock, so the drawer and the guessers can see the remaining time

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
    //TODO: Give feedback to the player if the guess was correct or not
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
        //TODO: Also call a mutation, which increases the score of the gamePlayer by 1
      } else {
        console.log('wrong guess');
        showMessage({
          message: w,
          type: 'danger',
        });
        socket.emit('wrongGuess', gameIdG, w);
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

  socket.on('newPath', (path: any) => {
    //draw the path
    canvas?.addPath(path);
    console.log('Received (' + socket.id + '):', path);
  });

  socket.on('clear', () => {
    canvas?.clear();
    console.log('Clear successful');
  });

  socket.on('undo', () => {
    canvas?.undo();
    console.log('Undo successful');
  });

  if (drawer) {
    return (
      <SafeAreaView style={styles.container}>
        <FlashMessage position="top" />
        <View style={{flex: 1, flexDirection: 'row'}}>
          <Modal
            testID={'modalSettings'}
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
                    socket.emit('selectWord', gameIdG, word);
                    setWordModalVisibility(false);
                    startTimer(word);
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
                  socket.emit('selectWord', gameIdG, choiceOneWord);
                  toggleChooseWordModal();
                  startTimer(choiceOneWord);
                }}>
                {choiceOneWord}
              </Button>
              <Button
                testID={'choice-two-button'}
                onPress={() => {
                  socket.emit('selectWord', gameIdG, choiceTwoWord);
                  toggleChooseWordModal();
                  startTimer(choiceTwoWord);
                }}>
                {choiceTwoWord}
              </Button>
              <Button
                testID={'choice-three-button'}
                onPress={() => {
                  socket.emit('selectWord', gameIdG, choiceThreeWord);
                  toggleChooseWordModal();
                  startTimer(choiceThreeWord);
                }}>
                {choiceThreeWord}
              </Button>
            </View>
          </Modal>
          <RNSketchCanvas
            onStrokeEnd={(path) => {
              console.log('onStrokeEnd:', JSON.stringify(path));
              socket.emit('newPathDrawn', path);
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
              socket.emit('undoReq');
            }}
            clearComponent={
              <View style={styles.functionButton}>
                <Text style={styles.white}>Clear</Text>
              </View>
            }
            onClearPressed={() => {
              socket.emit('clearReq');
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
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView style={styles.container}>
        <FlashMessage position="top" />
        <View style={{flex: 1, flexDirection: 'row'}}>
          <Modal
            testID={'modalSettings'}
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
