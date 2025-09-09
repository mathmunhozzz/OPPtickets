import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AguardeAprovacao = () => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-orange-100">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Aguardando Aprovação
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Seu cadastro foi realizado com sucesso
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-800">
                Seu cadastro está sendo analisado pela administração. 
                Você receberá uma confirmação por email assim que for aprovado.
              </p>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>O que acontece agora?</strong>
              </p>
              <ul className="text-left space-y-1 max-w-sm mx-auto">
                <li>• Nossa equipe irá verificar seus dados</li>
                <li>• Você receberá um email de confirmação</li>
                <li>• Após aprovação, poderá acessar o sistema</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair do Sistema
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Em caso de dúvidas, entre em contato com o suporte.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AguardeAprovacao;