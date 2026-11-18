# orbi — assistente de desktop

Aplicativo **original**, com visual minimalista: barra preta superior, dashboard grafite e detalhes verdes discretos, sem efeitos neon. MVP para Windows 10/11 x64.

## O que está implementado na versão 0.1.0

- Barra superior flutuante, clique para abrir/recolher painel.
- Dashboard funcional, bandeja do sistema e três temas discretos.
- Tarefas (adicionar, concluir, excluir), notas e lembretes com notificações locais.
- Pomodoro de 25 minutos, monitor de memória RAM.
- Comandos escritos: `tarefa comprar café`, `anotar revisar o projeto`, `abrir calculadora`, `abrir bloco`, `status do PC`.
- Atualização via GitHub Releases: verifica, apresenta versão, **Baixar atualização**, **Reiniciar e instalar**.
- Dados armazenados localmente na pasta `userData` do Electron.

**Não implementados:** IA conversacional com modelos, ativação por voz, fala sintetizada, Spotify, calendário externo, mobile, automação avançada do sistema, sincronização na nuvem. O protótipo visual não deve ser interpretado como suporte a esses recursos.

## Testar localmente

Requisitos: Node.js 22 e npm; conexão à internet para dependências.

```powershell
npm install
npm start
```

## Gerar .exe no Windows manualmente

```powershell
npm install
npm run dist:win
```

Instalador em `release/orbi-Setup-0.1.0.exe`. O `.exe` só existe depois de a compilação terminar com sucesso.

## Publicar pela primeira vez no GitHub (sem precisar compilar no seu PC)

1. Crie um repositório **público** no GitHub chamado `orbi-desktop` (pode ser outro nome). Não inicialize com README porque o projeto já tem um.
2. Extraia este ZIP no computador, abra a pasta `orbi-app` no terminal. Instale Git caso ainda não tenha.
3. Execute os comandos abaixo, substituindo `SEU_USUARIO` pelo seu usuário GitHub:

```bash
git init
git add .
git commit -m "orbi v0.1.0"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/orbi-desktop.git
git push -u origin main
```

4. No repositório, entre em **Settings > Actions > General > Workflow permissions** e selecione **Read and write permissions**; salve. (Em alguns repositórios as permissões da organização prevalecem.)
5. Ainda no terminal, crie e publique a tag da versão:

```bash
git tag v0.1.0
git push origin v0.1.0
```

6. Abra **Actions > Windows installer and updates** e acompanhe a compilação. Ao concluir, visite **Releases** e baixe `orbi-Setup-0.1.0.exe`.
7. Instale o programa. Na primeira execução o Windows pode mostrar um aviso de reputação do SmartScreen para software não assinado. Para distribuição pública, é recomendada assinatura de código.

O workflow detecta automaticamente `SEU_USUARIO/orbi-desktop` do repositório, configura `electron-builder`, gera o `.exe` e publica no GitHub Releases o instalador, `latest.yml` e arquivo `.blockmap`. Esses metadados são necessários às atualizações pelo `electron-updater`.

**Importante:** o updater precisa acessar as Releases. Para o fluxo entregue, o repositório deve ser público. Repositórios privados exigem uma arquitetura de distribuição/autenticação diferente; não armazene um token pessoal do GitHub dentro do executável.

## Como publicar as próximas atualizações

Suponha que sua próxima versão seja **0.1.1**:

1. Faça as mudanças no projeto (arquivos dentro de `src/`).
2. Altere `"version": "0.1.0"` para `"version": "0.1.1"` no `package.json` (se houver `package-lock.json`, atualize usando `npm install --package-lock-only`).
3. Publique as alterações e a tag:

```bash
git add .
git commit -m "orbi v0.1.1"
git push origin main
git tag v0.1.1
git push origin v0.1.1
```

4. Aguarde o workflow do GitHub publicar a Release `v0.1.1` com os metadados de update.
5. No orbi instalado, abra **Configurações > Verificar atualizações**. O aplicativo identifica a nova versão e exibe **Baixar atualização**; após o download, aparece **Reiniciar e instalar**.

O aplicativo também consulta atualizações ao iniciar, sem instalar silenciosamente. O usuário confirma o download e a instalação.

## Cuidados

- Use versões SemVer crescentes; uma tag `v0.1.2` deve corresponder à versão `0.1.2` do `package.json`.
- Preserve o mesmo `appId`, repositório GitHub e nome do produto para não quebrar o fluxo de atualização.
- Para distribuição real a terceiros, assine o instalador. Com assinatura, publique sempre usando a mesma identidade de desenvolvedor.
- O GitHub Actions requer acesso à internet e instalação das dependências durante a execução.
- Nada neste projeto foi copiado do código ou de recursos proprietários do Kobi.
