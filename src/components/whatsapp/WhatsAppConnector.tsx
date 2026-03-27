import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

interface WhatsAppConnectorProps {
  instanceId?: string;
  instanceName?: string;
  socket: Socket | null;
  onSuccess?: () => void;
}

export const WhatsAppConnector = ({ instanceId, instanceName, socket, onSuccess }: WhatsAppConnectorProps) => {
  const [status, setStatus] = useState('disconnected'); // initializing, loading, qr_ready, connected, error
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | undefined>(instanceId);

  useEffect(() => {
    if (instanceId) {
      setActiveId(instanceId);
    }
  }, [instanceId]);

  useEffect(() => {
    if (!socket) return;

    if (activeId) {
      socket.emit('join-instance', { instanceId: activeId });
    }

    const handleStatusUpdate = (data: any) => {
      if (!activeId || data.instanceId === activeId) {
        if (!activeId) setActiveId(data.instanceId);
        setStatus(data.status);
        if (data.progress) setProgress(data.progress);
      }
    };

    const handleQr = (data: any) => {
      // Backend envia tempId
      const incomingId = data.tempId || data.instanceId;
      if (!activeId || incomingId === activeId) {
        if (!activeId) setActiveId(incomingId);
        setQrCode(data.qr);
        setStatus('qr_ready');
      }
    };

    const handleReady = (data: any) => {
      setStatus('connected');
      setQrCode(null);
      if (onSuccess) onSuccess();
    };

    const handleError = (data: any) => {
      setError(data.message);
      setStatus('error');
    };

    socket.on('instance-status-update', handleStatusUpdate);
    socket.on('qr', handleQr);
    socket.on('ready', handleReady);
    socket.on('error', handleError);

    return () => {
      socket.off('instance-status-update', handleStatusUpdate);
      socket.off('qr', handleQr);
      socket.off('ready', handleReady);
      socket.off('error', handleError);
    };
  }, [socket, activeId, onSuccess]);

  const handleStart = () => {
    if (!socket) return;
    setError(null);
    setStatus('initializing');
    setProgress(0);
    
    if (activeId) {
      socket.emit('restart-instance', { instanceId: activeId });
    } else {
      socket.emit('init-instance', { name: instanceName || `Instancia-${Date.now().toString().slice(-6)}` });
    }
  };

  return (
    <div className="p-6 border rounded-[1.5rem] shadow-sm bg-[#0d0e12] border-white/5 w-full mx-auto">
      <h3 className="text-lg font-bold mb-4 text-white uppercase tracking-widest text-center">Vinculación de WhatsApp</h3>

      {/* Renderizado condicional según el estado */}
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        
        {status === 'disconnected' && (
          <button 
            onClick={handleStart}
            className="bg-amber-500 text-black font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-amber-600 transition shadow-lg shadow-amber-500/20"
          >
            {activeId ? 'Re-vincular Sesión' : 'Conectar Dispositivo'}
          </button>
        )}

        {(status === 'initializing' || status === 'loading') && (
          <div className="text-center w-full px-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4 blur-[1px]"></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
              {status === 'initializing' ? 'Despertando navegador...' : `Cargando chats: ${progress}%`}
            </p>
            <div className="w-full bg-white/5 rounded-full h-1 mt-4 overflow-hidden">
              <div 
                className="bg-amber-500 h-1 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {status === 'qr_ready' && qrCode && (
          <div className="text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Escanea el código con tu celular</p>
            <div className="p-4 border border-amber-500/30 rounded-2xl bg-white shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <QRCodeSVG value={qrCode} size={220} />
            </div>
            <p className="mt-6 animate-pulse text-amber-500 font-bold uppercase tracking-widest text-xs">Esperando vinculación...</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="text-center">
            <div className="text-5xl mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">✅</div>
            <h4 className="text-lg font-black text-green-500 uppercase tracking-widest">¡Conectado!</h4>
            <p className="text-gray-500 mt-2 text-xs font-bold uppercase tracking-widest">El bot de ventas ya está operativo.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center text-red-500 w-full px-4">
            <p className="font-bold uppercase tracking-widest mb-3">Error de conexión</p>
            <p className="text-xs bg-red-500/10 p-4 rounded-xl border border-red-500/20 break-words">{error}</p>
            <button 
              onClick={handleStart}
              className="mt-6 text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 underline transition"
            >
              Reintentar Conexión
            </button>
          </div>
        )}
      </div>

      {/* Footer informativo */}
      <div className="mt-8 pt-4 border-t border-white/5 text-[10px] font-black tracking-widest text-gray-600 flex justify-between uppercase">
        <span>ID: {activeId ? `${activeId.substring(0,8)}...` : 'PENDIENTE'}</span>
        <span className={status === 'connected' ? 'text-green-500/80' : status === 'error' ? 'text-red-500/80' : 'text-amber-500/80'}>{status}</span>
      </div>
    </div>
  );
};

export default WhatsAppConnector;
