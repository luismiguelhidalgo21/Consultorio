// Variables globales
const questions = document.querySelectorAll('.text-question');
const prevBtn = document.getElementById('prev-text-btn');
const nextBtn = document.getElementById('next-text-btn');
const submitBtn = document.getElementById('submit-text-btn');
let currentQuestion = 0;
const totalQuestions = questions.length;
const testAnswers = [];

// Inicialización del test
function initTest() {
    showQuestion(currentQuestion);
    updateButtons();
}

// Mostrar pregunta actual
function showQuestion(index) {
    questions.forEach((question, i) => {
        question.classList.toggle('hidden', i !== index);
        question.classList.toggle('active-question', i === index);
    });
}

// Actualizar botones de navegación
function updateButtons() {
    prevBtn.disabled = currentQuestion === 0;
    nextBtn.classList.toggle('hidden', currentQuestion === totalQuestions - 1);
    submitBtn.classList.toggle('hidden', currentQuestion !== totalQuestions - 1);
}

// Navegación entre preguntas
nextBtn.addEventListener('click', () => {
    const currentAnswer = questions[currentQuestion].querySelector('textarea').value.trim();
    
    if (currentQuestion === 0 && currentAnswer.length < 3) {
        alert('Por favor ingresa tu nombre completo (mínimo 3 caracteres)');
        return;
    }
    
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

// Generar PDF y manejar resultados
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

// Función para generar PDF
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const patientName = questions[0].querySelector('textarea').value.trim() || "Anónimo";
    
    // Encabezado
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Análisis de Bienestar Emocional', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Paciente: ${patientName}`, 15, 25);
    
    // Fecha
    const today = new Date();
    doc.text(`Fecha: ${today.toLocaleDateString('es-ES')}`, 160, 25);
    
    // Contenido
    doc.setTextColor(23, 23, 23);
    let yPosition = 40;
    
    // Mostrar solo las respuestas del test (omitir datos personales)
    testAnswers.slice(1).forEach((item, index) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${item.question}`, 15, yPosition);
        yPosition += 7;
        
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(item.answer, 180);
        doc.text(splitText, 20, yPosition);
        yPosition += (splitText.length * 5) + 12;
        
        if (yPosition > 270) doc.addPage();
    });
    
    // Pie de página
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Documento generado automáticamente. Para evaluación profesional consulte a un especialista.', 
             15, doc.internal.pageSize.height - 10);
    
    // Mostrar modal con opciones
    showPdfModal(doc, patientName);
}

// Mostrar modal con opciones de PDF
function showPdfModal(doc, patientName) {
    const modal = document.getElementById('pdf-modal');
    const modalFooter = modal.querySelector('.modal-footer');
    
    // Previsualización del PDF
    const pdfOutput = doc.output('datauristring');
    document.getElementById('pdf-preview').innerHTML = `
        <iframe src="${pdfOutput}" class="w-full h-full border-0"></iframe>
    `;
    
    // Configurar botones
    modalFooter.innerHTML = `
        <button id="download-pdf" class="btn-primary">
            Descargar PDF
        </button>
        <button id="email-pdf" class="btn-accent">
            Enviar por Email
        </button>
    `;
    
    // Eventos de los botones
    document.getElementById('download-pdf').addEventListener('click', () => {
        doc.save(`Bienestar_Emocional_${patientName.replace(/ /g, '_')}.pdf`);
    });
    
    document.getElementById('email-pdf').addEventListener('click', () => {
        sendTestResultsByEmail(doc, patientName);
    });
    
    // Mostrar modal
    modal.classList.remove('hidden');
    
    // Cerrar modal
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
}

// Enviar resultados por email
async function sendTestResultsByEmail(doc, patientName) {
    try {
        const patientEmail = prompt("Ingresa tu email para recibir los resultados:");
        
        if (!patientEmail || !/^\S+@\S+\.\S+$/.test(patientEmail)) {
            alert('Por favor ingresa un email válido');
            return;
        }
        
        // Crear PDF como archivo adjunto
        const pdfOutput = doc.output('datauristring');
        const pdfBlob = dataURItoBlob(pdfOutput);
        const pdfFile = new File([pdfBlob], `Bienestar_Emocional_${patientName}.pdf`, { type: 'application/pdf' });
        
        // Mostrar loader
        const emailBtn = document.getElementById('email-pdf');
        const originalText = emailBtn.innerHTML;
        emailBtn.innerHTML = 'Enviando...';
        emailBtn.disabled = true;
        
        // Enviar email
        await emailjs.send(
            window.env.EMAILJS_SERVICE_ID,
            window.env.EMAILJS_TEST_TEMPLATE_ID,
            {
                patient_name: patientName,
                patient_email: patientEmail,
                answers: formatAnswersForEmail(),
                pdf_file: pdfFile
            }
        );
        
        alert('✅ Resultados enviados. Revisa tu bandeja de entrada.');
    } catch (error) {
        console.error('Error al enviar email:', error);
        alert('❌ Error al enviar. Por favor intenta nuevamente.');
    } finally {
        emailBtn.innerHTML = originalText;
        emailBtn.disabled = false;
    }
}

// Formatear respuestas para email
function formatAnswersForEmail() {
    return testAnswers.slice(1).map((item, index) => `
        <p><strong>${index + 1}. ${item.question}</strong></p>
        <p style="margin-left: 20px; color: #555;">${item.answer}</p>
        <br>
    `).join('');
}

// Convertir DataURI a Blob
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
}

// Manejar envío de formulario de contacto
document.querySelector('#contacto form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const formData = {
        name: form.querySelector('input[type="text"]').value,
        email: form.querySelector('input[type="email"]').value,
        message: form.querySelector('textarea').value,
        to_email: window.env.DEFAULT_EMAIL,
        site_name: window.env.SITE_NAME
    };
    
    try {
        // Validación básica
        if (!formData.name || !formData.email || !formData.message) {
            throw new Error('Por favor completa todos los campos');
        }
        
        // Mostrar loader
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Enviando...';
        submitBtn.disabled = true;
        
        // Enviar solicitud
        await emailjs.send(
            window.env.EMAILJS_SERVICE_ID,
            window.env.EMAILJS_APPOINTMENT_TEMPLATE_ID,
            formData
        );
        
        alert('✅ Solicitud enviada. Nos pondremos en contacto contigo pronto.');
        form.reset();
    } catch (error) {
        console.error('Error al enviar solicitud:', error);
        alert(`❌ Error al enviar: ${error.message}`);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Iniciar test al cargar
document.addEventListener('DOMContentLoaded', initTest);