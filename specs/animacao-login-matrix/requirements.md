# Requisitos: Animação Matrix Rain no Login

## Descrição

Adicionar uma animação estilo "Matrix Rain" (chuva de caracteres ASCII) no painel direito da página de login, transformando o layout atual (centralizado) em um layout split profissional que remete a IA/tecnologia. O formulário de login permanece intacto no lado esquerdo.

## Critérios de Aceitação

- [ ] Layout split 50/50 no desktop (>=1024px): formulário à esquerda, animação à direita
- [ ] Mobile (<1024px): apenas formulário visível (comportamento atual preservado)
- [ ] Animação Matrix Rain com caracteres caindo continuamente em Canvas 2D
- [ ] Cor principal emerald (#22c55e) com caractere líder branco
- [ ] Fundo escuro (gray-950) no painel da animação
- [ ] Branding "Axion Viewer" sobreposto à animação com tagline
- [ ] Animação roda a 30 FPS sem impacto perceptível na performance
- [ ] Cleanup completo ao desmontar componente (sem memory leaks)
- [ ] Canvas acessível com `aria-hidden="true"`
- [ ] Formulário de login funciona identicamente ao atual (sem regressões)
- [ ] Lint e format passam sem erros

## Dependências

- React 19 (já instalado)
- Tailwind CSS v4 (já instalado)
- Canvas 2D API (nativa do browser)

## Features Relacionadas

- LoginPage existente (`frontend/src/pages/LoginPage.jsx`)
- AuthContext (`frontend/src/contexts/AuthContext.jsx`)
- Sistema de testes Vitest (`frontend/vitest.config.js`)
