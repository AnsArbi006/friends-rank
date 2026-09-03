import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import FriendsRankGame from '../app/page';
import '../app/globals.css';

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <FriendsRankGame />
  </StrictMode>,
);
