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
const myNotesBtn = document.getElementById('myNotesBtn');

// Modals
const createNoteModal = document.getElementById('createNoteModal');
const accessNoteModal = document.getElementById('accessNoteModal');
const savePdfModal = document.getElementById('savePdfModal');
const myNotesModal = document.getElementById('myNotesModal');

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

// Toast Notification System
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    toast.className = `toast toast-${type}`;
    toast.style.pointerEvents = 'auto';
    toast.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="font-bold font-mono text-sm">${message}</span>
            <button class="toast-close-btn ml-4 text-xl font-black hover:scale-110 transition-transform">×</button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add close button event listener
    toast.querySelector('.toast-close-btn').addEventListener('click', function() {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

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
    showToast('Logged out successfully!', 'success');
    setTimeout(() => window.location.href = '/', 1000);
});

createNoteBtn.addEventListener('click', () => openModal(createNoteModal));
accessNoteBtn.addEventListener('click', () => openModal(accessNoteModal));
myNotesBtn.addEventListener('click', () => {
    openModal(myNotesModal);
    loadMyNotes();
});

// Close modal handlers
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close')) {
        closeModal(e.target.closest('.fixed'));
    }
    if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        closeModal(e.target);
    }
});

// Load my notes
async function loadMyNotes() {
    const container = document.getElementById('notesListContainer');
    container.innerHTML = '<div class="text-center text-gray-500 py-8 font-mono">Loading notes...</div>';
    
    try {
        const response = await fetch('/api/notes/my-notes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.notes.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">📝</div>
                        <p class="text-gray-500 font-mono">No notes yet. Create your first note!</p>
                    </div>
                `;
            } else {
                container.innerHTML = data.notes.map(note => `
                    <div class="bg-white border-3 border-black p-4 hover:bg-gray-50 transition-colors duration-200" style="box-shadow: 4px 4px 0px 0px #000000;">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h4 class="font-black text-lg uppercase tracking-tight mb-1">${escapeHtml(note.title)}</h4>
                                <div class="flex gap-4 text-xs text-gray-600 font-mono">
                                    <span>📋 ${note.noteCode}</span>
                                    <span>📄 ${note.noteType.toUpperCase()}</span>
                                    <span>📅 ${new Date(note.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <button data-note-code="${note.noteCode}" class="quick-access-btn btn-brutal px-4 py-2 bg-black text-white border-2 border-black font-bold uppercase tracking-wide text-xs">
                                Open
                            </button>
                        </div>
                    </div>
                `).join('');
                
                // Add event listeners to all quick access buttons
                document.querySelectorAll('.quick-access-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const noteCode = this.getAttribute('data-note-code');
                        quickAccessNote(noteCode);
                    });
                });
            }
        } else {
            container.innerHTML = `<div class="text-center text-red-500 py-8 font-mono">${data.message}</div>`;
        }
    } catch (error) {
        console.error('Load notes error:', error);
        container.innerHTML = '<div class="text-center text-red-500 py-8 font-mono">Failed to load notes</div>';
    }
}

// Quick access note from list
function quickAccessNote(noteCode) {
    closeModal(myNotesModal);
    document.getElementById('accessNoteCode').value = noteCode;
    openModal(accessNoteModal);
}

// Create note
createNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(createNoteForm);
    const noteData = Object.fromEntries(formData);
    
    const submitBtn = createNoteForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    
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
            showToast(`Note created! Code: ${data.note.noteCode}`, 'success');
            closeModal(createNoteModal);
            createNoteForm.reset();
        } else {
            showError(createNoteError, data.message);
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Note creation error:', error);
        const errorMsg = 'An error occurred while creating the note.';
        showError(createNoteError, errorMsg);
        showToast(errorMsg, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Note';
    }
});

// Access note
accessNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(accessNoteForm);
    const accessData = Object.fromEntries(formData);
    
    const submitBtn = accessNoteForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Accessing...';
    
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
            const source = data.source === 'cache' ? ' (from cache ⚡)' : ' (from database)';
            showToast(`Note accessed successfully${source}`, 'success');
        } else {
            showError(accessNoteError, data.message);
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Note access error:', error);
        const errorMsg = 'An error occurred while accessing the note.';
        showError(accessNoteError, errorMsg);
        showToast(errorMsg, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Access Note';
    }
});

// Save PDF
savePdfForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentPdfData) {
        const errorMsg = 'No PDF data to save.';
        showError(savePdfError, errorMsg);
        showToast(errorMsg, 'error');
        return;
    }
    
    const formData = new FormData(savePdfForm);
    const saveData = Object.fromEntries(formData);
    saveData.pdfData = currentPdfData;
    saveData.roomCode = currentRoomCode;
    
    const submitBtn = savePdfForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
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
            showToast(`PDF saved to notes! Code: ${data.note.noteCode}`, 'success');
            closeModal(savePdfModal);
            currentPdfData = null;
            currentRoomCode = null;
        } else {
            showError(savePdfError, data.message);
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('PDF save error:', error);
        const errorMsg = 'An error occurred while saving the PDF.';
        showError(savePdfError, errorMsg);
        showToast(errorMsg, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save PDF';
    }
});

// Cancel PDF save
document.getElementById('cancelPdfSave').addEventListener('click', () => {
    closeModal(savePdfModal);
    currentPdfData = null;
    currentRoomCode = null;
    showToast('PDF save cancelled', 'info');
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
        showToast('Edit functionality coming soon!', 'info');
    }
});

// Delete note (placeholder for now)
deleteNoteBtn.addEventListener('click', () => {
    if (currentNote) {
        showToast('Delete functionality coming soon!', 'info');
    }
});

// Helper function to show error messages
function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global function to be called from room export
window.openSavePdfModal = function(pdfData, roomCode) {
    currentPdfData = pdfData;
    currentRoomCode = roomCode;
    document.getElementById('pdfTitle').value = `Chat Export - Room ${roomCode}`;
    openModal(savePdfModal);
};
