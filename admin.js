// FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCjzWUhc51InPA0jtMYarFKEs0thMF06M8",
    authDomain: "donaaldsnovo.firebaseapp.com",
    projectId: "donaaldsnovo"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// PREÇOS
const servicesData = {
    "Corte Social - R$ 30,00": 30,
    "Corte Degrade - R$ 40,00": 40,
    "Corte + Penteado - R$ 70,00": 70,
    "Barba - R$ 25,00": 25,
    "Pigmentação - R$ 15,00": 15,
    "Pezinho - R$ 15,00": 15,
    "Sobrancelha - R$ 15,00": 15,
    "Alisamento - R$ 40,00": 40,
    "Progressiva - a partir de R$ 80,00": 80,
    "Botox - a partir de R$ 80,00": 80,
    "Luzes - R$ 80,00": 80,
    "Mensal: Corte + Barba - R$ 240,00": 240,
    "Mensal: Corte - R$ 160,00": 160,
    "Mensal: Corte + Penteado + Barba - R$ 350,00": 350,
    "Mensal: Corte + Penteado - R$ 280,00": 280
};

// DATA HOJE
function hojeFormatado() {
    return new Date().toISOString().split("T")[0];
}

// TEMPO REAL 🔥
db.collection("agendamentos")
.orderBy("data")
.onSnapshot(snapshot => {

    const lista = document.getElementById("lista-agendamentos");

    let hoje = hojeFormatado();
    let totalDia = 0;
    let totalMes = 0;
    let faturamento = 0;

    lista.innerHTML = "";

    let agendamentos = [];

    snapshot.forEach(doc => {
        agendamentos.push({
            id: doc.id,
            ...doc.data()
        });
    });

    // 🔥 ORDENAÇÃO
    agendamentos.sort((a, b) => {
        const ordemStatus = {
            "pendente": 1,
            "finalizado": 2,
            "cancelado": 3
        };
        return ordemStatus[a.status || "pendente"] - ordemStatus[b.status || "pendente"];
    });

    // 🔥 RENDER
    agendamentos.forEach(ag => {

        const valor = (ag.servicos || []).reduce((acc, s) => acc + (servicesData[s] || 0), 0);

        // CONTADORES
        if (ag.data === hoje && ag.status !== "cancelado") {
            totalDia++;
        }

        if (ag.data && ag.data.slice(0,7) === hoje.slice(0,7) && ag.status === "finalizado") {
            totalMes++;
            faturamento += valor;
        }

        // 🔥 WHATSAPP
        const telefone = (ag.telefone || "").replace(/\D/g, "");

        const mensagem = encodeURIComponent(
`Olá ${ag.cliente}, tudo certo? 👋

Passando pra lembrar do seu horário 💈

📅 Data: ${ag.data.split('-').reverse().join('/')}
⏰ Horário: ${ag.horario}

Te esperamos! 🙌`
        );

        const linkWhats = telefone 
            ? `https://wa.me/${telefone}?text=${mensagem}`
            : "#";

        lista.innerHTML += `
            <div style="background:#222; padding:15px; margin-bottom:10px; border-radius:8px;">
                
                <strong>${ag.horario} - ${ag.cliente}</strong><br>
                <small>${ag.data.split('-').reverse().join('/')}</small>

                <p>${(ag.servicos || []).join(", ")}</p>

                <p style="color:gold;">R$ ${valor.toFixed(2)}</p>

                <span style="color:${corStatus(ag.status)}">
                    ● ${ag.status || "pendente"}
                </span>

                ${telefone ? `
                <a href="${linkWhats}" target="_blank" style="
                    display:inline-block;
                    margin-top:10px;
                    background:#25D366;
                    color:#fff;
                    padding:8px 12px;
                    border-radius:6px;
                    text-decoration:none;
                    font-size:14px;
                ">
                📲 Lembrar Cliente
                </a>
                ` : `
                <p style="color:#888; margin-top:10px;">
                    ⚠️ Cliente sem telefone
                </p>
                `}

                <div style="margin-top:10px;">
                    <button onclick="finalizar('${ag.id}')">Finalizar</button>
                    <button onclick="cancelar('${ag.id}')">Cancelar</button>
                    <button onclick="excluir('${ag.id}')">Excluir</button>
                </div>

            </div>
        `;
    });

    // DASHBOARD
    document.getElementById("cortes-dia").innerText = totalDia;
    document.getElementById("cortes-mes").innerText = totalMes;
    document.getElementById("faturamento-mes").innerText = "R$ " + faturamento.toFixed(2);

});

// STATUS
function corStatus(status) {
    if (status === "finalizado") return "lime";
    if (status === "cancelado") return "red";
    return "orange";
}

// AÇÕES
function finalizar(id) {
    db.collection("agendamentos").doc(id).update({
        status: "finalizado"
    });
}

function cancelar(id) {
    db.collection("agendamentos").doc(id).update({
        status: "cancelado"
    });
}

function excluir(id) {
    db.collection("agendamentos").doc(id).delete();
}

// BLOQUEAR DATA
function bloquearData() {
    const data = document.getElementById("block-date").value;

    if (!data) return alert("Escolha uma data");

    db.collection("bloqueios").doc(data).set({ data });
    alert("Dia bloqueado!");
}

// DESBLOQUEAR
function desbloquearData() {
    const data = document.getElementById("block-date").value;

    if (!data) return alert("Escolha uma data");

    db.collection("bloqueios").doc(data).delete();
    alert("Dia desbloqueado!");
}