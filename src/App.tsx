// src/App.tsx
import './App.css';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { BoardView } from '@/components/board/BoardView';
import { VistaVivaView } from '@/components/board/VistaVivaView';
import { BoardSelectorView } from '@/components/board/BoardSelectorView';
import { LeftSidebar } from '@/components/sidebar/LeftSidebar';
import { RightSidebar } from '@/components/sidebar/RightSidebar';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  const vista = useAppStore(s => s.vista);
  const boardSelectorOpen = useAppStore(s => s.boardSelectorOpen);
  const closeBoardSelector = useAppStore(s => s.closeBoardSelector);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={400}>
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toolbar />

      {/* Body: left sidebar | main content | right sidebar */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left nav sidebar */}
        <LeftSidebar />

        {/* Main content */}
        <main className="flex-1 overflow-auto flex flex-col min-w-0">
          {boardSelectorOpen ? (
            <BoardSelectorView onClose={closeBoardSelector} />
          ) : vista === 'completa' ? (
            <BoardView />
          ) : (
            <VistaVivaView />
          )}
        </main>

        {/* Right contextual panel — hidden during board selector */}
        {!boardSelectorOpen && (
          <RightSidebar
            collapsed={rightCollapsed}
            onToggle={() => setRightCollapsed(c => !c)}
          />
        )}
      </div>

      <AIAssistant />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(222.2 84% 7%)',
            border: '1px solid hsl(217.2 32.6% 17.5%)',
            color: 'hsl(210 40% 98%)',
          },
        }}
      />
    </div>
    </TooltipProvider>
  );
}

export default App;
