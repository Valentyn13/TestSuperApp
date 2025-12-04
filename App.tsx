/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { RootNavigator } from './src/navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useEffect } from 'react';

function App() {

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '1049838164847-gpq34rjm3n5khibpj9d5vtbgaetg6a11.apps.googleusercontent.com',
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView>
          <RootNavigator />
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}

export default App;
