
import { WhatsAppInstance } from '@/lib/mock-api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { MoreVertical, MessageSquare, Trash2, ExternalLink, Power, Bot } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface InstanceCardProps {
  instance: WhatsAppInstance;
  onToggleBot: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}

export const InstanceCard = ({ instance, onToggleBot, onDelete }: InstanceCardProps) => {
  const statusColors = {
    connected: 'bg-green-500/10 text-green-500 border-green-500/20',
    disconnected: 'bg-red-500/10 text-red-500 border-red-500/20',
    connecting: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    qr_ready: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  return (
    <Card className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-2xl transition-colors duration-300",
            instance.status === 'connected' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">{instance.name}</CardTitle>
            <p className="text-sm text-muted-foreground font-medium">{instance.phoneNumber || 'Not linked'}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem asChild>
              <Link to={`/instances/${instance.id}`} className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive flex items-center gap-2"
              onClick={() => onDelete(instance.id)}
            >
              <Trash2 className="w-4 h-4" /> Delete Instance
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
            <Badge variant="outline" className={cn("capitalize px-3 py-1 rounded-full font-semibold", statusColors[instance.status])}>
              {instance.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bot Status</span>
            <div className="flex items-center gap-3">
              <span className={cn("text-sm font-bold", instance.botEnabled ? "text-primary" : "text-muted-foreground")}>
                {instance.botEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <Switch
                checked={instance.botEnabled}
                onCheckedChange={(checked) => onToggleBot(instance.id, checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-accent/30 rounded-2xl p-3 border border-border/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Scope</p>
            <p className="text-sm font-bold capitalize">{instance.scope}</p>
          </div>
          <div className="bg-accent/30 rounded-2xl p-3 border border-border/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Last Active</p>
            <p className="text-sm font-bold">{instance.lastActive ? new Date(instance.lastActive).toLocaleTimeString() : 'Never'}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button 
          variant={instance.status === 'connected' ? "outline" : "default"} 
          className="w-full rounded-2xl font-bold h-12 gap-2 transition-all duration-300"
          asChild
        >
          <Link to={instance.status === 'qr_ready' ? '#' : `/instances/${instance.id}`}>
            {instance.status === 'qr_ready' ? (
              <>
                <Power className="w-4 h-4" /> Link WhatsApp
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" /> Configure Bot
              </>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
