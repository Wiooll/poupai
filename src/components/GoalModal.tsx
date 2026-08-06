import { useState, type FormEvent } from 'react';
import type { Goal } from '../types';

interface GoalModalProps {
  goal: Goal | null;
  onClose: () => void;
  onSave: (dataOrId: string | Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>, dataOpt?: Partial<Goal>) => Promise<void>;
}

export function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const [title, setTitle] = useState(goal?.title || '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount?.toString() || '');
  const [deadline, setDeadline] = useState(goal?.deadline || '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount || !deadline) return;

    const payload = {
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline,
    };

    if (goal) {
      await onSave(goal.id, payload);
    } else {
      await onSave(payload);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold">{goal ? 'Editar Meta' : 'Nova Meta'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Título</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Ex: Viagem Europa"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Valor Alvo (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="10000.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Valor Atual (R$)</label>
              <input
                type="number"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1">Prazo limite</label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Salvar Meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
