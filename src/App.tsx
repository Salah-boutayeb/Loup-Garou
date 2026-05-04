/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#050508] text-[#e2e2e7] font-sans overflow-x-hidden bg-grid">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
