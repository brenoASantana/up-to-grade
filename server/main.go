package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

type PlayerData struct {
	Username string `json:"username"`
	Level    int    `json:"level"`
	XP       int    `json:"xp"`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func saveHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Configuração de CORS (Essencial para o navegador permitir a chamada)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		return
	}

	// 2. Só aceitamos POST
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// 3. Decodificar o que o jogo enviou
	var data PlayerData
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Erro ao ler JSON", http.StatusBadRequest)
		return
	}

	// 4. Aqui você simularia o salvamento num DB
	fmt.Printf(" [BACKSTAGE] Progresso recebido! Usuário: %s | XP: %d | Nível: %d\n",
		data.Username, data.XP, data.Level)

	// 5. Responder ao jogo
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "sucesso"})
}

func main() {
	http.HandleFunc("/api/save", saveHandler)
	http.HandleFunc("/health", healthHandler)

	// Servir arquivos estáticos do build do Vite (../dist)
	fs := http.FileServer(http.Dir("../dist"))
	http.Handle("/", fs)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("🚀 Servidor Go rodando em http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
