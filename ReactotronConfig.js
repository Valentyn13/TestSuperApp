import Reactotron from "reactotron-react-native";
import { reactotronRedux } from "reactotron-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

const reactotron = Reactotron.configure() // controls connection & communication settings
    .setAsyncStorageHandler(AsyncStorage) // AsyncStorage would either come from `react-native` or `@react-native-async-storage/async-storage` depending on where you get it from
    .useReactNative() // add all built-in react native plugins
    .use(reactotronRedux()) // plus some Redux goodness
    .connect(); // let's connect!

export default reactotron;