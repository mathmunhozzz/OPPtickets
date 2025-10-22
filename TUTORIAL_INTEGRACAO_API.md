# 📚 Tutorial de Integração - API de Criação de Tickets

**Desenvolvido por:** Matheus Munhoz

## 🔗 Informações da API

- **URL da API:** `https://ninybkgnipuxmvcaxkwt.supabase.co/functions/v1/create-ticket-webhook`
- **Método HTTP:** `POST`
- **Content-Type:** `application/json`
- **Autenticação:** ✅ **Obrigatória** - Bearer Token

---

## 🔐 Autenticação

### Token de Acesso

A API requer um token de autenticação no header de todas as requisições:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

**⚠️ Importante:**
- O token deve ser fornecido pela equipe de desenvolvimento
- Guarde o token em um local seguro (variáveis de ambiente)
- Nunca compartilhe o token publicamente ou em repositórios de código
- Se o token for comprometido, solicite um novo imediatamente

### Exemplo de Header

```http
Authorization: Bearer abc123xyz789...
Content-Type: application/json
```

---

## 📋 Formato JSON do Sistema Spoken

### Estrutura Completa

```json
{
  "idTicket": "12345",
  "contato": "Fulano da Silva",
  "cpfUsuario": "12345678900",
  "mensagens": [
    {
      "texto": "Descrição do problema reportado pelo cliente",
      "tipo": "Cliente",
      "dataHora": "2025-10-21T10:30:00Z"
    },
    {
      "texto": "Resposta ou ação tomada",
      "tipo": "Atendente",
      "dataHora": "2025-10-21T10:35:00Z"
    }
  ]
}
```

### Descrição dos Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `idTicket` | string | ✅ Sim | Identificador único do ticket no sistema Spoken |
| `contato` | string | ⚠️ Opcional* | Nome do contato do cliente (será buscado no sistema) |
| `cpfUsuario` | string | ✅ Sim | CPF do funcionário (apenas números, sem pontos ou traços) |
| `mensagens` | array | ✅ Sim | Array com as mensagens do ticket |
| `mensagens[].texto` | string | ✅ Sim | Conteúdo da mensagem |
| `mensagens[].tipo` | string | ✅ Sim | Tipo da mensagem (ex: "Cliente", "Atendente") |
| `mensagens[].dataHora` | string | ✅ Sim | Data e hora no formato ISO 8601 |

**Nota:** Se o `contato` não for encontrado, o ticket será criado sem o contato associado.

---

## 💻 Exemplos de Código

### JavaScript / Node.js

```javascript
const axios = require('axios');

const criarTicket = async () => {
  try {
    const response = await axios.post(
      'https://ninybkgnipuxmvcaxkwt.supabase.co/functions/v1/create-ticket-webhook',
      {
        idTicket: "12345",
        contato: "Fulano da Silva",
        cpfUsuario: "12345678900",
        mensagens: [
          {
            texto: "Sistema apresentando erro ao gerar relatório",
            tipo: "Cliente",
            dataHora: "2025-10-21T10:30:00Z"
          },
          {
            texto: "Verificando o problema",
            tipo: "Atendente",
            dataHora: "2025-10-21T10:35:00Z"
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer SEU_TOKEN_AQUI'
        }
      }
    );

    console.log('Sucesso:', response.data);
    // { success: true, ticket_id: "uuid...", ticket_number: "12345", ... }
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
};

criarTicket();
```

### Python

```python
import requests
import json

url = "https://ninybkgnipuxmvcaxkwt.supabase.co/functions/v1/create-ticket-webhook"

headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer SEU_TOKEN_AQUI"
}

payload = {
    "idTicket": "12345",
    "contato": "Fulano da Silva",
    "cpfUsuario": "12345678900",
    "mensagens": [
        {
            "texto": "Sistema apresentando erro ao gerar relatório",
            "tipo": "Cliente",
            "dataHora": "2025-10-21T10:30:00Z"
        },
        {
            "texto": "Verificando o problema",
            "tipo": "Atendente",
            "dataHora": "2025-10-21T10:35:00Z"
        }
    ]
}

try:
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    
    print("Sucesso:", response.json())
except requests.exceptions.HTTPError as e:
    print("Erro HTTP:", e.response.json())
except Exception as e:
    print("Erro:", str(e))
```

### cURL (para testes)

```bash
curl -X POST \
  https://ninybkgnipuxmvcaxkwt.supabase.co/functions/v1/create-ticket-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "idTicket": "12345",
    "contato": "Fulano da Silva",
    "cpfUsuario": "12345678900",
    "mensagens": [
      {
        "texto": "Sistema apresentando erro ao gerar relatório",
        "tipo": "Cliente",
        "dataHora": "2025-10-21T10:30:00Z"
      }
    ]
  }'
```

---

## 📤 Respostas da API

### ✅ Sucesso (Status 201)

```json
{
  "success": true,
  "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "ticket_number": "12345",
  "status": "pendente",
  "created_at": "2025-10-21T10:30:00.000Z",
  "message": "Ticket criado com sucesso!"
}
```

### ❌ Erros Comuns

