import { PhoneFrame } from '../components/layout/PhoneFrame';
import { AppRoutes } from './routes';
import '../styles/components.css';

export function App(): JSX.Element { return <PhoneFrame><AppRoutes /></PhoneFrame>; }