import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';

import {
  HomeScreen,
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  Dashboard,
  GameLobby,
  Game,
  AfterGame,
} from './screens';

const Router = createStackNavigator(
  {
    HomeScreen,
    LoginScreen,
    RegisterScreen,
    ForgotPasswordScreen,
    Dashboard,
    GameLobby,
    Game,
    AfterGame,
  },
  {
    initialRouteName: 'HomeScreen',
    headerMode: 'none',
    defaultNavigationOptions: {
      gestureEnabled: false,
    },
  }
);

export default createAppContainer(Router);
