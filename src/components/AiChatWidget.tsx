import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  MessageSquare,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { processAIMessage, type AIActionProposal } from '../services/aiAssistantService';
import type { Transaction } from '../types';
import { cn } from '../utils/lib';

interface ActionPreviewProps {
  proposal: AIActionProposal;
  onConfirm: (data: Partial<Transaction> & { id?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function ActionPreview({ proposal, onConfirm, onCancel, isLoading }: ActionPreviewProps) {
  const { data } = proposal;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-3 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <HelpCircle size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary mb-2">{proposal.replyText}</p>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div>
              <span className="text-muted-foreground">Descrição:</span>
              <p className="font-medium truncate">{data.descricao || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Valor:</span>
              <p className="font-medium text-foreground">R$ {Number(data.valor || 0).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Categoria:</span>
              <p className="font-medium truncate">{data.categoria || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo:</span>
              <p className="font-medium capitalize">{data.tipo || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pagamento:</span>
              <p className="font-medium truncate">{data.formaPagamento || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Data:</span>
              <p className="font-medium">{data.data || '-'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onConfirm(data)}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  Confirmar
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <X size={14} />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionPreview?: AIActionProposal;
}

export function AiChatWidget() {
  const { config, transactions, categories, contas, cartoesCredito, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<AIActionProposal | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const response = await processAIMessage(userMessage, {
        transactions,
        categories,
        accounts: contas,
        cards: cartoesCredito,
        config,
      });

      if (response.type === 'ACTION_PROPOSAL') {
        setPendingAction(response);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.replyText,
            timestamp: new Date(),
            actionPreview: response,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.replyText,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '❌ Ocorreu um erro ao processar sua mensagem. Tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAction = async (data: Partial<Transaction> & { id?: string }) => {
    setConfirmLoading(true);
    try {
      const action = pendingAction?.action;

      if (action === 'ADD_TRANSACTION') {
        // Remove id from data if present for new transaction
        const { id, ...txData } = data;
        await addTransaction(txData as Omit<Transaction, 'id'>);
      } else if (action === 'UPDATE_TRANSACTION' && data.id) {
        await updateTransaction(data.id, data);
      } else if (action === 'DELETE_TRANSACTION' && data.id) {
        await deleteTransaction(data.id);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.actionPreview?.data.id === data.id || msg.id === pendingAction?.data.id
            ? { ...msg, actionPreview: undefined }
            : msg
        )
      );
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '✅ Lançamento confirmado e salvo com sucesso!',
          timestamp: new Date(),
        },
      ]);
      setPendingAction(null);
    } catch (error) {
      console.error('Error confirming action:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '❌ Erro ao salvar o lançamento. Tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setMessages((prev) =>
      prev.map((msg) => (msg.actionPreview ? { ...msg, actionPreview: undefined } : msg))
    );
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      // Clear messages when opening new chat session
      setMessages([]);
      setPendingAction(null);
    }
  };

  if (!config.aiApiKey) {
    return (
      <div className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8">
        <button
          onClick={toggleChat}
          className="relative h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity animate-pulse"
          title="Assistente IA - Configure sua chave nas Configurações"
        >
          <Sparkles size={24} />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            !
          </span>
        </button>
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-card border border-border rounded-2xl shadow-xl p-4 animate-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm text-foreground mb-4">
              Para usar o Assistente, configure sua chave de API na aba <strong>Gerenciamento</strong>.
            </p>
            <button
              onClick={toggleChat}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-[9999] md:bottom-8 md:right-8">
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center hover:opacity-90 transition-opacity hover:scale-105 active:scale-95"
          title="Abrir Assistente Financeiro"
        >
          <Sparkles size={24} />
        </button>
      )}

      {isOpen && (
        <div className="absolute bottom-0 right-0 md:bottom-16 w-[92vw] sm:w-[400px] max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Assistente FinDash</p>
                <p className="text-xs text-muted-foreground">Powered by IA</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Fechar chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                <p className="mb-1">Olá! Como posso ajudar?</p>
                <p className="text-xs">Ex: "Gastei 50 no mercado hoje"</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2 animate-in fade-in duration-300',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={cn('text-xs mt-1 opacity-70', msg.role === 'user' ? 'text-primary-foreground/70' : 'text-secondary-foreground/70')}>
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {pendingAction && (
              <ActionPreview
                proposal={pendingAction}
                onConfirm={handleConfirmAction}
                onCancel={handleCancelAction}
                isLoading={confirmLoading}
              />
            )}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-2 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm text-secondary-foreground">Pensando...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-3 bg-background">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite sua mensagem... (Enter para enviar)"
                rows={1}
                className="flex-1 resize-none px-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                disabled={isProcessing || confirmLoading}
                aria-label="Mensagem para o assistente"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing || confirmLoading}
                className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Enviar mensagem"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Pressione Enter para enviar • Shift+Enter para nova linha
            </p>
          </div>
        </div>
      )}
    </div>
  );
}