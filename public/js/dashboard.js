// Dashboard JavaScript

// Get authentication data and validate
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Simple authentication check for dashboard
if (!token) {
    window.location.href = '/';
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Socket.IO connection for real-time admission notifications
    const socket = io({
        auth: {
            token: token
        }
    });

    // Handle socket connection events
    socket.on('connect', () => {
        console.log('Connected to server for admission notifications');
    });

    socket.on('admissionResult', (data) => {
        if (data.username === user.username) {
            if (data.result === 'admitted') {
                hideJoinPendingStatus();
                showNotification('✅ You have been admitted to the room!', 'success');
                setTimeout(() => {
                    window.location.href = `/room/${data.roomCode}`;
                }, 1500);
            } else if (data.result === 'denied') {
                hideJoinPendingStatus();
                showNotification('❌ Your admission request was denied.', 'error');
            }
        }
    });

    socket.on('error', (data) => {
        console.error('Socket error:', data);
    });

// DOM Elements
const welcomeUser = document.getElementById('welcomeUser');
const logoutBtn = document.getElementById('logoutBtn');
const createInstantBtn = document.getElementById('createInstantBtn');
const createScheduledBtn = document.getElementById('createScheduledBtn');
const joinRoomForm = document.getElementById('joinRoomForm');
const myRoomsList = document.getElementById('myRoomsList');

// Modals
const instantRoomModal = document.getElementById('instantRoomModal');
const scheduledRoomModal = document.getElementById('scheduledRoomModal');
const joinRoomModal = document.getElementById('joinRoomModal');

// Forms
const instantRoomForm = document.getElementById('instantRoomForm');
const scheduledRoomForm = document.getElementById('scheduledRoomForm');
const joinRoomPasswordForm = document.getElementById('joinRoomPasswordForm');

// Error elements
const instantRoomError = document.getElementById('instantRoomError');
const scheduledRoomError = document.getElementById('scheduledRoomError');
const joinRoomError = document.getElementById('joinRoomError');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    welcomeUser.textContent = `Welcome, ${user.username}!`;
    loadMyRooms();
    
    // Check if there's a room code in the URL parameters (from shared link)
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('roomCode');
    
    if (roomCode) {
        // Pre-fill the room code input and automatically trigger join process
        document.getElementById('roomCode').value = roomCode.toUpperCase();
        
        // Automatically check if room exists and show password modal
        checkAndJoinRoom(roomCode.toUpperCase());
    }
});

// Function to check room and start join process
async function checkAndJoinRoom(roomCode) {
    try {
        const response = await fetch(`/api/rooms/${roomCode}/info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Room exists, show password modal automatically
            joinRoomPasswordForm.dataset.roomCode = roomCode;
            openModal(joinRoomModal);
        } else {
            alert(data.message || 'Room not found or not active');
        }
    } catch (error) {
        console.error('Room check error:', error);
        alert('Failed to check room. Please try again.');
    }
}

// Logout functionality
logoutBtn.addEventListener('click', async () => {
    try {
        // Call server logout endpoint
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear local storage and redirect (even if server call fails)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
        window.location.href = '/';
    }
});

// Simple logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    window.location.href = '/';
}

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

// Close modal handlers
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close')) {
        closeModal(e.target.closest('.fixed'));
    }
    if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        closeModal(e.target);
    }
});

// Create room buttons
createInstantBtn.addEventListener('click', () => {
    openModal(instantRoomModal);
});

createScheduledBtn.addEventListener('click', () => {
    openModal(scheduledRoomModal);
    // Set minimum datetime to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('scheduledTime').min = now.toISOString().slice(0, 16);
});

// Create instant room
instantRoomForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(instantRoomForm);
    const roomData = {
        name: formData.get('name'),
        description: formData.get('description'),
        primaryPassword: formData.get('primaryPassword'),
        secondaryPassword: formData.get('secondaryPassword'),
        admissionType: formData.get('admissionType')
    };
    
    try {
        const response = await fetch('/api/rooms/instant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(roomData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal(instantRoomModal);
            alert(`Room created successfully! Room Code: ${data.room.roomCode}`);
            loadMyRooms();
            // Navigate to room
            window.location.href = `/room/${data.room.roomCode}`;
        } else {
            showError(instantRoomError, data.message);
        }
    } catch (error) {
        console.error('Room creation error:', error);
        showError(instantRoomError, 'Failed to create room. Please try again.');
    }
});

// Create scheduled room
scheduledRoomForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(scheduledRoomForm);
    const roomData = {
        name: formData.get('name'),
        description: formData.get('description'),
        primaryPassword: formData.get('primaryPassword'),
        secondaryPassword: formData.get('secondaryPassword'),
        admissionType: formData.get('admissionType'),
        scheduledTime: formData.get('scheduledTime')
    };
    
    // Validate scheduled time
    const scheduledDate = new Date(roomData.scheduledTime);
    if (scheduledDate <= new Date()) {
        showError(scheduledRoomError, 'Scheduled time must be in the future.');
        return;
    }
    
    try {
        const response = await fetch('/api/rooms/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(roomData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal(scheduledRoomModal);
            alert(`Room scheduled successfully! Room Code: ${data.room.roomCode}\\nScheduled for: ${new Date(data.room.scheduledTime).toLocaleString()}`);
            loadMyRooms();
        } else {
            showError(scheduledRoomError, data.message);
        }
    } catch (error) {
        console.error('Room scheduling error:', error);
        showError(scheduledRoomError, 'Failed to schedule room. Please try again.');
    }
});

// Join room form
joinRoomForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomCode = document.getElementById('roomCode').value.toUpperCase();
    
    if (roomCode.length !== 6) {
        alert('Room code must be exactly 6 characters.');
        return;
    }
    
    // Use the same function for manual joins
    await checkAndJoinRoom(roomCode);
});

// Join room with password
joinRoomPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(joinRoomPasswordForm);
    const joinData = {
        primaryPassword: formData.get('primaryPassword'),
        secondaryPassword: formData.get('secondaryPassword')
    };
    
    const roomCode = joinRoomPasswordForm.dataset.roomCode;
    
    try {
        const response = await fetch(`/api/rooms/${roomCode}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(joinData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.status === 'joined') {
                closeModal(joinRoomModal);
                window.location.href = `/room/${roomCode}`;
            } else if (data.status === 'pending') {
                closeModal(joinRoomModal);
                showJoinPendingStatus(roomCode, data.message);
            }
        } else {
            showError(joinRoomError, data.message);
        }
    } catch (error) {
        console.error('Join room error:', error);
        showError(joinRoomError, 'Failed to join room. Please try again.');
    }
});

