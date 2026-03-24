import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NexusNodeProps extends NodeProps {
  data: {
    label: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    description?: string;
    outputs?: { id: string; label: string }[];
  };
}

const NexusNode = ({ data, selected }: NexusNodeProps) => {
  const Icon = data.icon;

  return (
    <div className={cn(
      "min-w-[200px] bg-black/90 border-2 rounded-2xl p-4 shadow-2xl transition-all duration-300",
      selected ? "border-amber-500 ring-4 ring-amber-500/20" : "border-white/10 hover:border-white/20"
    )}>
      {/* Input Handle */}
      {data.label !== 'Disparador' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-white border-2 border-amber-500 !-top-1.5"
        />
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-xl", data.bg)}>
          <Icon className={cn("w-5 h-5", data.color)} />
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{data.label}</h3>
          <p className="text-xs font-bold text-white truncate max-w-[120px]">
            {data.description || 'Configurar...'}
          </p>
        </div>
      </div>

      {/* Output Handles */}
      <div className="flex flex-col gap-2 mt-4">
        {data.outputs ? (
          data.outputs.map((output, idx) => (
            <div key={output.id} className="relative flex items-center justify-end h-6">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 mr-2">
                {output.label}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                className="w-3 h-3 bg-white border-2 border-amber-500 !-right-5.5"
              />
            </div>
          ))
        ) : (
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 bg-white border-2 border-amber-500 !-bottom-1.5"
          />
        )}
      </div>
    </div>
  );
};

export default memo(NexusNode);
