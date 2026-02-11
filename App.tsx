import React, { useState } from 'react';

import LandingPage from './components/LandingPage';
import IDE from './IDE';
import { Analytics } from '@vercel/analytics/react';

const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState<boolean>(false);


  return (
    <>
      {!hasEntered && <LandingPage onEnter={() => setHasEntered(true)} />}
      {hasEntered && <IDE />}
      <Analytics />
    </>
  );
};

export default App;
