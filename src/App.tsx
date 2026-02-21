// src/App.tsx
import './App.css';
import { useAppStore } from '@/store/appStore';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { BoardView } from '@/components/board/BoardView';
import { VistaVivaView } from '@/components/board/VistaVivaView';
import { BoardSelectorView } from '@/components/board/BoardSelectorView';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { Toaster } from 'sonner';

function App() {
  const vista = useAppStore(s => s.vista);
  const boardSelectorOpen = useAppStore(s => s.boardSelectorOpen);
  const closeBoardSelector = useAppStore(s => s.closeBoardSelector);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toolbar />
      <main className="flex-1 overflow-auto flex flex-col">
        {boardSelectorOpen ? (
          <BoardSelectorView onClose={closeBoardSelector} />
        ) : vista === 'completa' ? (
          <BoardView />
        ) : (
          <VistaVivaView />
        )}
      </main>
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
  );
}

export default App;
