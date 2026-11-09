const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const PORT = 2000;
const PUBLIC_DIR = path.join(__dirname, "public");
const registrations = new Map();
const payments = new Map();

const event = {
  name: "Tech & Code Summit",
  date: "18 e 19 de setembro de 2027",
  location: "Centro de Convenções de Campinas — Campinas, SP",
  description:
    "Dois dias para conectar pessoas, ideias e tecnologias que estão construindo o futuro.",
  expectedAudience: "2.000 participantes",
};

const tracks = [
  {
    slug: "engenharia-de-software",
    name: "Engenharia de Software",
    icon: "⌘",
    description:
      "Arquitetura, qualidade, DevOps e práticas para criar sistemas confiáveis em escala.",
    speakers: [
      { name: "Marina Costa", role: "Arquiteta de Software", talk: "Arquiteturas evolutivas na prática" },
      { name: "Rafael Nunes", role: "Staff Engineer", talk: "Entrega contínua sem sustos" },
    ],
  },
  {
    slug: "inteligencia-artificial",
    name: "Inteligência Artificial",
    icon: "✳",
    description:
      "Aprendizado de máquina, IA generativa e aplicações responsáveis que resolvem problemas reais.",
    speakers: [
      { name: "Camila Rocha", role: "Pesquisadora em IA", talk: "IA generativa além do hype" },
      { name: "Pedro Alves", role: "Cientista de Dados", talk: "Do protótipo ao modelo em produção" },
    ],
  },
  {
    slug: "mobile",
    name: "Mobile",
    icon: "▯",
    description:
      "Experiências mobile acessíveis, multiplataforma e preparadas para milhões de pessoas.",
    speakers: [
      { name: "Luiza Martins", role: "Engenheira Mobile", talk: "Aplicativos rápidos e inclusivos" },
      { name: "André Lima", role: "Líder de Produto", talk: "Design systems entre plataformas" },
    ],
  },
  {
    slug: "embarcados-e-iot",
    name: "Embarcados & IoT",
    icon: "⌁",
    description:
      "Sensores, dispositivos conectados e sistemas embarcados para cidades e indústrias inteligentes.",
    speakers: [
      { name: "Bianca Ferreira", role: "Engenheira de Sistemas Embarcados", talk: "IoT com eficiência energética" },
      { name: "Diego Santos", role: "Especialista em IoT", talk: "Do sensor à nuvem com segurança" },
    ],
  },
];

const schedule = [
  { day: "18 de setembro", time: "08:30", title: "Credenciamento e café de boas-vindas", type: "Experiência", stage: "Foyer" },
  { day: "18 de setembro", time: "09:30", title: "Abertura — tecnologia que transforma", type: "Palestra", stage: "Palco Horizonte" },
  { day: "18 de setembro", time: "10:30", title: "Arquiteturas evolutivas na prática", type: "Palestra", stage: "Palco Horizonte" },
  { day: "18 de setembro", time: "13:30", title: "IA generativa além do hype", type: "Palestra", stage: "Palco Inovação" },
  { day: "18 de setembro", time: "15:00", title: "Workshop: primeiros passos com IoT", type: "Workshop", stage: "Lab Maker" },
  { day: "19 de setembro", time: "09:00", title: "Aplicativos rápidos e inclusivos", type: "Palestra", stage: "Palco Horizonte" },
  { day: "19 de setembro", time: "10:30", title: "Do sensor à nuvem com segurança", type: "Palestra", stage: "Palco Inovação" },
  { day: "19 de setembro", time: "13:30", title: "Minicurso: deploy de aplicações web", type: "Minicurso", stage: "Lab Dev" },
  { day: "19 de setembro", time: "16:00", title: "Construindo o futuro em comunidade", type: "Painel", stage: "Palco Horizonte" },
];

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Requisição muito grande."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("JSON inválido."));
      }
    });
    request.on("error", reject);
  });
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/event") {
    return sendJson(response, 200, event);
  }
  if (request.method === "GET" && pathname === "/api/tracks") {
    return sendJson(response, 200, tracks);
  }
  if (request.method === "GET" && pathname === "/api/schedule") {
    return sendJson(response, 200, schedule);
  }
  if (request.method === "POST" && pathname === "/api/registrations") {
    let data;
    try {
      data = await readJson(request);
    } catch (error) {
      return sendJson(response, 400, { error: error.message });
    }
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim() : "";
    const lot = typeof data.lot === "string" ? data.lot : "";
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["estudante", "geral"].includes(lot)) {
      return sendJson(response, 400, { error: "Informe nome, e-mail válido e um lote disponível." });
    }
    const id = randomUUID();
    registrations.set(id, { id, name, email, lot, createdAt: new Date().toISOString() });
    return sendJson(response, 201, { registrationId: id });
  }
  if (request.method === "POST" && pathname === "/api/payments/simulate") {
    let data;
    try {
      data = await readJson(request);
    } catch (error) {
      return sendJson(response, 400, { error: error.message });
    }
    const registration = registrations.get(data.registrationId);
    if (!registration) {
      return sendJson(response, 404, { error: "Inscrição não encontrada. Faça uma nova inscrição." });
    }
    const paymentId = randomUUID();
    payments.set(paymentId, { paymentId, registrationId: registration.id, status: "aprovado" });
    return sendJson(response, 200, { paymentId, status: "aprovado" });
  }
  return sendJson(response, 404, { error: "Rota da API não encontrada." });
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

function serveStatic(request, response, pathname) {
  let relativePath = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (!relativePath || relativePath.endsWith("/")) relativePath += "index.html";
  const filePath = path.resolve(PUBLIC_DIR, relativePath);
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    response.writeHead(403);
    return response.end("Acesso negado.");
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
      return response.end(error.code === "ENOENT" ? "Página não encontrada." : "Erro ao carregar a página.");
    }
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(request, response, url.pathname).catch((error) => {
      console.error("Erro na API:", error);
      if (!response.headersSent) sendJson(response, 500, { error: "Erro interno ao processar a solicitação." });
    });
    return;
  }
  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET" });
    return response.end("Método não permitido.");
  }
  serveStatic(request, response, url.pathname);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Tech & Code Summit disponível em http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error(`Não foi possível iniciar o servidor na porta ${PORT}: ${error.message}`);
  process.exitCode = 1;
});
