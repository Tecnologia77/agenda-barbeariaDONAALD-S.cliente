// FIREBASE 
const firebaseConfig = {
    apiKey: "SUA_KEY",
    authDomain: "donaaldsnovo.firebaseapp.com",
    projectId: "donaaldsnovo"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// SERVIÇOS
const servicesData = {
    "Corte Social - R$ 30,00": 30.00,
    "Corte Degrade - R$ 40,00": 40.00,
    "Corte + Penteado - R$ 70,00": 70.00,
    "Barba - R$ 25,00": 25.00,
    "Pigmentação - R$ 15,00": 15.00,
    "Pezinho - R$ 15,00": 15.00,
    "Sobrancelha - R$ 15,00": 15.00,
    "Alisamento - R$ 40,00": 40.00,
    "Progressiva - a partir de R$ 80,00": 80.00,
    "Botox - a partir de R$ 80,00": 80.00,
    "Luzes - R$ 80,00": 80.00,
    "Mensal: Corte + Barba - R$ 240,00": 240.00,
    "Mensal: Corte - R$ 160,00": 160.00,
    "Mensal: Corte + Penteado + Barba - R$ 350,00": 350.00,
    "Mensal: Corte + Penteado - R$ 280,00": 280.00
};

let selectedServices = [];
let selectedHour = "";

// 🔥 AUTO COLOCAR 55 NO TELEFONE
window.addEventListener("DOMContentLoaded", () => {
    const inputTel = document.getElementById("client-phone");

    if (inputTel) {
        inputTel.value = "55";

        inputTel.addEventListener("input", () => {
            let valor = inputTel.value.replace(/\D/g, "");

            if (!valor.startsWith("55")) {
                valor = "55" + valor;
            }

            inputTel.value = valor;
        });
    }
});

// RENDER SERVIÇOS
function renderServices() {
    const grid = document.getElementById("services-grid");

    Object.keys(servicesData).forEach(name => {
        const div = document.createElement("div");
        div.className = "service-item";
        div.innerText = name;

        div.onclick = () => {
            div.classList.toggle("selected");

            if (selectedServices.includes(name)) {
                selectedServices = selectedServices.filter(s => s !== name);
            } else {
                selectedServices.push(name);
            }

            updateFooter();
        };

        grid.appendChild(div);
    });
}

function updateFooter() {
    const total = selectedServices.reduce((sum, s) => sum + servicesData[s], 0);

    document.getElementById("items-count").innerText = selectedServices.length + " itens";
    document.getElementById("total-price").innerText = "R$ " + total;
}

// NAVEGAÇÃO
function nextStep(step) {

    if (step === 3) {
        const data = document.getElementById("date-picker").value;

        if (!data) {
            alert("Escolha uma data");
            return;
        }

        selectedHour = "";
        renderizarHorarios();
    }

    if (step === 4) {
        if (!selectedHour) {
            alert("Escolha um horário");
            return;
        }

        renderSummary();
    }

    document.querySelectorAll(".step-container").forEach(s => s.classList.remove("active"));
    document.getElementById("step" + step).classList.add("active");

    document.getElementById("progress").style.width = (step * 25) + "%";
}

function prevStep(step) {
    nextStep(step);
}

// HORÁRIOS
function renderizarHorarios() {
    const grid = document.getElementById('hours-grid');
    const dataSelecionada = document.getElementById('date-picker').value;

    grid.innerHTML = "Carregando...";

    db.collection("bloqueios").doc(dataSelecionada).get().then(doc => {

        if (doc.exists) {
            grid.innerHTML = "<p style='text-align:center;'>❌ Dia indisponível</p>";
            return;
        }

        const horarios = [
            "09:30", "10:30", "11:30", "12:30",
            "13:30", "14:30", "15:30", "16:30",
            "17:30", "18:30"
        ];

        db.collection("agendamentos")
        .where("data", "==", dataSelecionada)
        .get()
        .then(snapshot => {

            const ocupados = snapshot.docs.map(doc => doc.data().horario);

            grid.innerHTML = "";

            horarios.forEach(h => {

                const btn = document.createElement("button");
                btn.className = "hour-btn";
                btn.innerText = h;

                if (ocupados.includes(h)) {
                    btn.disabled = true;
                } else {
                    btn.onclick = () => selecionarHorario(btn, h);
                }

                grid.appendChild(btn);
            });

        });

    });
}

function selecionarHorario(el, horario) {
    document.querySelectorAll(".hour-btn").forEach(b => b.classList.remove("selected"));
    el.classList.add("selected");
    selectedHour = horario;
}

// RESUMO
function renderSummary() {
    const data = document.getElementById("date-picker").value;

    document.getElementById("summary").innerHTML = `
        <p>Serviços: ${selectedServices.join(", ")}</p>
        <p>Data: ${data.split("-").reverse().join("/")}</p>
        <p>Hora: ${selectedHour}</p>
    `;
}

// LIMITAR DATAS
function limitarDatas() {
    const input = document.getElementById("date-picker");

    const hoje = new Date();
    const max = new Date();
    max.setDate(hoje.getDate() + 15);

    const formatar = (d) => d.toISOString().split("T")[0];

    input.min = formatar(hoje);
    input.max = formatar(max);
}

limitarDatas();

// FINALIZAR + WHATSAPP 🔥
document.getElementById("btn-finish").onclick = () => {

    const nome = document.getElementById("client-name").value;
    const telefone = document.getElementById("client-phone").value; // 🔥 NOVO
    const data = document.getElementById("date-picker").value;

    if (!nome) return alert("Digite seu nome");
    if (!telefone || telefone.length < 12) return alert("Digite um WhatsApp válido");

    db.collection("agendamentos").add({
        status: "pendente",
        cliente: nome,
        telefone: telefone, // 🔥 SALVA NO FIREBASE
        servicos: selectedServices,
        data: data,
        horario: selectedHour
    })
    .then(() => {

        // 🔥 WHATSAPP AUTOMÁTICO
        const numeroBarbeiro = "5511981420332";

        const dataFormatada = data.split("-").reverse().join("/");

        const mensagem = `💈 *NOVO AGENDAMENTO* 💈

👤 Cliente: ${nome}
📱 WhatsApp: ${telefone}
📅 Data: ${dataFormatada}
⏰ Horário: ${selectedHour}
✂️ Serviços: ${selectedServices.join(", ")}

✅ Agendado pelo site`;

        const mensagemURL = encodeURIComponent(mensagem);

        window.open(`https://wa.me/${numeroBarbeiro}?text=${mensagemURL}`, "_blank");

        alert("Agendamento realizado!");

        location.reload();
    });
};

renderServices();