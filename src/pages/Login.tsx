import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Ticket, Shield, Zap } from 'lucide-react';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error('Erro ao fazer login: ' + error.message);
        }
      } else {
        navigate('/dashboard');
        toast.success('Login realizado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro inesperado ao fazer login');
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen w-full flex">
      {/* Hero Section - Hidden on mobile */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-primary via-travel-primary to-travel-secondary">
        <div className="absolute inset-0 bg-grid-slate-100 opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              
              <h1 className="text-3xl font-bold text-white">OPPTickets</h1>
            </div>
            
            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Gerencie tickets com 
              <span className="text-travel-accent block">eficiência total</span>
            </h2>
            
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Acompanhe o status, histórico e responsáveis de cada solicitação 
              de forma simples, rápida e profissional.
            </p>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 text-white/90">
                <div className="p-2 rounded-lg bg-white/10">
                  <Shield className="h-5 w-5" />
                </div>
                <span>Sistema seguro e confiável</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="p-2 rounded-lg bg-white/10">
                  <Zap className="h-5 w-5" />
                </div>
                <span>Interface moderna e responsiva</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 lg:max-w-md xl:max-w-lg flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-sm travel-card travel-card-dark border-0 shadow-2xl">
          <CardHeader className="text-center pb-8 pt-8">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-primary">OPPTickets</span>
            </div>
            
            <CardTitle className="text-2xl xl:text-3xl font-bold text-foreground">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="h-12 border-slate-300 focus:border-primary focus:ring-primary/20" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" className="h-12 pr-12 border-slate-300 focus:border-primary focus:ring-primary/20" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full h-12 text-lg font-medium travel-gradient hover:opacity-90 transition-all duration-300 hover:scale-[1.02]" disabled={loading}>
                {loading ? <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </div> : 'Entrar no Sistema'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">© 2025 OPPTickets. Sistema de gerenciamento de tickets.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Login;