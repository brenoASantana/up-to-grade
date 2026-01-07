import open from "open";

const url = process.argv[2] || "http://localhost:5173";

try {
  await open(url);
} catch (err) {
  console.error("Falha ao abrir o navegador:", err?.message || err);
  process.exit(1);
}
