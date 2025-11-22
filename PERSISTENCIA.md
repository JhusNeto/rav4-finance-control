# Sistema de Persistência em JSON

## ✅ Como Funciona

### 1. Upload de CSV → JSON Automático
Quando você faz upload de um CSV:
1. O sistema faz o parse do CSV
2. **Automaticamente salva em JSON** no servidor (`data/storage/finance-data.json`)
3. Também salva no localStorage como backup
4. Dados ficam disponíveis imediatamente

### 2. Carregamento Automático
Ao abrir a aplicação:
1. O sistema **automaticamente carrega** os dados do JSON do servidor
2. Se não encontrar no servidor, tenta localStorage
3. Dados são restaurados automaticamente

### 3. Persistência Contínua
Todas as alterações são salvas automaticamente:
- ✅ Upload de CSV → salva em JSON
- ✅ Alteração de metas → salva em JSON
- ✅ Alteração de saldo inicial → salva em JSON
- ✅ Alteração de salário → salva em JSON
- ✅ Mudança de data → salva em JSON

## 📁 Estrutura de Arquivos

```
rav4-finance-control/
├── data/
│   ├── storage/
│   │   ├── finance-data.json  ← Dados persistidos aqui
│   │   └── .gitkeep
│   └── exemplo-extrato.csv
└── app/
    └── api/
        └── data/
            └── route.ts  ← API que gerencia os JSONs
```

## 🔧 API Endpoints

### GET `/api/data`
- Carrega dados do arquivo JSON
- Retorna todos os dados financeiros

### POST `/api/data`
- Salva dados no arquivo JSON
- Recebe: transactions, initialBalance, salary, goals, currentDate

### DELETE `/api/data`
- Remove o arquivo JSON (limpa dados)

## 💾 Formato do JSON

```json
{
  "transactions": [...],
  "initialBalance": -372.93,
  "salary": 5000,
  "goals": {
    "PIX_SAIDA": 500,
    "ALIMENTACAO_FORA": 800,
    "ASSINATURAS": 200,
    "DIVIDAS_CDC": 1000
  },
  "currentDate": "2025-09-30T00:00:00.000Z",
  "savedAt": "2025-11-21T20:00:00.000Z"
}
```

## 🔄 Fluxo de Dados

### Upload CSV
```
CSV → Parser → Transações → Store → API POST → JSON File
```

### Carregamento
```
App Inicia → API GET → JSON File → Store → UI
```

### Alterações
```
UI → Store → API POST → JSON File (automático)
```

## 🛡️ Backup Automático

O sistema mantém **dois níveis de backup**:
1. **Servidor**: Arquivo JSON em `data/storage/finance-data.json`
2. **Cliente**: localStorage do navegador

Se o servidor falhar, os dados são restaurados do localStorage.

## 📝 Notas Importantes

- ✅ Os dados são salvos **automaticamente** após cada alteração
- ✅ Não precisa fazer nada manualmente
- ✅ Ao reiniciar o servidor, os dados continuam lá
- ✅ O arquivo JSON é criado automaticamente na primeira vez
- ✅ O arquivo JSON está no `.gitignore` (não vai para o git)

## 🚀 Uso

1. **Faça upload do CSV** → Dados são salvos automaticamente
2. **Feche o servidor** → Dados permanecem no JSON
3. **Reinicie o servidor** → Dados são carregados automaticamente
4. **Pronto!** → Tudo funciona automaticamente

