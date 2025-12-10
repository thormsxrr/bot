import { useState, useEffect } from "react";
import { 
  Terminal, 
  Activity, 
  Zap, 
  Shield, 
  Users, 
  Settings, 
  Play, 
  Square,
  RefreshCw,
  Cpu,
  Clock,
  MessageSquare,
  QrCode,
  Smartphone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [speed, setSpeed] = useState([50]);
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Initializing bot client...",
    "[AUTH] Loading credentials from bot_state.json...",
    "[NET] Connecting to WhatsApp servers...",
    "[SUCCESS] Connected as 918881207220",
    "[INFO] Loaded 3 admin numbers",
    "[INFO] Optimization enabled: 10x Speed Mode",
    "[BOT] Ready to process commands"
  ]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const actions = [
        "[NC] Changed group name to 'Hacker Squad 🚀'",
        "[NC] Changed group name to 'Hacker Squad 🔥'",
        "[NC] Changed group name to 'Hacker Squad ⚡'",
        "[SPAM] Sent spam message to Group A",
        "[INFO] Heartbeat check: OK",
        "[NET] Latency: 45ms",
        "[CMD] Executed /startchanging"
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [`[${time}] ${randomAction}`, ...prev.slice(0, 50)]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-mono">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-lg border border-primary/30">
              <Terminal className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Bot Control Center</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                System Operational | v2.4.0 Optimized
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={showQR} onOpenChange={setShowQR}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
                  <QrCode className="w-4 h-4 mr-2" />
                  Link Device
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-primary/20 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-center text-white">Scan QR Code</DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Open WhatsApp {'>'} Linked Devices {'>'} Link a Device
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-6">
                  <div className="p-4 bg-white rounded-xl">
                    <QRCode 
                      value="mock-session-id-for-prototype-display-only" 
                      size={256}
                      level="H"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                    <Smartphone className="w-3 h-3" />
                    <span>Keep your phone connected</span>
                  </div>
                  <p className="text-xs text-red-400 text-center max-w-[80%]">
                    * This is a prototype UI. To generate a real session QR, run the bot script in your terminal.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="border-primary/50 hover:bg-primary/10" onClick={() => setLogs([])}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Logs
            </Button>
            <Button 
              className={isRunning ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/50 border" : "bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50 border"}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isRunning ? "Stop Bot" : "Start Bot"}
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Uptime" value="14h 32m" icon={<Clock className="text-blue-400" />} trend="+2h" />
          <StatsCard title="Messages" value="12,450" icon={<MessageSquare className="text-purple-400" />} trend="+15%" />
          <StatsCard title="Active Groups" value="24" icon={<Users className="text-green-400" />} trend="Stable" />
          <StatsCard title="CPU Usage" value="12%" icon={<Cpu className="text-orange-400" />} trend="-5%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Controls */}
          <Card className="lg:col-span-2 border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Configuration
              </CardTitle>
              <CardDescription>Manage bot parameters and performance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Name Change Speed (Interval)</label>
                  <Badge variant="outline" className="border-primary text-primary">{speed[0]}ms</Badge>
                </div>
                <Slider 
                  value={speed} 
                  onValueChange={setSpeed} 
                  max={1000} 
                  min={50} 
                  step={50} 
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Current setting: <span className="text-primary font-bold">10x Speed</span>. Lower values increase api calls.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-black/20">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-white">Anti-Ban Protection</label>
                    <p className="text-xs text-muted-foreground">Randomize delays slightly</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-black/20">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-white">Auto-Reply</label>
                    <p className="text-xs text-muted-foreground">Respond to mentions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-black/20">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-white">Ghost Mode</label>
                    <p className="text-xs text-muted-foreground">Hide online status</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-black/20">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-white">Log Rotation</label>
                    <p className="text-xs text-muted-foreground">Auto-clear old logs</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Logs */}
          <Card className="border-primary/20 bg-black/80 h-[500px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                <Activity className="w-4 h-4" />
                Live Terminal
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4 font-mono text-xs">
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`break-all ${log.includes("ERROR") ? "text-red-400" : log.includes("SUCCESS") ? "text-green-400" : log.includes("NC") ? "text-blue-400" : "text-gray-400"}`}
                    >
                      <span className="opacity-50 mr-2">{">"}</span>
                      {log}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, trend }: { title: string, value: string, icon: any, trend: string }) {
  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-xs text-green-500 font-medium">{trend}</div>
        </div>
      </CardContent>
    </Card>
  );
}
