import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCCw4pVksb0dffSZXdrhh4dqK1RCbojW6k',
  authDomain: 'mapolyride.firebaseapp.com',
  projectId: 'mapolyride',
  storageBucket: 'mapolyride.firebasestorage.app',
  messagingSenderId: '1020825306101',
  appId: '1:1020825306101:web:06d9dbcb2cea8bc7de96bc',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;