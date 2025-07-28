// Variables globales
const questions = document.querySelectorAll('.text-question');
const prevBtn = document.getElementById('prev-text-btn');
const nextBtn = document.getElementById('next-text-btn');
const submitBtn = document.getElementById('submit-text-btn');
let currentQuestion = 0;
const totalQuestions = questions.length;
const testAnswers = [];

// Inicialización
function initTest() {
    showQuestion(currentQuestion);
    updateButtons();
}

// Mostrar pregunta actual
function showQuestion(index) {
    questions.forEach((question, i) => {
        question.classList.add('hidden');
        question.classList.remove('active-question');
        if (i === index) {
            question.classList.remove('hidden');
            question.classList.add('active-question');
            // Animación suave
            question.style.opacity = '0';
            question.style.transform = 'translateY(10px)';
            setTimeout(() => {
                question.style.opacity = '1';
                question.style.transform = 'translateY(0)';
            }, 10);
        }
    });
}

// Actualizar estado de los botones
function updateButtons() {
    prevBtn.disabled = currentQuestion === 0;
    nextBtn.classList.toggle('hidden', currentQuestion === totalQuestions - 1);
    submitBtn.classList.toggle('hidden', currentQuestion !== totalQuestions - 1);
}

// Navegación
nextBtn.addEventListener('click', () => {
    const currentAnswer = questions[currentQuestion].querySelector('textarea').value.trim();
    
    if (!currentAnswer) {
        alert('Por favor escribe tu respuesta antes de continuar.');
        return;
    }
    
    testAnswers.push({
        question: questions[currentQuestion].querySelector('p').textContent,
        answer: currentAnswer
    });
    
    currentQuestion++;
    showQuestion(currentQuestion);
    updateButtons();
});

prevBtn.addEventListener('click', () => {
    currentQuestion--;
    showQuestion(currentQuestion);
    updateButtons();
});

// Generar PDF
submitBtn.addEventListener('click', () => {
    const currentAnswer = questions[currentQuestion].querySelector('textarea').value.trim();
    
    if (!currentAnswer) {
        alert('Por favor escribe tu respuesta antes de finalizar.');
        return;
    }
    
    testAnswers.push({
        question: questions[currentQuestion].querySelector('p').textContent,
        answer: currentAnswer
    });
    
    generatePDF();
});

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración inicial
    doc.setFont('helvetica');
    doc.setTextColor(23, 23, 23);
    
    // Encabezado
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Análisis de Bienestar Emocional', 105, 20, { align: 'center' });
    
    // Información del paciente
    doc.setTextColor(23, 23, 23);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const today = new Date();
    doc.text(`Fecha: ${today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, 15, 45);
    
    // Resultados
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Respuestas:', 15, 55);
    
    let yPosition = 65;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    testAnswers.forEach((item, index) => {
        // Pregunta
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${item.question}`, 15, yPosition);
        yPosition += 7;
        
        // Respuesta
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(item.answer, 180);
        doc.text(splitText, 20, yPosition);
        yPosition += (splitText.length * 5) + 10;
        
        // Salto de página si es necesario
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
    });
    
    // Observaciones
    doc.setFontSize(10);
    doc.text('* Este documento es un registro personal y no sustituye una evaluación profesional.', 15, yPosition + 10);
    
    // Mostrar preview del PDF
    const pdfOutput = doc.output('datauristring');
    document.getElementById('pdf-preview').innerHTML = `
        <iframe src="${pdfOutput}" class="w-full h-full border-0"></iframe>
    `;
    
    // Mostrar modal
    const modal = document.getElementById('pdf-modal');
    modal.classList.remove('hidden');
    
    // Descargar PDF
    document.getElementById('download-pdf').addEventListener('click', () => {
        doc.save('Analisis_Bienestar_Emocional.pdf');
    });
    
    // Cerrar modal
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

// Iniciar test al cargar
document.addEventListener('DOMContentLoaded', initTest);