// Notes JavaScript

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/';
}

// DOM Elements
const welcomeUser = document.getElementById('welcomeUser');
const logoutBtn = document.getElementById('logoutBtn');
const createNoteBtn = document.getElementById('createNoteBtn');
const accessNoteBtn = document.getElementById('accessNoteBtn');

// Modals
const createNoteModal = document.getElementById('createNoteModal');
const accessNoteModal = document.getElementById('accessNoteModal');
const savePdfModal = document.getElementById('savePdfModal');

// Forms
const createNoteForm = document.getElementById('createNoteForm');
const accessNoteForm = document.getElementById('accessNoteForm');
const savePdfForm = document.getElementById('savePdfForm');

// Error elements
const createNoteError = document.getElementById('createNoteError');
const accessNoteError = document.getElementById('accessNoteError');
const savePdfError = document.getElementById('savePdfError');

// Note display
const noteDisplay = document.getElementById('noteDisplay');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const noteInfo = document.getElementById('noteInfo');
const editNoteBtn = document.getElementById('editNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');

let currentNote = null;
let currentPdfData = null;
let currentRoomCode = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    welcomeUser.textContent = user.username;
    
    // Check if we're being called to save a PDF
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'save-pdf') {
        const pdfData = sessionStorage.getItem('pendingPdfData');
        const roomCode = sessionStorage.getItem('pendingRoomCode');
        if (pdfData && roomCode) {
            currentPdfData = pdfData;
            currentRoomCode = roomCode;
            document.getElementById('pdfTitle').value = `Chat Export - Room ${roomCode}`;
            openModal(savePdfModal);
            // Clear session storage
            sessionStorage.removeItem('pendingPdfData');
            sessionStorage.removeItem('pendingRoomCode');
        }
    }
});

// Modal handling
function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
    // Clear error messages
    const errorDiv = modal.querySelector('.bg-red-100');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
    }
    // Reset forms
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
}

// Event listeners
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
});

createNoteBtn.addEventListener('click', () => openModal(createNoteModal));
accessNoteBtn.addEventListener('click', () => openModal(accessNoteModal));

// Close modal handlers
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close')) {
        closeModal(e.target.closest('.fixed'));
    }
    if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        closeModal(e.target);
    }
});

// Create note
createNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(createNoteForm);
    const noteData = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/notes/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(noteData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Note created successfully! Note Code: ${data.note.noteCode}`);
            closeModal(createNoteModal);
            createNoteForm.reset();
        } else {
            showError(createNoteError, data.message);
        }
    } catch (error) {
        console.error('Note creation error:', error);
        showError(createNoteError, 'An error occurred while creating the note.');
    }
});

// Access note
accessNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(accessNoteForm);
    const accessData = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`/api/notes/${accessData.noteCode}/access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                primaryPassword: accessData.primaryPassword,
                secondaryPassword: accessData.secondaryPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentNote = data.note;
            displayNote(data.note);
            closeModal(accessNoteModal);
        } else {
            showError(accessNoteError, data.message);
        }
    } catch (error) {
        console.error('Note access error:', error);
        showError(accessNoteError, 'An error occurred while accessing the note.');
    }
});

// Save PDF
savePdfForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentPdfData) {
        showError(savePdfError, 'No PDF data to save.');
        return;
    }
    
    const formData = new FormData(savePdfForm);
    const saveData = Object.fromEntries(formData);
    saveData.pdfData = currentPdfData;
    saveData.roomCode = currentRoomCode;
    
    try {
        const response = await fetch('/api/notes/save-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(saveData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`PDF saved to notes successfully! Note Code: ${data.note.noteCode}`);
            closeModal(savePdfModal);
            currentPdfData = null;
            currentRoomCode = null;
        } else {
            showError(savePdfError, data.message);
        }
    } catch (error) {
        console.error('PDF save error:', error);
        showError(savePdfError, 'An error occurred while saving the PDF.');
    }
});

// Cancel PDF save
document.getElementById('cancelPdfSave').addEventListener('click', () => {
    closeModal(savePdfModal);
    currentPdfData = null;
    currentRoomCode = null;
});

// Display note
function displayNote(note) {
    noteTitle.textContent = note.title;
    document.getElementById('noteContent').textContent = note.content;
    noteInfo.textContent = `Code: ${note.noteCode} | Type: ${note.noteType.toUpperCase()} | Created: ${new Date(note.createdAt).toLocaleString()} | Updated: ${new Date(note.updatedAt).toLocaleString()}`;
    
    noteDisplay.classList.remove('hidden');
    
    // Scroll to note display
    noteDisplay.scrollIntoView({ behavior: 'smooth' });
}

// Edit note (placeholder for now)
editNoteBtn.addEventListener('click', () => {
    if (currentNote) {
        alert('Edit functionality coming soon! For now, you can create a new note with updated content.');
    }
});

// Delete note (placeholder for now)
deleteNoteBtn.addEventListener('click', () => {
    if (currentNote) {
        if (confirm(`Are you sure you want to delete the note "${currentNote.title}"? This cannot be undone.`)) {
            alert('Delete functionality coming soon! Please contact support if you need urgent deletion.');
        }
    }
});

// Helper function to show error messages
function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

// Global function to be called from room export
window.openSavePdfModal = function(pdfData, roomCode) {
    currentPdfData = pdfData;
    currentRoomCode = roomCode;
    document.getElementById('pdfTitle').value = `Chat Export - Room ${roomCode}`;
    openModal(savePdfModal);
};
