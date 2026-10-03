import './style.css';
import { startRouter } from './router';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app not found');
}
startRouter(app);
