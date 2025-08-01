# 🧪 Guia Completo de Testes - Corpo Vivo Conecta

## 👤 Usuário Administrador Criado
**Email:** breno.albuquerque@gmail.com  
**Senha:** (usar a senha definida no cadastro original)  
**Tipo:** Administrador  

## 🔐 1. TESTE DE AUTENTICAÇÃO

### 1.1 Login
1. Acesse a página inicial
2. Clique em "Entrar na Plataforma"
3. Digite o email: `breno.albuquerque@gmail.com`
4. Digite sua senha
5. **Resultado esperado:** Redirecionamento para Dashboard Admin

### 1.2 Cadastro de Novo Usuário
1. Na página de login, clique em "Cadastre-se"
2. Preencha nome, email e senha
3. **Resultado esperado:** Conta criada com role "membro"

### 1.3 Logout
1. No dashboard, clique no avatar do usuário
2. Clique em "Sair"
3. **Resultado esperado:** Redirecionamento para página inicial

## 📊 2. DASHBOARD ADMINISTRATIVO

### 2.1 Visualização de Métricas
1. Faça login como administrador
2. No dashboard, verifique os cards de estatísticas:
   - Total de Membros
   - Grupos Familiares
   - Discipulados Ativos
   - Atividades desta Semana
3. **Resultado esperado:** Números atualizados dinamicamente

### 2.2 Ações Rápidas
1. Teste os botões de navegação:
   - Cadastros
   - Relatórios
   - Grupos Familiares
   - Material de Estudo
2. **Resultado esperado:** Navegação funcional para cada seção

## 👥 3. CADASTROS

### 3.1 Cadastro de Pessoas
1. Vá para Cadastros → Aba "Pessoas"
2. Preencha todos os campos obrigatórios:
   - Nome Completo
   - Email
   - Telefone
   - Data de Nascimento
   - Função (admin, pastor, missionario, lider, membro)
   - Endereço
3. **Teste todos os tipos de função**
4. **Resultado esperado:** Usuário criado no sistema com função correta

### 3.2 Cadastro de Grupos Familiares
1. Vá para Cadastros → Aba "Grupos"
2. Preencha:
   - Nome do Grupo
   - Descrição
   - Endereço
   - Dia da Semana (1-7)
   - Horário
   - Líder (selecionar da lista)
3. **Resultado esperado:** Grupo criado e visível na lista

### 3.3 Cadastro de Eventos
1. Vá para Cadastros → Aba "Eventos"
2. Preencha:
   - Título
   - Descrição
   - Data e Hora
   - Local
   - Tipo de recorrência
3. **Resultado esperado:** Evento criado no sistema

## 🏠 4. GESTÃO DE GRUPOS FAMILIARES

### 4.1 Visualização de Grupos
1. Acesse "Grupos Familiares" no menu admin
2. **Resultado esperado:** Lista de todos os grupos da igreja

### 4.2 Edição de Grupos
1. Clique em "Editar" em um grupo
2. Modifique informações
3. Salve as alterações
4. **Resultado esperado:** Alterações refletidas na lista

### 4.3 Exclusão de Grupos
1. Clique em "Excluir" em um grupo
2. Confirme a exclusão
3. **Resultado esperado:** Grupo removido da lista

## 📚 5. MATERIAL DE ESTUDO

### 5.1 Criação de Estudos
1. Acesse "Material de Estudo"
2. Clique em "Novo Estudo"
3. Preencha:
   - Título
   - Descrição
   - Conteúdo
   - Categoria
   - Versículos Bíblicos
   - Visibilidade (público/privado)
4. **Resultado esperado:** Estudo criado e listado

### 5.2 Edição de Estudos
1. Clique em "Editar" em um estudo
2. Modifique o conteúdo
3. Salve
4. **Resultado esperado:** Mudanças salvas corretamente

### 5.3 Exclusão de Estudos
1. Clique em "Excluir" em um estudo
2. Confirme
3. **Resultado esperado:** Estudo removido

## 🎯 6. TESTE DE PERFIS HIERÁRQUICOS

### 6.1 Como Líder
1. Cadastre um usuário com função "lider"
2. Faça login com essa conta
3. **Teste acesso a:**
   - Grupos (apenas os grupos que lidera)
   - Discipulados (seus discípulos)
   - Reuniões (do seu grupo)

### 6.2 Como Membro
1. Cadastre um usuário com função "membro"
2. Faça login com essa conta
3. **Teste acesso a:**
   - Apenas seu perfil
   - Informações do seu grupo

### 6.3 Como Missionário
1. Cadastre um usuário com função "missionario"
2. Associe líderes a ele
3. **Teste supervisão de líderes**

## 📝 7. SISTEMA DE DISCIPULADO

### 7.1 Criar Discipulado
1. Como admin, vá para a seção de Discipulados
2. Clique em "Novo Discipulado"
3. Selecione líder e discípulo
4. Defina metas e data de início
5. **Resultado esperado:** Relacionamento de discipulado criado