// Load user's rooms
async function loadMyRooms() {
    try {
        // This would need to be implemented in the backend
        // For now, we'll show a placeholder
        myRoomsList.innerHTML = `
            <div class="bg-gray-100 border-2 border-black p-4" style="box-shadow: 2px 2px 0px 0px #000000;">
                <h4 class="font-bold uppercase tracking-wide text-sm">No rooms yet</h4>
                <p class="text-xs text-gray-600 font-mono mt-1">Create your first room to get started!</p>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load rooms:', error);
        myRoomsList.innerHTML = `
            <div class="bg-red-100 border-2 border-red-500 p-4 text-red-800" style="box-shadow: 2px 2px 0px 0px #dc2626;">
                <p class="font-mono text-sm">Failed to load rooms.</p>
            </div>
        `;
    }
}

// Helper function to show error messages
function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

// Show pending join status
function showJoinPendingStatus(roomCode, message) {
    // Create or update pending status element
    let pendingElement = document.getElementById('joinPendingStatus');
    if (!pendingElement) {
        pendingElement = document.createElement('div');
        pendingElement.id = 'joinPendingStatus';
        pendingElement.className = 'fixed top-4 right-4 bg-yellow-100 border-2 border-yellow-600 p-4 z-50';
        pendingElement.style.cssText = 'box-shadow: 4px 4px 0px 0px #d97706; max-width: 300px;';
        document.body.appendChild(pendingElement);
    }
    
    pendingElement.innerHTML = `
        <div class="flex items-center justify-between">
            <div>
                <h4 class="font-bold text-sm uppercase tracking-wide text-yellow-800">Join Request Pending</h4>
                <p class="text-xs text-yellow-700 font-mono mt-1">Room: ${roomCode}</p>
                <p class="text-xs text-yellow-700 mt-1">${message}</p>
                <div class="flex items-center mt-2">
                    <div class="animate-spin rounded-full h-3 w-3 border-2 border-yellow-600 border-t-transparent mr-2"></div>
                    <span class="text-xs text-yellow-700">Waiting for approval...</span>
                </div>
            </div>
            <button onclick="hideJoinPendingStatus()" class="ml-4 text-yellow-800 hover:text-yellow-900 font-bold">×</button>
        </div>
    `;
    
    pendingElement.classList.remove('hidden');
}

// Hide pending join status
function hideJoinPendingStatus() {
    const pendingElement = document.getElementById('joinPendingStatus');
    if (pendingElement) {
        pendingElement.remove();
    }
}

// Global function for hiding pending status (called from onclick)
window.hideJoinPendingStatus = hideJoinPendingStatus;

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 z-50 border-2 border-black font-bold text-sm uppercase tracking-wide transition-all duration-300`;
    
    if (type === 'success') {
        notification.classList.add('bg-green-100', 'text-green-800', 'border-green-600');
        notification.style.boxShadow = '4px 4px 0px 0px #16a34a';
    } else if (type === 'error') {
        notification.classList.add('bg-red-100', 'text-red-800', 'border-red-600');
        notification.style.boxShadow = '4px 4px 0px 0px #dc2626';
    } else {
        notification.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-600');
        notification.style.boxShadow = '4px 4px 0px 0px #2563eb';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Closing brace for DOMContentLoaded event
});
