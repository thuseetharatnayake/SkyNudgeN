import { PhoneFrame } from '../components/layout/PhoneFrame';
import { LaunchGate } from '../components/launch/LaunchGate';
import { AppRoutes } from './routes';
import { Toast } from '../components/ui/Toast';
import '../styles/components.css';

export function App(): JSX.Element { return <PhoneFrame><LaunchGate><AppRoutes /></LaunchGate><Toast /></PhoneFrame>; }