### 7.2 Registrar Encontros
1. No discipulado criado, adicione encontros
2. Preencha:
   - Data do encontro
   - Tópico
   - Duração
   - Notas
   - Próximas metas
3. **Resultado esperado:** Encontro registrado no histórico

## 🤝 8. GESTÃO DE REUNIÕES

### 8.1 Agendar Reunião de Grupo
1. Como líder, acesse "Reuniões"
2. Agende nova reunião
3. Defina data, tema, notas
4. **Resultado esperado:** Reunião criada no calendário

### 8.2 Registrar Presença
1. Na reunião criada, registre presenças
2. Marque membros presentes/ausentes
3. Adicione notas individuais
4. **Resultado esperado:** Lista de presença salva

### 8.3 Registrar Visitantes
1. Na reunião, adicione visitantes
2. Preencha nome, contato, notas
3. **Resultado esperado:** Visitante registrado para follow-up

## 📊 9. RELATÓRIOS E MÉTRICAS

### 9.1 Relatórios Administrativos
1. Acesse seção de Relatórios
2. Visualize:
   - Estatísticas de frequência
   - Progresso de discipulados
   - Atividades dos grupos
   - Crescimento de membros

### 9.2 Exportação de Dados
1. Teste exportação de relatórios
2. **Resultado esperado:** Dados exportados corretamente

## 🔒 10. TESTE DE SEGURANÇA E PERMISSÕES

### 10.1 Controle de Acesso por Função
1. **Admin:** Deve ver todos os dados da igreja
2. **Líder:** Deve ver apenas seus grupos e discípulos
3. **Membro:** Deve ver apenas seus dados pessoais
4. **Missionário:** Deve ver líderes sob sua supervisão

### 10.2 RLS (Row Level Security)
1. Tente acessar dados de outras igrejas
2. **Resultado esperado:** Acesso negado
3. Verifique se cada usuário vê apenas dados da sua igreja

## 🚨 11. TESTE DE TRATAMENTO DE ERROS

### 11.1 Campos Obrigatórios
1. Tente salvar formulários com campos vazios
2. **Resultado esperado:** Mensagens de erro apropriadas

### 11.2 Dados Inválidos
1. Insira emails inválidos, datas futuras para nascimento
2. **Resultado esperado:** Validação e mensagens de erro

### 11.3 Conexão de Rede
1. Teste funcionalidades offline
2. **Resultado esperado:** Mensagens de erro de conectividade

## 📱 12. TESTE DE RESPONSIVIDADE

### 12.1 Dispositivos Móveis
1. Acesse em telefone/tablet
2. Teste todas as funcionalidades
3. **Resultado esperado:** Interface adaptada e funcional

### 12.2 Diferentes Navegadores
1. Teste em Chrome, Firefox, Safari, Edge
2. **Resultado esperado:** Compatibilidade completa

## 🔄 13. FLUXOS COMPLETOS

### 13.1 Fluxo de Novo Membro
1. Admin cadastra novo membro
2. Associa a um grupo familiar
3. Líder inicia discipulado
4. Registro de encontros e crescimento
5. **Teste o fluxo completo**

### 13.2 Fluxo de Reunião de Grupo
1. Líder agenda reunião
2. Convida membros
3. Realiza reunião
4. Registra presença e visitantes
5. Adiciona notas e próximos passos

### 13.3 Fluxo de Visitante
1. Visitante participa de reunião
2. Líder registra dados do visitante
3. Follow-up programado
4. Eventual conversão em membro

## ✅ 14. CHECKLIST FINAL

- [ ] Login/logout funcionando
- [ ] Todas as funções de usuário testadas
- [ ] Cadastros funcionais (pessoas, grupos, eventos)
- [ ] Gestão de grupos completa
- [ ] Sistema de discipulado operacional
- [ ] Reuniões e presença funcionando
- [ ] Material de estudo acessível
- [ ] Relatórios sendo gerados
- [ ] Permissões por função respeitadas
- [ ] Responsividade testada
- [ ] Tratamento de erros adequado

## 🆘 15. PROBLEMAS COMUNS E SOLUÇÕES

### Erro de Autenticação
- Verifique se o email está confirmado
- Teste com diferentes navegadores
- Limpe cache/cookies

### Dados Não Aparecem
- Verifique permissões RLS
- Confirme associação com igreja correta
- Teste com diferentes perfis de usuário

### Performance Lenta
- Verifique conexão de rede
- Monitore console do navegador
- Teste em horários diferentes

---

## 📞 Suporte Técnico
Para problemas durante os testes, documente:
1. Passos para reproduzir o erro
2. Mensagens de erro exatas
3. Navegador e dispositivo usado
4. Screenshots se necessário

**O sistema está pronto para uso em produção após validação de todos os testes acima.**