# Changelog - Ajustes para Formato Banco do Brasil

## ✅ Ajustes Realizados

### 1. Parser CSV Aprimorado
- ✅ Suporte ao formato específico do Banco do Brasil
- ✅ Extração automática do saldo anterior
- ✅ Ignora linhas de saldo intermediárias ("Saldo do dia", "S A L D O")
- ✅ Ignora datas inválidas ("00/00/0000")
- ✅ Combina colunas "Lançamento" e "Detalhes" para descrição completa

### 2. Tratamento de Encoding
- ✅ Detecção automática de problemas de encoding (ISO-8859-1 / Windows-1252)
- ✅ Conversão automática para UTF-8
- ✅ Busca inteligente de colunas mesmo com caracteres corrompidos

### 3. Classificação Melhorada
- ✅ Reconhece "Pix - Enviado" especificamente
- ✅ Identifica CDC Antecipação como entrada de crédito
- ✅ Classifica PLR e Proventos como entradas
- ✅ Melhor detecção de restaurantes (TOP SABOR, SABOR GLACE)
- ✅ Identifica Gympass, Globo Combo como assinaturas
- ✅ Reconhece Açougue e Sacolão como mercado
- ✅ Identifica pagamentos de CDC Renovação

### 4. Formato de Valores
- ✅ Suporte a formato brasileiro (vírgula como decimal)
- ✅ Remove pontos de milhares automaticamente
- ✅ Processa valores negativos corretamente

### 5. Tipos de Lançamento
- ✅ Usa coluna "Tipo Lançamento" quando disponível
- ✅ Fallback para sinal do valor quando tipo não disponível
- ✅ Reconhece "Entrada" e "Saída" corretamente

## 📋 Formato Esperado do CSV

O sistema agora suporta o formato do Banco do Brasil:

```csv
Data,Lançamento,Detalhes,Nº documento,Valor,Tipo Lançamento
25/08/2025,Saldo Anterior,,,,-372,93
01/09/2025,Pix - Enviado,30/08 10:29 João Silva,90101,-2,06,Saída
12/09/2025,PLR,,5887006052399,7116,90,Entrada
```

### Colunas Suportadas:
- **Data**: DD/MM/YYYY
- **Lançamento**: Tipo da transação
- **Detalhes**: Informações adicionais
- **Valor**: Formato brasileiro (vírgula decimal, pontos milhares)
- **Tipo Lançamento**: "Entrada" ou "Saída"

## 🔧 Melhorias Técnicas

1. **Função `findColumn()`**: Busca inteligente de colunas ignorando encoding e case
2. **`ParseResult`**: Retorna transações e saldo inicial separadamente
3. **Validação de Datas**: Ignora datas inválidas automaticamente
4. **Extração de Saldo**: Detecta e extrai saldo anterior automaticamente

## 🎯 Próximos Passos Sugeridos

- [ ] Interface para editar saldo inicial manualmente
- [ ] Suporte a múltiplos meses
- [ ] Exportação de relatórios
- [ ] Histórico de uploads

