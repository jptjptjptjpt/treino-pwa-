# Guia de instalação e uso — app Treino (PWA)

O app de treino é um **PWA** (Progressive Web App): não está na Play Store/App Store —
você o "instala" a partir do navegador. Depois de instalado, ele abre em tela cheia,
com ícone próprio, como um app nativo.

Endereço: **https://SEU-DOMINIO/treino/**

> Troque `SEU-DOMINIO` pelo endereço onde o app está publicado (o mesmo host do wger).

---

## 1. Instalar no Android (Chrome)

1. Abra o **Chrome** e acesse `https://SEU-DOMINIO/treino/`
2. Faça login com seu usuário e senha
3. Toque no menu **⋮** (canto superior direito)
4. Toque em **"Instalar app"** ou **"Adicionar à tela inicial"**
5. Confirme — o ícone **Treino** aparece na sua tela inicial

> Observação: no Firefox para Android a instalação de PWA não é suportada — use o Chrome.

## 2. Instalar no iPhone/iPad (Safari)

1. Abra o **Safari** e acesse `https://SEU-DOMINIO/treino/`
2. Faça login com seu usuário e senha
3. Toque no botão **Compartilhar** (o quadrado com a seta para cima, na barra inferior)
4. Role a lista e toque em **"Adicionar à Tela de Início"**
5. Toque em **Adicionar** — o ícone **Treino** aparece na sua tela inicial

> No iOS, só o Safari faz a instalação correta do PWA.

---

## 3. Uso básico

### Tela inicial
- Lista dos seus treinos (cards). Toque no treino do dia para abrir.

### Durante o treino
- **Começar treino**: inicia o cronômetro geral (visível no topo).
- **Vídeo**: cada exercício mostra a execução — toque para dar play.
- **Marcar série (✓)**: confirma a série e dispara o **descanso regressivo**
  (barra inferior, em segundos). O cronômetro do exercício começa no primeiro ✓.
- **KG e REPS**: editáveis sempre — mesmo depois do ✓, é só corrigir o valor.
- **RIR**: quantas repetições "sobraram" (RIR 2 = podia fazer mais 2). Digite o
  número ou toque no **▾** para escolher na lista com descrições. Vazio = padrão 2.
  Toque no chip "RIR" ou no **ⓘ** do topo para ver a explicação completa.
- **Cardio (esteira)**: registre **tempo (min)** e **distância (km)**.

### Finalizar
- Toque em **Concluir**: o app consolida tudo no servidor (re-tenta o que falhou),
  fecha a sessão e mostra o resumo (duração, séries, volume).
- Se algo ficar pendente por falta de rede, o resumo avisa o que não foi gravado.

### Histórico
- A tela de histórico mostra os treinos anteriores, série por série.

---

## 4. Dicas

- O app funciona melhor **online** (os dados são salvos no servidor em tempo real).
- Para atualizar o app quando houver novidades: basta abrir/recarregar — ele se
  atualiza sozinho.