#### 1. Token não fornecido (Status 401)

```json
{
  "success": false,
  "error": "Token de autenticação não fornecido. Use o header: Authorization: Bearer SEU_TOKEN"
}
```

**Solução:** Adicione o header `Authorization: Bearer SEU_TOKEN`

---

#### 2. Token inválido (Status 401)

```json
{
  "success": false,
  "error": "Token de autenticação inválido"
}
```

**Solução:** Verifique se o token está correto e não expirou. Solicite um novo token se necessário.

---

#### 3. Funcionário não encontrado (Status 404)

```json
{
  "success": false,
  "error": "Funcionário não encontrado",
  "details": "Nenhum funcionário cadastrado com CPF: 12345678900. Por favor, cadastre o funcionário primeiro."
}
```

**Solução:** Verifique se:
- O CPF está correto (apenas números)
- O funcionário está cadastrado no sistema
- O campo `cpf` está preenchido na tabela de funcionários

---

#### 4. Campos obrigatórios faltando (Status 400)

```json
{
  "success": false,
  "error": "Campo obrigatório está faltando ou inválido"
}
```

**Solução:** Verifique se todos os campos obrigatórios estão presentes:
- `idTicket`
- `cpfUsuario`
- `mensagens` (deve conter pelo menos uma mensagem)

---

#### 5. Erro interno do servidor (Status 500)

```json
{
  "success": false,
  "error": "Erro interno do servidor: [mensagem de erro]"
}
```

**Solução:** Entre em contato com a equipe de desenvolvimento com os detalhes do erro.

---

## 🔍 Pontos de Integração Importantes

### 1. CPF do Funcionário
- **Formato:** Apenas números (sem pontos, traços ou espaços)
- **Exemplo correto:** `"12345678900"`
- **Exemplo incorreto:** `"123.456.789-00"`
- **Validação:** O CPF deve existir na tabela `employees` do banco de dados
- **Erro se não existir:** Status 404 com mensagem informativa

### 2. Nome do Contato
- **Opcional:** Se não for encontrado, o ticket é criado sem contato
- **Busca:** O sistema busca pelo nome na tabela `funcionarios_clientes`
- **Tipo de busca:** Parcial (não precisa ser o nome completo exato)
- **Case insensitive:** Não diferencia maiúsculas de minúsculas

### 3. Formato da Data
- **Padrão:** ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- **Exemplo:** `"2025-10-21T10:30:00Z"`
- **Timezone:** Recomendado usar UTC (Z no final)

### 4. Mensagens
- **Todas as mensagens** do array `mensagens` serão concatenadas em uma única descrição
- **Formato final:**
  ```
  [21/10/2025, 10:30] Cliente:
  Texto da primeira mensagem
  
  ---
  
  [21/10/2025, 10:35] Atendente:
  Texto da segunda mensagem
  ```
- Cada mensagem é separada por `---`

---

## ✅ Como Verificar se a Integração Funcionou

### 1. Teste com cURL
Use o comando cURL acima para fazer um teste rápido e ver a resposta.

### 2. Verifique os Logs
Entre em contato com a equipe de desenvolvimento para verificar os logs da API.

### 3. Confira no Sistema
Após criar o ticket, verifique se ele apareceu no sistema de tickets.

### 4. Response de Sucesso
Se receber status `201` e `"success": true`, o ticket foi criado com sucesso.

---

## 🆘 Solução de Problemas

### Problema: "Funcionário não encontrado"

**Causa:** O CPF não existe na tabela de funcionários

**Solução:**
1. Verifique se o CPF está correto
2. Cadastre o funcionário no sistema antes de criar tickets
3. Certifique-se de que o campo `cpf` está preenchido na tabela

### Problema: "Token de autenticação inválido"

**Causa:** Token incorreto ou expirado

**Solução:**
1. Confirme que está usando o token correto
2. Verifique se o token foi copiado completamente
3. Solicite um novo token se necessário

### Problema: "Contato não encontrado"

**Nota:** Isso NÃO é um erro! O ticket será criado normalmente sem o contato associado.

**Para resolver (opcional):**
1. Cadastre o contato no sistema
2. Verifique se o nome do contato está correto

---

## 📞 Suporte

Se precisar de ajuda ou tiver dúvidas sobre a integração:

1. **Verifique este tutorial** primeiro
2. **Teste com os exemplos** fornecidos
3. **Entre em contato** com a equipe de desenvolvimento

---

## 🔄 Versão

**Versão:** 2.0  
**Última atualização:** 21/10/2025  
**Changelog:**
- Adicionada autenticação com Bearer Token
- Melhorado tratamento de erros de autenticação
- Adicionados logs de segurança

---

## 📝 Checklist de Implementação

- [ ] Token de API recebido e armazenado com segurança
- [ ] Headers de autenticação configurados
- [ ] Formato JSON validado e testado
- [ ] CPFs dos funcionários cadastrados no sistema
- [ ] Teste de integração realizado com sucesso
- [ ] Tratamento de erros implementado
- [ ] Logs de integração configurados
- [ ] Documentação interna atualizada

---

**Boa sorte com a integração! 🚀**
