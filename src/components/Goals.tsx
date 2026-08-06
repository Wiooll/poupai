import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Target, TrendingUp, AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';
import { parseISO, isSameMonth, startOfMonth } from 'date-fns';
import type { Goal } from '../types';
import { GoalModal } from './GoalModal';

export const Goals = () => {
  const { config, updateConfig, transactions, goals, addGoal, updateGoal, deleteGoal } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const currentMonth = startOfMonth(new Date());

  let mesAtualReceitas = 0;
  let mesAtualDespesas = 0;

  transactions.forEach(t => {
    const isCurrentMonth = isSameMonth(parseISO(t.data), currentMonth);
    if (isCurrentMonth) {
      if (t.tipo === 'receita') mesAtualReceitas += Number(t.valor);
      else mesAtualDespesas += Number(t.valor);
    }
  });

  const economiaMes = mesAtualReceitas - mesAtualDespesas;
  
  let progress = 0;
  if (config.metaEconomiaMensal > 0) {
    if (economiaMes <= 0) progress = 0;
    else {
      progress = Math.min(100, Math.round((economiaMes / config.metaEconomiaMensal) * 100));
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const isMetaAtingida = economiaMes >= config.metaEconomiaMensal;
  const isNegativo = economiaMes < 0;

  const handleOpenNew = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      void deleteGoal(id);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSaveGoal = async (payloadOrId: string | Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>, payloadOpt?: Partial<Goal>) => {
    if (typeof payloadOrId === 'string' && payloadOpt) {
      await updateGoal(payloadOrId, payloadOpt);
    } else {
      await addGoal(payloadOrId as Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Target size={24} />
        <h2 className="text-2xl font-bold tracking-tight">Metas e Objetivos</h2>
      </div>

      {/* Meta de Economia Mensal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-primary" />
              Progresso da Meta Mensal
            </h3>
            
            <div className="mb-2 flex justify-between items-end">
              <div>
                <span className="text-3xl font-bold">{formatCurrency(economiaMes)}</span>
                <span className="text-muted-foreground ml-2 text-sm">economizados</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Meta:</span>
                <span className="font-medium ml-1">{formatCurrency(config.metaEconomiaMensal)}</span>
              </div>
            </div>

            <div className="h-4 w-full bg-secondary rounded-full overflow-hidden mb-2 border border-border">
              <div 
                className={`h-full transition-all duration-1000 ease-in-out ${isMetaAtingida ? 'bg-success' : 'bg-primary'}`} 
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">0%</span>
              <span className="font-bold">{progress}%</span>
              <span className="text-muted-foreground">100%</span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-border">
            {isMetaAtingida ? (
              <div className="flex items-center gap-2 text-success bg-success/10 p-3 rounded-lg border border-success/20">
                <Target size={18} />
                <span className="font-medium">Parabéns! Você atingiu sua meta de economia este mês.</span>
              </div>
            ) : isNegativo ? (
              <div className="flex items-center gap-2 text-danger bg-danger/10 p-3 rounded-lg border border-danger/20">
                <AlertTriangle size={18} />
                <span className="font-medium">Atenção! Suas despesas superaram suas receitas neste mês.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-info bg-info/10 p-3 rounded-lg border border-info/20">
                <TrendingUp size={18} />
                <span className="font-medium">Você está no caminho! Faltam {formatCurrency(config.metaEconomiaMensal - economiaMes)} para atingir sua meta.</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-fit">
          <h3 className="font-semibold text-lg mb-4">Configurar Meta</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Meta de Economia Mensal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <input 
                  type="number" 
                  value={config.metaEconomiaMensal} 
                  onChange={(e) => updateConfig({ metaEconomiaMensal: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  step="100"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Defina o valor mínimo que você deseja guardar todos os meses.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metas Personalizadas */}
      <div className="space-y-6 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Target size={20} className="text-primary" />
              Objetivos Personalizados
            </h3>
            <p className="text-sm text-muted-foreground">Defina metas para viagens, compras ou reservas.</p>
          </div>
          <button
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shrink-0"
          >
            <Plus size={18} />
            Nova Meta
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Target size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum objetivo definido</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Acompanhe o progresso de seus grandes objetivos financeiros e veja o quão perto você está de realizá-los.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const prog = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const percentage = Math.min(Math.round(prog), 100);

              return (
                <div key={goal.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-lg line-clamp-1">{goal.title}</h4>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button onClick={() => handleEdit(goal)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(goal.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Acumulado</p>
                        <p className="font-semibold text-xl">{formatCurrency(goal.currentAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Alvo</p>
                        <p className="font-medium text-sm text-muted-foreground">{formatCurrency(goal.targetAmount)}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium">{percentage}% concluído</span>
                        <span className="text-muted-foreground">Prazo: {goal.deadline.split('-').reverse().join('/')}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <GoalModal goal={editingGoal} onClose={handleClose} onSave={handleSaveGoal} />
      )}
    </div>
  );
};
