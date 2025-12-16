import { NavigationContainer } from '@react-navigation/native';
import AuthGate from './src/navigation/AuthGate';

export default function App() {
  return (
    <NavigationContainer>
      <AuthGate />
    </NavigationContainer>
  );
}
