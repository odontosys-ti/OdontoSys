# Guia de Padrões de UI/UX — OdontoSys (Apple HIG)

Este guia estabelece os padrões visuais, a biblioteca de componentes e as convenções de experiência do usuário (UX) do **OdontoSys**, inspirados nas diretrizes do **Apple Human Interface Guidelines (HIG)**.

Todos os incrementos futuros (US-01 a US-08) devem utilizar exclusivamente estes componentes e regras de layout para assegurar consistência, minimalismo e elegância.

---

## 1. Princípios de Design

1. **Clareza e Legibilidade (Clarity)**:
   - Fundo neutro suave (`#F5F5F7`), superfícies brancas com sombras sutis (`shadow-card`) e divisores tênues (`border-black/5`).
   - Hierarquia visual limpa com tipografia no padrão do sistema (`SF Pro / system-ui`).
2. **Profundidade e Transluscência (Depth & Translucency)**:
   - Barras de navegação superiores com efeito de vidro fosco (`backdrop-blur-xl bg-white/80`).
   - Modais com desfoque de fundo suave (`bg-black/25 backdrop-blur-xs`).
3. **Harmonia Semântica de Cores (Apple Tints)**:
   - **Cor Primária / Destaque**: Azul Apple (`#0071E3`, hover `#0077ED`, active `#0058B0`, fundo suave `#F0F7FF`).
   - **Sucesso / Agendado**: Verde Apple (`#34C759`, badge `bg-emerald-50 text-emerald-700`).
   - **Cancelado / Inativo**: Cinza neutro (`bg-zinc-100 text-zinc-600`).
   - **Alerta / Erro**: Vermelho Apple (`#FF3B30`, badge `bg-red-50 text-red-700`).
   - **Avisos / Recepção**: Âmbar Apple (`#FF9500`, badge `bg-amber-50 text-amber-800`).
   - **Administração**: Roxo Apple (`#AF52DE`, badge `bg-purple-50 text-purple-700`).
4. **Micro-interações e Feedback**:
   - Feedback tátil com `active:scale-[0.98]` e transições suaves (`transition-all duration-150`).
5. **Responsividade Universal**:
   - Desktop: Barra de navegação em pílulas com menu segmentado.
   - Tablet / Mobile: Layout flexível com navegação inferior tátil (bottom navigation bar).

---

## 2. Biblioteca de Componentes (`shared/ui`)

### 2.1. Superfícies e Estrutura
- **`Card`**: Superfície branca padrão com cantos arredondados contínuos (`rounded-2xl`).
- **`CardHeader`**, **`CardTitle`**, **`CardDescription`**, **`CardContent`**: Para estruturação modular de blocos.
- **`PageHeader`**: Cabeçalho de página padronizado com `titulo`, `subtitulo` e slot de botões de ação (`acao`).

```tsx
<PageHeader
  titulo="Pacientes"
  subtitulo="Gestão cadastral de prontuários da clínica"
  acao={<Button>Novo paciente</Button>}
/>
```

### 2.2. Ações e Botões
- **`Button`**:
  - `variant="primary"` (padrão): Ação principal com destaque azul Apple.
  - `variant="secondary"`: Ação secundária em cinza sutil.
  - `variant="danger"`: Ações destrutivas com confirmação (ex: Cancelar agendamento).
  - `variant="ghost"`: Links de ação limpos sem borda.
  - `variant="outline"`: Botões com borda fina neutra.
  - `size="sm" | "md" | "lg"`.

### 2.3. Formulários e Entradas
- **`Input`**: Campo de texto com `rounded-xl`, borda suave e anel de foco azul Apple (`focus:ring-brand-500/15`).
- **`Select`**: Seleção nativa estilizada com os mesmos padrões do input.

### 2.4. Badges e Indicadores de Status
- **`Badge`**: Pílula com `variant="neutral" | "success" | "danger" | "warning" | "info" | "purple"`.
- **`StatusBadge`**: Componente especializado que mapeia status de domínio (`AGENDADO` com pulso verde, `CANCELADO`) e papéis (`ADMIN`, `DENTISTA`, `RECEPCAO`).

```tsx
<StatusBadge status="AGENDADO" />
<StatusBadge status="ADMIN" />
```

### 2.5. Tabelas e Listagens
- **`Table`**: Tabela encapsulada em card com cantos arredondados, cabeçalho sutil (`bg-black/[0.015]`), linhas com hover e separadores suaves.

### 2.6. Modais e Diálogos
- **`Modal`**: Caixa de diálogo centralizada com `titulo`, `descricao`, botão de fechar, backdrop blur e animação de entrada.

### 2.7. Estados Visuais Obrigatórios
Toda tela com busca ou carregamento assíncrono DEVE tratar os 3 estados:
- **`Spinner`**: Indicador circular limpo de carregamento.
- **`EmptyState`**: Exibido quando a consulta retorna 0 registros, contendo ícone sutil, mensagem, subtítulo e botão de ação sugerida.
- **`ErrorState`**: Caixa de aviso acessível (`role="alert"`) com ícone e mensagem amigável ao usuário.

---

## 3. Checklist de UI para Futuras Estórias (US-01 a US-08)

Ao criar uma nova tela ou recurso:
- [ ] Usar `PageHeader` para o título e ações principais da tela.
- [ ] Envolver listagens em `Table` ou `Card`.
- [ ] Utilizar `StatusBadge` para exibir qualquer status de agendamento ou papel de usuário.
- [ ] Tratar `isLoading` (`<Spinner />`), `isError` (`<ErrorState />`) e lista vazia (`<EmptyState />`).
- [ ] Formulários de criação/edição em `Modal` ou página dedicada com botões `Cancelar` (ghost) e `Salvar` (primary).
- [ ] Testar a interface em 3 larguras: Celular (375px), Tablet (768px) e Desktop (1280px).
