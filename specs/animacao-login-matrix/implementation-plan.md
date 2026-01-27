# Plano de Implementação: Animação Matrix Rain no Login

## Visão Geral

Transformar a página de login do Axion Viewer de um layout centralizado simples para um layout split profissional com animação Matrix Rain no painel direito, remetendo a IA/tecnologia. O formulário de login não muda — apenas o layout ao redor e o painel visual novo.

## Fase 1: Componente MatrixRainCanvas

Criar o componente de animação Canvas 2D com efeito Matrix Rain.

### Tarefas

- [x] Criar `frontend/src/components/MatrixRainCanvas.jsx` [complexo]
  - [x] Canvas 2D com `requestAnimationFrame` throttled a 30 FPS
  - [x] Algoritmo de colunas com drops (posição Y por coluna)
  - [x] Caracteres aleatórios: letras, números, símbolos (`@#$%&*(){}[]|;:<>`)
  - [x] Caractere líder branco (`#ffffff`), trail em emerald (`#22c55e`)
  - [x] Fade via overlay `rgba(3,7,18,0.05)` a cada frame (cor do gray-950)
  - [x] `ResizeObserver` para redimensionar canvas responsivamente
  - [x] Suporte a `devicePixelRatio` para telas Retina
  - [x] `aria-hidden="true"` para acessibilidade
  - [x] Cleanup no `useEffect` return: `cancelAnimationFrame` + `observer.disconnect`
  - [x] Props: `className`, `fontSize=14`, `color='#22c55e'`, `fps=30`, `fadeOpacity=0.05`

### Detalhes Técnicos

**Arquivo:** `frontend/src/components/MatrixRainCanvas.jsx`

**Algoritmo do Matrix Rain:**
```
1. Dividir canvas em colunas (largura = fontSize, ~14px)
2. Cada coluna tem um "drop" (posição Y do último caractere)
3. A cada frame:
   a. Desenhar retângulo semi-transparente sobre tudo (fade effect)
   b. Para cada coluna: desenhar caractere aleatório na posição do drop
   c. Caractere líder = branco, anterior = cor principal (emerald)
   d. Avançar drop para baixo
   e. Quando drop sai da tela: resetar com probabilidade aleatória (Math.random() > 0.975)
4. Início escalonado: drops começam em posições negativas aleatórias
```

**Throttle de FPS:**
```javascript
const frameInterval = 1000 / fps; // 33.3ms para 30fps
if (timestamp - lastTime < frameInterval) return;
lastTime = timestamp;
```

**Resize com devicePixelRatio:**
```javascript
function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);
  columns = Math.floor(canvas.offsetWidth / fontSize);
  drops = Array.from({ length: columns }, () => Math.random() * -100);
}
```

**Caracteres disponíveis:**
```javascript
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*(){}[]|;:<>?/\\~^!+=_-';
```

---

## Fase 2: Layout Split no LoginPage

Modificar o LoginPage para layout split responsivo com o painel de animação.

### Tarefas

- [x] Modificar `frontend/src/pages/LoginPage.jsx` [complexo]
  - [x] Importar `MatrixRainCanvas`
  - [x] Trocar container de centralizado para `flex min-h-screen`
  - [x] Painel esquerdo: `flex w-full lg:w-1/2 items-center justify-center bg-gray-50 px-4`
  - [x] Painel direito: `relative hidden overflow-hidden bg-gray-950 lg:flex lg:w-1/2 items-center justify-center`
  - [x] MatrixRainCanvas com `className="absolute inset-0"`
  - [x] Branding overlay com `relative z-10`: título "Axion Viewer" + tagline
  - [x] Formulário de login: lógica 100% inalterada

### Detalhes Técnicos

**Arquivo:** `frontend/src/pages/LoginPage.jsx`

**Estrutura JSX resultante:**
```jsx
<div className="flex min-h-screen">
  {/* Painel Esquerdo - Formulário */}
  <div className="flex w-full flex-col items-center justify-center bg-gray-50 px-4 lg:w-1/2">
    <div className="w-full max-w-sm">
      {/* Header com título (existente) */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Axion Viewer</h1>
        <p className="mt-2 text-sm text-gray-600">Entre com suas credenciais</p>
      </div>
      {/* Form (existente, sem mudanças) */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {/* campos email, senha, botão — inalterados */}
      </form>
    </div>
  </div>

  {/* Painel Direito - Animação (hidden no mobile) */}
  <div className="relative hidden overflow-hidden bg-gray-950 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
    <MatrixRainCanvas className="absolute inset-0" />

    {/* Branding Overlay */}
    <div className="relative z-10 max-w-md px-8 text-center">
      <div className="mb-4 text-4xl font-bold tracking-tight text-white">
        Axion<span className="text-emerald-400"> Viewer</span>
      </div>
      <p className="text-lg text-gray-400">
        Relatórios jurídicos inteligentes
      </p>
      <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-500">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Conversão automática
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Templates profissionais
      </div>
    </div>
  </div>
</div>
```

**Responsividade:**

| Breakpoint | Comportamento |
|---|---|
| < 1024px (mobile/tablet) | Formulário ocupa 100%, painel animação oculto (`hidden`) |
| >= 1024px (desktop) | Split 50/50, animação visível (`lg:flex lg:w-1/2`) |

---

## Fase 3: Verificação

Executar lint, format e build para garantir que tudo funciona.

### Tarefas

- [x] Executar `cd frontend && pnpm lint`
- [x] Executar `cd frontend && pnpm format`
- [x] Executar `cd frontend && pnpm build`
- [ ] Verificar visualmente: `pnpm dev` e testar em desktop e mobile

### Detalhes Técnicos

```bash
# Lint
cd /home/marcos/projetos/axion-viewer/frontend && pnpm lint

# Format
cd /home/marcos/projetos/axion-viewer/frontend && pnpm format

# Build
cd /home/marcos/projetos/axion-viewer/frontend && pnpm build
```

**Checklist visual:**
- Desktop (>=1024px): split 50/50 visível, animação rodando, branding legível
- Mobile (<1024px): apenas formulário, sem painel direito
- Login funcional: campos preenchíveis, botão clicável, redirect após login
- Performance: animação suave sem travar UI
