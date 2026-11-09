# Tech & Code Summit

Portal acadêmico de evento de tecnologia com frontend responsivo e backend/API em Node.js, sem dependências externas.

## Executar

1. Instale o Node.js (versão 18 ou superior).
2. Na pasta do projeto, execute `npm start`.
3. Acesse `http://localhost:2000`.

O servidor usa estritamente a porta 2000. Se ela estiver ocupada, encerre o processo que a utiliza antes de iniciar o projeto.

## Integração frontend e backend

- `GET /api/event`: informações gerais do evento.
- `GET /api/tracks`: trilhas e perfis demonstrativos de palestrantes.
- `GET /api/schedule`: programação.
- `POST /api/registrations`: valida e registra uma inscrição em memória.
- `POST /api/payments/simulate`: aprova um pagamento simulado para uma inscrição válida.

As inscrições ficam apenas em memória e são perdidas quando o servidor é reiniciado. O pagamento não processa cobranças nem solicita informações bancárias.

## Personalização antes da entrega

- Atualize os integrantes, fotos e RAs reais em `public/equipe.html`.
- Os nomes e perfis de palestrantes são fictícios e precisam ser substituídos por pesquisa e informações referenciadas pelo grupo.
- Revise data, endereço, ingressos e programação conforme as definições do projeto.
- O mapa de `public/local.html` é ilustrativo.
